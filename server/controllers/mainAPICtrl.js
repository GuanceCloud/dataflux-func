'use strict';

/* Built-in Modules */
var path = require('path');

/* 3rd-party Modules */
var fs            = require('fs-extra');
var async         = require('async');
var LRU           = require('lru-cache');
var sortedJSON    = require('sorted-json');
var later         = require('@breejs/later');
var moment        = require('moment-timezone');
var byteSize      = require('byte-size');
var HTTPAuthUtils = require('http-auth-utils');

/* Project Modules */
var E       = require('../utils/serverError');
var CONFIG  = require('../utils/yamlResources').get('CONFIG');
var CONST   = require('../utils/yamlResources').get('CONST');
var toolkit = require('../utils/toolkit');
var auth    = require('../utils/auth');

var scriptSetMod       = require('../models/scriptSetMod');
var scriptMod          = require('../models/scriptMod');
var funcMod            = require('../models/funcMod');
var connectorMod       = require('../models/connectorMod');
var envVariableMod     = require('../models/envVariableMod');
var apiAuthMod         = require('../models/apiAuthMod');
var syncAPIMod         = require('../models/syncAPIMod');
var asyncAPIMod        = require('../models/asyncAPIMod');
var cronJobMod         = require('../models/cronJobMod');
var operationRecordMod = require('../models/operationRecordMod');
var fileServiceMod     = require('../models/fileServiceMod');
var userMod            = require('../models/userMod');

var funcAPICtrl = require('./funcAPICtrl');
const { cachedDataVersionTag } = require('v8');

var THROTTLING_RULE_EXPIRES_MAP = {
  bySecond: 1,
  byMinute: 60,
  byHour  : 60 * 60,
  byDay   : 60 * 60 * 24,
  byMonth : 60 * 60 * 24 * 30,
  byYear  : 60 * 60 * 24 * 365,
};

// LRU
var FUNC_CACHE_OPT = {
  max   : CONFIG._LRU_FUNC_CACHE_LIMIT,
  maxAge: CONFIG._LRU_FUNC_CACHE_MAX_AGE * 1000,
};
var FUNC_LRU      = new LRU(FUNC_CACHE_OPT);
var API_AUTH_LRU  = new LRU(FUNC_CACHE_OPT);
var SYNC_API_LRU  = new LRU(FUNC_CACHE_OPT);
var ASYNC_API_LRU = new LRU(FUNC_CACHE_OPT);

var FUNC_RESULT_CACHE_OPT = {
  max   : CONFIG._LRU_FUNC_RESULT_CACHE_LIMIT,
  maxAge: CONFIG._LRU_FUNC_RESULT_CACHE_MAX_AGE * 1000,
}
var FUNC_RESULT_CACHE_LRU = new LRU(FUNC_RESULT_CACHE_OPT);

// 自动创建资源文件夹
fs.ensureDirSync(CONFIG.RESOURCE_ROOT_PATH);

function _getHTTPRequestInfo(req) {
  if (req.path === 'FAKE') {
    return toolkit.jsonCopy(req);
  }

  // 请求体
  var httpRequest = {
    method     : req.method.toUpperCase(),
    originalUrl: req.originalUrl,
    url        : path.join(req.baseUrl, req.path),
    host       : req.headers.host,
    hostname   : req.hostname,
    protocol   : req.protocol,
    headers    : req.headers,
    query      : req.query,
    body       : req.body,
    ip         : req.ip,
    ips        : req.ips,
    xhr        : req.xhr,
  };
  return httpRequest;
};

function getFuncById(locals, funcId, callback) {
  if (!funcId) {
    // 未传递函数 ID 不执行
    return callback(new E('EClientNotFound', 'Func ID not specified'));
  }

  var func = FUNC_LRU.get(funcId);
  if (func) return callback(null, func);

  // 此处由于需要同时获取函数所在脚本的 MD5 值，需要使用`list`方法
  var funcModel = funcMod.createModel(locals);

  var opt = {
    limit  : 1,
    filters: {
      'func.id': {eq: funcId},
    }
  };
  funcModel.list(opt, function(err, dbRes) {
    if (err) return callback(err);

    dbRes = dbRes[0];
    if (!dbRes) {
      return callback(new E('EClientNotFound', 'No such Func', { funcId: funcId }));
    }

    func = dbRes;
    func.extraConfigJSON = func.extraConfigJSON || {};

    // 建立缓存
    FUNC_LRU.set(funcId, func);

    return callback(null, func);
  });
};

function _isFuncArgumentPlaceholder(v) {
  for (var i = 0; i < CONFIG._FUNC_ARGUMENT_PLACEHOLDER_LIST.length; i++) {
    if (CONFIG._FUNC_ARGUMENT_PLACEHOLDER_LIST[i] === v) return true;
  }
  return false;
};

function _assignFuncCallKwargs(destFuncCallKwargs, srcFuncCallKwargs) {
  var allKeys = toolkit.noDuplication(Object.keys(destFuncCallKwargs).concat(Object.keys(srcFuncCallKwargs)));
  allKeys.forEach(function(k) {
    var baseV  = destFuncCallKwargs[k];
    var inputV = srcFuncCallKwargs[k];

    if (baseV === undefined && inputV !== undefined) {
      // 额外参数，合并
      destFuncCallKwargs[k] = inputV;

    } else if (_isFuncArgumentPlaceholder(baseV) && inputV !== undefined) {
      // 占位符，可以合并
      destFuncCallKwargs[k] = inputV;

    } else if (baseV !== undefined && inputV !== undefined) {
      // 已经指定了固定参数值的，不允许额外传递
      throw new E('EClientBadRequest', 'Cannot specify a fixed kwargs field', {
        kwargsField: k,
        kwargsValue: inputV,
      });

    } else if (_isFuncArgumentPlaceholder(baseV) && inputV === undefined) {
      // 参数未传递
      delete destFuncCallKwargs[k];
    }
  });

  return destFuncCallKwargs;
};

