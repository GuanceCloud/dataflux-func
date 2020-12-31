# -*- coding: utf-8 -*-

# Builtin Modules
import json
import time
import traceback
import functools

# 3rd-party Modules
import six
import simplejson
import redis

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
    }
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

            self.config['tsMaxAge']    = config.get('tsMaxAge')    or 3600 * 24
            self.config['tsMaxPeriod'] = config.get('tsMaxPeriod') or 3600 * 24 * 3
            self.config['tsMaxLength'] = config.get('tsMaxLength') or 60 * 24 * 3

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
                }

                CLIENT_CONFIG['tsMaxAge']    = CONFIG.get('REDIS_TS_MAX_AGE')
                CLIENT_CONFIG['tsMaxPeriod'] = CONFIG.get('REDIS_TS_MAX_PERIOD')
                CLIENT_CONFIG['tsMaxLength'] = CONFIG.get('REDIS_TS_MAX_LENGTH')

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
        if not self.skip_log:
            self.logger.debug('[REDIS QUERY] {} <- `{}` ({})'.format(
                args[0].upper(),
                ', '.join([json.dumps(x) for x in args[1:]]),
                json.dumps(options)
            ))

        return self.client.execute_command(*args, **options);

    def run(self, *args, **kwargs):
        command      = args[0]
        command_args = args[1:]

        if not self.skip_log:
            args_dumps = ', '.join([json.dumps(x) for x in command_args])
            if len(args_dumps) > LIMIT_ARGS_DUMP:
                args_dumps = args_dumps[0:LIMIT_ARGS_DUMP-3] + '...'

            self.logger.debug('[REDIS RUN] {} <- `{}`'.format(command.upper(), args_dumps))

        return getattr(self.client, command)(*command_args, **kwargs)

    def keys(self, pattern):
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

    def delete(self, key):
        return self.run('delete', key)

    def expire(self, key, expires):
        return self.run('expire', key, expires)

    def expireat(self, key, timestamp):
        return self.run('expireat', key, timestamp)

    def hkeys(self, key, pattern):
        found_keys = []

        COUNT_LIMIT = 1000
        next_cursor = 0
        while True:
            next_cursor, keys = self.run('hscan', cursor=next_cursor, match=pattern, count=COUNT_LIMIT)
            if isinstance(keys, list) and len(keys) > 0:
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
        return self.run('hgetall', key)

    def hset(self, key, field, value):
        return self.run('hset', key, field, value)

    def hsetnx(self, key, field, value):
        return self.run('hsetnx', key, field, value)

    def hmset(self, key, obj):
        return self.run('hmset', key, obj)

    def hincr(self, key, field):
        return self.run('hincr', key, field)

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

    def ts_add(self, key, value, timestamp=None):
        if key not in self.checked_keys:
            cache_res = self.client.type(key)
            if six.ensure_str(cache_res) != 'zset':
                self.client.delete(key)

            self.checked_keys.add(key)

        timestamp = timestamp or int(time.time())
        value = toolkit.json_safe_dumps(value, indent=0)

        data = ','.join([str(timestamp), value])
        self.client.zadd(key, {data: timestamp})

        self.client.expire(key, self.config['tsMaxAge'])

        if self.config['tsMaxPeriod']:
            min_timestamp = int(time.time()) - self.config['tsMaxPeriod']
            self.client.zremrangebyscore(key, '-inf', min_timestamp)

        if self.config['tsMaxLength']:
            self.client.zremrangebyrank(key, 0, -1 * self.config['tsMaxLength'] - 1)

    def ts_get(self, key, start='-inf', stop='+inf', group_time=1, agg='avg', scale=1, ndigits=2, time_unit='s', dict_output=False, limit=None):
        if key not in self.checked_keys:
            cache_res = self.client.type(key)
            if six.ensure_str(cache_res) != 'zset':
                self.client.delete(key)

            self.checked_keys.add(key)

        ts_data = self.client.zrangebyscore(key, start, stop)

        def _parse(p):
            timestamp, value = six.ensure_str(p).split(',', 1)
            timestamp = int(timestamp.split('.')[0])
            value     = simplejson.loads(value)
            return [timestamp, value]

        ts_data = list(map(_parse, ts_data))

        if group_time and group_time > 1:
            temp = []

            for d in ts_data:
                grouped_timestamp = int(d[0] / group_time) * group_time
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

                if ndigits:
                    d[1] = round(d[1], ndigits)

            if time_unit == 'ms':
                d[0] = d[0] * 1000

        if dict_output:
            ts_data = list(map(lambda x: { 't': x[0], 'v': x[1] }, ts_data))

        return ts_data
