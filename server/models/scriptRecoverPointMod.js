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

/* Configure */
var TABLE_OPTIONS = exports.TABLE_OPTIONS = {
  displayName: 'script recover point',
  entityName : 'scriptRecoverPoint',
  tableName  : 'biz_main_script_recover_point',
  alias      : 'srpt',

  objectFields: {
    tableDumpJSON: 'json',
  },

  defaultOrders: [
    {field: 'srpt.seq', method: 'DESC'},
  ],
};

var TARGET_TABLE_NAMES = [
  'biz_main_script_set',
  'biz_main_script',
  'biz_main_func',
];

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

  // 准备备份数据
  data.tableDumpJSON = JSON.stringify(TARGET_TABLE_NAMES.reduce(function(acc, x) {
    acc[x] = [];
    return acc;
  }, {}));

  var scriptRecoverPointId = null;

  var transScope = modelHelper.createTransScope(self.db);
  async.series([
    function(asyncCallback) {
      transScope.start(asyncCallback);
    },
    // 创建还原点
    function(asyncCallback) {
      self._add(data, function(err, addedId) {
        if (err) return asyncCallback(err);

        scriptRecoverPointId = addedId;

        return asyncCallback();
      });
    },
    // 填入备份数据
    function(asyncCallback) {
      // 查询数据
      async.eachSeries(TARGET_TABLE_NAMES, function(tableName, eachCallback) {
        var sql = toolkit.createStringBuilder();
        sql.append('SELECT');
        sql.append('  *');
        sql.append('FROM ??');

        var sqlParams = [tableName];
        self.db.query(sql, sqlParams, function(err, dbRes) {
          if (err) return eachCallback(err);

          // 防止SQL语句过长，逐条填入tableDumpJSON
          async.eachSeries(dbRes, function(d, innerEachCallback) {
            var sql = toolkit.createStringBuilder();
            sql.append('UPDATE biz_main_script_recover_point');
            sql.append('SET');
            sql.append('  tableDumpJSON = JSON_ARRAY_APPEND(tableDumpJSON, ?, CAST(? AS JSON))');
            sql.append('WHERE');
            sql.append('  id = ?');

            var sqlParams = [
              toolkit.strf('$.{0}', tableName),
              JSON.stringify(d),
              scriptRecoverPointId,
            ];
            self.db.query(sql, sqlParams, innerEachCallback);

          }, eachCallback);
        });

      }, asyncCallback);
    },
  ], function(err) {
    transScope.end(err, function(scopeErr) {
      if (scopeErr) return callback(scopeErr);

      return callback(null, scriptRecoverPointId);
    });
  });
};

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
