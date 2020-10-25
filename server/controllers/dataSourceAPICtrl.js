'use strict';

/* Builtin Modules */

/* 3rd-party Modules */
var async     = require('async');
var splitargs = require('splitargs');

/* Project Modules */
var E       = require('../utils/serverError');
var CONFIG  = require('../utils/yamlResources').get('CONFIG');
var toolkit = require('../utils/toolkit');

var dataSourceMod = require('../models/dataSourceMod');

var celeryHelper = require('../utils/extraHelpers/celeryHelper');

/* Configure */
var RESERVED_REF_NAME = 'df_';

function _checkDataSourceConfig(config, requiredFields, optionalFields, databaseName) {
  for (var i = 0; i < requiredFields.length; i++) {
    var f = requiredFields[i];

    if ('undefined' === typeof config[f]) {
      return new E('EClientBadRequest.InvalidDataSourceConfigJSON', toolkit.strf('Invalid config JSON for {0}', databaseName), {
        requiredFields: requiredFields,
        optionalFields: optionalFields,
      });
    }
  }
}

var DATA_SOURCE_CONFIG_PREPARE_FUNC_MAP = {
  df_dataway: function(config, callback) {
    var REQUIRED_FIELDS = ['host', 'port'];
    var OPTIONAL_FIELDS = ['protocol', 'token', 'accessKey', 'secretKey'];

    var err = _checkDataSourceConfig(config, REQUIRED_FIELDS, OPTIONAL_FIELDS, 'DataFlux DataWay');
    if (err) return callback(err);

    // 默认值
    config.port     = config.port     || 9528;
    config.protocol = config.protocol || 'http';

    return callback();
  },
  influxdb: function(config, callback) {
    var REQUIRED_FIELDS = ['host'];
    var OPTIONAL_FIELDS = ['port', 'protocol', 'database', 'user', 'password'];

    var err = _checkDataSourceConfig(config, REQUIRED_FIELDS, OPTIONAL_FIELDS, 'InfluxDB');
    if (err) return callback(err);

    // 默认值
    config.port     = config.port     || 8086;
    config.protocol = config.protocol || 'http';

    return callback();
  },
  mysql: function(config, callback) {
    var REQUIRED_FIELDS = ['host', 'database', 'user', 'password', 'charset'];
    var OPTIONAL_FIELDS = ['port'];

    var err = _checkDataSourceConfig(config, REQUIRED_FIELDS, OPTIONAL_FIELDS, 'MySQL');
    if (err) return callback(err);

    // 默认值
    config.port    = config.port    || 3306;
    config.charset = config.charset || 'utf8mb4';

    return callback();
  },
  redis: function(config, callback) {
    var REQUIRED_FIELDS = ['host', 'database'];
    var OPTIONAL_FIELDS = ['port', 'password'];

    var err = _checkDataSourceConfig(config, REQUIRED_FIELDS, OPTIONAL_FIELDS, 'Redis');
    if (err) return callback(err);

    // 默认值
    config.port     = config.port     || 6379;
    config.password = config.password || null;
    config.database = config.database || 0;

    return callback();
  },
  memcached: function(config, callback) {
    var REQUIRED_FIELDS = ['servers'];
    var OPTIONAL_FIELDS = [];

    var err = _checkDataSourceConfig(config, REQUIRED_FIELDS, OPTIONAL_FIELDS, 'Memcached');
    if (err) return callback(err);

    // 默认值
    config.port = config.port || 11211;

    return callback();
  },
  clickhouse: function(config, callback) {
    var REQUIRED_FIELDS = ['host', 'database'];
    var OPTIONAL_FIELDS = ['port', 'user', 'password'];

    var err = _checkDataSourceConfig(config, REQUIRED_FIELDS, OPTIONAL_FIELDS, 'ClickHouse');
    if (err) return callback(err);

    // 默认值
    config.port = config.port || 9000;
    config.user = config.user || 'default';

    return callback();
  },
  oracle: function(config, callback) {
    var REQUIRED_FIELDS = ['host', 'database', 'user', 'password', 'charset'];
    var OPTIONAL_FIELDS = ['port'];

    var err = _checkDataSourceConfig(config, REQUIRED_FIELDS, OPTIONAL_FIELDS, 'Oracle Database');
    if (err) return callback(err);

    // 默认值
    config.port    = config.port    || 1521;
    config.charset = config.charset || 'utf8';

    return callback();
  },
  sqlserver: function(config, callback) {
    var REQUIRED_FIELDS = ['host', 'database', 'user', 'password', 'charset'];
    var OPTIONAL_FIELDS = ['port'];

    var err = _checkDataSourceConfig(config, REQUIRED_FIELDS, OPTIONAL_FIELDS, 'Microsoft SQL Server');
    if (err) return callback(err);

    // 默认值
    config.port    = config.port    || 1433;
    config.charset = config.charset || 'utf8';

    return callback();
  },
  postgresql: function(config, callback) {
    var REQUIRED_FIELDS = ['host', 'database', 'user', 'password', 'charset'];
    var OPTIONAL_FIELDS = ['port'];

    var err = _checkDataSourceConfig(config, REQUIRED_FIELDS, OPTIONAL_FIELDS, 'PostgreSQL');
    if (err) return callback(err);

    // 默认值
    config.port    = config.port    || 5432;
    config.charset = config.charset || 'utf8';

    return callback();
  },
  mongodb: function(config, callback) {
    var REQUIRED_FIELDS = ['host'];
    var OPTIONAL_FIELDS = ['port', 'user', 'password', 'database'];

    var err = _checkDataSourceConfig(config, REQUIRED_FIELDS, OPTIONAL_FIELDS, 'mongoDB');
    if (err) return callback(err);

    // 默认值
    config.port = config.port || 27017;

    return callback();
  },
  elasticsearch: function(config, callback) {
    var REQUIRED_FIELDS = ['host'];
    var OPTIONAL_FIELDS = ['port', 'protocol', 'user', 'password'];

    var err = _checkDataSourceConfig(config, REQUIRED_FIELDS, OPTIONAL_FIELDS, 'elasticsearch');
    if (err) return callback(err);

    // 默认值
    config.port     = config.port     || 9200;
    config.protocol = config.protocol || 'http';

    return callback();
  },
  nsq: function(config, callback) {
    var REQUIRED_FIELDS = [];
    var OPTIONAL_FIELDS = ['host', 'port', 'protocol', 'servers'];

    var err = _checkDataSourceConfig(config, REQUIRED_FIELDS, OPTIONAL_FIELDS, 'NSQ');
    if (err) return callback(err);

    // 默认值
    config.port = config.port || 4161;

    return callback();
  },
};

