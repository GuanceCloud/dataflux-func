# -*- coding: utf-8 -*-

# Built-in Modules

# 3rd-party Modules

# Project Modules
from worker.utils import yaml_resources, toolkit

from worker.tasks.example import ExampleSuccessTask, ExampleFailureTask, ExampleTimeoutTask
from worker.tasks.main.func_debugger import FuncDebuggerTask

# 任务表
TASK_MAP = {
    # 示例任务
    ExampleSuccessTask.name: ExampleSuccessTask,
    ExampleFailureTask.name: ExampleFailureTask,
    ExampleTimeoutTask.name: ExampleTimeoutTask,

    # 函数任务
    FuncDebuggerTask.name: FuncDebuggerTask,

    # 系统后台任务
}

# 定时任务表
CRONTAB_MAP = {
    'example-per-second': {
        'task'   : ExampleTimeoutTask,
        'crontab': '*/3 * * * * *',
    },
}

def get_task(name):
    return TASK_MAP.get(name)

def get_matched_crontab_task_instances(t, tz=None):
    result = []
    for item in CRONTAB_MAP.values():
        if toolkit.is_match_crontab(item['crontab'], t, tz):
            task_inst = item['task'](kwargs=item.get('kwargs'), trigger_time=t)
            result.append(task_inst)

    return result
