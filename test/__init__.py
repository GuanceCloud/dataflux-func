# -*- coding: utf-8 -*-

import uuid
import random
from urllib.parse import urlparse, urlencode, quote

import pytest
import requests
import simplejson as json
import shortuuid

class AssertDesc(object):
    @classmethod
    def status_code(cls, api_res=None):
        api_res_dumps = ''
        if api_res:
            api_res_str = json.dumps(api_res, indent=2, ensure_ascii=False)
            api_res_dumps = f": {api_res_str}"

        return '接口返回的Status Code 不符合预期' +  api_res_dumps

    @classmethod
    def data_value_not_match(cls):
        return '接口返回的数据值不符合预期'

    @classmethod
    def data_count_not_match(cls):
        return '接口返回的数据数量不符合预期'

class APIClient(object):
    def __init__(self, username=None, password=None, host=None):
        self.username = username or 'admin'
        self.password = password or 'admin'
        self.host     = host     or 'localhost:8088'

        self.client = requests.Session()
        self.client.headers.update({
            'X-Dff-Client-Id': 'c_ui_test',
            'X-Dff-Origin'   : 'DFF-UI',
        })

        self.x_auth_token = None

        self.sign_in()

    def get_full_url(self, url, params=None):
        if params:
            for k, v in params.items():
                url = url.replace(f":{k}", v)

        url = f"http://{self.host}{url}"
        return url

    def sign_in(self):
        body = {
            'captchaToken': '<TEST>',
            'captcha'     : '0000',
            'signIn'      : { 'username': self.username, 'password': self.password },
        }
        code, res = self.post('/api/v1/auth/do/sign-in', body=body)
        if code >= 400:
            raise Exception(f"Sign-in failed: username={self.username}, password={self.password}, detail={res}")

        x_auth_token = res['data']['xAuthToken']

        self.client.headers.update({
            'X-Dff-Auth-Token': x_auth_token,
        })

        self.x_auth_token = x_auth_token

    def get(self, url, params=None, query=None):
        url = self.get_full_url(url, params)

        r = self.client.get(url, params=query)

        code = r.status_code
        res  = r.json()
        return code, res

    def post(self, url, params=None, query=None, body=None):
        url = self.get_full_url(url, params)

        r = self.client.post(url, params=query, json=body)

        code = r.status_code
        res  = r.json()
        return code, res

class BaseTestSuit(object):
    API = APIClient()
    SHARED_DATA = {}

    def state(self, key, *args):
        if len(args) <= 0:
            return self.__class__.SHARED_DATA.get(key)
        else:
            self.__class__.SHARED_DATA[key] = args[0]

def gen_rand_string(length=None, chars=None):
    if not length:
        length = 32

    samples = chars or '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
    rand_string = ''
    for i in range(length):
        rand_string += ''.join(random.sample(samples, 1))

    return rand_string

def gen_data_id(prefix=None):
    prefix = prefix or 'data'
    return prefix + '-' + str(shortuuid.encode(uuid.uuid4()))
