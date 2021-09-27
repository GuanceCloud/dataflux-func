# -*- coding: utf-8 -*-

import os
import uuid
import time
import random
from urllib.parse import urlparse, urlencode, quote

import pytest
import requests
import simplejson as json
import nanoid

# 配置
TEST_USERNAME = 'admin'
TEST_PASSWORD = 'admin'
TEST_HOST     = os.environ.get('DATAFLUX_FUNC_HOST') or 'localhost:8088'

# 断言文案
class AssertDesc(object):
    @classmethod
    def bad_resp(cls, api_res=None):
        api_res_dumps = ''
        if api_res:
            api_res_str = json.dumps(api_res, indent=2, ensure_ascii=False)
            api_res_dumps = f": {api_res_str}"

        return '接口报错：' +  api_res_dumps

    @classmethod
    def bad_value(cls):
        return '接口返回的数据值不符合预期'

    @classmethod
    def bad_count(cls):
        return '接口返回的数据数量不符合预期'

# API客户端
class APIClient(object):
    def __init__(self, username=None, password=None, host=None):
        self.username = TEST_USERNAME
        self.password = TEST_PASSWORD
        self.host     = TEST_HOST

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
            'signIn': {
                'username': self.username,
                'password': self.password,
            },
        }
        status_code, resp = self.post('/api/v1/auth/do/sign-in', body=body)
        if status_code >= 400:
            raise Exception(f"Sign-in failed: username={self.username}, password={self.password}, detail={resp}")

        x_auth_token = resp['data']['xAuthToken']

        self.client.headers.update({
            'X-Dff-Auth-Token': x_auth_token,
        })

        self.x_auth_token = x_auth_token

    def get(self, url, params=None, query=None):
        url = self.get_full_url(url, params)

        r = self.client.get(url, params=query)

        status_code = r.status_code
        resp        = r.json()
        return status_code, resp

    def post(self, url, params=None, query=None, body=None):
        url = self.get_full_url(url, params)

        r = self.client.post(url, params=query, json=body)

        status_code = r.status_code
        resp        = r.json()
        return status_code, resp

# 通用函数
def gen_test_string(length=None, chars=None):
    if not length:
        length = 32
    if not chars:
        chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'

    rand_string = ''
    for i in range(length):
        rand_string += ''.join(random.sample(chars, 1))

    return rand_string

def gen_test_id():
    return 'APITEST_ID_' + gen_test_string(16)

def get_sample_script():
    script_set_id = 'script_set_' + gen_test_string(6)
    script_id     = f"{script_set_id}__script"
    script_code   = f"""
import time
import json
import random

def gen_rand_string():
    chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
    rand_string = ''
    for i in range(32):
        rand_string += ''.join(random.sample(chars, 1))

    return rand_string

@DFF.API('测试函数', category='testCate1', tags=['testTag1', '测试标签2'])
def test_func(x, y):
    '''
    测试函数
    输入参数 x, y 均为数字类型，返回结果为两者之和
    '''
    return x + y

@DFF.API('大型数据')
def test_func_large_data(use_feature=False):
    data = [dict(id=i, data=gen_rand_string()) for i in range(50000)]
    if use_feature:
        return DFF.RESP_LARGE_DATA(data)
    else:
        return data

@DFF.API('认证函数')
def test_func_auth(req):
    return req['headers']['x-my-token'] == '<TOKEN>'
"""
    return script_set_id, script_id, script_code

