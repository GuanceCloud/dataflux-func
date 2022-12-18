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
  displayName: 'script failure',
  entityName : 'scriptFailure',
  tableName  : 'biz_main_script_failure',
  alias      : 'sfal',

  objectFields: {
    traceInfoJSON: 'json',
  },
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
  sql.append('   sfal.seq');
  sql.append('  ,sfal.id');
  sql.append('  ,sfal.funcId');
  sql.append('  ,sfal.scriptPublishVersion');
  sql.append('  ,sfal.execMode');
  sql.append('  ,sfal.einfoTEXT');
  sql.append('  ,sfal.exception');
  sql.append('  ,sfal.note');
  sql.append('  ,sfal.createTime');
  sql.append('  ,sfal.updateTime');

  sql.append('  ,func.id         AS func_id');
  sql.append('  ,func.name       AS func_name');
  sql.append('  ,func.title      AS func_title');
  sql.append('  ,func.definition AS func_definition');
  sql.append('  ,func.category   AS func_category');

  sql.append('FROM biz_main_script_failure AS sfal');

  sql.append('LEFT JOIN biz_main_func AS func');
  sql.append('  ON func.id = sfal.funcId');

  options.baseSQL = sql.toString();

  return this._list(options, callback);
};
