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

var FUNC_TASK_DEFAULT_QUEUE_MAP = {
  'auto'   : CONFIG._FUNC_TASK_DEFAULT_QUEUE,
  'sync'   : CONFIG._FUNC_TASK_DEFAULT_QUEUE,
  'async'  : CONFIG._FUNC_TASK_DEFAULT_ASYNC_QUEUE,
  'crontab': CONFIG._FUNC_TASK_DEFAULT_CRONTAB_QUEUE,
}

var FUNC_LRU      = new LRU(FUNC_CACHE_OPT);
var AUTH_LINK_LRU = new LRU(FUNC_CACHE_OPT);
var BATCH_LRU     = new LRU(FUNC_CACHE_OPT);

var FUNC_RESULT_LRU = new LRU({
  max   : 2000,
  maxAge: 5 * 1000,
});

var WORKER_SYSTEM_CONFIG = null;

/* Handlers */
function _get_task_default_queue(execMode) {
  return FUNC_TASK_DEFAULT_QUEUE_MAP[execMode] || CONFIG._FUNC_TASK_DEFAULT_QUEUE;
};

function _createFuncCallOptions(req, res, funcId, origin, callback) {
  // 注意：
  //  本函数内所有搜集的时长类数据均为秒
  //  后续在_callFuncRunner 中转换为所需要类型（如：ISO8601格式等）

  var format = req.params.format;

  var func = null;
  async.series([
    // 查询函数信息
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
  ], function(err) {
    if (err) return callback(err);

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
    func.extraConfigJSON = func.extraConfigJSON || {};

    // 函数ID
    funcCallOptions.funcId = funcId;

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

    // 授权链接方式调用时，函数执行超时不得大于API超时
    //    超出时，函数执行超时自动跟随API超时
    switch(origin) {
      case 'authLink':
        if (funcCallOptions.timeout > funcCallOptions.apiTimeout) {
          funcCallOptions.timeout = funcCallOptions.apiTimeout;
        }
        break;
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
      funcCallOptions.queue = _get_task_default_queue(funcCallOptions.execMode);
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

    return callback(null, funcCallOptions);
  });
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

function _getFuncCallResultFromCache(req, res, funcCallOptions, callback) {
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
  res.locals.cacheDB.get(cacheKey, function(err, cacheRes) {
    if (err) return callback(err);

    if (cacheRes) {
      cacheRes = JSON.parse(cacheRes);
    }

    FUNC_RESULT_LRU.set(lruKey, cacheRes);
    return callback(err, cacheRes);
  });
};

function _checkWorkerQueuePressure(req, res, funcCallOptions, callback) {
  // 检查工作队列压力
  var funcPressure           = funcCallOptions.funcPressure;
  var workerCount            = 1;
  var workerQueuePressure    = 0;
  var workerQueueMaxPressure = CONFIG._WORKER_LIMIT_WORKER_QUEUE_PRESSURE_BASE;

  var workerQueuePressureCacheKey = toolkit.getWorkerCacheKey('cache', 'workerQueuePressure', [
        'workerQueue', funcCallOptions.queue]);

  var denyPercent = 0;
  async.series([
    // 查询工作单元数量
    function(asyncCallback) {
      var cacheKey = toolkit.getWorkerCacheKey('heartbeat', 'workerCount');
      res.locals.cacheDB.get(cacheKey, function(err, cacheRes) {
        if (err) return asyncCallback(err);

        if (cacheRes) {
          workerCount = parseInt(cacheRes);
          workerQueueMaxPressure = workerCount * CONFIG._WORKER_LIMIT_WORKER_QUEUE_PRESSURE_BASE;
        }

        return asyncCallback();
      });
    },
    // 查询队列压力
    function(asyncCallback) {
      res.locals.cacheDB.get(workerQueuePressureCacheKey, function(err, cacheRes) {
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
      res.locals.cacheDB.incrby(workerQueuePressureCacheKey, funcPressure, function(err, cacheRes) {
        if (err) return asyncCallback(err);

        var currentWorkerQueuePressure = parseInt(cacheRes);
        res.locals.logger.debug('<<< QUEUE PRESSURE >>> WorkerQueue#{0}: {1} (+{2}, {3}%), Deny: {4}%',
            funcCallOptions.queue, currentWorkerQueuePressure, funcPressure,
            parseInt(currentWorkerQueuePressure / workerQueueMaxPressure * 100),
            parseInt(denyPercent * 100));

        return asyncCallback();
      });
    },
  ], callback);
};

function _callFuncRunner(req, res, funcCallOptions, callback) {
  funcCallOptions = funcCallOptions || {};

  // 填入保护值
  var defaultFuncCallOptions = {
    origin  : 'UNKONW',           // 来源
    originId: res.locals.traceId, // 来源ID
  }
  for (var key in defaultFuncCallOptions) {
    if (toolkit.isNullOrUndefined(funcCallOptions[key])) {
      funcCallOptions[key] = defaultFuncCallOptions[key];
    }
  }

  // 计算函数参数MD5
  var funcCallKwargsDump = sortedJSON.sortify(funcCallOptions.funcCallKwargs, {
        stringify: true,
        sortArray: false});
  funcCallOptions.funcCallKwargsMD5 = toolkit.getMD5(funcCallKwargsDump);

  // 预期函数压力值
  funcCallOptions.funcPressure = CONFIG._WORKER_LIMIT_FUNC_PRESSURE_BASE // 后续从Redis中获取实际预期压力值

  // 函数执行任务Callback
  var onTaskCallback   = null;
  var onResultCallback = null;
  if (funcCallOptions.execMode === 'sync') {
    onResultCallback = function(celeryErr, celeryRes, extraInfo) {
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

          var ret = null;
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

          if (celeryRes.id === 'CACHED') {
            res.set('X-Result-Cache', 'Cached');
          }

          if (funcCallOptions.unfold) {
            res.locals.sendRaw(ret.data.result);
          } else {
            res.locals.sendJSON(ret);
          }

          // 保证执行到最终处理
          return asyncCallback();
        },
      ], function(err) {
        // 记录最近几天调用次数
        var dateStr = toolkit.getDateString();
        var cacheKey = toolkit.getWorkerCacheKey('cache', 'recentFuncRunningCount', [
            'funcId'  , funcCallOptions.funcId,
            'origin'  , funcCallOptions.origin,
            'originId', funcCallOptions.originId,
            'date'    , dateStr]);
        async.series([
          // 计数
          function(asyncCallback) {
            res.locals.cacheDB.incr(cacheKey, asyncCallback);
          },
          // 设置自动过期
          function(asyncCallback) {
            var expires = CONFIG._RECENT_FUNC_RUNNING_COUNT_EXPIRES;
            res.locals.cacheDB.expire(cacheKey, expires, asyncCallback);
          },
        ]);

        // 记录最近几次调用状态
        var cacheKey = toolkit.getWorkerCacheKey('cache', 'recentFuncRunningStatus', [
            'funcId'  , funcCallOptions.funcId,
            'origin'  , funcCallOptions.origin,
            'originId', funcCallOptions.originId]);
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
            res.locals.cacheDB.lpush(cacheKey, runningStatus, asyncCallback);
          },
          function(asyncCallback) {
            var limit = CONFIG._RECENT_FUNC_RUNNING_STATUS_LIMIT;
            res.locals.cacheDB.ltrim(cacheKey, 0, limit, asyncCallback);
          },
          // 设置自动过期
          function(asyncCallback) {
            var expires = CONFIG._RECENT_FUNC_RUNNING_STATUS_EXPIRES;
            res.locals.cacheDB.expire(cacheKey, expires, asyncCallback);
          },
        ]);

        if (err) return callback(err);
      });
    };

  } else {
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
        res.locals.cacheDB.lpush(cacheKey, JSON.stringify(taskInfo));
      }

      return res.locals.sendJSON(ret);
    };
  }

  async.series([
    // 获取函数预期压力值
    function(asyncCallback) {
      var funcPressure = CONFIG._WORKER_LIMIT_FUNC_PRESSURE_BASE;

      var cacheKey = toolkit.getWorkerCacheKey('cache', 'funcPressure', [
            'funcId'           , funcCallOptions.funcId,
            'funcCallKwargsMD5', funcCallOptions.funcCallKwargsMD5])

      res.locals.cacheDB.get(cacheKey, function(err, cacheRes) {
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
      // 非同步调用跳过
      if (funcCallOptions.execMode !== 'sync') return asyncCallback();

      _getFuncCallResultFromCache(req, res, funcCallOptions, function(err, cachedRetval) {
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
    // 真实调用函数前，检查队列压力
    function(asyncCallback) {
      if (!funcCallOptions.execMode === 'sync') asyncCallback();

      _checkWorkerQueuePressure(req, res, funcCallOptions, asyncCallback);
    },
  ], function(err) {
    if (err) return callback(err);

    // 真实调用函数

    // 处理队列别名
    if (toolkit.isNullOrUndefined(funcCallOptions.queue)) {
      funcCallOptions.queue = _get_task_default_queue(funcCallOptions.execMode);

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
          funcCallOptions.queue = _get_task_default_queue(funcCallOptions.execMode);

        } else {
          // 队列别名转换为队列编号
          funcCallOptions.queue = queueNumber;
        }
      }
    }

    var celery = celeryHelper.createHelper(res.locals.logger);

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

    var taskKwargs = {
      funcId           : funcCallOptions.funcId,
      funcCallKwargs   : funcCallOptions.funcCallKwargs,
      funcCallKwargsMD5: funcCallOptions.funcCallKwargsMD5,
      funcPressure     : funcCallOptions.funcPressure,
      origin           : funcCallOptions.origin,
      originId         : funcCallOptions.originId,
      execMode         : funcCallOptions.execMode,
      saveResult       : funcCallOptions.saveResult,
      triggerTimeMs    : funcCallOptions.triggerTimeMs,
      triggerTime      : funcCallOptions.triggerTime,
      queue            : funcCallOptions.queue,
    };
    celery.putTask(name, null, taskKwargs, taskOptions, onTaskCallback, onResultCallback);
  });
};

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

  var funcCallOptions = null;
  async.series([
    // 创建函数调用选项
    function(asyncCallback) {
      _createFuncCallOptions(req, res, funcId, 'direct', function(err, _funcCallOptions) {
        if (err) return asyncCallback(err);

        funcCallOptions = _funcCallOptions;

        return asyncCallback();
      });
    },
  ], function(err) {
    if (err) return next(err);

    _callFuncRunner(req, res, funcCallOptions, next);
  });
};

exports.callAuthLink = function(req, res, next) {
  var id     = req.params.id;
  var format = req.params.format;

  if (id && id.slice(0, AUTH_LINK_PREFIX.length) !== AUTH_LINK_PREFIX) {
    id = AUTH_LINK_PREFIX + id;
  }

  var authLink        = null;
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
    // 创建函数调用选项
    function(asyncCallback) {
      _createFuncCallOptions(req, res, authLink.funcId, 'authLink', function(err, _funcCallOptions) {
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

    _callFuncRunner(req, res, funcCallOptions, next);
  });
};

exports.callBatch = function(req, res, next) {
  var id     = req.params.id;
  var format = req.params.format;

  if (id && id.slice(0, BATCH_PREFIX.length) !== BATCH_PREFIX) {
    id = BATCH_PREFIX + id;
  }

  var batch           = null;
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
    // 创建函数调用选项
    function(asyncCallback) {
      _createFuncCallOptions(req, res, batch.funcId, 'batch', function(err, _funcCallOptions) {
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

    _callFuncRunner(req, res, funcCallOptions, next);
  });
};

exports.callFuncDraft = function(req, res, next) {
  // 函数，参数
  var funcId         = req.params.funcId;
  var funcCallKwargs = req.body.kwargs || {};

  var scriptId = funcId.split('.')[0];

  var scriptModel = scriptMod.createModel(req, res);

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
      queue            : CONFIG._FUNC_TASK_DEFAULT_QUEUE,
      resultWaitTimeout: CONFIG._FUNC_TASK_DEBUG_TIMEOUT * 1000,
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

    _FUNC_TASK_DEBUG_TIMEOUT      : CONFIG._FUNC_TASK_DEBUG_TIMEOUT,
    _FUNC_TASK_DEFAULT_TIMEOUT    : CONFIG._FUNC_TASK_DEFAULT_TIMEOUT,
    _FUNC_TASK_MIN_TIMEOUT        : CONFIG._FUNC_TASK_MIN_TIMEOUT,
    _FUNC_TASK_MAX_TIMEOUT        : CONFIG._FUNC_TASK_MAX_TIMEOUT,
    _FUNC_TASK_DEFAULT_API_TIMEOUT: CONFIG._FUNC_TASK_DEFAULT_API_TIMEOUT,
    _FUNC_TASK_MIN_API_TIMEOUT    : CONFIG._FUNC_TASK_MIN_API_TIMEOUT,
    _FUNC_TASK_MAX_API_TIMEOUT    : CONFIG._FUNC_TASK_MAX_API_TIMEOUT,

    _DBDATA_OPERATION_RECORD_LIMIT: CONFIG._DBDATA_OPERATION_RECORD_LIMIT,
    _DBDATA_SCRIPT_FAILURE_LIMIT  : CONFIG._DBDATA_SCRIPT_FAILURE_LIMIT,
    _DBDATA_SCRIPT_LOG_LIMIT      : CONFIG._DBDATA_SCRIPT_LOG_LIMIT,

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
