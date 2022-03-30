# -*- coding: utf-8 -*-

# Builtin Modules

# 3rd-party Modules

# Project Modules
from worker.utils import toolkit, yaml_resources

CONFIG = yaml_resources.get('CONFIG')

def before_app_create():
    APP_NAME_SERVER = CONFIG['APP_NAME'] + '-server'
    APP_NAME_WORKER = CONFIG['APP_NAME'] + '-worker'

    def get_cache_key(topic, name, tags=None, app_name=None):
        cache_key = toolkit._get_cache_key(topic, name, tags)

        # Add app name to cache key
        app_name = app_name or APP_NAME_WORKER
        cache_key_with_app_name = '{}#{}'.format(app_name, cache_key)
        return cache_key_with_app_name

    toolkit.get_cache_key = get_cache_key

    def get_server_cache_key(topic, name, tags=None):
        return toolkit.get_cache_key(topic, name, tags, APP_NAME_SERVER)

    toolkit.get_server_cache_key = get_server_cache_key

    def get_worker_queue(name):
        worker_queue = toolkit._get_worker_queue(name)

        # Add queue prefix to queue name
        worker_queue_with_prefix = '{}#{}'.format(APP_NAME_WORKER, worker_queue)
        return worker_queue_with_prefix

    toolkit.get_worker_queue = get_worker_queue

    def parse_cache_key(cache_key):
        cache_key_info = toolkit._parse_cache_key(cache_key)

        app_name_topic_parts = cache_key_info['topic'].split('#')
        cache_key_info['appName'] = app_name_topic_parts[0]
        cache_key_info['topic']   = app_name_topic_parts[1]

        return cache_key_info

    toolkit.parse_cache_key = parse_cache_key

def after_app_created(celery_app):
    from worker.tasks.main import reload_scripts, auto_clean, auto_run

    # 启动时自动执行
    reload_scripts.apply_async(kwargs={'lockTime': 15}, countdown=10)
    auto_run.apply_async(countdown=10)
    auto_clean.apply_async(countdown=30)
