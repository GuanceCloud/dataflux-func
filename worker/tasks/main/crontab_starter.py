# -*- coding: utf-8 -*-

'''
定时处理任务启动器
主要根据自动触发配置加载任务，然后启动 func_runner
'''

# Built-in Modules
import time
import traceback

# 3rd-party Modules
import arrow
from croniter import croniter
import six

# Project Modules
from worker.app import app
from worker.utils import toolkit, yaml_resources
from worker.tasks import gen_task_id, webhook

# Current Module
from worker.tasks import BaseTask
from worker.tasks.main.func_runner import func_runner

CONFIG = yaml_resources.get('CONFIG')

class CrontabStarterTask(BaseTask):
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

        if not crontab_expr:
            return False

        if not croniter.is_valid(crontab_expr):
            return False

        now = arrow.get(trigger_time + 1).to('Asia/Shanghai').datetime
        crontab_iter = croniter(crontab_expr, now)

        start_time = int(crontab_iter.get_prev())
        return start_time >= trigger_time

    def prepare_contab_config(self, crontab_config):
        crontab_config['taskOrigin'] = 'crontab'
        crontab_config['execMode']   = 'crontab'

        func_call_kwargs_json = crontab_config.get('funcCallKwargsJSON')
        if func_call_kwargs_json:
            crontab_config['funcCallKwargs'] = toolkit.json_loads(func_call_kwargs_json)
        else:
            crontab_config['funcCallKwargs'] = {}

        func_extra_config_json = crontab_config.get('funcExtraConfigJSON')
        if func_extra_config_json:
            crontab_config['funcExtraConfig'] = toolkit.json_loads(func_extra_config_json)
        else:
            crontab_config['funcExtraConfig'] = {}

        if crontab_config.get('saveResult'):
            crontab_config['saveResult'] = True
        else:
            crontab_config['saveResult'] = False

        try:
            crontab_config['crontab'] = crontab_config['funcExtraConfig'].get('fixedCrontab') or crontab_config['crontab']
        except Exception as e:
            crontab_config['crontab'] = None

        try:
            crontab_config['taskInfoLimit'] = crontab_config['funcExtraConfig'].get('fixedTaskInfoLimit') or crontab_config['taskInfoLimit']
        except Exception as e:
            crontab_config['taskInfoLimit'] = None

        return crontab_config

    def get_integrated_func_crontab_configs(self):
        sql = '''
            SELECT
                 `func`.`id`
                ,`func`.`extraConfigJSON`

            FROM `biz_main_func` AS `func`
            WHERE
                    `func`.`integration` = 'autoRun'
                AND JSON_EXTRACT(`func`.`extraConfigJSON`, '$.integrationConfig.crontab') IS NOT NULL
            '''
        funcs = self.db.query(sql)

        crontab_configs = []
        for f in funcs:
            extra_config_json = f.get('extraConfigJSON')
            if extra_config_json:
                f['extraConfig'] = toolkit.json_loads(extra_config_json)
            else:
                f['extraConfig'] = {}

            crontab_expr = None
            try:
                crontab_expr = f['extraConfig']['integrationConfig']['crontab']
            except Exception as e:
                continue

            c = {
                'seq'            : 0,
                'id'             : 'integration',
                'funcCallKwargs' : {},
                'crontab'        : crontab_expr,
                'saveResult'     : False,
                'funcId'         : f['id'],
                'funcExtraConfig': f['extraConfig'],
                'taskOrigin'     : 'integration',
                'taskInfoLimit'  : CONFIG['_TASK_INFO_DEFAULT_LIMIT_INTEGRATION'],
                'execMode'       : 'crontab',
            }
            crontab_configs.append(c)

        return crontab_configs

    def get_crontab_config(self, crontab_config_id):
        sql = '''
            SELECT
                 `cron`.`seq`
                ,`cron`.`id`
                ,`cron`.`funcCallKwargsJSON`
                ,`cron`.`crontab`
                ,`cron`.`saveResult`
                ,`cron`.`taskInfoLimit`

                ,`func`.`id`              AS `funcId`
                ,`func`.`extraConfigJSON` AS `funcExtraConfigJSON`

            FROM `biz_main_crontab_config` AS `cron`

            JOIN `biz_main_func` AS `func`
                ON `cron`.`funcId` = `func`.`id`

            WHERE
                `cron`.`id` = ?

            LIMIT 1
            '''
        sql_params = [crontab_config_id]
        db_res = self.db.query(sql, sql_params)
        if not db_res:
            return None

        crontab_config = self.prepare_contab_config(db_res[0])

        return crontab_config

    def fetch_crontab_configs(self, next_seq=None):
        if next_seq is None:
            next_seq = 0

        sql = '''
            SELECT
                 `cron`.`seq`
                ,`cron`.`id`
                ,`cron`.`funcCallKwargsJSON`
                ,`cron`.`crontab`
                ,`cron`.`saveResult`
                ,`cron`.`taskInfoLimit`

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
            c = self.prepare_contab_config(c)

        return crontab_configs, latest_seq

    def _get_time_limit(self, crontab_config):
        soft_time_limit = CONFIG['_FUNC_TASK_DEFAULT_TIMEOUT']
        time_limit      = CONFIG['_FUNC_TASK_DEFAULT_TIMEOUT'] + CONFIG['_FUNC_TASK_EXTRA_TIMEOUT_TO_KILL']

        func_timeout = None
        try:
            func_timeout = crontab_config['funcExtraConfig']['timeout']
        except Exception as e:
            pass
        else:
            if isinstance(func_timeout, (six.integer_types, float)) and func_timeout > 0:
                soft_time_limit = func_timeout
                time_limit      = func_timeout + CONFIG['_FUNC_TASK_EXTRA_TIMEOUT_TO_KILL']

        return soft_time_limit, time_limit

    def _get_queue(self, crontab_config):
        specified_queue = None
        try:
            specified_queue = crontab_config['funcExtraConfig']['queue']
        except Exception as e:
            pass

        queue = None
        if specified_queue is None:
            queue = CONFIG['_FUNC_TASK_DEFAULT_CRONTAB_QUEUE']

        else:
            if isinstance(specified_queue, int) and 0 <= specified_queue < CONFIG['_WORKER_QUEUE_COUNT']:
                # 直接指定队列编号
                queue = specified_queue

            else:
                # 指定队列别名
                try:
                    queue_number = int(CONFIG['WORKER_QUEUE_ALIAS_MAP'][specified_queue])
                except Exception as e:
                    # 配置错误，无法解析为队列编号，或队列编号超过范围，使用默认函数队列。
                    # 保证无论如何都有Worker负责执行（实际运行会报错）
                    queue = CONFIG['_FUNC_TASK_DEFAULT_CRONTAB_QUEUE']
                else:
                    # 队列别名转换为队列编号
                    queue = queue_number

        return str(queue)

    def send_task(self, crontab_config, current_time, trigger_time, exec_mode=None, countdown=None):
        exec_mode = exec_mode or crontab_config['execMode']

        # 确定超时时间
        soft_time_limit, time_limit = self._get_time_limit(crontab_config)

        # 确定执行队列
        queue = self._get_queue(crontab_config)

        # 延迟执行支持
        delayed_crontab = None
        try:
            delayed_crontab = crontab_config['funcExtraConfig'].get('delayedCrontab') or [0]
        except Exception as e:
            delayed_crontab = [ 0 ]

        for delay in delayed_crontab:
            # 定时任务锁
            crontab_lock_key = toolkit.get_cache_key('lock', 'CrontabConfig', tags=[
                    'crontabConfigId', crontab_config['id'],
                    'funcId',          crontab_config['funcId'],
                    'execMode',        exec_mode,
                    'crontabDelay',    delay])

            crontab_lock_value = toolkit.gen_uuid()
            if not self.cache_db.lock(crontab_lock_key, crontab_lock_value, time_limit):
                # 触发任务前上锁，失败则跳过
                self.logger.warning('Crontab Config in lock, skip...')
                continue

            # 任务 ID
            task_id = gen_task_id()

            # 计算任务过期时间
            _shift_seconds = int(soft_time_limit * CONFIG['_FUNC_TASK_TIMEOUT_TO_EXPIRE_SCALE'] + delay)
            expires = arrow.get().shift(seconds=_shift_seconds).datetime

            # 任务入队
            task_headers = {
                'origin': '{}-{}'.format(crontab_config['id'], current_time) # 来源标记为「<自动触发配置 ID>-<时间戳>」
            }

            # 注意：
            # 此处「任务的`origin`」与「自动触发配置的`origin`」不同
            # 「任务的`origin`」表示任务来源（取值 authLink, crontab, batch, integration），配合`originId`可确定业务实体
            # 「自动触发配置的`origin`」表示配置来源（取值 API, UI, INTEGRATION）
            task_kwargs = {
                'funcId'          : crontab_config['funcId'],
                'funcCallKwargs'  : crontab_config['funcCallKwargs'],
                'origin'          : crontab_config['taskOrigin'],
                'originId'        : crontab_config['id'],
                'saveResult'      : crontab_config['saveResult'],
                'execMode'        : exec_mode,
                'triggerTime'     : (trigger_time + delay),
                'triggerTimeMs'   : (trigger_time + delay) * 1000,
                'crontab'         : crontab_config['crontab'],
                'crontabDelay'    : delay,
                'queue'           : queue,
                'taskInfoLimit'   : crontab_config['taskInfoLimit'],
                'crontabLockKey'  : crontab_lock_key,
                'crontabLockValue': crontab_lock_value,
            }
            func_runner.apply_async(
                    task_id=task_id,
                    kwargs=task_kwargs,
                    headers=task_headers,
                    queue=toolkit.get_worker_queue(queue),
                    soft_time_limit=soft_time_limit,
                    time_limit=time_limit,
                    expires=expires,
                    countdown=delay or countdown or None)

@app.task(name='Main.CrontabManualStarter', bind=True, base=CrontabStarterTask)
def crontab_manual_starter(self, *args, **kwargs):
    # 执行函数、参数
    crontab_config_id = kwargs.get('crontabConfigId')

    self.logger.info('Main.CrontabManualStarter Task launched: `{}`'.format(crontab_config_id))

    # 计算当前触发点
    trigger_time = int(time.time())
    current_time = int(time.time())

    # 获取需要执行的自动触发配置
    crontab_config = self.get_crontab_config(crontab_config_id)

    self.send_task(crontab_config=crontab_config, current_time=current_time, trigger_time=trigger_time, exec_mode='async')

@app.task(name='Main.CrontabStarter', bind=True, base=CrontabStarterTask)
def crontab_starter(self, *args, **kwargs):
    # 注：需要等待1秒，确保不会在整点运行，导致跳回上一触发点
    time.sleep(1)

    # 计算当前触发点
    now = arrow.get().to('Asia/Shanghai').datetime
    crontab_iter      = croniter(CONFIG['_CRONTAB_STARTER'], now)
    trigger_time      = int(crontab_iter.get_prev())
    next_trigger_time = int(crontab_iter.get_next())
    current_time      = int(time.time())

    # 上锁
    self.lock_task(max_age=next_trigger_time - current_time - 1)

    ### 集成函数自动触发 ###
    integrated_crontab_configs = self.get_integrated_func_crontab_configs()
    for c in integrated_crontab_configs:
        # 跳过未到达触发时间的任务
        if not self.crontab_config_filter(trigger_time, c):
            continue

        # 发送任务
        self.send_task(crontab_config=c, current_time=current_time, trigger_time=trigger_time)

    ### 自动触发配置 ###
    next_seq = 0
    crontab_count = 0
    while next_seq is not None:
        crontab_configs, next_seq = self.fetch_crontab_configs(next_seq)
        for c in crontab_configs:
            # 跳过未到达触发时间的任务
            if not self.crontab_config_filter(trigger_time, c):
                continue

            # 平均分布任务触发事件点
            countdown = 0
            if CONFIG['_FUNC_TASK_DISTRIBUTION_RANGE'] > 0:
                countdown = crontab_count % CONFIG['_FUNC_TASK_DISTRIBUTION_RANGE']

            # 发送任务
            self.send_task(crontab_config=c, current_time=current_time, trigger_time=trigger_time, countdown=countdown)

            # 自动触发配置记述
            crontab_count += 1
