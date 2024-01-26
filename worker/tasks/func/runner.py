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
from worker.tasks import PreviousTaskNotFinishedException
from worker.tasks.func import FuncBaseTask, BaseFuncResponse, FuncResponse, FuncResponseLargeData, NotFoundException

CONFIG = yaml_resources.get('CONFIG')

class FuncRunner(FuncBaseTask):
    name = 'Func.Runner'

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        # 观测云上报错误记录
        self.guance_data_upload_error = None

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

    @property
    def full_print_logs(self):
        if self.script_scope is None:
            return None

        print_logs = self.script_scope['DFF'].print_logs
        if not print_logs and not self.traceback:
            return None

        log_data = []
        if print_logs:
            log_data.append('\n'.join(print_logs))

        if self.traceback:
            log_data.append('[Traceback]')
            log_data.append(self.traceback)

        return '\n'.join(log_data)

    @property
    def reduced_print_logs(self):
        if self.script_scope is None:
            return None

        print_logs = self.script_scope['DFF'].print_logs
        if not print_logs:
            return None

        data = []
        for line in print_logs:
            data.append(toolkit.limit_text(line, CONFIG['_TASK_RECORD_PRINT_LOG_LINE_LIMIT'], show_length=True))

        data = '\n'.join(data).strip()

        data_length = len(data)
        if data_length > CONFIG['_TASK_RECORD_PRINT_LOG_TOTAL_LIMIT_HEAD'] + CONFIG['_TASK_RECORD_PRINT_LOG_TOTAL_LIMIT_TAIL']:
            reduce_tip = f"!!! Content too long, only FIRST {CONFIG['_TASK_RECORD_PRINT_LOG_TOTAL_LIMIT_HEAD']} chars and LAST {CONFIG['_TASK_RECORD_PRINT_LOG_TOTAL_LIMIT_TAIL']} are saved !!!"
            skip_tip   = f"<skipped {data_length - CONFIG['_TASK_RECORD_PRINT_LOG_TOTAL_LIMIT_HEAD'] - CONFIG['_TASK_RECORD_PRINT_LOG_TOTAL_LIMIT_TAIL']} chars>"
            first_part = data[:CONFIG['_TASK_RECORD_PRINT_LOG_TOTAL_LIMIT_HEAD']] + '...'
            last_part  = '...' + data[-CONFIG['_TASK_RECORD_PRINT_LOG_TOTAL_LIMIT_TAIL']:]
            data = '\n\n'.join([ reduce_tip, first_part, skip_tip, last_part ])

        return data

    @property
    def guance_data_upload_error_logs(self):
        if not self.guance_data_upload_error:
            return None

        return '\n'.join([ '[Guance Data Upload Error]', repr(self.guance_data_upload_error) ])

    @property
    def reduced_print_logs_with_guance_data_upload_error(self):
        sections = []
        if self.reduced_print_logs:
            sections.append(self.reduced_print_logs)

        if self.guance_data_upload_error_logs:
            sections.append(self.guance_data_upload_error_logs)

        return '\n\n'.join(sections)

    # 完全重写父类方法
    def create_task_record_guance_data(self):
        if not self.guance_data_upload_url:
            return None

        data = {
            'measurement': CONFIG['_MONITOR_GUANCE_MEASUREMENT_TASK_RECORD_FUNC'],
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
                'message': self.full_print_logs,

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

            'id'                 : self.task_id,
            'rootTaskId'         : self.root_task_id,
            'scriptSetId'        : self.script_set_id,
            'scriptId'           : self.script_id,
            'funcId'             : self.func_id,
            'funcCallKwargsJSON' : toolkit.json_dumps(self.func_call_kwargs),
            'origin'             : self.origin,
            'originId'           : self.origin_id,
            'crontab'            : self.kwargs.get('crontab'),
            'callChainJSON'      : toolkit.json_dumps(self.call_chain, keep_none=True),
            'triggerTimeMs'      : self.trigger_time_ms,
            'startTimeMs'        : self.start_time_ms,
            'endTimeMs'          : self.end_time_ms,
            'delay'              : self.delay,
            'queue'              : self.queue,
            'timeout'            : self.timeout,
            'expires'            : self.expires,
            'ignoreResult'       : self.ignore_result,
            'status'             : self.status,
            'exceptionType'      : self.exception_type,
            'exceptionTEXT'      : self.exception_text,
            'tracebackTEXT'      : self.traceback,
            'printLogsTEXT'      : self.reduced_print_logs_with_guance_data_upload_error,
            'returnValueJSON'    : toolkit.json_dumps(self.return_value, keep_none=True),
            'responseControlJSON': toolkit.json_dumps(self.response_control, keep_none=True),
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
        if data:
            try:
                self.upload_guance_data('logging', data)
            except Exception as e:
                self.guance_data_upload_error = e

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

        # 定时任务锁
        crontab_lock_key   = kwargs.get('crontabLockKey')
        crontab_lock_value = kwargs.get('crontabLockValue')

        if crontab_lock_key and crontab_lock_value:
            if not self.cache_db.lock(crontab_lock_key, crontab_lock_value, self.timeout):
                raise PreviousTaskNotFinishedException()

        # 用于函数缓存
        self.func_call_kwargs_md5 = kwargs.get('funcCallKwargsMD5')

        # 函数结果缓存时长
        self.cache_result_expires = None

        ### 任务开始
        func_resp = None
        try:
            # 执行函数
            func_resp = self.apply()

            # 提取函数结果缓存时长
            try:
                self.cache_result_expires = self.script['funcExtraConfig'][self.func_id]['cacheResult']
            except (KeyError, TypeError) as e:
                pass

            # 响应大型数据，需要将数据缓存为文件
            if isinstance(func_resp, FuncResponseLargeData):
                func_resp.cache_to_file(self.cache_result_expires or 0)

        except Exception as e:
            # 替换默认错误堆栈
            self.traceback = self.get_traceback()

            raise

        else:
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