function createFuncRunnerTaskReq(locals, options, callback) {
  options = toolkit.jsonCopy(options) || {};
  options.funcCallKwargs = options.funcCallKwargs || {};

  var func = null;
  async.series([
    // 获取函数
    function(asyncCallback) {
      getFuncById(locals, options.funcId, function(err, _func) {
        if (err) return asyncCallback(err);

        func = _func;

        return asyncCallback();
      })
    },
  ], function(err) {
    if (err) return callback(err);

    /***** 组装任务请求 *****/
    var taskReq = {
      name: 'Func.Runner',
      kwargs: {
        // 调用函数 / 参数
        funcId        : options.funcId,
        funcCallKwargs: options.funcCallKwargs,

        // 来源
        origin  : options.origin   || 'UNKNOWN',
        originId: options.originId || 'UNKNOWN',

        // HTTP 请求信息
        httpRequest: options.httpRequest || {},

        scriptSetTitle: func.sset_title,
        scriptTitle   : func.scpt_title,
        funcTitle     : func.title,
      },

      // ETA / 延迟执行
      eta  : options.eta   || undefined,
      delay: options.delay || undefined,

      // 任务记录保留数量
      taskRecordLimit: options.taskRecordLimit || undefined,

      // 是否忽略结果
      ignoreResult: options.ignoreResult,
    };

    // 函数结果缓存 taskReq.cacheResult / cacheResultKey
    if (toolkit.notNothing(func.extraConfigJSON.cacheResult)) {
      var cacheResult = parseInt(func.extraConfigJSON.cacheResult) || false;

      if (cacheResult) {
        var funcCallKwargsDump = sortedJSON.sortify(options.funcCallKwargs, { stringify: true });
        var funcCallKwargsMD5  = toolkit.getMD5(funcCallKwargsDump);

        taskReq.kwargs.cacheResult = cacheResult;
        taskReq.kwargs.cacheResultKey = toolkit.getCacheKey('cache', 'funcCallResult', [
          'funcId'              , func.id,
          'scriptCodeMD5'       , func.scpt_codeMD5,
          'scriptPublishVersion', func.scpt_publishVersion,
          'funcCallKwargsMD5'   , funcCallKwargsMD5]);
      }
    }

    // 队列 taskReq.queue
    //    优先级：直接指定 > 函数配置 > 默认值
    if (toolkit.notNothing(options.queue)) {
      // 直接指定
      var queueNumber = parseInt(options.queue);
      if (queueNumber < 1 || queueNumber > 9) {
        return callback(new E('EClientBadRequest', 'Invalid options, queue should be an integer between 1 and 9'));
      }

      taskReq.queue = queueNumber;

    } else if (toolkit.notNothing(func.extraConfigJSON.queue)) {
      // 函数配置
      taskReq.queue = parseInt(func.extraConfigJSON.queue);

    } else {
      // 默认值
      switch(options.origin) {
        case 'asyncAPI':
          taskReq.queue = CONFIG._FUNC_TASK_QUEUE_ASYNC_API;
          break;

        default:
          taskReq.queue = CONFIG._FUNC_TASK_QUEUE_DEFAULT;
          break;
      }
    }

    // 任务执行超时 taskReq.timeout
    //    优先级：调用时指定 > 函数配置 > 默认值
    if (toolkit.notNothing(options.timeout)) {
      // 调用时指定
      options.timeout = parseInt(options.timeout);

      if (options.timeout < CONFIG._FUNC_TASK_TIMEOUT_MIN) {
        return callback(new E('EClientBadRequest', 'Invalid options, timeout is too small', { min: CONFIG._FUNC_TASK_TIMEOUT_MIN }));
      }
      if (options.timeout > CONFIG._FUNC_TASK_TIMEOUT_MAX) {
        return callback(new E('EClientBadRequest', 'Invalid options, timeout is too large', { max: CONFIG._FUNC_TASK_TIMEOUT_MAX }));
      }

      taskReq.timeout = options.timeout;

    } else if (toolkit.notNothing(func.extraConfigJSON.timeout)) {
      // 函数配置
      taskReq.timeout = parseInt(func.extraConfigJSON.timeout);

    } else {
      // 默认值
      switch(options.origin) {
        case 'asyncAPI':
          // 异步 API 有单独的默认执行超时
          taskReq.timeout = CONFIG._FUNC_TASK_TIMEOUT_ASYNC_API;
          break;

        default:
          taskReq.timeout = CONFIG._FUNC_TASK_TIMEOUT_DEFAULT;
          break;
      }
    }

    // 任务执行超时 taskReq.expires
    //    优先级：调用时指定 > 函数配置 > 默认值
    if (toolkit.notNothing(options.expires)) {
      // 调用时指定
      options.expires = parseInt(options.expires);

      if (options.expires < CONFIG._FUNC_TASK_EXPIRES_MIN) {
        return callback(new E('EClientBadRequest', 'Invalid options, expires is too small', { min: CONFIG._FUNC_TASK_EXPIRES_MIN }));
      }
      if (options.expires > CONFIG._FUNC_TASK_EXPIRES_MAX) {
        return callback(new E('EClientBadRequest', 'Invalid options, expires is too large', { max: CONFIG._FUNC_TASK_EXPIRES_MAX }));
      }

      taskReq.expires = options.expires;

    } else if (toolkit.notNothing(func.extraConfigJSON.expires)) {
      // 函数配置
      taskReq.expires = parseInt(func.extraConfigJSON.expires);

    } else {
      // 默认值
      switch(options.origin) {
        case 'syncAPI':
        case 'asyncAPI':
          // 同步/异步 API 过期与超时相同
          taskReq.expires = taskReq.timeout || CONFIG._FUNC_TASK_TIMEOUT_DEFAULT;
          break;

        default:
          taskReq.expires = CONFIG._FUNC_TASK_EXPIRES_DEFAULT;
          break;
      }
    }

    // 返回类型 taskReq.returnType
    //    优先级：调用时指定 > 默认值
    if (toolkit.notNothing(options.returnType)) {
      // 调用时指定
      var _RETURN_TYPES = [ 'raw', 'jsonDumps'];
      if (_RETURN_TYPES.indexOf(options.returnType) < 0) {
        return callback(new E('EClientBadRequest', 'Invalid options, invalid returnType', { allowed: _RETURN_TYPES }));
      }

      taskReq.returnType = options.returnType;

    } else {
      // 默认值
      taskReq.returnType = 'raw';
    }

    // 是否拆箱 taskReq.unbox
    if (toolkit.notNothing(options.unbox)) {
      // 调用时指定
      taskReq.unbox = options.unbox;

    } else {
      // 默认
      switch(options.origin) {
        case 'direct':
          // 直接调用默认不拆箱
          taskReq.unbox = false;
          break;

        default:
          // 其他调用默认拆箱
          taskReq.unbox = true;
          break
      }
    }

    return callback(null, taskReq);
  });
};

function createFuncRunnerTaskReqFromHTTPRequest(locals, req, options, callback) {
  options = toolkit.jsonCopy(options) || {};

  // 解析请求数据
  var reqData = req.method.toLowerCase() === 'get' ? req.query : req.body;
  if ('string' === typeof reqData) {
    // 纯文本Body
    reqData = { text: reqData };
  } else if (Buffer.isBuffer(reqData)) {
    // Base64 Body
    reqData = { base64: toolkit.getBase64(reqData) }
  } else {
    // JSON Body
    if ('string' === typeof reqData.kwargs) {
      try {
        reqData.kwargs = JSON.parse(reqData.kwargs);
      } catch(err) {
        return callback(new E('EClientBadRequest', 'Invalid kwargs, bad JSON format', {
          error: err.toString(),
        }));
      }
    }

    if ('string' === typeof reqData.options) {
      try {
        reqData.options = JSON.parse(reqData.options);
      } catch(err) {
        return callback(new E('EClientBadRequest', 'Invalid options, bad JSON format', {
          error: err.toString(),
        }));
      }
    }
  }

  // 生成函数调用参数
  options.funcCallKwargs = options.funcCallKwargs || {};

  var reqFuncCallKwargs = {}
  var format = req.params.format || 'normal';
  switch(format) {
    case 'normal':
      // 标准形式：函数参数、执行选项为 JSON 字符串形式
      if (toolkit.notNothing(reqData.kwargs)) {
        reqFuncCallKwargs = reqData.kwargs;
      }
      if (toolkit.notNothing(reqData.options)) {
        Object.assign(options, reqData.options);
      }
      break;

    case 's':
    case 'simplified':
      // 简化形式：函数参数直接为参数名，不支持执行选项
      reqFuncCallKwargs = reqData;
      break;
  }

  try {
    _assignFuncCallKwargs(options.funcCallKwargs, reqFuncCallKwargs);

  } catch(err) {
    // 业务错误时补全脚本/函数信息
    if (err instanceof E) {
      err.setDetail({ funcId: options.funcId });
    }
    return callback(err);
  }

  // 生成文件上传参数
  if (req.files && req.files.length > 0) {
    options.funcCallKwargs.files = req.files.map(function(file) {
      return {
        filePath    : file.path,
        originalname: file.originalname,
        encoding    : file.encoding,
        mimetype    : file.mimetype,
        size        : file.size,
      }
    });
  }

  // 添加 HTTP 请求信息
  options.httpRequest = _getHTTPRequestInfo(req);

  return createFuncRunnerTaskReq(locals, options, callback);
};

function createFuncRunnerTaskReqForAPIAuth(locals, req, options, callback) {
  options = toolkit.jsonCopy(options) || {};

  // 添加 HTTP 请求信息
  options.httpRequest = _getHTTPRequestInfo(req);

  return createFuncRunnerTaskReq(locals, options, callback);
};

function _getFuncCallResultCache(locals, cacheKey, callback) {
  // 1. 从本地缓存中获取
  var lruRes = FUNC_RESULT_CACHE_LRU.get(cacheKey);
  if (lruRes) {
    return callback(null, lruRes);
  }

  // 2. 从Redis 中获取
  locals.cacheDB.get(cacheKey, function(err, cacheRes) {
    if (err) return callback(err);

    if (cacheRes) {
      cacheRes = JSON.parse(cacheRes);
    }

    FUNC_RESULT_CACHE_LRU.set(cacheKey, cacheRes);
    return callback(err, cacheRes);
  });
};

function callFuncRunner(locals, taskReq, callback) {
  callback = toolkit.ensureFn(callback);

  if (taskReq.ignoreResult) {
    // 忽略结果，不添加回调函数
    return locals.cacheDB.putTask(taskReq, function(err, taskId) {
      if (err) return callback(err);
      return callback(null, taskId);
    });

  } else {
    // 接收结果
    taskReq.onResponse = function(taskResp) {
      async.series([
        // 错误处理
        function(asyncCallback) {
          switch(taskResp.status) {
            case 'noResponse':
              // 无响应
              return asyncCallback(new E('EWorkerNoResponse', 'Worker no response, please check the status of this system'));

            case 'failure':
              // 失败
              return asyncCallback(new E('EFuncFailed', 'Func task failed', {
                exception: taskResp.exception,
                traceback: taskResp.traceback,
              }));

            case 'timeout':
              // 超时
              return asyncCallback(new E('EFuncTimeout', 'Func task timeout', {
                exception: taskResp.exception,
                traceback: taskResp.traceback,
              }));

            case 'success':
              // 成功
              // 结果无法解析
              if ('string' === typeof taskResp.result) {
                return asyncCallback(new E('EFuncResultParsingFailed', 'Cannot parse task result', {
                  result: taskResp.result,
                }));
              }

              return asyncCallback();
          }
        },
      ], function(err) {
        return callback(err, taskResp);
      });
    };

    async.series([
      // 返回缓存结果
      function(asyncCallback) {
        if (!taskReq.kwargs.cacheResultKey) return asyncCallback();

        _getFuncCallResultCache(locals, taskReq.kwargs.cacheResultKey, function(err, cacheRes) {
          if (err) {
            // 报错后时，改为真实调用函数
            locals.logger.logError(err);
            return asyncCallback();
          }

          if (!cacheRes) {
            // 无缓存时，改为真实调用函数
            return asyncCallback();

          } else {
            // 命中进入缓存时，直接调用任务响应函数，结束
            var taskResp = cacheRes;
            taskResp.isCached = true;

            return taskReq.onResponse(taskResp);
          }
        });
      },
    ], function(err) {
      if (err) return callback(err);
      return locals.cacheDB.putTask(taskReq);
    });
  }
};

