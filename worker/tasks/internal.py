# -*- coding: utf-8 -*-

# Built-in Modules
import time

# Project Modules
from worker.app import app
from worker.tasks import BaseTask
from worker.utils import yaml_resources

CONFIG     = yaml_resources.get('CONFIG')
IMAGE_INFO = yaml_resources.get('IMAGE_INFO')

@app.task(name='Internal.Shutdown', bind=True, base=BaseTask, ignore_result=False)
def shutdown(self, *args, **kwargs):
    '''
    Shutdown all workers
    '''
    return app.control.broadcast('shutdown')

@app.task(name='Internal.PoolRestart', bind=True, base=BaseTask, ignore_result=False)
def pool_restart(self, *args, **kwargs):
    '''
    Restart all worker execution pool
    '''
    return app.control.broadcast('pool_restart')

@app.task(name='Internal.Ping', bind=True, base=BaseTask, ignore_result=False)
def ping(self, *args, **kwargs):
    '''
    Ping workers
    '''
    return app.control.ping(timeout=0.5)

@app.task(name='Internal.ActiveTasks', bind=True, base=BaseTask, ignore_result=False)
def active_tasks(self, *args, **kwargs):
    '''
    Get active tasks
    '''
    return app.control.inspect().active()

@app.task(name='Internal.ActiveQueues', bind=True, base=BaseTask, ignore_result=False)
def active_queues(self, *args, **kwargs):
    '''
    Get active queues
    '''
    return app.control.inspect().active_queues()

@app.task(name='Internal.Stats', bind=True, base=BaseTask, ignore_result=False)
def stats(self, *args, **kwargs):
    '''
    Get stats
    '''
    return app.control.inspect().stats()

@app.task(name='Internal.Report', bind=True, base=BaseTask, ignore_result=False)
def report(self, *args, **kwargs):
    '''
    Get task queue report
    '''
    return app.control.inspect().report()
