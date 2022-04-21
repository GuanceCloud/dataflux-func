# -*- coding: utf-8 -*-

# Builtin Modules
import re
import datetime
import traceback

# 3rd-party Modules
import pymysql
from pymysql.cursors import DictCursor
from DBUtils.PersistentDB import PersistentDB
from DBUtils.PooledDB import PooledDB

# Project Modules
from worker import celeryconfig
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
            if pool_size:
                self.client = PooledDB(pymysql, **get_config(config))
            else:
                self.client = PersistentDB(pymysql, **get_config(config))

        else:
            global CLIENT_CONFIG
            global CLIENT

            if not CLIENT:
                CLIENT_CONFIG = {
                    'host'    : CONFIG['MYSQL_HOST'],
                    'port'    : CONFIG['MYSQL_PORT'],
                    'user'    : CONFIG['MYSQL_USER'],
                    'password': CONFIG['MYSQL_PASSWORD'],
                    'database': CONFIG['MYSQL_DATABASE'],
                    'charset' : CONFIG['_MYSQL_CHARSET'],
                }
                CLIENT = PersistentDB(pymysql, **get_config(CLIENT_CONFIG))

            self.config = CLIENT_CONFIG
            self.client = CLIENT

    def __del__(self):
        pass

    def check(self):
        try:
            self.query('SELECT 1')

        except Exception as e:
            for line in traceback.format_exc().splitlines():
                self.logger.error(line)

            raise Exception(str(e))

    def start_trans(self):
        if not self.skip_log:
            self.logger.debug('[MYSQL] Trans START')

        conn = self.client.connection()
        cur  = conn.cursor()

        trans_conn = {
            'conn': conn,
            'cur' : cur,
        }

        return trans_conn

    def commit(self, trans_conn):
        if not trans_conn:
            return

        if not self.skip_log:
            self.logger.debug('[MYSQL] Trans COMMIT')

        conn = trans_conn.get('conn')
        cur  = trans_conn.get('cur')

        conn.commit()

        cur.close()
        conn.close()

    def rollback(self, trans_conn):
        if not trans_conn:
            return

        if not self.skip_log:
            self.logger.debug('[MYSQL] Trans ROLLBACK')

        conn = trans_conn.get('conn')
        cur  = trans_conn.get('cur')

        conn.rollback()

        cur.close()
        conn.close()

    def _trans_execute(self, trans_conn, sql, sql_params=None):
        formatted_sql = format_sql(sql, sql_params)

        if not self.skip_log:
            self.logger.debug('[MYSQL] Trans Query `{}`'.format(re.sub('\s+', ' ', formatted_sql, flags=re.M)))

        if not trans_conn:
            raise Exception('Transaction not started')

        conn = trans_conn['conn']
        cur  = trans_conn['cur']

        count  = cur.execute(formatted_sql)
        db_res = cur.fetchall()

        return list(db_res), count

    def _execute(self, sql, sql_params=None):
        formatted_sql = format_sql(sql, sql_params)

        if not self.skip_log:
            self.logger.debug('[MYSQL] Query `{}`'.format(re.sub('\s+', ' ', formatted_sql, flags=re.M)))

        conn = None
        cur  = None

        try:
            conn = self.client.connection()
            cur  = conn.cursor()

            count  = cur.execute(formatted_sql)
            db_res = cur.fetchall()

        except Exception as e:
            for line in traceback.format_exc().splitlines():
                self.logger.error(line)

            if conn:
                conn.rollback()

            raise

        else:
            conn.commit()

            return list(db_res), count

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
