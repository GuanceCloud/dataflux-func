# -*- coding: utf-8 -*-

# Built-in Modules

# 3rd-party Modules

# Project Modules
from worker.utils import yaml_resources, toolkit

from worker.tasks.example import ExampleSuccessTask, ExampleFailureTask, ExampleTimeoutTask

TASK_MAP = {
    # 示例任务
    ExampleSuccessTask.name: ExampleSuccessTask,
    ExampleFailureTask.name: ExampleFailureTask,
    ExampleTimeoutTask.name: ExampleTimeoutTask,
}

def get_task(name):
    return TASK_MAP.get(name)

def list_matched_crontab_tasks(t, tz=None):
    matched_tasks = []
    for task in TASK_MAP.values():
        if toolkit.is_match_crontab(task.crontab, t, tz):
            matched_tasks.append(task)

    return matched_tasks
