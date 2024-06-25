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
LUA_UNLOCK_SCRIPT = '''
    if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1]);
    else
        return 0;
    end
'''

LUA_ZPOP_LPUSH_SCRIPT_KEY_COUNT = 2
LUA_ZPOP_BELOW_LPUSH_SCRIPT = '''
    if redis.call("zcount", KEYS[1], "-inf", ARGV[1]) > 0 then
        return redis.call("lpush", KEYS[2], redis.call("zpopmin", KEYS[1])[1]);
    else
        return nil;
    end
'''
LUA_ZPOP_ABOVE_LPUSH_SCRIPT = '''
    if redis.call("zcount", KEYS[1], ARGV[1], "+inf") > 0 then
        return redis.call("lpush", KEYS[2], redis.call("zpopmax", KEYS[1])[1]);
    else
        return nil;
    end
'''
LUA_ZPOP_BELOW_LPUSH_ALL_SCRIPT = '''
    local count = 0
    while redis.call("zcount", KEYS[1], "-inf", ARGV[1]) > 0 do
        redis.call("lpush", KEYS[2], redis.call("zpopmin", KEYS[1])[1]);
        count = count + 1;
    end
    return count;
'''

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

    def _convert_result(self, result):
        if isinstance(result, bytes):
            return six.ensure_str(result)

        elif isinstance(result, (list, tuple, set)):
            return list(map(lambda x: self._convert_result(x), result))

        elif isinstance(result, dict):
            return dict([ (self._convert_result(k), self._convert_result(v)) for k, v in result.items() ])
        else:
            return result

    def _parse_ts_point(self, point):
        timestamp, value = six.ensure_str(point).split(',', 1)
        timestamp = int(timestamp.split('.')[0])
        value     = toolkit.json_loads(value)
        return [timestamp, value]

    def check(self):
        try:
            dt = toolkit.DiffTimer()
            self.client.info()

            if not self.skip_log:
                self.logger.debug(f'[REDIS] INFO (Cost: {dt.tick()} ms)')

        except Exception as e:
            for line in traceback.format_exc().splitlines():
                self.logger.error(line)

            raise

    def query(self, *args, **kwargs):
        return self.run(*args, **kwargs)

    def run(self, *args, **kwargs):
        command      = args[0]
        command_args = args[1:]

        key_dump = ''
        if len(command_args) > 0:
            key_dump = command_args[0]
            if isinstance(key_dump, (list, tuple)):
                key_dump = ', '.join([str(k) for k in key_dump])
            elif isinstance(key_dump, dict):
                key_dump = ', '.join(key_dump.keys())

        args_kwargs_dump = ' '.join([
            ' '.join([ str(x) for x in command_args[1:]]),
            ' '.join([ f'{k}={v}' for k, v in kwargs.items()])
        ]).strip()

        args_kwargs_dump = toolkit.limit_text(args_kwargs_dump, max_length=100)

        # Ensure one-line
        key_dump         = key_dump.replace('\n', ' ').strip()
        args_kwargs_dump = args_kwargs_dump.replace('\n', ' ').strip()

        try:
            dt = toolkit.DiffTimer()
            result = getattr(self.client, command)(*command_args, **kwargs)

            if not self.skip_log:
                self.logger.debug(f"[REDIS] Run `{command.upper()} {key_dump} {args_kwargs_dump}` (Cost: {dt.tick()} ms)")

            return result

        except Exception as e:
            self.logger.error(f"[REDIS] Run `{command.upper()} {key_dump} {args_kwargs_dump}` (Cost: {dt.tick()} ms)")
            raise

    # DB
    def dbsize(self):
        return self.run('dbsize')

    def info(self):
        return self.run('info')

    # Generic
    def type(self, key):
        data_type = self._convert_result(self.run('type', key))
        if data_type == 'none':
            data_type = None

        return data_type

    def keys(self, pattern='*', limit=None):
        found_keys = set()

        ITER_LIMIT = 1000
        next_cursor = 0
        while True:
            next_cursor, keys = self.run('scan', cursor=next_cursor, match=pattern, count=ITER_LIMIT)
            if isinstance(keys, list) and len(keys) > 0:
                for k in keys:
                    found_keys.add(self._convert_result(k))

            if limit and len(found_keys) > limit:
                return list(found_keys)[0:limit]

            if next_cursor == 0:
                break

        found_keys = list(found_keys)
        return found_keys

    def exists(self, key):
        return bool(self.run('exists', key))

    def expire(self, key, expires):
        if expires <= 0:
            expires = 1
        return self.run('expire', key, expires)

    def expireat(self, key, timestamp):
        return self.run('expireat', key, timestamp)

    def ttl(self, key):
        return self.run('ttl', key)

    def pttl(self, key):
        return self.run('pttl', key)

    def delete(self, keys):
        keys = toolkit.as_array(keys)
        if not keys:
            return 0
        return self.run('delete', *keys)

    # String
    def set(self, key, value, expires=None, not_exists=False, exists=False, get_old_value=False):
        return self.run('set', key, value, ex=expires, nx=not_exists, xx=exists, get=get_old_value)

    def mset(self, key_values):
        if not key_values:
            return False
        return self.run('mset', key_values)

    def get(self, key):
        return self._convert_result(self.run('get', key))

    def mget(self, keys):
        keys = toolkit.as_array(keys)
        if not keys:
            return {}

        res = self._convert_result(self.run('mget', keys))
        res = dict(zip(keys, res))
        return res

    def getset(self, key, value):
        return self._convert_result(self.run('getset', key, value))

    def incr(self, key):
        return self.run('incr', key)

    def incrby(self, key, step=1):
        return self.run('incrby', key, step)

    # Hash
    def hkeys(self, key, pattern='*', with_values=False):
        result = {}

        ITER_LIMIT = 1000
        next_cursor = 0
        while True:
            next_cursor, res = self.run('hscan', key, cursor=next_cursor, match=pattern, count=ITER_LIMIT)
            res = self._convert_result(res)
            result.update(res)

            if next_cursor == 0:
                break

        if with_values:
            return result
        else:
            return list(result.keys())

    def hset(self, key, field=None, value=None, field_values=None):
        return self.run('hset', key, field, value, field_values)

    def hmset(self, key, field_values):
        if not field_values:
            return False
        return self.run('hmset', key, field_values)

    def hsetnx(self, key, field, value):
        return self.run('hsetnx', key, field, value)

    def hget(self, key, field):
        return self._convert_result(self.run('hget', key, field))

    def hmget(self, key, fields):
        fields = toolkit.as_array(fields)
        if not fields:
            return {}

        res = self._convert_result(self.run('hmget', key, fields))
        res = dict(zip(fields, res))
        return res

    def hgetall(self, key):
        return self._convert_result(self.run('hgetall', key))

    def hincr(self, key, field):
        return self.run('hincrby', key, field, amount=1)

    def hincrby(self, key, field, step=1):
        return self.run('hincrby', key, field, step)

    def hdel(self, key, field):
        fields = toolkit.as_array(field)
        if not fields:
            return 0
        return self.run('hdel', key, *fields)

    # List
    def lpush(self, key, value):
        values = toolkit.as_array(value)
        if not values:
            return 0
        return self.run('lpush', key, *values)

    def rpush(self, key, value):
        values = toolkit.as_array(value)
        if not values:
            return 0
        return self.run('rpush', key, *values)

    def lpop(self, key, count=None):
        if count is None:
            return self._convert_result(self.run('lpop', key))
        else:
            return self._convert_result(self.run('lpop', key, count))

    def rpop(self, key, count=None):
        if count is None:
            return self._convert_result(self.run('rpop', key))
        else:
            return self._convert_result(self.run('rpop', key, count))

    def blpop(self, key, timeout=0):
        keys = toolkit.as_array(keys)
        if not keys:
            return None
        return self._convert_result(self.run('blpop', keys, timeout=timeout))

    def brpop(self, key, timeout=0):
        keys = toolkit.as_array(key)
        if not keys:
            return None
        return self._convert_result(self.run('brpop', keys, timeout=timeout))

    def rpoplpush(self, key, dest_key=None):
        if dest_key is None:
            dest_key = key
        return self._convert_result(self.run('rpoplpush', key, dest_key))

    def llen(self, key):
        return self.run('llen', key)

    def lrange(self, key, start=0, stop=-1):
        return self._convert_result(self.run('lrange', key, start, stop))

    def ltrim(self, key, start, stop):
        return self.run('ltrim', key, start, stop)

    # List 别名
    def push(self, *args, **kwargs):
        return self.lpush(*args, **kwargs)

    def pop(self, *args, **kwargs):
        return self.rpop(*args, **kwargs)

    def bpop(self, *args, **kwargs):
        return self.brpop(*args, **kwargs)

    # Set
    def sadd(self, key, member):
        members = toolkit.as_array(member)
        if not members:
            return 0
        return self._task.cache_db.run('sadd', key, *members)

    def srem(self, key, member):
        members = toolkit.as_array(member)
        if not members:
            return 0
        return self._task.cache_db.run('srem', key, *members)

    def scard(self, key):
        return self._task.cache_db.run('scard', key)

    def smembers(self, key):
        return self._convert_result(self._task.cache_db.run('smembers', key))

    def sismember(self, key, member):
        return self._task.cache_db.run('sismember', key, member)

    # ZSet
    def zadd(self, key, member_scores):
        return self.run('zadd', key, member_scores)

    def zrem(self, key, member):
        members = toolkit.as_array(member)
        if not members:
            return 0
        return self.run('zrem', key, *members)

    def zcard(self, key):
        return self.run('zcard', key)

    def zrange(self, key, start=0, stop=-1, by_score=False, by_lex=False, reverse=False, with_scores=False):
        return self.run('zrange', key, start, stop, byscore=by_score, bylex=by_lex, desc=reverse, withscores=with_scores)

    # Pub
    def publish(self, topic, message):
        return self.run('publish', topic, message)

    # Pub 别名
    def pub(self, *args, **kwargs):
        return self.publish(*args, **kwargs)

    # Extend
    def _keys(self, pattern='*'):
        found_keys = set()

        ITER_LIMIT = 1000
        next_cursor = 0
        while True:
            next_cursor, keys = self.client.scan(cursor=next_cursor, match=pattern, count=ITER_LIMIT)
            if isinstance(keys, list) and len(keys) > 0:
                for k in keys:
                    found_keys.add(self._convert_result(k))

            if next_cursor == 0:
                break

        found_keys = list(found_keys)
        return found_keys

    def get_pattern(self, pattern):
        if not self.skip_log:
            self.logger.debug('[REDIS EXT] GET pattern `{}`'.format(pattern))

        keys = self._keys(pattern)
        if len(keys) <= 0:
            return None
        else:
            res = self._convert_result(self.client.mget(keys))
            res = dict(zip(keys, res))
            return res

    def delete_pattern(self, pattern):
        if not self.skip_log:
            self.logger.debug('[REDIS EXT] DEL pattern `{}`'.format(pattern))

        keys = self._keys(pattern)
        if len(keys) <= 0:
            return None
        else:
            return self.client.delete(*keys)

    def hget_pattern(self, key, pattern):
        if not self.skip_log:
            self.logger.debug('[REDIS EXT] HGET pattern `{}` `{}`'.format(key, pattern))

        result = {}

        ITER_LIMIT = 1000
        next_cursor = 0
        while True:
            next_cursor, res = self.client.hscan(key, cursor=next_cursor, match=pattern, count=ITER_LIMIT)
            res = self._convert_result(res)
            result.update(res)

            if next_cursor == 0:
                break

        return result

    def hget_expires(self, key, field, expires=None):
        if not self.skip_log:
            self.logger.debug('[REDIS EXT] HGET expires `{}` `{}` `{}`'.format(key, field, expires))

        now = toolkit.get_timestamp()

        cache_res = self.client.hget(key, field)
        if not cache_res:
            return None

        cache_res = toolkit.json_loads(cache_res)

        if not expires:
            return cache_res
        else:
            ts = cache_res.get('ts') or cache_res.get('timestamp')
            if ts and ts + expires > now:
                return cache_res

        return None

    def hget_pattern_expires(self, key, pattern='*', expires=None):
        if not self.skip_log:
            self.logger.debug('[REDIS EXT] HGET pattern expires `{}` `{}` `{}`'.format(key, pattern, expires))

        now = toolkit.get_timestamp()

        result = {}

        ITER_LIMIT = 1000
        next_cursor = 0
        while True:
            next_cursor, res = self.client.hscan(key, cursor=next_cursor, match=pattern, count=ITER_LIMIT)
            res = self._convert_result(res)

            for k, v in res.items():
                v = toolkit.json_loads(v)

                if not expires:
                    result[k] = v

                else:
                    ts = v.get('ts') or v.get('timestamp')
                    if ts and ts + expires > now:
                        result[k] = v

            if next_cursor == 0:
                break

        return result

    def lock(self, lock_key, lock_value, max_lock_time):
        if not self.skip_log:
            self.logger.debug('[REDIS EXT] LOCK `{}`'.format(lock_key))

        if max_lock_time <= 0:
            max_lock_time = 1
        return self.client.set(lock_key, lock_value, ex=max_lock_time, nx=True)

    def extend_lock_time(self, lock_key, lock_value, max_lock_time):
        if not self.skip_log:
            self.logger.debug('[REDIS EXT] LOCK extend `{}`'.format(lock_key))

        if max_lock_time <= 0:
            max_lock_time = 1

        expected_lock_value = self._convert_result(self.client.get(lock_key))
        if expected_lock_value != lock_value:
            raise Exception('Not Lock owner')

        self.client.expire(lock_key, max_lock_time)

    def unlock(self, lock_key, lock_value):
        if not self.skip_log:
            self.logger.debug('[REDIS EXT] UNLOCK `{}`'.format(lock_key))

        return self.client.eval(LUA_UNLOCK_SCRIPT, LUA_UNLOCK_SCRIPT_KEY_COUNT, lock_key, lock_value)

    def ts_add(self, key, value, timestamp=None, mode=None):
        mode = mode or 'update'

        if not self.skip_log:
            self.logger.debug('[REDIS EXT] TS Add `{}`'.format(key))

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
                _, prev_value = self._parse_ts_point(prev_points[0])
                value += float(prev_value)

        self.client.zremrangebyscore(key, timestamp, timestamp)

        value = toolkit.json_dumps(value)
        data = ','.join([ str(timestamp), value ])
        self.client.zadd(key, { data: timestamp })

        self.client.expire(key, self.config['tsMaxAge'])

        if self.config['tsMaxPeriod']:
            min_timestamp = int(time.time()) - self.config['tsMaxPeriod']
            self.client.zremrangebyscore(key, '-inf', min_timestamp)

    def ts_get(self, key, start='-inf', stop='+inf', group_time=1, agg='avg', scale=1, ndigits=2, time_unit='s', dict_output=False, limit=None, fill_zero=False):
        if not self.skip_log:
            self.logger.debug('[REDIS EXT] TS Get `{}`'.format(key))

        if key not in self.checked_keys:
            cache_res = self.client.type(key)
            if six.ensure_str(cache_res) != 'zset':
                self.client.delete(key)

            self.checked_keys.add(key)

        ts_data = self.client.zrangebyscore(key, start, stop)
        ts_data = list(map(self._parse_ts_point, ts_data))

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

    def zpop_below_lpush(self, key, dest_key, score):
        if not self.skip_log:
            self.logger.debug('[REDIS EXT] ZPOP BELOW LPUSH `{}`'.format(key))

        return self._convert_result(self.client.eval(LUA_ZPOP_BELOW_LPUSH_SCRIPT, LUA_ZPOP_LPUSH_SCRIPT_KEY_COUNT, key, dest_key, score))

    def zpop_above_lpush(self, key, dest_key, score):
        if not self.skip_log:
            self.logger.debug('[REDIS EXT] ZPOP ABOVE LPUSH `{}`'.format(key))

        return self._convert_result(self.client.eval(LUA_ZPOP_ABOVE_LPUSH_SCRIPT, LUA_ZPOP_LPUSH_SCRIPT_KEY_COUNT, key, dest_key, score))

    def zpop_below_lpush_all(self, key, dest_key, score):
        if not self.skip_log:
            self.logger.debug('[REDIS EXT] ZPOP BELOW LPUSH ALL `{}`'.format(key))

        return self._convert_result(self.client.eval(LUA_ZPOP_BELOW_LPUSH_ALL_SCRIPT, LUA_ZPOP_LPUSH_SCRIPT_KEY_COUNT, key, dest_key, score))

    def put_tasks(self, task_reqs):
        task_reqs = toolkit.as_array(task_reqs)
        if not task_reqs:
            return

        worker_queue_element_map = {}
        delay_queue_element_map  = {}

        for task_req in task_reqs:
            task_req = task_req or {}

            if not task_req.get('name'):
                raise Exception("task_req['name'] is required")

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
                    run_time = arrow.get(task_req['eta']).int_timestamp
                    task_req.pop('delay', None)

                elif task_req.get('delay'):
                    run_time = task_req['triggerTime'] + task_req['delay']
                    task_req.pop('eta', None)

            if run_time <= arrow.get().int_timestamp:
                worker_queue = toolkit.get_worker_queue(task_req['queue'])
                worker_queue_element_map[worker_queue] = worker_queue_element_map.get(worker_queue) or []
                worker_queue_element_map[worker_queue].append(task_req_dumps)

            else:
                delay_queue = toolkit.get_delay_queue(task_req['queue'])
                delay_queue_element_map[delay_queue] = delay_queue_element_map.get(delay_queue) or {}
                delay_queue_element_map[delay_queue][task_req_dumps] = run_time

        # 发送任务
        pipe = self.client.pipeline()

        for worker_queue, elements in worker_queue_element_map.items():
            if not self.skip_log:
                self.logger.debug(f'[REDIS EXT] PUT TASK {worker_queue} <= {len(elements)} Tasks')

            pipe.lpush(worker_queue, *elements)

        for delay_queue, elements in delay_queue_element_map.items():
            if not self.skip_log:
                self.logger.debug(f'[REDIS EXT] PUT TASK {delay_queue} <= {len(elements)} Tasks')

            pipe.zadd(delay_queue, elements)

        pipe.execute()
