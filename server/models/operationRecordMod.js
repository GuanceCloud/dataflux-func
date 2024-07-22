'use strict';

/* Built-in Modules */

/* 3rd-party Modules */
var async = require('async');

/* Project Modules */
var E           = require('../utils/serverError');
var CONFIG      = require('../utils/yamlResources').get('CONFIG');
var toolkit     = require('../utils/toolkit');
var modelHelper = require('../utils/modelHelper');
var routeLoader = require('../utils/routeLoader');

/* Init */
var TABLE_OPTIONS = exports.TABLE_OPTIONS = {
  displayName: 'operation record',
  entityName : 'operationRecord',
  tableName  : 'biz_main_operation_record',
  alias      : 'oprd',

  objectFields: {
    clientIPsJSON  : 'json',
    reqQueryJSON   : 'json',
    reqParamsJSON  : 'json',
    reqBodyJSON    : 'json',
    reqFileInfoJSON: 'json',
    respBodyJSON   : 'json',
  },

  defaultOrders: [
    {field: 'oprd.seq', method: 'DESC'},
  ],
};

exports.createCRUDHandler = function() {
  return modelHelper.createCRUDHandler(EntityModel);
};

exports.createModel = function(locals) {
  return new EntityModel(locals);
};

var EntityModel = exports.EntityModel = modelHelper.createSubModel(TABLE_OPTIONS);

EntityModel.prototype.list = function(options, callback) {
  options = options || {};

  var sql = toolkit.createStringBuilder();
  sql.append('SELECT');
  sql.append('   oprd.*');

  sql.append('  ,u.id       AS u_id');
  sql.append('  ,u.username AS u_username');
  sql.append('  ,u.name     AS u_name');
  sql.append('  ,u.mobile   AS u_mobile');

  sql.append('FROM biz_main_operation_record AS oprd');

  sql.append('LEFT JOIN wat_main_user AS u');
  sql.append('  ON oprd.userId = u.id');

  options.baseSQL = sql.toString();

  return this._list(options, function(err, dbRes, pageInfo) {
    if (err) return callback(err);

    if (dbRes.length > 0) {
      dbRes.forEach(function(d) {
        // 补充操作描述/用户名
        if (d.reqMethod && d.reqRoute) {
          var key   = `${d.reqMethod.toUpperCase()} ${d.reqRoute}`;
          var route = routeLoader.getRoute(key);

          // 已删除的接口忽略
          if (!route) return;

          var rawAPIName = d.reqRouteName || `${route.reqMethod} ${route.reqRoute}`;
          d.reqRouteNames = {
            'en'     : route.name      || rawAPIName,
            'zh-CN'  : route.name_zhCN || rawAPIName,
            'default': route.name_zhCN || rawAPIName,
          }
        }

        // 补充数据
        if (d.reqRoute) {
          if (toolkit.endsWith(d.reqRoute, '/sign-in')) {
            try { d.username = d.respBodyJSON.data.username } catch(_) {}

          } else if (d.reqParamsJSON && d.reqParamsJSON.id) {
            try { d._operationEntityId = d.reqParamsJSON.id } catch(_) {}

          } else if (d.respBodyJSON && d.respBodyJSON.data && d.respBodyJSON.data.id) {
            try { d._operationEntityId = d.respBodyJSON.data.id } catch(_) {}

          } else if (d.reqQueryJSON && d.reqQueryJSON.id) {
            try { d._operationEntityId = d.reqQueryJSON.id } catch(_) {}
          }
        }
      });
    }

    return callback(null, dbRes, pageInfo);
  });
};

EntityModel.prototype.add = function(data, callback) {
  try {
    data = _prepareData(data);

  } catch(err) {
    this.logger.logError(err);
    if (err instanceof E) {
      return callback && callback(err);
    } else {
      return callback && callback(new E('EClientBadRequest', 'Invalid request post data'));
    }
  }

  return this._add(data, callback);
};

EntityModel.prototype.modify = function(id, data, callback) {
  return callback(new E('EClientUnsupported', 'Operation Record cannot be modified'));
};

EntityModel.prototype.delete = function(id, callback) {
  return callback(new E('EClientUnsupported', 'Operation Record cannot be deleted'));
};

function _maskSecret(o) {
  for (var k in o) {
    if (k.toLowerCase().match(/(password)|(secret)|(token)/gi)) {
      o[k] = '***';
    } else {
      // 向下遍历
      if (Array.isArray(o[k])) {
        for (var i = 0; i < o[k].length; i++) {
          o[k][i] = _maskSecret(o[k][i]);
        }

      } else if (o[k] && 'object' === typeof o[k]) {
        o[k] = _maskSecret(o[k]);
      }
    }
  }
  return o;
};

function _prepareData(data) {
  data = toolkit.jsonCopy(data);

  data = _maskSecret(data);

  if (data.clientIPsJSON && 'object' === typeof data.clientIPsJSON) {
    data.clientIPsJSON = JSON.stringify(data.clientIPsJSON);
  }
  if (data.reqQueryJSON && 'object' === typeof data.reqQueryJSON) {
    data.reqQueryJSON = JSON.stringify(data.reqQueryJSON);
  }
  if (data.reqParamsJSON && 'object' === typeof data.reqParamsJSON) {
    data.reqParamsJSON = JSON.stringify(data.reqParamsJSON);
  }
  if (data.reqBodyJSON && 'object' === typeof data.reqBodyJSON) {
    data.reqBodyJSON = JSON.stringify(data.reqBodyJSON);
  }
  if (data.reqFileInfoJSON && 'object' === typeof data.reqFileInfoJSON) {
    data.reqFileInfoJSON = JSON.stringify(data.reqFileInfoJSON);
  }
  if (data.respBodyJSON && 'object' === typeof data.respBodyJSON) {
    data.respBodyJSON = JSON.stringify(data.respBodyJSON);
  }

  return data;
};
