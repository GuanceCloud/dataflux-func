# -*- coding: utf-8 -*-

# Built-in Modules
import traceback

# 3rd-party Modules

# Project Modules
from worker.utils import toolkit, yaml_resources
from worker.utils.log_helper import LogHelper
from worker.utils.extra_helpers import MySQLHelper, RedisHelper, FileSystemHelper
from worker.utils.extra_helpers.dataway import DataWay

CONST  = yaml_resources.get('CONST')
CONFIG = yaml_resources.get('CONFIG')

GUANCE_DATA_DEFAULT_STATUS = 'info'
GUANCE_DATA_STATUS_MAP = {
    'success': 'ok',
    'failure': 'critical',
    'skip'   : 'warning',
    'timeout': 'error'
}

SYSTEM_SETTING_LOCAL_CACHE = toolkit.LocalCache(expires=15)

class TaskInLockedException(Exception):
    pass

class TaskTimeoutException(Exception):
    pass

class BaseTask(object):
    '''
    Base task class
    '''
    # 名称
    name = None

    # 默认运行队列
    default_queue = CONFIG['_TASK_DEFAULT_QUEUE']

    # 默认过期时间
    default_expires = CONFIG['_TASK_DEFAULT_EXPIRES']

    # 默认超时时间
    default_timeout = CONFIG['_TASK_DEFAULT_TIMEOUT']

    # 默认任务记录保留数量
    default_task_record_limit = CONFIG['']

    # 默认是否忽略结果
    default_ignore_result = True

    def __init__(self,
                 task_id=None,
                 kwargs=None,
                 delay=None,
                 queue=None,
                 timeout=None,
                 expires=None,
                 ignore_result=None,
                 task_record_limit=None,
                 trigger_time=None):

        self.task_id = task_id or toolkit.gen_task_id()
        self.kwargs  = kwargs or dict()

        self.trigger_time = trigger_time or toolkit.get_timestamp(3)
        self.start_time   = None
        self.end_time     = None

        self.result      = None
        self.error       = None
        self.error_stack = None
        self.status      = 'waiting'

        # 默认配置
        self.delay             = 0
        self.queue             = self.default_queue
        self.timeout           = self.default_timeout
        self.expires           = self.default_expires
        self.task_record_limit = self.default_task_record_limit
        self.ignore_result     = self.default_ignore_result

        # 实例指定配置
        if delay is not None:
            self.delay =  delay

        if queue is not None:
            self.queue = queue

        if timeout is not None:
            self.timeout = timeout

        if expires is not None:
            self.expires = expires

        if task_record_limit is not None:
            self.task_record_limit = task_record_limit

        if ignore_result is not None:
            self.ignore_result = ignore_result

        # 任务锁
        self._lock_key   = None
        self._lock_value = None

        # 关联组件
        self.logger       = LogHelper(self)
        self.db           = MySQLHelper(self.logger)
        self.cache_db     = RedisHelper(self.logger)
        self.file_storage = FileSystemHelper(self.logger)

    @property
    def trigger_time_ms(self):
        if self.trigger_time is None:
            return None
        else:
            return self.trigger_time * 1000

    @property
    def start_time_ms(self):
        if self.start_time is None:
            return None
        else:
            return self.start_time * 1000

    @property
    def end_time_ms(self):
        if self.end_time is None:
            return None
        else:
            return self.end_time * 1000

    @property
    def system_settings(self):
        global SYSTEM_SETTING_LOCAL_CACHE

        # 从缓存读取
        data = SYSTEM_SETTING_LOCAL_CACHE['data']
        if data:
            return data

        # 从数据库读取
        ids = [
            'GUANCE_DATA_UPLOAD_ENABLED',
            'GUANCE_DATA_UPLOAD_URL',
            'GUANCE_DATA_SITE_NAME',
        ]
        sql = '''
                SELECT
                    id
                    ,value
                FROM wat_main_system_setting
                WHERE
                    id IN ( ? )
                '''
        sql_params = [ ids ]
        db_res = self.db.query(sql, sql_params)

        data = {}

        # 默认值
        for _id in ids:
            data[_id] = CONST['systemSettings'][_id]

        # 用户配置
        for d in db_res:
            data[d['id']] = toolkit.json_loads(d['value'])

        # 加入缓存
        SYSTEM_SETTING_LOCAL_CACHE['data'] = data

        return data

    def lock(self, max_age=None):
        max_age = int(max_age or 30)

        lock_key   = toolkit.get_cache_key('lock', 'task', tags=[ 'task', self.name ])
        lock_value = toolkit.gen_uuid()

        if not self.cache_db.lock(lock_key, lock_value, max_age):
            raise TaskInLockedException(f"Task `{self.name}` already launched.")

        self._lock_key   = lock_key
        self._lock_value = lock_value

    def unlock(self):
        if self._lock_key and self._lock_value:
            self.cache_db.unlock(self._lock_key, self._lock_value)

        self._lock_key   = None
        self._lock_value = None

    def onFinish(self, task_resp):
        pass

    def response(self, task_resp):
        # 任务结束时的处理
        if self.status not in ('waiting', 'pending'):
            # 发送结果通知
            if not self.ignore_result:
                cache_key = toolkit.get_cache_key('task', 'response', [ 'name', self.name, 'id', self.task_id ])
                task_resp_dumps = toolkit.json_dumps(task_resp, ignore_nothing=True, indent=None)

                self.cache_db.publish(cache_key, task_resp_dumps)

            # 自动解锁
            self.unlock()

    def create_task_request(self):
        task_req = {
            'name'  : self.name,
            'id'    : self.task_id,
            'kwargs': self.kwargs,

            'triggerTime': self.trigger_time,

            'queue'          : self.queue,
            'delay'          : self.delay,
            'timeout'        : self.timeout,
            'expires'        : self.expires,
            'taskRecordLimit': self.task_record_limit,
            'ignoreResult'   : self.ignore_result,
        }
        return task_req

    @classmethod
    def from_task_request(cls, task_req):
        task_inst = cls(task_id=task_req.get('id'),
                            kwargs=task_req.get('kwargs'),
                            trigger_time=task_req.get('triggerTime'),
                            queue=task_req.get('queue'),
                            delay=task_req.get('delay'),
                            timeout=task_req.get('timeout'),
                            expires=task_req.get('expires'),
                            task_record_limit=task_req.get('taskRecordLimit'),
                            ignore_result=task_req.get('ignoreResult'))
        return task_inst

    def start(self):
        # 任务信息
        self.status     = 'pending'
        self.start_time = toolkit.get_timestamp(3)

        if CONFIG['MODE'] == 'prod':
            self.db.skip_log       = True
            self.cache_db.skip_log = True

        # 调用子类 run() 函数
        result = None
        try:
            self.logger.debug(f'[CALL] {self.name}')
            result = self.run(**self.kwargs)

        except TaskInLockedException as e:
            # 任务重复运行错误，警告即可
            self.status = 'skip'
            self.error  = e
            self.logger.warning(self.error)

        except TaskTimeoutException as e:
            # 任务超时
            self.status = 'timeout'

            # 可替换错误信息、堆栈信息
            self.error       = self.error       or e
            self.error_stack = self.error_stack or traceback.format_exc()

            for line in self.error_stack.splitlines():
                self.logger.error(line)

        except Exception as e:
            # 其他错误
            self.status = 'failure'

            # 可替换错误信息、堆栈信息
            self.error       = self.error       or e
            self.error_stack = self.error_stack or traceback.format_exc()

            for line in self.error_stack.splitlines():
                self.logger.error(line)

        else:
            # 正常
            self.status = 'success'
            self.result = result

        finally:
            self.end_time = toolkit.get_timestamp(3)

            # 任务响应
            task_resp = {
                'name': self.name,
                'id'  : self.task_id,

                'triggerTime': self.trigger_time,
                'startTime'  : self.start_time,
                'endTime'    : self.end_time,

                'result'    : self.result if not self.ignore_result else 'IGNORED',
                'status'    : self.status,
                'error'     : None if self.error is None else str(self.error),
                'errorClass': None if self.error is None else self.error.__class__.__name__,
                'errorStack': self.error_stack,
            }

            # 执行后回调
            self.onFinish(task_resp)

            # 记录任务信息
            self.response(task_resp)

    def run(self, **kwargs):
        self.logger.info(f'{self.name} Task launched.')

    def upload_guance_data(self, category, points):
        self.logger.debug(f'[UPLOAD GUANCE DATA]: {len(points)} {category} point(s)')

        if not points:
            return

        points = toolkit.as_array(points)

        upload_enabled = self.system_settings.get('GUANCE_DATA_UPLOAD_ENABLED') or False
        upload_url     = self.system_settings.get('GUANCE_DATA_UPLOAD_URL')     or None
        if not all([ upload_enabled, upload_url ]):
            return

        for p in points:
            p['tags'] = p.get('tags') or {}

            # 替换 tags.status 值为观测云风格
            p['tags']['status'] = GUANCE_DATA_STATUS_MAP.get(p['tags']['status']) or GUANCE_DATA_DEFAULT_STATUS

            # 添加 tags.site_name
            site_name = self.system_settings.get('GUANCE_DATA_SITE_NAME')
            if site_name:
                p['tags']['site_name'] = site_name

        # 上报数据
        try:
            dataway = DataWay(url=upload_url)
            status_code, resp_data = dataway.post_line_protocol(path=f'/v1/write/{category}', points=points)
            if status_code > 200:
                self.logger.error(resp_data)

        except Exception as e:
            for line in traceback.format_exc().splitlines():
                self.logger.error(line)

            # 不要将错误抛出
