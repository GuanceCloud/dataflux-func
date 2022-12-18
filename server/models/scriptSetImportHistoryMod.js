'use strict';

/* Built-in Modules */

/* 3rd-party Modules */
var async = require('async');

/* Project Modules */
var E           = require('../utils/serverError');
var CONFIG      = require('../utils/yamlResources').get('CONFIG');
var toolkit     = require('../utils/toolkit');
var modelHelper = require('../utils/modelHelper');

/* Configure */
var TABLE_OPTIONS = exports.TABLE_OPTIONS = {
  displayName: 'script set import history',
  entityName : 'scriptSetImportHistory',
  tableName  : 'biz_main_script_set_import_history',
  alias      : 'ssih',

  objectFields: {
    summaryJSON: 'json',
  },

  defaultOrders: [
    {field: 'ssih.seq', method: 'DESC'},
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
  sql.append('   ssih.seq');
  sql.append('  ,ssih.id');
  sql.append('  ,ssih.note');
  sql.append('  ,ssih.summaryJSON');
  sql.append('  ,ssih.createTime');
  sql.append('  ,ssih.updateTime');

  sql.append('FROM biz_main_script_set_import_history AS ssih');

  options.baseSQL = sql.toString();

  return this._list(options, callback);
};

EntityModel.prototype.add = function(data, callback) {
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

function _prepareData(data) {
  data = toolkit.jsonCopy(data);

  if (data.summaryJSON && 'object' === typeof data.summaryJSON) {
    data.summaryJSON = JSON.stringify(data.summaryJSON);
  }

  return data;
};
