# -*- coding: utf-8 -*-

# Builtin Modules
import time

# Project Modules
from worker import app
from worker.tasks import BaseTask
from worker.utils import yaml_resources

CONFIG     = yaml_resources.get('CONFIG')
IMAGE_INFO = yaml_resources.get('IMAGE_INFO')

@app.task(name='internal.shutdown', bind=True, base=BaseTask, ignore_result=False)
def shutdown(self):
    '''
    Shutdown all workers
    '''
    return app.control.broadcast('shutdown')

@app.task(name='internal.ping', bind=True, base=BaseTask, ignore_result=False)
def ping(self):
    '''
    Ping workers
    '''
    return app.control.ping(timeout=0.5)

@app.task(name='internal.stats', bind=True, base=BaseTask, ignore_result=False)
def stats(self):
    '''
    Get stats
    '''
    return app.control.inspect().stats()

@app.task(name='internal.activeQueues', bind=True, base=BaseTask, ignore_result=False)
def active_queues(self):
    '''
    Get active queues
    '''
    return app.control.inspect().active_queues()

@app.task(name='internal.report', bind=True, base=BaseTask, ignore_result=False)
def report(self):
    '''
    Get task queue report
    '''
    return app.control.inspect().report()

@app.task(name='internal.getImageInfo', bind=True, base=BaseTask)
def get_image_info(self):
    '''
    Get image info
    '''
    return IMAGE_INFO
