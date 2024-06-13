# -*- coding: utf-8 -*-

# Built-in Modules
import os
import sys
import socket
import multiprocessing
import signal
import time
import traceback

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
from worker.utils.extra_helpers import RedisHelper, MySQLHelper

LOGGER = LogHelper()
REDIS  = RedisHelper(logger=LOGGER)
MYSQL  = MySQLHelper(logger=LOGGER)
REDIS.skip_log = True
MYSQL.skip_log = True

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

    hostname = socket.gethostname()

    # Init
    if MAIN_PROCESS is None:
        MAIN_PROCESS = psutil.Process()
        MAIN_PROCESS.cpu_percent(interval=1)

    t = int(time.time())

    if t - MONITOR_REPORT_TIMESTAMP > CONFIG['_MONITOR_REPORT_INTERVAL']:
        MONITOR_REPORT_TIMESTAMP = t

        # 监控报告过期时间
        monitor_report_expires = int(CONFIG['_MONITOR_REPORT_INTERVAL'] * 3)

        # 记录主机，PID，所启动服务
        service_name = sys.argv[0].split('/').pop()
        if 'beat.py' == service_name:
            service_name = 'beat'
        elif 'app.py' == service_name:
            service_name = 'worker'

        service_info = {
            'name'   : service_name,
            'version': IMAGE_INFO['VERSION'],
            'edition': IMAGE_INFO['EDITION'],
            'uptime' : toolkit.sys_up_time(),
        }

        if service_name == 'worker':
            service_info['queues'] = sorted(sys.argv[1:])

        cache_key = toolkit.get_monitor_cache_key('heartbeat', 'serviceInfo', tags=[ 'hostname', hostname, 'pid', os.getpid() ])
        REDIS.setex(cache_key, monitor_report_expires, toolkit.json_dumps(service_info))

        # 记录每个队列 Worker / 进程数量
        if LISTINGING_QUEUES and WORKER_ID:
            for q in LISTINGING_QUEUES:
                cache_key = toolkit.get_monitor_cache_key('heartbeat', 'workerOnQueue', tags=[ 'workerQueue', q, 'workerId', WORKER_ID ])
                REDIS.setex(cache_key, monitor_report_expires, CONFIG['_WORKER_CONCURRENCY'])

                # TODO 优化 Key 搜索
                cache_pattern = toolkit.get_monitor_cache_key('heartbeat', 'workerOnQueue', tags=[ 'workerQueue', q, 'workerId', '*' ])
                worker_process_count_map = REDIS.get_by_pattern(cache_pattern)
                if not worker_process_count_map:
                    continue

                cache_key = toolkit.get_monitor_cache_key('heartbeat', 'workerCountOnQueue', tags=[ 'workerQueue', q ])
                worker_count = len(worker_process_count_map)
                REDIS.setex(cache_key, monitor_report_expires, worker_count)

                cache_key = toolkit.get_monitor_cache_key('heartbeat', 'processCountOnQueue', tags=[ 'workerQueue', q ])
                process_count = 0
                for count in worker_process_count_map.values():
                    process_count += int(count or 0)
                REDIS.setex(cache_key, monitor_report_expires, process_count)

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

        cache_key = toolkit.get_monitor_cache_key('monitor', 'systemMetrics', [ 'metric', 'workerCPUPercent', 'hostname', hostname ])
        REDIS.ts_add(cache_key, total_cpu_percent, timestamp=t)

        cache_key = toolkit.get_monitor_cache_key('monitor', 'systemMetrics', [ 'metric', 'workerMemoryPSS', 'hostname', hostname ])
        REDIS.ts_add(cache_key, total_memory_pss, timestamp=t)

def check_restart_flag(shutdown_event):
    # 不重复检测
    if shutdown_event.is_set():
        return

    cache_key = toolkit.get_global_cache_key('tempFlag', 'restartAllWorkersAndBeat')
    restart_flag_time = REDIS.get(cache_key)

    if not restart_flag_time:
        return

    restart_flag_time = int(restart_flag_time)
    if restart_flag_time <= toolkit.sys_start_time():
        return

    LOGGER.warning(f'Flag `restartAllWorkersAndBeat` is set at {toolkit.to_iso_datetime(restart_flag_time)}, all Workers and Beat will be restarted soon...')
    shutdown_event.set()

def run_background(func, pool_size=1, max_tasks=-1):
    try:
        manager = multiprocessing.Manager()
        shutdown_event = manager.Event()
        global_context = manager.dict()

        # SIGTERM 信号
        def sigterm_handler(signum, frame):
            LOGGER.warning('Received SIGTERM')
            shutdown_event.set()

        signal.signal(signal.SIGTERM, sigterm_handler)

        # 函数包装
        def func_wrap(context):
            # 执行若干个任务后重启进程
            ran_tasks = 0
            while max_tasks <= 0 or ran_tasks <= max_tasks:
                ran_tasks += 1

                # 执行指定函数
                try:
                    func(context)

                except KeyboardInterrupt as e:
                    shutdown_event.set()

                except redis.exceptions.ConnectionError as e:
                    LOGGER.error(f'Redis: {repr(e)}')
                    LOGGER.error('Redis connection error, closing all processes...')
                    shutdown_event.set()

                except Exception as e:
                    raise

                finally:
                    # 检查关机 Flag
                    check_restart_flag(shutdown_event)

                    # 检查停止事件
                    if shutdown_event.is_set():
                        break

        # 保持一定数量进程
        pool = []
        while not shutdown_event.is_set():
            for p in pool:
                if not p.is_alive():
                    p.join()
                    pool.remove(p)

            while len(pool) < pool_size:
                p = multiprocessing.Process(target=func_wrap, args=[ global_context ])
                p.start()
                pool.append(p)

            # 心跳
            heartbeat()

            # 检查关机 Flag
            check_restart_flag(shutdown_event)

            # 等待
            time.sleep(1)

        # 清理
        for p in pool:
            p.join()

    except redis.exceptions.ConnectionError as e:
        LOGGER.error(f'Redis: {repr(e)}')
        LOGGER.error('Redis connection error, system will restart soon...')
        shutdown_event.set()

        # Redis 故障需要自动重启
        toolkit.sys_exit_restart()

    except KeyboardInterrupt as e:
        LOGGER.warning('Interrupted by Ctrl + C, system exit')
        shutdown_event.set()

        # 键盘打断正常退出
        toolkit.sys_exit_ok()

    except Exception as e:
        for line in traceback.format_exc().splitlines():
            LOGGER.error(line)

        LOGGER.error(f'System: {repr(e)}')
        LOGGER.error(f'Unexpected error occured, system exit')

        shutdown_event.set()

        # 其他错误退出
        toolkit.sys_exit_error()

    else:
        # 无错误结束需要自动重启
        LOGGER.info('System ended, system will restart soon...')
        toolkit.sys_exit_restart()
