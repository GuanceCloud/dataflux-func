'use strict';

/* Built-in Modules */

/* 3rd-party Modules */
var async = require('async');

/* Project Modules */
var fs      = require('fs-extra');
var E       = require('../utils/serverError');
var CONFIG  = require('../utils/yamlResources').get('CONFIG');
var toolkit = require('../utils/toolkit');

var celeryHelper = require('../utils/extraHelpers/celeryHelper');

/* Configure */

/* Handlers */
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
          // 默认从尾部读取
          startPosition = stat.size - (1024 * 100);
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

exports.putTask = function(req, res, next) {
  var celery = celeryHelper.createHelper(res.locals.logger);

  var waitResult = toolkit.toBoolean(req.body.waitResult);
  var times      = req.body.times || 1;

  var name   = req.body.task.name;
  var args   = req.body.task.args   || [];
  var kwargs = req.body.task.kwargs || {};

  var taskOptions = req.body.task.options || {};

  if (toolkit.notNothing(taskOptions.eta)) {
    taskOptions.eta = toolkit.getISO8601(taskOptions.eta);
  }
  if (toolkit.notNothing(taskOptions.expires)) {
    taskOptions.expires = toolkit.getISO8601(taskOptions.expires);
  }

  if (times <= 1) {
    var callback         = null;
    var onResultCallback = null;

    if (waitResult) {
      onResultCallback = function(err, celeryRes, extraInfo) {
        if (err) return next(err);

        celeryRes = celeryRes || {};
        extraInfo = extraInfo || {};

        if (celeryRes.status === 'FAILURE') {
          return next(new E('ESysAsyncTaskFailed', 'Async task failed', {
            id   : celeryRes.id,
            etype: celeryRes.result && celeryRes.result.exc_type,
            stack: celeryRes.einfoTEXT || 'No error stack',
          }));

        } else if (extraInfo.status === 'TIMEOUT') {
          return next(new E('ESysAsyncTaskTimeout', 'Wait async task result timeout, but task is still running. Use task ID to fetch result later', {
            id   : extraInfo.id,
            etype: celeryRes.result && celeryRes.result.exc_type,
          }));
        }

        var ret = toolkit.initRet({
          id    : celeryRes.id,
          result: celeryRes.retval,
        });
        res.locals.sendJSON(ret);
      }

    } else {
      callback = function(err, taskId) {
        if (err) return next(err);

        var ret = toolkit.initRet({id: taskId});
        res.locals.sendJSON(ret);
      }
    }
    celery.putTask(name, args, kwargs, taskOptions, callback, onResultCallback);

  } else {
    async.times(times, function(i, nextCallback) {
      var _taskOptions = toolkit.jsonCopy(taskOptions);
      _taskOptions.id = toolkit.strf('{0}-{1}', res.locals.traceId, i);
      celery.putTask(name, args, kwargs, _taskOptions, nextCallback);

    }, function(err) {
      if (err) return next(err);

      var ret = toolkit.initRet();
      res.locals.sendJSON(ret);
    });
  }
};

exports.testAPIBehavior = function(req, res, next) {
  var scenario = req.query.scenario;

  switch(scenario) {
    case 'ok':
      res.locals.sendJSON({ message: 'ok' });
      break;

    case 'error':
      next(Error('Test Error'));
      break;

    case 'unhandledError':
      throw new Error('Test Unhandled Error');
      break;

    case 'unhandledAsyncError':
      async.series([
        function(asyncCallback) {
          throw new Error('Test Unhandled Async Error');
        },
      ], function(err) {
        if (err) return next(err);
        res.locals.sendJSON();
      });
      break;

    case 'slowResponse':
      setTimeout(function() {
        res.locals.sendJSON();
      }, 3 * 1000);
      break;
  }
};

exports.clearWorkerQueues = function(req, res, next) {
  async.eachLimit(CONFIG._MONITOR_WORKER_QUEUE_LIST, 5, function(queue, eachCallback) {
    var workerQueue = toolkit.getWorkerQueue(queue);
    res.locals.cacheDB.ltrim(workerQueue, 1, 0, eachCallback);

  }, function(err) {
    if (err) return next(err);
    return res.locals.sendJSON();
  });
};

exports.clearLogCacheTables = function(req, res, next) {
  var tables = CONFIG._DBDATA_LOG_CACHE_TABLE_LIST;

  async.eachSeries(tables, function(t, asyncCallback) {
    var sqlParams = [ t ];

    var sql = 'SHOW TABLES LIKE ?';
    res.locals.db.query(sql, sqlParams, function(err, dbRes) {
      if (err) return asyncCallback(err);
      if (dbRes.length <= 0) return asyncCallback();

      var sql = 'TRUNCATE ??';
      res.locals.db.query(sql, sqlParams, asyncCallback);
    });
  }, function(err) {
    if (err) return next(err);
    return res.locals.sendJSON();
  });
};
