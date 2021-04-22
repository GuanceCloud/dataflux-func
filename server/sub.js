'use strict';

/* Builtin Modules */
var path = require('path');

/* 3rd-party Modules */
var async = require('async');

/* Project Modules */
var toolkit = require('./utils/toolkit');

/* Load YAML resources */
var yamlResources = require('./utils/yamlResources');
var CONFIG = null;

var DATA_SOURCE_CHECK_INTERVAL = 3 * 1000;

var CLIENT_MAP         = {};
var CLIENT_REFRESH_MAP = {};

// Things should load AFTER config is loaded.
var logHelper   = null;
var mysqlHelper = null;
var redisHelper = null;

var dataSourceMod       = null;
var datafluxFuncAPICtrl = null;

var DATA_SOURCE_HELPER_MAP = null;

// Load extra YAML resources
yamlResources.loadConfig(path.join(__dirname, '../config.yaml'), function(err, _config, _userConfig) {
  if (err) throw err;

  CONFIG = _config;

  logHelper   = require('./utils/logHelper');
  mysqlHelper = require('./utils/extraHelpers/mysqlHelper');
  redisHelper = require('./utils/extraHelpers/redisHelper');

  dataSourceMod       = require('./models/dataSourceMod');
  datafluxFuncAPICtrl = require('./controllers/datafluxFuncAPICtrl');

  DATA_SOURCE_HELPER_MAP = {
    redis: require('./utils/extraHelpers/redisHelper'),
    mqtt : require('./utils/extraHelpers/mqttHelper'),
  };

  console.log('Start subscriber...');

  require('./appInit').beforeAppCreate(runListener);
});

function createMessageHandler(locals, handlerFuncId) {
  return function(topic, message, packet) {
    // 发送任务
    var func            = null;
    var funcCallOptions = null;

    async.series([
      // 获取函数信息
      function(asyncCallback) {
        datafluxFuncAPICtrl.getFuncById(locals, handlerFuncId, function(err, _func) {
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
        datafluxFuncAPICtrl.createFuncCallOptionsFromOptions(func, _kwargs, _options, function(err, _funcCallOptions) {
          if (err) return asyncCallback(err);

          funcCallOptions = _funcCallOptions;

          return asyncCallback();
        });
      },
      // 发送任务
      function(asyncCallback) {
        datafluxFuncAPICtrl.callFuncRunner(locals, funcCallOptions, function(err) {
          if (err) return asyncCallback(err);

          /* 不需要对返回值进行任何处理 */

          return asyncCallback();
        });
      },
    ], function(err) {
      if (err) return locals.logger.logError(err);
      locals.logger.debug(toolkit.strf('TOPIC: {0} -> FUNC: {1}', topic, func.id));
    });
  }
};

function runListener() {
  // 初始化locals
  var locals = toolkit.createFakeLocals();

  locals.logger = logHelper.createHelper();

  locals.db = mysqlHelper.createHelper();
  locals.db.skipLog = true;

  locals.cacheDB = redisHelper.createHelper();
  locals.cacheDB.skipLog = true;

  // 定期检查
  function dataSourceChecker() {
    // 重建数据源客户端
    var dataSourceMap  = {};
    var refreshTimeMap = {};
    async.series([
      // 获取数据源列表
      function(asyncCallback) {
        var dataSourceModel = dataSourceMod.createModel(locals);

        var opt = {
          fields: ['dsrc.id', 'dsrc.type', 'dsrc.configJSON'],
          filters: {
            'dsrc.type': {in: Object.keys(DATA_SOURCE_HELPER_MAP)},
          },
        };
        dataSourceModel.list(opt, function(err, dbRes) {
          if (err) return asyncCallback(err);

          dbRes.forEach(function(d) {
            dataSourceMap[d.id] = d;
          });

          return asyncCallback();
        });
      },
      // 获取数据源刷新时间
      function(asyncCallback) {
        var cacheKey = toolkit.getCacheKey('cache', 'dataSourceRefreshTimestampMap');
        locals.cacheDB.hgetall(cacheKey, function(err, cacheRes) {
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
          }
        }

        // 重建有变化的数据源客户端
        async.eachOfSeries(dataSourceMap, function(d, dataSourceId, eachCallback) {
          var localTime   = CLIENT_REFRESH_MAP[dataSourceId] || 0;
          var refreshTime = refreshTimeMap[dataSourceId]     || 0;

          if (refreshTime > localTime) {
            locals.logger.debug(toolkit.strf('CLIENT refreshed: `{0}` remote=`{1}`, local=`{2}`, diff=`{3}`',
                dataSourceId, refreshTime, localTime, refreshTime - localTime));

            if (CLIENT_MAP[dataSourceId]) {
              CLIENT_MAP[dataSourceId].end();
              delete CLIENT_MAP[dataSourceId];
              delete CLIENT_REFRESH_MAP[dataSourceId];

              locals.logger.debug(toolkit.strf('CLIENT removed: `{0}`', dataSourceId));
            }
          }

          var client = CLIENT_MAP[dataSourceId];
          if (client) {
            return eachCallback();
          }

          // 生成客户端
          client = DATA_SOURCE_HELPER_MAP[d.type].createHelper(locals.logger, d.configJSON);

          // 订阅主题
          d.configJSON.topicHandlers.forEach(function(th) {
            client.sub(th.topic, createMessageHandler(locals, th.funcId));
          });

          // 加入新客户端
          CLIENT_MAP[d.id]         = client;
          CLIENT_REFRESH_MAP[d.id] = refreshTimeMap[d.id] || 0;

          locals.logger.debug(toolkit.strf('CLIENT created: `{0}`', dataSourceId));
          return eachCallback();

        }, asyncCallback);
      },
    ], function(err) {
      if (err) return locals.logger.logError(err);
    });
  };
  var dataSourceChecker = setInterval(dataSourceChecker, DATA_SOURCE_CHECK_INTERVAL);
};
