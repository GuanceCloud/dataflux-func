import time
import json
import random
from datetime import datetime

LARGE_DATA_LENGTH = 100000

def gen_large_data(with_datetime_field=False):
    data = []
    for i in range(LARGE_DATA_LENGTH):
        d = { 'id': i, 'value': random.uniform(0, 10000) }
        if with_datetime_field:
            d['date'] = datetime.now()
        data.append(d)
    return data

@DFF.API('测试函数', category='testCate1', tags=['testTag1', '测试标签2'])
def test_func(x, y):
    '''
    测试函数
    输入参数 x, y 均为数字类型，返回结果为两者之和
    '''
    return float(x) + float(y)

@DFF.API('测试函数-带缓存', cache_result=30)
def test_func_with_cache():
    time.sleep(3)
    return 'OK'

@DFF.API('大型数据', api_timeout=180, timeout=180)
def test_func_large_data(use_feature=False, with_datetime_field=False):
    data = gen_large_data(with_datetime_field)
    if use_feature:
        return DFF.RESP_LARGE_DATA(data)
    else:
        return data

@DFF.API('大型数据-带缓存', api_timeout=180, timeout=180, cache_result=30)
def test_func_large_data_with_cache(with_datetime_field=False):
    data = gen_large_data(with_datetime_field)
    return DFF.RESP_LARGE_DATA(data)

@DFF.API('认证函数')
def test_func_auth(req):
    return req['headers']['x-my-token'] == '<TOKEN>'
