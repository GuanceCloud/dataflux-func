# -*- coding: utf-8 -*-

# Builtin Modules
import traceback

# 3rd-party Modules
import six
import requests

# Project Modules
from worker.utils import yaml_resources, toolkit
from worker.utils.extra_helpers.datakit import DataKit

CONFIG = yaml_resources.get('CONFIG')

def get_config(c):
    return toolkit.no_none_or_white_space({
        'url'     : c.get('url'),
        'host'    : c.get('host'),
        'port'    : c.get('port'),
        'protocol': c.get('protocol'),
        'debug'   : c.get('debug', False),
    })

class DFDataKitHelper(object):
    def __init__(self, logger, config, *args, **kwargs):
        self.logger = logger

        self.config = config
        self.client = DataKit(**get_config(config))

    def __del__(self):
        pass

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

            e = Exception(str(e))
            raise e

    def __getattr__(self, name):
        return self.client.__getattribute__(name)
