'use strict';

/* Built-in Modules */

/* 3rd-party Modules */
var async = require('async');

/* Project Modules */
var E           = require('../utils/serverError');
var CONFIG      = require('../utils/yamlResources').get('CONFIG');
var toolkit     = require('../utils/toolkit');
var modelHelper = require('../utils/modelHelper');

var scriptSetMod = require('./scriptSetMod');

/* Configure */
var TABLE_OPTIONS = exports.TABLE_OPTIONS = {
  displayName: 'script recover point',
  entityName : 'scriptRecoverPoint',
  tableName  : 'biz_main_script_recover_point',
  alias      : 'srpt',

  defaultOrders: [
    {field: 'srpt.seq', method: 'DESC'},
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
  sql.append('   srpt.seq');
  sql.append('  ,srpt.id');
  sql.append('  ,srpt.type');
  sql.append('  ,srpt.note');
  sql.append('  ,srpt.createTime');
  sql.append('  ,srpt.updateTime');

  sql.append('FROM biz_main_script_recover_point AS srpt');

  options.baseSQL = sql.toString();

  return this._list(options, callback);
};

EntityModel.prototype.add = function(data, callback) {
  var self = this;

  var scriptSetModel = scriptSetMod.createModel(self.locals);

  var scriptRecoverPointId = null;
  var allScriptSetIds = [];
  async.series([
    // 查询所有脚本集 ID
    function(asyncCallback) {
      var sql = toolkit.createStringBuilder();
      sql.append('SELECT');
      sql.append('   sset.id');

      sql.append('FROM biz_main_script_set AS sset');

      sql.append('ORDER BY');
      sql.append('  sset.id ASC');

      self.db.query(sql, null, function(err, dbRes) {
        if (err) return asyncCallback(err);

        allScriptSetIds = toolkit.arrayElementValues(dbRes, 'id');

        return asyncCallback();
      });
    },
    // 获取导出数据
    function(asyncCallback) {
      var opt = {
        scriptSetIds : allScriptSetIds,
        withCodeDraft: true,
        note         : 'Recover Point',
      }
      scriptSetModel.getExportData(opt, function(err, exportData) {
        if (err) return asyncCallback(err);

        data.exportData = toolkit.getGzipBase64(exportData);

        return asyncCallback();
      });
    },
    // 写入数据库
    function(asyncCallback) {
      self._add(data, function(err, addedId) {
        if (err) return asyncCallback(err);

        scriptRecoverPointId = addedId;

        return asyncCallback();
      });
    },
  ], function(err) {
    if (err) return callback(err);

    return callback(null, scriptRecoverPointId);
  });
};

EntityModel.prototype.recover = function(id, callback) {
  var self = this;

  var scriptSetModel = scriptSetMod.createModel(self.locals);

  var scriptRecoverPoint = null;
  async.series([
    // 获取还原点
    function(asyncCallback) {
      self.getWithCheck(id, null, function(err, dbRes) {
        if (err) return asyncCallback(err);

        scriptRecoverPoint = dbRes;

        return asyncCallback();
      })
    },
    // 从还原点导入数据
    function(asyncCallback) {
      var importData = toolkit.fromGzipBase64(scriptRecoverPoint.exportData);
      var recoverPoint = {
        type: 'recover',
        note: `System: Before recovering Script Lib to #${scriptRecoverPoint.seq}`,
      }
      scriptSetModel.import(importData, recoverPoint, asyncCallback);
    },
  ], function(err) {
    if (err) return callback(err);
    return callback();
  });
};
