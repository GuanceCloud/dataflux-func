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
from worker import run_background
from worker.utils import yaml_resources, toolkit

# Init
from worker.app_init import before_app_create, after_app_created
before_app_create()

from worker.utils.log_helper import LogHelper
from worker.utils.extra_helpers import RedisHelper

CONFIG = yaml_resources.get('CONFIG')

LOGGER = LogHelper()
REDIS  = RedisHelper(logger=LOGGER)
REDIS.skip_log = True

# 当前 Worker 监听队列
LISTINGING_QUEUES = sys.argv[1:] or list(range(CONFIG['_WORKER_QUEUE_COUNT']))

from worker import get_task
from worker.tasks import TaskTimeoutException

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
    task_cls = get_task(task_req['name'])
    if not task_cls:
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
                   max_tasks=CONFIG['_WORKER_MAX_TASKS_PER_CHILD'])

def heartbeat():
    global WORKER_QUEUES
    global MAIN_PROCESS
    global CHILD_PROCESSES
    global MONITOR_HEARTBEAT_TIMESTAMP
    global MONITOR_SYS_STATS_CHECK_TIMESTAMP

    # Init
    if MAIN_PROCESS is None:
        MAIN_PROCESS = psutil.Process()
        MAIN_PROCESS.cpu_percent(interval=1)

    current_timestamp = int(time.time())

    # Record worker count
    if WORKER_QUEUES and current_timestamp - MONITOR_HEARTBEAT_TIMESTAMP > CONFIG['_MONITOR_WORKER_HEARTBEAT_INTERVAL']:
        MONITOR_HEARTBEAT_TIMESTAMP = current_timestamp

        _expires = int(CONFIG['_MONITOR_WORKER_HEARTBEAT_INTERVAL'] * 1.5)
        for q in WORKER_QUEUES:
            cache_key = toolkit.get_cache_key('heartbeat', 'workerOnQueue', tags=['workerId', WORKER_ID, 'workerQueue', q])
            REDIS_HELPER.setex(cache_key, _expires, 'x')

            cache_pattern = toolkit.get_cache_key('heartbeat', 'workerOnQueue', tags=['workerId', '*', 'workerQueue', q])
            found_workers = REDIS_HELPER.keys(cache_pattern)

            cache_key = toolkit.get_cache_key('heartbeat', 'workerOnQueueCount', tags=['workerQueue', q])
            REDIS_HELPER.setex(cache_key, _expires, len(found_workers))

    # Record CPU/Memory
    if MAIN_PROCESS and current_timestamp - MONITOR_SYS_STATS_CHECK_TIMESTAMP > CONFIG['_MONITOR_SYS_STATS_CHECK_INTERVAL']:
        MONITOR_SYS_STATS_CHECK_TIMESTAMP = current_timestamp

        total_cpu_percent = MAIN_PROCESS.cpu_percent()

        main_memory_info  = MAIN_PROCESS.memory_full_info()
        total_memory_pss = main_memory_info.pss

        # Update child process map
        next_child_process_map = dict([(p.pid, p) for p in MAIN_PROCESS.children()])

        prev_child_pids = set(CHILD_PROCESS_MAP.keys())
        next_child_pids = set(next_child_process_map.keys())

        exited_pids = prev_child_pids - next_child_pids
        for pid in exited_pids:
            CHILD_PROCESS_MAP.pop(pid, None)

        new_pids = next_child_pids - prev_child_pids
        for pid in new_pids:
            new_child_process = next_child_process_map[pid]
            new_child_process.cpu_percent(interval=1)
            CHILD_PROCESS_MAP[pid] = new_child_process

        # Count up
        for p in CHILD_PROCESS_MAP.values():
            child_cpu_percent = p.cpu_percent()
            child_memory_info = p.memory_full_info()

            total_cpu_percent += child_cpu_percent
            total_memory_pss  += child_memory_info.pss

        total_cpu_percent = round(total_cpu_percent, 2)

        hostname = socket.gethostname()

        cache_key = toolkit.get_server_cache_key('monitor', 'systemMetrics', ['metric', 'workerCPUPercent', 'hostname', hostname]);
        REDIS_HELPER.ts_add(cache_key, total_cpu_percent, timestamp=current_timestamp)

        cache_key = toolkit.get_server_cache_key('monitor', 'systemMetrics', ['metric', 'workerMemoryPSS', 'hostname', hostname]);
        REDIS_HELPER.ts_add(cache_key, total_memory_pss, timestamp=current_timestamp)

def on_heartbeat_sent(**kwargs):
    heartbeat()
