'use strict';

/* Builtin Modules */
var fs   = require('fs-extra');
var path = require('path');

/* 3rd-party Modules */
var async      = require('async');
var request    = require('request');
var LRU        = require('lru-cache');
var yaml       = require('js-yaml');
var sortedJSON = require('sorted-json');
var request    = require('request');

/* Project Modules */
var E       = require('../utils/serverError');
var CONFIG  = require('../utils/yamlResources').get('CONFIG');
var CONST   = require('../utils/yamlResources').get('CONST');
var toolkit = require('../utils/toolkit');
var urlFor  = require('../utils/routeLoader').urlFor;
var auth    = require('../utils/auth');

var scriptSetMod               = require('../models/scriptSetMod');
var scriptMod                  = require('../models/scriptMod');
var funcMod                    = require('../models/funcMod');
var dataSourceMod              = require('../models/dataSourceMod');
var envVariableMod             = require('../models/envVariableMod');
var authLinkMod                = require('../models/authLinkMod');
var crontabConfigMod           = require('../models/crontabConfigMod');
var batchMod                   = require('../models/batchMod');
var dataProcessorTaskResultMod = require('../models/dataProcessorTaskResultMod');
var operationRecordMod         = require('../models/operationRecordMod');

var funcAPICtrl = require('./funcAPICtrl');

var celeryHelper = require('../utils/extraHelpers/celeryHelper');
var dataway = require('./dataway');

var AUTH_LINK_PREFIX = authLinkMod.TABLE_OPTIONS.alias + '-';
var BATCH_PREFIX     = batchMod.TABLE_OPTIONS.alias    + '-';

var THROTTLING_RULE_EXPIRES_MAP = {
  bySecond: 1,
  byMinute: 60,
  byHour  : 60 * 60,
  byDay   : 60 * 60 * 24,
  byMonth : 60 * 60 * 24 * 30,
  byYear  : 60 * 60 * 24 * 365,
};

var FUNC_TASK_DEFAULT_QUEUE_MAP = {
  'auto'   : CONFIG._FUNC_TASK_DEFAULT_QUEUE,
  'sync'   : CONFIG._FUNC_TASK_DEFAULT_QUEUE,
  'async'  : CONFIG._FUNC_TASK_DEFAULT_ASYNC_QUEUE,
  'crontab': CONFIG._FUNC_TASK_DEFAULT_CRONTAB_QUEUE,
};

var FUNC_CACHE_OPT = {
  max   : CONFIG._LRU_FUNC_CACHE_MAX,
  maxAge: CONFIG._LRU_FUNC_CACHE_MAX_AGE * 1000,
};
var FUNC_LRU             = new LRU(FUNC_CACHE_OPT);
var AUTH_LINK_LRU        = new LRU(FUNC_CACHE_OPT);
var BATCH_LRU            = new LRU(FUNC_CACHE_OPT);
var INTEGRATION_FUNC_LRU = new LRU(FUNC_CACHE_OPT);

var FUNC_RESULT_LRU = new LRU({
  max   : CONFIG._LRU_FUNC_RESULT_CACHE_MAX,
  maxAge: CONFIG._LRU_FUNC_RESULT_CACHE_MAX_AGE * 1000,
});

var WORKER_SYSTEM_CONFIG = null;

/* Handlers */
function _getHTTPRequestInfo(req) {
  // 请求体
  var useragent = toolkit.jsonCopy(req.useragent);
  delete useragent.source;

  var httpRequest = {
    method     : req.method.toUpperCase(),
    originalUrl: req.originalUrl,
    url        : path.join(req.baseUrl, req.path),
    headers    : req.headers,
    cookies    : req.cookies,
    hostname   : req.hostname,
    ip         : req.ip,
    ips        : req.ips,
    protocol   : req.protocol,
    xhr        : req.xhr,
    useragent  : useragent,
  };
  return httpRequest;
}

function _getTaskDefaultQueue(execMode) {
  return FUNC_TASK_DEFAULT_QUEUE_MAP[execMode] || CONFIG._FUNC_TASK_DEFAULT_QUEUE;
};

