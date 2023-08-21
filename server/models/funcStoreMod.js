'use strict';

/* Built-in Modules */

/* 3rd-party Modules */
var async = require('async');

/* Project Modules */
var E           = require('../utils/serverError');
var CONFIG      = require('../utils/yamlResources').get('CONFIG');
var toolkit     = require('../utils/toolkit');
var modelHelper = require('../utils/modelHelper');

/* Init */
var TABLE_OPTIONS = exports.TABLE_OPTIONS = {
  displayName: 'func store',
  entityName : 'funcStore',
  tableName  : 'biz_main_func_store',
  alias      : 'fnst',

  objectFields: {
    valueJSON: 'json',
  },

  defaultOrders: [
    {field: 'fnst.seq', method: 'DESC'},
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
  sql.append('   fnst.seq');
  sql.append('  ,fnst.id');
  sql.append('  ,fnst.scope');
  sql.append('  ,fnst.key');
  sql.append('  ,JSON_TYPE(fnst.valueJSON) AS `type`');
  sql.append('  ,fnst.expireAt');
  sql.append('  ,fnst.createTime');
  sql.append('  ,fnst.updateTime');
  sql.append('  ,LENGTH(fnst.valueJSON) AS dataSize');

  sql.append('FROM biz_main_func_store AS fnst');

  options.baseSQL = sql.toString();

  return this._list(options, callback);
};
