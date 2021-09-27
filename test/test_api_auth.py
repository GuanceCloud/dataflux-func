# -*- coding: utf-8 -*-

import pytest

from . import BaseTestSuit, AssertDesc

class TestSuitAPIAuth(BaseTestSuit):
    API_PATH_ROOT = '/api/v1/api-auth'

    def setup_class(self):
        pass

    def teardown_class(self):
        self.do_teardown_class()

    def test_add(self):
        data = {
            'name': '测试名称',
            'type': 'fixedField',
            'configJSON': {
                'fields': [
                    {
                        'location': 'header',
                        'name'    : 'x-my-token',
                        'value'   : '<TOKEN>'
                    }
                ]
            },
            'note': '测试备注',
        }
        self.do_test_add(data)

    def test_modify(self):
        data = {
            'name': '测试名称（修改）',
            'note': '测试备注（修改）',
        }
        self.do_test_modify(data)

    def test_list(self):
        self.do_test_list()

    @pytest.mark.order(-1)
    def test_delete(self):
        self.do_test_delete()
