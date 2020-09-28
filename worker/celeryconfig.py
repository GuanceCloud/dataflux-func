# -*- coding: utf-8 -*-

# Builtin Modules
import re

# 3rd-party Modules
from celery.schedules import crontab
from kombu import Queue

# Project Modules
from worker.utils import yaml_resources, toolkit

CONFIG = yaml_resources.get('CONFIG')

def create_queue(queue_name):
    return Queue(queue_name, routing_key=queue_name)

'''
Some fixed Celery configs
'''

# Worker
worker_concurrency         = CONFIG['_WORKER_CONCURRENCY']
worker_prefetch_multiplier = CONFIG['_WORKER_PREFETCH_MULTIPLIER']
worker_max_tasks_per_child = CONFIG['_WORKER_MAX_TASKS_PER_CHILD']

# Worker log
worker_hijack_root_logger  = False
worker_log_color           = False
worker_redirect_stdouts    = False

# Queue
task_default_queue       = toolkit.get_worker_queue('default')
task_default_routing_key = task_default_queue
task_queues = [
    create_queue(task_default_queue),

    create_queue(toolkit.get_worker_queue('webhook')),
    create_queue(toolkit.get_worker_queue('internal')),
    create_queue(toolkit.get_worker_queue('result')),
]

# Task
task_routes = {
    'webhook.*' : {'queue': toolkit.get_worker_queue('webhook')},
    'internal.*': {'queue': toolkit.get_worker_queue('internal')},
    '*.result'  : {'queue': toolkit.get_worker_queue('result')},
}

imports = [
    'worker.tasks.webhook',
    'worker.tasks.internal',

    'worker.tasks.example',
]

# Beat
beat_schedule = {}

# Job serialization
task_serializer   = 'json'
result_serializer = 'json'
accept_content    = ['json']

# Time zone
enable_utc = True
timezone   = 'Asia/Shanghai'

# Result
result_expires = 3600

########## Content for YOUR project below ##########
# Queue
task_queues.extend([
    # Utils 通用队列
    create_queue(toolkit.get_worker_queue('utils')),

    # 调试执行队列（UI调用，execMode=sync）
    create_queue(toolkit.get_worker_queue('runnerOnDebugger')),
    # RPC执行队列（API调用，execMode=sync|async）
    create_queue(toolkit.get_worker_queue('runnerOnRPC')),
    # Crontab执行队列（CronTab触发，execMode=crontab）
    create_queue(toolkit.get_worker_queue('runnerOnCrontab')),
    # Batch执行队列（批处理，execMode=batch）
    create_queue(toolkit.get_worker_queue('runnerOnBatch')),
    # BatchBuiltin执行队列（优先批处理，execMode=batch。主要用于内置日志处理）
    create_queue(toolkit.get_worker_queue('runnerOnBatchVIP')),
])

# Task
imports.append('worker.tasks.dataflux_func')

# Route
task_routes.update({
    'DataFluxFunc.runner'  : {'queue': toolkit.get_worker_queue('runnerOnRPC')},
    'DataFluxFunc.debugger': {'queue': toolkit.get_worker_queue('runnerOnDebugger')},

    'DataFluxFunc.starterCrontab': {'queue': toolkit.get_worker_queue('utils')},

    'DataFluxFunc.reloadScripts'     : {'queue': toolkit.get_worker_queue('utils')},
    'DataFluxFunc.syncCache'         : {'queue': toolkit.get_worker_queue('utils')},
    'DataFluxFunc.autoCleaner'       : {'queue': toolkit.get_worker_queue('utils')},
    'DataFluxFunc.dataSourceChecker' : {'queue': toolkit.get_worker_queue('utils')},
    'DataFluxFunc.dataSourceDebugger': {'queue': toolkit.get_worker_queue('utils')},
    'DataFluxFunc.getSystemConfig'   : {'queue': toolkit.get_worker_queue('utils')},
})

# Beat
import crontab as crontab_parser

starter_crontab = crontab_parser.CronTab(CONFIG['_CRONTAB_STARTER'])
beat_schedule['run-starter-crontab'] = {
    'task'    : 'DataFluxFunc.starterCrontab',
    'schedule': crontab(
                    hour=starter_crontab.matchers.hour.input,
                    minute=starter_crontab.matchers.minute.input),
}

force_reload_scripts_crontab = crontab_parser.CronTab(CONFIG['_CRONTAB_SCRIPT_FORCE_RELOAD'])
beat_schedule['run-force-reload-scripts'] = {
    'task'    : 'DataFluxFunc.reloadScripts',
    'kwargs'  : {
        'force': True,
    },
    'schedule': crontab(
                    hour=force_reload_scripts_crontab.matchers.hour.input,
                    minute=force_reload_scripts_crontab.matchers.minute.input),
}

sync_cache_crontab = crontab_parser.CronTab(CONFIG['_CRONTAB_SYNC_CACHE'])
beat_schedule['run-sync-cache'] = {
    'task'    : 'DataFluxFunc.syncCache',
    'schedule': crontab(
                    hour=sync_cache_crontab.matchers.hour.input,
                    minute=sync_cache_crontab.matchers.minute.input),
}

auto_cleaner_crontab = crontab_parser.CronTab(CONFIG['_CRONTAB_AUTO_CLEANER'])
beat_schedule['run-auto-cleaner'] = {
    'task'    : 'DataFluxFunc.autoCleaner',
    'schedule': crontab(
                    hour=auto_cleaner_crontab.matchers.hour.input,
                    minute=auto_cleaner_crontab.matchers.minute.input),
}
