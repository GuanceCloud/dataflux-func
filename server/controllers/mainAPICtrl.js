'use strict';

/* Builtin Modules */
var fs           = require('fs-extra');
var path         = require('path');
var childProcess = require('child_process');

/* 3rd-party Modules */
var async         = require('async');
var request       = require('request');
var LRU           = require('lru-cache');
var yaml          = require('js-yaml');
var sortedJSON    = require('sorted-json');
var moment        = require('moment');
var byteSize      = require('byte-size');
var HTTPAuthUtils = require('http-auth-utils');
var promClient    = require('prom-client');

/* Project Modules */
var E       = require('../utils/serverError');
var CONFIG  = require('../utils/yamlResources').get('CONFIG');
var CONST   = require('../utils/yamlResources').get('CONST');
var ROUTE   = require('../utils/yamlResources').get('ROUTE');
var toolkit = require('../utils/toolkit');
var urlFor  = require('../utils/routeLoader').urlFor;
var auth    = require('../utils/auth');

var scriptSetMod              = require('../models/scriptSetMod');
var scriptMod                 = require('../models/scriptMod');
var funcMod                   = require('../models/funcMod');
var dataSourceMod             = require('../models/dataSourceMod');
var envVariableMod            = require('../models/envVariableMod');
var authLinkMod               = require('../models/authLinkMod');
var crontabConfigMod          = require('../models/crontabConfigMod');
var batchMod                  = require('../models/batchMod');
var datafluxFuncTaskResultMod = require('../models/datafluxFuncTaskResultMod');
var operationRecordMod        = require('../models/operationRecordMod');
var fileServiceMod            = require('../models/fileServiceMod');
var userMod                   = require('../models/userMod');
var apiAuthMod                = require('../models/apiAuthMod');

var celeryHelper = require('../utils/extraHelpers/celeryHelper');
var funcAPICtrl  = require('./funcAPICtrl');
var dataway      = require('./dataway');

var THROTTLING_RULE_EXPIRES_MAP = {
  bySecond: 1,
  byMinute: 60,
  byHour  : 60 * 60,
  byDay   : 60 * 60 * 24,
  byMonth : 60 * 60 * 24 * 30,
  byYear  : 60 * 60 * 24 * 365,
};

var FUNC_TASK_DEFAULT_QUEUE_MAP = {
  'sync'   : CONFIG._FUNC_TASK_DEFAULT_QUEUE,
  'async'  : CONFIG._FUNC_TASK_DEFAULT_ASYNC_QUEUE,
  'crontab': CONFIG._FUNC_TASK_DEFAULT_CRONTAB_QUEUE,
};

var FUNC_CACHE_OPT = {
  max   : CONFIG._LRU_FUNC_CACHE_MAX,
  maxAge: CONFIG._LRU_FUNC_CACHE_MAX_AGE * 1000,
};
var FUNC_LRU      = new LRU(FUNC_CACHE_OPT); // 仅LRU
var AUTH_LINK_LRU = new LRU(FUNC_CACHE_OPT); // 仅LRU
var BATCH_LRU     = new LRU(FUNC_CACHE_OPT); // 仅LRU
var API_AUTH_LRU  = new LRU(FUNC_CACHE_OPT); // 仅LRU

 // LRU + Redis
var FUNC_RESULT_LRU = new LRU({
  max   : CONFIG._LRU_FUNC_RESULT_CACHE_MAX,
  maxAge: CONFIG._LRU_FUNC_RESULT_CACHE_MAX_AGE * 1000,
});

var WORKER_SYSTEM_CONFIG = null;

// OpenMetric
var METRIC_MAP = {};

// 自动创建资源文件夹
fs.ensureDirSync(CONFIG.RESOURCE_ROOT_PATH);

/* Handlers */
function _getHTTPRequestInfo(req) {
  if (req.path === 'FAKE') {
    return toolkit.jsonCopy(req);
  }

  // 请求体
  var httpRequest = {
    method     : req.method.toUpperCase(),
    originalUrl: req.originalUrl,
    url        : path.join(req.baseUrl, req.path),
    headers    : req.headers,
    query      : req.query,
    // NOTE: 会产生两倍数据量，得不偿失，暂时废止
    // body       : req.body,
    hostname   : req.hostname,
    ip         : req.ip,
    ips        : req.ips,
    xhr        : req.xhr,
  };
  return httpRequest;
}

function _getTaskDefaultQueue(execMode) {
  return FUNC_TASK_DEFAULT_QUEUE_MAP[execMode] || CONFIG._FUNC_TASK_DEFAULT_QUEUE;
};

