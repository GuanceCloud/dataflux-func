# -*- coding: utf-8 -*-

# Built-in Modules
import os
import sys
import socket
import multiprocessing
import signal
import time

# 3rd-party Modules
import psutil
import redis

# Project Modules
from worker.utils import yaml_resources, toolkit

# Init
BASE_PATH  = os.path.dirname(os.path.abspath(__file__))
CONFIG     = yaml_resources.load_config(os.path.join(BASE_PATH, '../config.yaml'))
CONST      = yaml_resources.load_file('CONST', os.path.join(BASE_PATH, '../const.yaml'))
IMAGE_INFO = yaml_resources.load_file('IMAGE_INFO', os.path.join(BASE_PATH, '../image-info.json'))

LISTINGING_QUEUES = sys.argv[1:]

from worker.utils.log_helper import LogHelper
from worker.utils.extra_helpers import RedisHelper

LOGGER = LogHelper()
REDIS  = RedisHelper(logger=LOGGER)
REDIS.skip_log = True

# 系统监控
WORKER_ID                = None
MAIN_PROCESS             = None
CHILD_PROCESS_MAP        = {} # PID -> Process
MONITOR_REPORT_TIMESTAMP = 0
exec_filename = os.path.basename(sys.argv[0])
if exec_filename == 'app.py':
    WORKER_ID = f'WORKER-{toolkit.gen_time_serial_seq()}'
elif exec_filename == 'beat.py':
    WORKER_ID = f'BEAT-{toolkit.gen_time_serial_seq()}'

def heartbeat():
    global MAIN_PROCESS
    global MONITOR_REPORT_TIMESTAMP

    # Init
    if MAIN_PROCESS is None:
        MAIN_PROCESS = psutil.Process()
        MAIN_PROCESS.cpu_percent(interval=1)

    t = int(time.time())

    if t - MONITOR_REPORT_TIMESTAMP > CONFIG['_MONITOR_REPORT_INTERVAL']:
        MONITOR_REPORT_TIMESTAMP = t

        if LISTINGING_QUEUES and WORKER_ID:
            # 记录每个队列 Worker 数量
            _expires = int(CONFIG['_MONITOR_REPORT_INTERVAL'] * 1.5)
            for q in LISTINGING_QUEUES:
                cache_key = toolkit.get_monitor_cache_key('heartbeat', 'workerOnQueue', tags=['workerQueue', q, 'workerId', WORKER_ID])
                REDIS.setex(cache_key, _expires, CONFIG['_WORKER_CONCURRENCY'])

                cache_pattern = toolkit.get_monitor_cache_key('heartbeat', 'workerOnQueue', tags=['workerQueue', q, 'workerId', '*'])
                worker_process_count_list = REDIS.get_by_pattern(cache_pattern)

                cache_key = toolkit.get_monitor_cache_key('heartbeat', 'workerCountOnQueue', tags=['workerQueue', q])
                worker_count = len(worker_process_count_list)
                REDIS.setex(cache_key, _expires, worker_count)

                cache_key = toolkit.get_monitor_cache_key('heartbeat', 'processCountOnQueue', tags=['workerQueue', q])
                process_count = 0
                for count in worker_process_count_list:
                    process_count += int(count)
                REDIS.setex(cache_key, _expires, process_count)

        # 记录 CPU / 使用
        total_cpu_percent = MAIN_PROCESS.cpu_percent()
        total_memory_pss  = MAIN_PROCESS.memory_full_info().pss

        # 更新子进程表
        child_process_map = dict([(p.pid, p) for p in MAIN_PROCESS.children()])

        # 删除已经不存在的子进程
        for pid in list(CHILD_PROCESS_MAP.keys()):
            if pid not in child_process_map:
                CHILD_PROCESS_MAP.pop(pid, None)

        # 加入新增子进程
        for pid in list(child_process_map.keys()):
            if pid not in CHILD_PROCESS_MAP:
                p = child_process_map[pid]
                p.cpu_percent(interval=1)
                CHILD_PROCESS_MAP[pid] = p

        # 统计
        for p in CHILD_PROCESS_MAP.values():
            try:
                total_cpu_percent += p.cpu_percent()
                total_memory_pss  += p.memory_full_info().pss

            except psutil.ZombieProcess as e:
                pass

        hostname          = socket.gethostname()
        total_cpu_percent = round(total_cpu_percent, 2)

        cache_key = toolkit.get_monitor_cache_key('monitor', 'systemMetrics', ['metric', 'workerCPUPercent', 'hostname', hostname])
        REDIS.ts_add(cache_key, total_cpu_percent, timestamp=t)

        cache_key = toolkit.get_monitor_cache_key('monitor', 'systemMetrics', ['metric', 'workerMemoryPSS', 'hostname', hostname])
        REDIS.ts_add(cache_key, total_memory_pss, timestamp=t)

def run_background(func, pool_size, max_tasks):
    try:
        manager = multiprocessing.Manager()
        shutdown_event = manager.Event()

        # SIGTERM 信号
        def sigterm_handler(signum, frame):
            LOGGER.warning('Received SIGTERM')
            shutdown_event.set()

        signal.signal(signal.SIGTERM, sigterm_handler)

        # 函数包装
        def func_wrap():
            # 执行若干个任务后重启进程
            for i in range(max_tasks):
                # 执行指定函数
                try:
                    func()

                except KeyboardInterrupt as e:
                    shutdown_event.set()

                except redis.exceptions.ConnectionError as e:
                    LOGGER.error('Redis Connection error, Shutting down...')
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
                    p.join()
                    pool.remove(p)

            while len(pool) < pool_size:
                p = multiprocessing.Process(target=func_wrap)
                p.start()
                pool.append(p)

            heartbeat()

            time.sleep(1)

        # 清理
        for p in pool:
            p.join()

        LOGGER.warning('Shutdown')

    except redis.exceptions.ConnectionError as e:
        LOGGER.error('Redis Connection error, Shutting down...')
        shutdown_event.set()

    except KeyboardInterrupt as e:
        LOGGER.warning('Interrupted by Ctrl + C')
        shutdown_event.set()
