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

var FUNC_CACHE_OPT = {
  max   : 1000,
  maxAge: 15 * 1000,
};
var FUNC_LRU           = new LRU(FUNC_CACHE_OPT);
var AUTH_LINK_LRU      = new LRU(FUNC_CACHE_OPT);
var AUTH_LINK_FUNC_LRU = new LRU(FUNC_CACHE_OPT);
var BATCH_LRU          = new LRU(FUNC_CACHE_OPT);
var BATCH_FUNC_LRU     = new LRU(FUNC_CACHE_OPT);

var FUNC_RESULT_LRU = new LRU({
  max   : 2000,
  maxAge: 5 * 1000,
});

var WORKER_SYSTEM_CONFIG = null;

var DF_DATAWAY = new dataway.DataWay({
  url  : CONFIG._DF_DATAWAY_URL,
  token: CONFIG._DF_DATAWAY_TOKEN,
  debug: CONFIG._DF_DATAWAY_DEBUG,
});

/* Handlers */
function _monitorFunc(req, res, data, callback) {
  if (!CONFIG._ENABLE_FUNC_MONITOR) {
    return 'function' === callback ? callback() : null;
  }
  if (!DF_DATAWAY) {
    return 'function' === callback ? callback() : null;
  }

  /*
    最多消耗时间线
    假设：
      30个Studio函数
      50个开启授权链接的同步自定义函数
      20个开启授权链接的异步自定义函数

    |           函数类型           | funcId |  origin  | execMode |           status          | 共计 |
    |------------------------------|--------|----------|----------|---------------------------|------|
    | Studio函数                   |     30 | direct   | sync     | SUCCESS, FAILURE, TIMEOUT |   90 |
    | 开启授权链接的同步自定义函数 |     50 | authLink | sync     | SUCCESS, FAILURE, TIMEOUT |  150 |
    | 开启授权链接的异步自定义函数 |     20 | authLink | async    | SUCCESS, FAILURE, TIMEOUT |   60 |
    | 合计                         |    100 |          |          |                           |  300 |
  */

  var _status = null;
  var _error  = '';
  if (!data.error) {
    _status = 'SUCCESS';
  } else {
    _error = data.error.toString();

    if (data.error.info && data.error.info.reason === 'EFuncTimeout') {
      _status = 'TIMEOUT';
    } else {
      _status = 'FAILURE';
    }
  }

  var _cost = dataway.asInt(Date.now() - res.locals._requestStartTime);

  var scriptSetId = 'UNKNOW';
  var scriptId    = 'UNKNOW';
  var funcId      = data.funcId;
  if (funcId) {
    scriptSetId = funcId.split('__')[0];
    scriptId    = funcId.split('.')[0];
  } else {
    funcId = 'UNKNOW';
  }

  var monitorData = {
    measurement: 'func_call',
    tags: {
      scriptSetId: scriptSetId,
      scriptId   : scriptId,
      funcId     : funcId,
      origin     : data.origin   || 'UNKNOW', // direct|authLink
      execMode   : data.execMode || 'UNKNOW', // sync|async
      status     : _status       || 'UNKNOW', // SUCCESS|FAILURE|TIMEOUT
    },
    fields: {
      cost : _cost,
      error: _error,
    }
  };
  DF_DATAWAY.writePoint(monitorData, callback);
};

function _checkWorkerQueue(req, res, callback) {
  var workerQueueKey = toolkit.getWorkerQueue('runnerOnRPC');
  res.locals.cacheDB.llen(workerQueueKey, function(err, cacheRes) {
    if (err) return callback(err);

    var workerQueueLength = parseInt(cacheRes);
    if (workerQueueLength >= CONFIG._FUNC_TASK_WORKER_QUEUE_MAX_LENGTH) {
      return callback(new E('EWorkerQueueCongestion', 'Too many tasks in worker queue.', {
        workerQueueKey   : workerQueueKey,
        workerQueueLength: workerQueueLength,
      }));
    }

    return callback();
  });
};

