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
var RESERVED_REF_NAME = 'dataflux_';

function _checkDataSourceConfig(locals, type, config, requiredFields, optionalFields, callback) {
  // 检查字段
  for (var i = 0; i < requiredFields.length; i++) {
    var f = requiredFields[i];

    if ('undefined' === typeof config[f]) {
      return callback(new E('EClientBadRequest.InvalidDataSourceConfigJSON', 'Invalid config JSON', {
        requiredFields: requiredFields,
        optionalFields: optionalFields,
      }));
    }
  }

  // 尝试连接
  var celery = celeryHelper.createHelper(locals.logger);

  var kwargs = {
    type  : type,
    config: config,
  };
  celery.putTask('Main.CheckDataSource', null, kwargs, null, null, function(err, celeryRes, extraInfo) {
    if (err) return callback(err);

    celeryRes = celeryRes || {};
    extraInfo = extraInfo || {};

    var errorMessage = (celeryRes.einfoTEXT || '').trim().split('\n').pop().trim();
    if (celeryRes.status === 'FAILURE') {
      return callback(new E('EClientBadRequest.ConnectingToDataSourceFailed', 'Connecting to DataSource failed', {
        etype  : celeryRes.result && celeryRes.result.exc_type,
        message: errorMessage,
      }));
    } else if (extraInfo.status === 'TIMEOUT') {
      return callback(new E('EClientBadRequest.ConnectingToDataSourceFailed', 'Connecting to DataSource timeout', {
        etype: celeryRes.result && celeryRes.result.exc_type,
      }));
    }

    return callback();
  });
}

var DATA_SOURCE_CHECK_CONFIG_FUNC_MAP = {
  df_dataway: function(locals, config, callback) {
    // 默认值
    config.port     = config.port     || 9528;
    config.protocol = config.protocol || 'http';

    var REQUIRED_FIELDS = ['host', 'port'];
    var OPTIONAL_FIELDS = ['protocol', 'token', 'accessKey', 'secretKey'];

    return _checkDataSourceConfig(locals, 'df_dataway', config, REQUIRED_FIELDS, OPTIONAL_FIELDS, callback);
  },
  df_datakit: function(locals, config, callback) {
    // 默认值
    config.port     = config.port     || 9529;
    config.protocol = config.protocol || 'http';

    var REQUIRED_FIELDS = ['host', 'port'];
    var OPTIONAL_FIELDS = ['protocol', 'source'];

    return _checkDataSourceConfig(locals, 'df_datakit', config, REQUIRED_FIELDS, OPTIONAL_FIELDS, callback);
  },
  dff_sidecar: function(locals, config, callback) {
    // 默认值
    config.host     = config.host     || '172.17.0.1';
    config.port     = config.port     || 8099;
    config.protocol = config.protocol || 'http';

    var REQUIRED_FIELDS = ['host', 'port', 'secretKey'];
    var OPTIONAL_FIELDS = ['protocol'];

    return _checkDataSourceConfig(locals, 'dff_sidecar', config, REQUIRED_FIELDS, OPTIONAL_FIELDS, callback);
  },
  influxdb: function(locals, config, callback) {
    // 默认值
    config.port     = config.port     || 8086;
    config.protocol = config.protocol || 'http';

    var REQUIRED_FIELDS = ['host'];
    var OPTIONAL_FIELDS = ['port', 'protocol', 'database', 'user', 'password'];

    return _checkDataSourceConfig(locals, 'influxdb', config, REQUIRED_FIELDS, OPTIONAL_FIELDS, callback);
  },
  mysql: function(locals, config, callback) {
    // 默认值
    config.port    = config.port    || 3306;
    config.charset = config.charset || 'utf8mb4';

    var REQUIRED_FIELDS = ['host', 'database', 'user', 'password', 'charset'];
    var OPTIONAL_FIELDS = ['port'];

    return _checkDataSourceConfig(locals, 'mysql', config, REQUIRED_FIELDS, OPTIONAL_FIELDS, callback);
  },
  redis: function(locals, config, callback) {
    // 默认值
    config.port     = config.port     || 6379;
    config.password = config.password || null;
    config.database = config.database || 0;

    var REQUIRED_FIELDS = ['host', 'database'];
    var OPTIONAL_FIELDS = ['port', 'password', 'topicHandlers'];

    return _checkDataSourceConfig(locals, 'redis', config, REQUIRED_FIELDS, OPTIONAL_FIELDS, callback);
  },
  memcached: function(locals, config, callback) {
    // 默认值
    config.port = config.port || 11211;

    var REQUIRED_FIELDS = ['servers'];
    var OPTIONAL_FIELDS = [];

    return _checkDataSourceConfig(locals, 'memcached', config, REQUIRED_FIELDS, OPTIONAL_FIELDS, callback);
  },
  clickhouse: function(locals, config, callback) {
    // 默认值
    config.port = config.port || 9000;
    config.user = config.user || 'default';

    var REQUIRED_FIELDS = ['host', 'database'];
    var OPTIONAL_FIELDS = ['port', 'user', 'password'];

    return _checkDataSourceConfig(locals, 'clickhouse', config, REQUIRED_FIELDS, OPTIONAL_FIELDS, callback);
  },
  oracle: function(locals, config, callback) {
    // 默认值
    config.port    = config.port    || 1521;
    config.charset = config.charset || 'utf8';

    var REQUIRED_FIELDS = ['host', 'database', 'user', 'password', 'charset'];
    var OPTIONAL_FIELDS = ['port'];

    return _checkDataSourceConfig(locals, 'oracle', config, REQUIRED_FIELDS, OPTIONAL_FIELDS, callback);
  },
  sqlserver: function(locals, config, callback) {
    // 默认值
    config.port    = config.port    || 1433;
    config.charset = config.charset || 'utf8';

    var REQUIRED_FIELDS = ['host', 'database', 'user', 'password', 'charset'];
    var OPTIONAL_FIELDS = ['port'];

    return _checkDataSourceConfig(locals, 'sqlserver', config, REQUIRED_FIELDS, OPTIONAL_FIELDS, callback);
  },
  postgresql: function(locals, config, callback) {
    // 默认值
    config.port    = config.port    || 5432;
    config.charset = config.charset || 'utf8';

    var REQUIRED_FIELDS = ['host', 'database', 'user', 'password', 'charset'];
    var OPTIONAL_FIELDS = ['port'];

    return _checkDataSourceConfig(locals, 'postgresql', config, REQUIRED_FIELDS, OPTIONAL_FIELDS, callback);
  },
  mongodb: function(locals, config, callback) {
    // 默认值
    config.port = config.port || 27017;

    var REQUIRED_FIELDS = ['host'];
    var OPTIONAL_FIELDS = ['port', 'user', 'password', 'database'];

    return _checkDataSourceConfig(locals, 'mongodb', config, REQUIRED_FIELDS, OPTIONAL_FIELDS, callback);
  },
  elasticsearch: function(locals, config, callback) {
    // 默认值
    config.port     = config.port     || 9200;
    config.protocol = config.protocol || 'http';

    var REQUIRED_FIELDS = ['host'];
    var OPTIONAL_FIELDS = ['port', 'protocol', 'user', 'password'];

    return _checkDataSourceConfig(locals, 'elasticsearch', config, REQUIRED_FIELDS, OPTIONAL_FIELDS, callback);
  },
  nsq: function(locals, config, callback) {
    // 默认值
    config.port = config.port || 4161;

    var REQUIRED_FIELDS = [];
    var OPTIONAL_FIELDS = ['host', 'port', 'protocol', 'servers'];

    return _checkDataSourceConfig(locals, 'nsq', config, REQUIRED_FIELDS, OPTIONAL_FIELDS, callback);
  },
  mqtt: function(locals, config, callback) {
    // 默认值
    config.port = config.port || 1883;

    var REQUIRED_FIELDS = ['host', 'port'];
    var OPTIONAL_FIELDS = ['user', 'password', 'clientId', 'topicHandlers'];

    return _checkDataSourceConfig(locals, 'mqtt', config, REQUIRED_FIELDS, OPTIONAL_FIELDS, callback);
  },
};

