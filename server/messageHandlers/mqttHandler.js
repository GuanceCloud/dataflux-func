'use strict';

/* Builtin Modules */

/* 3rd-party Modules */
var async        = require('async');
var LRU          = require('lru-cache');
var mqttWildcard = require('mqtt-wildcard');

/* Project Modules */
var E       = require('../utils/serverError');
var CONFIG  = require('../utils/yamlResources').get('CONFIG');
var toolkit = require('../utils/toolkit');

var mqttHelper   = require('../utils/extraHelpers/mqttHelper');
var celeryHelper = require('../utils/extraHelpers/celeryHelper');

var funcMod = require('../models/funcMod');
var datafluxFuncAPICtrl = require('../controllers/datafluxFuncAPICtrl');

var FUNC_CACHE_OPT = {
  max   : CONFIG._LRU_FUNC_CACHE_MAX,
  maxAge: CONFIG._LRU_FUNC_CACHE_MAX_AGE * 1000,
};
var INTEGRATION_FUNC_LRU = new LRU(FUNC_CACHE_OPT);

module.exports = function(app, server) {
  // 初始化
  var mqtt = mqttHelper.createHelper(app.locals.logger);

  // 转发处理
  function messageHandler(topic, message, packet) {
    console.log('[MQTT]', packet)
    var triggerTime = parseInt(Date.now() / 1000);

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

    var onMQTTFuncs = null;
    var onMQTTFunc  = null;
    var funcCallOptions    = null;
    async.series([
      // 查询对应topic的处理函数（附带缓存）
      function(asyncCallback) {
        onMQTTFuncs = INTEGRATION_FUNC_LRU.get('onMQTT');
        if (onMQTTFuncs) return asyncCallback();

        // 此处由于需要同时获取函数所在脚本的MD5值，需要使用`list`方法
        var funcModel = funcMod.createModel(app.locals);

        var opt = {
          filters: {
            'func.integration': {eq: 'onMQTT'},
          }
        };
        funcModel.list(opt, function(err, dbRes) {
          if (err) return asyncCallback(err);

          onMQTTFuncs = dbRes;

          // 建立缓存
          INTEGRATION_FUNC_LRU.set('onMQTT', onMQTTFuncs);

          return asyncCallback();
        });
      },
      // 创建函数调用选项
      function(asyncCallback) {
        // 判断目标函数
        if (onMQTTFuncs) {
          for (var i = 0; i < onMQTTFuncs.length; i++) {
            var func = onMQTTFuncs[i];

            var targetTopicPattern = '';
            try { targetTopicPattern = func.extraConfigJSON.integrationConfig.topic } catch(_) {}

            var isMatched = !!mqttWildcard(topic, targetTopicPattern);
            if (isMatched) {
              onMQTTFunc = func;
              break;
            }
          }
        }

        if (!onMQTTFunc) {
          return asyncCallback(new E('EClientNotFound', 'Func integrated to `onMQTT` not found.'));
        }

        var options = {
          funcId: onMQTTFunc.id,
          funcCallKwargs: {
            topic  : topic,
            message: message,
            packet : packet,
          },
          originId: topic,
        };
        datafluxFuncAPICtrl.createFuncCallOptionsFromOptions(options, onMQTTFunc, function(err, _funcCallOptions) {
          if (err) return asyncCallback(err);

          funcCallOptions = _funcCallOptions;

          return asyncCallback();
        });
      },
    ], function(err) {
      if (err) return app.locals.logger.logError(err);

      datafluxFuncAPICtrl.callFuncRunner(app.locals, funcCallOptions, function(err, ret, isCached) {
        if (err) return app.locals.logger.logError(err);

        /* 不需要对返回值进行任何处理 */
      });
    });
  }

  // 服务器订阅
  var subOpt = { qos: CONFIG.MQTT_SERVER_SUB_QOS };
  mqtt.sub(CONFIG.MQTT_SUB_TOPIC, subOpt, messageHandler, function(err, granted) {
    if (err) return app.locals.logger.logError(err);

    granted = granted[0];
    app.locals.logger.info(`[MQTT] Server subscribed topic ${granted.topic} on Qos=${granted.qos}`);

    app.locals.mqtt = mqtt;
  });
};
