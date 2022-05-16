# -*- coding: utf-8 -*-

# Builtin Modules
import time
import traceback
import random

# 3rd-party Modules
import requests
import six

# Project Modules
from . import parse_response
from worker.utils import toolkit

LIMIT_MESSAGE_DUMP = 200

def get_config(c):
    fixed_nsq_nodes = c.get('fixedNSQNodes') or c.get('servers') or None
    if fixed_nsq_nodes and isinstance(fixed_nsq_nodes, (six.string_types, six.text_type)):
        fixed_nsq_nodes = fixed_nsq_nodes.split(',')

    fixed_nsq_nodes = fixed_nsq_nodes or None
    fixed_nsq_nodes = toolkit.as_array(fixed_nsq_nodes)

    config = {
        'host'         : c.get('host')     or '127.0.0.1',
        'port'         : c.get('port')     or 4161,
        'protocol'     : c.get('protocol') or 'http',
        'timeout'      : c.get('timeout')  or 3,
        'fixedNSQNodes': fixed_nsq_nodes,
    }
    return config

class NSQLookupHelper(object):
    PRODUCERS_UPDATE_INTERVAL = 60

    def __init__(self, logger, config=None, *args, **kwargs):
        self.logger = logger

        config = get_config(config)
        session = requests.Session()

        self.config = config
        self.client = session

        self.nsq_nodes = []
        if self.config.get('fixedNSQNodes'):
            self.nsq_nodes = self.config['fixedNSQNodes']

        self.producers_update_timestamp = 0

        self.update_producers()

    def __del__(self):
        if not self.client:
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
            if self.config.get('fixedNSQNodes'):
                for nsq_node in self.nsq_nodes:
                    url = '{}://{}/ping'.format(self.config['protocol'], nsq_node)
                    r = requests.get(url, timeout=self.config['timeout'])
                    r.raise_for_status()

            else:
                self.query('get', '/nodes')

        except Exception as e:
            for line in traceback.format_exc().splitlines():
                self.logger.error(line)

            e = Exception(str(e))
            raise e

    def update_producers(self):
        if self.config.get('fixedNSQNodes'):
            return

        try:
            api_res = self.query('get', '/nodes')

        except Exception as e:
            for line in traceback.format_exc().splitlines():
                self.logger.error(line)

        else:
            producers = api_res.get('producers')
            if not producers:
                return

            next_nsq_nodes = []
            for p in producers:
                broadcast_address = p.get('broadcast_address')
                http_port         = p.get('http_port')

                if broadcast_address and http_port:
                    next_nsq_nodes.append('{}:{}'.format(broadcast_address, http_port))

            if next_nsq_nodes:
                self.logger.debug('[NSQLOOKUP] Update nodes')
                self.nsq_nodes = next_nsq_nodes

        finally:
            self.producers_update_timestamp = time.time()

    def query(self, method, path=None, query=None, body=None, timeout=None):
        if path is None:
            method, path = method.split(' ', 1)

        url = '{protocol}://{host}:{port}'.format(**self.config) + path

        timeout = timeout or self.config['timeout']

        r = self.client.request(method=method, url=url, params=query, data=body, timeout=timeout)
        parsed_resp = parse_response(r)

        if r.status_code >= 400:
            e = Exception(r.status_code, parsed_resp)
            raise e

        return r.status_code, parsed_resp

    def publish(self, topic, message, timeout=None):
        if time.time() - self.producers_update_timestamp > self.PRODUCERS_UPDATE_INTERVAL:
            self.update_producers()

        nsq_node = random.choice(self.nsq_nodes)
        url = '{}://{}/pub'.format(self.config['protocol'], nsq_node)

        query = {
            'topic': topic,
        }

        if isinstance(message, (dict, list, tuple)):
            message = toolkit.json_dumps(message)

        message = six.ensure_binary(message)
        timeout = timeout or self.config['timeout']

        self.logger.debug('[NSQLOOKUP] Pub -> `{}`'.format(topic))

        r = requests.post(url, params=query, data=message, timeout=timeout)
        r.raise_for_status()

