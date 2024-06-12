'use strict';

/* Built-in Modules */

/* 3rd-party Modules */
var fs    = require('fs-extra');
var async = require('async');

/* Project Modules */
var E       = require('../utils/serverError');
var CONFIG  = require('../utils/yamlResources').get('CONFIG');
var toolkit = require('../utils/toolkit');

/* Init */

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
  var taskReq = req.body;
  taskReq.onResponse = function(taskResp) {
    res.locals.sendJSON(taskResp);
  }

  return res.locals.cacheDB.putTask(taskReq);
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
  var queues = toolkit.range(CONFIG._WORKER_QUEUE_COUNT);
  async.eachLimit(queues, 5, function(queue, eachCallback) {
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
