'use strict';

var fs          = require('fs');
var crypto      = require('crypto');
var http        = require('http');
var https       = require('https');
var querystring = require('querystring');

var UPLOAD_DISABLED = false;
try {
 var FormData = require('form-data');
} catch(err) {
  UPLOAD_DISABLED = true;
  console.log('Cannot import `FormData` module, the WATClient.upload() method is disabled.')
}

var COLOR_MAP = {
  'grey'   : '\x1b[0;30m',
  'red'    : '\x1b[0;31m',
  'green'  : '\x1b[0;32m',
  'yellow' : '\x1b[0;33m',
  'blue'   : '\x1b[0;34m',
  'magenta': '\x1b[0;35m',
  'cyan'   : '\x1b[0;36m',
}

function strf() {
  var args = Array.prototype.slice.call(arguments);
  if (0 === args.length) {
    return '';
  }

  var pattern = args.shift();
  try {
    pattern = pattern.toString();
  } catch (ex) {
    pattern = '';
  }

  return pattern.replace(/\{(\d+)\}/g, function replaceFunc(m, i) {
    return args[i] + '';
  });
};

function colored(s, color) {
  if (!color) {
    color = 'yellow';
  }

  color = COLOR_MAP[color];

  return color + s + '\x1b[0m';
};

var WATClient = function(options) {
  this.akId     = options.akId;
  this.akSecret = options.akSecret;

  this.host = options.host;
  this.port = options.port;

  if (this.host && this.host.indexOf(':') > -1) {
    var host_port = this.host.split(':');
    this.host = host_port[0];
    this.port = parseInt(host_port[1]);
  }

  this.timeout  = options.timeout  || 3;
  this.useHTTPS = options.useHTTPS || false;

  if (!this.port) {
    if (this.useHTTPS) {
      this.port = 443;
    } else {
      this.port = 80;
    }
  }

  this.akSignVersion = options.akSignVersion || 'v1';
};

WATClient.prototype.getBodyMD5 = function(body) {
  body = body || '';

  var c = crypto.createHash('md5');
  c.update(body);

  var hash = c.digest('hex');
  return hash;
};

WATClient.prototype.getSign = function(method, path, timestamp, nonce, body) {
  if (!timestamp) {
    timestamp = parseInt(Date.now() / 1000).toString();
  }

  if (!nonce) {
    nonce = Math.random().toString();
  }

  var stringToSign = null;
  switch (this.akSignVersion) {
    case 'v2':
      stringToSign = [
        this.akSignVersion,
        timestamp,
        nonce,
        method.toUpperCase(),
        path,
        this.getBodyMD5(body),
      ].join('&');
      break;

    case 'v1':
    default:
      stringToSign = [
        timestamp,
        nonce,
        method.toUpperCase(),
        path
      ].join('&');
      break;
  }

  if (this.debug) {
    console.log(strf('{0} {1} {2}',
      colored('[String to Sign]'),
      colored(this.akSignVersion, 'cyan'),
      stringToSign));
  }

  var c = crypto.createHmac('sha1', this.akSecret);
  c.update(stringToSign);
  var sign = c.digest('hex');

  return sign;
};

WATClient.prototype.verifySign = function(sign, method, path, timestamp, nonce, body) {
  var expectedSign = this.getSign(method, path, timestamp, nonce, body);

  return (sign === expectedSign);
};

WATClient.prototype.getAuthHeader = function(method, path, body) {
  var timestamp = parseInt(Date.now() / 1000).toString();
  var nonce     = Math.random().toString();

  var sign = this.getSign(method, path, timestamp, nonce, body);

  var authHeader = {
    'X-Wat-Ak-Sign-Version': this.akSignVersion,
    'X-Wat-Ak-Id'          : this.akId,
    'X-Wat-Ak-Timestamp'   : timestamp,
    'X-Wat-Ak-Nonce'       : nonce,
    'X-Wat-Ak-Sign'        : sign,
  }
  return authHeader;
};

