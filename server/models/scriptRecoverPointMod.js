'use strict';

/* Builtin Modules */

/* 3rd-party Modules */
var async     = require('async');
var validator = require('validator');

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

  objectFields: {
    hasTableDumpJSON: 'boolean',
    hasExportData   : 'boolean',
  },

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
  sql.append('  ,NOT ISNULL(srpt.tableDumpJSON) AS hasTableDumpJSON');
  sql.append('  ,NOT ISNULL(srpt.exportData)    AS hasExportData');
  sql.append('  ,srpt.note');
  sql.append('  ,srpt.createTime');
  sql.append('  ,srpt.updateTime');

  sql.append('FROM biz_main_script_recover_point AS srpt');

  options.baseSQL = sql.toString();

  return this._list(options, callback);
};

EntityModel.prototype.add = function(data, callback) {
  var self = this;

  var scriptRecoverPointId = null;

  var allScriptSetIds = [];
  async.series([
    // 查询所有脚本集ID
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
      var scriptSetModel = scriptSetMod.createModel(self.locals);

      var opt = {
        scriptSetIds: allScriptSetIds,
        note        : 'Recover Point',
      }
      scriptSetModel.export(opt, function(err, fileBuf) {
        if (err) return asyncCallback(err);

        data.exportData = fileBuf;

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

/*【注意】
 * 本方法已经过时，仅适用于旧数据的还原
 * 新还原方式为直接调用`POST /api/v1/script-sets/do/import`指定还原点来还原
 * 区分方式为判断`biz_main_script_recover_point.exportData`是否为NULL
 */
EntityModel.prototype.recover = function(id, data, callback) {
  var self = this;

  var scriptRecoverPoint = null;

  var transScope = modelHelper.createTransScope(self.db);
  async.series([
    // 获取还原点
    function(asyncCallback) {
      self.getWithCheck(id, null, function(err, dbRes) {
        if (err) return asyncCallback(err);

        scriptRecoverPoint = dbRes;

        return asyncCallback();
      })
    },
    function(asyncCallback) {
      transScope.start(asyncCallback);
    },
    // 创建还原点
    function(asyncCallback) {
      var _data = {
        type: 'recover',
        note: '系统：还原脚本至还原点 #' + scriptRecoverPoint.seq,
      }
      self.add(_data, asyncCallback);
    },
    // 还原数据库
    function(asyncCallback) {
      async.eachOfSeries(scriptRecoverPoint.tableDumpJSON, function(tableData, tableName, eachCallback) {
        async.series([
          // 删除旧数据
          function(innerCallback) {
            var sql = toolkit.createStringBuilder();
            sql.append('DELETE FROM ??');

            var sqlParams = [tableName];
            self.db.query(sql, sqlParams, innerCallback);
          },
          // 重新插入数据
          function(innerCallback) {
            // 防止SQL语句过长，逐条插入
            async.eachSeries(tableData, function(_data, innerEachCallback) {
              // 转换日期
              for (var k in _data) if (_data.hasOwnProperty(k)) {
                var v = _data[k];
                if ('string' === typeof v
                    && k.slice(-4) === 'Time'
                    && validator.isISO8601(v)) {
                  _data[k] = new Date(v);
                }

                if ('string' !== typeof v
                    && k.slice(-4) === 'JSON') {
                  _data[k] = JSON.stringify(v);
                }
              }

              var sql = toolkit.createStringBuilder();
              sql.append('INSERT INTO ??');
              sql.append('SET');
              sql.append('  ?');

              var sqlParams = [tableName, _data];
              self.db.query(sql, sqlParams, innerEachCallback);
            }, innerCallback);
          },
        ], eachCallback);
      }, asyncCallback);
    },
  ], function(err) {
    transScope.end(err, function(scopeErr) {
      if (scopeErr) return callback(scopeErr);

      return callback();
    });
  });
};
