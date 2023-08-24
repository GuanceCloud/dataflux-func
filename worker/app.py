# -*- coding: utf-8 -*-

# Built-in Modules
import os
import sys
import signal
import socket
import ssl
import urllib

# 3rd-party Modules

# Disable InsecureRequestWarning
import requests
from requests.packages.urllib3.exceptions import InsecureRequestWarning
requests.packages.urllib3.disable_warnings(InsecureRequestWarning)

# Project Modules
from worker.utils import yaml_resources, toolkit

# Init
from worker.app_init import before_app_create
before_app_create()

CONFIG = yaml_resources.get('CONFIG')

from worker import LOGGER, REDIS, LISTINGING_QUEUES, run_background
from worker.tasks import TaskTimeoutException

# 任务表
from worker.tasks.example         import ExampleSuccess, ExampleFailure, ExampleTimeout
from worker.tasks.crontab_starter import CrontabStarter, CrontabManualStarter
from worker.tasks..debugger       import FuncDebugger
from worker.tasks..runner         import FuncRunner
from worker.tasks.internal        import FlushDataBuffer, AutoClean, AutoBackupDB, ReloadDataMD5Cache, CheckConnector, QueryConnector, AutoRun

TASK_CLS_MAP = {
    # 示例任务
    ExampleSuccess.name      : ExampleSuccess,
    ExampleFailure.name      : ExampleFailure,
    ExampleTimeout.name      : ExampleTimeout,

    # 自动触发任务
    CrontabStarter.name      : CrontabStarter,
    CrontabManualStarter.name: CrontabManualStarter,

    # 函数执行任务
    FuncDebugger.name        : FuncDebugger,
    FuncRunner.name          : FuncRunner,

    # 内部任务
    FlushDataBuffer.name     : FlushDataBuffer,
    AutoClean.name           : AutoClean,
    AutoBackupDB.name        : AutoBackupDB,
    ReloadDataMD5Cache.name  : ReloadDataMD5Cache,
    CheckConnector.name      : CheckConnector,
    QueryConnector.name      : QueryConnector,
    AutoRun.name             : AutoRun,
}

def consume():
    '''
    消费队列中任务
    '''
    # 取消执行时长
    signal.alarm(0)

    # 获取任务
    cache_keys = list(map(lambda q: toolkit.get_worker_queue(q), LISTINGING_QUEUES))
    _, task_req = map(lambda s: s.decode(), REDIS.brpop(cache_keys))
    task_req = toolkit.json_loads(task_req)

    # 生成任务对象
    task_name = task_req['name']
    task_cls = TASK_CLS_MAP.get(task_name)
    if not task_cls:
        LOGGER.warning(f'No such task: {task_name}')
        return

    task_inst = task_cls.from_task_request(task_req)

    # 限制执行时长
    signal.alarm(task_inst.timeout)

    # 执行任务
    task_inst.start()

def handle_sigalarm(signum, frame):
    e = TaskTimeoutException(f'Task Timeout')
    raise e

if __name__ == '__main__':
    # 注册 SIGALRM 处理函数
    signal.signal(signal.SIGALRM, handle_sigalarm)

    # 打印提示信息
    queues = ', '.join(map(lambda q: f'#{q}', LISTINGING_QUEUES))
    pid = os.getpid()

    print(f'Worker is listening on queues [ {queues} ] (Press CTRL+C to quit)')
    print(f'PID: {pid}')
    print('Have fun!')

    # 启动后台
    run_background(func=consume,
                   pool_size=CONFIG['_WORKER_CONCURRENCY'],
                   max_tasks=CONFIG['_WORKER_PROCESS_CONSUME_LIMIT'])