WATClient.prototype.verifyAuthHeader = function(headers, method, path, body) {
  var timestamp = headers['x-wat-ak-timestamp'] || '';
  var nonce     = headers['x-wat-ak-nonce']     || '';
  var sign      = headers['x-wat-ak-sign']      || '';

  return this.verifySign(sign, method, path, timestamp, nonce, body);
};

WATClient.prototype.run = function(options, callback) {
  var method  = options.method || 'GET';
  var path    = options.path;
  var query   = options.query;
  var body    = options.body;
  var headers = options.headers;
  var traceId = options.traceId;

  // Prepare method/query/body
  method = method.toUpperCase();

  if (query) {
    path = path + '?' + querystring.stringify(query);
  }

  if (body) {
    if ('object' === typeof body) {
      body = JSON.stringify(body);
    } else {
      body = '' + (body || '');
    }
  }

  if (this.debug) {
    console.log('='.repeat(50));
    console.log(strf('{0} {1} {2}', colored('[Request]'), colored(method, 'cyan'), colored(path, 'cyan')));
    if (body) {
      console.log(strf('{0} {1}', colored('[Payload]'), body));
    }
  }

  // Prepare headers with auth info
  headers = headers || {};
  headers['Content-Type'] = 'application/json';
  if (traceId) {
    headers['X-Trace-Id'] = traceId;
  }

  if (this.akId && this.akSecret) {
    var authHeader = this.getAuthHeader(method, path, body);
    Object.assign(headers, authHeader);
  }

  // Do HTTP/HTTPS
  var requestOptions = {
    host   : this.host,
    port   : this.port,
    path   : path,
    method : method,
    headers: headers,
    timeout: this.timeout,
  };

  var httpLib = this.useHTTPS ? https : http;

  var self = this;

  var respStatusCode = 0;
  var respRawData    = '';
  var respData       = '';
  var req = httpLib.request(requestOptions, function(res) {
    respStatusCode = res.statusCode;

    res.on('data', function(chunk) {
      respRawData += chunk;
    });

    res.on('end', function() {
      var respContentType = res.headers['content-type'].split(';')[0].trim();
      if (respContentType === 'application/json') {
        respData = JSON.parse(respRawData);
      }

      if (self.debug) {
        var _color = respStatusCode >= 400 ? 'red' : 'green';

        console.log(colored(strf('{0} {1}', '[Response]', respStatusCode), _color));
        console.log(colored(strf('{0} {1}', '[Payload]', respRawData.toString()), _color));
      }

      if ('function' === typeof callback) {
        return callback(null, respData, respStatusCode);
      }
    });
  });

  req.on('error', function(err) {
    if ('function' === typeof callback) {
      return callback(err);
    }
  });

  if (body) {
    req.write(body);
  }

  req.end();
};

