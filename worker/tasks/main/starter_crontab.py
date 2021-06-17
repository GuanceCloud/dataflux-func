# -*- coding: utf-8 -*-

'''
定时处理任务启动器
主要根据自动触发配置加载任务，然后启动func_runner
'''

# Builtin Modules
import time
import json
import traceback

# 3rd-party Modules
import arrow
from croniter import croniter
import six
import ujson

# Project Modules
from worker import app
from worker.utils import toolkit, yaml_resources
from worker.tasks import gen_task_id, webhook

# Current Module
from worker.tasks import BaseTask
from worker.tasks.main.func_runner import func_runner

CONFIG = yaml_resources.get('CONFIG')

class StarterCrontabTask(BaseTask):
    # Crontab过滤器 - 向前筛选
    def check_crontab_config(self, trigger_time, crontab_config, quick_check_map=None):
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

        # 没有表达式的，不需要执行
        if not crontab_expr:
            return False, None

        # 通过快速检查表判断是否需要执行
        if crontab_expr in quick_check_map:
            return quick_check_map[crontab_expr]

        # 错误的表达式，不需要执行
        if not croniter.is_valid(crontab_expr):
            return False, crontab_expr

        # 正常判断是否需要执行
        now = arrow.get(trigger_time + 1).to('Asia/Shanghai').datetime
        crontab_iter = croniter(crontab_expr, now)

        start_time = int(crontab_iter.get_prev())
        is_satisfied = start_time >= trigger_time

        return is_satisfied, crontab_expr

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
                'id'            : 'cron-AUTORUN-{}'.format(f['id']),
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

@app.task(name='Main.StarterCrontab', bind=True, base=StarterCrontabTask)
def starter_crontab(self, *args, **kwargs):
    self.logger.info('Crontab Starter Task launched.')

    # 注：需要等待1秒，确保不会在整点运行，导致跳回上一触发点
    time.sleep(1)

    # 计算当前触发点
    now = arrow.get().to('Asia/Shanghai').datetime
    crontab_iter = croniter(CONFIG['_CRONTAB_STARTER'], now)
    trigger_time = int(crontab_iter.get_prev())
    current_time = int(time.time())

    # 获取函数功能集成自动触发
    integrated_crontab_configs = self.get_integrated_func_crontab_configs()

    # 循环获取需要执行的自动触发配置
    next_seq = 0
    quick_check_map = {}
    while next_seq is not None:
        crontab_configs, next_seq = self.fetch_crontab_configs(next_seq)

        # 第一轮查询时，加入功能集成中自动执行的函数
        if integrated_crontab_configs:
            crontab_configs = integrated_crontab_configs + crontab_configs
            integrated_crontab_configs = None

        # 分发任务
        for c in crontab_configs:
            # 检测Crontab执行时间
            is_satisfied, crontab_expr = self.check_crontab_config(trigger_time, c, quick_check_map)

            # 缓存Crontab表达式检测结果
            if crontab_expr:
                quick_check_map[crontab_expr] = is_satisfied

            # 未满足要求的跳过
            if not is_satisfied:
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
            func_runner.apply_async(
                    task_id=task_id,
                    kwargs=task_kwargs,
                    headers=task_headers,
                    queue=queue,
                    soft_time_limit=soft_time_limit,
                    time_limit=time_limit,
                    expires=expires)
