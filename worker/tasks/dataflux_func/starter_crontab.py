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
    # Crontab过滤器 - 向前筛选
    def crontab_config_filter(self, trigger_time, crontab_config):
        '''
        Crontab执行时机过滤函数

        算法描述如下：

        trigger_time - 1m             trigger_time
        |                             |    实际Starter执行时间（比trigger_time晚1秒，此时计算出trigger_time）
        |                             | 1s |
        |                             |    |
        +-----------------------------+====+------------> Future
        ^                             ^
        |                             |
        |                             start_time（需要执行的Crontab任务）
        |
        start_time（不需要执行的Crontab任务）

        即：只有启动点大于等于当前触发点的才需要执行
        '''
        crontab_expr = crontab_config['crontab']
        try:
            crontab_expr = crontab_config['funcExtraConfig']['fixedCrontab']
        except Exception as e:
            pass

        if not crontab_expr:
            return False

        try:
            parsed_crontab = crontab_parser.CronTab(crontab_expr)
        except Exception as e:
            return False
        else:
            now = arrow.get().to('Asia/Shanghai').datetime
            start_time = int(parsed_crontab.previous(delta=False, now=now))
            return start_time >= trigger_time

    def get_integrated_func_crontab_configs(self):
        sql = '''
            SELECT
                 `func`.`id`
                ,`func`.`extraConfigJSON`
            FROM `biz_main_func` AS `func`
            WHERE
                    `func`.`integration` = 'autoRun'
                AND `func`.`extraConfigJSON`->>'$.integrationConfig.crontab' IS NOT NULL
            '''
        funcs = self.db.query(sql)

        crontab_configs = []
        for f in funcs:
            extra_config_json = f.get('extraConfigJSON')
            if extra_config_json:
                f['extraConfig'] = ujson.loads(extra_config_json)
            else:
                f['extraConfig'] = {}

            crontab_expr = None
            try:
                crontab_expr = f['extraConfig']['integrationConfig']['crontab']
            except Exception as e:
                continue

            c = {
                'id'            : 'cron-INTEGRATION',
                'funcId'        : f['id'],
                'funcCallKwargs': {},
                'saveResult'    : False,
                'crontab'       : crontab_expr,
                'origin'        : 'integration',
                'execMode'      : 'crontab',
            }
            crontab_configs.append(c)

        return crontab_configs

    def fetch_crontab_configs(self, next_seq=None):
        if next_seq is None:
            next_seq = 0

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
            c['origin']   = 'crontab'
            c['execMode'] = 'crontab'

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

        return crontab_configs, latest_seq

    def cache_task_status(self, task_id, crontab_config):
        if not crontab_config:
            return

        cache_key = toolkit.get_cache_key('syncCache', 'taskInfo')

        data = {
            'taskId'   : task_id,
            'origin'   : crontab_config['origin'],
            'originId' : crontab_config['id'],
            'funcId'   : crontab_config['funcId'],
            'execMode' : crontab_config['execMode'],
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
    current_time = int(time.time())

    # 获取函数功能集成自动触发
    integrated_crontab_configs = self.get_integrated_func_crontab_configs()

    # 循环获取需要执行的自动触发配置
    next_seq = 0
    while next_seq is not None:
        crontab_configs, next_seq = self.fetch_crontab_configs(next_seq)

        # 第一轮查询时，加入功能集成中自动执行的函数
        if integrated_crontab_configs:
            crontab_configs = integrated_crontab_configs + crontab_configs
            integrated_crontab_configs = None

        # 分发任务
        for c in crontab_configs:
            # 跳过未到达出发时间的任务
            if not self.crontab_config_filter(trigger_time, c):
                continue

            # 确定执行队列
            specified_queue = None
            try:
                specified_queue = c['funcExtraConfig']['queue']
            except Exception as e:
                pass

            queue = None
            if specified_queue is None:
                queue = toolkit.get_worker_queue(CONFIG['_FUNC_TASK_DEFAULT_CRONTAB_QUEUE'])

            else:
                if isinstance(specified_queue, int) and 0 <= specified_queue < CONFIG['_WORKER_QUEUE_COUNT']:
                    # 直接指定队列编号
                    queue = toolkit.get_worker_queue(specified_queue)

                else:
                    # 指定队列别名
                    try:
                        queue_number = int(CONFIG['WORKER_QUEUE_ALIAS_MAP'][specified_queue])
                    except Exception as e:
                        # 配置错误，无法解析为队列编号，或队列编号超过范围，使用默认函数队列。
                        # 保证无论如何都有Worker负责执行（实际运行会报错）
                        queue = toolkit.get_worker_queue(CONFIG['_FUNC_TASK_DEFAULT_CRONTAB_QUEUE'])
                    else:
                        # 队列别名转换为队列编号
                        queue = toolkit.get_worker_queue(queue_number)

            # 确定超时时间
            soft_time_limit = CONFIG['_FUNC_TASK_DEFAULT_TIMEOUT']
            time_limit      = CONFIG['_FUNC_TASK_DEFAULT_TIMEOUT'] + CONFIG['_FUNC_TASK_EXTRA_TIMEOUT_TO_KILL']

            func_timeout = None
            try:
                func_timeout = c['funcExtraConfig']['timeout']
            except Exception as e:
                pass

            # 存在且正确配置，更新超时时间
            if isinstance(func_timeout, (six.integer_types, float)) and func_timeout > 0:
                soft_time_limit = func_timeout
                time_limit      = func_timeout + CONFIG['_FUNC_TASK_EXTRA_TIMEOUT_TO_KILL']

            # 计算任务过期时间
            _shift_seconds = int(soft_time_limit * CONFIG['_FUNC_TASK_TIMEOUT_TO_EXPIRE_SCALE'])
            expires = arrow.get().shift(seconds=_shift_seconds).datetime

            # 上锁
            lock_key   = toolkit.get_cache_key('lock', 'CrontabConfig', ['crontabConfigId', c['id']])
            lock_value = toolkit.gen_uuid()
            if not self.cache_db.lock(lock_key, lock_value, time_limit):
                # 触发任务前上锁，失败则跳过
                continue

            # 任务ID
            task_id = gen_task_id()

            # 记录任务信息（入队）
            self.cache_task_status(task_id=task_id, crontab_config=c)

            # 任务入队
            task_headers = {
                'origin': '{}-{}'.format(c['id'], current_time) # 来源标记为「<自动触发配置ID>-<时间戳>」
            }
            task_kwargs = {
                'funcId'        : c['funcId'],
                'funcCallKwargs': c['funcCallKwargs'],
                'origin'        : c['origin'],
                'originId'      : c['id'],
                'saveResult'    : c['saveResult'],
                'execMode'      : c['execMode'],
                'triggerTime'   : trigger_time,
                'crontab'       : c['crontab'],
                'queue'         : specified_queue,
                'lockKey'       : lock_key,
                'lockValue'     : lock_value,
            }
            dataflux_func_runner.apply_async(
                    task_id=task_id,
                    kwargs=task_kwargs,
                    headers=task_headers,
                    queue=queue,
                    soft_time_limit=soft_time_limit,
                    time_limit=time_limit,
                    expires=expires)
