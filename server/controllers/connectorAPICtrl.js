'use strict';

/* Builtin Modules */

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

function _checkConnectorConfig(locals, type, config, requiredFields, optionalFields, callback) {
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
  var celery = celeryHelper.createHelper(locals.logger);

  var kwargs = {
    type  : type,
    config: config,
  };
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
}

var CONNECTOR_CHECK_CONFIG_FUNC_MAP = {
  df_dataway: function(locals, config, callback) {
    // 默认值
    config.port     = config.port     || 9528;
    config.protocol = config.protocol || 'http';

    var REQUIRED_FIELDS = ['host', 'port'];
    var OPTIONAL_FIELDS = ['protocol', 'token', 'accessKey', 'secretKey'];

    return _checkConnectorConfig(locals, 'df_dataway', config, REQUIRED_FIELDS, OPTIONAL_FIELDS, callback);
  },
  df_datakit: function(locals, config, callback) {
    // 默认值
    config.port     = config.port     || 9529;
    config.protocol = config.protocol || 'http';

    var REQUIRED_FIELDS = ['host', 'port'];
    var OPTIONAL_FIELDS = ['protocol', 'source'];

    return _checkConnectorConfig(locals, 'df_datakit', config, REQUIRED_FIELDS, OPTIONAL_FIELDS, callback);
  },
  dff_sidecar: function(locals, config, callback) {
    // 默认值
    config.host     = config.host     || '172.17.0.1';
    config.port     = config.port     || 8099;
    config.protocol = config.protocol || 'http';

    var REQUIRED_FIELDS = ['host', 'port', 'secretKey'];
    var OPTIONAL_FIELDS = ['protocol'];

    return _checkConnectorConfig(locals, 'dff_sidecar', config, REQUIRED_FIELDS, OPTIONAL_FIELDS, callback);
  },
  influxdb: function(locals, config, callback) {
    // 默认值
    config.port     = config.port     || 8086;
    config.protocol = config.protocol || 'http';

    var REQUIRED_FIELDS = ['host'];
    var OPTIONAL_FIELDS = ['port', 'protocol', 'database', 'user', 'password'];

    return _checkConnectorConfig(locals, 'influxdb', config, REQUIRED_FIELDS, OPTIONAL_FIELDS, callback);
  },
  mysql: function(locals, config, callback) {
    // 默认值
    config.port    = config.port    || 3306;
    config.charset = config.charset || 'utf8mb4';

    var REQUIRED_FIELDS = ['host', 'database', 'user', 'password', 'charset'];
    var OPTIONAL_FIELDS = ['port'];

    return _checkConnectorConfig(locals, 'mysql', config, REQUIRED_FIELDS, OPTIONAL_FIELDS, callback);
  },
  redis: function(locals, config, callback) {
    // 默认值
    config.port     = config.port     || 6379;
    config.password = config.password || null;
    config.database = config.database || 0;

    var REQUIRED_FIELDS = ['host', 'database'];
    var OPTIONAL_FIELDS = ['port', 'password', 'topicHandlers'];

    return _checkConnectorConfig(locals, 'redis', config, REQUIRED_FIELDS, OPTIONAL_FIELDS, callback);
  },
  memcached: function(locals, config, callback) {
    // 默认值
    config.port = config.port || 11211;

    var REQUIRED_FIELDS = ['servers'];
    var OPTIONAL_FIELDS = [];

    return _checkConnectorConfig(locals, 'memcached', config, REQUIRED_FIELDS, OPTIONAL_FIELDS, callback);
  },
  clickhouse: function(locals, config, callback) {
    // 默认值
    config.port = config.port || 9000;
    config.user = config.user || 'default';

    var REQUIRED_FIELDS = ['host', 'database'];
    var OPTIONAL_FIELDS = ['port', 'user', 'password'];

    return _checkConnectorConfig(locals, 'clickhouse', config, REQUIRED_FIELDS, OPTIONAL_FIELDS, callback);
  },
  oracle: function(locals, config, callback) {
    // 默认值
    config.port    = config.port    || 1521;
    config.charset = config.charset || 'utf8';

    var REQUIRED_FIELDS = ['host', 'database', 'user', 'password', 'charset'];
    var OPTIONAL_FIELDS = ['port'];

    return _checkConnectorConfig(locals, 'oracle', config, REQUIRED_FIELDS, OPTIONAL_FIELDS, callback);
  },
  sqlserver: function(locals, config, callback) {
    // 默认值
    config.port    = config.port    || 1433;
    config.charset = config.charset || 'utf8';

    var REQUIRED_FIELDS = ['host', 'database', 'user', 'password', 'charset'];
    var OPTIONAL_FIELDS = ['port'];

    return _checkConnectorConfig(locals, 'sqlserver', config, REQUIRED_FIELDS, OPTIONAL_FIELDS, callback);
  },
  postgresql: function(locals, config, callback) {
    // 默认值
    config.port    = config.port    || 5432;
    config.charset = config.charset || 'utf8';

    var REQUIRED_FIELDS = ['host', 'database', 'user', 'password', 'charset'];
    var OPTIONAL_FIELDS = ['port'];

    return _checkConnectorConfig(locals, 'postgresql', config, REQUIRED_FIELDS, OPTIONAL_FIELDS, callback);
  },
  mongodb: function(locals, config, callback) {
    // 默认值
    config.port = config.port || 27017;

    var REQUIRED_FIELDS = ['host'];
    var OPTIONAL_FIELDS = ['port', 'user', 'password', 'database'];

    return _checkConnectorConfig(locals, 'mongodb', config, REQUIRED_FIELDS, OPTIONAL_FIELDS, callback);
  },
  elasticsearch: function(locals, config, callback) {
    // 默认值
    config.port     = config.port     || 9200;
    config.protocol = config.protocol || 'http';

    var REQUIRED_FIELDS = ['host'];
    var OPTIONAL_FIELDS = ['port', 'protocol', 'user', 'password'];

    return _checkConnectorConfig(locals, 'elasticsearch', config, REQUIRED_FIELDS, OPTIONAL_FIELDS, callback);
  },
  nsq: function(locals, config, callback) {
    // 默认值
    config.port = config.port || 4161;

    var REQUIRED_FIELDS = [];
    var OPTIONAL_FIELDS = ['host', 'port', 'protocol', 'servers'];

    return _checkConnectorConfig(locals, 'nsq', config, REQUIRED_FIELDS, OPTIONAL_FIELDS, callback);
  },
  mqtt: function(locals, config, callback) {
    // 默认值
    config.port = config.port || 1883;

    var REQUIRED_FIELDS = ['host', 'port'];
    var OPTIONAL_FIELDS = ['user', 'password', 'clientId', 'multiSubClient', 'topicHandlers'];

    return _checkConnectorConfig(locals, 'mqtt', config, REQUIRED_FIELDS, OPTIONAL_FIELDS, callback);
  },
  kafka: function(locals, config, callback) {
    // 默认值
    var REQUIRED_FIELDS = ['servers'];
    var OPTIONAL_FIELDS = ['user', 'password', 'groupId', 'securityProtocol', 'saslMechanisms', 'multiSubClient', 'topicHandlers'];

    return _checkConnectorConfig(locals, 'kafka', config, REQUIRED_FIELDS, OPTIONAL_FIELDS, callback);
  },
};