function _getFuncById(locals, funcId, callback) {
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
      return callback(new E('EClientNotFound', toolkit.strf('No such function: `{0}`', funcId), {
        funcId: funcId,
      }));
    }

    func = dbRes;

    // 建立缓存
    FUNC_LRU.set(funcId, func);

    return callback(null, func);
  });
};

function _createFuncCallOptionsFromOptions(options, func, callback) {
  // 注意：
  //  本函数内所有搜集的时长类数据均为秒
  //  后续在_callFuncRunner 中转换为所需要类型（如：ISO8601格式等）

  func.extraConfigJSON = func.extraConfigJSON || {};

  var funcCallOptions = toolkit.jsonCopy(options);

  /*** 开始组装参数 ***/

  // 函数ID
  funcCallOptions.funcId = func.id;

  // 函数信息（用于函数结果缓存）
  funcCallOptions.scriptCodeMD5        = func.scpt_codeMD5;
  funcCallOptions.scriptPublishVersion = func.scpt_publishVersion;

  // 函数参数
  funcCallOptions.funcCallKwargs = options.funcCallKwargs;

  // 来源
  funcCallOptions.origin = 'direct';

  // 来源ID
  funcCallOptions.originId = options.originId || null;

  // API超时（优先级：调用时指定 > 函数配置 > 默认值）
  if (!toolkit.isNothing(funcCallOptions.apiTimeout)) {
    funcCallOptions.apiTimeout = parseInt(funcCallOptions.apiTimeout);

    if (funcCallOptions.apiTimeout < CONFIG._FUNC_TASK_MIN_API_TIMEOUT) {
      return callback(new E('EClientBadRequest', toolkit.strf('Invalid options: `apiTimeout` should be greater than or equal to `{0}`', CONFIG._FUNC_TASK_MIN_API_TIMEOUT)));
    }
    if (funcCallOptions.apiTimeout > CONFIG._FUNC_TASK_MAX_API_TIMEOUT) {
      return callback(new E('EClientBadRequest', toolkit.strf('Invalid options: `apiTimeout` should be greater than or equal to `{0}`', CONFIG._FUNC_TASK_MAX_API_TIMEOUT)));
    }

  } else if (!toolkit.isNothing(func.extraConfigJSON.apiTimeout)) {
    funcCallOptions.apiTimeout = func.extraConfigJSON.apiTimeout;

  } else {
    funcCallOptions.apiTimeout = CONFIG._FUNC_TASK_DEFAULT_API_TIMEOUT;
  }

  // 函数执行超时（优先级：调用时指定 > 函数配置 > 默认值）
  if (!toolkit.isNothing(funcCallOptions.timeout)) {
    funcCallOptions.timeout = parseInt(funcCallOptions.timeout);

    if (funcCallOptions.timeout < CONFIG._FUNC_TASK_MIN_TIMEOUT || funcCallOptions.timeout > CONFIG._FUNC_TASK_MAX_TIMEOUT) {
      return callback(new E('EClientBadRequest', toolkit.strf('Invalid options: `timeout` should be between `{0}` and `{1}`', CONFIG._FUNC_TASK_MIN_TIMEOUT, CONFIG._FUNC_TASK_MAX_TIMEOUT)));
    }

  } else if (!toolkit.isNothing(func.extraConfigJSON.timeout)) {
    funcCallOptions.timeout = func.extraConfigJSON.timeout;

  } else {
    funcCallOptions.timeout = CONFIG._FUNC_TASK_DEFAULT_TIMEOUT;
  }

  // 执行模式（优先级：调用时指定 > 默认值）
  funcCallOptions.execMode = funcCallOptions.execMode || 'sync';

  // 同步调用时，函数执行超时不得大于API超时
  //    超出时，函数执行超时自动跟随API超时
  if (funcCallOptions.execMode === 'sync') {
    if (funcCallOptions.timeout > funcCallOptions.apiTimeout) {
      funcCallOptions.timeout = funcCallOptions.apiTimeout;
    }
  }

  // 【固定】函数任务过期
  funcCallOptions.timeoutToExpireScale = CONFIG._FUNC_TASK_TIMEOUT_TO_EXPIRE_SCALE;

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
      return callback(new E('EClientBadRequest', toolkit.strf('Invalid options：`returnType` should be one of `{0}`', _RETURN_TYPES.join(','))));
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
    funcCallOptions.unfold = true;
  }

  // 预约执行
  if (!toolkit.isNothing(funcCallOptions.eta)) {
    if ('Invalid Date' === new Date('funcCallOptions.eta').toString()) {
      return callback(new E('EClientBadRequest', 'Invalid options：`eta` should be a valid datetime value'));
    }
  }

  // 执行队列（优先级：函数配置 > 默认值）
  if (!toolkit.isNothing(func.extraConfigJSON.queue)) {
    var queueNumber = parseInt(func.extraConfigJSON.queue);
    if (queueNumber < 1 || queueNumber > 9) {
      return callback(new E('EClientBadRequest', 'Invalid options：`queue` should be a integer between 1 and 9'));
    }

    funcCallOptions.queue = '' + func.extraConfigJSON.queue;

  } else {
    funcCallOptions.queue = _getTaskDefaultQueue(funcCallOptions.execMode);
  }

  // 触发时间
  funcCallOptions.triggerTimeMs = Date.now();
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
  funcCallOptions.httpRequest = null;

  return callback(null, funcCallOptions);
};

