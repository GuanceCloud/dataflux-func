'use strict';

/* Built-in Modules */

/* 3rd-party Modules */
var async      = require('async');
var sortedJSON = require('sorted-json');

/* Project Modules */
var E       = require('./utils/serverError');
var CONFIG  = require('./utils/yamlResources').get('CONFIG');
var toolkit = require('./utils/toolkit');

var connectorMod = require('./models/connectorMod');
var mainAPICtrl = require('./controllers/mainAPICtrl');

/* Init */
var IS_MASTER_NODE           = null;
var MASTER_LOCK_EXPIRES      = 15;
var CONNECTOR_CHECK_INTERVAL = 3 * 1000;

var CONNECTOR_HELPER_MAP = {
  redis: require('./utils/extraHelpers/redisHelper'),
  mqtt : require('./utils/extraHelpers/mqttHelper'),
  kafka: require('./utils/extraHelpers/kafkaHelper'),
};

// 简称 C.T.F
var CONNECTOR_TOPIC_FUNC_MAP = {};

function createMessageHandler(locals, connectorId, handlerFuncId) {
  return function(topic, message, packet, callback) {
    // 发送任务
    var taskReq    = null;
    var funcResult = null;
    async.series([
      // 生成函数调用配置
      function(asyncCallback) {
        var opt = {
          funcId: handlerFuncId,
          funcCallKwargs: {
            topic  : topic.toString(),
            message: message.toString(),
            // NOTE: 一般而言 topic 和 message 参数足矣。为减少数据传输量，暂不提供本参数
            // packet : packet,
          },
          origin  : 'connector',
          originId: connectorId,
          queue   : CONFIG._FUNC_TASK_QUEUE_SUB_HANDLER,
        }
        mainAPICtrl.createFuncRunnerTaskReq(locals, opt, function(err, _taskReq) {
          if (err) return asyncCallback(err);

          taskReq = _taskReq;

          return asyncCallback();
        });
      },
      // 发送任务
      function(asyncCallback) {
        mainAPICtrl.callFuncRunner(locals, taskReq, function(err, taskResp) {
          locals.logger.debug('[SUB] TOPIC: `{0}` -> FUNC: `{1}`', topic, handlerFuncId);

          if (err) return asyncCallback(err);

          // 提取结果
          try {
            funcResult = taskResp.result.returnValue;
          } catch(err) {
            funcResult = null;
          }

          locals.logger.debug('[SUB] FUNC: `{0}` -> `{1}`', handlerFuncId, JSON.stringify(funcResult));

          return asyncCallback();
        });
      },
    ], function(err) {
      if (err) locals.logger.logError(err);
      return callback(err, funcResult);
    });
  }
};

