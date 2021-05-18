'use strict';

/* Builtin Modules */
var path = require('path');

/* 3rd-party Modules */
var async = require('async');

/* Project Modules */
var E           = require('./utils/serverError');
var CONFIG      = require('./utils/yamlResources').get('CONFIG');
var toolkit     = require('./utils/toolkit');
var logHelper   = require('./utils/logHelper');
var mysqlHelper = require('./utils/extraHelpers/mysqlHelper');
var redisHelper = require('./utils/extraHelpers/redisHelper');
var mqttHelper  = require('./utils/extraHelpers/mqttHelper');

var dataSourceMod       = require('./models/dataSourceMod');
var mainFuncAPICtrl = require('./controllers/mainFuncAPICtrl');

/* Configure */
var DATA_SOURCE_CHECK_INTERVAL = 3 * 1000;
var SUB_CLIENT_LOCK_EXPIRES    = 30;

var CLIENT_MAP         = {};
var CLIENT_REFRESH_MAP = {};

var DATA_SOURCE_HELPER_MAP = {
  redis: redisHelper,
  mqtt : mqttHelper,
};

function createMessageHandler(locals, handlerFuncId) {
  return function(topic, message, packet) {
    // 发送任务
    var func            = null;
    var funcCallOptions = null;

    async.series([
      // 获取函数信息
      function(asyncCallback) {
        mainFuncAPICtrl.getFuncById(locals, handlerFuncId, function(err, _func) {
          if (err) return asyncCallback(err);

          func = _func;

          return asyncCallback();
        });
      },
      // 生成函数调用配置
      function(asyncCallback) {
        topic   = topic.toString();
        message = message.toString();

        var _kwargs  = { topic: topic, message: message, packet: packet };
        var _options = { originId: topic, unfold: true };
        mainFuncAPICtrl.createFuncCallOptionsFromOptions(func, _kwargs, _options, function(err, _funcCallOptions) {
          if (err) return asyncCallback(err);

          funcCallOptions = _funcCallOptions;

          return asyncCallback();
        });
      },
      // 发送任务
      function(asyncCallback) {
        mainFuncAPICtrl.callFuncRunner(locals, funcCallOptions, function(err) {
          if (err) return asyncCallback(err);

          /* 不需要对返回值进行任何处理 */

          return asyncCallback();
        });
      },
    ], function(err) {
      if (err) return locals.logger.logError(err);
      locals.logger.debug('TOPIC: `{0}` -> FUNC: `{1}`', topic, func.id);
    });
  }
};

