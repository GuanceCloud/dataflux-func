# -*- coding: utf-8 -*-

'''
定时处理任务启动器
主要根据自动触发配置加载任务，然后启动 func_runner
'''

# Built-in Modules
import time

# 3rd-party Modules

# Project Modules
from worker.utils import toolkit, yaml_resources
from worker.tasks import BaseTask

CONFIG = yaml_resources.get('CONFIG')

class CrontabStarter(BaseTask):
    name = 'Crontab.Starter'

    default_expires = CONFIG['_CRONTAB_STARTER_TASK_TIMEOUT']
    default_timeout = CONFIG['_CRONTAB_STARTER_TASK_TIMEOUT']

    @property
    def is_paused(self):
        cache_key = toolkit.get_cache_key('temporaryFlag', 'pauseAllCrontabConfigs')
        pause_all_crontab_configs_flag = self.cache_db.get(cache_key)
        return bool(pause_all_crontab_configs_flag)

    def filter_crontab_config(self, crontab_config):
        crontab = crontab_config.get('crontab')
        if not crontab or not toolkit.is_valid_crontab(crontab):
            return False

        timezone = crontab_config.get('timezone') or CONFIG['TIMEZONE']
        return toolkit.is_match_crontab(crontab, self.trigger_time, timezone)

    def prepare_contab_config(self, crontab_config):
        crontab_config['funcCallKwargs'] = crontab_config.get('funcCallKwargsJSON') or {}
        if isinstance(crontab_config['funcCallKwargs'], str):
            crontab_config['funcCallKwargs'] = toolkit.json_loads(crontab_config['funcCallKwargs']) or {}

        crontab_config['funcExtraConfig'] = crontab_config.get('funcExtraConfigJSON') or {}
        if isinstance(crontab_config['funcExtraConfig'], str):
            crontab_config['funcExtraConfig'] = toolkit.json_loads(crontab_config['funcExtraConfig']) or {}

        crontab_config['crontab'] = crontab_config['funcExtraConfig'].get('fixedCrontab') or crontab_config.get('crontab')

        return crontab_config

    def get_integration_crontab_configs(self):
        sql = '''
            SELECT
                 `func`.`id`              AS `funcId`
                ,`func`.`extraConfigJSON` AS `funcExtraConfigJSON`
                ,JSON_UNQUOTE(JSON_EXTRACT(
                    `func`.`extraConfigJSON`,
                    '$.integrationConfig.crontab'
                )) AS `crontab`

            FROM `biz_main_func` AS `func`
            WHERE
                `func`.`integration` = 'autoRun'
            HAVING
                `crontab` IS NOT NULL
            '''
        crontab_configs = self.db.query(sql)

        for c in crontab_configs:
            # 集成 Crontab 使用函数 ID 作为自动触发配置 ID
            c['id']  = f"autoRun.crontab-{c['funcId']}"

        crontab_configs = map(self.prepare_contab_config, crontab_configs)
        crontab_configs = filter(self.filter_crontab_config, crontab_configs)
        return crontab_configs

    def fetch_crontab_configs(self, next_seq):
        sql = '''
            SELECT
                 `cron`.`seq`
                ,`cron`.`id`
                ,`cron`.`funcCallKwargsJSON`
                ,`cron`.`crontab`
                ,`cron`.`taskRecordLimit`

                ,`func`.`id`              AS `funcId`
                ,`func`.`extraConfigJSON` AS `funcExtraConfigJSON`

            FROM `biz_main_crontab_config` AS `cron`

            JOIN `biz_main_func` AS `func`
                ON `cron`.`funcId` = `func`.`id`

            WHERE
                    `cron`.`seq`        > ?
                AND `cron`.`isDisabled` = FALSE
                AND `func`.`id`         IS NOT NULL
                AND IFNULL(UNIX_TIMESTAMP(`cron`.`expireTime`) > UNIX_TIMESTAMP(), TRUE)

            LIMIT ?
            '''
        sql_params = [ next_seq, CONFIG['_CRONTAB_STARTER_FETCH_BULK_COUNT'] ]
        crontab_configs = self.db.query(sql, sql_params)

        # 获取游标
        latest_seq = None
        if len(crontab_configs) > 0:
            latest_seq = crontab_configs[-1]['seq']

        crontab_configs = map(self.prepare_contab_config, crontab_configs)
        crontab_configs = filter(self.filter_crontab_config, crontab_configs)
        return crontab_configs, latest_seq

    def put_tasks(self, tasks, ignore_crontab_delay=False):
        tasks = toolkit.as_array(tasks)
        if not tasks:
            return

        task_reqs = []
        for t in tasks:
            crontab_config = t.get('crontabConfig')
            origin         = t.get('origin')
            origin_id      = t.get('originId')
            delay          = t.get('delay') or 0
            exec_mode      = t.get('execMode', 'crontab')

            # 超时时间 / 过期时间
            timeout = crontab_config['funcExtraConfig'].get('timeout') or CONFIG['_FUNC_TASK_TIMEOUT_DEFAULT']
            expires = timeout

            # 确定执行队列
            queue = crontab_config['funcExtraConfig'].get('queue') or CONFIG['_FUNC_TASK_QUEUE_CRONTAB']

            # Crontab 多次执行
            crontab_delay_list = crontab_config['funcExtraConfig'].get('delayedCrontab')
            crontab_delay_list = toolkit.as_array(crontab_delay_list)
            if not crontab_delay_list or ignore_crontab_delay:
                crontab_delay_list = [ 0 ]

            for crontab_delay in crontab_delay_list:
                # 定时任务锁
                crontab_lock_key = toolkit.get_cache_key('lock', 'CrontabConfig', tags=[
                        'crontabConfigId', crontab_config['id'],
                        'funcId',          crontab_config['funcId'],
                        'execMode',        exec_mode])

                crontab_lock_value = f"{int(time.time())}-{toolkit.gen_uuid()}"

                self.logger.debug(f"[TASK REQ] funcId=`{crontab_config['funcId']}`, origin=`{origin}/{origin_id}`, queue=`{queue}`, crontabDelay=`{crontab_delay}`, delay=`{delay}`")

                # 任务请求
                task_reqs.append({
                    'name': 'Func.Runner',
                    'kwargs': {
                        'funcId'          : crontab_config['funcId'],
                        'funcCallKwargs'  : crontab_config['funcCallKwargs'],
                        'origin'          : origin,
                        'originId'        : origin_id,
                        'crontab'         : crontab_config['crontab'],
                        'crontabDelay'    : crontab_delay,
                        'crontabLockKey'  : crontab_lock_key,   # 后续在 Func.Runner 中锁定 / 解锁
                        'crontabLockValue': crontab_lock_value, # 后续在 Func.Runner 中锁定 / 解锁
                        'crontabExecMode' : exec_mode,
                    },

                    'triggerTime': self.trigger_time,

                    'queue'          : queue,
                    'delay'          : crontab_delay + delay,
                    'timeout'        : timeout,
                    'expires'        : expires,
                    'taskRecordLimit': crontab_config.get('taskRecordLimit'),
                })

        if task_reqs:
            self.cache_db.put_tasks(task_reqs)

    def run(self, **kwargs):
        # 暂停运行
        if self.is_paused:
            self.logger.debug(f"[FLAG] Crontab Configs is paused.")
            return

        # 上锁
        self.lock(max_age=60)

        ### 集成函数自动触发 ###
        tasks = []
        for c in self.get_integration_crontab_configs():
            tasks.append({
                'crontabConfig': c,
                'origin'       : 'integration',
                'originId'     : c['id']
            })

        # 发送任务
        if tasks:
            self.put_tasks(tasks)

        ### 自动触发配置 ###
        next_seq = 0
        while next_seq is not None:
            crontab_configs, next_seq = self.fetch_crontab_configs(next_seq)

            tasks = []
            for c in crontab_configs:
                # 使用 seq 分布任务执行时间
                delay = 0
                if CONFIG['_FUNC_TASK_DISTRIBUTION_RANGE'] > 0:
                    delay = c['seq'] % CONFIG['_FUNC_TASK_DISTRIBUTION_RANGE']

                tasks.append({
                    'crontabConfig': c,
                    'origin'       : 'crontab',
                    'originId'     : c['id'],
                    'delay'        : delay,
                })

            # 发送任务
            if tasks:
                self.put_tasks(tasks)

