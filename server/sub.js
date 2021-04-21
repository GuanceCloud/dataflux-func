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

function createSubscriber(dataSourceId) {
  // 初始化locals
  var locals = toolkit.createFakeLocals();

  locals.logger = logHelper.createHelper();

  locals.db = mysqlHelper.createHelper();
  locals.db.skipLog = true;

  locals.cacheDB = redisHelper.createHelper();
  locals.cacheDB.skipLog = true;

  // 查询数据源
  var dataSourceModel = dataSourceMod.createModel(locals);
  var opt = null;
  if (dataSourceId) {
    opt = {
      limit: 1,
      filters: {
        'dsrc.id': {eq: dataSourceId}
      },
    };
  }
  dataSourceModel.list(opt, function(err, dbRes) {
    if (err) return console.log(err);

    dbRes.forEach(function(d) {
      // 准备客户端参数
      if ('string' === typeof d.configJSON) {
        try { d.configJSON = JSON.parse(d.configJSON) } catch(_) {}
      }

      // 生成客户端
      var client = DATA_SOURCE_HELPER_MAP[d.type].createHelper(locals.logger, d.configJSON);

      // 订阅主题
      if (d.configJSON.topicHandlers) {
        d.configJSON.topicHandlers.forEach(function(th) {
          client.sub(th.topic, function(topic, message, packet) {
            // 发送任务
            var func            = null;
            var funcCallOptions = null;

            async.series([
              // 获取函数信息
              function(asyncCallback) {
                datafluxFuncAPICtrl.getFuncById(locals, th.funcId, function(err, _func) {
                  if (err) return asyncCallback(err);

                  func = _func;

                  return asyncCallback();
                });
              },
              // 生成函数调用配置
              function(asyncCallback) {
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
              console.log(err);
            });
          });
        });
      }

      // 清除原来的客户端
      if (CLIENT_MAP[d.id]) {
        CLIENT_MAP[d.id].end();
        delete CLIENT_MAP[d.id];
      }

      // 加入新客户端
      CLIENT_MAP[d.id]         = client;
      CLIENT_REFRESH_MAP[d.id] = Date.now();
    });
  });
};

function runListener() {
  // 首次运行创建所有的订阅器
  createSubscriber();

  // 定期检查
  function dataSourceChecker() {
    async.series([
      // 获取数据源刷新时间戳
      function(asyncCallback) {

      },
    ])
  };
  var dataSourceChecker = setInterval(dataSourceChecker, DATA_SOURCE_CHECK_INTERVAL);
};

