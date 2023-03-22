'use strict';

/* Built-in Modules */

/* 3rd-party Modules */
var async      = require('async');
var socketIO   = require('socket.io-client');
var sortedJSON = require('sorted-json');

/* Project Modules */
var E          = require('./utils/serverError');
var CONFIG     = require('./utils/yamlResources').get('CONFIG');
var toolkit    = require('./utils/toolkit');
var IMAGE_INFO = require('../image-info.json');

var systemConfigMod = require('./models/systemConfigMod');
var connectorMod    = require('./models/connectorMod');
var funcMod         = require('./models/funcMod');
var mainAPICtrl     = require('./controllers/mainAPICtrl');

/* Configure */
var MASTER_LOCK_EXPIRES      = 15;
var CONNECTOR_CHECK_INTERVAL = 3 * 1000;

// 简称 C.G
var CONNECTOR_GUANCE_MAP = {};

// 事件
const EVENT_PING            = 'ping';
const EVENT_DFF_AUTH        = 'dff.auth';
const EVENT_DFF_SYSTEM_INFO = 'dff.system.info';
const EVENT_DFF_FUNC_LIST   = 'dff.func.list';
const EVENT_DFF_FUNC_CALL   = 'dff.func.call';

function getAckSample(ack) {
  var ackSample = {};
  for (var k in ack) if (ack.hasOwnProperty(k)) {
    var v = ack[k];
    if (Array.isArray(v)) {
      v = toolkit.strf('<{0} Records>', v.length);
    }

    ackSample[k] = v;
  }
  return JSON.stringify(ackSample);
};

function getEventObj(locals, event, incommingMessage) {
  incommingMessage = Array.prototype.slice.call(incommingMessage);

  var eventObj = {
    data    : {},
    callback: null,
    error   : null,
    taskId  : null,
  }
  if ('function' === typeof incommingMessage[0]) {
    eventObj.callback = incommingMessage[0];

  } else {
    eventObj.data = incommingMessage[0] || {};
    if ('string' === typeof eventObj.data) {
      try {
        eventObj.data = JSON.parse(eventObj.data);
      } catch(err) {
        eventObj.error = err;
      }
    }

    if ('function' === typeof incommingMessage[1]) {
      eventObj.callback = incommingMessage[1];
    }
  }

  // 保证 Callback 有值
  eventObj.callback = toolkit.ensureFn(eventObj.callback);

  // 提取 Task ID
  try {
    eventObj.taskId = eventObj.data.taskId;
  } catch(_) {
    // Nope
  }

  // 输出日志
  if (eventObj.error) {
    locals.logger.debug(`[GUANCE WS] Event@${event}: LOCAL <- Guance, Data: ${JSON.stringify(eventObj.data)}, Error: ${eventObj.error}`);
  } else {
    locals.logger.debug(`[GUANCE WS] Event@${event}: LOCAL <- Guance, Data: ${JSON.stringify(eventObj.data)}`);
  }

  return eventObj;
};

function doResponse(locals, client, event, eventObj, respData, error) {
  error = error || eventObj.error;

  var ack = null;
  if (error) {
    ack = {
      ok     : false,
      message: (errorOrMessage || 'Error Occured').toString(),
    }

  } else {
    ack = {
      ok     : true,
      message: '',
      data   : respData || null,
    }
  }

  if (eventObj.taskId) {
    ack.taskId = eventObj.taskId;
  }

  var ackEvent  = `${event}.ack`;
  var ackSample = getAckSample(ack);

  // Ack 事件返回
  if (eventObj.taskId) {
    locals.logger.debug(`[GUANCE WS] AckEvent@${ackEvent}: LOCAL -> Guance, Data: ${ackSample}`);
    client.emit(ackEvent, ack);
  }

  // Callback 事件返回
  locals.logger.debug(`[GUANCE WS] EventCallback@${event}: LOCAL -> Guance, Data: ${ackSample}`);
  return eventObj.callback(ack);
};

