'use strict';

/* Builtin Modules */

/* 3rd-party Modules */
var async = require('async');

/* Project Modules */
var E           = require('../utils/serverError');
var CONFIG      = require('../utils/yamlResources').get('CONFIG');
var toolkit     = require('../utils/toolkit');
var modelHelper = require('../utils/modelHelper');

/* Configure */
var TABLE_OPTIONS = exports.TABLE_OPTIONS = {
  displayName: 'API auth',
  entityName : 'apiAuth',
  tableName  : 'biz_main_api_auth',
  alias      : 'apia',

  objectFields: {
    configJSON: 'json',
  },

  defaultOrders: [
    {field: 'apia.seq', method: 'ASC'},
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
  sql.append('   apia.*');

  sql.append('  ,func.id              AS func_id');
  sql.append('  ,func.name            AS func_name');
  sql.append('  ,func.title           AS func_title');
  sql.append('  ,func.description     AS func_description');
  sql.append('  ,func.definition      AS func_definition');
  sql.append('  ,func.argsJSON        AS func_argsJSON');
  sql.append('  ,func.kwargsJSON      AS func_kwargsJSON');
  sql.append('  ,func.extraConfigJSON AS func_extraConfigJSON');
  sql.append('  ,func.category        AS func_category');
  sql.append('  ,func.integration     AS func_integration');
  sql.append('  ,func.tagsJSON        AS func_tagsJSON');

  sql.append('  ,scpt.id             AS scpt_id');
  sql.append('  ,scpt.title          AS scpt_title');
  sql.append('  ,scpt.description    AS scpt_description');
  sql.append('  ,scpt.publishVersion AS scpt_publishVersion');

  sql.append('  ,sset.id          AS sset_id');
  sql.append('  ,sset.title       AS sset_title');
  sql.append('  ,sset.description AS sset_description');

  sql.append('FROM biz_main_api_auth AS apia');

  sql.append('LEFT JOIN biz_main_func AS func');
  sql.append('  ON func.id = JSON_UNQUOTE(JSON_EXTRACT(apia.configJSON, "$.funcId"))');

  sql.append('LEFT JOIN biz_main_script AS scpt');
  sql.append('  ON scpt.id = func.scriptId');

  sql.append('LEFT JOIN biz_main_script_set AS sset');
  sql.append('  ON sset.id = func.scriptSetId');


  options.baseSQL = sql.toString();

  return this._list(options, callback);
};

EntityModel.prototype.add = function(data, callback) {
  // 密码字段加密
  switch(data.type) {
    case 'httpBasic':
    case 'httpDigest':
      if (Array.isArray(data.configJSON.users)) {
        data.configJSON.users.forEach(function(x) {
          x.passwordCipher = toolkit.cipherByAES(x.password, CONFIG.SECRET);
          delete x.password;
        });
      }
      break;
  }

  try {
    data = _prepareData(data);
  } catch(err) {
    this.logger.logError(err);
    if (err instanceof E) {
      return callback(err);
    } else {
      return callback(new E('EClientBadRequest', 'Invalid request post data', {
        error: err.toString(),
      }));
    }
  }

  return this._add(data, callback);
};

EntityModel.prototype.modify = function(id, data, callback) {
  var self = this;

  async.series([
    // 获取之前的配置
    function(asyncCallback) {
      self.getWithCheck(id, ['type', 'configJSON'], function(err, dbRes) {
        if (err) return asyncCallback(err);

        var prevMap = null;
        switch(dbRes.type) {
          case 'httpBasic':
          case 'httpDigest':
            // 搜集上次填入的密码
            if (Array.isArray(dbRes.configJSON.users)) {
              prevMap = dbRes.configJSON.users.reduce(function(acc, x) {
                acc[x.username] = x.passwordCipher || '';
                return acc;
              }, {});
            }

            // 补全未修改的密码
            if (Array.isArray(data.configJSON.users)) {
              data.configJSON.users.forEach(function(x) {
                if (!x.password) {
                  // 未填写密码，则沿用上次
                  x.passwordCipher = prevMap[x.username] || '';

                } else {
                  // 已填写密码，则加密
                  x.passwordCipher = toolkit.cipherByAES(x.password, CONFIG.SECRET);
                }

                delete x.password;
              });
            }
            break;
        }

        return asyncCallback();
      });
    },
  ], function(err) {
    if (err) return callback(err);

    try {
      data = _prepareData(data);
    } catch(err) {
      self.logger.logError(err);
      if (err instanceof E) {
        return callback(err);
      } else {
        return callback(new E('EClientBadRequest', 'Invalid request post data', {
          error: err.toString(),
        }));
      }
    }

    return self._modify(id, data, callback);
  });
};

function _prepareData(data) {
  data = toolkit.jsonCopy(data);

  if (data.configJSON && 'object' === typeof data.configJSON) {
    data.configJSON = JSON.stringify(data.configJSON);
  }

  return data;
};
