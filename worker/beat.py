# -*- coding: utf-8 -*-

# Built-in Modules
import os
import time
import math

# 3rd-party Modules
import arrow
import timeout_decorator

# Disable InsecureRequestWarning
import requests
from requests.packages.urllib3.exceptions import InsecureRequestWarning
requests.packages.urllib3.disable_warnings(InsecureRequestWarning)

# Project Modules
from worker.utils import yaml_resources, toolkit

# Init
from worker import app_init

CONFIG = yaml_resources.get('CONFIG')

from worker import LOGGER, REDIS, run_background

# 系统定时任务
from worker.tasks.example          import ExampleSuccess
from worker.tasks.cron_job_starter import CronJobStarter
from worker.tasks.internal         import SystemMetric, FlushDataBuffer, AutoClean, AutoBackupDB, ReloadDataMD5Cache, UpdateWorkerQueueLimit

BEAT_MASTER_LOCK_KEY   = None
BEAT_MASTER_LOCK_VALUE = None

SYSTEM_TASKS_META = [
    # {
    #     # 示例
    #     'class'   : ExampleSuccess,
    #     'cronExpr': '*/3 * * * * *',
    # },
    {
        # Cron 任务启动器
        'class'   : CronJobStarter,
        'cronExpr': CONFIG['_CRON_EXPR_CRON_JOB_STARTER'],
    },
    {
        # 系统指标
        'class'   : SystemMetric,
        'cronExpr': CONFIG['_CRON_EXPR_SYSTEM_METRIC'],
        'delay'   : 5,
    },
    {
        # 缓存数据刷入数据库
        'class'   : FlushDataBuffer,
        'cronExpr': CONFIG['_CRON_EXPR_FLUSH_DATA_BUFFER'],
    },
    {
        # 自动清理
        'class'   : AutoClean,
        'cronExpr': CONFIG['_CRON_EXPR_AUTO_CLEAN'],
    },
    {
        # 数据库自动备份
        'class'   : AutoBackupDB,
        'cronExpr': CONFIG['_CRON_EXPR_AUTO_BACKUP_DB'],
    },
    {
        # 重新加载数据 MD5 缓存
        'class'   : ReloadDataMD5Cache,
        'cronExpr': CONFIG['_CRON_EXPR_RELOAD_DATA_MD5_CACHE'],
        'kwargs'  : { 'lockTime': 15, 'all': True },
    },
    {
        # 针对定时任务的工作队列长度限制
        'class'   : UpdateWorkerQueueLimit,
        'cronExpr': CONFIG['_CRON_EXPR_UPDATE_WORKER_QUEUE_LIMIT'],
    },
]

def is_master_beat():
    REDIS.lock(BEAT_MASTER_LOCK_KEY, BEAT_MASTER_LOCK_VALUE, CONFIG['_BEAT_LOCK_EXPIRE'])

    try:
        REDIS.extend_lock_time(BEAT_MASTER_LOCK_KEY, BEAT_MASTER_LOCK_VALUE, CONFIG['_BEAT_LOCK_EXPIRE'])
    except Exception as e:
        # 锁为其他进程获得
        return False
    else:
        # 成功续租锁
        return True

def create_system_tasks(t):
    tasks = []
    for meta in SYSTEM_TASKS_META:
        if not toolkit.is_valid_cron_expr(meta['cronExpr']):
            continue

        if toolkit.is_match_cron_expr(meta['cronExpr'], t, tz=CONFIG['TIMEZONE']):
            task = meta['class'](kwargs=meta.get('kwargs'), trigger_time=t, delay=meta.get('delay'), queue=meta.get('queue'))
            tasks.append(task)

    return tasks

class TickTimeout(Exception):
    pass

@timeout_decorator.timeout(60, timeout_exception=TickTimeout)
def tick(context):
    '''
    定时触发器（每秒触发）

    1. 获取已注册的，当前时间满足 Cron 表达式的任务
    2. 到达执行时间的延迟任务进入工作队列
    '''
    now = time.time()
    next_timestamp = math.ceil(now)

    # 等待到整点
    if next_timestamp > now:
        time.sleep(next_timestamp - now)

    # 触发时间
    prev_tick_time = context.get('prev_tick_time') or (next_timestamp - 1)
    for tick_time in range(prev_tick_time, next_timestamp):
        tick_time += 1

        # 记录上次运行时间
        context['prev_tick_time'] = tick_time

        # 防止多个 Beat 副本重复触发
        if not is_master_beat():
            continue

        # 执行系统任务
        tasks = create_system_tasks(tick_time)
        for t in tasks:
            # 创建任务请求
            task_req = t.create_task_request()
            task_req_dumps = toolkit.json_dumps(task_req, ignore_nothing=True, indent=None)

            # 任务入队
            if task_req['delay']:
                # 延迟任务
                delay_queue = toolkit.get_delay_queue(task_req['queue'])
                eta = task_req['triggerTime'] + task_req['delay']
                REDIS.zadd(delay_queue, { task_req_dumps: eta })

            else:
                # 立即任务
                worker_queue = toolkit.get_worker_queue(task_req['queue'])
                REDIS.push(worker_queue, task_req_dumps)

        # 延迟任务进入工作队列
        for queue in range(CONFIG['_WORKER_QUEUE_COUNT']):
            src_cache_key  = toolkit.get_delay_queue(queue)
            dest_cache_key = toolkit.get_worker_queue(queue)

            while True:
                released_count = REDIS.zpop_below_lpush_all(src_cache_key, dest_cache_key, tick_time)
                if released_count:
                    LOGGER.info(f'[DELAYED] Released {released_count} tasks (Queue #{queue})')
                else:
                    break

def main():
    # 打印提示信息
    pid = os.getpid()

    print(f'Beat is running (Press CTRL+C to quit)')
    print(f'PID: {pid}')
    print('Have fun!')

    # 应用初始化
    app_init.prepare()

    # Beat 锁
    global BEAT_MASTER_LOCK_KEY
    global BEAT_MASTER_LOCK_VALUE
    BEAT_MASTER_LOCK_KEY   = toolkit.get_cache_key('lock', 'beatMaster')
    BEAT_MASTER_LOCK_VALUE = toolkit.gen_rand_string()

    # 启动后台
    run_background(func=tick, max_tasks=3600)

if __name__ == '__main__':
    main()