function callFuncDebugger(locals, options, callback) {
  var taskReq = {
    name: 'Func.Debugger',
    kwargs: {
      funcId        : options.funcId         || options.scriptId,
      funcCallKwargs: options.funcCallKwargs || {},

      // 来源
      origin  : options.origin   || 'UNKNOWN',
      originId: options.originId || 'UNKNOWN',

      // HTTP 请求信息
      httpRequest: options.httpRequest || {},
    },
    queue  : CONFIG._FUNC_TASK_QUEUE_DEBUGGER,
    timeout: CONFIG._FUNC_TASK_TIMEOUT_DEBUGGER,

    onResponse(taskResp) {
      switch(taskResp.status) {
        // 无响应
        case 'noResponse':
          return callback(new E('EWorkerNoResponse', 'Worker no response, please check the status of this system'));

        // 执行超时
        case 'timeout':
          return callback(new E('EFuncTimeout', 'Func task timeout', taskResp));

        // 成功
        case 'success':
          return callback(null, taskResp);

        // 预期外情况
        default:
          return callback(new E('EAssert', 'Unexpected result.'));
      }
    }
  }
  return locals.cacheDB.putTask(taskReq);
};

function _doAPIResponse(res, taskReq, taskResp, callback) {
  var responseControl = taskResp.result.responseControl || {};
  var returnValue     = taskResp.result.returnValue     || null;

  // 缓存标记
  if (taskResp.isCached) {
    res.set(CONFIG._WEB_IS_CACHED_HEADER, 'Cached');
  }

  // 响应控制
  if (responseControl.statusCode) {
    res.status(responseControl.statusCode);
  }

  if (responseControl.headers) {
    res.set(responseControl.headers);
  }

  if (!responseControl.allow304) {
    res.set('Last-Modified', (new Date()).toUTCString());
  }

  if (responseControl.filePath) {
    // 从文件读取数据
    var filePath = path.join(CONFIG.RESOURCE_ROOT_PATH, responseControl.filePath.replace(/^\/+/, ''));

    fs.readFile(filePath, function(err, buffer) {
      if (err) return callback(err);

      // 默认与源文件名相同
      var fileName = filePath.split('/').pop();
      if ('string' === typeof responseControl.download) {
        // 指定下载名
        fileName = responseControl.download;
      }

      if (responseControl.download === false) {
        // 非下载模式
        res.locals.sendRaw(buffer, fileName);
      } else {
        // 下载模式
        res.locals.sendFile(buffer, fileName);
      }

      // 自动删除文件
      if (responseControl.autoDelete) {
        fs.remove(filePath);
      }

      return;
    });

  } else {
    // 直接返回数据
    if (responseControl.download) {
      // 作为文件下载
      var file     = returnValue;
      var fileName = responseControl.download;
      if ('string' !== typeof fileName) {
        var fileExt = typeof file === 'object' ? 'json' : 'txt';
        fileName = `api-resp.${fileExt}`;
      }
      return res.locals.sendFile(file, fileName);

    } else {
      // 作为数据返回

      // 当指定了响应体类型后
      //    returnType 必须为 "raw"
      //    unbox      必须为 true
      var returnType = taskReq.returnType;
      var unbox      = taskReq.unbox;
      if (responseControl.contentType) {
        returnType = 'raw';
        unbox      = true;
      }

      // 根据 returnType 转换格式
      switch(returnType) {
        case 'raw':
          // Nope
          break;

        case 'jsonDumps':
          returnValue = JSON.stringify(returnValue);
          break;
      }

      // 拆箱
      if (unbox) {
        // 需要拆箱时，发送数据类型不确定
        return res.locals.sendRaw(returnValue, responseControl.contentType);

      } else {
        // 不拆箱时，必然是 JSON，且结果包含在 data.result 中
        var ret = toolkit.initRet({
          result: returnValue,
        });
        return res.locals.sendJSON(ret);
      }
    }
  }
};

function __matchedFixedFields(req, fields) {
  var result = false;

  for (var i = 0; i < fields.length; i++) {
    var f = fields[i];

    if (f.location === 'header') {
      // Header字段
      result = (req.get(f.name) === f.value);

    } else {
      // 非Header字段
      try {
        var fullPath = toolkit.strf('{0}.{1}', f.location, f.name);
        result = (toolkit.jsonFind(req, fullPath) === f.value)
      } catch(_) {}
      try { delete req[f.location][f.name] } catch(_) {}
    }

    if (result) break;
  }
  return result;
};

function __getHTTPAuth(type, req, res, callback) {
  type = type.toLowerCase();

  var authInfo = null;

  var authString = req.get('Authorization');
  if (!authString || !toolkit.startsWith(authString.toLowerCase(), type + ' ')) return callback();

  var data = authString.slice(type.length + 1);
  switch(type) {
    case 'basic':
      var splitted = toolkit.fromBase64(data).split(':');
      authInfo = {
        hash    : data,
        username: splitted[0],
        password: splitted.slice(1).join(':'),
      }
      return callback(null, authInfo);
      break;

    case 'digest':
      authInfo = toolkit.parseKVString(data);
      authInfo.hash = authInfo.response;

      var tags = [
        'realm', authInfo.realm,
        'nonce', authInfo.nonce,
      ]
      var cacheKey = toolkit.getCacheKey('cache', 'httpAuth', tags);
      res.locals.cacheDB.get(cacheKey, function(err, cacheRes) {
        if (err) return callback(err);

        if (cacheRes) {
          return callback(null, authInfo);
        } else {
          return callback(null, null);
        }
      });
      break;

    default:
      return callback();
      break;
  }
};

function __checkHTTPAuth(type, req, authInfo, password) {
  var expectedHash = HTTPAuthUtils[type.toUpperCase()].computeHash({
    username : authInfo.username,
    realm    : authInfo.realm,
    password : password,
    method   : req.method.toUpperCase(),
    uri      : authInfo.uri,
    nonce    : authInfo.nonce,
    nc       : authInfo.nc,
    cnonce   : authInfo.cnonce,
    qop      : authInfo.qop,
    algorithm: 'md5',
  });
  return expectedHash === authInfo.hash;
};

function __askHTTPAuth(type, res, realm, callback) {
  var nonce = toolkit.genUUID();

  var tags = [
    'realm', realm,
    'nonce', nonce,
  ]
  var cacheKey = toolkit.getCacheKey('cache', 'httpAuth', tags);
  res.locals.cacheDB.setex(cacheKey, CONFIG._HTTP_AUTH_NONCE_MAX_AGE, 'x', function(err) {
    if (err) return callback(err);

    var authMechanism = HTTPAuthUtils[type.toUpperCase()];
    var authOpt = {
      realm : realm,
      qop   : 'auth',
      nonce : nonce,
      opaque: 'DataFlux Func Love You!',
    };
    var wwwAuthString = HTTPAuthUtils.buildWWWAuthenticateHeader(authMechanism, authOpt);

    res.set('WWW-Authenticate', wwwAuthString);
    return callback(new E('EAPIAuth', toolkit.strf('HTTP {0} Auth failed', type)));
  });
};

function __callAuthFunc(req, res, apiAuth, callback) {
  var taskReq = null;
  async.series([
    // 创建函数调用选项
    function(asyncCallback) {
      var opt = {
        funcId  : apiAuth.configJSON.funcId,
        origin  : 'apiAuth',
        originId: apiAuth.id
      }
      createFuncRunnerTaskReqForAPIAuth(res.locals, req, opt, function(err, _taskReq) {
        if (err) return asyncCallback(err);

        taskReq = _taskReq;

        return asyncCallback();
      });
    },
  ], function(err) {
    if (err) return callback(err);

    callFuncRunner(res.locals, taskReq, function(err, taskResp) {
      if (err) return callback(err);

      var isValidAuth = false;
      try { isValidAuth = !!taskResp.result } catch(_) {};

      return callback(null, isValidAuth);
    });
  });
};

