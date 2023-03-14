'use strict';

/* Built-in Modules */

/* 3rd-party Modules */
var async     = require('async');
var splitargs = require('splitargs');

/* Project Modules */
var E            = require('../utils/serverError');
var CONFIG       = require('../utils/yamlResources').get('CONFIG');
var toolkit      = require('../utils/toolkit');
var celeryHelper = require('../utils/extraHelpers/celeryHelper');

var connectorMod = require('../models/connectorMod');

var celeryHelper = require('../utils/extraHelpers/celeryHelper');

/* Configure */
var RESERVED_REF_NAME = 'dataflux_';

function _checkConfig(locals, type, config, skipTest, callback) {
  var requiredFields = [];
  var optionalFields = [];

  switch(type) {
    case 'guance':
      requiredFields = ['guanceNode', 'guanceOpenAPIURL', 'guanceWebSocketURL', 'guanceOpenWayURL', 'guanceAPIKeyId', 'guanceAPIKey'];
      optionalFields = [];
      break;

    case 'df_datakit':
      config.port     = config.port     || 9529;
      config.protocol = config.protocol || 'http';

      requiredFields = ['host', 'port'];
      optionalFields = ['protocol', 'source'];
      break;

    case 'df_dataway':
      config.port     = config.port     || 9528;
      config.protocol = config.protocol || 'http';

      requiredFields = ['host', 'port'];
      optionalFields = ['protocol', 'token', 'accessKey', 'secretKey'];
      break;

    case 'dff_sidecar':
      config.host     = config.host     || '172.17.0.1';
      config.port     = config.port     || 8099;
      config.protocol = config.protocol || 'http';

      requiredFields = ['host', 'port', 'secretKey'];
      optionalFields = ['protocol'];
      break;

    case 'influxdb':
      config.port     = config.port     || 8086;
      config.protocol = config.protocol || 'http';

      requiredFields = ['host'];
      optionalFields = ['port', 'protocol', 'database', 'user', 'password'];
      break;

    case 'mysql':
      config.port    = config.port    || 3306;
      config.charset = config.charset || 'utf8mb4';

      requiredFields = ['host', 'database', 'user', 'password', 'charset'];
      optionalFields = ['port'];
      break;

    case 'redis':
      config.port     = config.port     || 6379;
      config.password = config.password || null;
      config.database = config.database || 0;

      requiredFields = ['host', 'database'];
      optionalFields = ['port', 'password', 'topicHandlers'];
      break;

    case 'memcached':
      config.port = config.port || 11211;

      requiredFields = ['servers'];
      optionalFields = [];
      break;

    case 'clickhouse':
      config.port = config.port || 9000;
      config.user = config.user || 'default';

      requiredFields = ['host', 'database'];
      optionalFields = ['port', 'user', 'password'];
      break;

    case 'oracle':
      config.port    = config.port    || 1521;
      config.charset = config.charset || 'utf8';

      requiredFields = ['host', 'database', 'user', 'password', 'charset'];
      optionalFields = ['port'];
      break;

    case 'sqlserver':
      config.port    = config.port    || 1433;
      config.charset = config.charset || 'utf8';

      requiredFields = ['host', 'database', 'user', 'password', 'charset'];
      optionalFields = ['port'];
      break;

    case 'postgresql':
      config.port    = config.port    || 5432;
      config.charset = config.charset || 'utf8';

      requiredFields = ['host', 'database', 'user', 'password', 'charset'];
      optionalFields = ['port'];
      break;

    case 'mongodb':
      config.port = config.port || 27017;

      requiredFields = ['host'];
      optionalFields = ['port', 'user', 'password', 'database'];
      break;

    case 'elasticsearch':
      config.port     = config.port     || 9200;
      config.protocol = config.protocol || 'http';

      requiredFields = ['host'];
      optionalFields = ['port', 'protocol', 'user', 'password'];
      break;

    case 'nsq':
      config.port = config.port || 4161;

      requiredFields = [];
      optionalFields = ['host', 'port', 'protocol', 'servers'];
      break;

    case 'mqtt':
      config.port = config.port || 1883;

      requiredFields = ['host', 'port'];
      optionalFields = ['user', 'password', 'clientId', 'multiSubClient', 'topicHandlers'];
      break;

    case 'kafka':
      requiredFields = ['servers'];
      optionalFields = ['user', 'password', 'groupId', 'securityProtocol', 'saslMechanisms', 'multiSubClient', 'kafkaOffset', 'topicHandlers'];
      break;
  }

  // 检查字段
  for (var i = 0; i < requiredFields.length; i++) {
    var f = requiredFields[i];

    if ('undefined' === typeof config[f]) {
      return callback(new E('EClientBadRequest.InvalidConnectorConfigJSON', 'Invalid config JSON', {
        requiredFields: requiredFields,
        optionalFields: optionalFields,
        missingField  : f,
      }));
    }
  }

  // 尝试连接
  if (skipTest) return callback();

  var celery = celeryHelper.createHelper(locals.logger);

  var kwargs = { type: type, config: config };
  celery.putTask('Main.CheckConnector', null, kwargs, null, null, function(err, celeryRes, extraInfo) {
    if (err) return callback(err);

    celeryRes = celeryRes || {};
    extraInfo = extraInfo || {};

    var errorMessage = (celeryRes.einfoTEXT || '').trim().split('\n').pop().trim();
    if (celeryRes.status === 'FAILURE') {
      return callback(new E('EClientBadRequest.ConnectingToConnectorFailed', 'Connecting to Connector failed', {
        etype  : celeryRes.result && celeryRes.result.exc_type,
        message: errorMessage,
      }));
    } else if (extraInfo.status === 'TIMEOUT') {
      return callback(new E('EClientBadRequest.ConnectingToConnectorFailed', 'Connecting to Connector timeout', {
        etype: celeryRes.result && celeryRes.result.exc_type,
      }));
    }

    return callback();
  });
};

