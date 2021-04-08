'use strict';

/* Builtin Modules */

/* 3rd-party Modules */
var async        = require('async');
var LRU          = require('lru-cache');
var mqttWildcard = require('mqtt-wildcard');
var sortedJSON   = require('sorted-json');

/* Project Modules */
var E       = require('../utils/serverError');
var CONFIG  = require('../utils/yamlResources').get('CONFIG');
var toolkit = require('../utils/toolkit');

var logHelper    = require('../utils/logHelper');
var mqttHelper   = require('../utils/extraHelpers/mqttHelper');
var celeryHelper = require('../utils/extraHelpers/celeryHelper');

var funcMod             = require('../models/funcMod');
var dataSourceMod       = require('../models/dataSourceMod');
var datafluxFuncAPICtrl = require('../controllers/datafluxFuncAPICtrl');

var FUNC_CACHE_OPT = {
  max   : CONFIG._LRU_FUNC_CACHE_MAX,
  maxAge: CONFIG._LRU_FUNC_CACHE_MAX_AGE * 1000,
};
var FUNC_CACHE_LRU = new LRU(FUNC_CACHE_OPT);

var TOPIC_HANDLER_MAP = {};
var MQTT_BROKER_MAP   = {};

var DATA_SOURCE_REFRESH_TIMESTAMP_MAP = {};

