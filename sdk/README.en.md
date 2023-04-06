# DataFlux Func SDK

This SDK contains signature feature for programmatically calling DataFlux Func's API.

The SDK itself is a single file release, so users can put the code file into their projects and use it directly.

## 1. Create a AccessKey

1. Login to your DataFlux Func
2. Enable "Access Key Manage" in "Management / Experimental Features"
3. Click "New" in "Management / Access Key" to create an Access Key

## 2. Sennd requests

Example of sending a request is as follows:

### Python

```python
from dataflux_func_sdk import DataFluxFunc

# Create DataFlux Func Handler
dff = DataFluxFunc(ak_id='ak-xxxxx', ak_secret='xxxxxxxxxx', host='localhost:8088')

# Debug ON
dff.debug = True

# Send GET request
status_code, resp = dff.get('/api/v1/do/ping')
print(status_code, resp)

# Send POST request
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
print(status_code, resp)
```


### Node.js

```javascript
// Create DataFlux Func Handler
var opt = {
  akId    : 'ak-xxxxx',
  akSecret: 'xxxxxxxxxx',
  host    : 'localhost:8088',
};
var dff = new DataFluxFunc(opt);

// Debug ON
dff.debug = true;

// Send GET request
var getOpt = {
  path: '/api/v1/do/ping',
};
dff.get(getOpt, function(err, respData, respStatusCode) {
  console.log(respStatusCode, respData);
});

// Send POST request
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
  console.log(respStatusCode, respData);
});
```
