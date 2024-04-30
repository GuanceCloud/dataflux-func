# -*- coding: utf-8 -*-

'''
定时处理任务启动器
主要根据 Crontab 计划加载任务，然后启动 func_runner
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

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        self._worker_queue_availability = {}

    @property
    def is_paused(self):
        cache_key = toolkit.get_global_cache_key('tempFlag', 'pauseAllCrontabSchedules')
        flag = self.cache_db.get(cache_key)
        return bool(flag)

    def is_worker_queue_available(self, queue):
        queue = str(queue)

        # 已经缓存的读取缓存
        if self._worker_queue_availability:
            return self._worker_queue_availability[queue]

        # 读取缓存
        cache_key = toolkit.get_global_cache_key('cache', 'workerQueueLimitCrontabSchedule')
        cache_res = self.cache_db.get(cache_key)

        worker_queue_limit_map = None
        if cache_res:
            worker_queue_limit_map = toolkit.json_loads(cache_res)

        # 检查队列可用性
        active_queues = list(range(CONFIG['_WORKER_QUEUE_COUNT']))
        for q in active_queues:
            q = str(q)

            worker_queue_limit = worker_queue_limit_map.get(q)
            if not worker_queue_limit:
                # 无限制
                self._worker_queue_availability[q] = True

            else:
                # 有限制
                # 获取当前队列长度
                worker_queue        = toolkit.get_worker_queue(q)
                worker_queue_length = int(self.cache_db.llen(worker_queue) or 0)

                self._worker_queue_availability[q] = worker_queue_length < worker_queue_limit

        return self._worker_queue_availability[queue]

    def prepare_crontab_schedule(self, c):
        c['funcCallKwargs'] = c.get('funcCallKwargsJSON') or {}
        if isinstance(c['funcCallKwargs'], str):
            c['funcCallKwargs'] = toolkit.json_loads(c['funcCallKwargs']) or {}

        c['funcExtraConfig'] = c.get('funcExtraConfigJSON') or {}
        if isinstance(c['funcExtraConfig'], str):
            c['funcExtraConfig'] = toolkit.json_loads(c['funcExtraConfig']) or {}

        c['crontab'] = c.get('dynamicCrontab') or c['funcExtraConfig'].get('fixedCrontab') or c.get('crontab')

        return c

    def filter_crontab_schedule(self, c):
        crontab = c.get('crontab')
        if not crontab or not toolkit.is_valid_crontab(crontab):
            return False

        timezone = c.get('timezone') or CONFIG['TIMEZONE']
        return toolkit.is_match_crontab(crontab, self.trigger_time, timezone)

    def get_integration_crontab_schedule(self):
        sql = '''
            SELECT
                 `func`.`id`              AS `funcId`
                ,`func`.`extraConfigJSON` AS `funcExtraConfigJSON`
                ,JSON_UNQUOTE(
                    JSON_EXTRACT(`func`.`extraConfigJSON`, '$.integrationConfig.crontab')
                ) AS `crontab`

            FROM `biz_main_func` AS `func`

            WHERE
                `func`.`integration` = 'autoRun'

            HAVING
                `crontab` IS NOT NULL

            ORDER BY
            	`func`.`id`
            '''
        crontab_schedules = self.db.query(sql)

        for c in crontab_schedules:
            # 集成 Crontab 计划使用函数 ID 作为 Crontab 计划 ID
            c['id']  = f"autoRun.crontab-{c['funcId']}"

        # 准备 / 过滤 Crontab 计划
        crontab_schedules = map(self.prepare_crontab_schedule, crontab_schedules)
        crontab_schedules = filter(self.filter_crontab_schedule, crontab_schedules)

        return crontab_schedules

    def fetch_crontab_schedules(self, next_seq):
        sql = '''
            SELECT
                 `cron`.`seq`
                ,`cron`.`id`
                ,`cron`.`funcCallKwargsJSON`
                ,`cron`.`crontab`
                ,`cron`.`taskRecordLimit`

                ,`func`.`id`              AS `funcId`
                ,`func`.`extraConfigJSON` AS `funcExtraConfigJSON`

            FROM `biz_main_crontab_schedule` AS `cron`

            JOIN `biz_main_func` AS `func`
                ON `cron`.`funcId` = `func`.`id`

            WHERE
                    `cron`.`seq`        > ?
                AND `cron`.`isDisabled` = FALSE
                AND IFNULL(UNIX_TIMESTAMP(`cron`.`expireTime`) > UNIX_TIMESTAMP(), TRUE)

            ORDER BY
                `cron`.`seq` ASC

            LIMIT ?
            '''
        sql_params = [ next_seq, CONFIG['_CRONTAB_STARTER_FETCH_BULK_COUNT'] ]
        crontab_schedules = self.db.query(sql, sql_params)

        # 获取游标
        latest_seq = None
        if len(crontab_schedules) > 0:
            latest_seq = crontab_schedules[-1]['seq']

            # 优先使用动态 Crontab
            crontab_schedule_ids = [ c['id'] for c in crontab_schedules]
            cache_key = toolkit.get_global_cache_key('crontabSchedule', 'dynamicCrontab')
            cache_res = self.cache_db.hmget(cache_key, crontab_schedule_ids) or {}

            for c in crontab_schedules:
                dynamic_crontab = cache_res.get(c['id'])

                if not dynamic_crontab:
                    continue

                dynamic_crontab = toolkit.json_loads(dynamic_crontab)
                if dynamic_crontab['expireTime'] and dynamic_crontab['expireTime'] < self.trigger_time:
                    continue

                c['dynamicCrontab'] = dynamic_crontab['value']

            # 准备 / 过滤 Crontab 计划
            crontab_schedules = map(self.prepare_crontab_schedule, crontab_schedules)
            crontab_schedules = filter(self.filter_crontab_schedule, crontab_schedules)

        return crontab_schedules, latest_seq

    def put_tasks(self, tasks, ignore_crontab_delay=False):
        tasks = toolkit.as_array(tasks)
        if not tasks:
            return

        for g in toolkit.group_by_count(tasks, count=500):
            self.logger.debug(f"[PUT TASK] {', '.join([ t.get('originId') for t in g ])}")

        task_reqs = []
        for t in tasks:
            crontab_schedule = t.get('crontabSchedule')
            origin           = t.get('origin')
            origin_id        = t.get('originId')
            delay            = t.get('delay') or 0
            exec_mode        = t.get('execMode', 'crontab')

            # 超时时间 / 过期时间
            timeout = crontab_schedule['funcExtraConfig'].get('timeout') or CONFIG['_FUNC_TASK_TIMEOUT_DEFAULT']
            expires = crontab_schedule['funcExtraConfig'].get('expires') or CONFIG['_FUNC_TASK_EXPIRES_DEFAULT']

            # 确定执行队列
            queue = crontab_schedule['funcExtraConfig'].get('queue') or CONFIG['_FUNC_TASK_QUEUE_CRONTAB']

            # 判断队列是否可用
            if not self.is_worker_queue_available(queue):
                continue

            # Crontab 多次执行
            crontab_delay_list = crontab_schedule['funcExtraConfig'].get('delayedCrontab')
            crontab_delay_list = toolkit.as_array(crontab_delay_list)
            if not crontab_delay_list or ignore_crontab_delay:
                crontab_delay_list = [ 0 ]

            for crontab_delay in crontab_delay_list:
                # 定时任务锁
                crontab_lock_key = toolkit.get_cache_key('lock', 'CrontabSchedule', tags=[
                        'crontabScheduleId', crontab_schedule['id'],
                        'funcId',            crontab_schedule['funcId'],
                        'execMode',          exec_mode])

                crontab_lock_value = f"{int(time.time())}-{toolkit.gen_uuid()}"

                # 任务请求
                task_reqs.append({
                    'name': 'Func.Runner',
                    'kwargs': {
                        'funcId'          : crontab_schedule['funcId'],
                        'funcCallKwargs'  : crontab_schedule['funcCallKwargs'],
                        'origin'          : origin,
                        'originId'        : origin_id,
                        'crontab'         : crontab_schedule['crontab'],
                        'crontabDelay'    : crontab_delay,
                        'crontabLockKey'  : crontab_lock_key,   # 后续在 Func.Runner 中锁定 / 解锁
                        'crontabLockValue': crontab_lock_value, # 后续在 Func.Runner 中锁定 / 解锁
                        'crontabExecMode' : exec_mode,
                    },

                    'triggerTime': self.trigger_time,

                    'queue'          : queue,
                    'delay'          : crontab_delay + delay,
                    'timeout'        : timeout,
                    'expires'        : crontab_delay + delay + expires,
                    'taskRecordLimit': crontab_schedule.get('taskRecordLimit'),
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

        ### 集成函数 Crontab 计划 ###
        tasks = []
        for c in self.get_integration_crontab_schedule():
            tasks.append({
                'crontabSchedule': c,
                'origin'         : 'integration',
                'originId'       : c['id']
            })

        # 发送任务
        if tasks:
            self.put_tasks(tasks)

        ### Crontab 计划 ###
        next_seq = 0
        while next_seq is not None:
            crontab_schedules, next_seq = self.fetch_crontab_schedules(next_seq)

            tasks = []
            for c in crontab_schedules:
                # 使用 seq 分布任务执行时间
                delay = 0
                if CONFIG['_FUNC_TASK_DISTRIBUTION_RANGE'] > 0:
                    delay = c['seq'] % CONFIG['_FUNC_TASK_DISTRIBUTION_RANGE']

                tasks.append({
                    'crontabSchedule': c,
                    'origin'       : 'crontabSchedule',
                    'originId'     : c['id'],
                    'delay'        : delay,
                })

            # 发送任务
            if tasks:
                self.put_tasks(tasks)

class CrontabManualStarter(CrontabStarter):
    name = 'Crontab.ManualStarter'

    def get_crontab_schedule(self, crontab_schedule_id):
        sql = '''
            SELECT
                 `cron`.`seq`
                ,`cron`.`id`
                ,`cron`.`funcCallKwargsJSON`
                ,`cron`.`crontab`
                ,`cron`.`taskRecordLimit`

                ,`func`.`id`              AS `funcId`
                ,`func`.`extraConfigJSON` AS `funcExtraConfigJSON`

            FROM `biz_main_crontab_schedule` AS `cron`

            JOIN `biz_main_func` AS `func`
                ON `cron`.`funcId` = `func`.`id`

            WHERE
                `cron`.`id` = ?

            LIMIT 1
            '''
        sql_params = [ crontab_schedule_id ]
        crontab_schedules = self.db.query(sql, sql_params)
        if not crontab_schedules:
            return None

        crontab_schedule = crontab_schedules[0]

        # 优先使用动态 Crontab
        cache_key = toolkit.get_global_cache_key('crontabSchedule', 'dynamicCrontab')
        dynamic_crontab = self.cache_db.hget(cache_key, crontab_schedule['id']) or {}
        if dynamic_crontab:
            dynamic_crontab = toolkit.json_loads(dynamic_crontab)
            if not dynamic_crontab['expireTime'] or dynamic_crontab['expireTime'] >= self.trigger_time:
                crontab_schedule['dynamicCrontab'] = dynamic_crontab['value']

        crontab_schedule = self.prepare_crontab_schedule(crontab_schedule)
        return crontab_schedule

    def run(self, **kwargs):
        # 执行函数、参数
        crontab_schedule_id = kwargs.get('crontabScheduleId')

        # 获取需要执行的 Crontab 计划
        crontab_schedule = self.get_crontab_schedule(crontab_schedule_id)

        # 发送任务
        task = {
            'crontabSchedule': crontab_schedule,
            'origin'         : 'crontabSchedule',
            'originId'       : crontab_schedule['id'],
            'execMode'       : 'manual',
        }
        self.put_tasks(task, ignore_crontab_delay=True)
