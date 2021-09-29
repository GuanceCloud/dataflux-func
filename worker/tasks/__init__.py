# -*- coding: utf-8 -*-

# Builtin Modules
import time
import traceback

# 3rd-party Modules
import six
from celery.exceptions import SoftTimeLimitExceeded, TimeLimitExceeded
import celery.states as celery_status

# Project Modules
from worker import app
from worker.utils import toolkit, yaml_resources
from worker.utils.log_helper import LogHelper, LOG_LEVELS
from worker.utils.extra_helpers import MySQLHelper, RedisHelper, FileSystemHelper

CONFIG = yaml_resources.get('CONFIG')

LOG_LEVEL      = CONFIG['LOG_LEVEL']
LOG_LEVEL_SEQS = LOG_LEVELS['levels']
LOG_CALL_ARGS  = LOG_LEVEL_SEQS[LOG_LEVEL] >= LOG_LEVEL_SEQS['DEBUG']

LIMIT_ARGS_DUMP = 500

CELERY_TASK_KEY_PREFIX = 'celery-task-meta-'

def gen_task_id():
    '''
    Generate a prefixed task ID
    '''
    return toolkit.gen_data_id('task')

class BaseTask(app.Task):
    '''
    Base task class

    1. Send Result Saving Task automatically.
    Overwrited hooks `on_success`, `on_failure` for sending Result Saving Task
    with an ID: `<Main Task ID>-RESULT`.

    Note: Sub class should provides following 2 tasks (See `example.py`):
        - `_success_result_saving_task` Result Saving Task for SUCCESS
        - `_failure_result_saving_task` Result Saving Task for FAILURE

    2. More detailed task status
    Before `__call__()` is called. Set extra information to `self.request` and Redis.
    Moreover, when `on_success`, `on_failure` is called, status will be updated by
    setting information to Redis.

    Note: Task inherit from the `BaseTask` will always store task result and status
    to the Celery original task result key(Overwrite).
    '''
    ignore_result = True

    _success_result_saving_task = None
    _failure_result_saving_task = None

    def _set_task_status(self, status, **next_context):
        '''
        Set task result for WAT's monitor.
        '''
        # Fixed in Celery for saving/publishing task result.
        # See [https://github.com/celery/celery/blob/v4.1.0/celery/backends/base.py#L518]
        if self.request.called_directly:
            return

        self.request.update(**next_context)

        task_key_prefix = 'celery-task-meta-';
        key = task_key_prefix + self.request.id
        content = {
            'task'  : self.name,
            'id'    : self.request.id,
            'args'  : self.request.args,
            'kwargs': self.request.kwargs,
            'queue' : self.request.delivery_info['routing_key'],
            'origin': self.request.origin,
            'status': status,

            'startTime'       : self.request.x_start_time,
            'endTime'         : self.request.x_end_time,
            'retval'          : self.request.x_retval,
            'einfoTEXT'       : self.request.x_einfo_text,
            'exceptionMessage': self.request.x_exception_message,
            'exceptionDump'   : self.request.x_exception_dump,
        }

        if hasattr(self.request, 'extra'):
            content['extra'] = self.request.extra

        content = toolkit.json_dumps(content, indent=None)

        # self.backend.client.setex(key, CONFIG['_WORKER_RESULT_EXPIRES'], content)

        if status in (celery_status.SUCCESS, celery_status.FAILURE):
            self.backend.client.publish(key, content)

    def __call__(self, *args, **kwargs):
        # Add logger
        self.logger = LogHelper(self)

        # Add DB Helper
        self.db = MySQLHelper(self.logger)

        # Add Cache Helper
        self.cache_db = RedisHelper(self.logger)

        # Add File Storage Helper
        self.file_storage = FileSystemHelper(self.logger)

        if CONFIG['MODE'] == 'prod':
            self.db.skip_log       = True
            self.cache_db.skip_log = True

        # Add extra information
        if not self.request.called_directly:
            self._set_task_status(celery_status.PENDING,
                    x_start_time=int(time.time()),
                    x_end_time=None,
                    x_retval=None,
                    x_einfo_text=None,
                    x_exception_message=None,
                    x_exception_dump=None)

        # Sleep delay
        if 'sleepDelay' in kwargs:
            sleep_delay = 0
            try:
                sleep_delay = float(kwargs['sleepDelay'])
                self.logger.debug('[SLEEP DELAY] {} seconds...'.format(sleep_delay))

            except Exception as e:
                for line in traceback.format_exc().splitlines():
                    self.logger.error(line)
            else:
                time.sleep(sleep_delay)

        # Run
        try:
            if LOG_CALL_ARGS:
                args_dumps = toolkit.json_dumps(args, indent=None)
                if len(args_dumps) > LIMIT_ARGS_DUMP:
                    args_dumps = args_dumps[0:LIMIT_ARGS_DUMP-3] + '...'

                kwargs_dumps = toolkit.json_dumps(kwargs, indent=None)
                if len(kwargs_dumps) > LIMIT_ARGS_DUMP:
                    kwargs_dumps = kwargs_dumps[0:LIMIT_ARGS_DUMP-3] + '...'

                self.logger.debug('[CALL] args: `{}`; kwargs: `{}`'.format(args_dumps, kwargs_dumps))

            return super(BaseTask, self).__call__(*args, **kwargs)

        except (SoftTimeLimitExceeded, TimeLimitExceeded) as e:
            raise

        except Exception as e:
            for line in traceback.format_exc().splitlines():
                self.logger.error(line)

            raise

    def on_retry(self, exc, task_id, args, kwargs, einfo):
        if self.request.called_directly:
            return

        self._set_task_status(celery_status.RETRY)

        self.logger.warning('[{}]'.format(celery_status.RETRY))

    def on_success(self, retval, task_id, args, kwargs):
        if self.request.called_directly:
            return

        self._set_task_status(celery_status.SUCCESS,
                x_end_time=int(time.time()),
                x_retval=retval)

        if self._success_result_saving_task:
            args = (
                task_id,
                self.name,
                self.request.origin,
                self.request.x_start_time,
                self.request.x_end_time,
                self.request.args,
                self.request.kwargs,
                retval,
                celery_status.SUCCESS,
                None
            )
            result_task_id = '{}-RESULT'.format(task_id)
            self._success_result_saving_task.apply_async(task_id=result_task_id, args=args)

        self.logger.debug('[{}]'.format(celery_status.SUCCESS))

    def on_failure(self, exc, task_id, args, kwargs, einfo):
        if self.request.called_directly:
            return

        # Exception Object can not be convert to JSON
        einfo_text        = str(einfo)
        exception_message = str(einfo.exception)
        exception_dump    = repr(einfo.exception)

        self._set_task_status(celery_status.FAILURE,
                x_end_time=int(time.time()),
                x_einfo_text=einfo_text,
                x_exception_message=exception_message,
                x_exception_dump=exception_dump)

        if self._failure_result_saving_task:
            args = (
                task_id,
                self.name,
                self.request.origin,
                self.request.x_start_time,
                self.request.x_end_time,
                self.request.args,
                self.request.kwargs,
                None,
                celery_status.FAILURE,
                einfo_text
            )
            result_task_id = '{}-RESULT'.format(task_id)
            self._failure_result_saving_task.apply_async(task_id=result_task_id, args=args)

        self.logger.error('[{}]'.format(celery_status.FAILURE))

    def launch_log(self):
        self.logger.info(f"`{self.name}` Task launched.")

    def lock(self, max_age=60):
        lock_key   = toolkit.get_cache_key('lock', self.name)
        lock_value = toolkit.gen_uuid()
        if not self.cache_db.lock(lock_key, lock_value, max_age):
            self.logger.warning(f"`{self.name}` Task already launched.")
            return

        self.launch_log()

        return lock_key, lock_value

    def unlock(self, lock_key, lock_value):
        self.cache_db.unlock(lock_key, lock_value)

class BaseResultSavingTask(app.Task):
    '''
    Base result saving task class
    '''
    ignore_result = True

    def __call__(self, *args, **kwargs):
        # Add logger
        self.logger = LogHelper(self)

        # Add DB Helper
        self.db = MySQLHelper(self.logger)

        # Add Cache Helper
        self.cache_db = RedisHelper(self.logger)

        # Run
        try:
            return super(BaseResultSavingTask, self).__call__(*args, **kwargs)

        except Exception as e:
            for line in traceback.format_exc().splitlines():
                self.logger.error(line)

            raise

    def on_success(self, retval, task_id, args, kwargs):
        if self.request.called_directly:
            return

        self.logger.debug('[SUCCESS]')

    def on_failure(self, exc, task_id, args, kwargs, einfo):
        if self.request.called_directly:
            return

        self.logger.error('[FAILURE]')
