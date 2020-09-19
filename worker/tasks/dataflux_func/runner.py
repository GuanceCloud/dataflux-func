# -*- coding: utf-8 -*-

'''
脚本执行处理任务
主要用于直接调用函数、通过授权链接调用函数、Crontab触发调用函数
'''

# Builtin Modules
import time
import json
import traceback
import pprint

# 3rd-party Modules
from celery.exceptions import SoftTimeLimitExceeded
import celery.states as celery_status
import six
import ujson

# Project Modules
from worker import app
from worker.utils import toolkit, yaml_resources
from worker.tasks import gen_task_id, webhook
from worker.tasks import BaseResultSavingTask

# Current Module
from worker.tasks import BaseTask
from worker.tasks.dataflux_func import DataFluxFuncBaseException, ScriptNotFoundException, FunctionNotFoundException
from worker.tasks.dataflux_func import ScriptBaseTask

CONFIG = yaml_resources.get('CONFIG')

SCRIPTS_CACHE_MD5       = None
SCRIPTS_CACHE_TIMESTAMP = 0
SCRIPT_DICT_CACHE       = None

@app.task(name='DataFluxFunc.runner.result', bind=True, base=BaseResultSavingTask, ignore_result=True)
def result_saving_task(self, task_id, name, origin, start_time, end_time, args, kwargs, retval, status, einfo_text):
    options = kwargs or {}

    '''
    Result saving task
    '''
    args_json   = self.db.dump_for_json(args)
    kwargs_json = self.db.dump_for_json(kwargs)
    retval_json = self.db.dump_for_json(retval)

    sql = '''
        INSERT INTO biz_main_task_result_dataflux_func
        SET
             id         = ?
            ,task       = ?
            ,origin     = ?
            ,startTime  = ?
            ,endTime    = ?
            ,argsJSON   = ?
            ,kwargsJSON = ?
            ,retvalJSON = ?
            ,status     = ?
            ,einfoTEXT  = ?
        '''
    sql_params = (task_id, name, origin, start_time, end_time, args_json, kwargs_json, retval_json, status, einfo_text)
    self.db.query(sql, sql_params)