/* Handlers */
var crudHandler = exports.crudHandler = connectorMod.createCRUDHandler();

exports.list = crudHandler.createListHandler();

exports.add = function(req, res, next) {
  var data = req.body.data;

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

      CONNECTOR_CHECK_CONFIG_FUNC_MAP[data.type](res.locals, data.configJSON, asyncCallback);
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
  var id   = req.params.id;
  var data = req.body.data;

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
          return asyncCallback(new E('EBizCondition.ModifyingBuiltinConnectorNotAllowed', 'Modifying builtin Connector is not allowed, please edit the config instead'));
        }

        return asyncCallback();
      });
    },
    // 检查连接器配置
    function(asyncCallback) {
      if (toolkit.isNothing(data.configJSON)) return asyncCallback();

      CONNECTOR_CHECK_CONFIG_FUNC_MAP[connector.type](res.locals, data.configJSON, asyncCallback);
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
          return asyncCallback(new E('EBizCondition.DeletingBuiltinConnectorNotAllowed', 'Deleting builtin Connector is not allowed'));
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
      if (!toolkit.isNothing(database)) {
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
      CONNECTOR_CHECK_CONFIG_FUNC_MAP[connector.type](res.locals, connector.configJSON, asyncCallback);
    },
  ], function(err) {
    if (err) return next(err);

    var ret = toolkit.initRet({
      checkResult: 'OK',
    });
    return res.locals.sendJSON(ret);
  });
};

function reloadDataMD5Cache(celery, connectorId, callback) {
  var taskKwargs = { type: 'connector', id: connectorId };
  celery.putTask('Main.ReloadDataMD5Cache', null, taskKwargs, null, null, callback);
};