exports.runListener = function runListener(app) {
  var lockKey   = toolkit.getCacheKey('lock', 'subClient');
  var lockValue = toolkit.genRandString();
  app.locals.logger.info('Start subscribers... Lock: `{0}`', lockValue);

  // 定期检查连接器
  function connectorChecker() {
    // 重建连接器客户端
    var nextConnectorTopicFuncMap = {};
    async.series([
      // 上锁
      function(asyncCallback) {
        app.locals.cacheDB.lock(lockKey, lockValue, MASTER_LOCK_EXPIRES, function() {
          // 无法上锁可能为：
          //  1. 其他进程已经上锁
          //  2. 本进程已经上锁
          // 因此此处忽略上述失败错误
          return asyncCallback();
        });
      },
      // 续租锁
      function(asyncCallback) {
        app.locals.cacheDB.extendLockTime(lockKey, lockValue, MASTER_LOCK_EXPIRES, function(err) {
          if (!err) {
            // 成功续租锁，则锁一定为本进程所获得，进入下一步
            if (IS_MASTER_NODE === null || IS_MASTER_NODE === false) {
              app.locals.logger.debug('[SUB] Master Node');
            }

            IS_MASTER_NODE = true;

          } else {
            // 锁为其他进程获得，安全起见，清理本进程内的所有单订阅客户端
            if (IS_MASTER_NODE === null || IS_MASTER_NODE === true) {
              app.locals.logger.debug('[SUB] Non-Master Node');
            }

            IS_MASTER_NODE = false;

            for (var ctfKey in CONNECTOR_TOPIC_FUNC_MAP) {
              var connector = CONNECTOR_TOPIC_FUNC_MAP[ctfKey];
              if (connector && !connector.configJSON.multiSubClient) {
                connector.client.end();
                delete CONNECTOR_TOPIC_FUNC_MAP[ctfKey];
              }
            }
          }

          return asyncCallback();
        });
      },
      // 获取连接器列表
      function(asyncCallback) {
        var connectorModel = connectorMod.createModel(app.locals);
        connectorModel.decipher = true;

        var opt = {
          fields: [
            'cnct.id',
            'cnct.type',
            'cnct.configJSON',
            'MD5(cnct.configJSON) AS configMD5',
          ],
          filters: {
            'cnct.type': { in: Object.keys(CONNECTOR_HELPER_MAP) },
          },
        };
        connectorModel.list(opt, function(err, dbRes) {
          if (err) return asyncCallback(err);

          dbRes.forEach(function(d) {
            d.configJSON = d.configJSON || {};

            // 忽略没有配置主题处理函数的连接器
            if (toolkit.isNothing(d.configJSON.topicHandlers)) return;

            // 当前节点非单订阅节点时，忽略单订阅连接器
            if (!IS_MASTER_NODE && !d.configJSON.multiSubClient) return;

            // 连接器信息加入待创建表
            d.configJSON.topicHandlers.forEach(function(th) {
              var ctfKey = sortedJSON.sortify({
                'id'    : d.id,
                'topic' : th.topic,
                'funcId': th.funcId,
              }, {
                stringify: true,
              })
              nextConnectorTopicFuncMap[ctfKey] = toolkit.jsonCopy(d);
            });
          });

          return asyncCallback();
        });
      },
      // 更新连接器订阅客户端
      function(asyncCallback) {
        // 清除已不存在的连接器
        for (var ctfKey in CONNECTOR_TOPIC_FUNC_MAP) {
          if ('undefined' === typeof nextConnectorTopicFuncMap[ctfKey]) {
            CONNECTOR_TOPIC_FUNC_MAP[ctfKey].client.end();
            delete CONNECTOR_TOPIC_FUNC_MAP[ctfKey];

            app.locals.logger.debug('[SUB] Client removed: `{0}`', ctfKey);
          }
        }

        // 重建有变化的连接器客户端
        for (var ctfKey in nextConnectorTopicFuncMap) {
          var _tmp = JSON.parse(ctfKey);
          var topic  = _tmp.topic;
          var funcId = _tmp.funcId;

          var _next    = nextConnectorTopicFuncMap[ctfKey];
          var _current = CONNECTOR_TOPIC_FUNC_MAP[ctfKey];

          // 跳过无变化客户端
          if (_current && _current['configMD5'] && _current['configMD5'] === _next['configMD5']) {
            continue
          }

          // 删除客户端
          if (_current) {
            _current.client.end();
            delete CONNECTOR_TOPIC_FUNC_MAP[ctfKey];
            app.locals.logger.debug('[SUB] Client removed: `{0}`', ctfKey);
          }

          // 新建客户端
          try {
            // 订阅专用
            _next.configJSON.disablePub = true;
            _next.client = CONNECTOR_HELPER_MAP[_next.type].createHelper(app.locals.logger, _next.configJSON);
          } catch(err) {
            app.locals.logger.warning('[SUB] Client creating Error: `{0}`, reason: {1}', ctfKey, err.toString());
            continue
          }

          // 订阅主题
          _next.client.sub(topic, createMessageHandler(app.locals, _next.id, funcId));

          // 记录到本地
          CONNECTOR_TOPIC_FUNC_MAP[ctfKey] = _next;
          app.locals.logger.debug('[SUB] Client created: `{0}`', ctfKey);

          return asyncCallback();
        }
      },
    ], function(err) {
      if (err) return app.locals.logger.logError(err);
    });
  };
  setInterval(connectorChecker, CONNECTOR_CHECK_INTERVAL);

  // 消费触发
  async.forever(function(foreverCallback) {
    var subWorkerCount = 0;

    async.series([
      // 查询当前订阅处理工作单元数量
      function(asyncCallback) {
        var cacheKey = toolkit.getWorkerCacheKey('heartbeat', 'workerCountOnQueue', [
            'workerQueue', CONFIG._FUNC_TASK_QUEUE_SUB_HANDLER]);

        app.locals.cacheDB.get(cacheKey, function(err, cacheRes) {
          if (err) return timesCallback(err);

          subWorkerCount = parseInt(cacheRes || 0) || 0;

          return asyncCallback();
        });
      },
      // 所有订阅器执行 subWorkerCount 次消费
      function(asyncCallback) {
        var skip = false;

        // 无可用工作队列 / 无订阅对象时，跳过本轮处理
        if (subWorkerCount <= 0 || toolkit.isNothing(CONNECTOR_TOPIC_FUNC_MAP)) {
          skip = true;
        }

        // 跳过本轮时需要等待数秒
        if (skip === true) {
          return setTimeout(function() { asyncCallback() }, 3 * 1000);
        }

        var isAnyConsumed = false;
        async.eachOf(CONNECTOR_TOPIC_FUNC_MAP, function(connector, ctfKey, eachCallback) {
          async.times(subWorkerCount, function(n, timesCallback) {
            connector.client.consume(function(err, isConsumed){
              if (err) app.locals.logger.logError(err);

              if (isConsumed) {
                app.locals.logger.debug('CONNECTOR: `{0}` -> consumed', ctfKey);
                isAnyConsumed = true;

                // 记录最近消费时间
                var ctfKeyObj = JSON.parse(ctfKey);
                var cacheKey = toolkit.getCacheKey('cache', 'recentSubConsumeInfo', [
                  'connectorId', ctfKeyObj.id,
                  'topic',       ctfKeyObj.topic]);
                var consumeInfo = JSON.stringify({
                  funcId     : ctfKeyObj.funcId,
                  timestampMs: Date.now(),
                });
                app.locals.cacheDB.setex(cacheKey, CONFIG._SUB_RECENT_CONSUME_EXPIRE, consumeInfo);
              }

              // 出错不停止
              return timesCallback();
            });
          }, eachCallback);
        }, function() {
          if (isAnyConsumed) {
            // 有任意消费，立刻进入下一轮
            return asyncCallback();

          } else {
            // 没有任何消费，等待数秒进入下一轮
            return setTimeout(function() { asyncCallback() }, 3 * 1000);
          }
        });
      },
    ], foreverCallback);
  });
};
