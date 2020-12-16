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
  var emqx = mqttHelper.createHelper(app.locals.logger);

  // 转发处理
  function emqxHandler(topic, message, packet) {
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

    var onMQTTMessageFuncs = null;
    var onMQTTMessageFunc  = null;
    var funcCallOptions    = null;
    async.series([
      // 查询对应topic的处理函数（附带缓存）
      function(asyncCallback) {
        onMQTTMessageFuncs = INTEGRATION_FUNC_LRU.get('onMQTTMessage');
        if (onMQTTMessageFuncs) return asyncCallback();

        // 此处由于需要同时获取函数所在脚本的MD5值，需要使用`list`方法
        var funcModel = funcMod.createModel(app.locals);

        var opt = {
          filters: {
            'func.integration': {eq: 'onMQTTMessage'},
          }
        };
        funcModel.list(opt, function(err, dbRes) {
          if (err) return asyncCallback(err);

          onMQTTMessageFuncs = dbRes;

          // 建立缓存
          INTEGRATION_FUNC_LRU.set('onMQTTMessage', onMQTTMessageFuncs);

          return asyncCallback();
        });
      },
      // 创建函数调用选项
      function(asyncCallback) {
        // 判断目标函数
        if (onMQTTMessageFuncs) {
          for (var i = 0; i < onMQTTMessageFuncs.length; i++) {
            var func = onMQTTMessageFuncs[i];

            var targetTopicPattern = '';
            try { targetTopicPattern = func.extraConfigJSON.integrationConfig.topic } catch(_) {}

            var isMatched = !!mqttWildcard(topic, targetTopicPattern);
            if (isMatched) {
              onMQTTMessageFunc = func;
              break;
            }
          }
        }

        if (!onMQTTMessageFunc) {
          return asyncCallback(new E('EClientNotFound', 'Func integrated to `onMQTTMessage` not found.'));
        }

        var options = {
          funcId: onMQTTMessageFunc.id,
          funcCallKwargs: {
            topic  : topic,
            message: message,
            packet : packet,
          },
          originId: topic,
        };
        datafluxFuncAPICtrl.createFuncCallOptionsFromOptions(options, onMQTTMessageFunc, function(err, _funcCallOptions) {
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
  emqx.sub(CONFIG.MQTT_SERVER_TOPIC, subOpt, emqxHandler, function(err, granted) {
    if (err) return app.locals.logger.logError(err);

    granted = granted[0];
    app.locals.logger.info(`[EMQX] Server subscribed topic ${granted.topic} on Qos=${granted.qos}`);

    app.locals.emqx = emqx;
  });
};
