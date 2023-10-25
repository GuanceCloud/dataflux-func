# -*- coding: utf-8 -*-

# Built-in Modules
import traceback

# 3rd-party Modules
import requests

# Project Modules
from worker.utils import toolkit
from worker.utils.extra_helpers.dataway import DataWay

def get_config(c):
    return toolkit.no_none_or_whitespace({
        'url'       : c.get('url'),
        'host'      : c.get('host'),
        'port'      : c.get('port'),
        'protocol'  : c.get('protocol'),
        'path'      : c.get('path'),
        'token'     : c.get('token'),
        'rp'        : c.get('rp'),
        'access_key': c.get('accessKey'),
        'secret_key': c.get('secretKey'),
        'timeout'   : c.get('timeout') or 3,
        'debug'     : c.get('debug')   or False,
    })

class DataWayHelper(object):
    def __init__(self, logger, config, token=None, rp=None, timeout=None, *args, **kwargs):
        self.logger = logger

        if token:
            config['token'] = token

        if rp:
            config['rp'] = rp

        if timeout:
            config['timeout'] = timeout

        self.config = config
        self.client = DataWay(**get_config(config))

    def __del__(self):
        self.client = None

    def check(self):
        url = '{0}://{1}:{2}/'.format(
            self.config.get('protocol', 'http'),
            self.config.get('host'),
            self.config.get('port'))

        try:
            requests.get(url)

        except Exception as e:
            for line in traceback.format_exc().splitlines():
                self.logger.error(line)

            raise

    def __getattr__(self, name):
        return self.client.__getattribute__(name)
