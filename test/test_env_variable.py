# -*- coding: utf-8 -*-

import pytest

from . import BaseTestSuit, AssertDesc, gen_test_id

class TestSuitEnvVariable(BaseTestSuit):
    API_PATH_ROOT = '/api/v1/env-variables'

    def setup_class(self):
        pass

    def teardown_class(self):
        self.do_teardown_class()

    def test_add(self):
        data = {
            'id'             : gen_test_id(),
            'title'          : '测试标题',
            'description'    : '测试描述',
            'valueTEXT'      : '测试内容',
            'autoTypeCasting': 'string',
        }
        self.do_test_add(data)

    def test_modify(self):
        data = {
            'title'      : '测试标题（修改）',
            'description': '测试描述（修改）',
            'valueTEXT'  : '测试内容（修改）',
        }
        self.do_test_modify(data)

    def test_list(self):
        self.do_test_list()

    @pytest.mark.order(-1)
    def test_delete(self):
        self.do_test_delete()