function _doAPIAuth(locals, req, res, apiAuthId, realm, callback) {
  var apiAuth = null;
  async.series([
    // 获取API认证配置
    function(asyncCallback) {
      apiAuth = API_AUTH_LRU.get(apiAuthId);
      if (apiAuth === null) {
        // 已查询过不存在
        return asyncCallback();

      } else if (apiAuth) {
        // 已查询确定存在
        return asyncCallback();
      }

      var apiAuthModel = apiAuthMod.createModel(locals);

      apiAuthModel._get(apiAuthId, null, function(err, dbRes) {
        if (err) return asyncCallback(err);

        if (!dbRes) {
          // 查询不存在，缓存为`null`
          API_AUTH_LRU.set(apiAuthId, null);
          return asyncCallback();
        }

        apiAuth = dbRes;
        API_AUTH_LRU.set(apiAuthId, apiAuth);

        return asyncCallback();
      });
    },
    // 执行认证配置
    function(asyncCallback) {
      if (!apiAuth) return asyncCallback();

      locals.logger.info('[API AUTH] Type: {0}', apiAuth.type);

      switch(apiAuth.type) {
        case 'fixedField':
          var fields = apiAuth.configJSON.fields;
          if (!__matchedFixedFields(req, fields)) {
            return asyncCallback(new E('EAPIAuth', 'Fixed Field Auth failed'));
          }
          return asyncCallback();
          break;

        case 'httpBasic':
        case 'httpDigest':
          var authType = apiAuth.type.replace(/^http/g, '');

          __getHTTPAuth(authType, req, res, function(err, authInfo) {
            if (err) return asyncCallback(err);

            var users = apiAuth.configJSON.users;
            if (!authInfo || toolkit.isNothing(users)) {
              // 未发送认证信息/认证信息未配置时，要求认证
              return __askHTTPAuth(authType, res, realm, asyncCallback);
            }

            // 查找用户
            var matchedUser = users.filter(function(x) {
              return x.username === authInfo.username;
            })[0];

            if (!matchedUser) {
              // 没有匹配用户
              return __askHTTPAuth(authType, res, realm, asyncCallback);

            } else {
              var salt = `~${apiAuthId}~${matchedUser.username}~`;
              var password = toolkit.decipherByAES(matchedUser.passwordCipher, CONFIG.SECRET, salt);
              if (!__checkHTTPAuth(authType, req, authInfo, password)) {
                return __askHTTPAuth(authType, res, realm, asyncCallback);
              }
            }

            return asyncCallback();
          });
          break;

        case 'func':
          __callAuthFunc(req, res, apiAuth, function(err, isValidAuth) {
            if (err) return asyncCallback(err);

            if (!isValidAuth) {
              return asyncCallback(new E('EAPIAuth', 'Func Auth failed'));
            }

            return asyncCallback();
          });
          break;

        default:
          return asyncCallback();
      }
    },
  ], function(err) {
    if (err) return callback(err);
    return callback();
  });
};

