# DataFlux Func SDK

DataFlux Func provides full API support and can be called programmatically using the SDK.

The SDK includes signature functionality and is released as a single file. It can be used directly by users in their projects.

## 1. Create a AccessKey

1. Login to your DataFlux Func
2. Enable "Access Key Manage" in "Management / Experimental Features"
3. Click "New" in "Management / Access Key" to create an Access Key

## 2. Sennd requests

Example of sending a request is as follows:

### Python

```python
from dataflux_func_sdk import DataFluxFunc

# Create DataFlux Func Client
dff = DataFluxFunc(ak_id='ak-xxxxx', ak_secret='xxxxxxxxxx', host='localhost:8088')

# Debug ON
dff.debug = True

# Send GET request
try:
    status_code, resp = dff.get('/api/v1/do/ping')
except Exception as e:
    print(colored(e, 'red'))

# Send POST request
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
// Create DataFlux Func Client
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
  if (err) console.error(colored(err, 'red'))

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
    if (err) console.error(colored(err, 'red'))
  });
});
```

### Golang

```go
package main

import (
    "os"

    // DataFlux Func SDK
    "./dataflux_func_sdk"
)

var (
    colorMap = map[interface{}]string{
        "grey":    "\033[0;30m",
        "red":     "\033[0;31m",
        "green":   "\033[0;32m",
        "yellow":  "\033[0;33m",
        "blue":    "\033[0;34m",
        "magenta": "\033[0;35m",
        "cyan":    "\033[0;36m",
    }
)

func main() {
    host := "localhost:8088"
    if len(os.Args) >= 2 {
        host = os.Args[1]
    }

    // Create DataFlux Func Client
    dff := dataflux_func_sdk.NewDataFluxFunc("ak-xxxxx", "xxxxxxxxxx", host, 30, false)

    // Debug ON
    dff.Debug = true

    // Send GET Request
    _, _, err := dff.Get("/api/v1/do/ping", nil, nil, "")
    if err != nil {
        panic(err)
    }

    // Send POST Request
    body := map[string]interface{}{
        "echo": map[string]interface{}{
            "int"    : 1,
            "str"    : "Hello World",
            "unicode": "你好，世界！",
            "none"   : nil,
            "boolean": true,
        },
    }
    _, _, err = dff.Post("/api/v1/do/echo", body, nil, nil, "")
    if err != nil {
        panic(err)
    }
}
```