function createWebSocketClient(locals, connector, datafluxFuncId) {
  var client = socketIO(connector.configJSON.guanceWebSocketURL);

  // 错误事件
  client.on('error', function(err) {
    locals.logger.debug(`[GUANCE WS] Error: ${JSON.stringify(err)}`);
  });

  // 连接事件
  client.on('connect', function() {
    locals.logger.debug('[GUANCE WS] Connected.');

    // 发送认证信息
    var timestamp = parseInt(Date.now() / 1000);
    var nonce     = toolkit.genRandString();
    var eventData = {
      'apiKeyId'      : connector.configJSON.guanceAPIKeyId,
      'datafluxFuncId': datafluxFuncId,
      'timestamp'     : timestamp,
      'nonce'         : nonce,
      'signature'     : toolkit.getSha256(`${connector.configJSON.guanceAPIKey}~${datafluxFuncId}~${timestamp}~${nonce}`),
    }

    locals.logger.debug(`[GUANCE WS] Event@${EVENT_DFF_AUTH}: LOCAL -> Guance, Data: ${JSON.stringify(eventData)}`);
    client.emit(EVENT_DFF_AUTH, eventData, resp => {
        locals.logger.debug(`[GUANCE WS] EventCallback@${EVENT_DFF_AUTH}: LOCAL <- Guance, Data: ${JSON.stringify(resp)}`);

        // 上报自身信息
        if (resp.ok) {
          var eventData = {
            datafluxFuncId: datafluxFuncId,
            name          : connector.title || `DataFlux Func (${IMAGE_INFO.CI_COMMIT_REF_NAME})`,
            version       : IMAGE_INFO.CI_COMMIT_REF_NAME,
          }
          locals.logger.debug(`[GUANCE WS] Event@${EVENT_DFF_SYSTEM_INFO}: LOCAL -> Guance, Data: ${JSON.stringify(eventData)}`);
          client.emit(EVENT_DFF_SYSTEM_INFO, eventData, resp => {
            locals.logger.debug(`[GUANCE WS] EventCallback@${EVENT_DFF_SYSTEM_INFO}: LOCAL <- Guance, Data: ${JSON.stringify(resp)}`);
          });
        }
    });
  });

  // ping 事件
  client.on(EVENT_PING, function() {
    var eventObj = getEventObj(locals, EVENT_PING, arguments);
    if (eventObj.error) return doResponse(locals, client, EVENT_PING, eventObj);

    return doResponse(locals, client, EVENT_PING, eventObj);
  });

  // dff.func.list 事件
  client.on(EVENT_DFF_FUNC_LIST, function() {
    var eventObj = getEventObj(locals, EVENT_DFF_FUNC_LIST, arguments);
    if (eventObj.error) return doResponse(locals, client, EVENT_DFF_FUNC_LIST, eventObj);

    var funcModel = funcMod.createModel(locals);

    var opt = {
      filters: { },
      extra  : { asFuncDoc: true },
    };

    if (eventObj.data && eventObj.data.category) {
      opt.filters['func.category'] = { eq: eventObj.data.category };
    }
    funcModel.list(opt, function(err, dbRes) {
      if (err) return doResponse(locals, client, EVENT_DFF_FUNC_LIST, eventObj, null, err);

      return doResponse(locals, client, EVENT_DFF_FUNC_LIST, eventObj, dbRes);
    });
  });

  // dff.func.call 事件
  client.on(EVENT_DFF_FUNC_CALL, function() {
    var eventObj = getEventObj(locals, EVENT_DFF_FUNC_CALL, arguments);
    if (eventObj.error) return doResponse(locals, client, EVENT_DFF_FUNC_CALL, eventObj);

    var handlerFuncId  = eventObj.data.funcId;
    var funcCallKwargs = eventObj.data.callKwargs || {};

    // 调用函数
    var funcCallOptions = null;
    var funcResult      = null;
    async.series([
      // 生成函数调用配置
      function(asyncCallback) {
        var opt = {
          origin        : 'websocket',
          originId      : connector.id,
          queue         : CONFIG._FUNC_TASK_DEFAULT_WEBSOCKET_HANDLER_QUEUE,
          funcCallKwargs: funcCallKwargs || {},
          execMode      : 'sync',
        }
        mainAPICtrl._createFuncCallOptionsFromOptions(locals, handlerFuncId, opt, function(err, _funcCallOptions) {
          if (err) return asyncCallback(err);

          funcCallOptions = _funcCallOptions;

          return asyncCallback();
        });
      },
      // 发送任务
      function(asyncCallback) {
        mainAPICtrl._callFuncRunner(locals, funcCallOptions, function(err, ret) {
          locals.logger.debug('[GUANCE WS] GUANCE -> FUNC: `{0}`', handlerFuncId);

          if (err) return asyncCallback(err);

          // 提取结果
          try {
            funcResult = ret.data.result.raw;
          } catch(err) {
            funcResult = null;
          }

          locals.logger.debug('[GUANCE WS] FUNC: `{0}` -> `{1}`', handlerFuncId, JSON.stringify(funcResult));

          return asyncCallback();
        });
      },
    ], function(err) {
      if (err) return doResponse(locals, client, EVENT_DFF_FUNC_CALL, eventObj, null, err);

      return doResponse(locals, client, EVENT_DFF_FUNC_CALL, eventObj, funcResult);
    });
  });

  return client;
};

