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
  displayName: 'crontab task info',
  entityName : 'crontabTaskInfo',
  tableName  : 'biz_main_crontab_task_info',
  alias      : 'crti',
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
  sql.append('   crti.*');

  sql.append('  ,cron.id     AS cron_id');
  sql.append('  ,cron.funcId AS cron_funcId');
  sql.append('  ,cron.origin AS cron_origin');
  sql.append('  ,cron.note   AS cron_note');

  sql.append('  ,func.id         AS func_id');
  sql.append('  ,func.name       AS func_name');
  sql.append('  ,func.title      AS func_title');
  sql.append('  ,func.definition AS func_definition');
  sql.append('  ,func.category   AS func_category');

  sql.append('FROM biz_main_crontab_task_info AS crti');

  sql.append('LEFT JOIN biz_main_crontab_config AS cron');
  sql.append('  ON cron.id = crti.crontabConfigId');

  sql.append('LEFT JOIN biz_main_func AS func');
  sql.append('  ON func.id = crti.funcId');

  options.baseSQL = sql.toString();

  return this._list(options, callback);
};

EntityModel.prototype.countByCrontabConfigId = function(crontabConfigId, callback) {
  var crontabConfigIds = toolkit.asArray(crontabConfigId);
  if (toolkit.isNothing(crontabConfigIds)) return callback();

  var sql = toolkit.createStringBuilder();

  sql.append('SELECT');
  sql.append('     crontabConfigId');
  sql.append('    ,COUNT(*) AS count');

  sql.append('FROM biz_main_crontab_task_info');

  var options = {
    baseSQL: sql.toString(),
    filters: {
      'crontabConfigId': {in: crontabConfigIds},
    },
    groups : ['crontabConfigId'],
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

  sql.append('FROM biz_main_crontab_task_info');

  var options = {
    baseSQL: sql.toString(),
    filters: {
      'rootTaskId': {in: rootTaskIds},
    },
    groups : ['rootTaskId'],
  }

  return this._list(options, callback);
};
