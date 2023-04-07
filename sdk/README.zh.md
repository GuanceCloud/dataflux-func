# DataFlux Func SDK

DataFlux Func 提供了完整 API 支持，可以使用 SDK 通过编程方式调用。

SDK 包含了签名功能，且以单文件方式发布。用户可以直接放入项目中使用。

## 1. 创建 Access Key

1. 登录你的 DataFlux Func
2. 在「管理 / 实验性功能」中启用 Access Key 管理
3. 在「管理 / Access Key」点击「新建」创建 Access Key

## 2. 发送请求

发送请求示例如下：

### Python

```python
from dataflux_func_sdk import DataFluxFunc

# 创建 DataFlux Func 操作对象
dff = DataFluxFunc(ak_id='ak-xxxxx', ak_secret='xxxxxxxxxx', host='localhost:8088')

# 开启 Debug
dff.debug = True

# 发送 GET 请求
try:
    status_code, resp = dff.get('/api/v1/do/ping')
except Exception as e:
    print(colored(e, 'red'))

# 发送 POST 请求
try:
    body = {
        'echo': {
            'int'    : 1,
            'str'    : 'Hello World',
            'unicode': u'你好，世界！',
            'none'   : None,
            'boolean': True,
        }
    }
    status_code, resp = dff.post('/api/v1/do/echo', body=body)
except Exception as e:
    print(colored(e, 'red'))
```

### Node.js

```javascript
// 创建 DataFlux Func 操作对象
var opt = {
  akId    : 'ak-xxxxx',
  akSecret: 'xxxxxxxxxx',
  host    : 'localhost:8088',
};
var dff = new DataFluxFunc(opt);

// 开启 Debug
dff.debug = true;

// 发送 GET 请求
var getOpt = {
  path: '/api/v1/do/ping',
};
dff.get(getOpt, function(err, respData, respStatusCode) {
  if (err) console.error(colored(err, 'red'))

  // 发送 POST 请求
  var postOpt = {
    path: '/api/v1/do/echo',
    body: {
      'echo': {
        'int'    : 1,
        'str'    : 'Hello World',
        'unicode': '你好，世界！',
        'none'   : null,
        'boolean': true,
      }
    }
  };
  dff.post(postOpt, function(err, respData, respStatusCode) {
    if (err) console.error(colored(err, 'red'))
  });
});
```
