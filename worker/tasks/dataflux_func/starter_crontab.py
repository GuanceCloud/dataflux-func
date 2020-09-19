# -*- coding: utf-8 -*-

'''
定时处理任务启动器
主要根据自动触发配置加载任务，然后启动runner
'''

# Builtin Modules
import time
import json
import traceback

# 3rd-party Modules
import arrow
import crontab as crontab_parser
import six
import ujson

# Project Modules
from worker import app
from worker.utils import toolkit, yaml_resources
from worker.tasks import gen_task_id, webhook

# Current Module
from worker.tasks import BaseTask
from worker.tasks.dataflux_func.runner import dataflux_func_runner

CONFIG = yaml_resources.get('CONFIG')

class DataFluxFuncStarterCrontabTask(BaseTask):
    def fetch_crontab_configs(self, current_tick_timestamp, next_seq=None):
        '''
        获取自动触发配置（附带按照crontab语法过滤）
        '''
        now = arrow.get().to('Asia/Shanghai').datetime
        if next_seq is None:
            next_seq = 0

        # Crontab过滤器 - 向前筛选
        def crontab_filter(item):
            '''
            Crontab执行时机过滤函数

            算法描述如下：

            上一触发点(-T)                当前触发点(0)
            |                             |
            |                             |  +---------> Starter启动点
            |                             |  |
            +++++++++++++++++++++++++++++++++++++++
            |                             |  |
            |                             +--+--> 范围内启动点
            |
            +---------------------------------> 范围外启动点

            即：只有启动点大于等于当前触发点的才需要执行
            '''
            crontab_expr = item['crontab']
            if item.get('funcExtraConfig') and item['funcExtraConfig'].get('fixedCrontab'):
                crontab_expr = item['funcExtraConfig']['fixedCrontab']

            if not crontab_expr:
                return False

            try:
                parsed_crontab = crontab_parser.CronTab(crontab_expr)
            except Exception as e:
                return False
            else:
                start_timestamp = int(parsed_crontab.previous(delta=False, now=now))
                return start_timestamp >= current_tick_timestamp

        sql = '''
            SELECT
                 `cron`.`seq`
                ,`cron`.`id`
                ,`cron`.`funcId`
                ,`cron`.`funcCallKwargsJSON`
                ,`cron`.`crontab`
                ,`cron`.`saveResult`

                ,`func`.`id`              AS `funcId`
                ,`func`.`extraConfigJSON` AS `funcExtraConfigJSON`

            FROM `biz_main_crontab_config` AS `cron`

            JOIN `biz_main_func` AS `func`
                ON `cron`.`funcId` = `func`.`id`

            WHERE
                    `cron`.`seq`        > ?
                AND `cron`.`isDisabled` = FALSE
                AND IFNULL(UNIX_TIMESTAMP(`cron`.`expireTime`) > UNIX_TIMESTAMP(), TRUE)

            LIMIT 100
            '''
        sql_params = [next_seq]
        crontab_configs = self.db.query(sql, sql_params)

        latest_seq = None
        if len(crontab_configs) > 0:
            latest_seq = crontab_configs[-1]['seq']

        # 准备配置详情
        for c in crontab_configs:
            func_call_kwargs_json = c.get('funcCallKwargsJSON')
            if func_call_kwargs_json:
                c['funcCallKwargs'] = ujson.loads(func_call_kwargs_json)
            else:
                c['funcCallKwargs'] = {}

            func_extra_config_json = c.get('funcExtraConfigJSON')
            if func_extra_config_json:
                c['funcExtraConfig'] = ujson.loads(func_extra_config_json)
            else:
                c['funcExtraConfig'] = {}

            if c.get('saveResult'):
                c['saveResult'] = True
            else:
                c['saveResult'] = False

        # 根据执行频率，筛选出本轮需要执行的脚本
        crontab_configs = list(filter(crontab_filter, crontab_configs))

        return crontab_configs, latest_seq

    def cache_task_status(self, crontab_id, task_id, func_id):
        if not crontab_id:
            return

        cache_key = toolkit.get_cache_key('syncCache', 'taskInfo')

        data = {
            'taskId'   : task_id,
            'origin'   : 'crontab',
            'originId' : crontab_id,
            'funcId'   : func_id,
            'status'   : 'queued',
            'timestamp': int(time.time()),
        }
        data = toolkit.json_safe_dumps(data, indent=0)

        self.cache_db.run('lpush', cache_key, data)

