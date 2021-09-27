# -*- coding: utf-8 -*-

import pytest

from . import BaseTestSuit, AssertDesc, gen_test_string

class TestSuitUser(BaseTestSuit):
    API_PATH_ROOT = '/api/v1/users'

    def setup_class(self):
        pass

    def teardown_class(self):
        self.do_teardown_class()

    def test_add(self):
        data = {
            'username': 'user_' + gen_test_string(6),
            'password': 'test_password',
            'name'    : '测试名称',
            'roles'   : ['user'],
            'mobile'  : '18600000000',
        }
        self.do_test_add(data, field_check_ignore=['password'])

    def test_modify(self):
        data = {
            'username': 'user_' + gen_test_string(6) + '_changed',
            'password': 'test_password_changed',
            'name'    : '测试名称（修改）',
            'mobile'  : '18600000000（修改）',
        }
        self.do_test_modify(data, field_check_ignore=['password'])

    def test_list(self):
        self.do_test_list()

    @pytest.mark.order(-1)
    def test_delete(self):
        self.do_test_delete()
