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
  displayName: 'batch task info',
  entityName : 'batchTaskInfo',
  tableName  : 'biz_main_batch_task_info',
  alias      : 'bati',
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
  sql.append('   bati.*');

  sql.append('  ,bat.id     AS bat_id');
  sql.append('  ,bat.funcId AS bat_funcId');
  sql.append('  ,bat.origin AS bat_origin');
  sql.append('  ,bat.note   AS bat_note');

  sql.append('  ,func.id         AS func_id');
  sql.append('  ,func.name       AS func_name');
  sql.append('  ,func.title      AS func_title');
  sql.append('  ,func.definition AS func_definition');
  sql.append('  ,func.category   AS func_category');

  sql.append('FROM biz_main_batch_task_info AS bati');

  sql.append('LEFT JOIN biz_main_batch AS bat');
  sql.append('  ON bat.id = bati.batchId');

  sql.append('LEFT JOIN biz_main_func AS func');
  sql.append('  ON func.id = bati.funcId');

  options.baseSQL = sql.toString();

  return this._list(options, callback);
};

EntityModel.prototype.countByBatchId = function(batchId, callback) {
  var batchIds = toolkit.asArray(batchId);
  if (toolkit.isNothing(batchIds)) return callback();

  var sql = toolkit.createStringBuilder();

  sql.append('SELECT');
  sql.append('     batchId');
  sql.append('    ,COUNT(*) AS count');

  sql.append('FROM biz_main_batch_task_info');

  var options = {
    baseSQL: sql.toString(),
    filters: {
      'batchId': {in: batchIds},
    },
    groups : ['batchId'],
  }

  return this._list(options, callback);
};

EntityModel.prototype.countByRootTaskId = function(rootTaskId, callback) {
  var rootTaskIds = toolkit.asArray(rootTaskId);
  if (toolkit.isNothing(rootTaskIds)) return callback();

  var sql = toolkit.createStringBuilder();

  sql.append('SELECT');
  sql.append('     rootTaskId');
  sql.append('    ,COUNT(*) AS count');

  sql.append('FROM biz_main_batch_task_info');

  var options = {
    baseSQL: sql.toString(),
    filters: {
      'rootTaskId': {in: rootTaskIds},
    },
    groups : ['rootTaskId'],
  }

  return this._list(options, callback);
};