WATClient.prototype.upload = function(options, callback) {
  if (UPLOAD_DISABLED) {
    throw Error('`WATClient.upload()` method need `FormData` module.')
  }

  var path        = options.path;
  var fileBuffer  = options.fileBuffer;
  var filename    = options.filename;
  var query       = options.query;
  var fields      = options.fields;
  var headers     = options.headers;
  var traceId     = options.traceId;

  // Prepare method/query/fields/file
  var method = 'POST';

  if (!filename) {
    filename = 'uploadfile';
  }
  filename = querystring.escape(filename);

  if (query) {
    path = path + '?' + querystring.stringify(query);
  }

  if (fields && 'object' !== typeof fields) {
    throw Error('`fields` should be a plain JSON')
  }

  // FormData
  var formData = new FormData();

  if (fields) {
    for (var k in fields) if (fields.hasOwnProperty(k)) {
      formData.append(k, fields[k]);
    }
  }

  formData.append('files', fileBuffer, {filename: filename});

  if (this.debug) {
    console.log('='.repeat(50));
    console.log(strf('{0} {1} {2}', colored('[Request]'), colored(method, 'cyan'), colored(path, 'cyan')));
    if (fields) {
      console.log(strf('{0} {1}', colored('[Fields]'), fields));
    }
    if (fileBuffer) {
      console.log(strf('{0} {1}', colored('[File]'), filename));
    }
  }

  // Prepare headers with auth info
  headers = headers || {};
  headers['Content-Type'] = 'application/json';
  if (traceId) {
    headers['X-Trace-Id'] = traceId;
  }

  if (this.akId && this.akSecret) {
    var authHeader = this.getAuthHeader(method, path, formData.getBuffer());
    Object.assign(headers, authHeader);
  }

  var formHeader = formData.getHeaders();
  Object.assign(headers, formHeader);

  // Do HTTP/HTTPS
  var requestOptions = {
    host   : this.host,
    port   : this.port,
    path   : path,
    method : method,
    headers: headers,
    timeout: this.timeout,
  };

  var httpLib = this.useHTTPS ? https : http;

  var self = this;

  var respStatusCode = 0;
  var respRawData    = '';
  var respData       = '';
  var req = httpLib.request(requestOptions, function(res) {
    respStatusCode = res.statusCode;

    res.on('data', function(chunk) {
      respRawData += chunk;
    });

    res.on('end', function() {
      var respContentType = res.headers['content-type'].split(';')[0].trim();
      if (respContentType === 'application/json') {
        respData = JSON.parse(respRawData);
      }

      if (self.debug) {
        var _color = respStatusCode >= 400 ? 'red' : 'green';

        console.log(colored(strf('{0} {1}', '[Response]', respStatusCode), _color));
        console.log(colored(strf('{0} {1}', '[Payload]', respRawData.toString()), _color));
      }

      if ('function' === typeof callback) {
        return callback(null, respData, respStatusCode);
      }
    });
  });

  req.on('error', function(err) {
    if ('function' === typeof callback) {
      return callback(err);
    }
  });

  if (formData.getLengthSync() > 0) {
    formData.pipe(req);
  }

  req.end();
};

WATClient.prototype.get = function(options, callback) {
  options = options || {};
  options.method = 'GET';
  return this.run(options, callback);
};

WATClient.prototype.post = function(options, callback) {
  options = options || {};
  options.method = 'POST';
  return this.run(options, callback);
};

WATClient.prototype.put = function(options, callback) {
  options = options || {};
  options.method = 'PUT';
  return this.run(options, callback);
};

WATClient.prototype.delete = function(options, callback) {
  options = options || {};
  options.method = 'DELETE';
  return this.run(options, callback);
};

exports.WATClient = WATClient;

if (require.main === module) {
  function testSuit(akSignVersion, callback) {
    var clientOpt = {
      akId         : 'ak-7Qf3KXH8QZOrW8Tf',
      akSecret     : 'WaYGi4cBsievlfZsNhE3fY40ZB9dI9L3',
      host         : 'ubuntu16-dev-big.vm',
      port         : 80,
      akSignVersion: akSignVersion,
    };
    var c = new WATClient(clientOpt);
    c.debug = true;

    // 1. GET Request Test
    var opt1 = {
      path   : '/api/v1/do/ping',
      traceId: 'TEST-NODE-001-' + akSignVersion,
    };
    c.get(opt1, function(err, respData, respStatusCode) {

      // 2. POST Request Test
      var opt2 = {
        path: '/api/v1/do/echo',
        body: {
          'echo': {
            'int'    : 1,
            'str'    : 'Hello World',
            'unicode': '你好，世界！',
            'none'   : null,
            'boolean': true,
          }
        },
        traceId: 'TEST-NODE-002-' + akSignVersion,
      };
      c.post(opt2, function(err, respData, respStatusCode) {

        // 3. UPLOAD Request Test
        if (UPLOAD_DISABLED) return callback && callback();

        var opt3 = {
          path      : '/api/v1/files/do/upload',
          fileBuffer: fs.readFileSync('使用说明_SDK.md'),
          filename  : '使用说明_SDK.md',
          fields    : {
            'note': 'This is a Chinese README. 这是一份中文使用说明。'
          },
          traceId: 'TEST-NODE-003-' + akSignVersion,
        };
        c.upload(opt3, function(err, respData, respStatusCode) {

          return callback && callback();
        });
      });
    });
  };

  testSuit('v2', function() {
    testSuit('v1', function() {
      testSuit(null);
    });
  });
};
