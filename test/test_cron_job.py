# -*- coding: utf-8 -*-

import pytest

from . import BaseTestSuit, AssertDesc

class TestSuitCronJob(BaseTestSuit):
    API_PATH_ROOT = '/api/v1/cron-jobs'

    def setup_class(self):
        self.prepare_func()

    def teardown_class(self):
        self.do_teardown_class()

    def test_add(self):
        data = {
            'funcId': self.get_pre_func_id('test_func'),
            'funcCallKwargsJSON': {
                'x': 1,
                'y': 2,
            },
            'tagsJSON': ['testTag1', '标签2'],
            'note'    : '测试备注',
        }
        self.do_test_add(data)

    def test_modify(self):
        data = {
            'funcCallKwargsJSON': {
                'x': 3,
                'y': 4,
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

    def test_run_manually(self):
        # TODO 测试用例：调用并验证结果
        pass
