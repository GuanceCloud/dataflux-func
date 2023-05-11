# -*- coding: utf-8 -*-

# Built-in Modules
import time
import uuid
import hashlib
import hmac
import traceback

# 3rd-party Modules
import requests

# Project Modules
from . import parse_response
from worker.utils import toolkit

def get_config(c):
    return toolkit.no_none_or_white_space({
        'host'     : c.get('host')     or '172.17.0.1',
        'port'     : c.get('port')     or 8099,
        'protocol' : c.get('protocol') or 'http',
        'timeout'  : c.get('timeout')  or 3,
        'secretKey': c.get('secretKey'),
    })

class SidecarHelper(object):
    def __init__(self, logger, config, timeout=None, *args, **kwargs):
        self.logger = logger

        if timeout:
            config['timeout'] = timeout

        self.config = get_config(config)
        self.client = requests.Session()

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
        url = '{0}://{1}:{2}/'.format(
            self.config.get('protocol', 'http'),
            self.config.get('host'),
            self.config.get('port'))

        try:
            self.shell('hostname')

        except Exception as e:
            for line in traceback.format_exc().splitlines():
                self.logger.error(line)

            e = Exception(str(e))
            raise e

    def call(self, method, path=None, query=None, body=None, timeout=None):
        if path is None:
            method, path = method.split(' ', 1)

        url = '{protocol}://{host}:{port}'.format(**self.config) + path
        timeout = timeout or self.config['timeout']

        if not isinstance(body, str):
            body = toolkit.json_dumps(body)

        method = method.upper()

        # 签名
        nonce = uuid.uuid4().hex
        timestamp = str(int(time.time()))

        headers = {
            'Content-Type'    : 'application/json',
            'X-Auth-Nonce'    : nonce,
            'X-Auth-Timestamp': timestamp,
        }
        secret_key  = bytes(self.config.get('secretKey') or '', 'utf-8')
        str_to_sign = bytes('\n'.join([method, path, nonce, timestamp, body]), 'utf-8')
        sign = hmac.new(secret_key, str_to_sign, hashlib.sha1).hexdigest().upper()
        print('str_to_sign', str_to_sign)
        print('secret_key', secret_key)
        print('sign', sign)
        headers['X-Auth-Signature'] = sign

        r = self.client.request(method=method, url=url, params=query, data=body, headers=headers, timeout=timeout)
        parsed_resp = parse_response(r)

        if r.status_code >= 400:
            e = Exception(r.status_code, r.text)
            raise e

        return r.status_code, parsed_resp

    def shell(self, cmd, wait=True, workdir=None, envs=None, callback_url=None, timeout=None):
        if envs and isinstance(envs, dict):
            envs = [f"{k}={v}" for k, v in envs.item()]

        body = {
            'command': cmd,
            'wait'   : wait,
        }

        if workdir:
            body['workdir'] = workdir

        if envs:
            body['envs'] = envs

        if callback_url:
            if not callback_url.startswith('http://') and not callback_url.startswith('https://'):
                raise Exception('`callback_url` should starts with "http://" or "https://"')

            body['callbackURL'] = callback_url

        return self.call('POST', '/shell', body=body, timeout=timeout)