/* Handlers */
exports.overview = function(req, res, next) {
  var now = toolkit.getTimestamp();

  var sections = toolkit.asArray(req.query.sections);
  var sectionMap = null;
  if (toolkit.notNothing(sections)) {
    sectionMap = {};
    sections.forEach(function(s) {
      sectionMap[s] = true;
    })
  }

  var scriptSetModel   = scriptSetMod.createModel(res.locals);
  var scriptModel      = scriptMod.createModel(res.locals);
  var funcModel        = funcMod.createModel(res.locals);
  var connectorModel   = connectorMod.createModel(res.locals);
  var envVariableModel = envVariableMod.createModel(res.locals);
  var syncAPIModel     = syncAPIMod.createModel(res.locals);
  var cronJobModel     = cronJobMod.createModel(res.locals);
  var asyncAPIModel    = asyncAPIMod.createModel(res.locals);
  var fileServiceModel = fileServiceMod.createModel(res.locals);
  var userModel        = userMod.createModel(res.locals);

  var bizEntityMeta = [
    { name : 'scriptSet',       model: scriptSetModel       },
    { name : 'script',          model: scriptModel          },
    { name : 'func',            model: funcModel            },
    { name : 'connector',       model: connectorModel       },
    { name : 'envVariable',     model: envVariableModel     },
    { name : 'syncAPI',         model: syncAPIModel         },
    { name : 'asyncAPI',        model: asyncAPIModel        },
    { name : 'cronJob',         model: cronJobModel         },
    { name : 'fileService',     model: fileServiceModel     },
    { name : 'user',            model: userModel            },
  ];

  var overview = {
    services   : [],
    queues     : [],
    bizMetrics : [],
    bizEntities: [],
  };

  if (!sectionMap || sectionMap.queues) {
    for (var i = 0; i < CONFIG._WORKER_QUEUE_COUNT; i++) {
      overview.queues[i] = {
        workerCount      : 0,
        processCount     : 0,
        delayQueueLength : 0,
        workerQueueLength: 0,
        workerQueueLimit : 0,
        workerQueueLoad  : 0,
      }
    }
  }

  var SCRIPT_SET_HIDDEN_OFFICIAL_SCRIPT_MARKET = CONST.systemSettings.SCRIPT_SET_HIDDEN_OFFICIAL_SCRIPT_MARKET;
  var SCRIPT_SET_HIDDEN_BUILTIN                = CONST.systemSettings.SCRIPT_SET_HIDDEN_BUILTIN;
  var SCRIPT_SET_HIDDEN_BLUEPRINT              = CONST.systemSettings.SCRIPT_SET_HIDDEN_BLUEPRINT;
  var nonScriptSetOrigins                      = [];
  var nonScriptSetOriginIds                    = [];
  async.series([
    // 获取系统配置
    function(asyncCallback) {
      var keys = [
        'SCRIPT_SET_HIDDEN_OFFICIAL_SCRIPT_MARKET',
        'SCRIPT_SET_HIDDEN_BUILTIN',
        'SCRIPT_SET_HIDDEN_BLUEPRINT',
      ]
      res.locals.getSystemSettings(keys, function(err, systemSettings) {
        if (err) return asyncCallback(err);

        SCRIPT_SET_HIDDEN_OFFICIAL_SCRIPT_MARKET = systemSettings.SCRIPT_SET_HIDDEN_OFFICIAL_SCRIPT_MARKET;
        if (SCRIPT_SET_HIDDEN_OFFICIAL_SCRIPT_MARKET) {
          nonScriptSetOriginIds.push('smkt-official');
        }

        SCRIPT_SET_HIDDEN_BUILTIN = systemSettings.SCRIPT_SET_HIDDEN_BUILTIN;
        if (SCRIPT_SET_HIDDEN_BUILTIN) {
          nonScriptSetOrigins.push('builtin');
        }

        SCRIPT_SET_HIDDEN_BLUEPRINT = systemSettings.SCRIPT_SET_HIDDEN_BLUEPRINT;
        if (SCRIPT_SET_HIDDEN_BLUEPRINT) {
          nonScriptSetOrigins.push('blueprint');
        }

        return asyncCallback();
      });
    },
    // 获取运行中服务列表
    function(asyncCallback) {
      if (sectionMap && !sectionMap.services) return asyncCallback();

      var cacheKey = toolkit.getMonitorCacheKey('heartbeat', 'serviceInfo');
      res.locals.cacheDB.hgetallExpires(cacheKey, CONFIG._MONITOR_REPORT_EXPIRES, function(err, cacheRes) {
        if (err) return asyncCallback(err);

        // 获取服务列表
        for (var field in cacheRes) {
          var parsedTags = toolkit.parseColonTags(field);
          var cacheData  = cacheRes[field];

          overview.services.push({
            hostname: parsedTags.hostname,
            pid     : parsedTags.pid,
            name    : cacheData.name,
            uptime  : cacheData.uptime,
            version : cacheData.version,
            edition : cacheData.edition,
            queues  : cacheData.queues,
            ttl     : Math.max(0, cacheData.ts + CONFIG._MONITOR_REPORT_EXPIRES - now),
          });
        }

        // 服务排序
        var serviceOrder = [ 'server', 'worker', 'beat' ];
        overview.services.sort(function(a, b) {
          var serviceOrder_a = serviceOrder.indexOf(a.name);
          var serviceOrder_b = serviceOrder.indexOf(b.name);

          var queueDumps_a = toolkit.jsonDumps(a.queues || []);
          var queueDumps_b = toolkit.jsonDumps(b.queues || []);

          if (serviceOrder_a < serviceOrder_b) return -1;
          else if (serviceOrder_a > serviceOrder_b) return 1;
          else
            if (queueDumps_a < queueDumps_b) return -1;
            else if (queueDumps_a > queueDumps_b) return 1;
            else
              if (a.ttl > b.ttl) return -1;
              else if (a.ttl < b.ttl) return 1;
              else return 0
        });

        return asyncCallback();
      });
    },
    // 各队列工作单元数量
    function(asyncCallback) {
      if (sectionMap && !sectionMap.queues) return asyncCallback();

      var cacheKey = toolkit.getMonitorCacheKey('heartbeat', 'workerCountOnQueue');
      res.locals.cacheDB.hgetallExpires(cacheKey, CONFIG._MONITOR_REPORT_EXPIRES, function(err, cacheRes) {
        if (err) return asyncCallback(err);
        if (!cacheRes) return asyncCallback();

        for (var q in cacheRes) {
          overview.queues[q].workerCount = parseInt(cacheRes[q].workerCount || 0) || 0;
        }

        return asyncCallback();

      });
    },
    // 各队列工作进程数量
    function(asyncCallback) {
      if (sectionMap && !sectionMap.queues) return asyncCallback();

      var cacheKey = toolkit.getMonitorCacheKey('heartbeat', 'processCountOnQueue');
      res.locals.cacheDB.hgetallExpires(cacheKey, CONFIG._MONITOR_REPORT_EXPIRES, function(err, cacheRes) {
        if (err) return asyncCallback(err);
        if (!cacheRes) return asyncCallback();

        for (var q in cacheRes) {
          overview.queues[q].processCount = parseInt(cacheRes[q].processCount || 0) || 0;
        }

        return asyncCallback();

      });
    },
    // 队列长度、延迟队列长度
    function(asyncCallback) {
      if (sectionMap && !sectionMap.queues) return asyncCallback();

      async.timesSeries(CONFIG._WORKER_QUEUE_COUNT, function(q, timesCallback) {
        async.series([
          function(innerCallback) {
            var workerQueue = toolkit.getWorkerQueue(q);
            res.locals.cacheDB.run('llen', workerQueue, function(err, cacheRes) {
              if (err) return innerCallback(err);

              var length = parseInt(cacheRes || 0) || 0;
              overview.queues[q].workerQueueLength = length;

              // 计算负载（每个进程需要处理的任务数量）
              overview.queues[q].workerQueueLoad = parseInt(length / (overview.queues[q].processCount || 1));

              return innerCallback();
            });
          },
          function(innerCallback) {
            var delayQueue = toolkit.getDelayQueue(q);
            res.locals.cacheDB.run('zcard', delayQueue, function(err, cacheRes) {
              if (err) return innerCallback(err);

              overview.queues[q].delayQueueLength = parseInt(cacheRes || 0) || 0;

              return innerCallback();
            });
          },
        ], timesCallback);
      }, asyncCallback);
    },
    // 工作队列长度限制
    function(asyncCallback) {
      if (sectionMap && !sectionMap.queues) return asyncCallback();

      var cacheKey = toolkit.getGlobalCacheKey('cache', 'workerQueueLimitCronJob');
      res.locals.cacheDB.get(cacheKey, function(err, cacheRes) {
        if (err) return asyncCallback(err);

        if (!cacheRes) return asyncCallback();

        cacheRes = JSON.parse(cacheRes);
        for (var queue in cacheRes) {
          overview.queues[queue].workerQueueLimit = cacheRes[queue];
        }

        return asyncCallback();
      });
    },
    // 业务指标
    function(asyncCallback) {
      if (sectionMap && !sectionMap.bizMetrics) return asyncCallback();

      var cronJobs = [];
      async.series([
        // 查询所有定时任务
        function(innerCallback) {
          var opt = {
            fields : [
              'cron.id',
              'cron.cronExpr',
              "JSON_UNQUOTE(JSON_EXTRACT(func.extraConfigJSON, '$.fixedCronExpr')) AS fixedCronExpr",
            ],
            filters: {
              'cron.isDisabled': { eq: false },
              'func.id'        : { isnotnull: true },
            },
          }
          cronJobModel.list(opt, function(err, dbRes) {
            if (err) return innerCallback(err);

            cronJobs = dbRes;

            return innerCallback();
          });
        },
        // 追加动态 Cron 表达式配置
        function(innerCallback) {
          if (toolkit.isNothing(cronJobs)) return innerCallback();

          var dataIds  = toolkit.arrayElementValues(cronJobs, 'id');
          var cacheKey = toolkit.getGlobalCacheKey('cronJob', 'dynamicCronExpr');
          res.locals.cacheDB.hmget(cacheKey, dataIds, function(err, cacheRes) {
            if (err) return innerCallback(err);

            var now = toolkit.getTimestamp();
            cronJobs.forEach(function(d) {
              d.dynamicCronExpr = null;

              var dynamicCronExpr = cacheRes[d.id];
              if (!dynamicCronExpr) return;

              dynamicCronExpr = JSON.parse(dynamicCronExpr);
              if (dynamicCronExpr.expireTime && dynamicCronExpr.expireTime < now) return;

              d.dynamicCronExpr = dynamicCronExpr.value;
            });

            return innerCallback();
          });
        },
        // 追加 Cron 暂停标记
        function(innerCallback) {
          if (toolkit.isNothing(cronJobs)) return innerCallback();

          var dataIds  = toolkit.arrayElementValues(cronJobs, 'id');
          var cacheKey = toolkit.getGlobalCacheKey('cronJob', 'pause');
          res.locals.cacheDB.hmget(cacheKey, dataIds, function(err, cacheRes) {
            if (err) return innerCallback(err);

            var now = toolkit.getTimestamp();
            cronJobs.forEach(function(d) {
              d.isPaused = false;

              var pauseExpireTime = cacheRes[d.id];
              if (!pauseExpireTime) return;

              pauseExpireTime = parseInt(pauseExpireTime);
              if (pauseExpireTime && pauseExpireTime < now) return;

              d.isPaused = true;
            });

            return innerCallback();
          });
        },
        // 计算未来 24 小时定时任务触发次数
        function(innerCallback) {
          var baseTimestamp = moment(moment().format('YYYY-MM-DDT00:00:01Z')).unix() * 1000;

          var totalTriggerCount   = 0;
          var cronTriggerCountMap = {}
          cronJobs.forEach(function(c) {
            var cronExpr = c.dynamicCronExpr || c.fixedCronExpr || c.cronExpr;
            if (!cronExpr) return;

            if (c.isPaused) return;

            var tickCount = cronTriggerCountMap[cronExpr];
            if (toolkit.notNothing(tickCount)) {
              totalTriggerCount += tickCount;
              return;
            }

            var start = new Date(baseTimestamp);
            var end   = new Date(baseTimestamp + (3600 * 24 * 1000));
            var cron = later.parse.cron(cronExpr);

            var tickCount = 0
            while (true) {
              var r = later.schedule(cron).next(1000, start, end);
              if (!r || r.length === 0) break;

              start = r.pop();

              if (r.length > 0) {
                tickCount += r.length;
              } else {
                tickCount += 1;
                break;
              }
            }

            cronTriggerCountMap[cronExpr] = tickCount;
            totalTriggerCount += tickCount;
          });

          overview.bizMetrics.push({
            title    : 'Cron Job',
            subTitle : 'Triggers Per Second',
            value    : parseFloat((totalTriggerCount / (3600 * 24)).toFixed(1)),
            isBuiltin: true,
          });
          overview.bizMetrics.push({
            title    : 'Cron Job',
            subTitle : 'Triggers Per Minute',
            value    : parseFloat((totalTriggerCount / (60 * 24)).toFixed(1)),
            isBuiltin: true,
          });
          overview.bizMetrics.push({
            title    : 'Cron Job',
            subTitle : 'Triggers Per Hour',
            value    : parseFloat((totalTriggerCount / 24).toFixed(1)),
            isBuiltin: true,
          });
          overview.bizMetrics.push({
            title    : 'Cron Job',
            subTitle : 'Triggers Per Day',
            value    : parseFloat((totalTriggerCount).toFixed(1)),
            isBuiltin: true,
          });

          return innerCallback();
        },
      ], asyncCallback);
    },
    // 业务实体计数
    function(asyncCallback) {
      if (sectionMap && !sectionMap.bizEntities) return asyncCallback();

      async.eachSeries(bizEntityMeta, function(meta, eachCallback) {
        var opt       = null;
        var useHidden = false;

        // 脚本集相关的需要去除隐藏的内容
        switch(meta.name) {
          case 'scriptSet':
            opt = {
              baseSQL: `
                SELECT
                  COUNT(sset.id) AS count
                FROM biz_main_script_set AS sset`,
            }
            useHidden = true;
            break;

          case 'script':
            opt = {
              baseSQL: `
                SELECT
                  COUNT(scpt.id) AS count
                FROM biz_main_script AS scpt
                JOIN biz_main_script_set AS sset
                  ON scpt.scriptSetId = sset.id`,
            }
            useHidden = true;
            break;

          case 'func':
            opt = {
              baseSQL: `
                SELECT
                  COUNT(func.id) AS count
                FROM biz_main_func AS func
                JOIN biz_main_script AS scpt
                  ON func.scriptId = scpt.id
                JOIN biz_main_script_set AS sset
                  ON scpt.scriptSetId = sset.id`,
            }
            useHidden = true;
            break;

          case 'syncAPI':
          case 'asyncAPI':
          case 'cronJob':
            opt = {
              baseSQL: `
                SELECT
                  COUNT(*)                      AS count,
                  SUM(IF(isDisabled = 0, 1, 0)) AS countEnabled
                FROM ${meta.model.tableName}`
            }
            break;

          default:
            opt = {
              baseSQL: `
                SELECT
                  COUNT(*) AS count
                FROM ${meta.model.tableName}`
            }
            break;
        }

        if (useHidden) {
          opt.filters = opt.filters || {};
          if (nonScriptSetOrigins.length   > 0) opt.filters['sset.origin']   = { notin: nonScriptSetOrigins   };
          if (nonScriptSetOriginIds.length > 0) opt.filters['sset.originId'] = { notin: nonScriptSetOriginIds };
        }

        opt.orders = false;
        meta.model._list(opt, function(err, dbRes) {
          if (err) return eachCallback(err);

          overview.bizEntities.push({
            name        : meta.name,
            count       : dbRes[0].count,
            countEnabled: 'countEnabled' in dbRes[0] ? parseInt(dbRes[0].countEnabled || 0) : undefined,
          });

          return eachCallback();
        });
      }, asyncCallback);
    },
  ], function(err) {
    if (err) return next(err);

    if (sectionMap) {
      Object.keys(overview).forEach(function(k) {
        if (!sectionMap[k]) {
          delete overview[k];
        }
      })
    }

    var ret = toolkit.initRet(overview);
    return res.locals.sendJSON(ret, { muteLog: true });
  });
};