@app.task(name='DataFluxFunc.starterCrontab', bind=True, base=DataFluxFuncStarterCrontabTask)
def dataflux_func_starter_crontab(self, *args, **kwargs):
    self.logger.info('DataFluxFunc Crontab Starter Task launched.')

    # 注：需要等待1秒，确保不会在整点运行，导致跳回上一触发点
    time.sleep(1)

    # 计算当前触发点
    now = arrow.get().to('Asia/Shanghai').datetime
    starter_crontab = crontab_parser.CronTab(CONFIG['_CRONTAB_STARTER'])
    trigger_time = int(starter_crontab.previous(delta=False, now=now))

    # 循环获取需要执行的自动触发配置
    current_timestamp = int(time.time())
    next_seq = 0
    while next_seq is not None:
        crontab_configs, next_seq = self.fetch_crontab_configs(trigger_time, next_seq)

        # 分发任务
        for c in crontab_configs:
            queue = toolkit.get_worker_queue('runnerOnCrontab')

            task_headers = {
                'origin': '{}-{}'.format(c['id'], current_timestamp) # 来源标记为「<自动触发配置ID>-<时间戳>」
            }

            # 自动触发锁，防止同一个自动触发配置任务存在多个在任务中
            lock_key   = toolkit.get_cache_key('lock', 'CrontabConfig', ['crontabConfigId', c['id']])
            lock_value = toolkit.gen_uuid()

            task_kwargs = {
                'funcId'         : c['funcId'],
                'funcCallKwargs' : c['funcCallKwargs'],
                'origin'         : 'crontab',
                'originId'       : c['id'],
                'saveResult'     : c['saveResult'],
                'execMode'       : 'crontab',
                'triggerTime'    : trigger_time,
                'crontab'        : c['crontab'],
                'crontabConfigId': c['id'],
                'lockKey'        : lock_key,
                'lockValue'      : lock_value,
            }

            soft_time_limit = CONFIG['_FUNC_TASK_DEFAULT_TIMEOUT']
            time_limit      = CONFIG['_FUNC_TASK_DEFAULT_TIMEOUT'] + CONFIG['_FUNC_TASK_EXTRA_TIMEOUT_TO_KILL']

            func_timeout = None
            if c['funcExtraConfig'] and isinstance(c['funcExtraConfig'].get('timeout'), (six.integer_types, float)):
                func_timeout = c['funcExtraConfig']['timeout']

                soft_time_limit = func_timeout
                time_limit      = func_timeout + CONFIG['_FUNC_TASK_EXTRA_TIMEOUT_TO_KILL']

            _shift_seconds = int(soft_time_limit * CONFIG['_FUNC_TASK_DEFAULT_TIMEOUT_TO_EXPIRE_SCALE'])
            expires = arrow.get().shift(seconds=_shift_seconds).datetime

            if not self.cache_db.lock(lock_key, lock_value, time_limit):
                # 触发任务前上锁，失败则跳过
                continue

            task_id = gen_task_id()

            # 记录任务信息（入队）
            self.cache_task_status(c['id'], task_id,
                    func_id=c['funcId'])

            # 任务入队
            dataflux_func_runner.apply_async(
                    task_id=task_id,
                    kwargs=task_kwargs,
                    headers=task_headers,
                    queue=queue,
                    soft_time_limit=soft_time_limit,
                    time_limit=time_limit,
                    expires=expires)