function _createFuncCallOptionsFromRequest(req, func, callback) {
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

  var format = req.params.format;

  /*** 搜集函数参数（POST body优先） ***/
  var funcCallKwargs = req.body.kwargs || req.query.kwargs || {};
  if ('string' === typeof funcCallKwargs) {
    try {
      funcCallKwargs = JSON.parse(funcCallKwargs);
    } catch(err) {
      return callback(new E('EClientBadRequest', 'Invalid kwargs', {
        error: err.toString(),
      }));
    }
  }

  /*** 搜集执行选项（POST body优先） ***/
  var funcCallOptions = req.body.options || req.query.options || {};
  if ('string' === typeof funcCallOptions) {
    try {
      funcCallOptions = JSON.parse(funcCallOptions);

    } catch(err) {
      return callback(new E('EClientBadRequest', 'Invalid options', {
        error: err.toString(),
      }));
    }
  }

  /*** 搜集执行选项（GET 扁平、简化形式） ***/
  switch(format) {
    case 'flattened':
      // 搜集扁平形式函数参数（options_*, kwargs_*）
      var flattenedQuery = toolkit.jsonCopy(req.query || {});
      for (var k in flattenedQuery) if (flattenedQuery.hasOwnProperty(k)) {
        var v = flattenedQuery[k];

        var keyParts = k.split('_');
        if (keyParts.length > 1) {
          var type = keyParts[0];
          var name = keyParts.slice(1).join('_');
          switch(type) {
            case 'kwargs':
              funcCallKwargs[name] = v;
              break;

            case 'options':
              funcCallOptions[name] = v;
              break;
          }
        }
      }
      break;

    case 'simplified':
      // 搜集简化形式函数参数
      var simplifiedQuery = toolkit.jsonCopy(req.query || {});
      for (var k in simplifiedQuery) if (simplifiedQuery.hasOwnProperty(k)) {
        var v = simplifiedQuery[k];

        funcCallKwargs[k] = v;
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
      return callback(new E('EClientBadRequest', toolkit.strf('Invalid options: `apiTimeout` should be greater than or equal to `{0}`', CONFIG._FUNC_TASK_MIN_API_TIMEOUT)));
    }
    if (funcCallOptions.apiTimeout > CONFIG._FUNC_TASK_MAX_API_TIMEOUT) {
      return callback(new E('EClientBadRequest', toolkit.strf('Invalid options: `apiTimeout` should be greater than or equal to `{0}`', CONFIG._FUNC_TASK_MAX_API_TIMEOUT)));
    }

  } else if (!toolkit.isNothing(func.extraConfigJSON.apiTimeout)) {
    funcCallOptions.apiTimeout = func.extraConfigJSON.apiTimeout;

  } else {
    funcCallOptions.apiTimeout = CONFIG._FUNC_TASK_DEFAULT_API_TIMEOUT;
  }

  // 函数执行超时（优先级：调用时指定 > 函数配置 > 默认值）
  if (!toolkit.isNothing(funcCallOptions.timeout)) {
    funcCallOptions.timeout = parseInt(funcCallOptions.timeout);

    if (funcCallOptions.timeout < CONFIG._FUNC_TASK_MIN_TIMEOUT || funcCallOptions.timeout > CONFIG._FUNC_TASK_MAX_TIMEOUT) {
      return callback(new E('EClientBadRequest', toolkit.strf('Invalid options: `timeout` should be between `{0}` and `{1}`', CONFIG._FUNC_TASK_MIN_TIMEOUT, CONFIG._FUNC_TASK_MAX_TIMEOUT)));
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
          return callback(new E('EClientBadRequest', toolkit.strf('Invalid options：`execMode` of `{0}` func call task should be `sync`', origin)));
        }
        break;

      case 'crontab':
      case 'batch':
        if (funcCallOptions.execMode !== 'async') {
          return callback(new E('EClientBadRequest', toolkit.strf('Invalid options：`execMode` of `{0}` func call task should be `async`', origin)));
        }
        break;

      default:
        var _EXEC_MODES = ['sync', 'async'];
        if (_EXEC_MODES.indexOf(funcCallOptions.execMode) < 0) {
          return callback(new E('EClientBadRequest', toolkit.strf('Invalid options：`execMode` should be one of `{0}`', _EXEC_MODES.join(','))));
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
      return callback(new E('EClientBadRequest', toolkit.strf('Invalid options：`returnType` should be one of `{0}`', _RETURN_TYPES.join(','))));
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
    switch(origin) {
      case 'direct':
        funcCallOptions.unfold = false;
        break;

      default:
        funcCallOptions.unfold = true;
        break;
    }
  }

  // 预约执行
  if (!toolkit.isNothing(funcCallOptions.eta)) {
    if ('Invalid Date' === new Date('funcCallOptions.eta').toString()) {
      return callback(new E('EClientBadRequest', 'Invalid options：`eta` should be a valid datetime value'));
    }
  }

  // 执行队列（优先级：函数配置 > 默认值）
  if (!toolkit.isNothing(func.extraConfigJSON.queue)) {
    var queueNumber = parseInt(func.extraConfigJSON.queue);
    if (queueNumber < 1 || queueNumber > 9) {
      return callback(new E('EClientBadRequest', 'Invalid options：`queue` should be a integer between 1 and 9'));
    }

    funcCallOptions.queue = '' + func.extraConfigJSON.queue;

  } else {
    funcCallOptions.queue = _getTaskDefaultQueue(funcCallOptions.execMode);
  }

  // 触发时间
  funcCallOptions.triggerTimeMs = Date.now();
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

function _mergeFuncCallKwargs(baseFuncCallKwargs, inputedFuncCallKwargs, format) {
  // 合并请求参数
  var mergedFuncCallKwargs = toolkit.jsonCopy(inputedFuncCallKwargs);
  for (var k in baseFuncCallKwargs) if (baseFuncCallKwargs.hasOwnProperty(k)) {
    var v = baseFuncCallKwargs[k];

    // 检查固定参数是否存在非法传递
    if (v !== 'FROM_PARAMETER') {
      if (k in mergedFuncCallKwargs && mergedFuncCallKwargs[k] !== v) {
        throw new E('EClientBadRequest', 'Found disallowed function kwargs field', {
          kwargsField: k,
          kwargsValue: mergedFuncCallKwargs[k],
        });
      }

      // 填入固定参数
      mergedFuncCallKwargs[k] = v;
    }
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

  var workerQueuePressureCacheKey = toolkit.getWorkerCacheKey('cache', 'workerQueuePressure', [
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
        if (CONFIG._WORKER_LIMIT_PRESSURE_ENABLED && Math.random() < denyPercent) {
          return asyncCallback(new E('EWorkerQueueCongestion', 'Too many tasks in worker queue.', {
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
    var name = 'DataFluxFunc.runner';

    // 生成Celery任务的kwargs, options
    var taskOptions = {
      id               : toolkit.genShortDataId('task'),
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

      var isCached = false;
      var ret      = null;

      async.series([
        // 结果处理
        function(asyncCallback) {
          if (celeryErr) return asyncCallback(celeryErr);

          celeryRes = celeryRes || {};
          extraInfo = extraInfo || {};

          // 无法通过JSON.parse解析
          if ('string' === typeof celeryRes) {
            return asyncCallback(new E('EFuncResultParsingFailed', 'Function result is not standard JSON.', {
              etype: celeryRes.result && celeryRes.result.exc_type,
            }));
          }

          if (celeryRes.status === 'FAILURE') {
            // 正式调用发生错误只返回堆栈错误信息最后两行
            var einfoTEXT = celeryRes.einfoTEXT.trim().split('\n').slice(-2).join('\n').trim();

            if (celeryRes.einfoTEXT.indexOf('billiard.exceptions.SoftTimeLimitExceeded') >= 0) {
              // 超时错误
              return asyncCallback(new E('EFuncTimeout', 'Calling Function timeout.', {
                id       : celeryRes.id,
                etype    : celeryRes.result && celeryRes.result.exc_type,
                einfoTEXT: einfoTEXT,
              }));

            } else {
              // 其他错误
              return asyncCallback(new E('EFuncFailed', 'Calling Function failed.', {
                id       : celeryRes.id,
                etype    : celeryRes.result && celeryRes.result.exc_type,
                einfoTEXT: einfoTEXT,
              }));
            }

          } else if (extraInfo.status === 'TIMEOUT') {
            // API等待超时
            return asyncCallback(new E('EAPITimeout', 'Waiting function result timeout, but task is still running. Use task ID to fetch result later.', {
              id   : extraInfo.id,
              etype: celeryRes.result && celeryRes.result.exc_type,
            }));
          }

          var result = celeryRes.retval;
          if (funcCallOptions.returnType && funcCallOptions.returnType !== 'ALL') {
            result = result[funcCallOptions.returnType];

            if (toolkit.isNullOrUndefined(result)) {
              result = null;
            }
          }

          if (funcCallOptions.saveResult) {
            var resultURL = urlFor('datafluxFuncAPI.getFuncResult', {query: {taskId: celeryRes.id}});

            ret = toolkit.initRet({
              result   : result,
              taskId   : celeryRes.id,
              resultURL: resultURL,
            });

          } else {
            ret = toolkit.initRet({
              result: result,
            });
          }

          // 缓存结果标记
          if (celeryRes.id === 'CACHED') {
            isCached = true
          }

          return asyncCallback();
        },
      ], function(err) {
        /* 1. 统计记录 */
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
              'authLinkId', funcCallOptions.originId, 'date', dateStr]);
          async.series([
            // 最近耗时推入队列
            function(asyncCallback) {
              var costMs = Date.now() - funcCallOptions.triggerTimeMs;
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
          ]);
        }

        /* 2. 最终回调 */
        return callback(err, ret, isCached);
      });
    };

    async.series([
      // 获取函数预期压力值
      function(asyncCallback) {
        var funcPressure = CONFIG._WORKER_LIMIT_FUNC_PRESSURE_BASE;

        var cacheKey = toolkit.getWorkerCacheKey('cache', 'funcPressure', [
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
        var resultURL = urlFor('datafluxFuncAPI.getFuncResult', {query: {taskId: taskId}});

        ret = toolkit.initRet({
          taskId   : taskId,
          resultURL: resultURL,
        });

      } else {
        ret = toolkit.initRet();
      }

      // 记录批处理任务信息（入队）
      if (funcCallOptions.origin === 'batch') {
        var cacheKey = toolkit.getWorkerCacheKey('syncCache', 'taskInfo');
        var taskInfo = {
          'taskId'     : taskId,
          'origin'     : funcCallOptions.origin,
          'originId'   : funcCallOptions.originId,
          'funcId'     : funcCallOptions.funcId,
          'status'     : 'queued',
          'timestamp'  : parseInt(Date.now() / 1000),
        }
        locals.cacheDB.lpush(cacheKey, JSON.stringify(taskInfo));
      }

      /* 最终回调 */
      return callback(err, ret);
    };

    return sendTask();
  }
};

function _doAPIResponse(locals, res, ret, isCached, unfold) {
  // 缓存标记
  if (res && isCached) {
    res.set('X-Result-Cache', 'Cached');
  }

  // 展开结果
  if (unfold) {
    return locals.sendRaw(ret.data.result);
  } else {
    return locals.sendJSON(ret);
  }
}

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

  var overviewParts = [
    { name : 'scriptSet',     model: scriptSetModel},
    { name : 'script',        model: scriptModel},
    { name : 'func',          model: funcModel},
    { name : 'dataSource',    model: dataSourceModel},
    { name : 'envVariable',   model: envVariableModel},
    { name : 'authLink',      model: authLinkModel},
    { name : 'crontabConfig', model: crontabConfigModel},
    { name : 'batch',         model: batchModel},
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
        var cacheKey = toolkit.getWorkerCacheKey('cache', 'workerQueuePressure', ['workerQueue', i])
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
    return res.locals.sendJSON(ret);
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
      _createFuncCallOptionsFromRequest(req, func, function(err, _funcCallOptions) {
        if (err) return asyncCallback(err);

        funcCallOptions = _funcCallOptions;

        return asyncCallback();
      });
    },
  ], function(err) {
    if (err) return next(err);

    _callFuncRunner(res.locals, funcCallOptions, function(err, ret, isCached) {
      if (err) return next(err);

      return _doAPIResponse(res.locals, res, ret, isCached, funcCallOptions.unfold);
    });
  });
};

exports.callAuthLink = function(req, res, next) {
  var id     = req.params.id;
  var format = req.params.format;

  if (id && id.slice(0, AUTH_LINK_PREFIX.length) !== AUTH_LINK_PREFIX) {
    id = AUTH_LINK_PREFIX + id;
  }

  var authLink        = null;
  var func            = null;
  var funcCallOptions = null;

  async.series([
    // 检查授权链接是否存在
    function(asyncCallback) {
      authLink = AUTH_LINK_LRU.get(id);

      if (authLink === null) {
        // 已查询过不存在
        return asyncCallback(new E('EClientNotFound', 'No such Auth Link', {id: id}));

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
          return asyncCallback(new E('EClientNotFound', 'No such Auth Link', {id: id}));
        }

        authLink = dbRes;
        AUTH_LINK_LRU.set(id, authLink);

        return asyncCallback();
      });
    },
    // 检查限制
    function(asyncCallback) {
      // 是否已禁用
      if (authLink.isDisabled) {
        return asyncCallback(new E('EBizCondition.AuthLinkDisabled', 'This Auth Link is disabled.'))
      }

      // 是否已过期
      if (authLink.expireTime && new Date(authLink.expireTime) < new Date()) {
        return asyncCallback(new E('EBizCondition.AuthLinkExpired', 'This Auth Link is already expired.'))
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
            return eachCallback(new E('EBizCondition.AuthLinkThrottling', 'Maximum sending rate exceeded.', {
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

        return asyncCallback();
      });
    },
    // 创建函数调用选项
    function(asyncCallback) {
      _createFuncCallOptionsFromRequest(req, func, function(err, _funcCallOptions) {
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

    _callFuncRunner(res.locals, funcCallOptions, function(err, ret, isCached) {
      if (err) return next(err);

      return _doAPIResponse(res.locals, res, ret, isCached, funcCallOptions.unfold);
    });
  });
};

exports.callBatch = function(req, res, next) {
  var id     = req.params.id;
  var format = req.params.format;

  if (id && id.slice(0, BATCH_PREFIX.length) !== BATCH_PREFIX) {
    id = BATCH_PREFIX + id;
  }

  var batch           = null;
  var func            = null;
  var funcCallOptions = null;

  async.series([
    // 检查批处理是否存在
    function(asyncCallback) {
      batch = BATCH_LRU.get(id);

      if (batch === null) {
        // 已查询过不存在
        return asyncCallback(new E('EClientNotFound', 'No such Batch', {id: id}));

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
          return asyncCallback(new E('EClientNotFound', 'No such Batch', {id: id}));
        }

        batch = dbRes;
        BATCH_LRU.set(id, batch);

        return asyncCallback();
      });
    },
    // 检查限制
    function(asyncCallback) {
      // 是否已禁用
      if (batch.isDisabled) {
        return asyncCallback(new E('EBizCondition.BatchDisabled', 'This Batch is disabled.'))
      }

      return asyncCallback();
    },
    // 获取函数
    function(asyncCallback) {
      _getFuncById(res.locals, batch.funcId, function(err, _func) {
        if (err) return asyncCallback(err);

        func = _func;

        return asyncCallback();
      });
    },
    // 创建函数调用选项
    function(asyncCallback) {
      _createFuncCallOptionsFromRequest(req, func, function(err, _funcCallOptions) {
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

      return _doAPIResponse(res.locals, res, ret);
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

    // 函数调用参数
    var name = 'DataFluxFunc.debugger';
    var kwargs = {
      funcId        : funcId,
      funcCallKwargs: funcCallKwargs,
      httpRequest   : _getHTTPRequestInfo(req),
    };

    // 启动函数执行任务
    var onResultCallback = function(err, celeryRes, extraInfo) {
      if (err) return next(err);

      celeryRes = celeryRes || {};
      extraInfo = extraInfo || {};

      // 无法通过JSON.parse解析
      if ('string' === typeof celeryRes) {
        return next(new E('EFuncResultParsingFailed', 'Function result is not standard JSON.'));
      }

      // 失败/超时
      if (celeryRes.status === 'FAILURE') {
        // 注意：由于预检查任务本身永远不会失败
        // 代码流程如果进入此处，必然是引擎内部故障
        return next(new E('EFuncFailed', 'Calling Function failed.', {
          id   : celeryRes.id,
          etype: celeryRes.result && celeryRes.result.exc_type,
          stack: celeryRes.einfoTEXT,
        }));

      } else if (extraInfo.status === 'TIMEOUT') {
        return next(new E('EFuncTimeout', 'Waiting function result timeout, but task is still running. Use task ID to fetch result later.', {
          id: extraInfo.id,
        }));
      }

      var ret = null;
      if (celeryRes.retval.stack) {
        // 脚本执行错误，手工包装
        ret = {
          ok     : false,
          error  : CONST.respCodeMap.EScriptPreCheck,
          message: 'Code pre-check failed. Script raised an EXCEPTION during executing, please check your code.',
          data   : {result: celeryRes.retval.result},
          reason : 'EScriptPreCheck',
          detail : {
            stack    : celeryRes.retval.stack,
            traceInfo: celeryRes.retval.traceInfo,
          },
        };
        res.status(parseInt(CONST.respCodeMap.EScriptPreCheck));

      } else {
        ret = toolkit.initRet(celeryRes.retval);
      }

      res.locals.sendJSON(ret);
    };

    var celery = celeryHelper.createHelper(res.locals.logger);

    var taskOptions = {
      queue            : CONFIG._FUNC_TASK_DEFAULT_DEBUG_QUEUE,
      resultWaitTimeout: CONFIG._FUNC_TASK_DEBUG_TIMEOUT * 1000,
    }
    celery.putTask(name, null, kwargs, taskOptions, null, onResultCallback);
  });
};

exports.getFuncResult = function(req, res, next) {
  var taskId     = req.query.taskId;
  var returnType = req.query.returnType || 'raw';
  var unfold     = req.query.unfold;

  var dataProcessorTaskResultModel = dataProcessorTaskResultMod.createModel(res.locals);
  dataProcessorTaskResultModel.getWithCheck(taskId, null, function(err, dbRes) {
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
  var name = req.query.name;

  var funcModel = funcMod.createModel(res.locals);

  var opt = {
    fileds: ['tagsJSON'],
  };
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
        url: urlFor('datafluxFuncAPI.callAuthLinkByGet', {
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

    _FUNC_PKG_EXPORT_FILENAME           : CONFIG._FUNC_PKG_EXPORT_FILENAME,
    _FUNC_PKG_EXPORT_EXT                : CONFIG._FUNC_PKG_EXPORT_EXT,
    _FUNC_PKG_PASSWORD_LENGTH_RANGE_LIST: CONFIG._FUNC_PKG_PASSWORD_LENGTH_RANGE_LIST,

    _FUNC_TASK_DEBUG_TIMEOUT      : CONFIG._FUNC_TASK_DEBUG_TIMEOUT,
    _FUNC_TASK_DEFAULT_TIMEOUT    : CONFIG._FUNC_TASK_DEFAULT_TIMEOUT,
    _FUNC_TASK_MIN_TIMEOUT        : CONFIG._FUNC_TASK_MIN_TIMEOUT,
    _FUNC_TASK_MAX_TIMEOUT        : CONFIG._FUNC_TASK_MAX_TIMEOUT,
    _FUNC_TASK_DEFAULT_API_TIMEOUT: CONFIG._FUNC_TASK_DEFAULT_API_TIMEOUT,
    _FUNC_TASK_MIN_API_TIMEOUT    : CONFIG._FUNC_TASK_MIN_API_TIMEOUT,
    _FUNC_TASK_MAX_API_TIMEOUT    : CONFIG._FUNC_TASK_MAX_API_TIMEOUT,

    _INTERNAL_KEEP_SCRIPT_FAILURE: CONFIG._INTERNAL_KEEP_SCRIPT_FAILURE,
    _INTERNAL_KEEP_SCRIPT_LOG    : CONFIG._INTERNAL_KEEP_SCRIPT_LOG,
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

  // 函数调用参数
  var name = 'DataFluxFunc.runner';
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
      return next(new E('EFuncResultParsingFailed', 'Function result is not standard JSON.'));
    }

    // 函数失败/超时
    if (celeryRes.status === 'FAILURE') {
      var errorMessage = null;
      try { errorMessage = celeryRes.exceptionMessage } catch(_) {}
      return next(new E('EFuncFailed.SignInFuncRaisedException', errorMessage));

    } else if (extraInfo.status === 'TIMEOUT') {
      return next(new E('EFuncFailed.SignInFuncTimeout', 'Sign-in function timeout.'));
    }

    // 函数返回False或没有实际意义内容
    var funcRetval = null;
    try { funcRetval = celeryRes.retval.raw } catch(_) {}
    if (toolkit.isNothing(funcRetval) || funcRetval === false) {
      return next(new E('EFuncFailed.SignInFuncReturnedFalseOrNothing', 'Sign-in function returned `False` or nothing.'));
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
    userId = toolkit.strf('igu_{0}-{1}', toolkit.getShortMD5(funcId), userId);

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

  var celery = celeryHelper.createHelper(res.locals.logger);

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
    res.locals.logger.debug('[MID] IN datafluxFuncAPICtrl.integratedAuthMid');
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
          res.locals.reqAuthError = new E('EUserAuth', 'Invalid x-auth-token.');
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
          res.locals.reqAuthError = new E('EUserAuth', 'x-auth-token is expired.');
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

/* 允许其他模块调用 */
exports.createFuncCallOptionsFromOptions = _createFuncCallOptionsFromOptions;
exports.callFuncRunner                   = _callFuncRunner;
