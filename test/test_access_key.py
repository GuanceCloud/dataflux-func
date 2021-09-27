# -*- coding: utf-8 -*-

import pytest

from . import BaseTestSuit, AssertDesc, gen_test_string

class TestSuitAccessKey(BaseTestSuit):
    API_PATH_ROOT = '/api/v1/access-keys'

    def setup_class(self):
        pass

    def teardown_class(self):
        self.do_teardown_class()

    def test_add(self):
        data = {
            'name': '测试名称',
        }
        self.do_test_add(data)

    def test_list(self):
        self.do_test_list()

    @pytest.mark.order(-1)
    def test_delete(self):
        self.do_test_delete()
