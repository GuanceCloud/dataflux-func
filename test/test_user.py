# -*- coding: utf-8 -*-

import pytest

from . import BaseTestSuit, AssertDesc, gen_test_string

TEST_USERNAME = 'user_' + gen_test_string(6)
TEST_PASSWORD = 'test_password'

class TestSuitUser(BaseTestSuit):
    API_PATH_ROOT = '/api/v1/users'

    def setup_class(self):
        pass

    def teardown_class(self):
        self.do_teardown_class()

    def _test_sign_in(self, username, password):
        # 测试登录
        body = {
            'captchaToken': '<TEST>',
            'captcha'     : '0000',
            'signIn': {
                'username': username,
                'password': password,
            },
        }
        status_code, resp = self.API.post('/api/v1/auth/do/sign-in', body=body)

        assert status_code == 200, AssertDesc.bad_resp(resp)

    def test_add(self):
        data = {
            'username': TEST_USERNAME,
            'password': TEST_PASSWORD,
            'name'    : '测试名称',
            'roles'   : ['user'],
            'mobile'  : '18600000000',
        }
        self.do_test_add(data, field_check_ignore=['password'])

        # 测试登录
        self._test_sign_in(data['username'], data['password'])

    def test_modify(self):
        data = {
            'username': TEST_USERNAME + '_changed',
            'password': TEST_PASSWORD + '_changed',
            'name'    : '测试名称（修改）',
            'mobile'  : '18600000000（修改）',
        }
        self.do_test_modify(data, field_check_ignore=['password'])

        # 测试登录
        self._test_sign_in(data['username'], data['password'])

    def test_list(self):
        self.do_test_list()

    @pytest.mark.order(-1)
    def test_delete(self):
        self.do_test_delete()
