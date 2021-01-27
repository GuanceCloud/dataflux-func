# -*- coding: utf-8 -*-

import pytest

from . import BaseTestSuit, AssertDesc, gen_rand_string

TEST_FUNC_NAME = 'test_func'
TEST_CODE = f"""
@DFF.API('测试函数', category='testFuncCategory', tags=['testFuncTagA', 'testFuncTagB'])
def {TEST_FUNC_NAME}(x, y):
    '''
    测试函数
    输入参数 x, y 均为数字类型，返回结果为两者之和
    '''
    return x + y
"""

@pytest.mark.order(after='TestSuitScriptSet')
class TestSuitScript(BaseTestSuit):
    def setup_class(self):
        # 随机ID
        self.test_script_set_id = f"test_{gen_rand_string(8)}"
        self.test_data_id       = f"{self.test_script_set_id}__test_{gen_rand_string(8)}"
        self.test_func_id       = f"{self.test_data_id}.{TEST_FUNC_NAME}"

        # 添加上层脚本集
        body = { 'data': { 'id': self.test_script_set_id } }
        self.API.post('/api/v1/script-sets/do/add', body=body)

    def teardown_class(self):
        # 删除上层脚本集
        params = { 'id': self.test_script_set_id }
        self.API.get('/api/v1/script-sets/:id/do/delete', params=params)

    def test_list(self):
        # 测试接口
        code, res = self.API.get('/api/v1/scripts/do/list')
        assert code == 200, AssertDesc.status_code(res)

    def test_add(self):
        # 数据
        data = {
            'id'         : self.test_data_id,
            'title'      : '测试脚本标题',
            'description': '测试脚本描述',
            'codeDraft'  : TEST_CODE,
        }

        # 测试接口
        body = { 'data': data }
        code, res = self.API.post('/api/v1/scripts/do/add', body=body)

        assert code == 200,                            AssertDesc.status_code(res)
        assert res['data']['id'] == self.test_data_id, AssertDesc.data_value_not_match()

        self.state('test_add', True)

        # 验证数据
        query = { 'id': self.test_data_id }
        code, res = self.API.get('/api/v1/scripts/do/list', query=query)

        assert code == 200,                                          AssertDesc.status_code(res)
        assert len(res['data']) == 1,                                AssertDesc.data_count_not_match()
        assert res['data'][0]['id']          == self.test_data_id,   AssertDesc.data_value_not_match()
        assert res['data'][0]['title']       == data['title'],       AssertDesc.data_value_not_match()
        assert res['data'][0]['description'] == data['description'], AssertDesc.data_value_not_match()

    def test_modify(self):
        if not self.state('test_add'):
            pytest.skip(f"No test data to run this case")

        # 数据
        data = {
            'title'      : '测试脚本标题（修改）',
            'description': '测试脚本描述（修改）',
        }

        # 测试接口
        params = { 'id': self.test_data_id }
        body   = { 'data': data }
        code, res = self.API.post('/api/v1/scripts/:id/do/modify', params=params, body=body)

        assert code == 200,                            AssertDesc.status_code(res)
        assert res['data']['id'] == self.test_data_id, AssertDesc.data_value_not_match()

        # 验证数据
        query = { 'id': self.test_data_id }
        code, res = self.API.get('/api/v1/scripts/do/list', query=query)

        assert code == 200,                                          AssertDesc.status_code(res)
        assert len(res['data']) == 1,                                AssertDesc.data_count_not_match()
        assert res['data'][0]['id']          == self.test_data_id,   AssertDesc.data_value_not_match()
        assert res['data'][0]['title']       == data['title'],       AssertDesc.data_value_not_match()
        assert res['data'][0]['description'] == data['description'], AssertDesc.data_value_not_match()

    def test_publish(self):
        if not self.state('test_add'):
            pytest.skip(f"No test data to run this case")

        # 数据
        data = {
            'note': '测试发布'
        }

        # 测试接口
        params = { 'id': self.test_data_id }
        body   = { 'force': True, 'data': data }
        code, res = self.API.post('/api/v1/scripts/:id/do/publish', params=params, body=body)

        assert code == 200, AssertDesc.status_code(res)

        # 验证数据
        query = { 'id': self.test_func_id }
        code, res = self.API.get('/api/v1/funcs/do/list', query=query)

        assert code == 200,                               AssertDesc.status_code(res)
        assert len(res['data']) == 1,                     AssertDesc.data_count_not_match()
        assert res['data'][0]['id'] == self.test_func_id, AssertDesc.data_value_not_match()

    def test_delete(self):
        if not self.state('test_add'):
            pytest.skip(f"No test data to run this case")

        # 测试接口
        params = {
            'id': self.test_data_id,
        }
        code, res = self.API.get('/api/v1/scripts/:id/do/delete', params=params)

        assert code == 200,                            AssertDesc.status_code(res)
        assert res['data']['id'] == self.test_data_id, AssertDesc.data_value_not_match()

        # 验证数据
        query = { 'id': self.test_data_id }
        code, res = self.API.get('/api/v1/scripts/do/list', query=query)

        assert code == 200,           AssertDesc.status_code(res)
        assert len(res['data']) == 0, AssertDesc.data_count_not_match()
