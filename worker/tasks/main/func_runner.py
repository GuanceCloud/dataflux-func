# -*- coding: utf-8 -*-

'''
脚本执行处理任务
主要用于直接调用函数、通过授权链接调用函数、Crontab 触发调用函数
'''

# Built-in Modules
import time
import traceback
import pprint

# 3rd-party Modules
import celery.states as celery_status
import six
import simplejson as json

# Project Modules
from worker.app import app
from worker.utils import toolkit, yaml_resources
from worker.tasks import gen_task_id, webhook
from worker.tasks import BaseResultSavingTask

# Current Module
from worker.tasks import BaseTask
from worker.tasks.main import NotFoundException
from worker.tasks.main import ScriptBaseTask
from worker.tasks.main import BaseFuncResponse, FuncResponse, FuncResponseLargeData

CONFIG = yaml_resources.get('CONFIG')

@app.task(name='Biz.FuncRunner.Result', bind=True, base=BaseResultSavingTask, ignore_result=True)
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

class FuncRunnerTask(ScriptBaseTask):
    '''
    由于绝大部分的调用都直接返回给前端，
    因此只要保存失败案例即可。
    '''
    # Specify the success/failure result saving task
    # _success_result_saving_task = result_saving_task
    # _failure_result_saving_task = result_saving_task

    def cache_running_info(self, func_id, script_publish_version, exec_mode=None, is_failed=False, cost=None):
        timestamp = int(time.time())

        # 全局计数
        data = {
            'funcId'              : func_id,
            'scriptPublishVersion': script_publish_version,
            'execMode'            : exec_mode,
            'isFailed'            : is_failed,
            'cost'                : cost,
            'timestamp'           : timestamp,
        }
        data = toolkit.json_dumps(data, indent=0)

        cache_key = toolkit.get_cache_key('syncCache', 'scriptRunningInfo')
        self.cache_db.lpush(cache_key, data)

        # 函数调用记数
        data = {
            'funcId'   : func_id,
            'timestamp': timestamp,
        }
        data = toolkit.json_dumps(data, indent=0)

        cache_key = toolkit.get_cache_key('syncCache', 'funcCallInfo')
        self.cache_db.lpush(cache_key, data)

    def cache_task_info(self, origin, origin_id, exec_mode, status, trigger_time_ms, start_time_ms,
            root_task_id=None, func_id=None, func_call_kwargs=None,
            log_messages=None, einfo_text=None, edump_text=None,
            task_info_limit=None):
        if not all([origin, origin_id]):
            return

        if isinstance(task_info_limit, (int, float)) and task_info_limit <= 0:
            return

        # 记录本地数据库
        data = {
            'id'            : self.request.id,
            'origin'        : origin,
            'originId'      : origin_id,
            'rootTaskId'    : root_task_id,
            'funcId'        : func_id,
            'funcCallKwargs': func_call_kwargs,
            'execMode'      : exec_mode,
            'status'        : status,
            'triggerTimeMs' : trigger_time_ms,
            'startTimeMs'   : start_time_ms,
            'endTimeMs'     : int(time.time() * 1000),
            'taskInfoLimit' : task_info_limit,
            'queue'         : str(self.queue),
        }

        if log_messages:
            log_messages_reduced = [toolkit.limit_text(l, CONFIG['_TASK_INFO_LOG_MESSAGE_LINE_LIMIT'], show_length=True) for l in log_messages]
            data['logMessageTEXT'] = '\n'.join(log_messages_reduced).strip()

            log_message_text_len = len(data['logMessageTEXT'])
            if log_message_text_len > CONFIG['_TASK_INFO_LOG_MESSAGE_TOTAL_LIMIT_HEAD'] + CONFIG['_TASK_INFO_LOG_MESSAGE_TOTAL_LIMIT_TAIL']:
                data['logMessageTEXT'] = '\n'.join([
                        f"!!! Log content too long, only FIRST {CONFIG['_TASK_INFO_LOG_MESSAGE_TOTAL_LIMIT_HEAD']} chars and LAST {CONFIG['_TASK_INFO_LOG_MESSAGE_TOTAL_LIMIT_TAIL']} are saved !!!",
                        '',
                        data['logMessageTEXT'][:CONFIG['_TASK_INFO_LOG_MESSAGE_TOTAL_LIMIT_HEAD']] + '...',
                        '',
                        f"<skipped {log_message_text_len - CONFIG['_TASK_INFO_LOG_MESSAGE_TOTAL_LIMIT_HEAD'] - CONFIG['_TASK_INFO_LOG_MESSAGE_TOTAL_LIMIT_TAIL']} chars>",
                        '',
                        '...' + data['logMessageTEXT'][-CONFIG['_TASK_INFO_LOG_MESSAGE_TOTAL_LIMIT_TAIL']:],
                    ])

        if einfo_text:
            data['einfoTEXT'] = einfo_text

        if edump_text:
            data['edumpTEXT'] = edump_text

        data = toolkit.json_dumps(data, indent=0)
        cache_key = toolkit.get_cache_key('syncCache', 'taskInfoBuffer')
        self.cache_db.run('lpush', cache_key, data)

        # 上传到观测云
        end_time_ms = int(time.time() * 1000)

        full_log_message = '\n'.join(log_messages)
        if einfo_text:
            full_log_message = '\n'.join([ full_log_message, ' Stack '.center(30, '-'), einfo_text])
        if edump_text:
            full_log_message = '\n'.join([ full_log_message, ' Error '.center(30, '-'), edump_text])

        guance_points = [{
            'measurement': 'DFF_func_log',
            'tags': {
                'workspace_uuid'  : func_call_kwargs.get('workspace_uuid') or 'NONE',
                'task_id'         : self.request.id,
                'origin'          : origin,
                'origin_id'       : origin_id,
                'root_task_id'    : root_task_id,
                'func_id'         : func_id,
                'func_call_kwargs': toolkit.json_dumps(func_call_kwargs),
                'exec_mode'       : exec_mode,
                'status'          : status,
                'trigger_time_cn' : toolkit.to_cn_time_str(trigger_time_ms),
                'start_time_cn'   : toolkit.to_cn_time_str(start_time_ms),
                'end_time_cn'     : toolkit.to_cn_time_str(end_time_ms),
                'queue'           : self.queue,
            },
            'fields': {
                'wait_cost' : start_time_ms - trigger_time_ms,
                'run_cost'  : end_time_ms   - start_time_ms,
                'total_cost': end_time_ms   - trigger_time_ms,
                'message'   : full_log_message,
            },
            'timestamp': trigger_time_ms,
        }]
        self.report_guance_points('logging', guance_points)

    def cache_func_result(self, func_id, script_code_md5, script_publish_version, func_call_kwargs_md5, result, cache_result_expires):
        if not all([func_id, script_code_md5, script_publish_version, func_call_kwargs_md5, cache_result_expires]):
            return

        cache_key = toolkit.get_cache_key('cache', 'funcResult', tags=[
            'funcId'              , func_id,
            'scriptCodeMD5'       , script_code_md5,
            'scriptPublishVersion', script_publish_version,
            'funcCallKwargsMD5'   , func_call_kwargs_md5])

        result_dumps = toolkit.json_dumps(result)
        self.cache_db.setex(cache_key, cache_result_expires, result_dumps)

