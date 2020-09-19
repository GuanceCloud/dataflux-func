# -*- coding: utf-8 -*-

# Builtin Modules
import re
import json
import datetime
import traceback

# 3rd-party Modules
from clickhouse_driver import Client
from clickhouse_driver import dbapi as ClickHouse
from DBUtils.PersistentDB import PersistentDB
from DBUtils.PooledDB import PooledDB

# Project Modules
from . import parse_response
from worker.utils import toolkit
from worker.utils.log_helper import LogHelper
from worker.utils.extra_helpers import format_sql_v2 as format_sql

def get_config(c):
    config = {
        'host'    : c.get('host')     or '127.0.0.1',
        'port'    : c.get('port')     or 9000,
        'user'    : c.get('user')     or 'default',
        'password': c.get('password') or '',
        'database': c.get('database') or 'default',
    }
    return config

class ClickHouseHelper(object):
    def __init__(self, logger, config, database=None, pool_size=None, *args, **kwargs):
        self.logger = logger

        self.skip_log = False

        if database:
            config['database'] = database

        if pool_size:
            config['maxconnections'] = pool_size

        self.config = config
        if pool_size:
            self.client = PooledDB(ClickHouse, **get_config(config))
        else:
            self.client = PersistentDB(ClickHouse, **get_config(config))

        self.driver = Client(**get_config(self.config))

    def __del__(self):
        pass

    def check(self):
        try:
            self.query('SELECT 1')

        except Exception as e:
            for line in traceback.format_exc().splitlines():
                self.logger.error(line)

            raise Exception(str(e))

    def query(self, sql, sql_params=None):
        formatted_sql = format_sql(sql, sql_params)

        if not self.skip_log:
            self.logger.debug('[CLICKHOUSE] {}'.format(re.sub('\s+', ' ', formatted_sql, flags=re.M)))

        conn = None
        cur  = None

        try:
            conn = self.client.connection()
            cur  = conn.cursor()

            cur.execute(formatted_sql)
            db_res = cur.fetchall()

            # tuple list -> dict list
            column_names = [c.name for c in cur.description]
            for i, d in enumerate(db_res):
                db_res[i] = dict(zip(column_names, d))

        except Exception as e:
            stack_text = traceback.format_exc()
            stack_text = re.sub('Stack trace:[\s\S]*', '', stack_text).strip()

            for line in stack_text.splitlines():
                self.logger.error(line)

            raise Exception(stack_text)

        else:
            return db_res

        finally:
            if cur:
                cur.close()

            if conn:
                conn.close()

    def dump_for_json(self, val):
        '''
        Dump JSON to string
        '''
        return toolkit.json_safe_dumps(val)
