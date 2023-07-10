# -*- coding: utf-8 -*-

# Built-in Modules
import re
import math

# 3rd-party Modules
import psutil
import kombu
from celery.schedules import crontab as celery_crontab

# Project Modules
from worker.utils import yaml_resources, toolkit

CONFIG = yaml_resources.get('CONFIG')

imports = [
    'worker.tasks.webhook',
    'worker.tasks.internal',

    'worker.tasks.example',
    'worker.tasks.main',
]

# Broker
broker_connection_retry = False
broker_connection_max_retries = 5
broker_transport_options = {
    'priority_steps'        : list(range(4)), # 0 = system, 1 = high, 2 = medium, 3 = low
    'queue_order_strategy'  : 'priority',
    'socket_timeout'        : 10,
    'socket_connect_timeout': 10,
}

redis_backend_health_check_interval = 10
redis_socket_connect_timeout        = 10
redis_socket_timeout                = 10
redis_retry_on_timeout              = True
redis_socket_keepalive              = True

# Worker
worker_pool_restarts = True

worker_concurrency = CONFIG['_WORKER_CONCURRENCY']
if worker_concurrency == 'auto':
    memory_gb = math.ceil(psutil.virtual_memory().total / 1024 / 1024 / 1024)
    if memory_gb < 3:
        worker_concurrency = 3
    elif memory_gb > 10:
        worker_concurrency = 10
    else:
        worker_concurrency = memory_gb

worker_prefetch_multiplier = CONFIG['_WORKER_PREFETCH_MULTIPLIER']
worker_max_tasks_per_child = CONFIG['_WORKER_MAX_TASKS_PER_CHILD']

# Worker log
worker_hijack_root_logger  = False
worker_log_color           = False
worker_redirect_stdouts    = False

# Queue
task_queues = []
for i in range(int(CONFIG['_WORKER_QUEUE_COUNT'])):
    worker_queue = toolkit.get_worker_queue(i)
    kombu_queue  = kombu.Queue(worker_queue, routing_key=worker_queue)
    task_queues.append(kombu_queue)

task_default_queue       = task_queues[0].name
task_default_routing_key = task_queues[0].name

# Job serialization
task_serializer   = 'json'
result_serializer = 'json'
accept_content    = ['json']

# Time zone
enable_utc = True
timezone   = 'Asia/Shanghai'

# Result
result_expires = CONFIG['_WORKER_RESULT_EXPIRES']

# Beat
def create_schedule(crontab_expr):
    splited = crontab_expr.split(' ')
    kwargs = {
        'minute'       : splited[0],
        'hour'         : splited[1],
        'day_of_month' : splited[2],
        'month_of_year': splited[3],
        'day_of_week'  : splited[4],
    }
    return celery_crontab(**kwargs)


beat_schedule = {
    # 自动触发配置启动器
    'run-crontab-starter': {
        'task'    : 'Biz.CrontabStarter',
        'schedule': create_schedule(CONFIG['_CRONTAB_STARTER']),
    },

    # 缓存数据刷入数据库
    'run-sync-cache': {
        'task'    : 'Sys.SyncCache',
        'schedule': create_schedule(CONFIG['_CRONTAB_SYNC_CACHE']),
    },

    # 自动清理
    'run-auto-clean': {
        'task'    : 'Sys.AutoClean',
        'schedule': create_schedule(CONFIG['_CRONTAB_AUTO_CLEAN']),
    },

    # 数据库自动备份
    'run-auto-backup-db': {
        'task'    : 'Sys.AutoBackupDB',
        'schedule': create_schedule(CONFIG['_CRONTAB_AUTO_BACKUP_DB']),
    },

    # 工作队列压力恢复
    'run-reset-worker-queue-pressure': {
        'task'    : 'Sys.ResetWorkerQueuePressure',
        'schedule': create_schedule(CONFIG['_CRONTAB_RESET_WORKER_QUEUE_PRESSURE']),
    },

    # 重新加载数据 MD5 缓存
    'run-reload-data-md5-cache': {
        'task'    : 'Sys.ReloadDataMD5Cache',
        'kwargs'  : { 'lockTime': 15, 'all': True },
        'schedule': create_schedule(CONFIG['_CRONTAB_RELOAD_DATA_MD5_CACHE']),
    },
}

##### 功能关闭 #####

# 关闭数据库自动备份
if CONFIG['_DISABLE_DB_AUTO_BACKUP']:
    beat_schedule.pop('run-auto-backup-db', None)

##### 系统任务默认最高优先级 #####
for t, opt in beat_schedule.items():
    if 'options' not in opt:
        opt['options'] = {}

    opt['options']['priority'] = 0
