# -*- coding: utf-8 -*-

import pytest

from . import BaseTestSuit, AssertDesc, gen_test_id

class TestSuitBatch(BaseTestSuit):
    API_PATH_ROOT = '/api/v1/batches'

    def setup_class(self):
        self.prepare_func()

    def teardown_class(self):
        self.do_teardown_class()

    def test_add__with_id(self):
        data = {
            'id'    : gen_test_id(),
            'funcId': self.get_pre_func_id('test_func'),
            'funcCallKwargsJSON': {
                'x': 'INPUT_BY_CALLER',
                'y': 'INPUT_BY_CALLER',
            },
            'tagsJSON': ['testTag1', '标签2'],
            'note'    : '测试备注',
        }
        self.do_test_add(data)

    def test_add__without_id(self):
        data = {
            'funcId': self.get_pre_func_id('test_func'),
            'funcCallKwargsJSON': {
                'x': 'INPUT_BY_CALLER',
                'y': 'INPUT_BY_CALLER',
            },
            'tagsJSON': ['testTag1', '标签2'],
            'note'    : '测试备注',
        }
        self.do_test_add(data)

    def test_modify(self):
        data = {
            'funcCallKwargsJSON': {
                'x': 1,
                'y': 'INPUT_BY_CALLER',
            },
            'tagsJSON': ['testTag3', '标签4'],
            'note'    : '测试备注（修改）',
        }
        self.do_test_modify(data)

    def test_list(self):
        self.do_test_list()

    @pytest.mark.order(-1)
    def test_delete(self):
        self.do_test_delete()

    #----------------------#
    # 以下为非通用测试用例 #
    #----------------------#

    def test_call(self):
        # TODO 测试用例：调用并验证结果
        pass