class DataFluxFuncRunnerTask(ScriptBaseTask):
    '''
    由于绝大部分的调用都直接返回给前端，
    因此只要保存失败案例即可。
    '''
    # Specify the success/failure result saving task
    # _success_result_saving_task = result_saving_task
    # _failure_result_saving_task = result_saving_task

    def update_script_dict_cache(self):
        '''
        更新脚本字典缓存
        与 DataFluxFuncReloadScriptsTask 配合完成高速脚本加载处理
        具体如下：
            1. 从本地内存中获取缓存时间，未超时直接结束
            2. 从Redis检查当前脚本缓存MD5值
            2.1. 如未改变，则延长缓存时间并结束
            2.2. 如已改变，则从Redis中获取脚本缓存数据
            3. 如Redis中无脚本缓存数据，则直接从数据库中获取数据
              （正常不会发生，DataFluxFuncReloadScriptsTask 会定时更新Redis缓存）
        '''
        global SCRIPTS_CACHE_MD5
        global SCRIPTS_CACHE_TIMESTAMP
        global SCRIPT_DICT_CACHE

        current_timestamp = time.time()

        cache_key_script_md5  = toolkit.get_cache_key('fixedCache', 'scriptsMD5')
        cache_key_script_dump = toolkit.get_cache_key('fixedCache', 'scriptsDump')

        # 1. 尝试使用本地缓存，不检查数据更新
        if current_timestamp - SCRIPTS_CACHE_TIMESTAMP < CONFIG['_FUNC_TASK_LOCAL_CACHE_EXPIRES']:
            # 处于保留期内，跳过
            self.logger.debug('[SCRIPT CACHE] Use local cache')
            return

        # 2. 检查Redis缓存
        scripts_md5 = self.cache_db.get(cache_key_script_md5)
        if scripts_md5:
            scripts_md5 = six.ensure_str(scripts_md5)

        scripts_dump_exists = self.cache_db.exists(cache_key_script_dump)

        if scripts_md5 and scripts_md5 == SCRIPTS_CACHE_MD5 and scripts_dump_exists:
            # 存在缓存，且MD5未发生变化，延长本地缓存
            SCRIPTS_CACHE_TIMESTAMP = current_timestamp

            self.logger.debug('[SCRIPT CACHE] Not Modified, extend local cache')
            return

        # 3. 不存在缓存/缓存MD5发生变化，从Redis读取Dump
        scripts = None

        scripts_dump = self.cache_db.get(cache_key_script_dump)
        if scripts_dump:
            self.logger.debug('[SCRIPT CACHE] Modified, Use Redis cache')

            scripts_dump = six.ensure_str(scripts_dump)

            try:
                scripts = ujson.loads(scripts_dump)
            except Exception as e:
                pass

            if not scripts_md5:
                # 不存在缓存，自行计算（极少情况）
                scripts_md5 = toolkit.get_md5(scripts_dump)

            # 记录缓存MD5
            SCRIPTS_CACHE_MD5 = scripts_md5

        # 4. 未能从Redis读取Dump，从数据库获取完整用户脚本
        if not scripts or not scripts_dump:
            self.logger.warning('[SCRIPT CACHE] Cache failed! Use DB data')

            scripts = self.get_scripts()

            # 自行计算并记录缓存MD5
            scripts_dump      = toolkit.json_safe_dumps(scripts, sort_keys=True)
            SCRIPTS_CACHE_MD5 = toolkit.get_md5(scripts_dump)

        # 记录到本地缓存
        SCRIPTS_CACHE_TIMESTAMP = current_timestamp
        SCRIPT_DICT_CACHE       = self.create_script_dict(scripts)

    def cache_script_running_info(self, func_id, script_publish_version, exec_mode=None, is_failed=False, cost=None):
        cache_key = toolkit.get_cache_key('syncCache', 'scriptRunningInfo')

        data = {
            'funcId'              : func_id,
            'scriptPublishVersion': script_publish_version,
            'execMode'            : exec_mode,
            'isFailed'            : is_failed,
            'cost'                : cost,
            'timestamp'           : int(time.time()),
        }
        data = toolkit.json_safe_dumps(data, indent=0)

        self.cache_db.run('lpush', cache_key, data)

    def cache_script_failure(self, func_id, script_publish_version, exec_mode=None, einfo_text=None, trace_info=None):
        if not einfo_text:
            return

        cache_key = toolkit.get_cache_key('syncCache', 'scriptFailure')

        data = {
            'funcId'              : func_id,
            'scriptPublishVersion': script_publish_version,
            'execMode'            : exec_mode,
            'einfoTEXT'           : einfo_text,
            'traceInfo'           : trace_info,
            'timestamp'           : int(time.time()),
        }
        data = toolkit.json_safe_dumps(data, indent=0)

        self.cache_db.run('lpush', cache_key, data)

    def cache_script_log(self, func_id, script_publish_version, log_messages, exec_mode=None):
        if not log_messages:
            return

        cache_key = toolkit.get_cache_key('syncCache', 'scriptLog')

        data                      = {
            'funcId'              : func_id,
            'scriptPublishVersion': script_publish_version,
            'execMode'            : exec_mode,
            'logMessages'         : log_messages,
            'timestamp'           : int(time.time()),
        }
        data = toolkit.json_safe_dumps(data, indent=0)

        self.cache_db.run('lpush', cache_key, data)

    def cache_task_status(self, origin, origin_id, status, func_id=None, script_publish_version=None, log_messages=None, einfo_text=None):
        if not all([origin, origin_id]):
            return

        if origin not in ('crontab', 'batch'):
            return

        cache_key = toolkit.get_cache_key('syncCache', 'taskInfo')

        data = {
            'taskId'              : self.request.id,
            'origin'              : origin,
            'originId'            : origin_id,
            'funcId'              : func_id,
            'scriptPublishVersion': script_publish_version,
            'status'              : status,
            'logMessages'         : log_messages,
            'einfoTEXT'           : einfo_text,
            'timestamp'           : int(time.time()),
        }
        data = toolkit.json_safe_dumps(data, indent=0)

        self.cache_db.run('lpush', cache_key, data)

    def cache_func_result(self, func_id, script_code_md5, script_publish_version, func_call_kwargs, result, cache_result):
        if not cache_result:
            return

        func_call_kwargs_dumps = toolkit.json_safe_dumps(func_call_kwargs, indent=None, sort_keys=True, separators=(',', ':'))
        func_call_kwargs_md5   = toolkit.get_md5(func_call_kwargs_dumps)
        result_dumps           = toolkit.json_safe_dumps(result)

        cache_key = toolkit.get_cache_key('cache', 'funcResult', tags=[
            'funcId'              , func_id,
            'scriptCodeMD5'       , script_code_md5,
            'scriptPublishVersion', script_publish_version,
            'funcCallKwargsMD5'   , func_call_kwargs_md5])

        self.cache_db.setex(cache_key, cache_result, result_dumps)

