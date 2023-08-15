# -*- coding: utf-8 -*-

# Built-in Modules
import os
import multiprocessing
import signal
import time

# 3rd-party Modules

# Project Modules
from worker.utils import yaml_resources, toolkit

# Configure
BASE_PATH  = os.path.dirname(os.path.abspath(__file__))
CONFIG     = yaml_resources.load_config(os.path.join(BASE_PATH, '../config.yaml'))
CONST      = yaml_resources.load_file('CONST', os.path.join(BASE_PATH, '../const.yaml'))
IMAGE_INFO = yaml_resources.load_file('IMAGE_INFO', os.path.join(BASE_PATH, '../image-info.json'))

from worker.tasks.example import ExampleSuccessTask, ExampleFailureTask, ExampleTimeoutTask
from worker.tasks.main.func_debugger import FuncDebuggerTask
from worker.tasks.main.func_runner import FuncRunnerTask

# 任务表
TASK_MAP = {
    # 示例任务
    ExampleSuccessTask.name: ExampleSuccessTask,
    ExampleFailureTask.name: ExampleFailureTask,
    ExampleTimeoutTask.name: ExampleTimeoutTask,

    # 函数任务
    FuncDebuggerTask.name: FuncDebuggerTask,
    # FuncRunnerTask.name  : FuncRunnerTask,

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

def run_background(func, pool_size, max_tasks):
    try:
        manager = multiprocessing.Manager()
        shutdown_event = manager.Event()

        # SIGTERM 信号
        def sigterm_handler(signum, frame):
            print('Received SIGTERM')
            shutdown_event.set()

        signal.signal(signal.SIGTERM, sigterm_handler)

        # 函数包装
        def func_wrap():
            print('New process')

            # 执行若干个任务后重启进程
            for i in range(max_tasks):
                # 执行指定函数
                try:
                    func()

                except KeyboardInterrupt as e:
                    shutdown_event.set()

                except Exception as e:
                    raise

                # 检查停止事件
                if shutdown_event.is_set():
                    return

        # 保持一定数量进程
        pool = []
        while not shutdown_event.is_set():
            for p in pool:
                if not p.is_alive():
                    p.close()
                    pool.remove(p)

            while len(pool) < pool_size:
                p = multiprocessing.Process(target=func_wrap)
                p.start()
                pool.append(p)

            time.sleep(1)

        # 清理
        for p in pool:
            p.join()

        print('Shutdown')

    except KeyboardInterrupt as e:
        print('Interrupted by Ctrl + C')
        shutdown_event.set()