/* Handlers */
var crudHandler = exports.crudHandler = connectorMod.createCRUDHandler();

exports.list = crudHandler.createListHandler();

exports.add = function(req, res, next) {
  var data     = req.body.data;
  var skipTest = toolkit.toBoolean(req.body.skipTest) || false;

  if (toolkit.startsWith(data.id, RESERVED_REF_NAME)) {
    return next(new E('EBizCondition.ReservedConnectorIDPrefix', 'Cannot use a ID of reserved prefix'));
  }

  var connectorModel = connectorMod.createModel(res.locals);

  var newConnector = null;

  async.series([
    // 检查ID重名
    function(asyncCallback) {
      var opt = {
        limit  : 1,
        fields : ['cnct.id'],
        filters: {
          'cnct.id': {eq: data.id},
        },
      };
      connectorModel.list(opt, function(err, dbRes) {
        if (err) return asyncCallback(err);

        if (dbRes.length > 0) {
          return asyncCallback(new E('EBizCondition.DuplicatedConnectorID', 'ID of Connector already exists'));
        }

        return asyncCallback();
      });
    },
    // 检查连接器配置
    function(asyncCallback) {
      if (toolkit.isNothing(data.configJSON)) return asyncCallback();

      return _checkConfig(res.locals, data.type, data.configJSON, skipTest, asyncCallback);
    },
    // 数据入库
    function(asyncCallback) {
      connectorModel.add(data, function(err, _addedId, _addedData) {
        if (err) return asyncCallback(err);

        newConnector = _addedData;

        return asyncCallback();
      });
    },
  ], function(err) {
    if (err) return next(err);

    var ret = toolkit.initRet({
      id: data.id,
    });
    return res.locals.sendJSON(ret);
  });
};

exports.modify = function(req, res, next) {
  var id       = req.params.id;
  var data     = req.body.data;
  var skipTest = toolkit.toBoolean(req.body.skipTest) || false;

  var connectorModel = connectorMod.createModel(res.locals);
  connectorModel.decipher = true;

  var connector = null;

  async.series([
    // 获取连接器
    function(asyncCallback) {
      connectorModel.getWithCheck(id, null, function(err, dbRes) {
        if (err) return asyncCallback(err);

        connector = dbRes;
        if (connector.isBuiltin) {
          return asyncCallback(new E('EBizCondition.ModifyingBuiltinConnectorNotAllowed', 'Modifying built-in Connector is not allowed, please edit the config instead'));
        }

        return asyncCallback();
      });
    },
    // 检查连接器配置
    function(asyncCallback) {
      if (toolkit.isNothing(data.configJSON)) return asyncCallback();

      return _checkConfig(res.locals, connector.type, data.configJSON, skipTest, asyncCallback);
    },
    // 数据入库
    function(asyncCallback) {
      connectorModel.modify(id, data, asyncCallback);
    },
  ], function(err) {
    if (err) return next(err);

    var ret = toolkit.initRet({
      id: id,
    });
    res.locals.sendJSON(ret);

    var celery = celeryHelper.createHelper(res.locals.logger);
    reloadDataMD5Cache(celery, id);
  });
};

exports.delete = function(req, res, next) {
  var id = req.params.id;

  var connectorModel = connectorMod.createModel(res.locals);

  var connector = null;

  async.series([
    // 获取连接器
    function(asyncCallback) {
      connectorModel.getWithCheck(id, null, function(err, dbRes) {
        if (err) return asyncCallback(err);

        connector = dbRes;
        if (connector.isBuiltin) {
          return asyncCallback(new E('EBizCondition.DeletingBuiltinConnectorNotAllowed', 'Deleting built-in Connector is not allowed'));
        }

        return asyncCallback();
      });
    },
    // 数据入库
    function(asyncCallback) {
      connectorModel.delete(id, asyncCallback);
    },
  ], function(err) {
    if (err) return next(err);

    var ret = toolkit.initRet({
      id: id,
    });
    res.locals.sendJSON(ret);

    var celery = celeryHelper.createHelper(res.locals.logger);
    reloadDataMD5Cache(celery, id);
  });
};

