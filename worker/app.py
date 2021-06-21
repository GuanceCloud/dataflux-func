# -*- coding: utf-8 -*-

# Builtin Modules
import os
import sys
import socket
import simplejson as json
import logging
import time

# 3rd-party Modules
from celery import Celery, signals
import redis
import psutil

# Project Modules
from worker.utils import yaml_resources, toolkit

# Configure
print_detail = sys.argv[0] == '_celery.py'

base_path  = os.path.dirname(os.path.abspath(__file__))
CONFIG     = yaml_resources.load_config(os.path.join(base_path, '../config.yaml'), print_detail=print_detail)
ROUTE      = yaml_resources.load_file('ROUTE', os.path.join(base_path, '../server/route.yaml'))
IMAGE_INFO = yaml_resources.load_file('IMAGE_INFO', os.path.join(base_path, '../image-info.json'))

WORKER_ID = toolkit.gen_time_serial_seq()

# For monitor
MAIN_PROCESS = psutil.Process()
MAIN_PROCESS.cpu_percent(interval=1)

CHILD_PROCESS_MAP = {} # PID -> Process

MONITOR_HEARTBEAT_TIMESTAMP       = 0
MONITOR_SYS_STATS_CHECK_TIMESTAMP = 0

from worker.app_init import before_app_create, after_app_created

# Disable InsecureRequestWarning
import requests
from requests.packages.urllib3.exceptions import InsecureRequestWarning
requests.packages.urllib3.disable_warnings(InsecureRequestWarning)

# Celery
before_app_create()

app = Celery(quiet=True)
app.config_from_object('worker.celeryconfig')

# Redis config
redis_auth_part = ''
if CONFIG['REDIS_PASSWORD']:
    redis_auth_part = ':{}@'.format(CONFIG['REDIS_PASSWORD'])

redis_url = 'redis://{}{}:{}/{}'.format(
    redis_auth_part,
    CONFIG['REDIS_HOST'],
    CONFIG['REDIS_PORT'],
    CONFIG['REDIS_DATABASE'])

app.conf.update(broker_url=redis_url, result_backend=redis_url)

# Redis helper
from worker.utils.log_helper import LogHelper
from worker.utils.extra_helpers import RedisHelper
WORKER_LOGGER = LogHelper()
REDIS_HELPER = RedisHelper(logger=WORKER_LOGGER)
REDIS_HELPER.skip_log = True

def heartbeat():
    current_timestamp = int(time.time())

    global MAIN_PROCESS
    global CHILD_PROCESSES
    global MONITOR_HEARTBEAT_TIMESTAMP
    global MONITOR_SYS_STATS_CHECK_TIMESTAMP

    # Record worker count
    if current_timestamp - MONITOR_HEARTBEAT_TIMESTAMP > CONFIG['_MONITOR_HEARTBEAT_INTERVAL']:
        MONITOR_HEARTBEAT_TIMESTAMP = current_timestamp

        # Get queue list
        _Q_flag = '-Q'

        # Record worker count
        worker_queues = []
        if _Q_flag in sys.argv:
            worker_queues = sys.argv[sys.argv.index(_Q_flag) + 1].split(',')
            worker_queues = list(map(lambda x: x.split('@').pop(), worker_queues))
            worker_queues.sort()
        else:
            worker_queues = [str(i) for i in range(CONFIG['_WORKER_QUEUE_COUNT'])]

        _expires = CONFIG['_MONITOR_HEARTBEAT_INTERVAL'] * 2
        for q in worker_queues:
            cache_key = toolkit.get_cache_key('heartbeat', 'workerOnQueue', tags=['workerId', WORKER_ID, 'workerQueue', q])
            REDIS_HELPER.setex(cache_key, _expires, 'x')

            cache_pattern = toolkit.get_cache_key('heartbeat', 'workerOnQueue', tags=['workerId', '*', 'workerQueue', q])
            found_workers = REDIS_HELPER.keys(cache_pattern)

            cache_key = toolkit.get_cache_key('heartbeat', 'workerOnQueueCount', tags=['workerQueue', q])
            REDIS_HELPER.setex(cache_key, _expires, len(found_workers))

    # Record CPU/Memory
    if current_timestamp - MONITOR_SYS_STATS_CHECK_TIMESTAMP > CONFIG['_MONITOR_SYS_STATS_CHECK_INTERVAL']:
        MONITOR_SYS_STATS_CHECK_TIMESTAMP = current_timestamp

        if MAIN_PROCESS:
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

            cache_key = toolkit.get_server_cache_key('monitor', 'sysStats', ['metric', 'workerCPUPercent', 'hostname', hostname]);
            REDIS_HELPER.ts_add(cache_key, total_cpu_percent, timestamp=current_timestamp)

            cache_key = toolkit.get_server_cache_key('monitor', 'sysStats', ['metric', 'workerMemoryPSS', 'hostname', hostname]);
            REDIS_HELPER.ts_add(cache_key, total_memory_pss, timestamp=current_timestamp)

@signals.worker_ready.connect
def on_worker_ready(*args, **kwargs):
    after_app_created(app)

    print('Celery logging disabled')
    print('Celery is running (Press CTRL+C to quit)')
    print('Have fun!')

@signals.heartbeat_sent.connect
def on_heartbeat_sent(*args, **kwargs):
    heartbeat()

heartbeat()