exports.describeFunc = function(req, res, next) {
  var funcId = req.params.funcId;

  var funcModel = funcMod.createModel(res.locals);

  var func = null;

  async.series([
    function(asyncCallback) {
      funcModel.getWithCheck(funcId, null, function(err, dbRes) {
        if (err) return asyncCallback(err);

        func = dbRes;

        return asyncCallback();
      });
    },
  ], function(err) {
    if (err) return next(err);

    var ret = toolkit.initRet(func);
    return res.locals.sendJSON(ret);
  });
};

exports.callFunc = function(req, res, next) {
  var funcId  = req.params.funcId;
  var options = req.body.options || {};

  var taskReq = null;
  async.series([
    // 创建函数调用选项
    function(asyncCallback) {
      var opt = {
        funcId  : funcId,
        origin  : 'direct',
        originId: 'direct',
      }
      createFuncRunnerTaskReqFromHTTPRequest(res.locals, req, opt, function(err, _taskReq) {
        if (err) return asyncCallback(err);

        taskReq = _taskReq;

        return asyncCallback();
      });
    },
  ], function(err) {
    if (err) return next(err);

    if (options.async) {
      // 异步方式调用
      taskReq.ignoreResult = true;
      callFuncRunner(res.locals, taskReq, function(err, taskId) {
        if (err) return next(err);

        var ret = toolkit.initRet({ id: taskId });
        return res.locals.sendJSON(ret);
      });

    } else {
      // 同步方式调用
      callFuncRunner(res.locals, taskReq, function(err, taskResp) {
        if (err) return next(err);
        return _doAPIResponse(res, taskReq, taskResp, next);
      });
    }
  });
};

exports.callFuncMany = function(req, res, next) {
  var calls = req.body.calls || [];

  var taskIds = [];
  async.eachLimit(calls, 10, function(call, eachCallback) {
    var options = call.options || {};
    var opt = {
      funcId        : call.funcId,
      funcCallKwargs: call.kwargs || {},
      origin        : 'direct',
      originId      : 'direct',
      httpRequest   : _getHTTPRequestInfo(req),
      eta           : options.eta,
      delay         : options.delay,
      ignoreResult  : true,
    }

    var taskReq = null;
    async.series([
      function(asyncCallback) {
        createFuncRunnerTaskReq(res.locals, opt, function(err, _taskReq) {
          if (err) return asyncCallback(err);

          taskReq = _taskReq;

          return asyncCallback();
        });
      },
      function(asyncCallback) {
        callFuncRunner(res.locals, taskReq, function(err, taskId) {
          if (err) return asyncCallback(err);

          taskIds.push(taskId);

          return asyncCallback();
        });
      }
    ], eachCallback);
  }, function(err) {
    if (err) return next(err);

    var ret = toolkit.initRet({ ids: taskIds });
    return res.locals.sendJSON(ret);
  });
};


exports.callFuncDraft = function(req, res, next) {
  // 函数，参数
  var funcId         = req.params.funcId;
  var funcCallKwargs = req.body.kwargs || {};

  var opt = {
    funcId        : funcId,
    funcCallKwargs: funcCallKwargs,

    origin  : 'direct',
    originId: funcId,
  }

  // 添加 HTTP 请求信息
  opt.httpRequest = _getHTTPRequestInfo(req);

  return callFuncDebugger(res.locals, opt, function(err, taskResp) {
    if (err) return next(err);

    var ret = toolkit.initRet(taskResp);
    res.locals.sendJSON(ret);
  });
};

exports.callSyncAPI = function(req, res, next) {
  var id = req.params.id;

  var taskReq = null;
  var syncAPI = null;
  async.series([
    // 检查同步 API 是否存在
    function(asyncCallback) {
      syncAPI = SYNC_API_LRU.get(id);

      if (syncAPI === null) {
        // 已查询过不存在
        return asyncCallback(new E('EClientNotFound', 'No such Sync API', { id: id }));

      } else if (syncAPI) {
        // 已查询确定存在
        return asyncCallback();
      }

      var syncAPIModel = syncAPIMod.createModel(res.locals);

      syncAPIModel._get(id, null, function(err, dbRes) {
        if (err) return asyncCallback(err);

        if (!dbRes) {
          // 查询不存在，缓存为`null`
          SYNC_API_LRU.set(id, null);
          return asyncCallback(new E('EClientNotFound', 'No such Sync API', { id: id }));
        }

        syncAPI = dbRes;
        SYNC_API_LRU.set(id, syncAPI);

        return asyncCallback();
      });
    },
    // 检查认证
    function(asyncCallback) {
      if (!syncAPI.apiAuthId) return asyncCallback();

      var realm = 'SyncAPI:' + syncAPI.id;
      _doAPIAuth(res.locals, req, res, syncAPI.apiAuthId, realm, asyncCallback);
    },
    // 检查限制
    function(asyncCallback) {
      // 是否已禁用
      if (syncAPI.isDisabled) {
        return asyncCallback(new E('EBizCondition.SyncAPIDisabled', 'This Sync API is disabled'))
      }

      // 是否已过期
      if (syncAPI.expireTime && new Date(syncAPI.expireTime) < new Date()) {
        return asyncCallback(new E('EBizCondition.SyncAPIExpired', 'This Sync API is already expired'))
      }

      // 是否限流
      if (toolkit.isNothing(syncAPI.throttlingJSON)) return asyncCallback();

      // 限流处理
      async.eachOfSeries(syncAPI.throttlingJSON, function(limit, rule, eachCallback) {
        var ruleSep = parseInt(Date.now() / 1000 / THROTTLING_RULE_EXPIRES_MAP[rule]);
        var tags = [
          'syncAPIId', id,
          'rule'     , rule,
          'ruleSep'  , ruleSep,
        ];
        var cacheKey = toolkit.getCacheKey('throttling', 'syncAPI', tags);

        res.locals.cacheDB.incr(cacheKey, function(err, cacheRes) {
          if (err) return eachCallback(err);

          var currentCount = parseInt(cacheRes);
          if (currentCount > limit) {
            // 触发限流
            var waitSeconds = parseInt((ruleSep + 1) * THROTTLING_RULE_EXPIRES_MAP[rule] - Date.now() / 1000) + 1;
            return eachCallback(new E('EClientRateLimit.APIThrottling', 'Maximum calling rate exceeded', {
              rule        : rule,
              limit       : limit,
              currentCount: currentCount,
              waitSeconds : waitSeconds,
            }));

          } else {
            // 更新过期时间
            res.locals.cacheDB.expire(cacheKey, THROTTLING_RULE_EXPIRES_MAP[rule]);
          }

          return eachCallback();
        });

      }, asyncCallback);
    },
    // 创建函数调用选项
    function(asyncCallback) {
      var opt = {
        funcId         : syncAPI.funcId,
        funcCallKwargs : syncAPI.funcCallKwargsJSON,
        origin         : 'syncAPI',
        originId       : syncAPI.id,
        taskRecordLimit: syncAPI.taskRecordLimit,
      }
      createFuncRunnerTaskReqFromHTTPRequest(res.locals, req, opt, function(err, _taskReq) {
        if (err) return asyncCallback(err);

        taskReq = _taskReq;

        return asyncCallback();
      });
    },
  ], function(err) {
    if (err) return next(err);

    callFuncRunner(res.locals, taskReq, function(err, taskResp) {
      if (err) return next(err);
      return _doAPIResponse(res, taskReq, taskResp, next);
    });
  });
};

exports.callAsyncAPI = function(req, res, next) {
  var id = req.params.id;

  var taskReq  = null;
  var asyncAPI = null;
  async.series([
    // 检查异步 API 是否存在
    function(asyncCallback) {
      asyncAPI = ASYNC_API_LRU.get(id);

      if (asyncAPI === null) {
        // 已查询过不存在
        return asyncCallback(new E('EClientNotFound', 'No such Async API', { id: id }));

      } else if (asyncAPI) {
        // 已查询确定存在
        return asyncCallback();
      }

      var asyncAPIModel = asyncAPIMod.createModel(res.locals);

      asyncAPIModel._get(id, null, function(err, dbRes) {
        if (err) return asyncCallback(err);

        if (!dbRes) {
          // 查询不存在，缓存为`null`
          ASYNC_API_LRU.set(id, null);
          return asyncCallback(new E('EClientNotFound', 'No such Async API', { id: id }));
        }

        asyncAPI = dbRes;
        ASYNC_API_LRU.set(id, asyncAPI);

        return asyncCallback();
      });
    },
    // 检查认证
    function(asyncCallback) {
      if (!asyncAPI.apiAuthId) return asyncCallback();

      var realm = 'AsyncAPI:' + asyncAPI.id;
      _doAPIAuth(res.locals, req, res, asyncAPI.apiAuthId, realm, asyncCallback);
    },
    // 检查限制
    function(asyncCallback) {
      // 是否已禁用
      if (asyncAPI.isDisabled) {
        return asyncCallback(new E('EBizCondition.AsyncAPIDisabled', 'This Async API is disabled'))
      }

      return asyncCallback();
    },
    // 创建函数调用选项
    function(asyncCallback) {
      var opt = {
        funcId         : asyncAPI.funcId,
        funcCallKwargs : asyncAPI.funcCallKwargsJSON,
        origin         : 'asyncAPI',
        originId       : asyncAPI.id,
        taskRecordLimit: asyncAPI.taskRecordLimit,
      }
      createFuncRunnerTaskReqFromHTTPRequest(res.locals, req, opt, function(err, _taskReq) {
        if (err) return asyncCallback(err);

        taskReq = _taskReq;

        return asyncCallback();
      });
    },
  ], function(err) {
    if (err) return next(err);

    taskReq.ignoreResult = true;
    callFuncRunner(res.locals, taskReq, function(err, taskId) {
      if (err) return next(err);

      var ret = toolkit.initRet({ id: taskId });
      return res.locals.sendJSON(ret);
    });
  });
};

