# -*- coding: utf-8 -*-

# Builtin Modules
import traceback

# 3rd-party Modules
import six
import requests

# Project Modules
from worker.utils import yaml_resources, toolkit
from worker.utils.extra_helpers.dataway import DataWay

CONFIG = yaml_resources.get('CONFIG')

def get_config(c):
    return toolkit.no_none_or_white_space({
        'url'       : c.get('url'),
        'host'      : c.get('host'),
        'port'      : c.get('port'),
        'protocol'  : c.get('protocol'),
        'path'      : c.get('path'),
        'token'     : c.get('token'),
        'rp'        : c.get('rp'),
        'access_key': c.get('accessKey'),
        'secret_key': c.get('secretKey'),
        'debug'     : c.get('debug', False),
    })

class DFDataWayHelper(object):
    def __init__(self, logger, config, token=None, rp=None, *args, **kwargs):
        self.logger = logger

        if token:
            config['token'] = token

        if rp:
            config['rp'] = rp

        self.config = config
        self.client = DataWay(**get_config(config))

    def __del__(self):
        pass

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

            e = Exception(str(e))
            raise e

    def __getattr__(self, name):
        return self.client.__getattribute__(name)