function _getFuncById(locals, funcId, callback) {
  if (!funcId) {
    // 未传递函数ID不执行
    return callback(new E('EClientNotFound', 'Func ID not specified'));
  }

  var func = FUNC_LRU.get(funcId);
  if (func) return callback(null, func);

  // 此处由于需要同时获取函数所在脚本的MD5值，需要使用`list`方法
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

function _createFuncCallOptionsFromOptions(func, funcCallKwargs, funcCallOptions, callback) {
  var fakeReq = {
    path  : 'FAKE',
    method: 'FAKE',
    params: { },
    body: {
      kwargs : funcCallKwargs,
      options: funcCallOptions,
    },
  }
  var fakeRes = {
    locals: {
      requestTime: new Date(),
    }
  }
  return _createFuncCallOptionsFromRequest(fakeReq, fakeRes, func, callback);
};

function _createFuncCallOptionsFromRequest(req, res, func, callback) {
  // 注意：
  //  本函数内所有搜集的时长类数据均为秒
  //  后续在_callFuncRunner 中转换为所需要类型（如：ISO8601格式等）

  func.extraConfigJSON = func.extraConfigJSON || {};

  var origin = 'direct';
  if (toolkit.startsWith(req.path, '/api/v1/al/')) {
    origin = 'authLink';
  } else if (toolkit.startsWith(req.path, '/api/v1/bat/')) {
    origin = 'batch';
  }

  /*** 搜集函数参数/执行选项 ***/
  var reqOpt = req.method.toLowerCase() === 'get' ? req.query : req.body;
  if ('string' === typeof reqOpt) {
    // 纯文本Body
    reqOpt = { text: reqOpt };
  } else if (Buffer.isBuffer(reqOpt)) {
    // Base64 Body
    reqOpt = { base64: toolkit.getBase64(reqOpt) }
  }

  var funcCallKwargs  = {};
  var funcCallOptions = {};

  var format = req.params.format || 'normal';
  switch(format) {
    case 'normal':
      // 普通形式：函数参数、执行选项为JSON字符串形式
      if (!toolkit.isNothing(reqOpt.kwargs)) {
        funcCallKwargs = reqOpt.kwargs;
      }
      if (!toolkit.isNothing(reqOpt.options)) {
        funcCallOptions = reqOpt.options;
      }

      if ('string' === typeof funcCallKwargs) {
        try {
          funcCallKwargs = JSON.parse(funcCallKwargs);
        } catch(err) {
          return callback(new E('EClientBadRequest', 'Invalid kwargs, bad JSON format', {
            error: err.toString(),
          }));
        }
      }

      if ('string' === typeof funcCallOptions) {
        try {
          funcCallOptions = JSON.parse(funcCallOptions);
        } catch(err) {
          return callback(new E('EClientBadRequest', 'Invalid options, bad JSON format', {
            error: err.toString(),
          }));
        }
      }
      break;

    case 'flattened':
      // 扁平形式：函数参数为「kwargs_参数名」，执行选项为「options_选项名」形式
      var _map = {
        kwargs : funcCallKwargs,
        options: funcCallOptions,
      };
      for (var k in reqOpt) if (reqOpt.hasOwnProperty(k)) {
        var keyParts = k.split('_');
        if (keyParts.length <= 1) continue;

        var type = keyParts[0];
        var name = keyParts.slice(1).join('_');
        _map[type][name] = reqOpt[k];
      }
      break;

    case 'simplified':
      // 简化形式：函数参数直接为参数名，不支持执行选项
      for (var k in reqOpt) if (reqOpt.hasOwnProperty(k)) {
        funcCallKwargs[k] = reqOpt[k];
      }
      break;
  }

  /*** 开始组装参数 ***/

  // 函数ID
  funcCallOptions.funcId = func.id;

  // 函数信息（用于函数结果缓存）
  funcCallOptions.scriptCodeMD5        = func.scpt_codeMD5;
  funcCallOptions.scriptPublishVersion = func.scpt_publishVersion;

  // 函数参数
  funcCallOptions.funcCallKwargs = funcCallKwargs;

  // 任务保留数量
  if (!toolkit.isNothing(func.extraConfigJSON.fixedTaskInfoLimit)) {
    funcCallOptions.taskInfoLimit = func.extraConfigJSON.fixedTaskInfoLimit;
  } else {
    funcCallOptions.taskInfoLimit = func.extraConfigJSON.taskInfoLimit;
  }

  // 文件上传参数
  if (req.files && req.files.length > 0) {
    funcCallOptions.funcCallKwargs.files = req.files.map(function(file) {
      return {
        filePath    : file.path,
        originalname: file.originalname,
        encoding    : file.encoding,
        mimetype    : file.mimetype,
        size        : file.size,
      }
    });
  }

  // 来源
  funcCallOptions.origin = origin;

  // 来源ID
  switch(origin) {
    case 'authLink':
    case 'batch':
      funcCallOptions.originId = req.params.id;
      break;
  }

  // API超时（优先级：调用时指定 > 函数配置 > 默认值）
  if (!toolkit.isNothing(funcCallOptions.apiTimeout)) {
    funcCallOptions.apiTimeout = parseInt(funcCallOptions.apiTimeout);

    if (funcCallOptions.apiTimeout < CONFIG._FUNC_TASK_MIN_API_TIMEOUT) {
      return callback(new E('EClientBadRequest', 'Invalid options, apiTimeout is too small', { min: CONFIG._FUNC_TASK_MIN_API_TIMEOUT }));
    }
    if (funcCallOptions.apiTimeout > CONFIG._FUNC_TASK_MAX_API_TIMEOUT) {
      return callback(new E('EClientBadRequest', 'Invalid options, apiTimeout is too large', { max: CONFIG._FUNC_TASK_MAX_API_TIMEOUT }));
    }

  } else if (!toolkit.isNothing(func.extraConfigJSON.apiTimeout)) {
    funcCallOptions.apiTimeout = func.extraConfigJSON.apiTimeout;

  } else {
    funcCallOptions.apiTimeout = CONFIG._FUNC_TASK_DEFAULT_API_TIMEOUT;
  }

  // 函数执行超时（优先级：调用时指定 > 函数配置 > 默认值）
  if (!toolkit.isNothing(funcCallOptions.timeout)) {
    funcCallOptions.timeout = parseInt(funcCallOptions.timeout);

    if (funcCallOptions.timeout < CONFIG._FUNC_TASK_MIN_TIMEOUT) {
      return callback(new E('EClientBadRequest', 'Invalid options, timeout is too small', { min: CONFIG._FUNC_TASK_MIN_TIMEOUT }));
    }
    if (funcCallOptions.timeout > CONFIG._FUNC_TASK_MAX_TIMEOUT) {
      return callback(new E('EClientBadRequest', 'Invalid options, timeout is too large', { max: CONFIG._FUNC_TASK_MAX_TIMEOUT }));
    }

  } else if (!toolkit.isNothing(func.extraConfigJSON.timeout)) {
    funcCallOptions.timeout = func.extraConfigJSON.timeout;

  } else {
    switch(origin) {
      case 'batch':
        funcCallOptions.timeout = CONFIG._FUNC_TASK_DEFAULT_BATCH_TIMEOUT;
        break;

      default:
        funcCallOptions.timeout = CONFIG._FUNC_TASK_DEFAULT_TIMEOUT;
        break;
    }
  }

  // 执行模式（优先级：调用时指定 > 默认值）
  if (!toolkit.isNothing(funcCallOptions.execMode)) {
    switch(origin) {
      case 'authLink':
        if (funcCallOptions.execMode !== 'sync') {
          return callback(new E('EClientBadRequest', 'Invalid options, execMode should be "sync" in Auth Link calling'));
        }
        break;

      case 'crontab':
      case 'batch':
        if (funcCallOptions.execMode !== 'async') {
          return callback(new E('EClientBadRequest', 'Invalid options, execMode should be "async" in Crontab or Batch calling'));
        }
        break;

      default:
        var _EXEC_MODES = ['sync', 'async'];
        if (_EXEC_MODES.indexOf(funcCallOptions.execMode) < 0) {
          return callback(new E('EClientBadRequest', 'Invalid options, invalid execMode', { allowed: _EXEC_MODES }));
        }
        break;
    }

  } else {
    switch(origin) {
      case 'direct':
      case 'authLink':
        funcCallOptions.execMode = 'sync';
        break;

      default:
        funcCallOptions.execMode = 'async';
        break;
    }
  }

  // 同步调用时，函数执行超时不得大于API超时
  //    超出时，函数执行超时自动跟随API超时
  if (funcCallOptions.execMode === 'sync') {
    if (funcCallOptions.timeout > funcCallOptions.apiTimeout) {
      funcCallOptions.timeout = funcCallOptions.apiTimeout;
    }
  }

  // 【固定】函数任务过期
  switch(origin) {
    case 'batch':
      funcCallOptions.timeoutToExpireScale = CONFIG._FUNC_TASK_DEFAULT_BATCH_TIMEOUT_TO_EXPIRE_SCALE;
      break;

    default:
      funcCallOptions.timeoutToExpireScale = CONFIG._FUNC_TASK_TIMEOUT_TO_EXPIRE_SCALE;
      break;
  }

  // 是否永不过期
  if (!toolkit.isNothing(funcCallOptions.neverExpire)) {
    funcCallOptions.neverExpire = !!funcCallOptions.neverExpire;
  } else {
    funcCallOptions.neverExpire = false;
  }

  // 返回类型（优先级：调用时指定 > 默认值）
  if (!toolkit.isNothing(funcCallOptions.returnType)) {
    var _RETURN_TYPES = ['ALL', 'raw', 'repr', 'jsonDumps'];
    if (_RETURN_TYPES.indexOf(funcCallOptions.returnType) < 0) {
      return callback(new E('EClientBadRequest', 'Invalid options, invalid returnType', { allowed: _RETURN_TYPES }));
    }

  } else {
    funcCallOptions.returnType = 'raw';
  }

  // 结果保存（优先级：调用时指定 > 默认值）
  if (!toolkit.isNothing(funcCallOptions.saveResult)) {
    funcCallOptions.saveResult = !!funcCallOptions.saveResult;
  } else {
    funcCallOptions.saveResult = false;
  }

  // 结果拆包（优先级：调用时指定 > 默认值）
  if (!toolkit.isNothing(funcCallOptions.unfold)) {
    funcCallOptions.unfold = !!funcCallOptions.unfold;

  } else {
    // 只有直接调用且为普通形式时不拆包
    // 其他默认都拆包
    if (origin === 'direct' && format === 'normal') {
      funcCallOptions.unfold = false;
    } else {
      funcCallOptions.unfold = true;
    }
  }

  // 预约执行
  if (!toolkit.isNothing(funcCallOptions.eta)) {
    if ('Invalid Date' === new Date('funcCallOptions.eta').toString()) {
      return callback(new E('EClientBadRequest', 'Invalid options, eta should be a valid datetime value'));
    }
  }

  // 执行队列（优先级：函数配置 > 默认值）
  if (!toolkit.isNothing(func.extraConfigJSON.queue)) {
    var queueNumber = parseInt(func.extraConfigJSON.queue);
    if (queueNumber < 1 || queueNumber > 9) {
      return callback(new E('EClientBadRequest', 'Invalid options, queue should be an integer between 1 and 9'));
    }

    funcCallOptions.queue = '' + func.extraConfigJSON.queue;

  } else {
    funcCallOptions.queue = _getTaskDefaultQueue(funcCallOptions.execMode);
  }

  // 触发时间
  funcCallOptions.triggerTimeMs = res.locals.requestTime.getTime();
  funcCallOptions.triggerTime   = parseInt(funcCallOptions.triggerTimeMs / 1000);

  // 结果缓存
  if (!toolkit.isNothing(func.extraConfigJSON.cacheResult)) {
    if (!func.extraConfigJSON.cacheResult) {
      funcCallOptions.cacheResult = false;
    } else {
      funcCallOptions.cacheResult = parseInt(func.extraConfigJSON.cacheResult);
    }
  }

  // HTTP请求信息
  funcCallOptions.httpRequest = _getHTTPRequestInfo(req);

  return callback(null, funcCallOptions);
};

function _createFuncCallOptionsForAPIAuth(req, res, func, apiAuth, callback) {
  // 注意：
  //  本函数内所有搜集的时长类数据均为秒
  //  后续在_callFuncRunner 中转换为所需要类型（如：ISO8601格式等）

  func.extraConfigJSON = func.extraConfigJSON || {};

  /*** 搜集函数参数/执行选项 ***/
  var funcCallKwargs  = {};
  var funcCallOptions = {
    origin  : 'apiAuth',
    originId: apiAuth.id,
  };

  /*** 开始组装参数 ***/

  // 函数ID
  funcCallOptions.funcId = func.id;

  // 函数信息（用于函数结果缓存）
  funcCallOptions.scriptCodeMD5        = func.scpt_codeMD5;
  funcCallOptions.scriptPublishVersion = func.scpt_publishVersion;

  // 函数参数
  funcCallOptions.funcCallKwargs = funcCallKwargs;

  // API超时（优先级：函数配置 > 默认值）
  if (!toolkit.isNothing(func.extraConfigJSON.apiTimeout)) {
    funcCallOptions.apiTimeout = func.extraConfigJSON.apiTimeout;

  } else {
    funcCallOptions.apiTimeout = CONFIG._FUNC_TASK_DEFAULT_API_TIMEOUT;
  }

  // 函数执行超时（优先级：函数配置 > 默认值）
  if (!toolkit.isNothing(func.extraConfigJSON.timeout)) {
    funcCallOptions.timeout = func.extraConfigJSON.timeout;
  } else {
    funcCallOptions.timeout = CONFIG._FUNC_TASK_DEFAULT_TIMEOUT;
  }

  // 执行模式
  funcCallOptions.execMode = 'sync';

  // 函数执行超时不得大于API超时
  //    超出时，函数执行超时自动跟随API超时
  if (funcCallOptions.timeout > funcCallOptions.apiTimeout) {
    funcCallOptions.timeout = funcCallOptions.apiTimeout;
  }

  // 【固定】函数任务过期
  funcCallOptions.timeoutToExpireScale = CONFIG._FUNC_TASK_TIMEOUT_TO_EXPIRE_SCALE;

  // 是否永不过期
  funcCallOptions.neverExpire = false;

  // 返回类型（此参数不在Python中处理，此处设置没有意义）
  // funcCallOptions.returnType = 'raw';

  // 结果保存
  funcCallOptions.saveResult = false;

  // 结果拆包（此参数不在Python中处理，此处设置没有意义）
  // funcCallOptions.unfold = true;

  // 执行队列（优先级：函数配置 > 默认值）
  if (!toolkit.isNothing(func.extraConfigJSON.queue)) {
    var queueNumber = parseInt(func.extraConfigJSON.queue);
    if (queueNumber < 1 || queueNumber > 9) {
      return callback(new E('EClientBadRequest', 'Invalid options, queue should be an integer between 1 and 9'));
    }

    funcCallOptions.queue = '' + func.extraConfigJSON.queue;

  } else {
    funcCallOptions.queue = _getTaskDefaultQueue(funcCallOptions.execMode);
  }

  // 触发时间
  funcCallOptions.triggerTimeMs = res.locals.requestTime.getTime();
  funcCallOptions.triggerTime   = parseInt(funcCallOptions.triggerTimeMs / 1000);

  // 结果缓存
  if (!toolkit.isNothing(func.extraConfigJSON.cacheResult)) {
    if (!func.extraConfigJSON.cacheResult) {
      funcCallOptions.cacheResult = false;
    } else {
      funcCallOptions.cacheResult = parseInt(func.extraConfigJSON.cacheResult);
    }
  }

  // HTTP请求信息
  funcCallOptions.httpRequest = funcCallOptions.funcCallKwargs.req = _getHTTPRequestInfo(req);

  return callback(null, funcCallOptions);
};

function _mergeFuncCallKwargs(baseFuncCallKwargs, inputedFuncCallKwargs, format) {
  // 合并请求参数
  var mergedFuncCallKwargs = toolkit.jsonCopy(inputedFuncCallKwargs);

  for (var k in baseFuncCallKwargs) if (baseFuncCallKwargs.hasOwnProperty(k)) {
    var v = baseFuncCallKwargs[k];

    // 参数占位符，不作处理
    if (_isFuncArgumentPlaceholder(v)) continue;

    // 已经指定了固定参数值的，不允许额外传递
    if (k in mergedFuncCallKwargs) {
      throw new E('EClientBadRequest', 'Found unexpected function kwargs field', {
        kwargsField: k,
        kwargsValue: mergedFuncCallKwargs[k],
      });
    }

    // 填入固定参数
    mergedFuncCallKwargs[k] = v;
  }

  return mergedFuncCallKwargs;
};

function _getFuncCallResultFromCache(locals, funcCallOptions, callback) {
  var funcId = funcCallOptions.funcId;

  // 1. 从本地缓存中获取
  var lruKey = toolkit.strf('{0}@{1}', funcId, funcCallOptions.funcCallKwargsMD5);
  var lruRes = FUNC_RESULT_LRU.get(lruKey);
  if (lruRes) {
    return callback(null, lruRes);
  }

  // 2. 从Redis中获取
  var cacheKey = toolkit.getWorkerCacheKey('cache', 'funcResult', [
      'funcId'              , funcId,
      'scriptCodeMD5'       , funcCallOptions.scriptCodeMD5,
      'scriptPublishVersion', funcCallOptions.scriptPublishVersion,
      'funcCallKwargsMD5'   , funcCallOptions.funcCallKwargsMD5]);
  locals.cacheDB.get(cacheKey, function(err, cacheRes) {
    if (err) return callback(err);

    if (cacheRes) {
      cacheRes = JSON.parse(cacheRes);
    }

    FUNC_RESULT_LRU.set(lruKey, cacheRes);
    return callback(err, cacheRes);
  });
};

function _checkWorkerQueuePressure(locals, funcCallOptions, callback) {
  // 检查工作队列压力
  var funcPressure           = funcCallOptions.funcPressure;
  var workerCount            = 1;
  var workerQueuePressure    = 0;
  var workerQueueMaxPressure = CONFIG._WORKER_LIMIT_WORKER_QUEUE_PRESSURE_BASE;

  var workerQueuePressureCacheKey = toolkit.getCacheKey('cache', 'workerQueuePressure', [
        'workerQueue', funcCallOptions.queue]);

  var denyPercent = 0;
  async.series([
    // 查询所在队列工作单元数量
    function(asyncCallback) {
      var cacheKey = toolkit.getWorkerCacheKey('heartbeat', 'workerOnQueueCount', [
            'workerQueue', funcCallOptions.queue]);
      locals.cacheDB.get(cacheKey, function(err, cacheRes) {
        if (err) return asyncCallback(err);

        if (cacheRes) {
          workerCount = parseInt(cacheRes) || 1;
          workerQueueMaxPressure = workerCount * CONFIG._WORKER_LIMIT_WORKER_QUEUE_PRESSURE_BASE;
        }

        return asyncCallback();
      });
    },
    // 查询队列压力
    function(asyncCallback) {
      locals.cacheDB.get(workerQueuePressureCacheKey, function(err, cacheRes) {
        if (err) return asyncCallback(err);

        if (cacheRes) {
          workerQueuePressure = parseInt(cacheRes);
        }

        // 计算过压（预计总压力 - 最大可承受压力）
        var workerQueueOverPressure = workerQueuePressure + funcPressure - workerQueueMaxPressure;
        if (workerQueueOverPressure < 0) {
          workerQueueOverPressure = 0;
        }

        // 计算任务丢弃率（过压 / 最大可承受压力 * 100%）
        denyPercent = workerQueueOverPressure / workerQueueMaxPressure;
        if (!CONFIG._DISABLE_WORKER_LIMIT_PRESSURE && Math.random() < denyPercent) {
          return asyncCallback(new E('EClientRateLimit.WorkerQueueLength', 'Too many tasks in worker queue', {
            funcPressure          : funcPressure,
            workerQueue           : funcCallOptions.queue,
            workerQueuePressure   : workerQueuePressure,
            workerQueueMaxPressure: workerQueueMaxPressure,
          }));
        }
        return asyncCallback();
      });
    },
    // 记录队列压力
    function(asyncCallback) {
      locals.cacheDB.incrby(workerQueuePressureCacheKey, funcPressure, function(err, cacheRes) {
        if (err) return asyncCallback(err);

        var currentWorkerQueuePressure = parseInt(cacheRes);
        locals.logger.debug('<<< QUEUE PRESSURE >>> WorkerQueue#{0}: {1} (+{2}, {3}%), Deny: {4}%',
            funcCallOptions.queue, currentWorkerQueuePressure, funcPressure,
            parseInt(currentWorkerQueuePressure / workerQueueMaxPressure * 100),
            parseInt(denyPercent * 100));

        return asyncCallback();
      });
    },
  ], callback);
};

function _callFuncRunner(locals, funcCallOptions, callback) {
  funcCallOptions = funcCallOptions || {};

  // 填入保护值
  var defaultFuncCallOptions = {
    origin  : 'UNKONW',       // 来源
    originId: locals.traceId, // 来源ID
  }
  for (var key in defaultFuncCallOptions) {
    if (toolkit.isNullOrUndefined(funcCallOptions[key])) {
      funcCallOptions[key] = defaultFuncCallOptions[key];
    }
  }

  // 函数执行任务Callback
  var onTaskCallback   = null;
  var onResultCallback = null;

  // 发送任务
  var sendTask = function(err) {
    if (err) return callback(err);

    // 处理队列别名
    if (toolkit.isNullOrUndefined(funcCallOptions.queue)) {
      funcCallOptions.queue = _getTaskDefaultQueue(funcCallOptions.execMode);

    } else {
      var queueNumber = parseInt(funcCallOptions.queue);
      if (!isNaN(queueNumber) && queueNumber >= 0 && queueNumber < CONFIG._WORKER_QUEUE_COUNT) {
        // 直接指定队列编号

      } else {
        // 指定队列别名
        var queueNumber = parseInt(CONFIG.WORKER_QUEUE_ALIAS_MAP[funcCallOptions.queue]);
        if (isNaN(queueNumber) || queueNumber < 0 || queueNumber >= CONFIG._WORKER_QUEUE_COUNT) {
          // 配置错误，无法解析为队列编号，或队列编号超过范围，使用默认函数队列。
          // 保证无论如何都有Worker负责执行（实际运行会报错）
          funcCallOptions.queue = _getTaskDefaultQueue(funcCallOptions.execMode);

        } else {
          // 队列别名转换为队列编号
          funcCallOptions.queue = queueNumber;
        }
      }
    }

    var celery = celeryHelper.createHelper(locals.logger);

    // 任务名
    var name = 'Main.FuncRunner';

    // 生成Celery任务的kwargs, options
    var taskOptions = {
      id               : toolkit.genDataId('task'),
      queue            : funcCallOptions.queue,
      resultWaitTimeout: funcCallOptions.apiTimeout * 1000,
      softTimeLimit    : funcCallOptions.timeout,
      timeLimit        : funcCallOptions.timeout + CONFIG._FUNC_TASK_EXTRA_TIMEOUT_TO_KILL,
    };

    // 格式转换以匹配Celery框架
    if (funcCallOptions.eta) {
      // eta参数为ISO8601格式
      taskOptions.eta = toolkit.getISO8601(funcCallOptions.eta);
    }
    if (!funcCallOptions.neverExpire) {
      // expires参数为ISO8601格式
      var _shiftMS = parseInt(funcCallOptions.timeout * funcCallOptions.timeoutToExpireScale) * 1000;
      taskOptions.expires = toolkit.getISO8601(Date.now() + _shiftMS);
    }

    // 任务参数
    var taskKwargs = {
      funcId           : funcCallOptions.funcId,
      funcCallKwargs   : funcCallOptions.funcCallKwargs,
      funcCallKwargsMD5: funcCallOptions.funcCallKwargsMD5,
      funcPressure     : funcCallOptions.funcPressure,
      origin           : funcCallOptions.origin,
      originId         : funcCallOptions.originId,
      execMode         : funcCallOptions.execMode,
      saveResult       : funcCallOptions.saveResult,
      triggerTime      : funcCallOptions.triggerTime,
      triggerTimeMs    : funcCallOptions.triggerTimeMs,
      queue            : funcCallOptions.queue,
      taskInfoLimit    : funcCallOptions.taskInfoLimit,
      httpRequest      : funcCallOptions.httpRequest,
    };
    celery.putTask(name, null, taskKwargs, taskOptions, onTaskCallback, onResultCallback);
  }

  if (funcCallOptions.execMode === 'sync') {
    // 计算函数参数MD5，获取预期函数压力值
    var funcCallKwargsDump = sortedJSON.sortify(funcCallOptions.funcCallKwargs, {
          stringify: true,
          sortArray: false});
    funcCallOptions.funcCallKwargsMD5 = toolkit.getMD5(funcCallKwargsDump);
    funcCallOptions.funcPressure      = CONFIG._WORKER_LIMIT_FUNC_PRESSURE_BASE // 后续从Redis中获取实际预期压力值

    // 同步函数回调函数
    onResultCallback = function(celeryErr, celeryRes, extraInfo) {
      /* 此处有celeryErr也不能立刻callback，需要经过统计处理后再将错误抛出 */

      var isCached        = false;
      var ret             = null;
      var responseControl = null;

      async.series([
        // 结果处理
        function(asyncCallback) {
          if (celeryErr) return asyncCallback(celeryErr);

          celeryRes = celeryRes || {};
          extraInfo = extraInfo || {};

          // 无法通过JSON.parse解析
          if ('string' === typeof celeryRes) {
            return asyncCallback(new E('EFuncResultParsingFailed', 'Func result is not standard JSON', {
              etype: celeryRes.result && celeryRes.result.exc_type,
            }));
          }

          if (celeryRes.status === 'FAILURE') {
            // 正式调用发生错误只返回堆栈错误信息最后一行
            var einfoTEXT = celeryRes.einfoTEXT.trim().split('\n').pop().trim();

            if (celeryRes.einfoTEXT.indexOf('billiard.exceptions.SoftTimeLimitExceeded') >= 0) {
              // 超时错误
              return asyncCallback(new E('EFuncTimeout', 'Calling Function timeout', {
                id       : celeryRes.id,
                etype    : celeryRes.result && celeryRes.result.exc_type,
                einfoTEXT: einfoTEXT,
              }));

            } else {
              // 其他错误
              return asyncCallback(new E('EFuncFailed', 'Calling Function failed', {
                id       : celeryRes.id,
                etype    : celeryRes.result && celeryRes.result.exc_type,
                einfoTEXT: einfoTEXT,
              }));
            }

          } else if (extraInfo.status === 'TIMEOUT') {
            // API等待超时
            return asyncCallback(new E('EAPITimeout', 'Waiting Func result timeout, but task is still running. Use task ID to fetch result later', {
              id   : extraInfo.id,
              etype: celeryRes.result && celeryRes.result.exc_type,
            }));
          }

          // 缓存结果标记
          isCached = celeryRes.id === 'CACHED';

          // 提取响应控制
          responseControl = celeryRes.retval._responseControl;

          // 准备API返回值
          ret = toolkit.initRet({ result: celeryRes.retval });
          if (funcCallOptions.saveResult) {
            ret.taskId    = celeryRes.id;
            ret.resultURL = urlFor('mainAPI.getFuncResult', {query: {taskId: celeryRes.id}});
          }

          return asyncCallback();
        },
      ], function(err) {
        /* 1. 统计记录 */
        var costMs = Date.now() - funcCallOptions.triggerTimeMs;

        // 授权链接相关
        if (funcCallOptions.origin === 'authLink') {
          // 记录最近几天调用次数
          var dateStr = toolkit.getDateString();
          var cacheKey = toolkit.getWorkerCacheKey('cache', 'recentAuthLinkCallCount', [
              'authLinkId', funcCallOptions.originId, 'date', dateStr]);
          async.series([
            // 计数
            function(asyncCallback) {
              locals.cacheDB.incr(cacheKey, asyncCallback);
            },
            // 设置自动过期
            function(asyncCallback) {
              var expires = CONFIG._RECENT_FUNC_RUNNING_COUNT_EXPIRES;
              locals.cacheDB.expire(cacheKey, expires, asyncCallback);
            },
          ]);

          // 记录最近几次调用状态
          var cacheKey = toolkit.getWorkerCacheKey('cache', 'recentAuthLinkCallStatus', [
              'authLinkId', funcCallOptions.originId]);
          async.series([
            // 最近耗时推入队列
            function(asyncCallback) {
              var status = 'OK';
              if (err) {
                if (err.info && err.info.reason) {
                  status = err.info.reason;
                } else {
                  status = 'UnknowError';
                }
              } else if (celeryRes.id === 'CACHED') {
                status = 'cached';
              }

              var runningStatus = JSON.stringify({
                costMs: costMs,
                status: status,
              });
              locals.cacheDB.lpush(cacheKey, runningStatus, asyncCallback);
            },
            function(asyncCallback) {
              var limit = CONFIG._RECENT_FUNC_RUNNING_STATUS_LIMIT;
              locals.cacheDB.ltrim(cacheKey, 0, limit, asyncCallback);
            },
            // 设置自动过期
            function(asyncCallback) {
              var expires = CONFIG._RECENT_FUNC_RUNNING_STATUS_EXPIRES;
              locals.cacheDB.expire(cacheKey, expires, asyncCallback);
            },
          ], function(err) {
            if (err) locals.logger.logError(err);
          });
        }

        // 同步执行相关
        if (funcCallOptions.execMode === 'sync' && !isCached) {
          var prevFuncPressure = funcCallOptions.funcPressure || CONFIG._WORKER_LIMIT_FUNC_PRESSURE_BASE;
          var nextFuncPressure = parseInt((prevFuncPressure + costMs) >> 1);

          async.series([
            // 计算/记录函数压力值
            function(asyncCallback) {
              var cacheKey = toolkit.getCacheKey('cache', 'funcPressure', [
                    'funcId'           , funcCallOptions.funcId,
                    'funcCallKwargsMD5', funcCallOptions.funcCallKwargsMD5])
              locals.cacheDB.setex(cacheKey, CONFIG._WORKER_LIMIT_FUNC_PRESSURE_EXPIRES, nextFuncPressure, asyncCallback);
            },
            // 减少队列压力
            function(asyncCallback) {
              var cacheKey = toolkit.getCacheKey('cache', 'workerQueuePressure', [
                    'workerQueue', funcCallOptions.queue]);
              locals.cacheDB.incrby(cacheKey, prevFuncPressure * -1, function(err) {
                if (err) return asyncCallback(err);

                locals.cacheDB.expire(cacheKey, CONFIG._WORKER_LIMIT_WORKER_QUEUE_PRESSURE_EXPIRES, asyncCallback);
              })
            },
          ], function(err) {
            if (err) locals.logger.logError(err);
          });
        }

        /* 2. 最终回调 */
        return callback(err, ret, isCached, responseControl);
      });
    };

    async.series([
      // 获取函数预期压力值
      function(asyncCallback) {
        var funcPressure = CONFIG._WORKER_LIMIT_FUNC_PRESSURE_BASE;

        var cacheKey = toolkit.getCacheKey('cache', 'funcPressure', [
              'funcId'           , funcCallOptions.funcId,
              'funcCallKwargsMD5', funcCallOptions.funcCallKwargsMD5])

        locals.cacheDB.get(cacheKey, function(err, cacheRes) {
          if (err) return asyncCallback(err);

          if (cacheRes) {
            funcPressure = parseInt(cacheRes);
          }

          // 补齐实际预期压力值
          funcCallOptions.funcPressure = funcPressure;

          return asyncCallback();
        });
      },
      // 尝试从缓存中获取结果
      function(asyncCallback) {
        // 未指定缓存结果时跳过
        if (!funcCallOptions.cacheResult) return asyncCallback();

        _getFuncCallResultFromCache(locals, funcCallOptions, function(err, cachedRetval) {
          if (err) {
            // 报错后改为真实调用函数
            locals.logger.logError(err);
            return asyncCallback();
          }

          if (!cachedRetval) {
            // 无缓存时改为真实调用函数
            return asyncCallback();
          }

          var dummyCeleryRes = {
            id       : 'CACHED',
            status   : 'SUCCESS',
            retval   : cachedRetval,
            einfoTEXT: null,
          };
          return onResultCallback(null, dummyCeleryRes, null);

          /* 进入缓存时，到此结束，直接回调结果函数，不再继续执行 */
        });
      },
      // 真实调用函数前，检查队列压力
      function(asyncCallback) {
        _checkWorkerQueuePressure(locals, funcCallOptions, asyncCallback);
      },
    ], sendTask);

  } else {
    // 非同步任务不计算MD5值/函数压力值
    funcCallOptions.funcCallKwargsMD5 = 'NON_SYNC';
    funcCallOptions.funcPressure      = 0;

    // 非同步函数回调函数
    onTaskCallback = function(err, taskId) {
      if (err) return callback(err);

      var ret = null;

      if (funcCallOptions.saveResult) {
        ret = toolkit.initRet({
          taskId   : taskId,
          resultURL: urlFor('mainAPI.getFuncResult', {query: {taskId: taskId}}),
        });

      } else {
        ret = toolkit.initRet();
      }

      /* 最终回调 */
      return callback(err, ret);
    };

    return sendTask();
  }
};

function _doAPIResponse(locals, res, ret, options, callback) {
  options = options || {};

  var funcCallOptions = options.funcCallOptions || {};
  var responseControl = options.responseControl || {};

  // 缓存标记
  if (options.isCached) {
    res.set('X-Dataflux-Func-Cache', 'Cached');
  }

  // 响应控制（304缓存）
  if (!responseControl.allow304) {
    res.set('Last-Modified', (new Date()).toUTCString());
  }

  // 响应控制（状态码）
  if (responseControl.statusCode) {
    res.status(responseControl.statusCode);
  }

  // 响应控制（响应头）
  if (responseControl.headers) {
    res.set(responseControl.headers);
  }

  if (responseControl.filePath) {
    // 响应控制（下载文件）
    var filePath = path.join(CONFIG.RESOURCE_ROOT_PATH, responseControl.filePath.replace(/^\/+/, ''));

    fs.readFile(filePath, function(err, buffer) {
      if (err) return callback(err);

      // 默认与源文件名相同
      var fileName = filePath.split('/').pop();
      if ('string' === typeof responseControl.downloadFile) {
        // 指定下载名
        fileName = responseControl.downloadFile;
      }

      if (responseControl.downloadFile === false) {
        // 非下载模式
        locals.sendRaw(buffer, fileName);
      } else {
        // 下载模式
        locals.sendFile(buffer, fileName);
      }

      if (responseControl.autoDeleteFile) {
        fs.remove(filePath);
      }

      return;
    });

  } else {
    // 响应控制（返回数据）

    if (responseControl.downloadFile) {
      // 作为文件下载
      var file     = ret.data.result.raw;
      var fileName = responseControl.downloadFile;
      if ('string' !== typeof fileName) {
        fileName = typeof file === 'object'
                 ? 'api-resp.json'
                 : 'api-resp.txt'
      }
      return locals.sendFile(file, fileName);

    } else {
      // 作为数据返回
      if (funcCallOptions.execMode === 'async') {
        // 异步调用，直接返回
        return locals.sendJSON(ret);

      } else {
        // 同步调用，处理后返回

        // 响应控制（返回类型Content-Type）
        if (responseControl.contentType) {
          res.type(responseControl.contentType);

          // 当指定了响应体类型后，必须提取raw且解包
          funcCallOptions.returnType = 'raw';
          funcCallOptions.unfold     = true;
        }

        // 选择返回类型
        if (funcCallOptions.returnType && funcCallOptions.returnType !== 'ALL') {
          ret.data.result = ret.data.result[funcCallOptions.returnType] || null;
        }

        // 解包
        if (funcCallOptions.unfold) {
          // 需要解包时，发送数据类型不确定
          return locals.sendRaw(ret.data.result);

        } else {
          // 不解包时，必然是JSON
          return locals.sendJSON(ret);
        }
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
  var func = null;
  var funcCallOptions = null;
  async.series([
    // 获取函数
    function(asyncCallback) {
      _getFuncById(res.locals, apiAuth.configJSON.funcId, function(err, _func) {
        if (err) return asyncCallback(err);

        func = _func;

        return asyncCallback();
      });
    },
    // 创建函数调用选项
    function(asyncCallback) {
      _createFuncCallOptionsForAPIAuth(req, res, func, apiAuth, function(err, _funcCallOptions) {
        if (err) return asyncCallback(err);

        funcCallOptions = _funcCallOptions;

        return asyncCallback();
      });
    },
  ], function(err) {
    if (err) return callback(err);

    _callFuncRunner(res.locals, funcCallOptions, function(err, ret, isCached, responseControl) {
      if (err) return callback(err);

      var isValidAuth = false;
      try { isValidAuth = !!ret.data.result.raw; } catch(_) {};

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
              var password = toolkit.decipherByAES(matchedUser.passwordCipher, CONFIG.SECRET);
              if (!__checkHTTPAuth(authType, req, authInfo, password)) {
                return __askHTTPAuth(authType, res, realm, asyncCallback);
              }
            }

            return asyncCallback();
          });
          break;

        case 'func':
          var funcId = apiAuth.configJSON.funcId;
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

exports.overview = function(req, res, next) {
  var sections = toolkit.asArray(req.query.sections);
  var sectionMap = null;
  if (!toolkit.isNothing(sections)) {
    sectionMap = {};
    sections.forEach(function(s) {
      sectionMap[s] = true;
    })
  }

  var scriptSetModel     = scriptSetMod.createModel(res.locals);
  var scriptModel        = scriptMod.createModel(res.locals);
  var funcModel          = funcMod.createModel(res.locals);
  var dataSourceModel    = dataSourceMod.createModel(res.locals);
  var envVariableModel   = envVariableMod.createModel(res.locals);
  var authLinkModel      = authLinkMod.createModel(res.locals);
  var crontabConfigModel = crontabConfigMod.createModel(res.locals);
  var batchModel         = batchMod.createModel(res.locals);
  var fileServiceModel   = fileServiceMod.createModel(res.locals);
  var userModel          = userMod.createModel(res.locals);

  var overviewParts = [
    { name : 'scriptSet',     model: scriptSetModel},
    { name : 'script',        model: scriptModel},
    { name : 'func',          model: funcModel},
    { name : 'dataSource',    model: dataSourceModel},
    { name : 'envVariable',   model: envVariableModel},
    { name : 'authLink',      model: authLinkModel},
    { name : 'crontabConfig', model: crontabConfigModel},
    { name : 'batch',         model: batchModel},
    { name : 'fileService',   model: fileServiceModel},
    { name : 'user',          model: userModel},
  ];

  var overview = {
    bizEntityCount  : [],
    workerQueueInfo : [],
    scriptOverview  : null,
    latestOperations: [],
  };

  async.series([
    // 业务实体计数
    function(asyncCallback) {
      if (sectionMap && !sectionMap.bizEntityCount) return asyncCallback();

      async.eachSeries(overviewParts, function(part, eachCallback) {
        part.model.count(null, function(err, dbRes) {
          if (err) return eachCallback(err);

          overview.bizEntityCount.push({
            name : part.name,
            count: dbRes,
          });

          return eachCallback();
        });
      }, asyncCallback);
    },
    // 查询所在队列工作单元数量、最大压力等信息
    function(asyncCallback) {
      if (sectionMap && !sectionMap.workerQueueInfo) return asyncCallback();

      async.timesSeries(CONFIG._WORKER_QUEUE_COUNT, function(i, timesCallback) {
        var cacheKey = toolkit.getWorkerCacheKey('heartbeat', 'workerOnQueueCount', [
              'workerQueue', i]);
        res.locals.cacheDB.get(cacheKey, function(err, cacheRes) {
          if (err) return timesCallback(err);

          var workerCount = parseInt(cacheRes || 0) || 0;
          var maxPressure = (workerCount || 1) * CONFIG._WORKER_LIMIT_WORKER_QUEUE_PRESSURE_BASE;

          var _info = {
            workerCount: workerCount,
            maxPressure: maxPressure,
          }
          overview.workerQueueInfo.push(_info);

          return timesCallback();
        });
      }, asyncCallback);
    },
    // 队列压力
    function(asyncCallback) {
      if (sectionMap && !sectionMap.workerQueueInfo) return asyncCallback();

      var cacheKeys = [];
      for (var i = 0; i < CONFIG._WORKER_QUEUE_COUNT ; i++) {
        var cacheKey = toolkit.getCacheKey('cache', 'workerQueuePressure', ['workerQueue', i])
        cacheKeys.push(cacheKey);
      }

      res.locals.cacheDB.run('mget', cacheKeys, function(err, cacheRes) {
        if (err) return asyncCallback(err);

        cacheRes.forEach(function(p, i) {
          overview.workerQueueInfo[i].pressure = parseInt(p || 0) || 0;
        });

        return asyncCallback();
      });
    },
    // 队列长度
    function(asyncCallback) {
      if (sectionMap && !sectionMap.workerQueueInfo) return asyncCallback();

      async.timesSeries(CONFIG._WORKER_QUEUE_COUNT, function(i, timesCallback) {
        var workerQueue = toolkit.getWorkerQueue(i);
        res.locals.cacheDB.run('llen', workerQueue, function(err, cacheRes) {
          if (err) return timesCallback(err);

          overview.workerQueueInfo[i].taskCount = parseInt(cacheRes || 0) || 0;

          return timesCallback(err);
        });
      }, asyncCallback);
    },
    // 脚本总览
    function(asyncCallback) {
      if (sectionMap && !sectionMap.scriptOverview) return asyncCallback();

      scriptModel.overview(null, function(err, dbRes) {
        if (err) return asyncCallback(err);

        overview.scriptOverview = dbRes;

        return asyncCallback();
      });
    },
    // 最近若干次操作记录
    function(asyncCallback) {
      if (sectionMap && !sectionMap.latestOperations) return asyncCallback();

      var operationRecordModel = operationRecordMod.createModel(res.locals);

      var opt = {
        limit: 10,
      };
      operationRecordModel.list(opt, function(err, dbRes) {
        if (err) return asyncCallback(err);

        overview.latestOperations = dbRes;

        return asyncCallback();
      });
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
  var funcId = req.params.funcId;

  var func = null;
  var funcCallOptions = null;
  async.series([
    // 获取函数
    function(asyncCallback) {
      _getFuncById(res.locals, funcId, function(err, _func) {
        if (err) return asyncCallback(err);

        func = _func;

        return asyncCallback();
      });
    },
    // 创建函数调用选项
    function(asyncCallback) {
      _createFuncCallOptionsFromRequest(req, res, func, function(err, _funcCallOptions) {
        if (err) return asyncCallback(err);

        funcCallOptions = _funcCallOptions;

        return asyncCallback();
      });
    },
  ], function(err) {
    if (err) return next(err);

    _callFuncRunner(res.locals, funcCallOptions, function(err, ret, isCached, responseControl) {
      if (err) return next(err);

      var _opt = {
        isCached       : isCached,
        funcCallOptions: funcCallOptions,
        responseControl: responseControl,
      }
      return _doAPIResponse(res.locals, res, ret, _opt, next);
    });
  });
};

exports.callAuthLink = function(req, res, next) {
  var id     = req.params.id;
  var format = req.params.format;

  var authLink        = null;
  var func            = null;
  var funcCallOptions = null;

  async.series([
    // 检查授权链接是否存在
    function(asyncCallback) {
      authLink = AUTH_LINK_LRU.get(id);

      if (authLink === null) {
        // 已查询过不存在
        return asyncCallback(new E('EClientNotFound', 'No such Auth Link', { id: id }));

      } else if (authLink) {
        // 已查询确定存在
        return asyncCallback();
      }

      var authLinkModel = authLinkMod.createModel(res.locals);

      authLinkModel._get(id, null, function(err, dbRes) {
        if (err) return asyncCallback(err);

        if (!dbRes) {
          // 查询不存在，缓存为`null`
          AUTH_LINK_LRU.set(id, null);
          return asyncCallback(new E('EClientNotFound', 'No such Auth Link', { id: id }));
        }

        authLink = dbRes;
        AUTH_LINK_LRU.set(id, authLink);

        return asyncCallback();
      });
    },
    // 检查认证
    function(asyncCallback) {
      if (!authLink.apiAuthId) return asyncCallback();

      var realm = 'AuthLink:' + authLink.id;
      _doAPIAuth(res.locals, req, res, authLink.apiAuthId, realm, asyncCallback);
    },
    // 检查限制
    function(asyncCallback) {
      // 是否已禁用
      if (authLink.isDisabled) {
        return asyncCallback(new E('EBizCondition.AuthLinkDisabled', 'This Auth Link is disabled'))
      }

      // 是否已过期
      if (authLink.expireTime && new Date(authLink.expireTime) < new Date()) {
        return asyncCallback(new E('EBizCondition.AuthLinkExpired', 'This Auth Link is already expired'))
      }

      // 是否限流
      if (toolkit.isNothing(authLink.throttlingJSON)) return asyncCallback();

      // 限流处理
      async.eachOfSeries(authLink.throttlingJSON, function(limit, rule, eachCallback) {
        var ruleSep = parseInt(Date.now() / 1000 / THROTTLING_RULE_EXPIRES_MAP[rule]);
        var tags = [
          'authLinkId', id,
          'rule'      , rule,
          'ruleSep'   , ruleSep,
        ];
        var cacheKey = toolkit.getCacheKey('throttling', 'authLink', tags);

        res.locals.cacheDB.incr(cacheKey, function(err, cacheRes) {
          if (err) return eachCallback(err);

          var currentCount = parseInt(cacheRes);
          if (currentCount > limit) {
            // 触发限流
            var waitSeconds = parseInt((ruleSep + 1) * THROTTLING_RULE_EXPIRES_MAP[rule] - Date.now() / 1000) + 1;
            return eachCallback(new E('EClientRateLimit.AuthLinkThrottling', 'Maximum calling rate exceeded', {
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
    // 获取函数
    function(asyncCallback) {
      _getFuncById(res.locals, authLink.funcId, function(err, _func) {
        if (err) return asyncCallback(err);

        func = _func;

        // 补全`taskInfoLimit`参数
        // 优先级：`函数配置值`fixedTaskInfoLimit` > 指定值 > 默认值`
        func.extraConfigJSON = func.extraConfigJSON || {};
        func.extraConfigJSON.taskInfoLimit = func.extraConfigJSON.fixedTaskInfoLimit || authLink.taskInfoLimit || null;

        return asyncCallback();
      });
    },
    // 创建函数调用选项
    function(asyncCallback) {
      _createFuncCallOptionsFromRequest(req, res, func, function(err, _funcCallOptions) {
        if (err) return asyncCallback(err);

        funcCallOptions = _funcCallOptions;

        return asyncCallback();
      });
    },
  ], function(err) {
    if (err) return next(err);

    /*** 合并参数 ***/
    try {
      funcCallOptions.funcCallKwargs = _mergeFuncCallKwargs(
          authLink.funcCallKwargsJSON,
          funcCallOptions.funcCallKwargs,
          format);

    } catch(err) {
      if (err instanceof E) {
        // 业务错误时补全脚本/函数信息
        err.detail.funcId = funcCallOptions.funcId;
      }

      return next(err);
    }

    _callFuncRunner(res.locals, funcCallOptions, function(err, ret, isCached, responseControl) {
      if (err) return next(err);

      var _opt = {
        isCached       : isCached,
        funcCallOptions: funcCallOptions,
        responseControl: responseControl,
      }
      return _doAPIResponse(res.locals, res, ret, _opt, next);
    });
  });
};

exports.callCrontabConfig = function(req, res, next) {
  var id = req.params.id;

  async.series([
    // 检查自动触发配置是否存在
    function(asyncCallback) {
      var crontabConfigModel = crontabConfigMod.createModel(res.locals);

      crontabConfigModel._get(id, null, function(err, dbRes) {
        if (err) return asyncCallback(err);

        if (!dbRes) {
          // 查询不存在，缓存为`null`
          return asyncCallback(new E('EClientNotFound', 'No such Crontab Config', { id: id }));
        }

        return asyncCallback();
      });
    },
  ], function(err) {
    if (err) return next(err);

    // 发送任务
    var celery = celeryHelper.createHelper(res.locals.logger);

    var name = 'Main.CrontabManualStarter';
    var kwargs = { crontabConfigId: id };

    // 保证UI运行能够正常接收到超时报错
    var taskOptions = { resultWaitTimeout: 10 * 1000 };

    celery.putTask(name, null, kwargs, taskOptions, null, function(err) {
      if (err) return next(err);
      return res.locals.sendJSON();
    });
  });
};

exports.callBatch = function(req, res, next) {
  var id     = req.params.id;
  var format = req.params.format;

  var batch           = null;
  var func            = null;
  var funcCallOptions = null;

  async.series([
    // 检查批处理是否存在
    function(asyncCallback) {
      batch = BATCH_LRU.get(id);

      if (batch === null) {
        // 已查询过不存在
        return asyncCallback(new E('EClientNotFound', 'No such Batch', { id: id }));

      } else if (batch) {
        // 已查询确定存在
        return asyncCallback();
      }

      var batchModel = batchMod.createModel(res.locals);

      batchModel._get(id, null, function(err, dbRes) {
        if (err) return asyncCallback(err);

        if (!dbRes) {
          // 查询不存在，缓存为`null`
          BATCH_LRU.set(id, null);
          return asyncCallback(new E('EClientNotFound', 'No such Batch', { id: id }));
        }

        batch = dbRes;
        BATCH_LRU.set(id, batch);

        return asyncCallback();
      });
    },
    // 检查认证
    function(asyncCallback) {
      if (!batch.apiAuthId) return asyncCallback();

      var realm = 'Batch:' + batch.id;
      _doAPIAuth(res.locals, req, res, batch.apiAuthId, realm, asyncCallback);
    },
    // 检查限制
    function(asyncCallback) {
      // 是否已禁用
      if (batch.isDisabled) {
        return asyncCallback(new E('EBizCondition.BatchDisabled', 'This Batch is disabled'))
      }

      return asyncCallback();
    },
    // 获取函数
    function(asyncCallback) {
      _getFuncById(res.locals, batch.funcId, function(err, _func) {
        if (err) return asyncCallback(err);

        func = _func;

        // 补全`taskInfoLimit`参数
        // 优先级：`函数配置值`fixedTaskInfoLimit` > 指定值 > 默认值`
        func.extraConfigJSON = func.extraConfigJSON || {};
        func.extraConfigJSON.taskInfoLimit = func.extraConfigJSON.fixedTaskInfoLimit || batch.taskInfoLimit || null;

        return asyncCallback();
      });
    },
    // 创建函数调用选项
    function(asyncCallback) {
      _createFuncCallOptionsFromRequest(req, res, func, function(err, _funcCallOptions) {
        if (err) return asyncCallback(err);

        funcCallOptions = _funcCallOptions;

        return asyncCallback();
      });
    },

    // 批处理不检查工作队列
  ], function(err) {
    if (err) return next(err);

    /*** 合并参数 ***/
    try {
      funcCallOptions.funcCallKwargs = _mergeFuncCallKwargs(
          batch.funcCallKwargsJSON,
          funcCallOptions.funcCallKwargs,
          format);

    } catch(err) {
      if (err instanceof E) {
        // 业务错误时补全脚本/函数信息
        err.detail.funcId = funcCallOptions.funcId;
      }

      return next(err);
    }

    _callFuncRunner(res.locals, funcCallOptions, function(err, ret) {
      if (err) return next(err);

      var _opt = null;
      return _doAPIResponse(res.locals, res, ret, _opt, next);
    });
  });
};

exports.callFuncDraft = function(req, res, next) {
  // 函数，参数
  var funcId         = req.params.funcId;
  var funcCallKwargs = req.body.kwargs || {};

  var scriptId = funcId.split('.')[0];

  var scriptModel = scriptMod.createModel(res.locals);

  async.series([
    // 检查脚本是否存在
    function(asyncCallback) {
      scriptModel.getWithCheck(scriptId, null, asyncCallback);
    },
  ], function(err) {
    if (err) return next(err);

    // 调用草稿
    var celery = celeryHelper.createHelper(res.locals.logger);

    var name = 'Main.FuncDebugger';
    var kwargs = {
      funcId        : funcId,
      funcCallKwargs: funcCallKwargs,
      httpRequest   : _getHTTPRequestInfo(req),
      origin        : 'debug',
      originId      : res.locals.traceId,
    };

    kwargs.triggerTimeMs = res.locals.requestTime.getTime();
    kwargs.triggerTime   = parseInt(kwargs.triggerTimeMs / 1000);

    // 启动函数执行任务
    var onResultCallback = function(err, celeryRes, extraInfo) {
      if (err) return next(err);

      celeryRes = celeryRes || {};
      extraInfo = extraInfo || {};

      // 无法通过JSON.parse解析
      if ('string' === typeof celeryRes) {
        return next(new E('EFuncResultParsingFailed', 'Func result is not standard JSON'));
      }

      // 失败/超时
      if (celeryRes.status === 'FAILURE') {
        // 注意：由于预检查任务本身永远不会失败
        // 代码流程如果进入此处，必然是引擎内部故障
        return next(new E('EFuncFailed', 'Calling Function failed', {
          id       : celeryRes.id,
          etype    : celeryRes.result && celeryRes.result.exc_type,
          einfoTEXT: celeryRes.einfoTEXT,
        }));

      } else if (extraInfo.status === 'TIMEOUT') {
        return next(new E('EFuncTimeout', 'Waiting Func result timeout, but task is still running. Use task ID to fetch result later', {
          id: extraInfo.id,
        }));
      }

      var ret = null;
      if (celeryRes.retval.einfoTEXT) {
        // 脚本执行错误，手工包装
        ret = {
          ok     : false,
          error  : CONST.respCodeMap.EScriptPreCheck,
          message: 'Code pre-check failed. Script raised an EXCEPTION during executing, please check your code and try again',
          data   : {result: celeryRes.retval.result},
          reason : 'EScriptPreCheck',
          detail : {
            einfoTEXT: celeryRes.retval.einfoTEXT,
            traceInfo: celeryRes.retval.traceInfo,
          },
        };
        res.status(parseInt(CONST.respCodeMap.EScriptPreCheck));

      } else {
        ret = toolkit.initRet(celeryRes.retval);
      }

      res.locals.sendJSON(ret);
    };

    var taskOptions = {
      queue        : CONFIG._FUNC_TASK_DEFAULT_DEBUG_QUEUE,
      softTimeLimit: CONFIG._FUNC_TASK_DEBUG_TIMEOUT,
      timeLimit    : CONFIG._FUNC_TASK_DEBUG_TIMEOUT + CONFIG._FUNC_TASK_EXTRA_TIMEOUT_TO_KILL,
    }

    // 保证UI运行能够正常接收到超时报错
    taskOptions.resultWaitTimeout = (taskOptions.timeLimit + 5) * 1000;

    celery.putTask(name, null, kwargs, taskOptions, null, onResultCallback);
  });
};

exports.getFuncResult = function(req, res, next) {
  var taskId     = req.query.taskId;
  var returnType = req.query.returnType || 'raw';
  var unfold     = req.query.unfold;

  var datafluxFuncTaskResultModel = datafluxFuncTaskResultMod.createModel(res.locals);
  datafluxFuncTaskResultModel.getWithCheck(taskId, null, function(err, dbRes) {
    if (err) return next(err);

    var result = dbRes.retvalJSON || null;
    if (result && returnType !== 'ALL') {
      result = result[returnType];
    }

    var ret = toolkit.initRet({
      request  : dbRes.kwargsJSON,
      startTime: dbRes.startTime,
      endTime  : dbRes.endTime,
      status   : dbRes.status,
      result   : result,
    });

    if (unfold) {
      return res.locals.sendRaw(ret.data.result);
    } else {
      return res.locals.sendJSON(ret);
    }
  });
};

exports.getFuncList = function(req, res, next) {
  req.query = req.query || {};
  req.query._asFuncDoc = true;

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
    if (!toolkit.isNothing(name)) {
      funcTags = funcTags.filter(function(x) {
        return x.indexOf(name) >= 0;
      });
    }

    if (!toolkit.isNothing(tagPattern)) {
      funcTags = funcTags.filter(function(x) {
        return toolkit.matchWildcard(x, tagPattern);
      });
    }

    var ret = toolkit.initRet(funcTags);
    return res.locals.sendJSON(ret);
  });
};

exports.getAuthLinkFuncList = function(req, res, next) {
  var authLinkModel = authLinkMod.createModel(res.locals);

  var opt = res.locals.getQueryOptions();
  opt.filters = opt.filters || {};
  opt.filters['auln.showInDoc'] = {eq: true};

  authLinkModel.list(opt, function(err, dbRes) {
    if (err) return next(err);

    var funcList = [];
    dbRes.forEach(function(d) {
      funcList.push({
        url: urlFor('mainAPI.callAuthLinkByGet', {
          params: { id: d.id },
        }),

        id                : d.id,
        funcId            : d.funcId,
        funcCallKwargsJSON: d.funcCallKwargsJSON,
        expireTime        : d.expireTime,
        throttlingJSON    : d.throttlingJSON,
        isDisabled        : d.isDisabled,

        funcName       : d.func_name,
        funcTitle      : d.func_title,
        funcDescription: d.func_description,
        funcDefinition : d.func_definition,
        funcArgsJSON   : d.func_argsJSON,
        funcKwargsJSON : d.func_kwargsJSON,
        funcCategory   : d.func_category,
        funcIntegration: d.func_integration,
        funcTagsJSON   : d.func_tagsJSON,
      });
    });

    var ret = toolkit.initRet(funcList);
    return res.locals.sendJSON(ret);
  });
};

exports.getSystemConfig = function(req, res, next) {
  var systemConfig = {
    MODE              : CONFIG.MODE,
    WEB_BASE_URL      : CONFIG.WEB_BASE_URL,
    WEB_INNER_BASE_URL: CONFIG.WEB_INNER_BASE_URL,

    _HOSTNAME       : process.env.HOSTNAME,
    _PIP_INSTALL_DIR: path.join(CONFIG.RESOURCE_ROOT_PATH, CONFIG.EXTRA_PYTHON_PACKAGE_INSTALL_DIR),

    _WEB_CLIENT_ID_HEADER : CONFIG._WEB_CLIENT_ID_HEADER,
    _WEB_ORIGIN_HEADER    : CONFIG._WEB_ORIGIN_HEADER,
    _WEB_AUTH_HEADER      : CONFIG._WEB_AUTH_HEADER,
    _WEB_AUTH_QUERY       : CONFIG._WEB_AUTH_QUERY,
    _WEB_TRACE_ID_HEADER  : CONFIG._WEB_TRACE_ID_HEADER,
    _WEB_PULL_LOG_TRACE_ID: CONFIG._WEB_PULL_LOG_TRACE_ID,

    _FUNC_PKG_EXPORT_FILENAME           : CONFIG._FUNC_PKG_EXPORT_FILENAME,
    _FUNC_PKG_EXPORT_EXT                : CONFIG._FUNC_PKG_EXPORT_EXT,
    _FUNC_PKG_PASSWORD_LENGTH_RANGE_LIST: CONFIG._FUNC_PKG_PASSWORD_LENGTH_RANGE_LIST,

    _FUNC_ARGUMENT_PLACEHOLDER_LIST: CONFIG._FUNC_ARGUMENT_PLACEHOLDER_LIST,

    _FUNC_TASK_DEBUG_TIMEOUT        : CONFIG._FUNC_TASK_DEBUG_TIMEOUT,
    _FUNC_TASK_DEFAULT_TIMEOUT      : CONFIG._FUNC_TASK_DEFAULT_TIMEOUT,
    _FUNC_TASK_MIN_TIMEOUT          : CONFIG._FUNC_TASK_MIN_TIMEOUT,
    _FUNC_TASK_MAX_TIMEOUT          : CONFIG._FUNC_TASK_MAX_TIMEOUT,
    _FUNC_TASK_DEFAULT_API_TIMEOUT  : CONFIG._FUNC_TASK_DEFAULT_API_TIMEOUT,
    _FUNC_TASK_MIN_API_TIMEOUT      : CONFIG._FUNC_TASK_MIN_API_TIMEOUT,
    _FUNC_TASK_MAX_API_TIMEOUT      : CONFIG._FUNC_TASK_MAX_API_TIMEOUT,
    _FUNC_TASK_EXTRA_TIMEOUT_TO_KILL: CONFIG._FUNC_TASK_EXTRA_TIMEOUT_TO_KILL,

    _TASK_INFO_DEFAULT_LIMIT_AUTH_LINK: CONFIG._TASK_INFO_DEFAULT_LIMIT_AUTH_LINK,
    _TASK_INFO_DEFAULT_LIMIT_CRONTAB  : CONFIG._TASK_INFO_DEFAULT_LIMIT_CRONTAB,
    _TASK_INFO_DEFAULT_LIMIT_BATCH    : CONFIG._TASK_INFO_DEFAULT_LIMIT_BATCH,
    _TASK_INFO_MIN_LIMIT              : CONFIG._TASK_INFO_MIN_LIMIT,
    _TASK_INFO_MAX_LIMIT              : CONFIG._TASK_INFO_MAX_LIMIT,

    _INTERNAL_KEEP_SCRIPT_FAILURE: CONFIG._INTERNAL_KEEP_SCRIPT_FAILURE,
    _INTERNAL_KEEP_SCRIPT_LOG    : CONFIG._INTERNAL_KEEP_SCRIPT_LOG,

    _EX_UPLOAD_RESOURCE_FILE_SIZE_LIMIT: toolkit.toBytes(ROUTE.mainAPI.uploadResource.files.$limitSize),

    _ARCH: process.arch, // x64|arm64
  };

  var funcModel = funcMod.createModel(res.locals);

  async.series([
    // 获取登录集成函数
    function(asyncCallback) {
      var opt = {
        filters: {
          integration: {eq: 'signIn'}
        }
      };
      funcModel.list(opt, function(err, dbRes) {
        if (err) return asyncCallback(err);

        if (dbRes.length <= 0) return asyncCallback();

        // 集成登录记录为配置信息
        var integratedSignInFuncs = [];
        dbRes.forEach(function(d) {
          integratedSignInFuncs.push({
            id  : d.id,
            name: d.title,
          });
        });

        systemConfig._INTEGRATED_SIGN_IN_FUNC = integratedSignInFuncs;

        return asyncCallback();
      });
    },
  ], function(err) {
    if (err) return next(err);

    var ret = toolkit.initRet(systemConfig);
    return res.locals.sendJSON(ret);
  });
};

exports.getUpgradeInfo = function(req, res, next) {
  var seq = req.query.seq;
  if (parseInt(seq) > 0) {
    seq = parseInt(seq);
  }

  var filePath = path.join(__dirname, '../../upgrade-info.yaml');

  var fileContent = fs.readFileSync(filePath);
  var upgradeInfo = yaml.load(fileContent).upgradeInfo;

  if ('number' === typeof seq) {
    upgradeInfo = upgradeInfo.filter(function(x) {
      return x.seq > seq;
    });
  } else if (seq === 'latest') {
    upgradeInfo = upgradeInfo.slice(-1);
  }

  var ret = toolkit.initRet(upgradeInfo);
  return res.locals.sendJSON(ret);
};

// 集成处理
exports.integratedSignIn = function(req, res, next) {
  var funcId   = req.body.signIn.funcId;
  var username = req.body.signIn.username;
  var password = req.body.signIn.password;

  // 调用函数
  var celery = celeryHelper.createHelper(res.locals.logger);

  var name = 'Main.FuncRunner';
  var kwargs = {
    funcId        : funcId,
    funcCallKwargs: { username: username, password: password },
  };

  // 启动函数执行任务
  var onResultCallback = function(err, celeryRes, extraInfo) {
    if (err) return next(err);

    celeryRes = celeryRes || {};
    extraInfo = extraInfo || {};

    // 无法通过JSON.parse解析
    if ('string' === typeof celeryRes) {
      return next(new E('EFuncResultParsingFailed', 'Func result is not standard JSON'));
    }

    // 函数失败/超时
    if (celeryRes.status === 'FAILURE') {
      var errorMessage = null;
      try { errorMessage = celeryRes.exceptionMessage } catch(_) {}
      return next(new E('EFuncFailed.SignInFuncRaisedException', errorMessage));

    } else if (extraInfo.status === 'TIMEOUT') {
      return next(new E('EFuncFailed.SignInFuncTimeout', 'Sign-in function timeout'));
    }

    // 函数返回False或没有实际意义内容
    var funcRetval = null;
    try { funcRetval = celeryRes.retval.raw } catch(_) {}
    if (toolkit.isNothing(funcRetval) || funcRetval === false) {
      return next(new E('EFuncFailed.SignInFuncReturnedFalseOrNothing', 'Sign-in function returned False or nothing'));
    }

    // 登录成功
    var userId          = username;
    var userDisplayName = username;
    switch(typeof funcRetval) {
      // 集成登录函数仅返回字符串/数字时，此字符串作为用户ID
      case 'string':
      case 'number':
        userId = '' + funcRetval;
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
        userId = pickField(funcRetval, [
          'id', 'uid',
          'userId', 'user_id',
        ]);
        userDisplayName = pickField(funcRetval, [
          'name', 'title',
          'fullname', 'full_name',
          'displayName', 'display_name',
          'realName', 'real_name',
          'showName', 'show_name',
        ]);
        break;
    }

    // 避免与内置系统用户ID冲突
    userId = toolkit.strf('igu_{0}-{1}', toolkit.getMD5(funcId), userId);

    // 发行登录令牌
    var authTokenObj = auth.genXAuthTokenObj(userId);
    authTokenObj.ig = true;
    authTokenObj.un = username
    authTokenObj.nm = userDisplayName;

    var cacheKey     = auth.getCacheKey(authTokenObj);
    var xAuthToken   = auth.signXAuthTokenObj(authTokenObj)
    var xAuthExpires = CONFIG._WEB_AUTH_EXPIRES;

    res.locals.cacheDB.setex(cacheKey, xAuthExpires, 'x', function(err) {
      if (err) return asyncCallback(err);

      var ret = toolkit.initRet({
        userId    : userId,
        xAuthToken: xAuthToken,
      });
      return res.locals.sendJSON(ret);
    });
  };

  var taskOptions = {
    resultWaitTimeout: CONFIG._FUNC_TASK_DEFAULT_TIMEOUT * 1000,
  }
  celery.putTask(name, null, kwargs, taskOptions, null, onResultCallback);
};

exports.integratedAuthMid = function(req, res, next) {
  if (res.locals.user && res.locals.user.isSignedIn) return next();

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
  var xAuthTokenObj      = null;
  var xAuthTokenCacheKey = null;

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
        if (!xAuthTokenObj.ig) return next();

        return asyncCallback();
      });
    },
    // Check Redis
    function(asyncCallback) {
      xAuthTokenCacheKey = auth.getCacheKey(xAuthTokenObj);
      res.locals.cacheDB.get(xAuthTokenCacheKey, function(err, cacheRes) {
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
      res.locals.cacheDB.expire(xAuthTokenCacheKey, CONFIG._WEB_AUTH_EXPIRES, asyncCallback);
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
      roles           : ['user'].join(','),
      customPrivileges: ['systemConfig_r'].join(','),
      isIntegratedUser: xAuthTokenObj.ig,
    });

    res.locals.logger.info('Auth by [Integrated Sign-in Func]: id=`{0}`; username=`{1}`',
      res.locals.user.id,
      res.locals.user.username);

    // client detect
    res.locals.authType = 'builtin.byXAuthToken';
    res.locals.authId   = xAuthTokenObj.uid;

    delete req.query[queryField];

    return next();
  });
};

// 清空日志/缓存表
exports.clearLogCacheTables = function(req, res, next) {
  var logTables = [
    'biz_main_script_log',
    'biz_main_script_failure',
    'biz_main_task_result_dataflux_func',
    'biz_main_crontab_task_info',
    'biz_main_batch_task_info',
    'biz_main_operation_record',
  ];

  var sql = logTables.map(function(t) {
    return 'TRUNCATE ' + t;
  }).join('; ');

  res.locals.db.query(sql, null, function(err) {
    if (err) return next(err);

    return res.locals.sendJSON();
  });
};

// Python包
exports.listInstalledPythonPackages = function(req, res, next) {
  // Python包安装路径
  var packageInstallPath = path.join(CONFIG.RESOURCE_ROOT_PATH, CONFIG.EXTRA_PYTHON_PACKAGE_INSTALL_DIR);

  var packageVersionMap = {};

  var BUILTIN_PACKAGE_CMD = 'pip freeze';
  var EXTRA_PACKAGE_CMD   = BUILTIN_PACKAGE_CMD + toolkit.strf(' --path {0}', packageInstallPath);

  var cmds = [EXTRA_PACKAGE_CMD, BUILTIN_PACKAGE_CMD]
  async.eachSeries(cmds, function(cmd, asyncCallback) {
    childProcess.exec(cmd, function(err, stdout, stderr) {
      if (err) return asyncCallback(err);

      stdout.trim().split('\n').forEach(function(pkg) {
        if (toolkit.isNothing(pkg)) return;

        var parts = pkg.split('==');
        packageVersionMap[parts[0]] = {
          name     : parts[0],
          version  : parts[1],
          isBuiltin: cmd === BUILTIN_PACKAGE_CMD,
        };
      });

      return asyncCallback();
    });
  }, function(err) {
    if (err) return next(err);

    var packages = Object.values(packageVersionMap);
    packages.sort(function(a, b) {
      if (a < b) {
        return -1;
      } else if (a > b) {
        return 1;
      } else {
        return 0;
      }
    });

    var ret = toolkit.initRet(packages);
    return res.locals.sendJSON(ret);
  });
};

exports.getPythonPackageInstallStatus = function(req, res, next) {
  var cacheKey = toolkit.getCacheKey('cache', 'installPythonPackage');
  res.locals.cacheDB.get(cacheKey, function(err, cacheRes) {
    if (err) return next(err);

    var installingStatus = null;
    if (cacheRes) {
      installingStatus = JSON.parse(cacheRes);
    }

    var ret = toolkit.initRet(installingStatus);
    return res.locals.sendJSON(ret);
  });
};

exports.installPythonPackage = function(req, res, next) {
  var pkg     = req.body.pkg;
  var mirror  = req.body.mirror;
  var isWheel = false;

  // 适配Wheel包
  if (toolkit.endsWith(pkg, '.whl')) {
    pkg = path.join(CONFIG.RESOURCE_ROOT_PATH, pkg);
    isWheel = true;
  }

  // Python包安装路径
  var packageInstallPath = path.join(CONFIG.RESOURCE_ROOT_PATH, CONFIG.EXTRA_PYTHON_PACKAGE_INSTALL_DIR);
  fs.ensureDirSync(packageInstallPath);

  // 安装状态缓存
  var statusCacheKey = toolkit.getCacheKey('cache', 'installPythonPackage');
  var statusAge = 3600;

  function createInstallStatus(status, stderr) {
    var installStatus = {
      pkg      : pkg,
      status   : status,
      message  : stderr || null,
      timestamp: new Date(),
    }
    installStatus = JSON.stringify(installStatus);
    return installStatus;
  }

  async.series([
    // 记录安装信息
    function(asyncCallback) {
      var installStatus = createInstallStatus('RUNNING');
      res.locals.cacheDB.setex(statusCacheKey, statusAge, installStatus, asyncCallback);
    },
    // 清空之前安装的内容
    function(asyncCallback) {
      if (isWheel) return asyncCallback();

      var pkgName = pkg.split('=')[0].replace(/-/g, '_');

      var cmd = 'rm';
      var cmdArgs = [ '-rf'];

      // 读取需要删除的目录
      fs.readdirSync(packageInstallPath).forEach(function(folderName) {
        var absFolderPath   = path.join(packageInstallPath, folderName);
        var absMetaPath     = path.join(absFolderPath, 'METADATA');
        var absTopLevelPath = path.join(absFolderPath, 'top_level.txt');

        // 非dist-info目录，跳过
        if (!toolkit.startsWith(folderName, pkgName + '-') || !toolkit.endsWith(folderName, '.dist-info')) return;
        // 不存在METADATA文件，跳过
        if (!fs.existsSync(absMetaPath)) return;

        // 提取METADATA中名称
        var metaName = null;
        var metaLines = fs.readFileSync(absMetaPath).toString().split('\n');
        for (var i = 0; i < metaLines.length; i++) {
          if (toolkit.startsWith(metaLines[i], 'Name: ')) {
            metaName = metaLines[i].split(':')[1].trim();
            break;
          }
        }

        // METADATA中名称与包名不同，跳过
        if (metaName !== pkgName) return;

        // 需要删除的目录
        cmdArgs.push(absFolderPath);

        // 提取top_level.txt内容
        // 不存在top_level.txt文件，跳过
        if (!fs.existsSync(absTopLevelPath)) return;
        var topLevelName = fs.readFileSync(absTopLevelPath).toString().trim();

        // 需要删除的目录
        var absTopLevelFolderPath = path.join(packageInstallPath, topLevelName);
        cmdArgs.push(absTopLevelFolderPath);
      })
      childProcess.execFile(cmd, cmdArgs, function(err, stdout, stderr) {
        if (err) {
          // 安装失败
          var installStatus = createInstallStatus('FAILURE', stderr);
          res.locals.cacheDB.setex(statusCacheKey, statusAge, installStatus, function(err) {
            if (err) return asyncCallback(err);

            return asyncCallback(new E('ESys', 'Preparing Python package failed', {
              package: pkg,
              stderr : stderr,
            }));
          });

        } else {
          return asyncCallback();
        }
      });
    },
    function(asyncCallback) {
      var cmd = 'pip';
      var cmdArgs = [
        'install',
        '--no-cache-dir',
        '--default-timeout', '60',
        '-t', packageInstallPath,
      ];

      // 启用镜像源
      if (!toolkit.isNothing(mirror)) {
        cmdArgs.push('-i', mirror);
      }

      cmdArgs.push(pkg);

      res.locals.logger.info('PIP: {0} {1}', cmd, cmdArgs.join(' '));
      childProcess.execFile(cmd, cmdArgs, function(err, stdout, stderr) {
        if (err) {
          // 安装失败
          var installStatus = createInstallStatus('FAILURE', stderr);
          res.locals.cacheDB.setex(statusCacheKey, statusAge, installStatus, function(err) {
            if (err) return asyncCallback(err);

            return asyncCallback(new E('ESys', 'Install Python package failed', {
              package: pkg,
              stderr : stderr,
              message: stderr.split('\n')[0],
            }));
          });

        } else {
          // 安装成功
          var installStatus = createInstallStatus('SUCCESS', stderr);
          res.locals.cacheDB.setex(statusCacheKey, statusAge, installStatus, asyncCallback);
        }
      });
    },
  ], function(err) {
    if (err) return next(err);
    return res.locals.sendJSON();
  });
};

// 资源目录
exports.listResources = function(req, res, next) {
  var subFolder = req.query.folder || './';
  var type      = req.query.type;

  var absPath = path.join(CONFIG.RESOURCE_ROOT_PATH, subFolder);

  if (!absPath.endsWith('/')) {
    absPath += '/';
  }

  // 防止访问外部文件夹
  if (!toolkit.startsWith(absPath, CONFIG.RESOURCE_ROOT_PATH + '/')) {
    return next(new E('EBizCondition', 'Cannot not fetch folder out of resource folder'))
  }

  // 检查存在性
  if (!fs.existsSync(absPath)) {
    return next(new E('EBizCondition', 'Folder not exists'))
  }

  var opt = {
    withFileTypes: true,
  }
  fs.readdir(absPath, opt, function(err, data) {
    if (err) return next(err);

    var files = data.reduce(function(acc, x) {
      var f = {
        name      : x.name,
        type      : null,
        size      : null,
        createTime: null,
        updateTime: null,
      };

      var stat = fs.statSync(path.join(absPath, x.name));
      f.createTime = stat.birthtimeMs;
      f.updateTime = stat.ctimeMs;

      if (x.isDirectory()) {
        f.type = 'folder';
      } else if (x.isFile()) {
        f.type = 'file';
        f.size = stat.size;
      }

      if (!f.type) return acc;

      if (toolkit.isNothing(type) || type.indexOf(f.type) >= 0) {
        acc.push(f);
      }
      return acc;
    }, []);

    var ret = toolkit.initRet(files);
    return res.locals.sendJSON(ret);
  });
};

exports.getResources = function(req, res, next) {
  var filePath = req.query.filePath;

  var absPath = path.join(CONFIG.RESOURCE_ROOT_PATH, filePath);

  // 防止访问外部文件夹
  if (!toolkit.startsWith(absPath, CONFIG.RESOURCE_ROOT_PATH + '/')) {
    return next(new E('EBizCondition', 'Cannot not access file out of resource folder'))
  }

  var stat = null;

  if (fs.existsSync(absPath)) {
    stat = fs.statSync(absPath);
  }

  var ret = toolkit.initRet(stat);
  return res.locals.sendJSON(ret);
};

exports.downloadResources = function(req, res, next) {
  var filePath = req.query.filePath;
  var preview  = req.query.preview;

  var fileName = filePath.split('/').pop();
  var fileType = fileName.split('.').pop();
  var absPath  = path.join(CONFIG.RESOURCE_ROOT_PATH, filePath);

  // 防止访问外部文件夹
  if (!toolkit.startsWith(absPath, CONFIG.RESOURCE_ROOT_PATH + '/')) {
    return next(new E('EBizCondition', 'Cannot not access file out of resource folder'))
  }

  // 检查存在性
  if (!fs.existsSync(absPath)) {
    return next(new E('EBizCondition', 'File not exists'))
  }

  if (preview) {
    fs.readFile(absPath, function(err, data) {
      if (err) return next(err)

      res.type(fileType);
      return res.send(data);
    });

  } else {
    return res.locals.sendLocalFile(absPath);
  }
};

exports.uploadResource = function(req, res, next) {
  var file   = req.files ? req.files[0] : null;
  var folder = req.body.folder || '.';
  var rename = req.body.rename || null;

  var fileSaveName = rename || file.originalname;
  var filePath = path.join(CONFIG.RESOURCE_ROOT_PATH, folder, fileSaveName);
  fs.moveSync(file.path, filePath, { overwrite: true });

  var ret = toolkit.initRet();
  res.locals.sendJSON(ret);
};

exports.operateResource = function(req, res, next) {
  var targetPath        = req.body.targetPath;
  var operation         = req.body.operation;
  var operationArgument = req.body.operationArgument;

  var targetName    = targetPath.split('/').pop();
  var targetAbsPath = path.join(CONFIG.RESOURCE_ROOT_PATH, targetPath);
  var currentAbsDir = toolkit.replacePathEnd(targetAbsPath);

  // 防止访问外部文件夹
  if (!toolkit.startsWith(targetAbsPath, CONFIG.RESOURCE_ROOT_PATH + '/')) {
    return next(new E('EBizCondition', 'Cannot not operate file or folder out of resource folder'))
  }

  // 检查操作对象存在性
  switch(operation) {
    case 'zip':
    case 'unzip':
    case 'cp':
    case 'mv':
    case 'rm':
      // 要求存在
      if (!fs.existsSync(targetAbsPath)) {
        return next(new E('EBizCondition', 'File or folder not existed', { name: targetName }));
      }
      break;

    default:
      // 要求不存在
      if (fs.existsSync(targetAbsPath)) {
        return next(new E('EBizCondition', 'File or folder already existed', { name: targetName }));
      }
      break;
  }

  // 检查/准备参数
  var cmd     = null;
  var cmdArgs = [];
  switch(operation) {
    case 'mkdir':
      cmd = 'mkdir';
      cmdArgs.push('-p', targetName);
      break;

    case 'zip':
      var zipFileName = targetName + '.zip';

      var zipFileAbsPath = path.join(currentAbsDir, zipFileName);
      if (fs.existsSync(zipFileAbsPath)) {
        return next(new E('EBizCondition', 'Zip file already existed', { name: zipFileName }));
      }

      cmd = 'zip';
      cmdArgs.push('-r', zipFileName, targetName); // 在当前目录执行
      break;

    case 'unzip':
      cmd = 'unar';
      cmdArgs.push('-d', '-r', targetName);
      break;

    case 'cp':
      cmdArgs.push('-r');
    case 'mv':
      var newName = operationArgument;
      var newAbsPath = newName[0] === '/'
                     ? path.join(CONFIG.RESOURCE_ROOT_PATH, newName)
                     : path.join(currentAbsDir, newName);

      if (fs.existsSync(newAbsPath)) {
        return next(new E('EBizCondition', 'Specified new file or folder name already existed'));
      }

      var parentAbsDir = toolkit.replacePathEnd(newAbsPath);
      fs.ensureDirSync(parentAbsDir);

      cmd = operation;
      cmdArgs.push(targetAbsPath, newAbsPath);
      break;

    case 'rm':
      cmd = 'rm';
      cmdArgs.push('-rf', targetAbsPath);
      break;

    default:
      return next(new E('EClientUnsupported', 'Unsupported resource operation'));
      break;
  }

  var opt = { cwd: currentAbsDir };
  childProcess.execFile(cmd, cmdArgs, opt, function(err, stdout, stderr) {
    if (err) return next(err);
    return res.locals.sendJSON();
  });
};

// 文件服务
exports.fileService = function(req, res, next) {
  var id      = req.params.id;
  var relPath = '/' + req.params[0];

  var fileServiceModel = fileServiceMod.createModel(res.locals);
  fileServiceModel.getWithCheck(id, null, function(err, dbRes) {
    if (err) return next(err);

    if (dbRes.isDisabled) {
        return next(new E('EBizCondition.FileServiceDisabled', 'This File Service is disabled'))
    }

    var absPath = path.join(CONFIG.RESOURCE_ROOT_PATH, (dbRes.root || '.'), relPath);

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
            f.createTime = moment(stat.birthtimeMs).utcOffset('+08:00').format('YYYY-MM-DD HH:mm:ss');
            f.updateTime = moment(stat.ctimeMs).utcOffset('+08:00').format('YYYY-MM-DD HH:mm:ss');

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

// 获取脚本包索引
exports.getPackageIndex = function(req, res, next) {
  var indexURL = req.query.indexURL || CONFIG.OFFICIAL_PACKAGE_INDEX_URL;

  var requestOptions = {
    forever: true,
    timeout: 3 * 1000,
    method : 'get',
    url    : indexURL,
    json   : true,
  };
  request(requestOptions, function(err, _res, _body) {
    if (err) return next(err);

    // 简单检查是否有效
    var isInvalidIndex = false;
    if (!Array.isArray(_body)) {
      isInvalidIndex = true;
    }

    if (isInvalidIndex) {
      return next(new E('EBizBadData', 'Invalid package'));
    }

    var ret = toolkit.initRet(_body);
    return res.locals.sendJSON(ret);
  });
};

// 拉取系统日志
exports.pullSystemLogs = function(req, res, next) {
  var startPosition = parseInt(req.query.position);

  var nextPosition = null;
  var logs        = null;
  async.series([
    // 确定开始/结束位置
    function(asyncCallback) {
      fs.stat(CONFIG.LOG_FILE_PATH, function(err, stat) {
        if (err) return asyncCallback(err);

        nextPosition = stat.size;

        if (!startPosition) {
          // 默认从-10K位置读取
          startPosition = stat.size - (1024 * 50);
        }

        if (startPosition < 0) {
          startPosition = 0;
        }
        if (startPosition > nextPosition - 1) {
          startPosition = nextPosition - 1;
        }

        return asyncCallback();
      });
    },
    // 读取日志
    function(asyncCallback) {
      var logContent = '';

      var opt = {
        start: startPosition,
        end  : nextPosition - 1,
      }

      if (opt.start === opt.end) {
        // 没有新日志
        logs = [];
        return asyncCallback();
      }

      // 从文件读取新日志
      var steam = fs.createReadStream(CONFIG.LOG_FILE_PATH, opt)
      steam.on('data', function(chunk) {
        logContent += chunk;
      });
      steam.on('end', function() {
        logContent = logContent.toString().trim();

        if (!logContent) {
          logs = [];
        } else {
          logs = logContent.split('\n');
          if (!req.query.position) {
            logs = logs.slice(1);
          }
        }

        return asyncCallback();
      });
    },
  ], function(err) {
    if (err) return next(err);

    var ret = toolkit.initRet({
      nextPosition: nextPosition,
      logs        : logs,
    });
    return res.locals.sendJSON(ret, { muteLog: true });
  });
};

// 获取指标数据
exports.metrics = function(req, res, next) {
  res.set('Content-Type', 'application/openmetrics-text; version=1.0.0; charset=utf-8');

  var interval_min = 10;
  var interval     = interval_min * 60;

  var cacheKeyPattern = toolkit.getCacheKey('monitor', 'sysStats', ['metric', '*']);
  var ignoreMetrics = [
    // 不适合作为OpenMetric导出的指标
    'matchedRouteCount', // 按每日统计的数据，非时序数据
  ];

  var keys = null;
  async.series([
    // 查询所有指标键
    function(asyncCallback) {
      res.locals.cacheDB.keys(cacheKeyPattern, function(err, cacheRes) {
        if (err) return asyncCallback(err);

        keys = cacheRes.sort();

        return asyncCallback();
      })
    },
    // 设置指标
    function(asyncCallback) {
      async.eachSeries(keys, function(key, eachCallback) {
        var parsedKey = toolkit.parseCacheKey(key);
        var metric = parsedKey.tags.metric;
        var labels = parsedKey.tags;
        delete labels.metric;

        if (ignoreMetrics.indexOf(metric) >= 0) return eachCallback();

        // 初始化Prom指标
        var promMetric = METRIC_MAP[metric];
        if (!promMetric) {
          promMetric = new promClient.Gauge({
            name      : `DFF_${metric}`,
            help      : toolkit.splitCamel(metric) + ` (in recent ${interval_min} minutes)`,
            labelNames: Object.keys(labels),
          });
          METRIC_MAP[metric] = promMetric;
        }

        var now = parseInt(Date.now() / 1000);
        var opt = {
          start    : now - interval * 2,
          groupTime: interval,
          limit    : 2,
        };

        switch(metric) {
          case 'funcCallCount':
            opt.agg = 'sum';
            break;
        }

        res.locals.cacheDB.tsGet(key, opt, function(err, tsData) {
          if (err) return eachCallback(err);

          var value = 0;
          try { value = tsData[0][1] } catch(_) {}

          switch(metric) {
            case 'cacheDBKeyCountByPrefix':
              if (labels.prefix) {
                labels.prefix = toolkit.fromBase64(labels.prefix);
              }
              break
          }
          promMetric.labels(labels).set(value);

          return eachCallback();
        });
      }, asyncCallback);
    },
  ], function(err) {
    if (err) return next(err)

    promClient.register.metrics().then(function(data) {
      return res.locals.sendRaw(data);

    }) .catch(function(err) {
      return next(err)
    });
  });
};

/* 允许其他模块调用 */
exports._getFuncById                      = _getFuncById;
exports._createFuncCallOptionsFromOptions = _createFuncCallOptionsFromOptions;
exports._callFuncRunner                   = _callFuncRunner;
