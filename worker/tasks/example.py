# -*- coding: utf-8 -*-

# Built-in Modules
import time

# Project Modules
from worker.tasks.base import BaseTask
from worker.utils import toolkit, yaml_resources

class ExampleSuccessTask(BaseTask):
    name       = 'Example.Success'
    crontab    = '*/10 * * * * *'
    time_limit = 30

    def run(self, **kwargs):
        s = 'Example: Success'
        return { 'message': s }

class ExampleFailureTask(BaseTask):
    name       = 'Example.Failure'
    crontab    = '*/2 * * * *'
    delay      = 3
    time_limit = 30

    def run(self, **kwargs):
        raise Exception('Example: Failure')

class ExampleTimeoutTask(BaseTask):
    name       = 'Example.Timeout'
    crontab    = '*/3 * * * *'
    time_limit = 15

    def run(self, **kwargs):
        time.sleep(30)
