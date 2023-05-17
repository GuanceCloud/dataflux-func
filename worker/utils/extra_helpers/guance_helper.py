# -*- coding: utf-8 -*-

# Built-in Modules
import traceback

# 3rd-party Modules
import requests

# Project Modules
from worker.utils import toolkit
from worker.utils.extra_helpers.guance_openapi import GuanceOpenAPI
from worker.utils.extra_helpers.dataway import DataWay

def get_config(c):
    print(c)
    return toolkit.no_none_or_white_space({
        'url'       : c.get('guanceOpenAPIURL'),
        'api_key_id': c.get('guanceAPIKeyId'),
        'api_key'   : c.get('guanceAPIKey'),
    })

def get_config_dataway(c):
    return toolkit.no_none_or_white_space({
        'url'    : c.get('guanceOpenWayURL'),
        'token'  : c.get('token'),
        'rp'     : c.get('rp'),
        'timeout': c.get('timeout') or 3,
        'debug'  : c.get('debug')   or False,
    })

class GuanceHelper(object):
    def __init__(self, logger, config, rp=None, timeout=None, *args, **kwargs):
        self.logger = logger

        if rp:
            config['rp'] = rp

        if timeout:
            config['timeout'] = timeout

        self.config = config
        self.client = GuanceOpenAPI(**get_config(config))

        self._dataway = None

    def __del__(self):
        self.client = None
        self.dataway_client = None

    @property
    def dataway(self):
        if not self._dataway:
            self._dataway = DataWay(**get_config_dataway(self.config), token=self.client.workspace_token)

        return self._dataway

    def check(self):
        try:
            requests.get(self.config.get('guanceOpenAPIURL'))

            if 'guanceWebSocketURL' in self.config:
                requests.get(self.config.get('guanceWebSocketURL'))

            if 'guanceOpenWayURL' in self.config:
                requests.get(self.config.get('guanceOpenWayURL'))

        except Exception as e:
            for line in traceback.format_exc().splitlines():
                self.logger.error(line)

            e = Exception(str(e))
            raise e

        else:
            if not self.client.is_api_key_match:
                e = Exception('Guance API Key NOT match!')
                raise e

    def __getattr__(self, name):
        return self.client.__getattribute__(name)
