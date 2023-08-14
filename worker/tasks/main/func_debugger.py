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
import six

# Project Modules
from worker.utils import toolkit, yaml_resources
from worker.tasks.main import FuncBaseTask, BaseFuncResponse, FuncResponse, NotFoundException

CONFIG = yaml_resources.get('CONFIG')

class FuncDebuggerTask(FuncBaseTask):
    name = 'Biz.FuncDebugger'

    def run(self, **kwargs):
        # 执行函数、参数
        func_id          = kwargs.get('funcId')
        func_call_kwargs = kwargs.get('funcCallKwargs') or {}

        script_set_id = func_id.split('__')[0]
        script_id     = func_id.split('.')[0]
        func_name     = func_id[len(script_id) + 1:]

        self.logger.info(f'{self.name} Task launched: `{func_id}`')

        # 来源
        origin    = kwargs.get('origin')
        origin_id = kwargs.get('originId')

        # 任务 ID
        task_id      = self.task_id
        root_task_id = kwargs.get('rootTaskId') or self.task_id

        # 函数链
        func_chain = kwargs.get('funcChain') or []
        func_chain.append(func_id)

        # 执行模式：UI 执行只能使用同步模式
        exec_mode = 'sync'

        # HTTP请求
        http_request = kwargs.get('httpRequest') or {}
        if 'headers' in http_request:
            http_request['headers'] = toolkit.IgnoreCaseDict(http_request['headers'])

        # 函数响应、上下文、日志
        func_resp    = None
        script_scope = None
        log_messages = None

        # 最大内存使用
        peak_memory_usage = None

        # 被强行 Kill 时，不会进入 except 范围，所以默认制定为"failure"
        status = 'failure'

        try:
            # 获取代码对象
            target_script = self.load_script(script_id, draft=True)

            if not target_script:
                e = NotFoundException(f'Script `{script_id}` not found')
                raise e

            extra_vars = {
                '_DFF_DEBUG'          : True,
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
                '_DFF_TRIGGER_TIME'   : self.trigger_time,
                '_DFF_TRIGGER_TIME_MS': self.trigger_time * 1000,
                '_DFF_START_TIME'     : self.start_time,
                '_DFF_START_TIME_MS'  : self.start_time * 1000,
                '_DFF_CRONTAB'        : kwargs.get('crontab'),
                '_DFF_CRONTAB_DELAY'  : kwargs.get('crontabDelay'),
                '_DFF_QUEUE'          : self.queue,
                '_DFF_HTTP_REQUEST'   : http_request,
            }
            script_scope = self.create_safe_scope(script_id, extra_vars=extra_vars)

            # 加载入口脚本
            self.logger.info('[ENTRY SCRIPT] `{}`'.format(script_id))
            script_scope = self.safe_exec(target_script['codeObj'], globals=script_scope)

            # 执行脚本
            if func_name:
                entry_func = script_scope.get(func_name)
                if not entry_func:
                    e = NotFoundException('Function `{}` not found in `{}`'.format(func_name, script_id))
                    raise e

                # 执行函数
                self.logger.info('[RUN FUNC] `{}`'.format(func_id))

                tracemalloc.start()

                func_resp = entry_func(**func_call_kwargs)
                _, peak_memory_usage = tracemalloc.get_traced_memory()

                tracemalloc.stop()

                if not isinstance(func_resp, BaseFuncResponse):
                    func_resp = FuncResponse(func_resp)

                if isinstance(func_resp.data, Exception):
                    raise func_resp.data

        except Exception as e:
            # 预检查任务需要将检查结果和错误同时返回给调用方，因此本身永远不会失败
            # API端需要判断预检查是否通过，并将错误重新包装后返回给调用方
            status = 'failure'

            for line in traceback.format_exc().splitlines():
                self.logger.warning(line)

        else:
            status = 'success'

        finally:
            apis             = []
            log_messages     = []
            return_value     = None
            response_control = None

            if script_scope:
                # 脚本解析结果
                apis = script_scope['DFF'].apis or []

                # 脚本输出日志
                log_messages = script_scope['DFF'].log_messages or []

            if func_name and func_resp:
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
            return_value = {
                'apis'           : apis,
                'status'         : status,
                'logMessage'     : log_messages,
                'returnValue'    : return_value,
                'responseControl': response_control,

                'cost'           : toolkit.get_timestamp() - self.start_time,
                'peakMemroyUsage': peak_memory_usage,
            }

            # 清理资源
            self.clean_up()

            # 返回函数结果
            return return_value