module.exports = function(app, server) {
  function isBrokerChanged(a, b) {
    var CONNECTION_FIELDS = ['host', 'port', 'username', 'password', 'clientId'];
    for (var i = 0; i < CONNECTION_FIELDS.length; i++) {
      var f = CONNECTION_FIELDS[i];
      if (a[f] !== b[f]) {
        return true;
      }
    }

    function _dump(topicHandlers) {
      topicHandlers = topicHandlers || [];

      var m = {};
      topicHandlers.forEach(function(th) {
        if (!m[th.topic]) {
          m[th.topic] = [];
        }
        m[th.topic].push(th.funcId);
      });

      var dump = sortedJSON.sortify(m, {stringify: true, sortArray: true});
      return dump;
    }
    var aDump = _dump(a.topicHandlers);
    var bDump = _dump(b.topicHandlers);

    var isChanged = aDump !== bDump;
    return isChanged;
  };

  function getSubTopics(topicHandlers) {
    if (toolkit.isNothing(topicHandlers)) return [];

    var topics = topicHandlers.map(function(topicHandler) {
      return topicHandler.topic;
    });
    return topics;
  }

  function createHandler(dataSourceId, topicHandlers) {
    topicHandlers = topicHandlers || [];

    return function(topic, message, packet) {
      var triggerTime = parseInt(Date.now() / 1000);

      // 判断处理函数（可以有多个）
      var funcIds = topicHandlers.reduce(function(acc, x) {
        var matchTopic = x.topic.trim();
        var funcId     = x.funcId.trim();

        // MQTTv5 共享订阅
        if (toolkit.startsWith(matchTopic, '$share/')) {
          matchTopic = matchTopic.replace(/^\$share\/\w+\//, '');
        }
        // EMQX 共享订阅
        if (toolkit.startsWith(matchTopic, '$queue/')) {
          matchTopic = matchTopic.replace(/^\$queue\//, '');
        }

        if (matchTopic && funcId && mqttWildcard(topic, matchTopic)) {
          acc.push(funcId);
        }
        return acc;
      }, []);

      // 无处理函数则跳过
      if (funcIds.length <= 0) return;

      // 预处理消息
      try {
        // 优先尝试按JSON解析
        message = JSON.parse(message);

      } catch(err) {
        // 默认按String处理
        try {
          message = message.toString();

        } catch(err) {
          return app.locals.logger.logError(err);
        }
      }

      // 去除不必要内容
      delete packet.payload;

      // 执行函数
      var funcMap = {};
      async.series([
        // 查询处理函数详情
        function(asyncCallback) {
          // 从缓存查询
          var missedFuncIds = [];
          funcIds.forEach(function(funcId) {
            var func = FUNC_CACHE_LRU.get(funcId);
            if (func) {
              funcMap[funcId] = func;
            } else {
              missedFuncIds.push(funcId);
            }
          })

          if (missedFuncIds.length <= 0) return asyncCallback();

          // 从数据库中获取
          // 此处由于需要同时获取函数所在脚本的MD5值，需要使用`list`方法
          var funcModel = funcMod.createModel(app.locals);

          var opt = {
            filters: {
              'func.id': {in: missedFuncIds},
            }
          };
          funcModel.list(opt, function(err, dbRes) {
            if (err) return asyncCallback(err);

            dbRes.forEach(function(d) {
              funcMap[d.id] = d;
              FUNC_CACHE_LRU.set(d.id, d);
            });

            return asyncCallback();
          });
        },
        // 调用Worker执行
        function(asyncCallback) {
          async.eachSeries(funcIds, function(funcId, eachCallback) {
            var funcCallOptions = null;

            async.series([
              // 生成函数调用配置
              function(innerCallback) {
                var _func    = funcMap[funcId];
                var _kwargs  = { topic: topic, message: message, packet: packet };
                var _options = { originId: topic, unfold: true };
                datafluxFuncAPICtrl.createFuncCallOptionsFromOptions(_func, _kwargs, _options, function(err, _funcCallOptions) {
                  if (err) return innerCallback(err);

                  funcCallOptions = _funcCallOptions;

                  return innerCallback();
                });
              },
              // 发送任务
              function(innerCallback) {
                datafluxFuncAPICtrl.callFuncRunner(app.locals, funcCallOptions, function(err, ret, isCached) {
                  if (err) return app.locals.logger.logError(err);

                  /* 不需要对返回值进行任何处理 */

                  return innerCallback();
                });
              },
            ], eachCallback);
          }, asyncCallback);
        },
      ], function(err) {
        if (err) return app.locals.logger.logError(err);
      });
    }
  };

  function updateTopicHandlers(dataSourceId, callback) {
    var dataSourceModel = dataSourceMod.createModel(app.locals);

    var opt = {
      fields: ['id', 'configJSON'],
      filters: {
        'dsrc.type': { eq: 'mqtt' },
      }
    };
    if (dataSourceId) {
      opt.limit = 1;
      opt.filters['dsrc.id'] = { eq: dataSourceId };
    }

    dataSourceModel.list(opt, function(err, dbRes) {
      if (err) return app.locals.logger.logError(err);

      // 生成新主题处理表
      var nextTopicHandlerMap = null;
      if (dataSourceId) {
        // 单独更新
        nextTopicHandlerMap = toolkit.jsonCopy(TOPIC_HANDLER_MAP);

        if (dbRes.length > 0) {
          // 添加/更新
          var _configJSON = dbRes[0].configJSON;
          if (_configJSON.passwordCipher) {
            _configJSON.password = toolkit.decipherByAES(_configJSON.passwordCipher, CONFIG.SECRET);
            delete _configJSON.passwordCipher;
          }

          nextTopicHandlerMap[dataSourceId] = _configJSON;

        } else {
          // 删除
          delete nextTopicHandlerMap[dataSourceId];
        }
      } else {
        // 全部更新
        nextTopicHandlerMap = dbRes.reduce(function(acc, x) {
          if (x.configJSON.passwordCipher) {
            x.configJSON.password = toolkit.decipherByAES(x.configJSON.passwordCipher, CONFIG.SECRET);
            delete x.configJSON.passwordCipher;
          }

          acc[x.id] = x.configJSON;
          return acc;
        }, {});
      }

      var prevIds = Object.keys(TOPIC_HANDLER_MAP);
      var nextIds = Object.keys(nextTopicHandlerMap);

      // 新增Broker
      nextIds.forEach(function(id) {
        if (prevIds.indexOf(id) >= 0) return;

        app.locals.logger.debug(`[MQTT] Add broker: ${id}`);

        var mqttLogger = logHelper.createHelper(null, null, id);
        var subTopics = getSubTopics(nextTopicHandlerMap[id].topicHandlers);
        MQTT_BROKER_MAP[id] = mqttHelper.createHelper(mqttLogger, nextTopicHandlerMap[id], subTopics);
        MQTT_BROKER_MAP[id].handle(createHandler(id, nextTopicHandlerMap[id].topicHandlers));
      });

      // 删除Broker
      prevIds.forEach(function(id) {
        if (nextIds.indexOf(id) >= 0) return;

        app.locals.logger.debug(`[MQTT] Remove broker: ${id}`);

        if (MQTT_BROKER_MAP[id]) {
          MQTT_BROKER_MAP[id].end();
          delete MQTT_BROKER_MAP[id];
        }
      });

      // 更新Broker
      nextIds.forEach(function(id) {
        if (prevIds.indexOf(id) < 0) return;
        var isChanged = isBrokerChanged(TOPIC_HANDLER_MAP[id], nextTopicHandlerMap[id]);
        if (!isChanged) return;

        app.locals.logger.debug(`[MQTT] Update broker: ${id}`);

        if (MQTT_BROKER_MAP[id]) {
          MQTT_BROKER_MAP[id].end();
          delete MQTT_BROKER_MAP[id];
        }

        var mqttLogger = logHelper.createHelper(null, null, id);
        var subTopics = getSubTopics(nextTopicHandlerMap[id].topicHandlers);
        MQTT_BROKER_MAP[id] = mqttHelper.createHelper(mqttLogger, nextTopicHandlerMap[id], subTopics);
        MQTT_BROKER_MAP[id].handle(createHandler(id, nextTopicHandlerMap[id].topicHandlers));
      });

      TOPIC_HANDLER_MAP = nextTopicHandlerMap;
    });
  };

  setInterval(function() {
    var refreshedDataSourceIds = [];
    async.series([
      // 获取变更的数据源
      function(asyncCallback) {
        var cacheKeyPattern = toolkit.getCacheKey('cache', 'mqttRefreshTimestamp', ['id', '*']);
        app.locals.cacheDB.getByPattern(cacheKeyPattern, function(err, cacheRes) {
          if (err) return app.locals.logger.logError(err);

          for (var key in cacheRes) {
            var dataSourceId = toolkit.parseCacheKey(key).tags.id;
            var refreshTimestamp = cacheRes[key];

            if (DATA_SOURCE_REFRESH_TIMESTAMP_MAP[dataSourceId] !== refreshTimestamp) {
              DATA_SOURCE_REFRESH_TIMESTAMP_MAP[dataSourceId] = refreshTimestamp;
              refreshedDataSourceIds.push(dataSourceId);
            }
          }

          return asyncCallback();
        });
      },
      // 执行更新
      function(asyncCallback) {
        async.eachSeries(refreshedDataSourceIds, updateTopicHandlers, asyncCallback);
      },
    ], function(err) {
      if (err) return app.locals.logger.logError(err);
    });
  }, CONFIG._MQTT_BROKER_REFRESH_INTERVAL * 1000);

  updateTopicHandlers(null, function(err) {
    if (err) return app.locals.logger.logError(err);
  });
};
