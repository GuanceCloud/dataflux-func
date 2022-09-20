'use strict';

/* Builtin Modules */
var path = require('path');

/* 3rd-party Modules */
var async = require('async');

/* Project Modules */
var E       = require('./utils/serverError');
var CONFIG  = require('./utils/yamlResources').get('CONFIG');
var toolkit = require('./utils/toolkit');

var connectorMod = require('./models/connectorMod');
var mainAPICtrl  = require('./controllers/mainAPICtrl');

/* Configure */
var CONNECTOR_CHECK_INTERVAL = 3 * 1000;
var SUB_CLIENT_LOCK_EXPIRES  = 30;

var CONNECTOR_HELPER_MAP = {
  redis: require('./utils/extraHelpers/redisHelper'),
  mqtt : require('./utils/extraHelpers/mqttHelper'),
  kafka: require('./utils/extraHelpers/kafkaHelper'),
};

var CONNECTOR_MAP = {};

function createMessageHandler(locals, handlerFuncId) {
  return function(topic, message, packet) {
    // 发送任务
    var func            = null;
    var funcCallOptions = null;

    async.series([
      // 获取函数信息
      function(asyncCallback) {
        mainAPICtrl._getFuncById(locals, handlerFuncId, function(err, _func) {
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
        var _options = { originId: topic };
        mainAPICtrl._createFuncCallOptionsFromOptions(func, _kwargs, _options, function(err, _funcCallOptions) {
          if (err) return asyncCallback(err);

          funcCallOptions = _funcCallOptions;

          return asyncCallback();
        });
      },
      // 发送任务
      function(asyncCallback) {
        mainAPICtrl._callFuncRunner(locals, funcCallOptions, function(err, ret) {
          locals.logger.debug('TOPIC: `{0}` -> FUNC: `{1}`', topic, func.id);

          if (err) return asyncCallback(err);

          // 提取结果
          try {
            ret = ret.data.result.raw;
          } catch(err) {
            ret = null;
          }

          locals.logger.debug('FUNC: `{0}` -> `{1}`', func.id, JSON.stringify(ret));

          return asyncCallback();
        });
      },
    ], function(err) {
      if (err) return locals.logger.logError(err);
    });
  }
};

exports.runListener = function runListener(app) {
  var lockKey   = toolkit.getCacheKey('lock', 'subClient');
  var lockValue = toolkit.genRandString();
  app.locals.logger.info('Start subscriber... Lock: `{0}`', lockValue);

  // 定期检查
  function connectorChecker() {
    // 重建连接器客户端
    var nextConnectorMap = {};
    async.series([
      // 上锁
      function(asyncCallback) {
        app.locals.cacheDB.lock(lockKey, lockValue, SUB_CLIENT_LOCK_EXPIRES, function() {
          // 无法上锁可能为：
          //  1. 其他进程已经上锁
          //  2. 本进程已经上锁
          // 因此此处忽略上述失败错误
          return asyncCallback();
        });
      },
      // 续租锁
      function(asyncCallback) {
        app.locals.cacheDB.extendLockTime(lockKey, lockValue, SUB_CLIENT_LOCK_EXPIRES, function(err) {
          if (!err) {
            // 成功续租锁，则锁一定为本进程所获得，进入下一步
            return asyncCallback();

          } else {
            // 锁为其他进程获得，安全起见，清理本进程内的所有客户端
            for (var connectorId in CONNECTOR_MAP) {
              var connector = CONNECTOR_MAP[connectorId];
              if (connector) {
                connector.client.end();
              }
            }

            CONNECTOR_MAP = {};

            // 由于锁由其他进程获得，不在向下处理
          }
        });
      },
      // 获取连接器列表
      function(asyncCallback) {
        var connectorModel = connectorMod.createModel(app.locals);

        var opt = {
          fields: [
            'cnct.id',
            'cnct.type',
            'cnct.configJSON',
            'MD5(cnct.configJSON) AS configMD5',
          ],
          filters: {
            'cnct.type': {in: Object.keys(CONNECTOR_HELPER_MAP)},
          },
        };
        connectorModel.list(opt, function(err, dbRes) {
          if (err) return asyncCallback(err);

          dbRes.forEach(function(d) {
            d.configJSON = d.configJSON || {};

            if (!toolkit.isNothing(d.configJSON.topicHandlers)) {
              // 仅搜集配置了主题处理函数的连接器
              nextConnectorMap[d.id] = d;
            }
          });

          return asyncCallback();
        });
      },
      // 更新连接器订阅客户端
      function(asyncCallback) {
        // 清除已不存在的连接器
        for (var connectorId in CONNECTOR_MAP) {
          if ('undefined' === typeof nextConnectorMap[connectorId]) {
            CONNECTOR_MAP[connectorId].client.end();
            delete CONNECTOR_MAP[connectorId];

            app.locals.logger.debug('[SUB] Client removed: `{0}`', connectorId);
          }
        }

        // 重建有变化的连接器客户端
        for (var connectorId in nextConnectorMap) {
          var _next    = nextConnectorMap[connectorId];
          var _current = CONNECTOR_MAP[connectorId];

          // 跳过无变化客户端
          if (_current && _current['configMD5'] && _current['configMD5'] === _next['configMD5']) {
            continue
          }

          // 删除客户端
          if (_current) {
            _current.client.end();
            delete CONNECTOR_MAP[connectorId];
            app.locals.logger.debug('[SUB] Client removed: `{0}`', connectorId);
          }

          // 新建客户端
          try {
            _next.client = CONNECTOR_HELPER_MAP[_next.type].createHelper(app.locals.logger, _next.configJSON);
          } catch(err) {
            app.locals.logger.warning('[SUB] Client creating Error: `{0}`, reason: {1}', connectorId, err.toString());
            continue
          }

          // 订阅主题
          if (!toolkit.isNothing(_next.configJSON.topicHandlers)) {
            _next.configJSON.topicHandlers.forEach(function(th) {
              _next.client.sub(th.topic, createMessageHandler(app.locals, th.funcId));
            });
          }

          // 记录到本地
          CONNECTOR_MAP[connectorId] = _next;
          app.locals.logger.debug('[SUB] Client created: `{0}`', connectorId);
        }
      },
    ], function(err) {
      if (err) return app.locals.logger.logError(err);
    });
  };
  var connectorChecker = setInterval(connectorChecker, CONNECTOR_CHECK_INTERVAL);
};