exports.query = function(req, res, next) {
  var id             = req.params.id;
  var database       = req.body.database;
  var queryStatement = req.body.queryStatement;
  var returnType     = req.body.returnType;

  var connectorModel = connectorMod.createModel(res.locals);

  var connector   = null;
  var queryResult = null;

  async.series([
    // 获取连接器
    function(asyncCallback) {
      connectorModel.getWithCheck(id, null, function(err, dbRes) {
        if (err) return asyncCallback(err);

        connector = dbRes;

        return asyncCallback();
      });
    },
    // 执行查询
    function(asyncCallback) {
      // 准备参数
      var taskKwargs = {
        id           : connector.id,
        command      : null,
        commandArgs  : null,
        commandKwargs: {},
      };
      if (returnType) taskKwargs.returnType = returnType;

      switch(connector.type) {
        case 'influxdb':
        case 'mysql':
        case 'clickhouse':
        case 'oracle':
        case 'sqlserver':
        case 'postgresql':
        case 'elasticsearch':
          taskKwargs.command     = 'query';
          taskKwargs.commandArgs = toolkit.asArray(queryStatement);
          break;

        case 'redis':
        case 'memcached':
          taskKwargs.command     = 'query';
          taskKwargs.commandArgs = splitargs(queryStatement);
          break;

        case 'mongodb':
          taskKwargs.command       = 'run_method';
          taskKwargs.commandKwargs = JSON.parse(queryStatement);

        default:
          // 不支持查询
          break;
      }

      if (!taskKwargs.command) return asyncCallback();

      // 指定数据库
      var connectorConfig = toolkit.jsonCopy(connector.configJSON);
      if (toolkit.notNothing(database)) {
        switch(connector.type) {
          case 'influxdb':
            taskKwargs.commandKwargs.database = database;
            break;

          default:
            // 不支持指定数据库
            break;
        }
      }

      if (toolkit.isNothing(taskKwargs.commandKwargs)) {
        taskKwargs.commandKwargs = null;
      }

      // 执行命令
      var celery = celeryHelper.createHelper(res.locals.logger);

      celery.putTask('Main.QueryConnector', null, taskKwargs, null, null, function(err, celeryRes, extraInfo) {
        if (err) return asyncCallback(err);

        celeryRes = celeryRes || {};
        extraInfo = extraInfo || {};

        var errorMessage = (celeryRes.einfoTEXT || '').trim().split('\n').pop().trim();
        if (celeryRes.status === 'FAILURE') {
          return asyncCallback(new E('EClientBadRequest.QueryFailed', 'Query failed', {
            etype  : celeryRes.result && celeryRes.result.exc_type,
            message: errorMessage,
          }));

        } else if (extraInfo.status === 'TIMEOUT') {
          return asyncCallback(new E('EClientBadRequest.QueryTimeout', 'Query timeout', {
            etype: celeryRes.result && celeryRes.result.exc_type,
          }));
        }

        queryResult = celeryRes.retval || null;

        return asyncCallback();
      });
    },
  ], function(err) {
    if (err) return next(err);

    var ret = toolkit.initRet(queryResult);
    return res.locals.sendJSON(ret);
  });
};

exports.test = function(req, res, next) {
  var id = req.params.id;

  var connectorModel = connectorMod.createModel(res.locals);
  connectorModel.decipher = true;

  var connector = null;

  async.series([
    // 获取连接器
    function(asyncCallback) {
      connectorModel.getWithCheck(id, null, function(err, dbRes) {
        if (err) return asyncCallback(err);

        connector = dbRes;

        return asyncCallback();
      });
    },
    // 检查连接器配置
    function(asyncCallback) {
      return _checkConfig(res.locals, connector.type, connector.configJSON, false, asyncCallback);
    },
  ], function(err) {
    if (err) return next(err);

    var ret = toolkit.initRet({
      checkResult: 'OK',
    });
    return res.locals.sendJSON(ret);
  });
};

exports.listSubInfo = function(req, res, next) {
  var connectorId = req.query.connectorId;

  var subInfoList = [];

  async.series([
    // 查询最近消费信息
    function(asyncCallback) {
      var cachePattern = toolkit.getCacheKey('cache', 'recentSubConsumeInfo', [
        'connectorId', connectorId || '*',
        'topic',       '*']);
      res.locals.cacheDB.getByPattern(cachePattern, function(err, cacheRes) {
        if (err) return asyncCallback(err);

        if (cacheRes) {
          for (var key in cacheRes) {
            var parsedKey = toolkit.parseCacheKey(key);
            subInfoList.push({
              connectorId: parsedKey.tags.connectorId,
              topic      : parsedKey.tags.topic,
              consumeInfo: JSON.parse(cacheRes[key]),
            });
          }
        }

        return asyncCallback();
      });
    },
    // TODO: 查询最近处理结果
  ], function(err) {
    if (err) return next(err);

    var ret = toolkit.initRet(subInfoList);
    res.locals.sendJSON(ret);
  });
};

function reloadDataMD5Cache(celery, connectorId, callback) {
  var taskKwargs = { type: 'connector', id: connectorId };
  celery.putTask('Sys.ReloadDataMD5Cache', null, taskKwargs, null, null, callback);
};