# 基础测试套件
class BaseTestSuit(object):
    API = APIClient()
    STATE_STORE = {}

    API_PATH_ROOT = None
    TEST_ID       = None

    PRE_FUNC          = False
    PRE_SCRIPT_SET_ID = None
    PRE_SCRIPT_ID     = None
    PRE_SCRIPT_CODE   = None

    @classmethod
    def _ensure_state_store(self):
        test_suit = self.__name__
        if test_suit not in self.STATE_STORE:
            self.STATE_STORE[test_suit] = {}

        return self.STATE_STORE[test_suit]

    @classmethod
    def state(self, key, *args):
        store = self._ensure_state_store()

        if len(args) <= 0:
            return store.get(key)
        else:
            store[key] = args[0]

    @classmethod
    def state_push(self, key, item):
        store = self._ensure_state_store()

        if key not in store:
            store[key] = [ item ]
        else:
            store[key].append(item)

    @classmethod
    def prepare_func(self):
        # 预创建函数数据
        self.PRE_FUNC = True

        SCRIPT_SET_ID, SCRIPT_ID, SCRIPT_CODE = get_sample_script()
        self.PRE_SCRIPT_SET_ID = SCRIPT_SET_ID
        self.PRE_SCRIPT_ID     = SCRIPT_ID
        self.PRE_SCRIPT_CODE   = SCRIPT_CODE

        # 创建脚本集
        body = { 'data': { 'id': self.PRE_SCRIPT_SET_ID } }
        status_code, resp = self.API.post('/api/v1/script-sets/do/add', body=body)
        assert status_code == 200, AssertDesc.bad_resp(resp)

        # 创建脚本
        body = { 'data': { 'id': self.PRE_SCRIPT_ID, 'codeDraft': self.PRE_SCRIPT_CODE } }
        status_code, resp = self.API.post('/api/v1/scripts/do/add', body=body)
        assert status_code == 200, AssertDesc.bad_resp(resp)

        # 发布脚本
        params = { 'id': self.PRE_SCRIPT_ID }
        body = { 'force': True, 'wait': True }
        status_code, resp = self.API.post('/api/v1/scripts/:id/do/publish', params=params, body=body)
        assert status_code == 200, AssertDesc.bad_resp(resp)

    @classmethod
    def do_teardown_class(self):
        # 清理数据
        test_ids = self.state('testAddedIds')
        if test_ids:
            for test_id in test_ids:
                params = { 'id': test_id }
                self.API.get(self.API_PATH_ROOT + '/:id/do/delete', params=params)

        # 清理预创建函数数据
        if self.PRE_FUNC:
            params = { 'id': self.PRE_SCRIPT_SET_ID }
            self.API.get('/api/v1/script-sets/:id/do/delete', params=params)

        self.PRE_FUNC          = False
        self.PRE_SCRIPT_SET_ID = None
        self.PRE_SCRIPT_ID     = None
        self.PRE_FUNC_ID       = None
        self.PRE_SCRIPT_CODE   = None

    def do_test_add(self, data, field_check_ignore=None):
        # 测试接口
        body = { 'data': data }
        status_code, resp = self.API.post(self.API_PATH_ROOT + '/do/add', body=body)

        assert status_code == 200, AssertDesc.bad_resp(resp)
        data_id = data.get('id')
        if data_id:
            assert resp['data']['id'] == data_id, AssertDesc.bad_value()

        # 当前ID
        test_id = resp['data']['id']
        self.state_push('testAddedIds', test_id)

        # 验证数据
        query = { 'id': test_id }
        status_code, resp = self.API.get(self.API_PATH_ROOT + '/do/list', query=query)

        assert status_code == 200,               AssertDesc.bad_resp(resp)
        assert len(resp['data']) == 1,           AssertDesc.bad_count()
        assert resp['data'][0]['id'] == test_id, AssertDesc.bad_value()

        for f_name, f_value in data.items():
            if isinstance(field_check_ignore, (list, tuple)) and f_name in field_check_ignore:
                continue

            if isinstance(f_value, (int, float, str, bool)):
                assert resp['data'][0][f_name] == f_value, AssertDesc.bad_value()

    def do_test_modify(self, data, target_id=None, field_check_ignore=None):
        test_ids = self.state('testAddedIds')
        if not test_ids or (target_id and target_id not in test_ids):
            pytest.skip(f"No test data to run this case")

        test_id = target_id or test_ids[0]

        # 测试接口
        params = { 'id': test_id }
        body   = { 'data': data }
        status_code, resp = self.API.post(self.API_PATH_ROOT + '/:id/do/modify', params=params, body=body)

        assert status_code == 200,            AssertDesc.bad_resp(resp)
        assert resp['data']['id'] == test_id, AssertDesc.bad_value()

        # 验证数据
        query = { 'id': test_id }
        status_code, resp = self.API.get(self.API_PATH_ROOT + '/do/list', query=query)

        assert status_code == 200,               AssertDesc.bad_resp(resp)
        assert len(resp['data']) == 1,           AssertDesc.bad_count()
        assert resp['data'][0]['id'] == test_id, AssertDesc.bad_value()

        for f_name, f_value in data.items():
            if isinstance(field_check_ignore, (list, tuple)) and f_name in field_check_ignore:
                continue

            if isinstance(f_value, (int, float, str, bool)):
                assert resp['data'][0][f_name] == f_value, AssertDesc.bad_value()

    def do_test_list(self):
        # 测试接口
        status_code, resp = self.API.get(self.API_PATH_ROOT + '/do/list')
        assert status_code == 200, AssertDesc.bad_resp(resp)

    def do_test_delete(self, target_id=None):
        test_ids = self.state('testAddedIds')
        if not test_ids or (target_id and target_id not in test_ids):
            pytest.skip(f"No test data to run this case")

        test_id = target_id or test_ids[0]

        # 测试接口
        params = { 'id': test_id }
        status_code, resp = self.API.get(self.API_PATH_ROOT + '/:id/do/delete', params=params)

        assert status_code == 200,            AssertDesc.bad_resp(resp)
        assert resp['data']['id'] == test_id, AssertDesc.bad_value()

        # 验证数据
        query = { 'id': test_id }
        status_code, resp = self.API.get(self.API_PATH_ROOT + '/do/list', query=query)

        assert status_code == 200,     AssertDesc.bad_resp(resp)
        assert len(resp['data']) == 0, AssertDesc.bad_count()
