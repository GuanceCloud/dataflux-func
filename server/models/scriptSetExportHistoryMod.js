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
  displayName: 'script set export history',
  entityName : 'scriptSetExportHistory',
  tableName  : 'biz_main_script_set_export_history',
  alias      : 'sseh',

  objectFields: {
    summaryJSON: 'json',
  },

  defaultOrders: [
    {field: 'sseh.seq', method: 'DESC'},
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
  sql.append('   sseh.seq');
  sql.append('  ,sseh.id');
  sql.append('  ,sseh.note');
  sql.append('  ,sseh.summaryJSON');
  sql.append('  ,sseh.createTime');
  sql.append('  ,sseh.updateTime');

  sql.append('FROM biz_main_script_set_export_history AS sseh');

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
      return callback(new E('EClientBadRequest', 'Invalid request post data.', {
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