function _createFuncCallKwargsOptions(req, res, origin) {
  var format = req.params.format;

  /*** 搜集函数参数（POST body优先） ***/
  var inputedFuncCallKwargs = req.body.kwargs || req.query.kwargs || {};
  if ('string' === typeof inputedFuncCallKwargs) {
    try {
      inputedFuncCallKwargs = JSON.parse(inputedFuncCallKwargs);
    } catch(err) {
      throw new E('EClientBadRequest', 'Invalid kwargs', {
        error: err.toString(),
      });
    }
  }

  /*** 搜集执行选项（POST body优先） ***/
  var inputedFuncCallOptions = req.body.options || req.query.options || {};
  if ('string' === typeof inputedFuncCallOptions) {
    try {
      inputedFuncCallOptions = JSON.parse(inputedFuncCallOptions);

    } catch(err) {
      throw new E('EClientBadRequest', 'Invalid options', {
        error: err.toString(),
      });
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
              inputedFuncCallKwargs[name] = v;
              break;

            case 'options':
              inputedFuncCallOptions[name] = v;
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

        inputedFuncCallKwargs[k] = v;
      }
      break;
  }

  /*** 检查执行选项并填入默认值 ***/
  //（由于存在GET请求方式，需要额外做参数检查）

  // 来源
  inputedFuncCallOptions.origin = origin;

  // 来源ID
  switch(origin) {
    case 'authLink':
    case 'batch':
      inputedFuncCallOptions.originId = req.params.id;
  }

  // API超时 apiTimeout
  if ('undefined' === typeof inputedFuncCallOptions.apiTimeout) {
    inputedFuncCallOptions.apiTimeout = CONFIG._FUNC_TASK_DEFAULT_API_TIMEOUT;
  } else {
    inputedFuncCallOptions.apiTimeout = parseInt(inputedFuncCallOptions.apiTimeout);

    if (inputedFuncCallOptions.apiTimeout < CONFIG._FUNC_TASK_MIN_API_TIMEOUT) {
      throw new E('EClientBadRequest', toolkit.strf('Invalid options: `apiTimeout` should be greater than or equal to `{0}`', CONFIG._FUNC_TASK_MIN_API_TIMEOUT));
    }
    if (inputedFuncCallOptions.apiTimeout > CONFIG._FUNC_TASK_MAX_API_TIMEOUT) {
      throw new E('EClientBadRequest', toolkit.strf('Invalid options: `apiTimeout` should be greater than or equal to `{0}`', CONFIG._FUNC_TASK_MAX_API_TIMEOUT));
    }
  }

  // 函数执行超时 timeout
  if ('undefined' === typeof inputedFuncCallOptions.timeout) {
    switch(origin) {
      case 'batch':
        inputedFuncCallOptions.timeout = CONFIG._FUNC_TASK_DEFAULT_BATCH_TIMEOUT;
        break;

      default:
        inputedFuncCallOptions.timeout = CONFIG._FUNC_TASK_DEFAULT_TIMEOUT;
        break;
    }
  } else {
    inputedFuncCallOptions.timeout = parseInt(inputedFuncCallOptions.timeout);

    if (inputedFuncCallOptions.timeout < CONFIG._FUNC_TASK_MIN_TIMEOUT || inputedFuncCallOptions.timeout > CONFIG._FUNC_TASK_MAX_TIMEOUT) {
      throw new E('EClientBadRequest', toolkit.strf('Invalid options: `timeout` should be between `{0}` and `{1}`', CONFIG._FUNC_TASK_MIN_TIMEOUT, CONFIG._FUNC_TASK_MAX_TIMEOUT));
    }
  }

  // 【固定】函数执行过期 timeoutToExpireScale
  switch(origin) {
    case 'batch':
      inputedFuncCallOptions.timeoutToExpireScale = CONFIG._FUNC_TASK_DEFAULT_BATCH_TIMEOUT_TO_EXPIRE_SCALE;
      break;

    default:
      inputedFuncCallOptions.timeoutToExpireScale = CONFIG._FUNC_TASK_TIMEOUT_TO_EXPIRE_SCALE;
      break;
  }

  // 返回类型 returnType
  var _RETURN_TYPES = ['ALL', 'raw', 'repr', 'jsonDumps'];
  if ('undefined' === typeof inputedFuncCallOptions.returnType) {
    inputedFuncCallOptions.returnType = 'raw';
  } else {
    if (_RETURN_TYPES.indexOf(inputedFuncCallOptions.returnType) < 0) {
      throw new E('EClientBadRequest', toolkit.strf('Invalid options：`returnType` should be one of `{0}`', _RETURN_TYPES.join(',')));
    }
  }

  // 执行模式 mode
  if ('undefined' === typeof inputedFuncCallOptions.mode) {
    switch(origin) {
      case 'batch':
        inputedFuncCallOptions.mode = 'batch';
        break;

      default:
        inputedFuncCallOptions.mode = 'sync';
        break;
    }
  } else {
    switch(origin) {
      case 'batch':
        if (inputedFuncCallOptions.mode !== 'batch') {
          throw new E('EClientBadRequest', 'Invalid options：`mode` of batch should be `batch`');
        }
        break;

      default:
        var _MODES = ['sync', 'async'];
        if (_MODES.indexOf(inputedFuncCallOptions.mode) < 0) {
          throw new E('EClientBadRequest', toolkit.strf('Invalid options：`mode` should be one of `{0}`', _MODES.join(',')));
        }
        break;
    }
  }

  // 结果保存 saveResult
  if ('undefined' === typeof inputedFuncCallOptions.saveResult) {
    inputedFuncCallOptions.saveResult = false;
  } else {
    inputedFuncCallOptions.saveResult = !!inputedFuncCallOptions.saveResult;
  }

  // 结果拆包 unfold
  if ('undefined' === typeof inputedFuncCallOptions.unfold) {
    switch(origin) {
      case 'direct':
        inputedFuncCallOptions.unfold = false;
        break;

      default:
        inputedFuncCallOptions.unfold = true;
        break;
    }
  } else {
    inputedFuncCallOptions.unfold = !!inputedFuncCallOptions.unfold;
  }

  // 预约执行 eta
  if ('undefined' === typeof inputedFuncCallOptions.eta) {
    inputedFuncCallOptions.eta = null;
  } else {
    if ('Invalid Date' === new Date('inputedFuncCallOptions.eta').toString()) {
      throw new E('EClientBadRequest', 'Invalid options：`eta` should be a valid datetime value');
    }
  }

  // 执行队列 queue
  if ('undefined' === typeof inputedFuncCallOptions.queue) {
    switch(origin) {
      case 'batch':
        inputedFuncCallOptions.queue = 'runnerOnBatch';
        break;

      default:
        inputedFuncCallOptions.queue = 'runnerOnRPC';
        break;
    }
  } else {
    switch(origin) {
      case 'batch':
        var _BATCH_QUEUES = ['runnerOnBatch', 'runnerOnBatchVIP'];
        if (_BATCH_QUEUES.indexOf(inputedFuncCallOptions.queue) < 0) {
          throw new E('EClientBadRequest', toolkit.strf('Invalid options：`queue` of batch should be one of `{0}`', _BATCH_QUEUES.join(',')));
        }

      default:
        if (inputedFuncCallOptions.queue !== 'runnerOnRPC') {
          throw new E('EClientBadRequest', 'Invalid options：`queue` should be `runnerOnRPC`');
        }
        break;
    }
  }

  // 触发时间 triggerTime
  inputedFuncCallOptions.triggerTime = parseInt(Date.now() / 1000);

  var _funcCallKwargsOptions = {
    inputedFuncCallKwargs : inputedFuncCallKwargs,
    inputedFuncCallOptions: inputedFuncCallOptions,
  };
  return _funcCallKwargsOptions;
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

function _getFuncCallResultFromCache(req, res, taskKwargs, scriptCodeMD5, scriptPublishVersion, callback) {
  var funcId = taskKwargs.funcId;
  var funcCallKwargsDump = sortedJSON.sortify(taskKwargs.funcCallKwargs, {
        stringify: true,
        sortArray: false});
  var funcCallKwargsMD5 = toolkit.getMD5(funcCallKwargsDump);

  // 1. 从本地缓存中获取
  var lruKey = toolkit.strf('{0}@{1}', funcId, funcCallKwargsMD5);
  var lruRes = FUNC_RESULT_LRU.get(lruKey);
  if (lruRes) {
    return callback(null, lruRes);
  }

  // 2. 从Redis中获取
  var cacheKey = toolkit.getWorkerCacheKey('cache', 'funcResult', [
      'funcId'              , funcId,
      'scriptCodeMD5'       , scriptCodeMD5,
      'scriptPublishVersion', scriptPublishVersion,
      'funcCallKwargsMD5'   , funcCallKwargsMD5]);
  res.locals.cacheDB.get(cacheKey, function(err, cacheRes) {
    if (err) return callback(err);

    if (cacheRes) {
      cacheRes = JSON.parse(cacheRes);
    }

    FUNC_RESULT_LRU.set(lruKey, cacheRes);
    return callback(err, cacheRes);
  });
};

function _callFuncRunner(req, res, kwargs, options, callback) {
  kwargs  = kwargs || {};
  options = options || {};

  // 填入默认值做保护
  var defaultKwargs = {
    saveResult    : false,
    origin        : 'UNKONW',
    execMode      : 'sync',
  }
  var defaultOptions = {
    origin              : 'UNKONW',
    originId            : res.locals.traceId,
    apiTimeout          : 30,
    timeout             : 30,
    timeoutToExpireScale: 10,
    returnType          : 'raw',
    mode                : 'sync',
    saveResult          : false,
    unfold              : false,
    eta                 : null,
    queue               : 'runnerOnRPC',
    triggerTime         : parseInt(Date.now() / 1000),
    cacheResult         : false
  }
  function setDefaultValue(obj, defaultObj) {
    for (var key in defaultObj) {
      if (toolkit.isNullOrUndefined(obj[key])) {
        obj[key] = defaultObj[key];
      }
    }
  }

  setDefaultValue(kwargs, defaultKwargs);
  setDefaultValue(options, defaultOptions);

  // 任务名
  var name = 'DataFluxFunc.runner';

  // 函数执行参数
  var taskKwargs = {
    funcId        : kwargs.funcId,
    funcCallKwargs: kwargs.funcCallKwargs,

    origin     : options.origin,
    originId   : options.originId,
    execMode   : options.mode,
    saveResult : options.saveResult,
    triggerTime: options.triggerTime,
  };

  // 函数执行选项
  var taskOptions = {
    id               : toolkit.genShortDataId('task'),
    queue            : options.queue,
    resultWaitTimeout: options.apiTimeout * 1000,
    eta              : options.eta ? toolkit.getISO8601(options.eta) : null,
    softTimeLimit    : options.timeout,
    timeLimit        : options.timeout + CONFIG._FUNC_TASK_EXTRA_TIMEOUT_TO_KILL,
    expires          : null,
  };

  if (!options.neverExpire) {
    var _shiftMS = parseInt(options.timeout * options.timeoutToExpireScale) * 1000;
    taskOptions.expires = toolkit.getISO8601(Date.now() + _shiftMS);
  }

  // 启动函数执行任务
  var onTaskCallback   = null;
  var onResultCallback = null;
  if (options.mode === 'sync') {
    onResultCallback = function(err, celeryRes, extraInfo) {
      if (err) return callback(err);

      celeryRes = celeryRes || {};
      extraInfo = extraInfo || {};

      // 无法通过JSON.parse解析
      if ('string' === typeof celeryRes) {
        return callback(new E('EFuncResultParsingFailed', 'Function result is not standard JSON.', {
          etype: celeryRes.result && celeryRes.result.exc_type,
        }));
      }

      if (celeryRes.status === 'FAILURE') {
        // 正式调用发生错误只返回堆栈错误信息最后两行
        var einfoTEXT = celeryRes.einfoTEXT.trim().split('\n').slice(-2).join('\n').trim();

        if (celeryRes.einfoTEXT.indexOf('billiard.exceptions.SoftTimeLimitExceeded') >= 0) {
          // 超时错误
          return callback(new E('EFuncTimeout', 'Calling Function timeout.', {
            id       : celeryRes.id,
            etype    : celeryRes.result && celeryRes.result.exc_type,
            einfoTEXT: einfoTEXT,
          }));

        } else {
          // 其他错误
          return callback(new E('EFuncFailed', 'Calling Function failed.', {
            id       : celeryRes.id,
            etype    : celeryRes.result && celeryRes.result.exc_type,
            einfoTEXT: einfoTEXT,
          }));
        }

      } else if (extraInfo.status === 'TIMEOUT') {
        // API等待超时
        return callback(new E('EAPITimeout', 'Waiting function result timeout, but task is still running. Use task ID to fetch result later.', {
          id   : extraInfo.id,
          etype: celeryRes.result && celeryRes.result.exc_type,
        }));
      }

      var result = celeryRes.retval;
      if (options.returnType && options.returnType !== 'ALL') {
        result = result[options.returnType];

        if (toolkit.isNullOrUndefined(result)) {
          result = null;
        }
      }

      var ret = null;
      if (options.saveResult) {
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

      if (celeryRes.id === 'CACHED') {
        res.set('X-Result-Cache', 'Cached');
      }

      if (options.unfold) {
        res.locals.sendRaw(ret.data.result);
      } else {
        res.locals.sendJSON(ret);
      }

      _monitorFunc(req, res, {
        funcId  : kwargs.funcId,
        origin  : kwargs.origin,
        execMode: kwargs.execMode,
      });
    };

  } else {
    onTaskCallback = function(err, taskId) {
      if (err) return callback(err);

      var ret = null;

      if (options.saveResult) {
        var resultURL = urlFor('datafluxFuncAPI.getFuncResult', {query: {taskId: taskId}});

        ret = toolkit.initRet({
          taskId   : taskId,
          resultURL: resultURL,
        });

      } else {
        ret = toolkit.initRet();
      }

      // 记录批处理任务信息（入队）
      if (options.origin === 'batch') {
        var cacheKey = toolkit.getWorkerCacheKey('syncCache', 'taskInfo');
        var taskInfo = {
          'taskId'     : taskId,
          'origin'     : options.origin,
          'originId'   : options.originId,
          'funcId'     : kwargs.funcId,
          'status'     : 'queued',
          'timestamp'  : parseInt(Date.now() / 1000),
        }
        res.locals.cacheDB.lpush(cacheKey, JSON.stringify(taskInfo));
      }

      return res.locals.sendJSON(ret);
    };
  }

  async.series([
    // 尝试从缓存中获取结果
    function(asyncCallback) {
      // 未指定缓存结果时跳过
      if (!options.cacheResult) return asyncCallback();
      // 非同步调用跳过
      if (options.mode !== 'sync') return asyncCallback();

      _getFuncCallResultFromCache(req, res, taskKwargs, options.scriptCodeMD5, options.scriptPublishVersion, function(err, cachedRetval) {
        if (err) {
          // 报错后改为真实调用函数
          res.locals.logger.logError(err);
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
      });
    },
    // 真实调用函数
    function(asyncCallback) {
      var celery = celeryHelper.createHelper(res.locals.logger);
      celery.putTask(name, null, taskKwargs, taskOptions, onTaskCallback, onResultCallback);
    },
  ]);
};

exports.integratedSignIn = function(req, res, next) {
  var funcId   = req.body.signIn.funcId;
  var username = req.body.signIn.username;
  var password = req.body.signIn.password;

  // 函数调用参数
  var name = 'DataFluxFunc.runner';
  var kwargs = {
    funcId: funcId,
    funcCallKwargs: {
      username: username,
      password: password,
    },
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
    queue            : 'runnerOnRPC',
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

exports.overview = function(req, res, next) {
  var scriptSetModel     = scriptSetMod.createModel(req, res);
  var scriptModel        = scriptMod.createModel(req, res);
  var funcModel          = funcMod.createModel(req, res);
  var dataSourceModel    = dataSourceMod.createModel(req, res);
  var envVariableModel   = envVariableMod.createModel(req, res);
  var authLinkModel      = authLinkMod.createModel(req, res);
  var crontabConfigModel = crontabConfigMod.createModel(req, res);
  var batchModel         = batchMod.createModel(req, res);

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
    scriptOverview  : null,
    latestOperations: [],
  };

  async.series([
    // 业务实体计数
    function(asyncCallback) {
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
    // 脚本总览
    function(asyncCallback) {
      scriptModel.overview(null, function(err, dbRes) {
        if (err) return asyncCallback(err);

        overview.scriptOverview = dbRes;

        return asyncCallback();
      });
    },
    // 最近若干次操作记录
    function(asyncCallback) {
      var operationRecordModel = operationRecordMod.createModel(req, res);

      var opt = {
        limit: 20,
      };
      operationRecordModel.list(opt, function(err, dbRes) {
        if (err) return asyncCallback(err);

        overview.latestOperations = dbRes;

        return asyncCallback();
      });
    },
  ], function(err) {
    if (err) return next(err);

    var ret = toolkit.initRet(overview);
    return res.locals.sendJSON(ret);
  });
};

exports.describeFunc = function(req, res, next) {
  var funcId = req.params.funcId;

  var funcModel = funcMod.createModel(req, res);

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

  var inputedFuncCallKwargs  = null;
  var inputedFuncCallOptions = null;

  try {
    var _funcCallKwargsOptions = _createFuncCallKwargsOptions(req, res, 'direct');
    inputedFuncCallKwargs  = _funcCallKwargsOptions.inputedFuncCallKwargs;
    inputedFuncCallOptions = _funcCallKwargsOptions.inputedFuncCallOptions;

  } catch(err) {
    return next(err);
  }

  var func = null;

  async.series([
    function(asyncCallback) {
      func = FUNC_LRU.get(funcId);
      if (func) return asyncCallback();

      // 此处由于需要同时获取函数所在脚本的MD5值，需要使用`list`方法
      var funcModel = funcMod.createModel(req, res);

      var opt = {
        limit  : 1,
        filters: {
          'func.id': {eq: funcId},
        }
      };
      funcModel.list(opt, function(err, dbRes) {
        if (err) return asyncCallback(err);

        dbRes = dbRes[0];
        if (!dbRes) {
          return asyncCallback(new E('EClientNotFound', toolkit.strf('No such function: `{0}`', funcId), {
            funcId: funcId,
          }));
        }

        func = dbRes;
        FUNC_LRU.set(funcId, func);

        return asyncCallback();
      });
    },
    // 检查工作队列
    function(asyncCallback) {
      _checkWorkerQueue(req, res, asyncCallback);
    },
  ], function(err) {
    if (err) {
      _monitorFunc(req, res, {
        funcId  : funcId,
        origin  : inputedFuncCallOptions.origin,
        execMode: inputedFuncCallOptions.mode,
        error   : err,
      });

      return next(err);
    }

    /*** 函数参数调整 ***/
    // 脚本摘要，用于函数结果缓存
    inputedFuncCallOptions.scriptCodeMD5        = func.scpt_codeMD5;
    inputedFuncCallOptions.scriptPublishVersion = func.scpt_publishVersion;

    // 函数超时 timeout
    if (func.extraConfigJSON && 'number' === typeof func.extraConfigJSON.timeout) {
      inputedFuncCallOptions.timeout = func.extraConfigJSON.timeout;
    }

    // 结果缓存 cacheResult
    if (func.extraConfigJSON && 'number' === typeof func.extraConfigJSON.cacheResult) {
      inputedFuncCallOptions.cacheResult = func.extraConfigJSON.cacheResult;
    }

    /*** 检查多余参数 ***/
    // for (var k in inputedFuncCallKwargs) if (inputedFuncCallKwargs.hasOwnProperty(k)) {
    //   if (!(k in func.kwargsJSON)) {
    //     var _err = new E('EClientBadRequest', 'Found unexpected function kwargs field', {
    //       funcId     : funcId,
    //       kwargsField: k,
    //       kwargsValue: inputedFuncCallKwargs[k],
    //     });

    //     _monitorFunc(req, res, {
    //       funcId  : funcId,
    //       origin  : inputedFuncCallOptions.origin,
    //       execMode: inputedFuncCallOptions.mode,
    //       error   : _err,
    //     });

    //     return next(_err);
    //   }
    // }

    // 函数调用参数
    var kwargs = {
      funcId        : funcId,
      funcCallKwargs: inputedFuncCallKwargs,
      saveResult    : inputedFuncCallOptions.saveResult,
      origin        : inputedFuncCallOptions.origin,
      execMode      : inputedFuncCallOptions.mode,
    };

    _callFuncRunner(req, res, kwargs, inputedFuncCallOptions, function(err) {
      if (!err) return;

      // 正常情况记录已经内置，此处只记录错误情况
      _monitorFunc(req, res, {
        funcId  : funcId,
        origin  : inputedFuncCallOptions.origin,
        execMode: inputedFuncCallOptions.mode,
        error   : err,
      });

      return next(err);
    });
  });
};

exports.callAuthLink = function(req, res, next) {
  var id     = req.params.id;
  var format = req.params.format;

  if (id && id.slice(0, AUTH_LINK_PREFIX.length) !== AUTH_LINK_PREFIX) {
    id = AUTH_LINK_PREFIX + id;
  }

  var inputedFuncCallKwargs  = null;
  var inputedFuncCallOptions = null;

  try {
    var _funcCallKwargsOptions = _createFuncCallKwargsOptions(req, res, 'authLink');
    inputedFuncCallKwargs  = _funcCallKwargsOptions.inputedFuncCallKwargs;
    inputedFuncCallOptions = _funcCallKwargsOptions.inputedFuncCallOptions;

  } catch(err) {
    return next(err);
  }

  var authLink = null;
  var func     = null;

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

      var authLinkModel = authLinkMod.createModel(req, res);

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
    // 检查函数是否存在
    function(asyncCallback) {
      func = AUTH_LINK_FUNC_LRU.get(authLink.funcId);
      if (func) return asyncCallback();

      // 此处由于需要同时获取函数所在脚本的MD5值，需要使用`list`方法
      var funcModel = funcMod.createModel(req, res);

      var opt = {
        limit  : 1,
        filters: {
          'func.id': {eq: authLink.funcId},
        }
      };
      funcModel.list(opt, function(err, dbRes) {
        if (err) return asyncCallback(err);

        dbRes = dbRes[0];
        if (!dbRes) {
          return asyncCallback(new E('EClientNotFound', toolkit.strf('No such function: `{0}`', funcId), {
            funcId: funcId,
          }));
        }

        func = dbRes;
        AUTH_LINK_FUNC_LRU.set(authLink.funcId, func);

        return asyncCallback();
      });
    },
    // 检查工作队列
    function(asyncCallback) {
      _checkWorkerQueue(req, res, asyncCallback);
    },
  ], function(err) {
    if (err) {
      if (func) {
        _monitorFunc(req, res, {
          funcId  : func.id,
          origin  : inputedFuncCallOptions.origin,
          execMode: inputedFuncCallOptions.mode,
          error   : err,
        });
      }

      return next(err);
    }

    /*** 函数参数调整 ***/
    // 脚本摘要，用于函数结果缓存
    inputedFuncCallOptions.scriptCodeMD5        = func.scpt_codeMD5;
    inputedFuncCallOptions.scriptPublishVersion = func.scpt_publishVersion;

    // 函数超时 timeout
    if (func.extraConfigJSON && 'number' === typeof func.extraConfigJSON.timeout) {
      inputedFuncCallOptions.timeout = func.extraConfigJSON.timeout;
    }

    // 结果缓存 cacheResult
    if (func.extraConfigJSON && 'number' === typeof func.extraConfigJSON.cacheResult) {
      inputedFuncCallOptions.cacheResult = func.extraConfigJSON.cacheResult;
    }

    /*** 合并参数 ***/
    var mergedFuncCallKwargs = null;
    try {
      mergedFuncCallKwargs = _mergeFuncCallKwargs(authLink.funcCallKwargsJSON, inputedFuncCallKwargs, format);

    } catch(err) {
      if (err instanceof E) {
        // 业务错误时补全脚本/函数信息
        err.detail.funcId = func.id;
      }

      _monitorFunc(req, res, {
        funcId  : func.id,
        origin  : inputedFuncCallOptions.origin,
        execMode: inputedFuncCallOptions.mode,
        error   : err,
      });

      return next(err);
    }

    // 函数调用参数
    var kwargs = {
      funcId        : func.id,
      funcCallKwargs: mergedFuncCallKwargs,
      saveResult    : inputedFuncCallOptions.saveResult,
      origin        : inputedFuncCallOptions.origin,
      execMode      : inputedFuncCallOptions.mode,
    };

    _callFuncRunner(req, res, kwargs, inputedFuncCallOptions, function(err) {
      if (!err) return;

      // 正常情况记录已经内置，此处只记录错误情况
      _monitorFunc(req, res, {
        funcId  : func.id,
        origin  : inputedFuncCallOptions.origin,
        execMode: inputedFuncCallOptions.mode,
        error   : err,
      });

      return next(err);
    });
  });
};

exports.callBatch = function(req, res, next) {
  var id     = req.params.id;
  var format = req.params.format;

  if (id && id.slice(0, BATCH_PREFIX.length) !== BATCH_PREFIX) {
    id = BATCH_PREFIX + id;
  }

  var inputedFuncCallKwargs  = null;
  var inputedFuncCallOptions = null;

  try {
    var _funcCallKwargsOptions = _createFuncCallKwargsOptions(req, res, 'batch');
    inputedFuncCallKwargs  = _funcCallKwargsOptions.inputedFuncCallKwargs;
    inputedFuncCallOptions = _funcCallKwargsOptions.inputedFuncCallOptions;

  } catch(err) {
    return next(err);
  }

  var batch = null;
  var func  = null;

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

      var batchModel = batchMod.createModel(req, res);

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
    // 检查函数是否存在
    function(asyncCallback) {
      func = BATCH_FUNC_LRU.get(batch.funcId);
      if (func) return asyncCallback();

      // 此处由于需要同时获取函数所在脚本的MD5值，需要使用`list`方法
      var funcModel = funcMod.createModel(req, res);

      var opt = {
        limit  : 1,
        filters: {
          'func.id': {eq: batch.funcId},
        }
      };
      funcModel.list(opt, function(err, dbRes) {
        if (err) return asyncCallback(err);

        dbRes = dbRes[0];
        if (!dbRes) {
          return asyncCallback(new E('EClientNotFound', toolkit.strf('No such function: `{0}`', funcId), {
            funcId: funcId,
          }));
        }

        func = dbRes;
        BATCH_FUNC_LRU.set(batch.funcId, func);

        return asyncCallback();
      });
    },
  ], function(err) {
    if (err) {
      if (func) {
        _monitorFunc(req, res, {
          funcId  : func.id,
          origin  : inputedFuncCallOptions.origin,
          execMode: inputedFuncCallOptions.mode,
          error   : err,
        });
      }

      return next(err);
    }

    /*** 函数参数调整 ***/
    // 脚本摘要，用于函数结果缓存
    inputedFuncCallOptions.scriptCodeMD5        = func.scpt_codeMD5;
    inputedFuncCallOptions.scriptPublishVersion = func.scpt_publishVersion;

    // 函数超时 timeout
    if (func.extraConfigJSON && 'number' === typeof func.extraConfigJSON.timeout) {
      inputedFuncCallOptions.timeout = func.extraConfigJSON.timeout;
    }

    // 结果缓存 cacheResult
    if (func.extraConfigJSON && 'number' === typeof func.extraConfigJSON.cacheResult) {
      inputedFuncCallOptions.cacheResult = func.extraConfigJSON.cacheResult;
    }

    // 执行队列 queue
    if (func.category === 'batchVIP') {
      inputedFuncCallOptions.queue = 'runnerOnBatchVIP';
    }

    /*** 合并参数 ***/
    var mergedFuncCallKwargs = null;
    try {
      mergedFuncCallKwargs = _mergeFuncCallKwargs(batch.funcCallKwargsJSON, inputedFuncCallKwargs, format);

    } catch(err) {
      if (err instanceof E) {
        // 业务错误时补全脚本/函数信息
        err.detail.funcId = func.id;
      }

      _monitorFunc(req, res, {
        funcId  : func.id,
        origin  : inputedFuncCallOptions.origin,
        execMode: inputedFuncCallOptions.mode,
        error   : err,
      });

      return next(err);
    }

    // 函数调用参数
    var kwargs = {
      funcId    : func.id,
      funcCallKwargs: mergedFuncCallKwargs,
      saveResult: inputedFuncCallOptions.saveResult,
      origin    : inputedFuncCallOptions.origin,
      execMode  : inputedFuncCallOptions.mode,
    };

    _callFuncRunner(req, res, kwargs, inputedFuncCallOptions, function(err) {
      if (err) {
        // 正常情况记录已经内置，此处只记录错误情况
        _monitorFunc(req, res, {
          funcId  : func.id,
          origin  : inputedFuncCallOptions.origin,
          execMode: inputedFuncCallOptions.mode,
          error   : err,
        });

        return next(err);
      }
    });
  });
};

exports.callFuncDraft = function(req, res, next) {
  // 函数，参数
  var funcId         = req.params.funcId;
  var funcCallKwargs = req.body.kwargs || {};

  var scriptId = funcId.split('.')[0];

  var scriptModel = scriptMod.createModel(req, res);

  async.series([
    function(asyncCallback) {
      scriptModel.getWithCheck(scriptId, null, asyncCallback);
    },
  ], function(err) {
    if (err) return next(err);

    // 函数调用参数
    var name = 'DataFluxFunc.debugger';
    var kwargs = {
      funcId    : funcId,
      funcCallKwargs: funcCallKwargs,
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
      queue            : 'runnerOnDebugger',
      resultWaitTimeout: CONFIG._FUNC_TASK_DEFAULT_TIMEOUT * 1000, // Debug模式固定等待默认时长
    }
    celery.putTask(name, null, kwargs, taskOptions, null, onResultCallback);
  });
};

exports.getFuncResult = function(req, res, next) {
  var taskId     = req.query.taskId;
  var returnType = req.query.returnType || 'raw';
  var unfold     = req.query.unfold;

  var dataProcessorTaskResultModel = dataProcessorTaskResultMod.createModel(req, res);
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

  var funcModel = funcMod.createModel(req, res);

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
  var authLinkModel = authLinkMod.createModel(req, res);

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
    MODE        : CONFIG.MODE,
    WEB_BASE_URL: CONFIG.WEB_BASE_URL,

    _FUNC_PKG_EXPORT_FILENAME           : CONFIG._FUNC_PKG_EXPORT_FILENAME,
    _FUNC_PKG_EXPORT_EXT                : CONFIG._FUNC_PKG_EXPORT_EXT,
    _FUNC_PKG_PASSWORD_LENGTH_RANGE_LIST: CONFIG._FUNC_PKG_PASSWORD_LENGTH_RANGE_LIST,

    _LIMIT_SCRIPT_LOG       : null,
    _LIMIT_SCRIPT_FAILURE   : null,
    _LIMIT_FUNC_RESULT      : null,
    _LIMIT_CRONTAB_TASK_INFO: null,
    _LIMIT_BATCH_TASK_INFO  : null,
    _LIMIT_OPERATION_RECORD : null,

    _INTEGRATED_SIGN_IN_FUNC: null,
  };

  var funcModel = funcMod.createModel(req, res);

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
    // 获取Worker配置
    function(asyncCallback) {
      if (WORKER_SYSTEM_CONFIG) {
        Object.assign(systemConfig, WORKER_SYSTEM_CONFIG);
        return asyncCallback();
      }

      var celery = celeryHelper.createHelper(res.locals.logger);

      var taskOptions = {
        queue            : 'utils',
        resultWaitTimeout: 10 * 1000,
      };
      celery.putTask('DataFluxFunc.getSystemConfig', null, null, taskOptions, null, function(err, celeryRes) {
        if (!err) {
          celeryRes = celeryRes || {};

          if (celeryRes.status === 'SUCCESS') {
            WORKER_SYSTEM_CONFIG = celeryRes.retval;
            Object.assign(systemConfig, WORKER_SYSTEM_CONFIG);
          }
        }

        return asyncCallback();
      });
    }
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
