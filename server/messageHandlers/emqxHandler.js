'use strict';

/* Builtin Modules */

/* 3rd-party Modules */
var async        = require('async');
var mqttWildcard = require('mqtt-wildcard');

/* Project Modules */
var E       = require('../utils/serverError');
var CONFIG  = require('../utils/yamlResources').get('CONFIG');
var toolkit = require('../utils/toolkit');

var mqttHelper   = require('../utils/extraHelpers/mqttHelper');
var celeryHelper = require('../utils/extraHelpers/celeryHelper');

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
    var cacheKey = toolkit.getCacheKey('cache', 'integrationFunc', ['onMQTTMessage']);
    async.series([
      // 查询对应topic的处理函数（从缓存查询）
      function(asyncCallback) {
        app.locals.cacheDB.get(cacheKey, function(err, cacheRes) {
          if (err) return asyncCallback(err);

          if (cacheRes) {
            onMQTTMessageFuncs = JSON.parse(cacheRes);
          }

          return asyncCallback();
        });
      },
      // 查询对应topic的处理函数
      function(asyncCallback) {
        var sql = toolkit.createStringBuilder();
        sql.append('SELECT');
        sql.append('   id');
        sql.append('  ,extraConfigJSON');
        sql.append('FROM biz_main_func');
        sql.append('WHERE');
        sql.append("  integration = 'onMQTTMessage'");

        app.locals.db.query(sql, null, function(err, dbRes) {
          if (err) return asyncCallback(err);

          onMQTTMessageFuncs = dbRes;

          // 建立缓存
          var expires = CONFIG._INTEGRATION_FUNC_ID_CACHE_EXPIRES;
          return app.locals.cacheDB.setex(cacheKey, expires, JSON.stringify(onMQTTMessageFuncs), asyncCallback);
        });
      },
      // 发送任务
      function(asyncCallback) {
        // 判断目标函数
        var onMQTTMessageFunc = null;
        for (var i = 0; i < onMQTTMessageFuncs.length; i++) {
          var func = onMQTTMessageFuncs[i];

          var targetTopicPattern = '';
          try { targetTopicPattern = JSON.parse(func.extraConfigJSON).integrationConfig.topic } catch(_) {}

          var isMatched = !!mqttWildcard(topic, targetTopicPattern);
          if (isMatched) {
            onMQTTMessageFunc = func;
            break;
          }
        }

        if (!onMQTTMessageFunc) {
          app.locals.logger.warning('Func integrated to `onMQTTMessage` not found.');
          return asyncCallback();
        }

        // 创建函数调用选项
        var specifiedQueue = try {}

        // 函数调用参数
        var name = 'DataFluxFunc.runner';
        var kwargs = {
          funcId        : onMQTTMessageFunc.id,
          funcCallKwargs: {
            topic  : topic,
            message: message,
            packet : packet,
          },
          origin  : 'direct',
          originId: topic,
          execMode: 'sync',
          triggerTime: triggerTime,
          queue:
        };

        // 启动函数执行任务
        var celery = celeryHelper.createHelper(app.locals.logger);

        var taskOptions = {
          resultWaitTimeout: CONFIG._FUNC_TASK_DEFAULT_TIMEOUT * 1000,
        }
        celery.putTask(name, null, kwargs, taskOptions, null, function(err, celeryRes, extraInfo) {
          if (err) return asyncCallback(err);

          celeryRes = celeryRes || {};
          extraInfo = extraInfo || {};

          // 无法通过JSON.parse解析
          if ('string' === typeof celeryRes) {
            return asyncCallback(new E('EFuncResultParsingFailed', 'Function result is not standard JSON.', {
              etype: celeryRes.result && celeryRes.result.exc_type,
            }));
          }

          if (celeryRes.status === 'FAILURE') {
            // 正式调用发生错误只返回堆栈错误信息最后两行
            var einfoTEXT = celeryRes.einfoTEXT.trim().split('\n').slice(-2).join('\n').trim();

            if (celeryRes.einfoTEXT.indexOf('billiard.exceptions.SoftTimeLimitExceeded') >= 0) {
              // 超时错误
              return asyncCallback(new E('EFuncTimeout', 'Calling Function timeout.', {
                id       : celeryRes.id,
                etype    : celeryRes.result && celeryRes.result.exc_type,
                einfoTEXT: einfoTEXT,
              }));

            } else {
              // 其他错误
              return asyncCallback(new E('EFuncFailed', 'Calling Function failed.', {
                id       : celeryRes.id,
                etype    : celeryRes.result && celeryRes.result.exc_type,
                einfoTEXT: einfoTEXT,
              }));

            }

          } else if (extraInfo.status === 'TIMEOUT') {
            // API等待超时
            return asyncCallback(new E('EAPITimeout', 'Waiting function result timeout, but task is still running. Use task ID to fetch result later.', {
              id   : extraInfo.id,
              etype: celeryRes.result && celeryRes.result.exc_type,
            }));
          }

          // 函数返回False或没有实际意义内容
          var funcRetval = null;
          try { funcRetval = celeryRes.retval.raw } catch(_) {}
          if (toolkit.isNothing(funcRetval) || funcRetval === false) {
            return asyncCallback(new E('EFuncFailed.AuthEMQXFuncReturnedFalseOrNothing', 'Auth-EMQX function returned `False` or nothing.'));
          }

          // 登录成功
          return asyncCallback();
        });
      },
    ]);
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