/* Handlers */
var crudHandler = exports.crudHandler = dataSourceMod.createCRUDHandler();

exports.list = crudHandler.createListHandler(null, {beforeResp: hidePassword});

exports.add = function(req, res, next) {
  var data = req.body.data;

  if (toolkit.startsWith(data.id, RESERVED_REF_NAME)) {
    return next(new E('EBizCondition.ReservedDataSourceIDPrefix', 'Cannot use a ID of reserved prefix'));
  }

  var dataSourceModel = dataSourceMod.createModel(res.locals);

  var newDataSource = null;

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
          return asyncCallback(new E('EBizCondition.DuplicatedDataSourceID', 'ID of data source already exists'));
        }

        return asyncCallback();
      });
    },
    // 检查数据源配置
    function(asyncCallback) {
      if (toolkit.isNothing(data.configJSON)) return asyncCallback();

      DATA_SOURCE_CHECK_CONFIG_FUNC_MAP[data.type](res.locals, data.configJSON, asyncCallback);
    },
    // 数据入库
    function(asyncCallback) {
      dataSourceModel.add(data, function(err, _addedId, _addedData) {
        if (err) return asyncCallback(err);

        newDataSource = _addedData;

        return asyncCallback();
      });
    },
    // 刷新helper缓存标志位
    function(asyncCallback) {
      updateRefreshTimestamp(res.locals, newDataSource.id, asyncCallback);
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

  var dataSourceModel = dataSourceMod.createModel(res.locals);

  var dataSource = null;

  async.series([
    // 获取数据源
    function(asyncCallback) {
      dataSourceModel.getWithCheck(id, null, function(err, dbRes) {
        if (err) return asyncCallback(err);

        dataSource = dbRes;
        if (dataSource.isBuiltin) {
          return asyncCallback(new E('EBizCondition.ModifyingBuiltinDataSourceNotAllowed', 'Modifying builtin data source is not allowed, please edit the config instead'));
        }

        return asyncCallback();
      });
    },
    // 检查数据源配置
    function(asyncCallback) {
      if (toolkit.isNothing(data.configJSON)) return asyncCallback();

      DATA_SOURCE_CHECK_CONFIG_FUNC_MAP[dataSource.type](res.locals, data.configJSON, asyncCallback);
    },
    // 数据入库
    function(asyncCallback) {
      dataSourceModel.modify(id, data, asyncCallback);
    },
    // 刷新helper缓存标志位
    function(asyncCallback) {
      updateRefreshTimestamp(res.locals, dataSource.id, asyncCallback);
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

  var dataSourceModel = dataSourceMod.createModel(res.locals);

  var dataSource = null;

  async.series([
    // 获取数据源
    function(asyncCallback) {
      dataSourceModel.getWithCheck(id, null, function(err, dbRes) {
        if (err) return asyncCallback(err);

        dataSource = dbRes;
        if (dataSource.isBuiltin) {
          return asyncCallback(new E('EBizCondition.DeletingBuiltinDataSourceNotAllowed', 'Deleting builtin data source is not allowed'));
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
      updateRefreshTimestamp(res.locals, dataSource.id, asyncCallback);
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

  var dataSourceModel = dataSourceMod.createModel(res.locals);

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

        default:
          // 不支持查询
          break;
      }

      if (!taskKwargs.command) return asyncCallback();

      // 指定数据库
      var dataSourceConfig = toolkit.jsonCopy(dataSource.configJSON);
      if (!toolkit.isNothing(database)) {
        switch(dataSource.type) {
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

      celery.putTask('Main.QueryDataSource', null, taskKwargs, null, null, function(err, celeryRes, extraInfo) {
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

  var dataSourceModel = dataSourceMod.createModel(res.locals);

  var dataSource = null;

  async.series([
    // 获取数据源
    function(asyncCallback) {
      dataSourceModel.getWithCheck(id, null, function(err, dbRes) {
        if (err) return asyncCallback(err);

        dataSource = dbRes;

        // 解密相关字段
        if (dataSource.configJSON && 'object' === typeof dataSource.configJSON) {
          dataSourceMod.CIPHER_CONFIG_FIELDS.forEach(function(f) {
            var fCipher = toolkit.strf('{0}Cipher', f);

            if (dataSource.configJSON[fCipher]) {
              try {
                dataSource.configJSON[f] = toolkit.decipherByAES(dataSource.configJSON[fCipher], CONFIG.SECRET);
              } catch(err) {
                dataSource.configJSON[f] = '';
              }

              delete dataSource.configJSON[fCipher];
            }
          });
        }

        return asyncCallback();
      });
    },
    // 检查数据源配置
    function(asyncCallback) {
      DATA_SOURCE_CHECK_CONFIG_FUNC_MAP[dataSource.type](res.locals, dataSource.configJSON, asyncCallback);
    },
  ], function(err) {
    if (err) return next(err);

    var ret = toolkit.initRet({
      checkResult: 'OK',
    });
    return res.locals.sendJSON(ret);
  });
};

function hidePassword(req, res, ret, hookExtra, callback) {
  if (!ret.data) return callback(null, ret);

  toolkit.asArray(ret.data).forEach(function(d) {
    dataSourceMod.CIPHER_CONFIG_FIELDS.forEach(function(f) {
      var fCipher = toolkit.strf('{0}Cipher', f);

      if (d && d.configJSON) {
        if (f in d.configJSON) {
          d.configJSON[f] = '';
        }
        if (fCipher in d.configJSON) {
          delete d.configJSON[fCipher];
        }
      }
    });
  });

  return callback(null, ret);
};

var updateRefreshTimestamp = exports.updateRefreshTimestamp = function(locals, dataSourceIds, callback) {
  var cacheKey = toolkit.getWorkerCacheKey('cache', 'dataSourceRefreshTimestampMsMap');

  async.series([
    function(asyncCallback) {
      if (!toolkit.isNothing(dataSourceIds)) {
        dataSourceIds = toolkit.asArray(dataSourceIds);
        return asyncCallback();
      }

      locals.cacheDB.hkeys(cacheKey, '*', function(err, cacheRes) {
        if (err) return asyncCallback(err);

        dataSourceIds = cacheRes;

        return asyncCallback();
      });
    },
    function(asyncCallback) {
      async.eachSeries(dataSourceIds, function(dataSourceId, eachCallback) {
        locals.cacheDB.hset(cacheKey, dataSourceId, Date.now(), eachCallback);
      }, asyncCallback);
    },
  ], callback);
};