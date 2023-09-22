# -*- coding: utf-8 -*-

# Built-in Modules
import time
import traceback
import functools

# 3rd-party Modules
import redis
import arrow
import six

# Project Modules
from worker.utils import toolkit, yaml_resources

CONFIG = yaml_resources.get('CONFIG')

def get_config(c):
    config = {
        'host': c.get('host')   or '127.0.0.1',
        'port': c.get('port')   or 6379,
        'db'  : c.get('db')     or c.get('database'),
        'ssl' : c.get('useSSL') or c.get('useTLS'),
    }

    if config['ssl'] is True:
        config['ssl_cert_reqs'] = None

    if c.get('password'):
        if not c.get('user'):
            # Only password
            config['password'] = c['password']

        else:
            # user and password
            if c.get('authType') == 'aliyun':
                # Aliyun special auth type
                config['password'] = f"{c['user']}:{c['password']}"

            else:
                # Default auth type
                config['username'] = c['user']
                config['password'] = c['password']

    return config

LIMIT_ARGS_DUMP = 200

# LUA
LUA_UNLOCK_SCRIPT_KEY_COUNT = 1
LUA_UNLOCK_SCRIPT = 'if redis.call("get", KEYS[1]) == ARGV[1] then return redis.call("del", KEYS[1]) else return 0 end '