var HIDE_CONFIG_FIELDS = [
  'password',
  'secretKey',
];

/* Handlers */
var crudHandler = exports.crudHandler = dataSourceMod.createCRUDHandler();

exports.list   = crudHandler.createListHandler(null, {beforeResp: hidePassword});
exports.delete = crudHandler.createDeleteHandler();

exports.add = function(req, res, next) {
  var data = req.body.data;

  if (toolkit.startsWith(data.id, RESERVED_REF_NAME)) {
    return next(new E('EBizCondition.ReservedDataSourceIDPrefix', 'Cannot use a ID of reserved prefix.'));
  }

  var dataSourceModel = dataSourceMod.createModel(req, res);

  async.series([
    // 检查ID重名
    function(asyncCallback) {
      var opt = {
        limit  : 1,
        fields : ['dsrc.id'],
        filters: {
          'dsrc.id': {eq: data.id},
        },
      };
      dataSourceModel.list(opt, function(err, dbRes) {
        if (err) return asyncCallback(err);

        if (dbRes.length > 0) {
          return asyncCallback(new E('EBizCondition.DuplicatedDataSourceID', 'ID of data source already exists.'));
        }

        return asyncCallback();
      });
    },
    // 准备数据源配置
    function(asyncCallback) {
      if (toolkit.isNothing(data.configJSON)) return asyncCallback();

      DATA_SOURCE_CONFIG_PREPARE_FUNC_MAP[data.type](data.configJSON, asyncCallback);
    },
    // 检查数据源配置
    function(asyncCallback) {
      if (toolkit.isNothing(data.configJSON)) return asyncCallback();

      var celery = celeryHelper.createHelper(res.locals.logger);

      var kwargs = {
        type  : data.type,
        config: data.configJSON,
      };
      celery.putTask('DataFluxFunc.dataSourceChecker', null, kwargs, null, null, function(err, celeryRes, extraInfo) {
        if (err) return asyncCallback(err);

        celeryRes = celeryRes || {};
        extraInfo = extraInfo || {};

        var errorMessage = (celeryRes.einfoTEXT || '').trim().split('\n').pop().trim();
        if (celeryRes.status === 'FAILURE') {
          return asyncCallback(new E('EClientBadRequest.ConnectingToDataSourceFailed', toolkit.strf('Connecting to DataSource failed. {0}', errorMessage), {
            etype: celeryRes.result && celeryRes.result.exc_type,
            error: errorMessage,
          }));
        } else if (extraInfo.status === 'TIMEOUT') {
          return asyncCallback(new E('EClientBadRequest.ConnectingToDataSourceFailed', 'Connecting to DataSource timeout.', {
            etype: celeryRes.result && celeryRes.result.exc_type,
          }));
        }

        return asyncCallback();
      });
    },
    // 数据入库
    function(asyncCallback) {
      dataSourceModel.add(data, asyncCallback);
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

  var dataSourceModel = dataSourceMod.createModel(req, res);

  var dataSource = null;

  async.series([
    // 获取数据源
    function(asyncCallback) {
      dataSourceModel.getWithCheck(id, null, function(err, dbRes) {
        if (err) return asyncCallback(err);

        dataSource = dbRes;
        if (dataSource.isBuiltin) {
          return asyncCallback(new E('EBizCondition.ModifyingBuiltinDataSourceNotAllowed', 'Modifying builtin data source is not allowed, please edit the config instead.'));
        }

        return asyncCallback();
      });
    },
    // 准备数据源配置
    function(asyncCallback) {
      if (toolkit.isNothing(data.configJSON)) return asyncCallback();

      DATA_SOURCE_CONFIG_PREPARE_FUNC_MAP[dataSource.type](data.configJSON, asyncCallback);
    },
    // 检查数据源配置
    function(asyncCallback) {
      if (toolkit.isNothing(data.configJSON)) return asyncCallback();

      var celery = celeryHelper.createHelper(res.locals.logger);

      var kwargs = {
        type  : dataSource.type,
        config: data.configJSON,
      };
      celery.putTask('DataFluxFunc.dataSourceChecker', null, kwargs, null, null, function(err, celeryRes, extraInfo) {
        if (err) return asyncCallback(err);

        celeryRes = celeryRes || {};
        extraInfo = extraInfo || {};

        var errorMessage = (celeryRes.einfoTEXT || '').trim().split('\n').pop().trim();
        if (celeryRes.status === 'FAILURE') {
          return asyncCallback(new E('EClientBadRequest.ConnectingToDataSourceFailed', toolkit.strf('Connecting to DataSource failed. {0}', errorMessage),  {
            etype: celeryRes.result && celeryRes.result.exc_type,
            error: errorMessage,
          }));
        } else if (extraInfo.status === 'TIMEOUT') {
          return asyncCallback(new E('EClientBadRequest.ConnectingToDataSourceFailed', 'Connecting to DataSource timeout.', {
            etype: celeryRes.result && celeryRes.result.exc_type,
          }));
        }

        return asyncCallback();
      });
    },
    // 数据入库
    function(asyncCallback) {
      dataSourceModel.modify(id, data, asyncCallback);
    },
    // 刷新helper缓存标志位
    function(asyncCallback) {
      updateDataSourceRefreshTimestamp(req, res, dataSource, asyncCallback);
    },
  ], function(err) {
    if (err) return next(err);

    var ret = toolkit.initRet({
      id: id,
    });
    return res.locals.sendJSON(ret);
  });
};

exports.delete = function(req, res, next) {
  var id = req.params.id;

  var dataSourceModel = dataSourceMod.createModel(req, res);

  var dataSource = null;

  async.series([
    // 获取数据源
    function(asyncCallback) {
      dataSourceModel.getWithCheck(id, null, function(err, dbRes) {
        if (err) return asyncCallback(err);

        dataSource = dbRes;
        if (dataSource.isBuiltin) {
          return asyncCallback(new E('EBizCondition.DeletingBuiltinDataSourceNotAllowed', 'Deleting builtin data source is not allowed.'));
        }

        return asyncCallback();
      });
    },
    // 数据入库
    function(asyncCallback) {
      dataSourceModel.delete(id, asyncCallback);
    },
    // 刷新helper缓存标志位
    function(asyncCallback) {
      updateDataSourceRefreshTimestamp(req, res, dataSource, asyncCallback);
    },
  ], function(err) {
    if (err) return next(err);

    var ret = toolkit.initRet({
      id: id,
    });
    return res.locals.sendJSON(ret);
  });
};

exports.query = function(req, res, next) {
  var id             = req.params.id;
  var database       = req.body.database;
  var queryStatement = req.body.queryStatement;
  var returnType     = req.body.returnType;

  var dataSourceModel = dataSourceMod.createModel(req, res);

  var dataSource  = null;
  var queryResult = null;

  async.series([
    // 获取数据源
    function(asyncCallback) {
      dataSourceModel.getWithCheck(id, null, function(err, dbRes) {
        if (err) return asyncCallback(err);

        dataSource = dbRes;

        return asyncCallback();
      });
    },
    // 执行查询
    function(asyncCallback) {
      // 准备参数
      var taskKwargs = {
        id           : dataSource.id,
        command      : null,
        commandArgs  : null,
        commandKwargs: {},
      };
      if (returnType) taskKwargs.returnType = returnType;

      switch(dataSource.type) {
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
      }

      if (!taskKwargs.command) return asyncCallback();

      // 指定数据库
      var dataSourceConfig = toolkit.jsonCopy(dataSource.configJSON);
      if (!toolkit.isNothing(database)) {
        switch(dataSource.type) {
          case 'influxdb':
            taskKwargs.commandKwargs.database = database;
            break;

          case 'mysql':
          case 'clickhouse':
          case 'oracle':
          case 'sqlserver':
          case 'postgresql':
          case 'redis':
            // 不支持指定数据库
            break;
        }
      }

      if (toolkit.isNothing(taskKwargs.commandKwargs)) {
        taskKwargs.commandKwargs = null;
      }

      // 执行命令
      var celery = celeryHelper.createHelper(res.locals.logger);

      celery.putTask('DataFluxFunc.dataSourceDebugger', null, taskKwargs, null, null, function(err, celeryRes, extraInfo) {
        if (err) return asyncCallback(err);

        celeryRes = celeryRes || {};
        extraInfo = extraInfo || {};

        var errorMessage = (celeryRes.einfoTEXT || '').trim().split('\n').pop().trim();
        if (celeryRes.status === 'FAILURE') {
          return asyncCallback(new E('EClientBadRequest.QueryFailed', toolkit.strf('Query failed. {0}', errorMessage),  {
            etype: celeryRes.result && celeryRes.result.exc_type,
            error: errorMessage,
          }));

        } else if (extraInfo.status === 'TIMEOUT') {
          return asyncCallback(new E('EClientBadRequest.QueryTimeout', 'Query timeout.', {
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

function hidePassword(req, res, ret, hookExtra, callback) {
  if (!ret.data) return callback(null, ret);

  toolkit.asArray(ret.data).forEach(function(d) {
    HIDE_CONFIG_FIELDS.forEach(function(f) {
      var fCipher = toolkit.strf('{0}Cipher', f);

      if (d && d.configJSON && d.configJSON[f]) {
        d.configJSON[f] = '';
      }
      if (d && d.configJSON && d.configJSON[fCipher]) {
        d.configJSON[f] = '';
        delete d.configJSON[fCipher];
      }
    });
  });

  return callback(null, ret);
};

function updateDataSourceRefreshTimestamp(req, res, dataSource, callback) {
  var tags    = ['id', dataSource.id];
  var cacheKey = toolkit.getWorkerCacheKey('cache', 'dataSourceRefreshTimestamp', tags);

  res.locals.cacheDB.set(cacheKey, Date.now(), callback);
};