exports.runCronJobManually = function(req, res, next) {
  var id = req.params.id;

  async.series([
    // 检查定时任务是否存在
    function(asyncCallback) {
      var cronJobModel = cronJobMod.createModel(res.locals);

      cronJobModel._get(id, null, function(err, dbRes) {
        if (err) return asyncCallback(err);

        if (!dbRes) {
          // 查询不存在，缓存为`null`
          return asyncCallback(new E('EClientNotFound', 'No such Cron Job', { id: id }));
        }

        return asyncCallback();
      });
    },
  ], function(err) {
    if (err) return next(err);

    // 发送任务
    var taskReq = {
      name  : 'CronJob.ManualStarter',
      kwargs: { cronJobId: id },
    }
    res.locals.cacheDB.putTask(taskReq, function(err) {
      if (err) return next(err);
      return res.locals.sendJSON();
    });
  });
};

exports.getFuncList = function(req, res, next) {
  res.locals.extra.asFuncDoc = true;

  return funcAPICtrl.list(req, res, next);
};

exports.getFuncTagList = function(req, res, next) {
  var name       = req.query.name;
  var tagPattern = req.query.tagPattern;

  var funcModel = funcMod.createModel(res.locals);

  var opt = res.locals.getQueryOptions();
  opt.fileds = ['tagsJSON'];

  funcModel.list(opt, function(err, dbRes) {
    if (err) return next(err);

    var funcTags = [];
    dbRes.forEach(function(d) {
      funcTags = funcTags.concat(d.tagsJSON || []);
    });

    funcTags = toolkit.noDuplication(funcTags);
    funcTags.sort();

    // 过滤
    if (toolkit.notNothing(name)) {
      funcTags = funcTags.filter(function(x) {
        return x.indexOf(name) >= 0;
      });
    }

    if (toolkit.notNothing(tagPattern)) {
      funcTags = funcTags.filter(function(x) {
        return toolkit.matchWildcard(x, tagPattern);
      });
    }

    var ret = toolkit.initRet(funcTags);
    return res.locals.sendJSON(ret);
  });
};

exports.getFuncAPIList = function(req, res, next) {
  var apiType = req.query.apiType || 'ALL';

  var syncAPIModel  = syncAPIMod.createModel(res.locals);
  var asyncAPIModel = asyncAPIMod.createModel(res.locals);

  var apiList = [];

  async.series([
    // 同步 API
    function(asyncCallback) {
      if (apiType !== 'ALL' && apiType !== 'syncAPI') return asyncCallback();

      var opt = res.locals.getQueryOptions();
      opt.filters = opt.filters || {};
      opt.filters['sapi.showInDoc'] = {eq: true};

      syncAPIModel.list(opt, function(err, dbRes) {
        if (err) return asyncCallback(err);

        dbRes.forEach(function(d) {
          apiList.push({
            url: urlFor('mainAPI.callSyncAPIByGet', {
              params: { id: d.id },
            }),

            apiType           : 'syncAPI',
            id                : d.id,
            funcCallKwargsJSON: d.funcCallKwargsJSON,
            expireTime        : d.expireTime,
            throttlingJSON    : d.throttlingJSON,
            isDisabled        : d.isDisabled,

            configFuncId      : d.funcId,
            funcId            : d.func_id,
            funcName          : d.func_name,
            funcTitle         : d.func_title,
            funcDescription   : d.func_description,
            funcDefinition    : d.func_definition,
            funcArgsJSON      : d.func_argsJSON,
            funcKwargsJSON    : d.func_kwargsJSON,
            funcCategory      : d.func_category,
            funcIntegration   : d.func_integration,
            funcTagsJSON      : d.func_tagsJSON,

            apiAuthId   : d.apia_id,
            apiAuthTitle: d.apia_title,
            apiAuthType : d.apia_type,
          });
        });

        return asyncCallback();
      });
    },
    // 异步 API
    function(asyncCallback) {
      if (apiType !== 'ALL' && apiType !== 'asyncAPI') return asyncCallback();

      var opt = res.locals.getQueryOptions();
      opt.filters = opt.filters || {};
      opt.filters['aapi.showInDoc'] = {eq: true};

      asyncAPIModel.list(opt, function(err, dbRes) {
        if (err) return asyncCallback(err);

        dbRes.forEach(function(d) {
          apiList.push({
            url: urlFor('mainAPI.callAsyncAPIByGet', {
              params: { id: d.id },
            }),

            apiType           : 'asyncAPI',
            id                : d.id,
            funcCallKwargsJSON: d.funcCallKwargsJSON,
            expireTime        : null, // 异步 API 不存在此功能
            throttlingJSON    : null, // 异步 API 不存在此功能
            isDisabled        : d.isDisabled,

            configFuncId      : d.funcId,
            funcId            : d.func_id,
            funcName          : d.func_name,
            funcTitle         : d.func_title,
            funcDescription   : d.func_description,
            funcDefinition    : d.func_definition,
            funcArgsJSON      : d.func_argsJSON,
            funcKwargsJSON    : d.func_kwargsJSON,
            funcCategory      : d.func_category,
            funcIntegration   : d.func_integration,
            funcTagsJSON      : d.func_tagsJSON,

            apiAuthId   : d.apia_id,
            apiAuthTitle: d.apia_title,
            apiAuthType : d.apia_type,
          });
        });

        return asyncCallback();
      });
    },
  ], function(err) {
    if (err) return next(err);

    var ret = toolkit.initRet(apiList);
    return res.locals.sendJSON(ret);
  });
};

// 集成登录
exports.integratedSignIn = function(req, res, next) {
  if (CONFIG.DISABLE_INTEGRATED_SIGNIN) {
      return next(new E('EBizCondition', 'Integrated Sign-in is disabled'));
  }

  var funcId   = req.body.signIn.funcId;
  var username = req.body.signIn.username;
  var password = req.body.signIn.password;

  var taskReq    = null;
  var userId     = null;
  var xAuthToken = null;

  async.series([
    function(asyncCallback) {
      var opt = {
        funcId         : funcId,
        funcCallKwargs : { username: username, password: password },
        origin         : 'integration',
        originId       : 'signIn',
        taskRecordLimit: CONFIG._TASK_RECORD_FUNC_LIMIT_INTEGRATION,
      }
      createFuncRunnerTaskReq(res.locals, opt, function(err, _taskReq) {
        if (err) return asyncCallback(err);

        taskReq = _taskReq;

        return asyncCallback();
      });
    },
    function(asyncCallback) {
      callFuncRunner(res.locals, taskReq, function(err, taskResp) {
        if (err && !taskResp) return asyncCallback(err);

        switch(taskResp.status) {
          case 'noResponse':
            // 无响应
            return next(new E('EWorkerNoResponse', 'Worker no response, please check the status of this system'));

          case 'failure':
            // 失败
            return next(new E('EFuncFailed.SignInFuncRaisedException', taskResp.exception, {
              exception: taskResp.exception,
              traceback: taskResp.traceback,
            }));

          case 'timeout':
            // 超时
            return next(new E('EFuncFailed.SignInFuncTimeout', 'Sign-in function timeout', {
              exception: taskResp.exception,
              traceback: taskResp.traceback,
            }));
        }

        var returnValue = taskResp.result.returnValue;

        // 函数返回 False 或没有实际意义内容
        if (toolkit.isNothing(returnValue) || returnValue === false) {
          return next(new E('EFuncFailed.SignInFuncReturnedFalseOrNothing', 'Sign-in function returned False or nothing'));
        }

        // 登录成功
        var userDisplayName = username;
        var userEmail       = null;
        switch(typeof returnValue) {
          // 集成登录函数仅返回true时，用户名作为用户 ID
          case 'boolean':
            userId = username;
            break;

          // 集成登录函数仅返回字符串/数字时，此字符串作为用户 ID
          case 'string':
          case 'number':
            userId = '' + returnValue;
            break;

          // 集成函数返回对象时，尝试从中提取用户信息
          case 'object':
            function pickField(obj, possibleFields) {
              for (var k in obj) {
                k = ('' + k).toLowerCase();
                if (possibleFields.indexOf(k) >= 0) {
                  return obj[k];
                }
              }
            }
            userId = pickField(returnValue, [
              'id',
              'uid',
              'userid',
              'userId',
              'user_id',
            ]);
            userDisplayName = pickField(returnValue, [
              'name',
              'title',
              'fullname',
              'full_name',
              'displayName',
              'display_name',
              'realName',
              'real_name',
              'showName',
              'show_name',
              'nickName',
              'nick_name',
            ]);
            userEmail = pickField(returnValue, [
              'mail',
              'email',
              'useremail',
              'user_email',
            ]);
            break;
        }

        // 避免与内置系统用户 ID 冲突（igu: Integration Generated User)
        userId = toolkit.strf('igu_{0}-{1}', toolkit.getMD5(funcId), userId);

        var user = {
          id      : userId,
          username: username,
          name    : userDisplayName,
          email   : userEmail
        }
        // 发行登录令牌
        var xAuthTokenObj = auth.genXAuthTokenObj(user, funcId);
        xAuthToken = auth.signXAuthTokenObj(xAuthTokenObj);

        var cacheKey   = auth.getCacheKey();
        var cacheField = auth.getCacheField(xAuthTokenObj);
        var cacheData  = { ts: toolkit.getTimestamp() };
        res.locals.cacheDB.hset(cacheKey, cacheField, JSON.stringify(cacheData), asyncCallback);
      });
    }
  ], function(err) {
    if (err) return next(err);

    var ret = toolkit.initRet({
      userId    : userId,
      xAuthToken: xAuthToken,
    });
    return res.locals.sendJSON(ret);
  });
};

