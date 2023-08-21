# -*- coding: utf-8 -*-

# Built-in Modules
import time

# Project Modules
from worker.utils import toolkit, yaml_resources
from worker.tasks.base import BaseTask

class InternalHeartbeatTask(BaseTask):
    name = 'Internal.Heartbeat'

    default_timeout = 30

    def run(self, **kwargs):
