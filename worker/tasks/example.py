# -*- coding: utf-8 -*-

# Builtin Modules
import time
import json

# Project Modules
from worker import app
from worker.tasks import BaseTask, BaseResultSavingTask
from worker.utils import toolkit

@app.task(name='Example.Result', bind=True, base=BaseResultSavingTask)
def result_saving_task(self, task_id, name, origin, start_time, end_time, args, kwargs, retval, status, einfo_text):
    options = kwargs or {}

    '''
    Result saving task
    '''
    args_json   = self.db.dump_for_json(args)
    kwargs_json = self.db.dump_for_json(kwargs)
    retval_json = self.db.dump_for_json(retval)

    sql = '''
        INSERT INTO wat_main_task_result_example
        SET
             `id`         = ?
            ,`task`       = ?
            ,`origin`     = ?
            ,`startTime`  = ?
            ,`endTime`    = ?
            ,`argsJSON`   = ?
            ,`kwargsJSON` = ?
            ,`retvalJSON` = ?
            ,`status`     = ?
            ,`einfoTEXT`  = ?
    '''
    sql_params = (task_id, name, origin, start_time, end_time, args_json, kwargs_json, retval_json, status, einfo_text)
    self.db.query(sql, sql_params)

class BizTask(BaseTask):
    '''
    Business task
    '''
    # Specify the success/failure result saving task
    _success_result_saving_task = result_saving_task
    _failure_result_saving_task = result_saving_task

@app.task(name='Example.Echo.Success', bind=True, base=BizTask)
def echo_success(self, *args, **kwargs):
    '''
    Example success task
    '''
    self.logger.info('Example echo Task started.')

    # Do something...

    # Just return JSON data
    retval = {
        'args'  : args,
        'kwargs': kwargs,
    }
    return retval

@app.task(name='Example.Echo.Failure', bind=True, base=BizTask)
def echo_failure(self, *args, **kwargs):
    '''
    Example failure task
    '''
    self.logger.info('Example echo Task started.')

    # Do something...

    raise Exception('Example Error')

    # Just return JSON data
    retval = {
        'args'  : args,
        'kwargs': kwargs,
    }
    return retval
