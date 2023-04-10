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
  console.log('Cannot require `form-data` package, the DataFluxFunc.upload() method is disabled.')
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
  } catch (err) {
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

function jsonDumps(obj) {
  if (typeof obj == 'string') {
    return '"' + obj + '"';
  }
  else if (typeof obj == 'number') {
    return obj;
  }
  else if (typeof obj == 'boolean') {
    return obj;
  }
  else if (typeof obj == 'function') {
    return '"<FUNCTION>"';
  }
  else if (typeof obj == 'object') {
    if (Array.isArray(obj)) {
      var parts = [];
      for (var i = 0; i < obj.length; i++) {
        var v = jsonDumps(obj[i]);
        parts.push(v);
      }

      return '[' + parts.join(',') + ']';
    } else if (obj === null) {
      return 'null';
    } else {
      var keyList = [];
      for (var k in obj) {
        keyList.push(k);
      }
      keyList.sort();

      var parts = [];
      for (var i = 0; i < keyList.length; i++) {
        var k = keyList[i];
        var v = jsonDumps(obj[k]);

        parts.push('"' + k + '":' + v);
      }
      return '{' + parts.join(',') + '}';
    }
  }
  else {
    return '"<UNKNOW>"';
  }
};

var DataFluxFunc = function(options) {
  this.debug = options.debug || false;

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
};

DataFluxFunc.prototype.getBodyMD5 = function(body) {
  body = jsonDumps(body || {});

  if (this.debug) {
    console.log(strf('{0} {1}',
      colored('[Body to MD5]'),
      body));
  }

  var c = crypto.createHash('md5');
  c.update(body);

  var hash = c.digest('hex');
  return hash;
};

DataFluxFunc.prototype.getSign = function(method, path, timestamp, nonce, body) {
  method = method.toUpperCase();

  if (!timestamp) {
    timestamp = parseInt(Date.now() / 1000).toString();
  }

  if (!nonce) {
    nonce = Math.random().toString();
  }

  var bodyMD5 = this.getBodyMD5(body);
  var stringToSign = [ method, path, timestamp, nonce, bodyMD5 ].join('&');

  if (this.debug) {
    console.log(strf('{0} {1}',
      colored('[String to Sign]'),
      stringToSign));
  }

  var c = crypto.createHmac('sha1', this.akSecret);
  c.update(stringToSign);
  var sign = c.digest('hex');

  if (this.debug) {
    console.log(strf('{0} {1}',
      colored('[Signature]'),
      sign));
  }

  return sign;
};

DataFluxFunc.prototype.verifySign = function(sign, method, path, timestamp, nonce, body) {
  var expectedSign = this.getSign(method, path, timestamp, nonce, body);

  return (sign === expectedSign);
};

DataFluxFunc.prototype.getAuthHeader = function(method, path, body) {
  var timestamp = parseInt(Date.now() / 1000).toString();
  var nonce     = Math.random().toString();

  var sign = this.getSign(method, path, timestamp, nonce, body);

  var authHeader = {
    'X-Dff-Ak-Id'       : this.akId,
    'X-Dff-Ak-Timestamp': timestamp,
    'X-Dff-Ak-Nonce'    : nonce,
    'X-Dff-Ak-Sign'     : sign,
  };
  return authHeader;
};

DataFluxFunc.prototype.verifyAuthHeader = function(headers, method, path, body) {
  var _headers = {};
  for (let k in headers) {
    _headers[k.toLowerCase()] = headers[k];
  }

  var sign      = _headers['x-dff-ak-sign']      || '';
  var timestamp = _headers['x-dff-ak-timestamp'] || '';
  var nonce     = _headers['x-dff-ak-nonce']     || '';

  return this.verifySign(sign, method, path, timestamp, nonce, body);
};

DataFluxFunc.prototype.run = function(options, callback) {
  var method  = options.method || 'GET';
  var path    = options.path;
  var query   = options.query;
  var body    = options.body;
  var headers = options.headers;
  var traceId = options.traceId;

  // Prepare method / query / body
  method = method.toUpperCase();

  if (query) {
    path = path + '?' + querystring.stringify(query);
  }

  var dumpedBody = jsonDumps(body);

  if (this.debug) {
    console.log('='.repeat(50));
    console.log(strf('{0} {1} {2}', colored('[Request]'), colored(method, 'cyan'), colored(path, 'cyan')));
    if (body) {
      console.log(strf('{0} {1}', colored('[Body]'), dumpedBody));
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

  // Do HTTP / HTTPS
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
        console.log(colored(strf('{0} {1}', '[Body]', respRawData.toString()), _color));
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
    req.write(dumpedBody);
  }

  req.end();
};

DataFluxFunc.prototype.upload = function(options, callback) {
  if (UPLOAD_DISABLED) {
    throw Error('`DataFluxFunc.upload()` method needs `form-data` package.')
  }

  var path        = options.path;
  var fileBuffer  = options.fileBuffer;
  var filename    = options.filename;
  var query       = options.query;
  var fields      = options.fields;
  var headers     = options.headers;
  var traceId     = options.traceId;

  // Prepare method / query / fields / file
  var method = 'POST';

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

  filename = querystring.escape(filename || 'uploadfile');
  formData.append('files', fileBuffer, { filename: filename });

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
    headers[this.headerFields.traceId] = traceId;
  }

  if (this.akId && this.akSecret) {
    var authHeader = this.getAuthHeader(method, path, fields);
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
        console.log(colored(strf('{0} {1}', '[Body]', respRawData.toString()), _color));
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

DataFluxFunc.prototype.get = function(options, callback) {
  options = options || {};
  options.method = 'GET';
  return this.run(options, callback);
};

DataFluxFunc.prototype.post = function(options, callback) {
  options = options || {};
  options.method = 'POST';
  return this.run(options, callback);
};

DataFluxFunc.prototype.put = function(options, callback) {
  options = options || {};
  options.method = 'PUT';
  return this.run(options, callback);
};

DataFluxFunc.prototype.delete = function(options, callback) {
  options = options || {};
  options.method = 'DELETE';
  return this.run(options, callback);
};

exports.DataFluxFunc = DataFluxFunc;

if (require.main === module) {
  var host = process.argv[2] || 'localhost:8088';

  // Create DataFlux Func Handler
  var opt = {
    akId    : 'ak-xxxxx',
    akSecret: 'xxxxxxxxxx',
    host    : host,
  };
  var dff = new DataFluxFunc(opt);

  // Debug ON
  dff.debug = true;

  // Send GET Request
  var getOpt = {
    path: '/api/v1/do/ping',
  };
  dff.get(getOpt, function(err, respData, respStatusCode) {
    if (err) console.error(colored(err, 'red'))

    // Send POST Request
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

      // Send UPLOAD Request
      if (UPLOAD_DISABLED) return;

      var filename = __filename.split('/').pop();
      var uploadOpt = {
        path      : '/api/v1/resources/do/upload',
        fileBuffer: fs.readFileSync(filename),
        filename  : filename,
        fields    : {
          'folder': 'test'
        },
      };
      dff.upload(uploadOpt, function(err, respData, respStatusCode) {
        if (err) console.error(colored(err, 'red'))
      });
    });
  });
};
