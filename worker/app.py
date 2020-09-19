# -*- coding: utf-8 -*-

# Builtin Modules
import os
import logging

# 3rd-party Modules
from celery import Celery, signals

# Project Modules
from worker.utils import yaml_resources

# Configure
base_path = os.path.dirname(os.path.abspath(__file__))
CONFIG     = yaml_resources.load_config(os.path.join(base_path, '../config.yaml'))
IMAGE_INFO = yaml_resources.load_file('IMAGE_INFO', os.path.join(base_path, '../image-info.json'))

from worker.app_init import before_app_create, after_app_created

# Disable InsecureRequestWarning
import requests
from requests.packages.urllib3.exceptions import InsecureRequestWarning
requests.packages.urllib3.disable_warnings(InsecureRequestWarning)

# Celery
before_app_create()

app = Celery(quiet=True)
app.config_from_object('worker.celeryconfig')

# Redis config
redis_password_part = ''
if CONFIG['REDIS_PASSWORD']:
    redis_password_part = ':{}@'.format(CONFIG['REDIS_PASSWORD'])

redis_url = 'redis://{}{}:{}/{}'.format(
    redis_password_part,
    CONFIG['REDIS_HOST'],
    CONFIG['REDIS_PORT'],
    CONFIG['REDIS_DATABASE'])

app.conf.update(broker_url=redis_url, result_backend=redis_url)

@signals.setup_logging.connect
def on_connect(**kwargs):
    print('Celery logging disabled')
    print('Celery is running (Press CTRL+C to quit)')
    print('Have fun!')

after_app_created(app)
