# -*- coding: utf-8 -*-

'''
脚本执行处理任务
主要用于直接调用函数、通过授权链接调用函数、Crontab 触发调用函数
'''

# Built-in Modules
import time
import pprint
import traceback

# 3rd-party Modules

# Project Modules
from worker.utils import toolkit, yaml_resources
from worker.tasks.main import FuncBaseTask, BaseFuncResponse, FuncResponse, FuncResponseLargeData, NotFoundException

CONFIG = yaml_resources.get('CONFIG')

class FuncRunner(FuncBaseTask):
    name = 'Func.Runner'

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
    def full_log_messages(self):
        log_messages = script_scope['DFF'].log_messages or None

        data = []
        if log_messages:
            data.append('\n'.join(log_messages))

        if self.error_stack:
            data.append(' Stack '.center(30, '-'))
            data.append(self.error_stack)

        return '\n'.join(data)

    @property
    def reduced_log_messages(self):
        log_messages = script_scope['DFF'].log_messages or None

        data = []
        for line in log_messages:
            data.append(toolkit.limit_text(line, CONFIG['_TASK_INFO_LOG_MESSAGE_LINE_LIMIT'], show_length=True))

        data = '\n'.join(data).strip()

        data_length = len(data)
        if data_length > CONFIG['_TASK_INFO_LOG_MESSAGE_TOTAL_LIMIT_HEAD'] + CONFIG['_TASK_INFO_LOG_MESSAGE_TOTAL_LIMIT_TAIL']:
            reduce_tip = f"!!! Content too long, only FIRST {CONFIG['_TASK_INFO_LOG_MESSAGE_TOTAL_LIMIT_HEAD']} chars and LAST {CONFIG['_TASK_INFO_LOG_MESSAGE_TOTAL_LIMIT_TAIL']} are saved !!!"
            skip_tip   = f"<skipped {data_length - CONFIG['_TASK_INFO_LOG_MESSAGE_TOTAL_LIMIT_HEAD'] - CONFIG['_TASK_INFO_LOG_MESSAGE_TOTAL_LIMIT_TAIL']} chars>"
            first_part = data[:CONFIG['_TASK_INFO_LOG_MESSAGE_TOTAL_LIMIT_HEAD']] + '...'
            last_part  = '...' + data[-CONFIG['_TASK_INFO_LOG_MESSAGE_TOTAL_LIMIT_TAIL']:]
            data = '\n\n'.join([ reduce_tip, first_part, skip_tip, last_part ])

        if self.error_stack:
            data = '\n'.join([
                data,
                ' Stack '.center(30, '-'),
                self.error_stack,
            ])

        return data

    def create_task_record_guance_data(self, task_resp):
        data = {
            'measurement': 'DFF_task_record_func',
            'tags': {
                'id'            : self.task_id,
                'queue'         : str(self.queue),
                'status'        : self.status,
                'workspace_uuid': self.func_call_kwargs.get('workspace_uuid'),
                'root_task_id'  : self.root_task_id,
                'script_set_id' : self.script_set_id,
                'script_id'     : self.script_id,
                'funcId'        : self.func_id,
                'origin'        : self.origin,
                'originId'      : self.origin_id,
            },
            'fields': {
                'func_call_kwargs'   : toolkit.json_dumps(self.func_call_kwargs),
                'crontab'            : self.kwargs.get('crontab'),
                'call_chain'         : toolkit.json_dumps(self.call_chain, keep_none=True),
                'return_value'       : toolkit.json_dumps(self.return_value, keep_none=True)
                'response_control'   : toolkit.json_dumps(self.response_control, keep_none=True),
                'trigger_time'       : self.trigger_time_iso,
                'start_time'         : self.start_time_iso,
                'end_time'           : self.end_time_iso,
                'delay'              : self.delay,
                'timeout'            : self.timeout,
                'expires'            : self.expires,
                'ignore_result'      : self.ignore_result,
                'error'              : self.error,
                'error_stack'        : self.error_stack,
                'message'            : self.full_log_messages,
                'wait_cost'          : self.start_time_ms - self.trigger_time_ms,
                'run_cost'           : self.end_time_ms   - self.start_time_ms,
                'total_cost'         : self.end_time_ms   - self.trigger_time_ms,
            }
        }
        return data

    def buff_task_record(self, task_resp):
        # 为了提高处理性能，此处仅写入 Redis 队列，不直接写入数据库
        super().buff_task_record(task_resp)

        # 任务记录（函数）
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
            'errorTEXT'          : self.error,
            'errorStackTEXT'     : self.error_stack,
            'logMessageTEXT'     : self.reduced_log_messages,
            'returnValueJSON'    : toolkit.json_dumps(self.return_value, keep_none=True),
            'responseControlJSON': toolkit.json_dumps(self.response_control, keep_none=True),
        }
        cache_key = toolkit.get_cache_key('dataBuffer', 'taskRecordFunc')
        self.cache_db.lpush(cache_key, toolkit.json_dumps(data))

        # 函数调用计数
        data = {
            'scriptSetId'  : self.script_set_id,
            'scriptId'     : self.script_id,
            'funcId'       : self.func_id,
            'origin'       : self.origin,
            'queue'        : str(self.queue),
            'status'       : self.status,
            'timestamp'    : self.trigger_time,
            'waitCost'     : self.start_time_ms - self.trigger_time_ms,
            'runCost'      : self.end_time_ms   - self.start_time_ms,
            'totalCost'    : self.end_time_ms   - self.trigger_time_ms,
            'workspaceUUID': self.func_call_kwargs.get('workspace_uuid'),
        }
        cache_key = toolkit.get_cache_key('dataBuffer', 'funcCallCount')
        self.cache_db.lpush(cache_key, toolkit.json_dumps(data))

    def response(self, task_resp):
        super().response(task_resp)

        # 缓存函数运行结果
        if self.cache_result and self.cache_result_key:
            task_resp_dumps = toolkit.json_dumps(task_resp)
            self.cache_db.setex(self.cache_result_key, self.cache_result, task_resp_dumps)

    def run(self, **kwargs):
        super().run(**kwargs)

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
            self.error_stack = self.get_error_stack()

            raise

        else:
            # 准备函数运行结果
            return_value     = None
            response_control = func_resp.make_response_control()

            if func_resp.data is not None:
                return_value = {}

                try:
                    return_value['raw'] = func_resp.data
                except Exception as e:
                    for line in traceback.format_exc().splitlines():
                        self.logger.error(line)

                try:
                    return_value['repr'] = pprint.saferepr(func_resp.data)
                except Exception as e:
                    for line in traceback.format_exc().splitlines():
                        self.logger.error(line)

                try:
                    return_value['jsonDumps'] = toolkit.json_dumps(func_resp.data)
                except Exception as e:
                    for line in traceback.format_exc().splitlines():
                        self.logger.error(line)

            # 准备返回值
            result = {
                'returnValue'    : return_value,
                'responseControl': response_control,
            }

            # 返回函数结果
            return result

        finally:
            # 定时任务解锁
            crontab_lock_key   = kwargs.get('crontabLockKey')
            crontab_lock_value = kwargs.get('crontabLockValue')
            if crontab_lock_key and crontab_lock_value:
                self.cache_db.unlock(crontab_lock_key, crontab_lock_value)

            # 清理资源
            self.clean_up()
