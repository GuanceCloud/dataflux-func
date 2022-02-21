# -*- coding: utf-8 -*-

# Builtin Modules
import time
import traceback
import functools

# 3rd-party Modules
import redis
import six

# Project Modules
from worker.utils import toolkit, yaml_resources
from worker.utils.log_helper import LogHelper

CONFIG = yaml_resources.get('CONFIG')

def get_config(c):
    config = {
        'host'    : c.get('host')     or '127.0.0.1',
        'port'    : c.get('port')     or 6379,
        'db'      : c.get('db')       or c.get('database'),
        'password': c.get('password') or None,
        'ssl'     : c.get('useSSL')   or c.get('useTLS'),
    }
    if config['ssl'] is True:
        config['ssl_cert_reqs'] = None

    return config

LIMIT_ARGS_DUMP = 200

# LUA
LUA_UNLOCK_KEY_KEY_NUMBER = 1;
LUA_UNLOCK_KEY = 'if redis.call("get", KEYS[1]) == ARGV[1] then return redis.call("del", KEYS[1]) else return 0 end ';

CLIENT_CONFIG = None
CLIENT        = None

class RedisHelper(object):
    def __init__(self, logger, config=None, database=None, *args, **kwargs):
        self.logger = logger

        self.skip_log = False

        self.checked_keys = set()

        if config:
            if database:
                config['db'] = database

            self.config = config

            self.config['tsMaxAge']      = config.get('tsMaxAge')      or 3600 * 24
            self.config['tsMaxPeriod']   = config.get('tsMaxPeriod')   or 3600 * 24 * 3
            self.config['tsMinInterval'] = config.get('tsMinInterval') or 60

            self.client = redis.Redis(**get_config(config))

        else:
            global CLIENT_CONFIG
            global CLIENT

            if not CLIENT:
                CLIENT_CONFIG = {
                    'host'    : CONFIG['REDIS_HOST'],
                    'port'    : CONFIG['REDIS_PORT'],
                    'database': CONFIG['REDIS_DATABASE'],
                    'password': CONFIG['REDIS_PASSWORD'],
                    'useTLS'  : CONFIG['REDIS_USE_TLS'],
                }

                CLIENT_CONFIG['tsMaxAge']      = CONFIG.get('REDIS_TS_MAX_AGE')
                CLIENT_CONFIG['tsMaxPeriod']   = CONFIG.get('REDIS_TS_MAX_PERIOD')
                CLIENT_CONFIG['tsMinInterval'] = CONFIG.get('REDIS_TS_MIN_INTERVAL')

                CLIENT = redis.Redis(**get_config(CLIENT_CONFIG))

            self.config = CLIENT_CONFIG
            self.client = CLIENT

    def __del__(self):
        if self.client and self.client is not CLIENT:
            self.client.close()

    def check(self):
        try:
            self.client.info()

        except Exception as e:
            for line in traceback.format_exc().splitlines():
                self.logger.error(line)

            raise Exception(str(e))

    def query(self, *args, **options):
        command      = args[0]
        command_args = args[1:]

        if not self.skip_log:
            key = ''
            if len(command_args) > 1:
                key = command_args[0] + ' ...'
            elif len(command_args) > 0:
                key = command_args[0]

            options_dump = ''
            if options:
                options_dump = 'options=' + toolkit.json_dumps(options)

            self.logger.debug('[REDIS] Query `{} {}` {}'.format(command.upper(), key, options_dump))

        return self.client.execute_command(*args, **options);

    def run(self, *args, **kwargs):
        command      = args[0]
        command_args = args[1:]

        if not self.skip_log:
            key = ''
            if len(command_args) > 1:
                key = command_args[0] + ' ...'
            elif len(command_args) > 0:
                key = command_args[0]

            kwargs_dump = ''
            if kwargs:
                kwargs_dump = 'kwargs=' + toolkit.json_dumps(kwargs)
            self.logger.debug('[REDIS] Run `{} {}` {}'.format(command.upper(), key, kwargs_dump))

        return getattr(self.client, command)(*command_args, **kwargs)

    def keys(self, pattern='*'):
        found_keys = []

        COUNT_LIMIT = 1000
        next_cursor = 0
        while True:
            next_cursor, keys = self.run('scan', cursor=next_cursor, match=pattern, count=COUNT_LIMIT)
            if isinstance(keys, list) and len(keys) > 0:
                for k in keys:
                    found_keys.append(six.ensure_str(k))

            if next_cursor == 0:
                break

        found_keys = list(set(found_keys))
        return found_keys

    def exists(self, key):
        return self.run('exists', key)

    def get(self, key):
        return self.run('get', key)

    def getset(self, key, value):
        return self.run('getset', key, value)

    def set(self, key, value):
        return self.run('set', key, value)

    def setnx(self, key, value):
        return self.run('setnx', key, value)

    def setex(self, key, max_age, value):
        return self.run('setex', key, max_age, value)

    def setexnx(self, key, max_age, value):
        return self.run('set', key, value, ex=max_age, nx=True)

    def mget(self, keys, *args):
        return self.run('mget', keys, *args)

    def mset(self, key_values, **kwargs):
        return self.run('mset', key_values, **kwargs)

    def incr(self, key):
        return self.run('incr', key)

    def incrby(self, key, increment):
        return self.run('incrby', key, amount=increment)

    def delete(self, keys):
        if not isinstance(key, list):
            keys = [keys]
        return self.run('delete', *keys)

    def del_by_pattern(self, pattern):
        if not self.skip_log:
            self.logger.debug('[REDIS] DEL by pattern `{}`'.format(pattern))

        keys = self.keys(pattern)
        if len(keys) <= 0:
            return None
        else:
            return self.delete(keys)

    def expire(self, key, expires):
        return self.run('expire', key, expires)

    def expireat(self, key, timestamp):
        return self.run('expireat', key, timestamp)

    def hkeys(self, key, pattern='*'):
        found_keys = []

        COUNT_LIMIT = 1000
        next_cursor = 0
        while True:
            next_cursor, keys = self.run('hscan', key, cursor=next_cursor, match=pattern, count=COUNT_LIMIT)
            if len(keys) > 0:
                if isinstance(keys, dict):
                    keys = list(keys.keys())

                if isinstance(keys, list):
                    for k in keys:
                        found_keys.append(six.ensure_str(k))

            if next_cursor == 0:
                break

        found_keys = list(set(found_keys))
        return found_keys

    def hget(self, key, field):
        return self.run('hget', key, field)

    def hmget(self, key, fields):
        return self.run('hmget', key, fields)

    def hgetall(self, key):
        result = self.run('hgetall', key)
        result = dict([(six.ensure_str(k), v) for k, v in result.items()])
        return result

    def hset(self, key, field, value):
        return self.run('hset', key, field, value)

    def hsetnx(self, key, field, value):
        return self.run('hsetnx', key, field, value)

    def hmset(self, key, obj):
        return self.run('hmset', key, obj)

    def hincr(self, key, field):
        return self.run('hincrby', key, field, amount=1)

    def hincrby(self, key, field, increment):
        return self.run('hincrby', key, field, amount=increment)

    def hdel(self, key, fields):
        return self.run('hdel', key, *fields)

    def lpush(self, key, value):
        return self.run('lpush', key, value)

    def rpush(self, key, value):
        return self.run('rpush', key, value)

    def lpop(self, key):
        return self.run('lpop', key)

    def rpop(self, key):
        return self.run('rpop', key)

    def llen(self, key):
        return self.run('llen', key)

    def lrange(self, key, start, stop):
        return self.run('lrange', key, start, stop);

    def ltrim(self, key, start, stop):
        return self.run('ltrim', key, start, stop);

    def rpoplpush(self, key, dest_key=None, dest_scope=None):
        if dest_key is None:
            dest_key = key
        if dest_scope is None:
            dest_scope = scope

        return self.run('rpoplpush', key, dest_key)

    def ttl(self, key):
        return self.run('ttl', key)

    def type(self, key):
        return self.run('type', key)

    def dbsize(self):
        return self.run('dbsize')

    def info(self):
        return self.run('info')

    def lock(self, lock_key, lock_value, max_lock_time):
        return self.run('set', lock_key, lock_value, ex=max_lock_time, nx=True)

    def extend_lock_time(self, lock_key, lock_value, max_lock_time):
        expected_lock_value = self.run('get', lock_key)
        expected_lock_value = six.ensure_str(expected_lock_value)
        if expected_lock_value != lock_value:
            raise Error('Not lock owner')

        self.run('expire', lock_key, max_lock_time)

    def unlock(self, lock_key, lock_value):
        return self.run('eval', LUA_UNLOCK_KEY, LUA_UNLOCK_KEY_KEY_NUMBER, lock_key, lock_value)

    def ts_parse_point(self, point):
        timestamp, value = six.ensure_str(point).split(',', 1)
        timestamp = int(timestamp.split('.')[0])
        value     = toolkit.json_loads(value)
        return [timestamp, value]

    def ts_add(self, key, value, timestamp=None, mode=None):
        mode = mode or 'update'

        if not self.skip_log:
            self.logger.debug('[REDIS] TS Add `{}`'.format(key))

        if key not in self.checked_keys:
            cache_res = self.client.type(key)
            if six.ensure_str(cache_res) != 'zset':
                self.client.delete(key)

            self.checked_keys.add(key)

        timestamp = timestamp or int(time.time())

        # 时间戳自动根据最小间隔对齐
        timestamp = int(timestamp / self.config['tsMinInterval']) * self.config['tsMinInterval']

        if mode.lower() == 'addup':
            prev_points = self.client.zrangebyscore(key, timestamp, timestamp)
            if prev_points:
                _, prev_value = self.ts_parse_point(prev_points[0])
                value += float(prev_value)

        self.client.zremrangebyscore(key, timestamp, timestamp)

        value = toolkit.json_dumps(value)
        data = ','.join([str(timestamp), value])
        self.client.zadd(key, {data: timestamp})

        self.client.expire(key, self.config['tsMaxAge'])

        if self.config['tsMaxPeriod']:
            min_timestamp = int(time.time()) - self.config['tsMaxPeriod']
            self.client.zremrangebyscore(key, '-inf', min_timestamp)

    def ts_get(self, key, start='-inf', stop='+inf', group_time=1, agg='avg', scale=1, ndigits=2, time_unit='s', dict_output=False, limit=None):
        if not self.skip_log:
            self.logger.debug('[REDIS] TS Get `{}`'.format(key))

        if key not in self.checked_keys:
            cache_res = self.client.type(key)
            if six.ensure_str(cache_res) != 'zset':
                self.client.delete(key)

            self.checked_keys.add(key)

        ts_data = self.client.zrangebyscore(key, start, stop)
        ts_data = list(map(self.ts_parse_point, ts_data))

        if ts_data and group_time and group_time > 1:
            temp = []

            # latest_timestamp = ts_data[-1][0]
            for d in ts_data:
                grouped_timestamp = int(d[0] / group_time) * group_time
                # grouped_timestamp = latest_timestamp - int((latest_timestamp - d[0]) / group_time) * group_time

                if len(temp) <= 0 or temp[-1][0] != grouped_timestamp:
                    temp.append([grouped_timestamp, [d[1]]])
                else:
                    temp[-1][1].append(d[1])

            for d in temp:
                if agg == 'count':
                    d[1] = len(d[1])

                elif agg == 'avg':
                    count = len(d[1])
                    d[1] = functools.reduce(lambda acc, x: acc + x, d[1]) / count

                elif agg == 'sum':
                    d[1] = functools.reduce(lambda acc, x: acc + x, d[1])

                elif agg == 'min':
                    d[1] = min(d[1])

                elif agg == 'max':
                    d[1] = max(d[1])

            ts_data = temp

        if limit:
            ts_data = ts_data[-1 * limit:]

        for d in ts_data:
            if isinstance(d[1], (int, float)):
                if scale and scale != 1:
                    d[1] = d[1] / scale

                if ndigits > 0:
                    d[1] = round(d[1], ndigits)
                else:
                    d[1] = int(d[1])

            if time_unit == 'ms':
                d[0] = d[0] * 1000

        if dict_output:
            ts_data = list(map(lambda x: { 't': x[0], 'v': x[1] }, ts_data))

        return ts_data
