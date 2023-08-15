# -*- coding: utf-8 -*-

# Built-in Modules
import time

# Project Modules
from worker.utils import toolkit, yaml_resources
from worker.tasks import BaseTask

class ExampleSuccessTask(BaseTask):
    name = 'Example.Success'

    default_time_limit = 30

    def run(self, **kwargs):
        s = 'Example: Success'
        return { 'message': s }

class ExampleFailureTask(BaseTask):
    name = 'Example.Failure'

    default_time_limit = 30

    def run(self, **kwargs):
        raise Exception('Example: Failure')

class ExampleTimeoutTask(BaseTask):
    name = 'Example.Timeout'

    default_time_limit = 15

    def run(self, **kwargs):
        time.sleep(30)
