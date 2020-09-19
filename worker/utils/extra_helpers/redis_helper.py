# -*- coding: utf-8 -*-

# Builtin Modules
import json
import time
import traceback

# 3rd-party Modules
import redis

# Project Modules
from worker.utils import yaml_resources
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

        if config:
            if database:
                config['db'] = database

            self.config = config
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

    def run_quiet(self, *args, **kwargs):
        command      = args[0]
        command_args = args[1:]

        return getattr(self.client, command)(*command_args, **kwargs)

    def exists(self, key):
        return self.run('exists', key)

    def get(self, key):
        return self.run('get', key)

    def set(self, key, value):
        return self.run('set', key, value)

    def setnx(self, key, value):
        return self.run('setnx', key, value)

    def setex(self, key, max_age, value):
        return self.run('setex', key, max_age, value)

    def delete(self, key):
        return self.run('delete', key)

    def mget(self, keys, *args):
        return self.run('mget', keys, *args)

    def mset(self, keyValues, **kwargs):
        return self.run('mset', keyValues, **kwargs)

    def lock(self, lock_key, lock_value, max_lock_time):
        return self.run('set', lock_key, lock_value, ex=max_lock_time, nx=True)

    def unlock(self, lock_key, lock_value):
        return self.run('eval', LUA_UNLOCK_KEY, LUA_UNLOCK_KEY_KEY_NUMBER, lock_key, lock_value)
