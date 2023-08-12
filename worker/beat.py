# -*- coding: utf-8 -*-

# Built-in Modules
import os
import time

# 3rd-party Modules
import arrow
import redis

# Project Modules
from worker.utils import yaml_resources, toolkit

# Configure
BASE_PATH  = os.path.dirname(os.path.abspath(__file__))
CONFIG     = yaml_resources.load_config(os.path.join(BASE_PATH, '../config.yaml'))
CONST      = yaml_resources.load_file('CONST', os.path.join(BASE_PATH, '../const.yaml'))
IMAGE_INFO = yaml_resources.load_file('IMAGE_INFO', os.path.join(BASE_PATH, '../image-info.json'))

# Init
from worker.utils.log_helper import LogHelper
from worker.utils.extra_helpers import RedisHelper
from worker.app_init import before_app_create, after_app_created

LOGGER = LogHelper()
REDIS  = RedisHelper(logger=LOGGER)

before_app_create()

def tick():
    LOGGER.debug(f"[BEAT] Tick")
    LOGGER.debug(REDIS.incr(toolkit.get_cache_key('beat', 'tick')))

TICK_INTERVAL = CONFIG['BEAT_TICK_INTERVAL']

while True:
    now = time.time()
    if int(now) % TICK_INTERVAL == 0:
        tick()

    wait_time = TICK_INTERVAL - now % TICK_INTERVAL
    time.sleep(wait_time)
