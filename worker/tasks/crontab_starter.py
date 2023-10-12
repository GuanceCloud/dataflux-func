# -*- coding: utf-8 -*-

'''
定时处理任务启动器
主要根据自动触发配置加载任务，然后启动 func_runner
'''

# Built-in Modules

# 3rd-party Modules

# Project Modules
from worker.utils import toolkit, yaml_resources
from worker.tasks import BaseTask

CONFIG = yaml_resources.get('CONFIG')

class CrontabStarter(BaseTask):
    name = 'Crontab.Starter'

    default_expires = CONFIG['_CRONTAB_STARTER_TASK_TIMEOUT']
    default_timeout = CONFIG['_CRONTAB_STARTER_TASK_TIMEOUT']

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

    def put_tasks(self, tasks):
        tasks = toolkit.as_array(tasks)
        task_reqs = []

        for t in tasks:
            crontab_config = t.get('crontabConfig')
            origin         = t.get('origin')
            origin_id      = t.get('originId')
            delay          = t.get('delay')
            exec_mode      = t.get('execMode', 'crontab')

            # 超时时间 / 过期时间
            timeout = crontab_config['funcExtraConfig'].get('timeout') or CONFIG['_FUNC_TASK_TIMEOUT_DEFAULT']
            expires = timeout

            # 确定执行队列
            queue = crontab_config['funcExtraConfig'].get('queue') or CONFIG['_FUNC_TASK_QUEUE_CRONTAB']

            # 多次执行
            delay_list = crontab_config['funcExtraConfig'].get('delayedCrontab') or delay or 0
            delay_list = toolkit.as_array(delay_list)

            for delay in delay_list:
                # 定时任务锁
                crontab_lock_key = toolkit.get_cache_key('lock', 'CrontabConfig', tags=[
                        'crontabConfigId', crontab_config['id'],
                        'funcId',          crontab_config['funcId'],
                        'crontabDelay',    delay])

                crontab_lock_value = toolkit.gen_uuid()
                if not self.cache_db.lock(crontab_lock_key, crontab_lock_value, timeout):
                    # 触发任务前上锁，失败则跳过
                    self.logger.warning('Crontab Config in lock, skip...')
                    continue

                # 任务请求
                task_reqs.append({
                    'name': 'Func.Runner',
                    'kwargs': {
                        'funcId'          : crontab_config['funcId'],
                        'funcCallKwargs'  : crontab_config['funcCallKwargs'],
                        'origin'          : origin,
                        'originId'        : origin_id,
                        'crontab'         : crontab_config['crontab'],
                        'crontabDelay'    : delay,
                        'crontabLockKey'  : crontab_lock_key,
                        'crontabLockValue': crontab_lock_value,
                        'crontabExecMode' : exec_mode,
                    },

                    'triggerTime': self.trigger_time,

                    'queue'          : queue,
                    'delay'          : delay,
                    'timeout'        : timeout,
                    'expires'        : expires,
                    'taskRecordLimit': crontab_config.get('taskRecordLimit'),
                })

        groups = toolkit.group_by_count(task_reqs, count=CONFIG['_CRONTAB_STARTER_PUT_TASK_BULK_COUNT'])
        for group in groups:
            self.cache_db.put_tasks(group)

    def run(self, **kwargs):
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
        next_seq      = 0
        crontab_count = 0
        while next_seq is not None:
            tasks = []

            crontab_configs, next_seq = self.fetch_crontab_configs(next_seq)
            for c in crontab_configs:
                # 平均分布任务触发事件点
                delay = 0
                if CONFIG['_FUNC_TASK_DISTRIBUTION_RANGE'] > 0:
                    delay = crontab_count % CONFIG['_FUNC_TASK_DISTRIBUTION_RANGE']

                tasks.append({
                    'crontabConfig': c,
                    'origin'       : 'crontab',
                    'originId'     : c['id'],
                    'delay'        : delay,
                })

                # 自动触发配置记述
                crontab_count += 1

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
        self.put_tasks(task)