LUA_ZPOP_LPUSH_SCRIPT_KEY_COUNT = 2
LUA_ZPOP_BELOW_LPUSH_SCRIPT = 'if redis.call("zcount", KEYS[1], "-inf", ARGV[1]) > 0 then return redis.call("lpush", KEYS[2], redis.call("zpopmin", KEYS[1])[1]) else return nil end '
LUA_ZPOP_ABOVE_LPUSH_SCRIPT = 'if redis.call("zcount", KEYS[1], ARGV[1], "+inf") > 0 then return redis.call("lpush", KEYS[2], redis.call("zpopmax", KEYS[1])[1]) else return nil end '

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
                    'user'    : CONFIG['REDIS_USER'],
                    'password': CONFIG['REDIS_PASSWORD'],
                    'useTLS'  : CONFIG['REDIS_USE_TLS'],
                    'authType': CONFIG['REDIS_AUTH_TYPE'],
                }

                CLIENT_CONFIG['tsMaxAge']      = CONFIG.get('REDIS_TS_MAX_AGE')
                CLIENT_CONFIG['tsMaxPeriod']   = CONFIG.get('REDIS_TS_MAX_PERIOD')
                CLIENT_CONFIG['tsMinInterval'] = CONFIG.get('REDIS_TS_MIN_INTERVAL')

                CLIENT = redis.Redis(**get_config(CLIENT_CONFIG))

            self.config = CLIENT_CONFIG
            self.client = CLIENT

    def __del__(self):
        if not self.client or self.client is CLIENT:
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
            _t = toolkit.get_timestamp_ms()
            self.client.info()

        except Exception as e:
            for line in traceback.format_exc().splitlines():
                self.logger.error(line)

            raise Exception(str(e))

        else:
            if not self.skip_log:
                self.logger.debug(f'[REDIS] INFO (Cost: {toolkit.get_timestamp_ms() - _t} ms)')

    def query(self, *args, **options):
        command      = args[0]
        command_args = args[1:]

        key = ''
        if len(command_args) > 1:
            key = command_args[0] + ' ...'
        elif len(command_args) > 0:
            key = command_args[0]

        options_dump = ''
        if options:
            options_dump = 'options=' + toolkit.json_dumps(options)

        try:
            _t = toolkit.get_timestamp_ms()
            return self.client.execute_command(*args, **options)

        except Exception as e:
            self.logger.error(f'[REDIS] Query `{command.upper()} {key}` {options_dump} (Cost: {toolkit.get_timestamp_ms() - _t} ms)')
            raise

        else:
            if not self.skip_log:
                self.logger.debug(f'[REDIS] Query `{command.upper()} {key}` {options_dump} (Cost: {toolkit.get_timestamp_ms() - _t} ms)')

    def run(self, *args, **kwargs):
        command      = args[0]
        command_args = args[1:]

        key = ''
        if len(command_args) > 0:
            key = command_args[0]
            if isinstance(key, (list, tuple)):
                key = ', '.join([str(k) for k in key])
            elif isinstance(key, dict):
                key = ', '.join(key.keys())

        dumps = ' '.join([
            ' '.join([ str(x) for x in command_args[1:]]),
            ' '.join([ f'{k}={v}' for k, v in kwargs.items()])
        ]).strip()


        try:
            _t = toolkit.get_timestamp_ms()
            return getattr(self.client, command)(*command_args, **kwargs)

        except Exception as e:
            self.logger.error(f'[REDIS] Run `{command.upper()} {key} {dumps} (Cost: {toolkit.get_timestamp_ms() - _t} ms)`')
            raise

        else:
            if not self.skip_log:
                self.logger.debug(f'[REDIS] Run `{command.upper()} {key} {dumps} (Cost: {toolkit.get_timestamp_ms() - _t} ms)`')

    def publish(self, topic, message):
        return self.run('publish', topic, message)

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
        if max_age <= 0:
            max_age = 1;
        return self.run('setex', key, max_age, value)

    def setexnx(self, key, max_age, value):
        if max_age <= 0:
            max_age = 1;
        return self.run('set', key, value, ex=max_age, nx=True)

    def mget(self, keys, *args):
        return self.run('mget', keys, *args)

    def get_by_pattern(self, pattern):
        if not self.skip_log:
            self.logger.debug('[REDIS] GET by pattern `{}`'.format(pattern))

        keys = self.keys(pattern)
        if len(keys) <= 0:
            return None
        else:
            return self.mget(keys)

    def mset(self, key_values, **kwargs):
        return self.run('mset', key_values, **kwargs)

    def incr(self, key):
        return self.run('incr', key)

    def incrby(self, key, increment):
        return self.run('incrby', key, amount=increment)

    def delete(self, keys):
        if not isinstance(keys, list):
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
        if expires <= 0:
            expires = 1
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

    def hdel(self, key, field):
        field = toolkit.as_array(field)
        return self.run('hdel', key, *field)

    def lpush(self, key, value):
        return self.run('lpush', key, value)

    def rpush(self, key, value):
        return self.run('rpush', key, value)

    def lpop(self, key, count=1):
        return self.run('lpop', key, count)

    def blpop(self, key, timeout=0):
        return self.run('blpop', key, timeout=timeout)

    def rpop(self, key, count=1):
        return self.run('rpop', key, count)

    def brpop(self, key, timeout=0):
        return self.run('brpop', key, timeout=timeout)

    def llen(self, key):
        return self.run('llen', key)

    def lrange(self, key, start, stop):
        return self.run('lrange', key, start, stop);

    def ltrim(self, key, start, stop):
        return self.run('ltrim', key, start, stop);

    def rpoplpush(self, key, dest_key=None):
        if dest_key is None:
            dest_key = key

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
        if max_lock_time <= 0:
            max_lock_time = 1
        return self.run('set', lock_key, lock_value, ex=max_lock_time, nx=True)

    def extend_lock_time(self, lock_key, lock_value, max_lock_time):
        if max_lock_time <= 0:
            max_lock_time = 1

        expected_lock_value = self.run('get', lock_key)
        expected_lock_value = six.ensure_str(expected_lock_value)
        if expected_lock_value != lock_value:
            raise Exception('Not lock owner')

        self.run('expire', lock_key, max_lock_time)

    def unlock(self, lock_key, lock_value):
        return self.run('eval', LUA_UNLOCK_SCRIPT, LUA_UNLOCK_SCRIPT_KEY_COUNT, lock_key, lock_value)

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

    def ts_get(self, key, start='-inf', stop='+inf', group_time=1, agg='avg', scale=1, ndigits=2, time_unit='s', dict_output=False, limit=None, fill_zero=False):
        if not self.skip_log:
            self.logger.debug('[REDIS] TS Get `{}`'.format(key))

        if key not in self.checked_keys:
            cache_res = self.client.type(key)
            if six.ensure_str(cache_res) != 'zset':
                self.client.delete(key)

            self.checked_keys.add(key)

        ts_data = self.client.zrangebyscore(key, start, stop)
        ts_data = list(map(self.ts_parse_point, ts_data))

        if ts_data and group_time and group_time >= 1:
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

            if fill_zero:
                zero_fill_map = dict([(d[0], d[1]) for d in temp])

                _next_temp = []
                for ts in range(int(temp[0][0]), int(temp[-1][0]) + group_time, group_time):
                    _next_temp.append([ts, zero_fill_map.get(ts) or 0])

                temp = _next_temp

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

    def zadd(self, key, score, value):
        return self.run('zadd', key, { value: score })

    def zpop_below_lpush(self, key, dest_key, score):
        return self.run('eval', LUA_ZPOP_BELOW_LPUSH_SCRIPT, LUA_ZPOP_LPUSH_SCRIPT_KEY_COUNT, key, dest_key, score)

    def zpop_above_lpush(self, key, dest_key, score):
        return self.run('eval', LUA_ZPOP_ABOVE_LPUSH_SCRIPT, LUA_ZPOP_LPUSH_SCRIPT_KEY_COUNT, key, dest_key, score)

    def put_task(self, task_req):
        task_req = task_req or {}

        if not task_req.get('name'):
            raise Exception("task_req['name'] is required")

        # Put task
        task_req['id']          = task_req.get('id')          or toolkit.gen_task_id()
        task_req['triggerTime'] = task_req.get('triggerTime') or toolkit.get_timestamp(3)

        if toolkit.is_none_or_whitespace(task_req.get('queue')):
            task_req['queue'] = CONFIG['_TASK_QUEUE_DEFAULT']

        task_req_dumps = toolkit.json_dumps(task_req)

        # 计算执行时间
        run_time = 0
        if task_req.get('eta') or task_req.get('delay'):
            if task_req.get('eta'):
                # 优先使用 eta
                run_time = arrow.get(task_req['eta']).timestamp
                task_req.pop('delay', None)

            elif task_req.get('delay'):
                run_time = task_req['triggerTime'] + task_req['delay']
                task_req.pop('eta', None)

        # 发送任务
        if run_time <= arrow.get().timestamp:
            worker_queue = toolkit.get_worker_queue(task_req['queue'])
            return self.lpush(worker_queue, task_req_dumps)

        else:
            delay_queue = toolkit.get_delay_queue(task_req['queue'])
            return self.zadd(delay_queue, run_time, task_req_dumps)
