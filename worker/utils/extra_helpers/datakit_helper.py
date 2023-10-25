# -*- coding: utf-8 -*-

# Built-in Modules
import traceback

# 3rd-party Modules
import requests

# Project Modules
from worker.utils import toolkit
from worker.utils.extra_helpers.datakit import DataKit

def get_config(c):
    return toolkit.no_none_or_whitespace({
        'url'     : c.get('url'),
        'host'    : c.get('host'),
        'port'    : c.get('port'),
        'protocol': c.get('protocol'),
        'source'  : c.get('source'),
        'timeout' : c.get('timeout') or 3,
        'debug'   : c.get('debug')   or False,
    })

class DataKitHelper(object):
    def __init__(self, logger, config, source=None, timeout=None, *args, **kwargs):
        self.logger = logger

        if source:
            config['source'] = source

        if timeout:
            config['timeout'] = timeout

        self.config = config
        self.client = DataKit(**get_config(config))

    def __del__(self):
        self.client = None

    def check(self):
        url = '{0}://{1}:{2}/v1/ping'.format(
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
