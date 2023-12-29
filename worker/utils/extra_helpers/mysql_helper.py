# -*- coding: utf-8 -*-

# Built-in Modules
import re
import time
import datetime
import traceback

# 3rd-party Modules
import arrow
import pymysql
from pymysql.cursors import DictCursor
from pymysql.constants import CLIENT as CLIENT_FLAG
from dbutils.pooled_db import PooledDB

# Project Modules
from worker.utils import toolkit, yaml_resources
from worker.utils.extra_helpers import format_sql_v2 as format_sql

CONFIG = yaml_resources.get('CONFIG')

def get_config(c):
    _charset = c.get('charset') or 'utf8mb4'

    config = {
        'host'    : c.get('host') or '127.0.0.1',
        'port'    : c.get('port') or 3306,
        'user'    : c.get('user'),
        'password': c.get('password'),
        'database': c.get('database'),

        'cursorclass' : DictCursor,
        'charset'     : _charset,
        'init_command': 'SET NAMES "{0}"'.format(_charset),
        'client_flag' : CLIENT_FLAG.MULTI_STATEMENTS,

        'maxconnections' : c.get('maxconnections') or 1,
        'connect_timeout': CONFIG['_MYSQL_CONNECT_TIMEOUT'],
    }
    return config

CLIENT_CONFIG = None
CLIENT        = None

class MySQLHelper(object):
    def __init__(self, logger, config=None, database=None, pool_size=None, *args, **kwargs):
        self.logger = logger

        self.skip_log = False

        if config:
            if database:
                config['database'] = database

            if pool_size:
                config['maxconnections'] = pool_size

            self.config = config
            self.client = PooledDB(pymysql, **get_config(config))

        else:
            global CLIENT_CONFIG
            global CLIENT

            if not CLIENT:
                CLIENT_CONFIG = {
                    'host'          : CONFIG['MYSQL_HOST'],
                    'port'          : CONFIG['MYSQL_PORT'],
                    'user'          : CONFIG['MYSQL_USER'],
                    'password'      : CONFIG['MYSQL_PASSWORD'],
                    'database'      : CONFIG['MYSQL_DATABASE'],
                    'charset'       : CONFIG['_MYSQL_CHARSET'],
                    'timezone'      : CONFIG['_MYSQL_TIMEZONE'],
                    'maxconnections': CONFIG['_MYSQL_CONNECTION_LIMIT_FOR_WORKER'],
                }
                CLIENT = PooledDB(pymysql, **get_config(CLIENT_CONFIG))

            self.config = CLIENT_CONFIG
            self.client = CLIENT

    def __del__(self):
        if not self.client or self.client is CLIENT or not isinstance(self.client, PooledDB):
            return

        try:
            self.client.close()

        except Exception as e:
            for line in traceback.format_exc().splitlines():
                self.logger.error(line)

        finally:
            self.client = None

    def check(self):
        try:
            self.query('SELECT 1')

        except Exception as e:
            for line in traceback.format_exc().splitlines():
                self.logger.error(line)

            raise

    def start_trans(self):
        try:
            dt = toolkit.DiffTimer()

            conn = self.client.connection()
            cur  = conn.cursor()

            trans_conn = {
                'conn': conn,
                'cur' : cur,
            }

            if not self.skip_log:
                self.logger.debug(f'[MYSQL] Trans START (Cost: {dt.tick()} ms)')

            return trans_conn

        except Exception as e:
            self.logger.error(f'[MYSQL] Trans START (Cost: {dt.tick()} ms)')
            raise

    def commit(self, trans_conn):
        if not trans_conn:
            return

        conn = trans_conn.get('conn')
        cur  = trans_conn.get('cur')

        try:
            dt = toolkit.DiffTimer()

            conn.commit()

            cur.close()
            conn.close()

            if not self.skip_log:
                self.logger.debug(f'[MYSQL] Trans COMMIT (Cost: {dt.tick()} ms)')

        except Exception as e:
            self.logger.error(f'[MYSQL] Trans COMMIT (Cost: {dt.tick()} ms)')
            raise

    def rollback(self, trans_conn):
        if not trans_conn:
            return

        conn = trans_conn.get('conn')
        cur  = trans_conn.get('cur')

        try:
            dt = toolkit.DiffTimer()

            conn.rollback()

            cur.close()
            conn.close()

            if not self.skip_log:
                self.logger.debug(f'[MYSQL] Trans ROLLBACK (Cost: {dt.tick()} ms)')

        except Exception as e:
            self.logger.error(f'[MYSQL] Trans ROLLBACK (Cost: {dt.tick()} ms)')
            raise

    def _convert_timezone(self, db_res):
        if not self.config.get('timezone'):
            return db_res

        for d in db_res:
            for k, v in d.items():
                if not isinstance(v, datetime.datetime):
                    continue

                d[k] = arrow.get(v, self.config.get('timezone'))

        return db_res

    def _trans_execute(self, trans_conn, sql, sql_params=None):
        formatted_sql = format_sql(sql, sql_params)
        one_line_sql  = re.sub('\s+', ' ', formatted_sql, flags=re.M)

        if not trans_conn:
            raise Exception('Transaction not started')

        conn = trans_conn['conn']
        cur  = trans_conn['cur']

        try:
            dt = toolkit.DiffTimer()

            count  = cur.execute(formatted_sql)
            db_res = cur.fetchall()

            if not self.skip_log:
                self.logger.debug(f'[MYSQL] Trans Query `{one_line_sql}` (Cost: {dt.tick()} ms)')

            db_res = list(db_res)
            db_res = self._convert_timezone(db_res)

            return db_res, count

        except Exception as e:
            self.logger.error(f'[MYSQL] Trans Query `{one_line_sql}` (Cost: {dt.tick()} ms)')
            raise

    def _execute(self, sql, sql_params=None):
        formatted_sql = format_sql(sql, sql_params)
        one_line_sql  = re.sub('\s+', ' ', formatted_sql, flags=re.M)

        conn = None
        cur  = None

        try:
            dt = toolkit.DiffTimer()

            conn = self.client.connection()
            cur  = conn.cursor()

            count  = cur.execute(formatted_sql)
            db_res = cur.fetchall()

            conn.commit()

            if not self.skip_log:
                self.logger.debug(f'[MYSQL] Query `{one_line_sql}` (Cost: {dt.tick()} ms)')

            db_res = list(db_res)
            db_res = self._convert_timezone(db_res)

            return db_res, count

        except Exception as e:
            for line in traceback.format_exc().splitlines():
                self.logger.error(line)

            if conn:
                conn.rollback()

            self.logger.error(f'[MYSQL] Query `{one_line_sql}` (Cost: {dt.tick()} ms)')
            raise

        finally:
            if cur:
                cur.close()

            if conn:
                conn.close()

    def trans_query(self, trans_conn, sql, sql_params=None):
        result, count = self._trans_execute(trans_conn, sql, sql_params)
        return result

    def trans_non_query(self, trans_conn, sql, sql_params=None):
        result, count = self._trans_execute(trans_conn, sql, sql_params)
        return count

    def query(self, sql, sql_params=None):
        result, count = self._execute(sql, sql_params)
        return result

    def non_query(self, sql, sql_params=None):
        result, count = self._execute(sql, sql_params)
        return count

    def dump_for_json(self, val):
        '''
        Dump JSON to string
        '''
        return toolkit.json_dumps(val)
