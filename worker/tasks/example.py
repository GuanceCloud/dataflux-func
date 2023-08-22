# -*- coding: utf-8 -*-

# Built-in Modules
import time

# Project Modules
from worker.utils import toolkit, yaml_resources
from worker.tasks import BaseTask

class ExampleSuccess(BaseTask):
    name = 'Example.ExampleSuccess'

    default_timeout = 30

    def run(self, **kwargs):
        s = 'Example: Success'
        return { 'message': s }

class ExampleFailure(BaseTask):
    name = 'Example.ExampleFailure'

    default_timeout = 30

    def run(self, **kwargs):
        raise Exception('Example: Failure')

class ExampleTimeout(BaseTask):
    name = 'Example.ExampleTimeout'

    default_timeout = 15

    def run(self, **kwargs):
        time.sleep(30)