class CrontabManualStarter(CrontabStarter):
    name = 'Crontab.ManualStarter'

    def get_crontab_config(self, crontab_config_id):
        sql = '''
            SELECT
                 `cron`.`seq`
                ,`cron`.`id`
                ,`cron`.`funcCallKwargsJSON`
                ,`cron`.`crontab`
                ,`cron`.`taskRecordLimit`

                ,`func`.`id`              AS `funcId`
                ,`func`.`extraConfigJSON` AS `funcExtraConfigJSON`

            FROM `biz_main_crontab_config` AS `cron`

            JOIN `biz_main_func` AS `func`
                ON `cron`.`funcId` = `func`.`id`

            WHERE
                `cron`.`id` = ?

            LIMIT 1
            '''
        sql_params = [ crontab_config_id ]
        crontab_configs = self.db.query(sql, sql_params)
        if not crontab_configs:
            return None

        crontab_config = self.prepare_contab_config(crontab_configs[0])
        return crontab_config

    def run(self, **kwargs):
        # 执行函数、参数
        crontab_config_id = kwargs.get('crontabConfigId')

        # 获取需要执行的自动触发配置
        crontab_config = self.get_crontab_config(crontab_config_id)

        # 发送任务
        task = {
            'crontabConfig': crontab_config,
            'origin'       : 'crontab',
            'originId'     : crontab_config['id'],
            'execMode'     : 'manual',
        }
        self.put_tasks(task, ignore_crontab_delay=True)
