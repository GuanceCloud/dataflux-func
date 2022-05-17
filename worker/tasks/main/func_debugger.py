# -*- coding: utf-8 -*-

'''
脚本Debug模式执行处理任务
主要用于脚本预检查、DataFlux Func编辑页面直接调用函数
'''

# Builtin Modules
import time
import traceback
import pprint

# 3rd-party Modules
import six

# Project Modules
from worker import app
from worker.utils import toolkit, yaml_resources
from worker.tasks import gen_task_id, webhook

# Current Module
from worker.tasks import BaseTask
from worker.tasks.main import NotFoundException
from worker.tasks.main import ScriptBaseTask
from worker.tasks.main import BaseFuncResponse, FuncResponse

CONFIG = yaml_resources.get('CONFIG')

class FuncDebugger(ScriptBaseTask):
    pass

@app.task(name='Main.FuncDebugger', bind=True, base=FuncDebugger)
def func_debugger(self, *args, **kwargs):
    # 执行函数、参数
    func_id          = kwargs.get('funcId')
    func_call_kwargs = kwargs.get('funcCallKwargs') or {}

    script_set_id = func_id.split('__')[0]
    script_id     = func_id.split('.')[0]
    func_name     = func_id[len(script_id) + 1:]

    self.logger.info('Main.FuncDebugger Task launched: `{}`'.format(func_id))

    # 来源
    origin    = kwargs.get('origin')
    origin_id = kwargs.get('originId')

    # 任务ID
    task_id      = self.request.id
    root_task_id = kwargs.get('rootTaskId') or task_id

    # 函数链
    func_chain = kwargs.get('funcChain') or []
    func_chain.append(func_id)

    # 执行模式：UI执行只能使用同步模式
    exec_mode = 'sync'

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

    # 函数结果、上下文、跟踪信息、错误堆栈
    func_resp    = None
    script_scope = None
    log_messages = None
    trace_info   = None
    einfo_text   = None

    # 被强行Kill时，不会进入except范围，所以默认制定为"failure"
    end_status = 'failure'

    try:
        # 获取代码对象
        target_script = self.load_script(script_id, draft=True)

        if not target_script:
            e = NotFoundException('Script `{}` not found'.format(script_id))
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
        if func_name:
            entry_func = script_scope.get(func_name)
            if not entry_func:
                e = FuncNotFoundException('Function `{}` not found in `{}`'.format(func_name, script_id))
                raise e

            # 执行函数
            self.logger.info('[RUN FUNC] `{}`'.format(func_id))
            func_resp = entry_func(**func_call_kwargs)
            if not isinstance(func_resp, BaseFuncResponse):
                func_resp = FuncResponse(func_resp)

            if isinstance(func_resp.data, Exception):
                raise func_resp.data

    except Exception as e:
        for line in traceback.format_exc().splitlines():
            self.logger.warning(line)

        end_status = 'failure'

        # 预检查任务需要将检查结果和错误同时返回给调用方，因此本身永远不会失败
        # API端需要判断预检查是否通过，并将错误重新包装后返回给调用放
        self.logger.error('Error occured in script. `{}`'.format(script_id or func_id))

        trace_info = self.get_trace_info()
        einfo_text = self.get_formated_einfo(trace_info, only_in_script=True)

    else:
        end_status = 'success'

    finally:
        result = {}

        if script_scope:
            # 脚本解析结果
            exported_api_func = script_scope['DFF'].exported_api_funcs or []
            result['exportedAPIFuncs'] = exported_api_func

            # 脚本输出日志
            log_messages = script_scope['DFF'].log_messages or []
            result['logMessages'] = log_messages

        if func_name and func_resp:
            # 准备函数运行结果
            # NOTE: `func_debugger`对应前端只使用了repr结果
            #   因此对比`func_runner`，此处raw/json的处理可以忽略

            func_result_repr = None

            if func_resp.data is not None:
                try:
                    func_result_repr = pprint.saferepr(func_resp.data)
                except Exception as e:
                    for line in traceback.format_exc().splitlines():
                        self.logger.error(line)

            result['funcResult'] = {
                'repr': func_result_repr,

                '_responseControl': func_resp.make_response_control()
            }

        if end_status == 'failure':
            trace_info = trace_info or self.get_trace_info()
            einfo_text = einfo_text or self.get_formated_einfo(trace_info, only_in_script=True)

        # 准备返回值
        retval = {
            'result'   : result,
            'traceInfo': trace_info,
            'einfoTEXT': einfo_text,
            'cost'     : time.time() - start_time,
        }

        # 清理资源
        self.clean_up()

        # 返回函数结果
        return retval
