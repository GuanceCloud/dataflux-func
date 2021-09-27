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
    return float(x) + float(y)

@DFF.API('测试函数-带缓存', cache_result=30)
def test_func_with_cache():
    time.sleep(3)
    return 'OK'

@DFF.API('大型数据', api_timeout=30, timeout=30)
def test_func_large_data(use_feature=False):
    data = [dict(id=i, data=gen_rand_string()) for i in range(50000)]
    if use_feature:
        return DFF.RESP_LARGE_DATA(data)
    else:
        return data

@DFF.API('大型数据-带缓存', api_timeout=30, timeout=30, cache_result=30)
def test_func_large_data_with_cache():
    data = [dict(id=i, data=gen_rand_string()) for i in range(50000)]
    return DFF.RESP_LARGE_DATA(data)

@DFF.API('认证函数')
def test_func_auth(req):
    return req['headers']['x-my-token'] == '<TOKEN>'
