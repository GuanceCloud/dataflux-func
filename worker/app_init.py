# -*- coding: utf-8 -*-

# Built-in Modules

# 3rd-party Modules
import pymysql
from pymysql.cursors import DictCursor

# Project Modules
from worker.utils import toolkit, yaml_resources

CONFIG = yaml_resources.get('CONFIG')

def get_db_connection():
    mysql_config = {
        'host'    : CONFIG['MYSQL_HOST'],
        'port'    : CONFIG['MYSQL_PORT'],
        'user'    : CONFIG['MYSQL_USER'],
        'password': CONFIG['MYSQL_PASSWORD'],
        'database': CONFIG['MYSQL_DATABASE'],

        'cursorclass' : DictCursor,
    }
    conn = pymysql.connect(**mysql_config)

    return conn

def before_app_create():
    # Init toolkit
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
        worker_queue = f'{APP_NAME_WORKER}#{toolkit._get_worker_queue(name)}'
        return worker_queue

    toolkit.get_worker_queue = get_worker_queue

    def get_delay_queue(name):
        worker_queue = f'{APP_NAME_WORKER}#{toolkit._get_delay_queue(name)}'
        return worker_queue

    toolkit.get_delay_queue = get_delay_queue

    def parse_cache_key(cache_key):
        cache_key_info = toolkit._parse_cache_key(cache_key)

        app_name_topic_parts = cache_key_info['topic'].split('#')
        cache_key_info['appName'] = app_name_topic_parts[0]
        cache_key_info['topic']   = app_name_topic_parts[1]

        return cache_key_info

    toolkit.parse_cache_key = parse_cache_key

    # 加载数据库时区
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            server_settings = {}

            cur.execute("SHOW VARIABLES LIKE '%time_zone%'")
            db_res = cur.fetchall()
            for d in db_res:
                server_settings[d['Variable_name']] = d['Value']

            timezone        = server_settings['time_zone']
            system_timezone = server_settings['system_time_zone']

            if not timezone or timezone.upper() == 'SYSTEM':
                timezone = system_timezone

            if timezone in ('UTC', 'GMT'):
                timezone = '+00:00'
            elif timezone in ('CST', 'Asia/Shanghai'):
                timezone = '+08:00'

            if timezone:
                yaml_resources.set_value('CONFIG', '_MYSQL_TIMEZONE', timezone)
            print(f'Database Timezone: {timezone}');

def after_app_created(cache_db):
    from worker.tasks.main import reload_data_md5_cache, auto_clean, auto_run, auto_backup_db

    # 启动时自动执行
    if not CONFIG['_DISABLE_STARTUP_TASKS']:
        auto_backup_db.apply_async()
        reload_data_md5_cache.apply_async(kwargs={ 'lockTime': 15, 'all': True })

        auto_run.apply_async(countdown=5)
        auto_clean.apply_async(countdown=15)
