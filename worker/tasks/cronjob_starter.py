# -*- coding: utf-8 -*-

'''
Cron 任务启动器
主要根据 Cron 计划加载任务，然后启动 func_runner
'''

# Built-in Modules
import time

# 3rd-party Modules

# Project Modules
from worker.utils import toolkit, yaml_resources
from worker.tasks import BaseTask

CONFIG = yaml_resources.get('CONFIG')

class CronJobStarter(BaseTask):
    name = 'CronJob.Starter'

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        self._worker_queue_availability = {}

    @property
    def is_paused(self):
        cache_key = toolkit.get_global_cache_key('tempFlag', 'pauseCronJobs')
        flag = self.cache_db.get(cache_key)
        return bool(flag)

    def is_worker_queue_available(self, queue):
        queue = str(queue)

        # 已经缓存的读取缓存
        if self._worker_queue_availability:
            return self._worker_queue_availability[queue]

        # 读取缓存
        cache_key = toolkit.get_global_cache_key('cache', 'workerQueueLimitCronJob')
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

    def prepare_cron_job(self, c):
        c['funcCallKwargs'] = c.get('funcCallKwargsJSON') or {}
        if isinstance(c['funcCallKwargs'], str):
            c['funcCallKwargs'] = toolkit.json_loads(c['funcCallKwargs']) or {}

        c['funcExtraConfig'] = c.get('funcExtraConfigJSON') or {}
        if isinstance(c['funcExtraConfig'], str):
            c['funcExtraConfig'] = toolkit.json_loads(c['funcExtraConfig']) or {}

        c['crontab'] = c.get('dynamicCronExpr') or c['funcExtraConfig'].get('fixedCrontab') or c.get('crontab')

        return c

    def filter_cron_job(self, c):
        crontab = c.get('crontab')
        if not crontab or not toolkit.is_valid_crontab(crontab):
            return False

        timezone = c.get('timezone') or CONFIG['TIMEZONE']
        return toolkit.is_match_crontab(crontab, self.trigger_time, timezone)

    def get_integration_cron_job(self):
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
        cron_jobs = self.db.query(sql)

        for c in cron_jobs:
            # 集成定时任务使用函数 ID 作为定时任务 ID
            c['id']  = f"autoRun.crontab-{c['funcId']}"

        # 准备 / 过滤定时任务
        cron_jobs = map(self.prepare_cron_job, cron_jobs)
        cron_jobs = filter(self.filter_cron_job, cron_jobs)

        return cron_jobs

    def fetch_cron_jobs(self, next_seq):
        sql = '''
            SELECT
                 `cron`.`seq`
                ,`cron`.`id`
                ,`cron`.`funcCallKwargsJSON`
                ,`cron`.`crontab`
                ,`cron`.`taskRecordLimit`

                ,`func`.`id`              AS `funcId`
                ,`func`.`extraConfigJSON` AS `funcExtraConfigJSON`

            FROM `biz_main_cron_job` AS `cron`

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
        sql_params = [ next_seq, CONFIG['_CRONJOB_STARTER_FETCH_BULK_COUNT'] ]
        cron_jobs = self.db.query(sql, sql_params)

        # 获取游标
        latest_seq = None
        if len(cron_jobs) > 0:
            latest_seq = cron_jobs[-1]['seq']

            # 优先使用动态 Crontab
            cron_job_ids = [ c['id'] for c in cron_jobs]
            cache_key = toolkit.get_global_cache_key('cronJob', 'dynamicCronExpr')
            cache_res = self.cache_db.hmget(cache_key, cron_job_ids) or {}

            for c in cron_jobs:
                dynamic_cron_expr = cache_res.get(c['id'])

                if not dynamic_cron_expr:
                    continue

                dynamic_cron_expr = toolkit.json_loads(dynamic_cron_expr)
                if dynamic_cron_expr['expireTime'] and dynamic_cron_expr['expireTime'] < self.trigger_time:
                    continue

                c['dynamicCronExpr'] = dynamic_cron_expr['value']

            # 准备 / 过滤定时任务
            cron_jobs = map(self.prepare_cron_job, cron_jobs)
            cron_jobs = filter(self.filter_cron_job, cron_jobs)

        return cron_jobs, latest_seq

    def put_tasks(self, tasks, ignore_crontab_delay=False):
        tasks = toolkit.as_array(tasks)
        if not tasks:
            return

        for g in toolkit.group_by_count(tasks, count=500):
            self.logger.debug(f"[PUT TASK] {', '.join([ t.get('originId') for t in g ])}")

        task_reqs = []
        for t in tasks:
            cron_job = t.get('cronJob')
            origin           = t.get('origin')
            origin_id        = t.get('originId')
            delay            = t.get('delay') or 0
            exec_mode        = t.get('execMode', 'crontab')

            # 超时时间 / 过期时间
            timeout = cron_job['funcExtraConfig'].get('timeout') or CONFIG['_FUNC_TASK_TIMEOUT_DEFAULT']
            expires = cron_job['funcExtraConfig'].get('expires') or CONFIG['_FUNC_TASK_EXPIRES_DEFAULT']

            # 确定执行队列
            queue = cron_job['funcExtraConfig'].get('queue') or CONFIG['_FUNC_TASK_QUEUE_CRONTAB_SCHEDULE']

            # 判断队列是否可用
            if not self.is_worker_queue_available(queue):
                continue

            # Crontab 多次执行
            crontab_delay_list = cron_job['funcExtraConfig'].get('delayedCrontab')
            crontab_delay_list = toolkit.as_array(crontab_delay_list)
            if not crontab_delay_list or ignore_crontab_delay:
                crontab_delay_list = [ 0 ]

            for crontab_delay in crontab_delay_list:
                # 定时任务锁
                crontab_lock_key = toolkit.get_cache_key('lock', 'CronJob', tags=[
                        'cronJobId', cron_job['id'],
                        'funcId',            cron_job['funcId'],
                        'execMode',          exec_mode])

                crontab_lock_value = f"{int(time.time())}-{toolkit.gen_uuid()}"

                # 任务请求
                task_reqs.append({
                    'name': 'Func.Runner',
                    'kwargs': {
                        'funcId'          : cron_job['funcId'],
                        'funcCallKwargs'  : cron_job['funcCallKwargs'],
                        'origin'          : origin,
                        'originId'        : origin_id,
                        'crontab'         : cron_job['crontab'],
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
                    'taskRecordLimit': cron_job.get('taskRecordLimit'),
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

        ### 集成函数定时任务 ###
        tasks = []
        for c in self.get_integration_cron_job():
            tasks.append({
                'cronJob' : c,
                'origin'  : 'integration',
                'originId': c['id']
            })

        # 发送任务
        if tasks:
            self.put_tasks(tasks)

        ### 定时任务 ###
        next_seq = 0
        while next_seq is not None:
            cron_jobs, next_seq = self.fetch_cron_jobs(next_seq)

            tasks = []
            for c in cron_jobs:
                # 使用 seq 分布任务执行时间
                delay = 0
                if CONFIG['_FUNC_TASK_DISTRIBUTION_RANGE'] > 0:
                    delay = c['seq'] % CONFIG['_FUNC_TASK_DISTRIBUTION_RANGE']

                tasks.append({
                    'cronJob' : c,
                    'origin'  : 'cronJob',
                    'originId': c['id'],
                    'delay'   : delay,
                })

            # 发送任务
            if tasks:
                self.put_tasks(tasks)

class CronJobManualStarter(CronJobStarter):
    name = 'CronJob.ManualStarter'

    def get_cron_job(self, cron_job_id):
        sql = '''
            SELECT
                 `cron`.`seq`
                ,`cron`.`id`
                ,`cron`.`funcCallKwargsJSON`
                ,`cron`.`crontab`
                ,`cron`.`taskRecordLimit`

                ,`func`.`id`              AS `funcId`
                ,`func`.`extraConfigJSON` AS `funcExtraConfigJSON`

            FROM `biz_main_cron_job` AS `cron`

            JOIN `biz_main_func` AS `func`
                ON `cron`.`funcId` = `func`.`id`

            WHERE
                `cron`.`id` = ?

            LIMIT 1
            '''
        sql_params = [ cron_job_id ]
        cron_jobs = self.db.query(sql, sql_params)
        if not cron_jobs:
            return None

        cron_job = cron_jobs[0]

        # 优先使用动态 Crontab
        cache_key = toolkit.get_global_cache_key('cronJob', 'dynamicCronExpr')
        dynamic_cron_expr = self.cache_db.hget(cache_key, cron_job['id']) or {}
        if dynamic_cron_expr:
            dynamic_cron_expr = toolkit.json_loads(dynamic_cron_expr)
            if not dynamic_cron_expr['expireTime'] or dynamic_cron_expr['expireTime'] >= self.trigger_time:
                cron_job['dynamicCronExpr'] = dynamic_cron_expr['value']

        cron_job = self.prepare_cron_job(cron_job)
        return cron_job

    def run(self, **kwargs):
        # 执行函数、参数
        cron_job_id = kwargs.get('cronJobId')

        # 获取需要执行的定时任务
        cron_job = self.get_cron_job(cron_job_id)

        # 发送任务
        task = {
            'cronJob' : cron_job,
            'origin'  : 'cronJob',
            'originId': cron_job['id'],
            'execMode': 'manual',
        }
        self.put_tasks(task, ignore_crontab_delay=True)
