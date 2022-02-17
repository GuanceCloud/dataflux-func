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
  displayName: 'task info',
  entityName : 'taskInfo',
  tableName  : 'biz_main_task_info',
  alias      : 'task',

  objectFields: {
  },

  defaultOrders: [
    {field: 'task.seq', method: 'DESC'},
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
  sql.append('   task.*');
  sql.append('  ,COUNT(sub.seq) AS subTaskCount');

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

  sql.append('FROM biz_main_task_info AS task');

  sql.append('LEFT JOIN biz_main_func AS func');
  sql.append('  ON func.id = task.funcId');

  sql.append('LEFT JOIN biz_main_task_info AS sub');
  sql.append('  ON task.id = sub.rootTaskId');

  options.baseSQL = sql.toString();
  options.groups  = [ 'task.id' ];
  options.orders  = [ { field: 'task.seq', method: 'DESC' } ];

  if (options.filters['task.rootTaskId'] && options.filters['task.rootTaskId'].eq) {
    options.filters['task.rootTaskId'] = {
      raw: toolkit.strf('task.id = {0} OR task.rootTaskId = {0}', this.db.escape(options.filters['task.rootTaskId'].eq))
    }
  }

  this._list(options, callback);
};

EntityModel.prototype.deleteByOriginId = function(originId, callback) {
  var self = this;
  var sql = toolkit.createStringBuilder();
  sql.append('DELETE FROM biz_main_task_info');
  sql.append('WHERE');
  sql.append('  originId = ?');

  var sqlParams = [ originId ];
  self.db.query(sql, sqlParams, callback);
};
