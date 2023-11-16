'use strict';

/* Built-in Modules */

/* 3rd-party Modules */
var async  = require('async');
var moment = require('moment-timezone');

/* Project Modules */
var E           = require('../utils/serverError');
var CONFIG      = require('../utils/yamlResources').get('CONFIG');
var toolkit     = require('../utils/toolkit');
var modelHelper = require('../utils/modelHelper');

/* Init */
var TABLE_OPTIONS = exports.TABLE_OPTIONS = {
  displayName: 'task record func',
  entityName : 'taskRecordFunc',
  tableName  : 'biz_main_task_record_func',
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

  sql.append('FROM biz_main_task_record_func AS task');

  sql.append('LEFT JOIN biz_main_func AS func');
  sql.append('  ON func.id = task.funcId');

  options.baseSQL = sql.toString();

  if (options.filters['task.rootTaskId'] && options.filters['task.rootTaskId'].eq) {
    options.filters['task.rootTaskId'] = {
      raw: toolkit.strf('task.id = {0} OR task.rootTaskId = {0}', this.db.escape(options.filters['task.rootTaskId'].eq))
    }
  }

  this._list(options, callback);
};

EntityModel.prototype.getStatistics = function(groupField, groupIds, callback) {
  groupIds = toolkit.asArray(groupIds);

  var sql = toolkit.createStringBuilder();
  sql.append('SELECT');
  sql.append('   b.*');
  sql.append('  ,a.startTimeMs   AS lastStartTime');
  sql.append('  ,a.status        AS lastStatus');
  sql.append('  ,a.exceptionTEXT AS lastExceptionTEXT');
  sql.append('FROM biz_main_task_record_func AS a');
  sql.append('JOIN (SELECT');
  sql.append('         ??                                      AS groupId');
  sql.append('        ,MAX(seq)                                AS seq');
  sql.append('        ,COUNT(*)                                AS taskRecordCount');
  sql.append("        ,COUNT(IF(status =  'success', 1, NULL)) AS recentSuccessCount");
  sql.append("        ,COUNT(IF(status != 'success', 1, NULL)) AS recentFailureCount");
  sql.append('      FROM biz_main_task_record_func');
  sql.append('      WHERE');
  sql.append('        ?? IN (?)');
  sql.append('      GROUP BY');
  sql.append('        ??');
  sql.append(') AS b');
  sql.append('  ON a.seq = b.seq');

  var sqlParams = [ groupField, groupField, groupIds, groupField ];
  this.db.query(sql, sqlParams, function(err, dbRes) {
    if (err) return callback(err);

    var statisticMap = {};
    dbRes.forEach(function(d) {
      if (!d.groupId) return;

      // lastStartTime 转 ISO8601
      if (d.lastStartTime) {
        d.lastStartTime = moment(d.lastStartTime).toISOString();
      }

      statisticMap[d.groupId] = d;
    });

    return callback(null, statisticMap);
  });
};

EntityModel.prototype.appendSubTaskCount = function(data, callback) {
  if (toolkit.isNothing(data)) return callback(null, data);

  var rootTaskIds = toolkit.arrayElementValues(data, 'id');

  var sql = toolkit.createStringBuilder();
  sql.append('SELECT');
  sql.append('  sub.rootTaskId,');
  sql.append('  COUNT(sub.seq) AS subTaskCount');
  sql.append('FROM');
  sql.append('  biz_main_task_record_func AS sub');
  sql.append('WHERE');
  sql.append('  sub.rootTaskId IN (?)');
  sql.append('GROUP BY');
  sql.append('  sub.rootTaskId');

  var sqlParams = [ rootTaskIds ];
  this.db.query(sql, sqlParams, function(err, dbRes) {
    if (err) return callback(err);

    // 整理成map
    var subTaskCountMap = {};
    dbRes.forEach(function(d) {
      if (!d.rootTaskId) return;

      subTaskCountMap[d.rootTaskId] = d.subTaskCount;
    });

    // 填入数据
    data.forEach(function(x) {
      var subTaskCount = subTaskCountMap[x.id] || 0;
      x.subTaskCount = subTaskCount || 0;
    });

    return callback(null, data);
  });
};
