# -*- coding: utf-8 -*-

# Builtin Modules
import re
import json
import datetime
import traceback

# 3rd-party Modules
import requests

# Project Modules
from . import parse_response
from worker.utils import toolkit

def get_config(c):
    config = {
        'host'    : c.get('host') or '127.0.0.1',
        'port'    : c.get('port') or 9200,
        'user'    : c.get('user'),
        'password': c.get('password'),
        'protocol': c.get('protocol') or 'http',
    }
    return config

class ElasticSearchHelper(object):
    def __init__(self, logger, config=None, *args, **kwargs):
        self.logger = logger

        config = get_config(config)
        session = requests.Session()

        if config['user'] and config['password']:
            session.auth   = requests.auth.HTTPBasicAuth(config['user'], config['password'])
            session.verify = False

        self.config = config
        self.client = session

    def __del__(self):
        if self.client:
            self.client.close()

    def check(self):
        try:
            self.query('get', '/_cat/indices')

        except Exception as e:
            for line in traceback.format_exc().splitlines():
                self.logger.error(line)

            e = Exception(str(e))
            raise e

    def query(self, method, path=None, query=None, body=None):
        if path is None:
            method, path = method.split(' ', 1)

        if not path.startswith('/'):
            path = '/' + path

        url = '{protocol}://{host}:{port}'.format(**self.config) + path

        params = {
            'format': 'json'
        }
        if query:
            params.update(query)

        r = self.client.request(method=method, url=url, params=params, json=body)
        r.raise_for_status()

        parsed_resp = parse_response(r)
        return parsed_resp