@app.task(name='Biz.FuncRunner', bind=True, base=FuncRunnerTask, ignore_result=True)
def func_runner(self, *args, **kwargs):
    # 执行函数、参数
    func_id              = kwargs.get('funcId')
    func_call_kwargs     = kwargs.get('funcCallKwargs') or {}
    func_call_kwargs_md5 = kwargs.get('funcCallKwargsMD5')

    script_set_id = func_id.split('__')[0]
    script_id     = func_id.split('.')[0]
    func_name     = func_id[len(script_id) + 1:]

    self.logger.info('Biz.FuncRunner Task launched: `{}`'.format(func_id))

    # 任务来源
    origin    = kwargs.get('origin')
    origin_id = kwargs.get('originId')

    # 任务记录数
    task_info_limit = kwargs.get('taskInfoLimit')

    # 任务 ID
    task_id      = self.request.id
    root_task_id = kwargs.get('rootTaskId') or 'ROOT'

    # 函数链
    func_chain = kwargs.get('funcChain') or []
    func_chain.append(func_id)

    # 执行模式
    exec_mode = kwargs.get('execMode') or 'sync'

    # 启动时间
    start_time    = int(time.time())
    start_time_ms = int(time.time() * 1000)

    # 触发时间
    trigger_time    = kwargs.get('triggerTime')   or start_time
    trigger_time_ms = kwargs.get('triggerTimeMs') or start_time_ms

    # HTTP请求
    http_request = kwargs.get('httpRequest') or {}
    if 'headers' in http_request:
        http_request['headers'] = toolkit.IgnoreCaseDict(http_request['headers'])

    # 是否缓存函数运行结果
    cache_result_expires = None

    # 是否保存结果
    save_result = kwargs.get('saveResult') or False

    # 函数结果、上下文、跟踪信息、错误堆栈
    func_resp    = None
    script_scope = None
    log_messages = None
    trace_info   = None
    einfo_text   = None
    edump_text   = None

    # 被强行Kill时，不会进入except范围，所以默认制定为"failure"
    end_status = 'failure'

    ### 任务开始
    target_script = None
    try:
        # 获取脚本
        target_script = self.load_script(script_id)

        if not target_script:
            e = NotFoundException('Script `{}` not found'.format(script_id))
            raise e

        extra_vars = {
            '_DFF_DEBUG'          : False,
            '_DFF_TASK_ID'        : task_id,
            '_DFF_ROOT_TASK_ID'   : root_task_id,
            '_DFF_SCRIPT_SET_ID'  : script_set_id,
            '_DFF_SCRIPT_ID'      : script_id,
            '_DFF_FUNC_ID'        : func_id,
            '_DFF_FUNC_NAME'      : func_name,
            '_DFF_FUNC_CHAIN'     : func_chain,
            '_DFF_ORIGIN'         : origin,
            '_DFF_ORIGIN_ID'      : origin_id,
            '_DFF_EXEC_MODE'      : exec_mode,
            '_DFF_START_TIME'     : start_time,
            '_DFF_START_TIME_MS'  : start_time_ms,
            '_DFF_TRIGGER_TIME'   : trigger_time,
            '_DFF_TRIGGER_TIME_MS': trigger_time_ms,
            '_DFF_CRONTAB'        : kwargs.get('crontab'),
            '_DFF_CRONTAB_DELAY'  : kwargs.get('crontabDelay'),
            '_DFF_QUEUE'          : self.queue,
            '_DFF_WORKER_QUEUE'   : self.worker_queue,
            '_DFF_HTTP_REQUEST'   : http_request,
        }
        script_scope = self.create_safe_scope(script_id, extra_vars=extra_vars)

        # 加载入口脚本
        self.logger.info('[ENTRY SCRIPT] `{}`'.format(script_id))
        script_scope = self.safe_exec(target_script['codeObj'], globals=script_scope)

        # 执行脚本
        entry_func = script_scope.get(func_name)
        if not entry_func:
            e = NotFoundException('Function `{}` not found in `{}`'.format(func_name, script_id))
            raise e

        # 执行函数
        self.logger.info('[RUN FUNC] `{}`'.format(func_id))
        func_resp = entry_func(**func_call_kwargs)
        if not isinstance(func_resp, BaseFuncResponse):
            func_resp = FuncResponse(func_resp)

        if isinstance(func_resp.data, Exception):
            raise func_resp.data

        # 获取函数结果缓存配置
        try:
            cache_result_expires = target_script['funcExtraConfig'][func_id]['cacheResult']
        except (KeyError, TypeError) as e:
            pass

        # 响应大型数据，根据是否开启缓存函数运行结果区分处理
        if isinstance(func_resp, FuncResponseLargeData):
            if cache_result_expires is None:
                # 未开启缓存，默认方式缓存为文件
                func_resp.cache_to_file(auto_delete=True)
            else:
                # 开启缓存，则指定缓存时间
                func_resp.cache_to_file(auto_delete=False, cache_expires=cache_result_expires)

    except Exception as e:
        for line in traceback.format_exc().splitlines():
            self.logger.error(line)

        end_status = 'failure'

        self.logger.error('Error occured in script. `{}`'.format(func_id))

        trace_info = self.get_trace_info()
        einfo_text = self.get_formated_einfo(trace_info, only_in_script=True)
        edump_text = trace_info.get('exceptionDump')

        raise

    else:
        end_status = 'success'

        # 准备函数运行结果
        func_result_raw        = None
        func_result_repr       = None
        func_result_json_dumps = None

        if func_resp.data is not None:
            try:
                func_result_raw = func_resp.data
            except Exception as e:
                for line in traceback.format_exc().splitlines():
                    self.logger.error(line)

            try:
                func_result_repr = pprint.saferepr(func_resp.data)
            except Exception as e:
                for line in traceback.format_exc().splitlines():
                    self.logger.error(line)

            try:
                func_result_json_dumps = toolkit.json_dumps(func_resp.data)
            except Exception as e:
                for line in traceback.format_exc().splitlines():
                    self.logger.error(line)

        result = {
            'raw'      : func_result_raw,
            'repr'     : func_result_repr,
            'jsonDumps': func_result_json_dumps,

            '_responseControl': func_resp.make_response_control()
        }

        # 记录函数运行结果
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

        # 缓存函数运行结果
        if cache_result_expires:
            self.cache_func_result(
                func_id=func_id,
                script_code_md5=target_script['codeMD5'],
                script_publish_version=target_script['publishVersion'],
                func_call_kwargs_md5=func_call_kwargs_md5,
                result=result,
                cache_result_expires=cache_result_expires)

        # 返回函数结果
        return result

    finally:
        # Crontab解锁
        lock_key   = kwargs.get('lockKey')
        lock_value = kwargs.get('lockValue')
        if lock_key and lock_value:
            self.cache_db.unlock(lock_key, lock_value)

        # 记录脚本日志
        if script_scope:
            log_messages = script_scope['DFF'].log_messages or None

        # 记录函数运行故障
        if end_status == 'failure':
            trace_info = trace_info or self.get_trace_info()
            einfo_text = einfo_text or self.get_formated_einfo(trace_info, only_in_script=True)

        # 记录函数运行信息
        self.cache_running_info(
            func_id=func_id,
            script_publish_version=target_script['publishVersion'],
            exec_mode=exec_mode,
            is_failed=(end_status == 'failure'),
            cost=int(time.time() * 1000) - start_time_ms)

        # 缓存任务状态
        self.cache_task_info(
            origin=origin,
            origin_id=origin_id,
            exec_mode=exec_mode,
            status=end_status,
            trigger_time_ms=trigger_time_ms,
            start_time_ms=start_time_ms,
            root_task_id=root_task_id,
            func_id=func_id,
            func_call_kwargs=func_call_kwargs,
            log_messages=log_messages,
            einfo_text=einfo_text,
            edump_text=edump_text,
            task_info_limit=task_info_limit)

        # 清理资源
        self.clean_up()
