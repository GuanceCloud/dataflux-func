# -*- coding: utf-8 -*-

# Builtin Modules
import traceback

# 3rd-party Modules
import six

# Project Modules
from worker.utils import toolkit

def get_config(c):
    servers = c.get('servers') or None
    if servers and isinstance(servers, (six.string_types, six.text_type)):
        servers = servers.split(',')

    servers = servers or '127.0.0.1:11211'
    servers = toolkit.as_array(servers)

    return servers

LIMIT_ARGS_DUMP = 200

class MemcachedHelper(object):
    def __init__(self, logger, config, *args, **kwargs):
        import memcache

        self.logger = logger

        self.config = config
        self.client = memcache.Client(get_config(config))

    def __del__(self):
        if not self.client:
            return

        try:
            self.client.disconnect_all()

        except Exception as e:
            for line in traceback.format_exc().splitlines():
                self.logger.error(line)

        finally:
            self.client = None

    def check(self):
        try:
            self.client.get_stats()

        except Exception as e:
            for line in traceback.format_exc().splitlines():
                self.logger.error(line)

            raise Exception(str(e))

    def query(self, *args):
        command      = args[0]
        command_args = args[1:]

        args_dumps = ', '.join([toolkit.json_dumps(x) for x in command_args])
        if len(args_dumps) > LIMIT_ARGS_DUMP:
            args_dumps = args_dumps[0:LIMIT_ARGS_DUMP-3] + '...'

        self.logger.debug('[MEMCACHED] Query `{}` <- `{}`'.format(command.upper(), args_dumps))

        return getattr(self.client, command.lower())(*command_args)

    def run(self, *args, **kwargs):
        command      = args[0]
        command_args = args[1:]

        args_dumps = ', '.join([toolkit.json_dumps(x) for x in command_args])
        if len(args_dumps) > LIMIT_ARGS_DUMP:
            args_dumps = args_dumps[0:LIMIT_ARGS_DUMP-3] + '...'

        self.logger.debug('[MEMCACHED] Run `{}` <- `{}`'.format(command.upper(), args_dumps))

        return getattr(self.client, command.lower())(*command_args, **kwargs)

    def get(self, key):
        return self.run('get', key)

    def set(self, key, value):
        return self.run('set', key, value)

    def add(self, key, value):
        return self.run('add', key, value)

    def replace(self, key, value):
        return self.run('replace', key, value)

    def delete(self, key):
        return self.run('delete', key)