exports.integratedAuthMid = function(req, res, next) {
  if (res.locals.user && res.locals.user.isSignedIn) return next();

  var now = toolkit.getTimestamp();

  // Get x-auth-token
  var xAuthToken = null;

  var headerField = CONFIG._WEB_AUTH_HEADER;
  var queryField  = CONFIG._WEB_AUTH_QUERY;
  var cookieField = CONFIG._WEB_AUTH_COOKIE;

  if (cookieField
      && req.signedCookies[cookieField]
      && res.locals.requestType === 'page') {
    // Try to get x-auth-token from cookie
    xAuthToken = req.signedCookies[cookieField];

  } else if (headerField && req.get(headerField)) {
    // Try to get x-auth-token from HTTP header
    xAuthToken = req.get(headerField);

  } else if (queryField && req.query[queryField]) {
    // Try to get x-auth-token from query
    xAuthToken = req.query[queryField];
  }

  // Skip if no xAuthToken
  if (!xAuthToken) return next();

  if (CONFIG.MODE === 'dev') {
    res.locals.logger.debug('[MID] IN mainAPICtrl.integratedAuthMid');
  }

  res.locals.user = auth.createUserHandler();

  // Check x-auth-token
  var xAuthTokenObj = null;

  var cacheKey   = auth.getCacheKey();
  var cacheField = null;

  async.series([
    // Verify JWT
    function(asyncCallback) {
      auth.verifyXAuthToken(xAuthToken, function(err, obj) {
        if (err) {
          res.locals.reqAuthError = new E('EUserAuth', 'Invalid x-auth-token');
          return asyncCallback(res.locals.reqAuthError);
        }

        xAuthTokenObj = obj;

        /*** 非集成登录则跳过 ***/
        if (!xAuthTokenObj.isfid) return next();

        cacheField = auth.getCacheField(xAuthTokenObj);

        return asyncCallback();
      });
    },
    // Check Integrated Sign-in disabled
    function(asyncCallback) {
      if (CONFIG.DISABLE_INTEGRATED_SIGNIN) {
        res.locals.reqAuthError = new E('EUserDisabled', 'Integrated Sign-in is disabled');
      }

      // 认证错误后续抛出
      return asyncCallback();
    },
    // Check Redis
    function(asyncCallback) {
      res.locals.cacheDB.hgetExpires(cacheKey, cacheField, CONFIG._WEB_AUTH_EXPIRES, function(err, cacheRes) {
        if (err) return asyncCallback(err);

        if (!cacheRes) {
          res.locals.reqAuthError = new E('EUserAuth', 'x-auth-token is expired');
          return asyncCallback(res.locals.reqAuthError);
        }

        res.locals.xAuthToken    = xAuthToken;
        res.locals.xAuthTokenObj = xAuthTokenObj;

        return asyncCallback();
      });
    },
    // Refresh x-auth-token
    function(asyncCallback) {
      var cacheData = { ts: now };
      res.locals.cacheDB.hset(cacheKey, cacheField, JSON.stringify(cacheData), asyncCallback);
    },
  ], function(err) {
    if (err && res.locals.reqAuthError === err) {
      // Skip request error here, throw later.
      return next();
    }

    if (err) return next(err);

    res.locals.user.load({
      seq             : 0,
      id              : xAuthTokenObj.uid,
      username        : xAuthTokenObj.un,
      name            : xAuthTokenObj.nm,
      email           : xAuthTokenObj.em,
      roles           : ['user'].join(','),
      customPrivileges: ['systemSetting_r'].join(','),
      integratedSignInFuncId: xAuthTokenObj.isfid,
    });

    res.locals.logger.info('Auth by [Integrated Sign-in Func]: id=`{0}`; username=`{1}`, integratedSignInFuncId=`{2}`',
      res.locals.user.id,
      res.locals.user.username,
      res.locals.user.integratedSignInFuncId);

    // client detect
    res.locals.authType = 'builtin.byXAuthToken';
    res.locals.authId   = xAuthTokenObj.uid;

    delete req.query[queryField];

    return next();
  });
};

// 文件服务
exports.fileService = function(req, res, next) {
  var id = req.params.id;

  // 防止路径穿越
  if (req.params[0] && req.params[0].match(/\.\./g)) {
    return next(new E('EBizCondition.ParentDirectorySymbolNotAllowed', 'Parent directory symbol (..) is not allowed in path'));
  }

  var relPath = '/' + req.params[0];

  var fileServiceModel = fileServiceMod.createModel(res.locals);
  fileServiceModel.getWithCheck(id, null, function(err, dbRes) {
    if (err) return next(err);

    if (dbRes.isDisabled) {
        return next(new E('EBizCondition.FileServiceDisabled', 'This File Service is disabled'))
    }

    var rootPath = path.join(CONFIG.RESOURCE_ROOT_PATH, (dbRes.root || '.'));
    var absPath  = path.join(CONFIG.RESOURCE_ROOT_PATH, (dbRes.root || '.'), relPath);

    // 防止访问其他目录
    if (absPath.indexOf(rootPath) !== 0) {
      return next(new E('EBizCondition.AccessingOutOfScopePathNotAllowed', 'Accessing out-of-scope file system is not allowed'))
    }

    // 根据目标分别做不同处理
    fs.lstat(absPath, function(err, stats) {
      if (err) {
        // 内容不存在
        var pageData = {
          id     : id,
          relPath: relPath,
          error  : err.code === 'ENOENT' ? 'Not Found' : err.toString(),
        }
        return res.locals.render('file-service', pageData);
      }

      if (stats.isDirectory()) {
        // 访问目录：返回HTML页面，提示下层
        var opt = {
          withFileTypes: true,
        };
        return fs.readdir(absPath, opt, function(err, data) {
          if (err) return next(err);

          // 搜集下层文件信息
          var files = data.reduce(function(acc, x) {
            var f = {
              name      : x.name,
              type      : null,
              size      : null,
              createTime: null,
              updateTime: null,
            };

            var stat = fs.statSync(path.join(absPath, x.name));
            f.createTime = moment(stat.birthtimeMs).tz(CONFIG.TIMEZONE).format('YYYY-MM-DD HH:mm:ss Z');
            f.updateTime = moment(stat.ctimeMs).tz(CONFIG.TIMEZONE).format('YYYY-MM-DD HH:mm:ss Z');

            if (x.isDirectory()) {
              f.type = 'folder';
              f.name += '/';

            } else if (x.isFile()) {
              f.type = 'file';
              f.size = byteSize(stat.size);
            }

            if (!f.type) return acc;

            acc.push(f);
            return acc;
          }, []);

          // 上层目录
          if (relPath !== '/') {
            files.unshift({
              name: '../',
              type: 'folder',
            });
          }

          var pageData = {
            id     : id,
            files  : files,
            relPath: relPath,
          };
          return res.locals.render('file-service', pageData);
        });

      } else if (stats.isFile()) {
        // 访问文件：发送文件
        return res.sendFile(absPath);

      } else {
        // 访问其他：返回HTML页面，提示不支持
        var pageData = {
          id     : id,
          relPath: relPath,
          error  : 'Not Supported',
        }
        return res.locals.render('file-service', pageData);
      }
    });
  });
};

/* 允许其他模块调用 */
exports.getFuncById             = getFuncById;
exports.createFuncRunnerTaskReq = createFuncRunnerTaskReq;
exports.callFuncRunner          = callFuncRunner;
exports.callFuncDebugger        = callFuncDebugger;