@app.task(name='DataFluxFunc.runner', bind=True, base=DataFluxFuncRunnerTask, ignore_result=True,
    soft_time_limit=CONFIG['_FUNC_TASK_DEFAULT_TIMEOUT'],
    time_limit=CONFIG['_FUNC_TASK_DEFAULT_TIMEOUT'] + CONFIG['_FUNC_TASK_EXTRA_TIMEOUT_TO_KILL'])
def dataflux_func_runner(self, *args, **kwargs):
    # 执行函数、参数
    func_id          = kwargs.get('funcId')
    func_call_kwargs = kwargs.get('funcCallKwargs') or {}

    script_set_id = func_id.split('__')[0]
    script_id     = func_id.split('.')[0]
    func_name     = func_id[len(script_id) + 1:]

    self.logger.info('DataFluxFunc Runner Task launched: `{}`'.format(func_id))

    # 来源
    origin    = kwargs.get('origin')
    origin_id = kwargs.get('originId')

    # 记录任务信息（运行中）
    self.cache_task_status(origin, origin_id, 'pending',
            func_id=func_id)

    # 顶层任务ID
    root_task_id = kwargs.get('rootTaskId') or self.request.id

    # 函数链
    func_chain = kwargs.get('funcChain') or []
    func_chain.append(func_id)

    # 执行模式
    exec_mode = kwargs.get('execMode') or 'sync'

    # 启动时间
    start_time    = int(time.time())
    start_time_ms = int(time.time() * 1000)

    # 函数结果、上下文
    save_result = kwargs.get('saveResult') or False
    func_result  = None
    script_scope = None

    is_succeeded = False
    trace_info   = None
    log_messages = None
    einfo_text   = None

    target_script = None
    try:
        global SCRIPT_DICT_CACHE

        # 更新脚本缓存
        self.update_script_dict_cache()
        target_script = SCRIPT_DICT_CACHE.get(script_id)

        if not target_script:
            e = ScriptNotFoundException('Script `{}` not found'.format(script_id))
            raise e

        extra_vars = {
            '_DFF_is_debug'         : False,
            '_DFF_root_task_id'     : root_task_id,
            '_DFF_func_chain'       : func_chain,
            '_DFF_origin'           : origin,
            '_DFF_origin_id'        : origin_id,
            '_DFF_exec_mode'        : exec_mode,
            '_DFF_start_time'       : start_time,
            '_DFF_start_time_ms'    : start_time_ms,
            '_DFF_trigger_time'     : kwargs.get('triggerTime') or start_time,
            '_DFF_crontab'          : kwargs.get('crontab'),
            '_DFF_crontab_config_id': kwargs.get('crontabConfigId'),
        }
        self.logger.info('[CREATE SAFE SCOPE] `{}`'.format(script_id))
        script_scope = self.create_safe_scope(
                script_name=script_id,
                script_dict=SCRIPT_DICT_CACHE,
                extra_vars=extra_vars)

        # 加载代码
        self.logger.info('[LOAD SCRIPT] `{}`'.format(script_id))
        script_scope = self.safe_exec(target_script['codeObj'], globals=script_scope)

        # 执行脚本
        entry_func = script_scope.get(func_name)
        if not entry_func:
            e = FunctionNotFoundException('Function `{}` not found in `{}`'.format(func_name, script_id))
            raise e

        # 执行函数
        self.logger.info('[RUN FUNC] `{}`'.format(func_id))
        func_result = entry_func(**func_call_kwargs)

        self.cache_script_running_info(func_id, target_script['publishVersion'],
                exec_mode=exec_mode,
                cost=time.time() - start_time)

    # except SoftTimeLimitExceeded as e:
    except Exception as e:
        for line in traceback.format_exc().splitlines():
            self.logger.error(line)

        self.logger.error('Error occured in script. `{}`'.format(func_id))

        # 记录运行信息
        self.cache_script_running_info(func_id, target_script['publishVersion'],
                exec_mode=exec_mode,
                is_failed=True,
                cost=time.time() - start_time)

        # 记录运行故障
        trace_info = self.get_trace_info()
        einfo_text = self.get_formated_einfo(trace_info, only_in_script=True)
        self.cache_script_failure(func_id, target_script['publishVersion'],
                exec_mode=exec_mode, einfo_text=einfo_text, trace_info=trace_info)

        raise

    else:
        is_succeeded = True

        # 函数运行结果
        func_result_raw        = None
        func_result_repr       = None
        func_result_json_dumps = None

        try:
            func_result_raw = toolkit.json_safe_copy(func_result)
        except Exception as e:
            for line in traceback.format_exc().splitlines():
                self.logger.error(line)

        try:
            func_result_repr = pprint.saferepr(func_result)
        except Exception as e:
            for line in traceback.format_exc().splitlines():
                self.logger.error(line)

        try:
            func_result_json_dumps = toolkit.json_safe_dumps(func_result)
        except Exception as e:
            for line in traceback.format_exc().splitlines():
                self.logger.error(line)

        result = {
            'raw'      : func_result_raw,
            'repr'     : func_result_repr,
            'jsonDumps': func_result_json_dumps,
        }

        # 保存结果
        if save_result:
            args = (
                self.request.id,
                self.name,
                self.request.origin,
                self.request.x_start_time,
                int(time.time()),
                self.request.args,
                self.request.kwargs,
                result,
                celery_status.SUCCESS,
                None
            )
            result_task_id = '{}-RESULT'.format(self.request.id)
            result_saving_task.apply_async(task_id=result_task_id, args=args)

        # 缓存纯函数处理结果
        cache_result = None
        try:
            cache_result = target_script['funcExtraConfig'][func_id]['cacheResult']
        except (KeyError, TypeError) as e:
            pass
        else:
            self.cache_func_result(func_id, target_script['codeMD5'], target_script['publishVersion'], func_call_kwargs, result, cache_result)

        # 返回结果
        return result

    finally:
        if script_scope:
            # 记录输出日志（开启debug或函数执行失败时保留）
            if script_scope.get('_DFF_is_debug') or not is_succeeded:
                log_messages = script_scope['DFF'].log_messages or None
                self.cache_script_log(func_id, target_script['publishVersion'], log_messages,
                        exec_mode=exec_mode)

        # Crontab解锁
        lock_key   = kwargs.get('lockKey')
        lock_value = kwargs.get('lockValue')
        if lock_key and lock_value:
            self.cache_db.unlock(lock_key, lock_value)

        # 记录任务信息（结束）
        end_status = None
        if is_succeeded:
            end_status = 'success'
        else:
            end_status = 'failure'
        self.cache_task_status(origin, origin_id, end_status,
                func_id=func_id,
                script_publish_version=target_script['publishVersion'],
                log_messages=log_messages,
                einfo_text=einfo_text)

        # 清理资源
        self.clean_up()