exports.runListener = function runListener(app) {
  var lockKey   = toolkit.getCacheKey('lock', 'guanceWebSocketClient');
  var lockValue = toolkit.genRandString();
  app.locals.logger.info('Start Guance WebSocket Clients... Lock: `{0}`', lockValue);

  // 当前 DataFlux Func ID
  var dataFluxFuncId = null;

  // 当前节点是否抢占到主节点资格
  var isMasterNode = null;

  // 定期检查
  function connectorChecker() {
    // 重建连接器客户端
    var nextConnectorGuanceMap = {};
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
            if (isMasterNode === null || isMasterNode === false) {
              app.locals.logger.debug('[GUANCE WS] Master Node');
            }
            isMasterNode = true;

          } else {
            // 锁为其他进程获得，安全起见，清理本进程内的所有 WebSocket 客户端
            if (isMasterNode === null || isMasterNode === true) {
              app.locals.logger.debug('[GUANCE WS] Non-Master Node');
            }

            isMasterNode = false;

            for (var cgKey in CONNECTOR_GUANCE_MAP) {
              var connector = CONNECTOR_GUANCE_MAP[cgKey];
              connector.client.close();
              delete CONNECTOR_GUANCE_MAP[cgKey];
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
            'cnct.title',
            'cnct.configJSON',
            'MD5(cnct.configJSON) AS configMD5',
          ],
          filters: {
            'cnct.type': { eq: 'guance' },
          },
        };
        connectorModel.list(opt, function(err, dbRes) {
          if (err) return asyncCallback(err);

          dbRes.forEach(function(d) {
            d.configJSON = d.configJSON || {};

            // 当前节点非主节点时，忽略 WebSocket 连接器
            if (!isMasterNode) return;

            // 连接器信息加入待创建表
            var cgKey = sortedJSON.sortify({
              'id'      : d.id,
              'apiKeyId': d.configJSON.guanceAPIKeyId,
            }, {
              stringify: true,
            })
            nextConnectorGuanceMap[cgKey] = toolkit.jsonCopy(d);
          });

          return asyncCallback();
        });
      },
      // 获取最新 DataFlux Func ID
      function(asyncCallback) {
        if (toolkit.isNothing(nextConnectorGuanceMap)) return asyncCallback();

        var systemConfigModel = systemConfigMod.createModel(app.locals);

        systemConfigModel.get('DATAFLUX_FUNC_ID', [ 'value' ], function(err, dbRes) {
          if (err) return asyncCallback(err);

          dataFluxFuncId = dbRes.value;

          return asyncCallback();
        });
      },
      // 更新连接器 WebSocket 客户端
      function(asyncCallback) {
        // 清除已不存在的连接器
        for (var cgKey in CONNECTOR_GUANCE_MAP) {
          if ('undefined' === typeof nextConnectorGuanceMap[cgKey]) {
            CONNECTOR_GUANCE_MAP[cgKey].client.close();
            delete CONNECTOR_GUANCE_MAP[cgKey];

            app.locals.logger.debug('[GUANCE WS] Client removed: `{0}`', cgKey);
          }
        }

        // 重建有变化的连接器客户端
        for (var cgKey in nextConnectorGuanceMap) {
          var _next    = nextConnectorGuanceMap[cgKey];
          var _current = CONNECTOR_GUANCE_MAP[cgKey];

          // 跳过无变化客户端
          if (_current && _current['configMD5'] && _current['configMD5'] === _next['configMD5']) {
            continue
          }

          // 删除客户端
          if (_current) {
            _current.client.close();
            delete CONNECTOR_GUANCE_MAP[cgKey];
            app.locals.logger.debug('[GUANCE WS] Client removed: `{0}`', cgKey);
          }

          // 新建客户端
          try {
            _next.client = createWebSocketClient(app.locals, _next, dataFluxFuncId);
          } catch(err) {
            app.locals.logger.warning('[GUANCE WS] Client creating Error: `{0}`, reason: {1}', cgKey, err.toString());
            continue
          }

          // 记录到本地
          CONNECTOR_GUANCE_MAP[cgKey] = _next;
          app.locals.logger.debug('[GUANCE WS] Client created: `{0}` to `{1}`', cgKey, _next.configJSON.guanceWebSocketURL);

          return asyncCallback();
        }
      },
    ], function(err) {
      if (err) return app.locals.logger.logError(err);
    });
  };

  setInterval(connectorChecker, CONNECTOR_CHECK_INTERVAL);
};
