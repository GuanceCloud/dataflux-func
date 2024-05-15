# -*- coding: utf-8 -*-

'''
脚本执行处理任务
主要用于直接调用函数、通过授权链接调用函数、Crontab 触发调用函数
'''

# Built-in Modules
import pprint
import traceback

# 3rd-party Modules

# Project Modules
from worker.utils import toolkit, yaml_resources
from worker.tasks import PreviousTaskNotFinished
from worker.tasks.func import FuncBaseTask, BaseFuncResponse, FuncResponse, FuncResponseLargeData

CONFIG = yaml_resources.get('CONFIG')

class FuncRunner(FuncBaseTask):
    name = 'Func.Runner'

    # 函数任务默认不指定任务记录保留数量
    default_task_record_limit = None

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        self.__full_print_log_lines = None
        self.__reduced_print_logs   = None

    @property
    def return_value(self):
        if not self.result:
            return None

        return self.result['returnValue']

    @property
    def response_control(self):
        if not self.result:
            return None

        return self.result['responseControl']

    def __make_full_print_log_lines(self):
        # 完整 print 日志【目前】仅用于上传观测云
        # 同时，上传观测云时，日志会以行作为最小单位分割上传
        # 因此，此处保持数组，避免反复切割字符串
        lines = []
        if self.print_log_lines:
            lines.extend(self.print_log_lines)

        if self.traceback:
            lines.append(f'[Traceback]\n{self.traceback}')

        self.__full_print_log_lines = lines

    @property
    def full_print_log_lines(self):
        if self.script_scope is None:
            return None

        if not self.print_log_lines and not self.traceback:
            return None

        if not self.__full_print_log_lines:
            self.__make_full_print_log_lines()

        return self.__full_print_log_lines

    def __make_reduced_print_logs(self):
        lines = []
        for line in self.print_log_lines:
            lines.append(toolkit.limit_text(line, CONFIG['_TASK_RECORD_PRINT_LOG_LINE_LIMIT'], show_length=True))

        reduced_logs = '\n'.join(lines).strip()

        length = len(reduced_logs)
        if length > CONFIG['_TASK_RECORD_PRINT_LOG_TOTAL_LIMIT_HEAD'] + CONFIG['_TASK_RECORD_PRINT_LOG_TOTAL_LIMIT_TAIL']:
            reduce_tip = f"!!! Content too long, only FIRST {CONFIG['_TASK_RECORD_PRINT_LOG_TOTAL_LIMIT_HEAD']} chars and LAST {CONFIG['_TASK_RECORD_PRINT_LOG_TOTAL_LIMIT_TAIL']} are saved !!!"
            first_part = reduced_logs[:CONFIG['_TASK_RECORD_PRINT_LOG_TOTAL_LIMIT_HEAD']] + '...'
            skip_tip   = f"<skipped {length - CONFIG['_TASK_RECORD_PRINT_LOG_TOTAL_LIMIT_HEAD'] - CONFIG['_TASK_RECORD_PRINT_LOG_TOTAL_LIMIT_TAIL']} chars>"
            last_part  = '...' + reduced_logs[-CONFIG['_TASK_RECORD_PRINT_LOG_TOTAL_LIMIT_TAIL']:]
            reduced_logs = '\n\n'.join([ reduce_tip, first_part, skip_tip, last_part ])

        self.__reduced_print_logs = reduced_logs

    @property
    def reduced_print_logs(self):
        if self.script_scope is None:
            return None

        if not self.print_log_lines:
            return None

        if not self.__reduced_print_logs:
            self.__make_reduced_print_logs()

        return self.__reduced_print_logs

    def cache_recent_crontab_triggered(self):
        try:
            # 从缓存中获取上次记录
            cache_key = toolkit.get_global_cache_key('cache', 'recentTaskTriggered', [ 'origin', self.origin ])
            cache_value = self.cache_db.hget(cache_key, self.origin_id)
            if cache_value:
                cache_value = toolkit.json_loads(cache_value)

            if not isinstance(cache_value, dict):
                cache_value = {}

            # 解压缩
            for _exec_mode in list(cache_value.keys()):
                cache_value[_exec_mode] = toolkit.delta_of_delta_decode(toolkit.repeat_decode(cache_value[_exec_mode]))

            # 追加数据
            exec_mode = self.kwargs.get('crontabExecMode')
            if exec_mode not in cache_value:
                cache_value[exec_mode] = []

            cache_value[exec_mode].append(self.trigger_time)

            # 去除过期数据 / 压缩
            for _exec_mode in list(cache_value.keys()):
                cache_value[_exec_mode] = list(filter(lambda ts: ts > self.trigger_time - CONFIG['_RECENT_CRONTAB_TRIGGERED_EXPIRES'], cache_value[_exec_mode]))
                cache_value[_exec_mode] = toolkit.repeat_encode(toolkit.delta_of_delta_encode(cache_value[_exec_mode]))

            # 重新写入缓存
            self.cache_db.hset(cache_key, self.origin_id, toolkit.json_dumps(cache_value))

        except Exception as e:
            # 非重要功能
            for line in traceback.format_exc().splitlines():
                self.logger.warning(line)

            if CONFIG['MODE'] == 'dev':
                raise

    def cache_last_task_status(self, status, exception=None):
        if self.origin not in ( 'authLink', 'crontabConfig', 'batch'):
            return

        cache_key = toolkit.get_global_cache_key('cache', 'lastTaskStatus', [ 'origin', self.origin ])
        cache_value = {
            'status'   : status,
            'timestamp': int(self.trigger_time),
        }
        if exception:
            cache_value.update({
                'exceptionType': toolkit.exception_type(exception),
                'exceptionTEXT': toolkit.exception_text(exception),
            })

        self.cache_db.hset(cache_key, self.origin_id, toolkit.json_dumps(cache_value))

    # 完全重写父类方法
    def create_task_record_guance_data(self):
        if not self.guance_data_upload_url:
            return None

        data = {
            'measurement': CONFIG['_SELF_MONITOR_GUANCE_MEASUREMENT_TASK_RECORD_FUNC'],
            'tags': {
                'id'           : self.task_id,
                'name'         : self.name,
                'queue'        : str(self.queue),
                'task_status'  : self.status,
                'root_task_id' : self.root_task_id,
                'script_set_id': self.script_set_id,
                'script_id'    : self.script_id,
                'func_id'      : self.func_id,
                'origin'       : self.origin,
                'origin_id'    : self.origin_id,
            },
            'fields': {
                'message': self.full_print_log_lines,

                'func_call_kwargs': toolkit.json_dumps(self.func_call_kwargs),
                'crontab'         : self.kwargs.get('crontab'),
                'call_chain'      : toolkit.json_dumps(self.call_chain, keep_none=True),
                'return_value'    : toolkit.json_dumps(self.return_value, keep_none=True),
                'delay'           : self.delay,
                'timeout'         : self.timeout,
                'expires'         : self.expires,
                'ignore_result'   : self.ignore_result,
                'exception_type'  : self.exception_type,
                'exception'       : self.exception_text,
                'trigger_time_iso': self.trigger_time_iso,
                'start_time_iso'  : self.start_time_iso,
                'end_time_iso'    : self.end_time_iso,
                'wait_cost'       : self.wait_cost,
                'run_cost'        : self.run_cost,
                'total_cost'      : self.total_cost,
            },
            'timestamp': int(self.trigger_time),
        }

        # 用于观测云的额外信息
        data['tags'].update(self.extra_for_guance.tags)
        data['fields'].update(self.extra_for_guance.fields)

        return data

    def _buff_task_record_func(self):
        if not self.is_local_func_task_record_enabled:
            return

        data = {
            '_taskRecordLimit': self.task_record_limit,

            'id'                   : self.task_id,
            'rootTaskId'           : self.root_task_id,
            'scriptSetId'          : self.script_set_id,
            'scriptId'             : self.script_id,
            'funcId'               : self.func_id,
            'funcCallKwargsJSON'   : toolkit.json_dumps(self.func_call_kwargs),
            'origin'               : self.origin,
            'originId'             : self.origin_id,
            'crontab'              : self.kwargs.get('crontab'),
            'callChainJSON'        : toolkit.json_dumps(self.call_chain, keep_none   = True),
            'triggerTimeMs'        : self.trigger_time_ms,
            'startTimeMs'          : self.start_time_ms,
            'endTimeMs'            : self.end_time_ms,
            'delay'                : self.delay,
            'queue'                : self.queue,
            'timeout'              : self.timeout,
            'expires'              : self.expires,
            'ignoreResult'         : self.ignore_result,
            'status'               : self.status,
            'exceptionType'        : self.exception_type,
            'exceptionTEXT'        : self.exception_text,
            'tracebackTEXT'        : self.traceback,
            'nonCriticalErrorsTEXT': self.non_critical_errors,
            'printLogsTEXT'        : self.reduced_print_logs,
            'returnValueJSON'      : toolkit.json_dumps(self.return_value, keep_none = True),
            'responseControlJSON'  : toolkit.json_dumps(self.response_control, keep_none=True),
        }
        cache_key = toolkit.get_cache_key('dataBuffer', 'taskRecordFunc')
        self.cache_db.push(cache_key, toolkit.json_dumps(data))

    def _buff_func_call_count(self):
        data = {
            'scriptSetId': self.script_set_id,
            'scriptId'   : self.script_id,
            'funcId'     : self.func_id,
            'origin'     : self.origin,
            'queue'      : str(self.queue),
            'status'     : self.status,
            'timestamp'  : int(self.trigger_time),
            'waitCost'   : self.wait_cost,
            'runCost'    : self.run_cost,
            'totalCost'  : self.total_cost,
        }
        cache_key = toolkit.get_cache_key('dataBuffer', 'funcCallCount')
        self.cache_db.push(cache_key, toolkit.json_dumps(data))

    # 完全重写父类方法
    def buff_task_record(self):
        # 函数任务可能非常多，且可能同时包含大量日志
        # 因此直接上报观测云，而不进入缓冲区
        data = self.create_task_record_guance_data()
        if self.guance_data_upload_url and data:
            self.upload_guance_data('logging', data)

        # 任务记录（函数）
        self._buff_task_record_func()

        # 函数调用计数
        self._buff_func_call_count()

    # 为父类方法添加处理
    def response(self, task_resp):
        super().response(task_resp)

        # 缓存函数运行结果
        if self.cache_result and self.cache_result_key:
            task_resp_dumps = toolkit.json_dumps(task_resp)
            self.cache_db.setex(self.cache_result_key, self.cache_result, task_resp_dumps)

    def run(self, **kwargs):
        super().run(**kwargs)

        ### 任务开始
        # 记录 Crontab 触发时间
        if self.origin == 'crontabConfig':
            self.cache_recent_crontab_triggered()

        func_resp = None
        try:
            # 定时任务锁
            crontab_lock_key   = kwargs.get('crontabLockKey')
            crontab_lock_value = kwargs.get('crontabLockValue')

            if crontab_lock_key and crontab_lock_value:
                if not self.cache_db.lock(crontab_lock_key, crontab_lock_value, self.timeout):
                    raise PreviousTaskNotFinished()

            # 缓存任务状态
            self.cache_last_task_status(status='started')

            # 执行函数
            func_resp = self.apply()

            # 响应大型数据，需要将数据缓存为文件
            if isinstance(func_resp, FuncResponseLargeData):
                cache_result_expires = 0
                try:
                    cache_result_expires = self.script['funcExtraConfig'][self.func_id]['cacheResult']
                except (KeyError, TypeError) as e:
                    pass

                func_resp.cache_to_file(cache_result_expires or 0)

        except Exception as e:
            # 缓存任务状态
            self.cache_last_task_status(status='failure', exception=e)

            # 替换默认错误堆栈
            self.traceback = self.get_traceback()

            raise

        else:
            # 缓存任务状态
            self.cache_last_task_status(status='success')

            # 准备函数运行结果
            return_value     = func_resp.data
            response_control = func_resp.make_response_control()

            # 准备返回值
            result = {
                'returnValue'    : return_value,
                'responseControl': response_control,
            }

            # 返回函数结果
            return result

        finally:
            # 定时任务解锁
            if crontab_lock_key and crontab_lock_value:
                self.cache_db.unlock(crontab_lock_key, crontab_lock_value)

            # 清理资源
            self.clean_up()
