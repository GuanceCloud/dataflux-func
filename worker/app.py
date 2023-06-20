# -*- coding: utf-8 -*-

# Built-in Modules
import os
import sys
import socket
import simplejson as json
import logging
import time
import ssl
import urllib

# 3rd-party Modules
from celery import Celery, signals
import redis
import psutil

# Project Modules
from worker.utils import yaml_resources, toolkit

# Configure
BASE_PATH  = os.path.dirname(os.path.abspath(__file__))
CONFIG     = yaml_resources.load_config(os.path.join(BASE_PATH, '../config.yaml'))
CONST      = yaml_resources.load_file('CONST', os.path.join(BASE_PATH, '../const.yaml'))
IMAGE_INFO = yaml_resources.load_file('IMAGE_INFO', os.path.join(BASE_PATH, '../image-info.json'))

WORKER_ID     = toolkit.gen_time_serial_seq()
WORKER_QUEUES = None

# For monitor
MAIN_PROCESS = None

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
redis_auth = ''
if CONFIG['REDIS_PASSWORD']:
    redis_auth = f":{urllib.parse.quote(CONFIG['REDIS_PASSWORD'])}@"

redis_schema = 'redis://'
ssl_options  = None
if CONFIG['REDIS_USE_TLS']:
    redis_schema = 'rediss://'
    ssl_options = {
        'ssl_cert_reqs': ssl.CERT_NONE,
    }

redis_url = f"{redis_schema}{redis_auth}{CONFIG['REDIS_HOST']}:{CONFIG['REDIS_PORT']}/{CONFIG['REDIS_DATABASE']}"

app.conf.update(
    broker_url=redis_url,
    broker_use_ssl=ssl_options,
    result_backend=redis_url,
    redis_backend_use_ssl=ssl_options)

# Logger
from worker.utils.log_helper import LogHelper
WORKER_LOGGER = LogHelper()

# Redis helper
from worker.utils.extra_helpers import RedisHelper
REDIS_HELPER = RedisHelper(logger=WORKER_LOGGER)
REDIS_HELPER.skip_log = True

# MySQL helper
from worker.utils.extra_helpers import MySQLHelper
MYSQL_HELPER = MySQLHelper(logger=WORKER_LOGGER)
MYSQL_HELPER.skip_log = True

# Collect worker queues
if 'worker' in sys.argv:
    QUEUES_FLAG = '--queues'
    if QUEUES_FLAG in sys.argv:
        WORKER_QUEUES = sys.argv[sys.argv.index(QUEUES_FLAG) + 1].split(',')
        WORKER_QUEUES = list([ q.split('@')[1] for q in WORKER_QUEUES ])
    else:
        WORKER_QUEUES = list([ str(q) for q in range(CONFIG['_WORKER_QUEUE_COUNT']) ])

    listening_queues = ', '.join(map(lambda q: f'#{q}', WORKER_QUEUES))
    print(f'Worker is listening on queues [ {listening_queues} ] (Press CTRL+C to quit)')
    print(f'PID: {os.getpid()}')
    print('Have fun!')

    after_app_created(app)

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

@signals.heartbeat_sent.connect
def on_heartbeat_sent(**kwargs):
    heartbeat()
