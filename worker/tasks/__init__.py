# -*- coding: utf-8 -*-

# Built-in Modules
import traceback
import pprint

# 3rd-party Modules
import arrow

# Project Modules
from worker.utils import toolkit, yaml_resources
from worker.utils.log_helper import LogHelper
from worker.utils.extra_helpers import MySQLHelper, RedisHelper, FileSystemHelper
from worker.utils.extra_helpers.dataway import DataWay

CONST  = yaml_resources.get('CONST')
CONFIG = yaml_resources.get('CONFIG')

SYSTEM_SETTING_LOCAL_CACHE = toolkit.LocalCache(expires=15)

GUANCE_DATA_STATUS_DEFAULT = 'info'
GUANCE_DATA_STATUS_MAP = {
    'failure': 'critical',
    'timeout': 'error',
    'skip'   : 'warning',
    'waiting': 'info',
    'pending': 'info',
    'success': 'ok',
}

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
    default_queue = CONFIG['_TASK_QUEUE_DEFAULT']

    # 默认过期时间
    default_expires = CONFIG['_TASK_EXPIRES_DEFAULT']

    # 默认超时时间
    default_timeout = CONFIG['_TASK_TIMEOUT_DEFAULT']

    # 默认任务记录保留数量
    default_task_record_limit = CONFIG['_TASK_RECORD_LIMIT_DEFAULT']

    # 默认是否忽略结果
    default_ignore_result = True

    def __init__(self,
                 task_id=None,
                 kwargs=None,
                 trigger_time=None,
                 eta=None,
                 delay=None,
                 queue=None,
                 timeout=None,
                 expires=None,
                 ignore_result=None,
                 task_record_limit=None):

        self.task_id = task_id or toolkit.gen_task_id()
        self.kwargs  = kwargs or dict()

        self.trigger_time = trigger_time or toolkit.get_timestamp(3)
        self.start_time   = None
        self.end_time     = None

        self.result    = None
        self.exception = None
        self.traceback = None
        self.status    = 'waiting'

        # 默认配置
        self.eta               = None
        self.delay             = 0
        self.queue             = self.default_queue
        self.timeout           = self.default_timeout
        self.expires           = self.default_expires
        self.ignore_result     = self.default_ignore_result
        self.task_record_limit = self.default_task_record_limit

        # 实例指定配置
        if eta is not None:
            self.eta = eta

        if delay is not None:
            self.delay = delay

        if queue is not None:
            self.queue = queue

        if timeout is not None:
            self.timeout = timeout

        if expires is not None:
            self.expires = expires

        if ignore_result is not None:
            self.ignore_result = ignore_result

        if task_record_limit is not None:
            self.task_record_limit = task_record_limit

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
            return int(self.trigger_time * 1000)

    @property
    def trigger_time_iso(self):
        if self.trigger_time is None:
            return None
        else:
            return arrow.get(self.trigger_time).to(CONFIG['TIMEZONE']).isoformat()

    @property
    def start_time_ms(self):
        if self.start_time is None:
            return None
        else:
            return int(self.start_time * 1000)

    @property
    def start_time_iso(self):
        if self.start_time is None:
            return None
        else:
            return arrow.get(self.start_time).to(CONFIG['TIMEZONE']).isoformat()

    @property
    def end_time_ms(self):
        if self.end_time is None:
            return None
        else:
            return int(self.end_time * 1000)

    @property
    def end_time_iso(self):
        if self.end_time is None:
            return None
        else:
            return arrow.get(self.end_time).to(CONFIG['TIMEZONE']).isoformat()

    @property
    def system_settings(self):
        global SYSTEM_SETTING_LOCAL_CACHE

        # 从缓存读取
        data = SYSTEM_SETTING_LOCAL_CACHE['data']
        if data:
            return data

        # 从数据库读取
        ids = [
            'LOCAL_FUNC_TASK_RECORD_ENABLED',
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

    @property
    def is_local_func_task_record_enabled(self):
        return self.system_settings.get('LOCAL_FUNC_TASK_RECORD_ENABLED') or False

    @property
    def guance_data_upload_url(self):
        guance_data_upload_enabled = self.system_settings.get('GUANCE_DATA_UPLOAD_ENABLED') or False
        guance_data_upload_url     = self.system_settings.get('GUANCE_DATA_UPLOAD_URL')     or None

        if guance_data_upload_enabled and guance_data_upload_url:
            return guance_data_upload_url

    @property
    def exception_type(self):
        if not self.exception:
            return None

        return self.exception.__class__.__name__

    @property
    def exception_text(self):
        if not self.exception:
            return None

        return str(self.exception)

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

    def create_task_record_data(self, task_resp):
        data = {
            'id'            : self.task_id,
            'name'          : self.name,
            'kwargsJSON'    : toolkit.json_dumps(self.kwargs),
            'triggerTimeMs' : self.trigger_time_ms,
            'startTimeMs'   : self.start_time_ms,
            'endTimeMs'     : self.end_time_ms,
            'eta'           : self.eta,
            'delay'         : self.delay,
            'queue'         : self.queue,
            'timeout'       : self.timeout,
            'expires'       : self.expires,
            'ignoreResult'  : self.ignore_result,
            'resultJSON'    : toolkit.json_dumps(self.result, keep_none=True),
            'status'        : self.status,
            'exceptionType' : self.exception_type,
            'exceptionTEXT' : self.exception_text,
            'tracebackTEXT' : self.traceback,
        }
        return data

    def create_task_record_guance_data(self, task_resp):
        if not self.guance_data_upload_url:
            return None

        data = {
            'measurement': CONFIG['_MONITOR_GUANCE_MEASUREMENT_TASK_RECORD'],
            'tags': {
                'id'         : self.task_id,
                'name'       : self.name,
                'queue'      : str(self.queue),
                'task_status': self.status,
            },
            'fields': {
                'kwargs'          : toolkit.json_dumps(self.kwargs),
                'eta'             : self.eta,
                'delay'           : self.delay,
                'timeout'         : self.timeout,
                'expires'         : self.expires,
                'ignore_result'   : self.ignore_result,
                'result'          : toolkit.json_dumps(self.result, keep_none = True),
                'exception_type'  : self.exception_type,
                'exception'       : self.exception_text,
                'traceback'       : self.traceback,
                'trigger_time_iso': self.trigger_time_iso,
                'start_time_iso'  : self.start_time_iso,
                'end_time_iso'    : self.end_time_iso,
                'wait_cost'       : self.start_time_ms - self.trigger_time_ms,
                'run_cost'        : self.end_time_ms   - self.start_time_ms,
                'total_cost'      : self.end_time_ms   - self.trigger_time_ms,
            },
            'timestamp': int(self.trigger_time),
        }
        return data

    def buff_task_record(self, task_resp):
        # 为了提高处理性能，此处仅写入 Redis 队列，不直接写入数据库
        data = self.create_task_record_data(task_resp)
        if data:
            cache_key = toolkit.get_cache_key('dataBuffer', 'taskRecord')
            self.cache_db.lpush(cache_key, toolkit.json_dumps(data))

        data = self.create_task_record_guance_data(task_resp)
        if data:
            cache_key = toolkit.get_cache_key('dataBuffer', 'taskRecordGuance')
            self.cache_db.lpush(cache_key, toolkit.json_dumps(data))

    def upload_guance_data(self, category, data):
        if not self.guance_data_upload_url:
            return

        if not data:
            return

        data = toolkit.as_array(data)

        self.logger.debug(f'[UPLOAD GUANCE DATA]: {len(data)} {category} point(s)')

        for p in data:
            # 添加 tags.site_name
            site_name = self.system_settings.get('GUANCE_DATA_SITE_NAME')
            if site_name:
                p['tags']['site_name'] = site_name

            # 根据 task_status 增补适用于观测云的 status 值
            if 'task_status' in p['tags']:
                try:
                    p['tags']['status'] = GUANCE_DATA_STATUS_MAP[p['tags']['task_status']]
                except Exception as e:
                    p['tags']['status'] = GUANCE_DATA_STATUS_DEFAULT

        # 上报数据
        try:
            dataway = DataWay(url=self.guance_data_upload_url)
            status_code, resp_data = dataway.post_line_protocol(path=f'/v1/write/{category}', points=data)
            if status_code > 200:
                self.logger.error(resp_data)

        except Exception as e:
            for line in traceback.format_exc().splitlines():
                self.logger.error(line)

    def response(self, task_resp):
        cache_key = toolkit.get_cache_key('task', 'response', [ 'name', self.name, 'id', self.task_id ])
        task_resp_dumps = toolkit.json_dumps(task_resp, ignore_nothing=True, indent=None)

        self.cache_db.publish(cache_key, task_resp_dumps)

    def create_task_request(self):
        task_req = {
            'name'  : self.name,
            'id'    : self.task_id,
            'kwargs': self.kwargs,

            'triggerTime': self.trigger_time,

            'queue'          : self.queue,
            'eta'            : self.eta,
            'delay'          : self.delay,
            'timeout'        : self.timeout,
            'expires'        : self.expires,
            'ignoreResult'   : self.ignore_result,
            'taskRecordLimit': self.task_record_limit,
        }
        return task_req

    @classmethod
    def from_task_request(cls, task_req):
        task_inst = cls(task_id=task_req.get('id'),
                            kwargs=task_req.get('kwargs'),
                            trigger_time=task_req.get('triggerTime'),
                            queue=task_req.get('queue'),
                            eta=task_req.get('eta'),
                            delay=task_req.get('delay'),
                            timeout=task_req.get('timeout'),
                            expires=task_req.get('expires'),
                            ignore_result=task_req.get('ignoreResult'),
                            task_record_limit=task_req.get('taskRecordLimit'))
        return task_inst

    def start(self):
        # 任务信息
        self.status     = 'pending'
        self.start_time = toolkit.get_timestamp(3)

        if CONFIG['MODE'] == 'prod':
            self.db.skip_log       = True
            self.cache_db.skip_log = True

        # 调用子类 run() 函数
        try:
            self.logger.info(f'[CALL] {self.name}')
            self.result = self.run(**self.kwargs)

        except TaskInLockedException as e:
            # 任务重复运行错误，警告即可
            self.status = 'skip'
            self.exception = e
            self.logger.warning(self.exception)

        except TaskTimeoutException as e:
            # 任务超时
            self.status = 'timeout'

            # 可替换错误信息、堆栈信息
            self.exception = self.exception or e
            self.traceback = self.traceback or traceback.format_exc()

            for line in self.traceback.splitlines():
                self.logger.error(line)

        except Exception as e:
            # 其他错误
            self.status = 'failure'

            # 可替换错误信息、堆栈信息
            self.exception = self.exception or e
            self.traceback = self.traceback or traceback.format_exc()

            for line in self.traceback.splitlines():
                self.logger.error(line)

        else:
            # 正常
            self.status = 'success'

        finally:
            self.end_time = toolkit.get_timestamp(3)

            # 任务响应
            task_resp = {
                'name': self.name,
                'id'  : self.task_id,

                'triggerTime': self.trigger_time,
                'startTime'  : self.start_time,
                'endTime'    : self.end_time,

                'result'       : self.result if not self.ignore_result else 'IGNORED',
                'status'       : self.status,
                'exception'    : self.exception_text,
                'exceptionType': self.exception_type,
                'traceback'    : self.traceback,
            }

            # 任务记录
            self.buff_task_record(task_resp)

            # 发送结果通知
            if not self.ignore_result:
                self.response(task_resp)

            # 自动解锁
            self.unlock()

    def run(self, **kwargs):
        self.logger.info(f'{self.name} Task launched.')