exports.runListener = function runListener(app) {
  var lockKey   = toolkit.getCacheKey('lock', 'subClient');
  var lockValue = toolkit.genRandString();
  app.locals.logger.info('Start subscriber... Lock: `{0}`', lockValue);

  // 定期检查
  function dataSourceChecker() {
    // 重建数据源客户端
    var dataSourceMap  = {};
    var refreshTimeMap = {};
    async.series([
      // 上锁
      function(asyncCallback) {
        app.locals.cacheDB.lock(lockKey, lockValue, SUB_CLIENT_LOCK_EXPIRES, function() {
          // 无法上锁可能为：
          //  1. 其他进程已经上锁
          //  2. 本进程已经上锁
          // 因此此处忽略上错失败错误
          return asyncCallback();
        });
      },
      // 续租锁
      function(asyncCallback) {
        app.locals.cacheDB.extendLockTime(lockKey, lockValue, SUB_CLIENT_LOCK_EXPIRES, function(err) {
          // 成功续租锁，则锁一定为本进程所获得，进入下一步
          if (!err) return asyncCallback();

          // 锁为其他进程获得，安全起见，清理本进程内的所有客户端
          for (var dataSourceId in CLIENT_MAP) {
            var _client = CLIENT_MAP[dataSourceId];
            if (_client) _client.end();
          }

          CLIENT_MAP         = {};
          CLIENT_REFRESH_MAP = {};
        });
      },
      // 获取数据源列表
      function(asyncCallback) {
        var dataSourceModel = dataSourceMod.createModel(app.locals);

        var opt = {
          fields: ['dsrc.id', 'dsrc.type', 'dsrc.configJSON'],
          filters: {
            'dsrc.type': {in: Object.keys(DATA_SOURCE_HELPER_MAP)},
          },
        };
        dataSourceModel.list(opt, function(err, dbRes) {
          if (err) return asyncCallback(err);

          dbRes.forEach(function(d) {
            d.configJSON = d.configJSON || {};

            if (!toolkit.isNothing(d.configJSON.topicHandlers)) {
              // 仅搜集配置了主题处理函数的数据源
              dataSourceMap[d.id] = d;
            }
          });

          return asyncCallback();
        });
      },
      // 获取数据源刷新时间
      function(asyncCallback) {
        var cacheKey = toolkit.getCacheKey('cache', 'dataSourceRefreshTimestampMap');
        app.locals.cacheDB.hgetall(cacheKey, function(err, cacheRes) {
          if (err) return asyncCallback(err);

          for (var dataSourceId in cacheRes) {
            refreshTimeMap[dataSourceId] = parseInt(cacheRes[dataSourceId]) || 0;
          }

          return asyncCallback();
        });
      },
      // 更新数据源订阅客户端
      function(asyncCallback) {
        // 清除已删除的客户端
        for (var dataSourceId in CLIENT_MAP) {
          if ('undefined' === typeof dataSourceMap[dataSourceId]) {
            CLIENT_MAP[dataSourceId].end();
            delete CLIENT_MAP[dataSourceId];
            delete CLIENT_REFRESH_MAP[dataSourceId];

            app.locals.logger.debug('[SUB] Client removed: `{0}`', dataSourceId);
          }
        }

        // 重建有变化的数据源客户端
        async.eachOfSeries(dataSourceMap, function(d, dataSourceId, eachCallback) {
          var localTime   = CLIENT_REFRESH_MAP[dataSourceId] || 0;
          var refreshTime = refreshTimeMap[dataSourceId]     || 0;

          if (refreshTime !== localTime) {
            app.locals.logger.debug('[SUB] Client refreshed: `{0}` remote=`{1}`, local=`{2}`, diff=`{3}`',
                dataSourceId, refreshTime, localTime, refreshTime - localTime);

            if (CLIENT_MAP[dataSourceId]) {
              CLIENT_MAP[dataSourceId].end();
              delete CLIENT_MAP[dataSourceId];
              delete CLIENT_REFRESH_MAP[dataSourceId];

              app.locals.logger.debug('[SUB] Client removed: `{0}`', dataSourceId);
            }
          }

          var client = CLIENT_MAP[dataSourceId];
          if (client) {
            return eachCallback();
          }

          // 生成客户端
          try {
            client = DATA_SOURCE_HELPER_MAP[d.type].createHelper(app.locals.logger, d.configJSON);
          } catch(err) {
            app.locals.logger.warning('[SUB] Client creating Error: `{0}`, reason: {1}', dataSourceId, err.toString());
            return eachCallback();
          }

          // 订阅主题
          if (!toolkit.isNothing(d.configJSON.topicHandlers)) {
            d.configJSON.topicHandlers.forEach(function(th) {
              client.sub(th.topic, createMessageHandler(app.locals, th.funcId));
            });
          }

          // 加入新客户端
          CLIENT_MAP[d.id]         = client;
          CLIENT_REFRESH_MAP[d.id] = refreshTimeMap[d.id] || 0;

          app.locals.logger.debug('[SUB] Client created: `{0}`', dataSourceId);
          return eachCallback();

        }, asyncCallback);
      },
    ], function(err) {
      if (err) return app.locals.logger.logError(err);
    });
  };
  var dataSourceChecker = setInterval(dataSourceChecker, DATA_SOURCE_CHECK_INTERVAL);
};
