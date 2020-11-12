# -*- coding: utf-8 -*-

# Builtin Modules
import os
import logging

# 3rd-party Modules
from celery import Celery, signals
import redis

# Project Modules
from worker.utils import yaml_resources, toolkit

# Configure
base_path  = os.path.dirname(os.path.abspath(__file__))
CONFIG     = yaml_resources.load_config(os.path.join(base_path, '../config.yaml'))
IMAGE_INFO = yaml_resources.load_file('IMAGE_INFO', os.path.join(base_path, '../image-info.json'))

WORKER_ID = toolkit.gen_time_serial_seq()

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

# Redis client
REDIS_CLIENT = redis.from_url(redis_url)

@signals.worker_ready.connect
def on_worker_ready(*args, **kwargs):
    after_app_created(app)

    print('Celery logging disabled')
    print('Celery is running (Press CTRL+C to quit)')
    print('Have fun!')

@signals.heartbeat_sent.connect
def on_heartbeat_sent(*args, **kwargs):
    _expires = 30

    cache_key = toolkit.get_cache_key('heartbeat', 'worker', tags=['workerId', WORKER_ID])
    REDIS_CLIENT.set(cache_key, 'x', ex=_expires)

    cache_pattern = toolkit.get_cache_key('heartbeat', 'worker', tags=['workerId', '*'])
    found_workers = list(REDIS_CLIENT.scan_iter(match=cache_pattern))

    cache_key = toolkit.get_cache_key('heartbeat', 'workerCount')
    REDIS_CLIENT.set(cache_key, len(found_workers), ex=_expires)

