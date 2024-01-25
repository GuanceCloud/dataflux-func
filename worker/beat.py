# -*- coding: utf-8 -*-

# Built-in Modules
import os
import time

# 3rd-party Modules
import timeout_decorator

# Disable InsecureRequestWarning
import requests
from requests.packages.urllib3.exceptions import InsecureRequestWarning
requests.packages.urllib3.disable_warnings(InsecureRequestWarning)

# Project Modules
from worker.utils import yaml_resources, toolkit

# Init
from worker.app_init import before_app_create, after_app_created
before_app_create()

CONFIG = yaml_resources.get('CONFIG')

from worker import LOGGER, REDIS, run_background

# 系统定时任务
from worker.tasks.example import ExampleSuccess
from worker.tasks.crontab_starter import CrontabStarter
from worker.tasks.internal import SystemMetric, FlushDataBuffer, AutoClean, AutoBackupDB, ReloadDataMD5Cache

SYSTEM_CRONTAB = [
    # {
    #     # 示例
    #     'task'   : ExampleSuccess,
    #     'crontab': '*/3 * * * * *',
    # },
    {
        # 自动触发配置启动器
        'task'   : CrontabStarter,
        'crontab': CONFIG['_CRONTAB_STARTER'],
    },
    {
        # 系统指标
        'task'   : SystemMetric,
        'crontab': CONFIG['_CRONTAB_SYSTEM_METRIC'],
    },
    {
        # 缓存数据刷入数据库
        'task'   : FlushDataBuffer,
        'crontab': CONFIG['_CRONTAB_FLUSH_DATA_BUFFER'],
    },
    {
        # 自动清理
        'task'   : AutoClean,
        'crontab': CONFIG['_CRONTAB_AUTO_CLEAN'],
    },
    {
        # 数据库自动备份
        'task'   : AutoBackupDB,
        'crontab': CONFIG['_CRONTAB_AUTO_BACKUP_DB'],
    },
    {
        # 重新加载数据 MD5 缓存
        'task'   : ReloadDataMD5Cache,
        'crontab': CONFIG['_CRONTAB_RELOAD_DATA_MD5_CACHE'],
        'kwargs' : { 'lockTime': 15, 'all': True },
    },
]

def get_matched_crontab_task_instances(t):
    result = []
    for item in SYSTEM_CRONTAB:
        if not toolkit.is_valid_crontab(item['crontab']):
            continue

        if toolkit.is_match_crontab(item['crontab'], t, tz=CONFIG['TIMEZONE']):
            task_inst = item['task'](kwargs=item.get('kwargs'), trigger_time=t)
            result.append(task_inst)

    return result

class TickTimeoutException(Exception):
    pass

@timeout_decorator.timeout(60, timeout_exception=TickTimeoutException)
def tick():
    '''
    定时触发器（每秒触发）

    1. 获取已注册的，当前时间满足 Crontab 表达式的任务
    2. 到达执行时间的延迟任务进入工作队列
    '''
    # 计算等待时长
    interval = 1
    wait_time = interval - toolkit.get_timestamp() % interval
    time.sleep(wait_time)

    # 触发时间
    tick_time = toolkit.get_timestamp()

    # 记录运行时间
    REDIS.incr(toolkit.get_cache_key('beat', 'tick'))

    # 分发配置了 Crontab 的任务
    task_instances = get_matched_crontab_task_instances(tick_time)
    for task_inst in task_instances:
        # 创建任务请求
        task_req = task_inst.create_task_request()
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
            cache_res = REDIS.zpop_below_lpush(src_cache_key, dest_cache_key, tick_time)
            if not cache_res:
                break

if __name__ == '__main__':
    # 打印提示信息
    pid = os.getpid()

    print(f'Beat is running (Press CTRL+C to quit)')
    print(f'PID: {pid}')
    print('Have fun!')

    # 启动任务
    after_app_created()

    # 启动后台
    run_background(func=tick, pool_size=1, max_tasks=3600)
