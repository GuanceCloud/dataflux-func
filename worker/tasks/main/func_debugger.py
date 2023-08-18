# -*- coding: utf-8 -*-

'''
脚本 Debug 模式执行处理任务
主要用于脚本预检查、DataFlux Func 编辑页面直接调用函数
'''

# Built-in Modules
import time
import traceback
import pprint
import tracemalloc

# 3rd-party Modules

# Project Modules
from worker.utils import toolkit, yaml_resources
from worker.tasks import TaskTimeoutException
from worker.tasks.main import FuncBaseTask, BaseFuncResponse, FuncResponse, NotFoundException

CONFIG = yaml_resources.get('CONFIG')

class FuncDebuggerTask(FuncBaseTask):
    name = 'Main.FuncDebugger'

    def __init__(self, *args, **kwargs):
        # 跟踪内存使用
        tracemalloc.start()

        super().__init__(*args, **kwargs)

    def run(self, **kwargs):
        super().run(**kwargs)

        # 预检查任务需要将执行日志、检查结果和错误同时返回给调用方，因此本身永远不会失败
        # 此处的 status 为用户函数执行结果，API 端需要根据 result.status 判断预检查是否通过，并将错误重新包装后返回给调用方
        status = 'failure'

        # 错误堆栈
        error_stack = None

        ### 任务开始
        func_resp = None
        try:
            # 执行函数
            func_resp = self.apply(use_code_draft=True)

        except Exception as e:
            status = 'failure'
            if isinstance(e, TaskTimeoutException):
                status = 'timeout'

            # 由于任务本身始终成功，此处需要手工输出堆栈到日志（warning）
            for line in traceback.format_exc().splitlines():
                self.logger.warning(line)

            # 搜集错误堆栈
            error_stack = self.get_error_stack()

        else:
            status = 'success'

        finally:
            return_value     = None
            response_control = None

            api_funcs    = []
            log_messages = []

            if self.script_scope:
                # 脚本解析结果
                api_funcs = self.script_scope['DFF'].api_funcs or []

                # 脚本输出日志
                log_messages = self.script_scope['DFF'].log_messages or []

            if self.func_name and func_resp:
                # 准备函数运行结果
                # NOTE: `func_debugger`对应前端只使用 repr 结果
                if func_resp.data is not None:
                    try:
                        return_value = pprint.saferepr(func_resp.data)

                    except Exception as e:
                        for line in traceback.format_exc().splitlines():
                            self.logger.error(line)

                # 响应控制
                response_control = func_resp.make_response_control()

            # 准备返回值
            result = {
                'returnValue'    : return_value,
                'responseControl': response_control,

                'apiFuncs'  : api_funcs,
                'logMessage': log_messages,

                'status'         : status,
                'errorStack'     : error_stack,
                'cost'           : toolkit.get_timestamp(3) - self.start_time,
                'peakMemroyUsage': None,
            }

            # 清理资源
            self.clean_up()

            # 计算峰值内存使用
            result['peakMemroyUsage'] = tracemalloc.get_traced_memory()[1]
            tracemalloc.stop()

            return result
