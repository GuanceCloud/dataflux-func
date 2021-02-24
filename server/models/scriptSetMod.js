'use strict';

/* Builtin Modules */

/* 3rd-party Modules */
var async = require('async');

/* Project Modules */
var E           = require('../utils/serverError');
var CONFIG      = require('../utils/yamlResources').get('CONFIG');
var toolkit     = require('../utils/toolkit');
var modelHelper = require('../utils/modelHelper');

var scriptRecoverPointMod     = require('./scriptRecoverPointMod');
var scriptMod                 = require('./scriptMod');
var funcMod                   = require('./funcMod');
var systemConfigMod           = require('./systemConfigMod');
var scriptSetImportHistoryMod = require('./scriptSetImportHistoryMod');

/* Configure */
var TABLE_OPTIONS = exports.TABLE_OPTIONS = {
  displayName: 'script set',
  entityName : 'scriptSet',
  tableName  : 'biz_main_script_set',
  alias      : 'sset',

  objectFields: {
    isLocked: 'boolean',
  },

  defaultOrders: [
    {field: 'sset.id', method: 'ASC'},
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
  sql.append('   sset.*');
  sql.append('  ,NOT ISNULL(sset.lockedByUserId) AS isLocked');

  sql.append('FROM biz_main_script_set AS sset');

  options.baseSQL = sql.toString();

  return this._list(options, callback);
};

EntityModel.prototype.delete = function(id, callback) {
  var self = this;

  var transScope = modelHelper.createTransScope(self.db);
  async.series([
    function(asyncCallback) {
      transScope.start(asyncCallback);
    },
    // 数据入库
    function(asyncCallback) {
      self._delete(id, asyncCallback);
    },
    // 删除相关数据
    function(asyncCallback) {
      var sql = toolkit.createStringBuilder();
      sql.append('DELETE FROM ??');
      sql.append('WHERE');
      sql.append('  scriptSetId = ?');

      var tables = [
        'biz_main_script',
        'biz_main_func',
      ];
      async.eachSeries(tables, function(table, eachCallback) {
        var sqlParams = [table, id];
        self.db.query(sql, sqlParams, eachCallback);
      }, asyncCallback);
    },
  ], function(err) {
    transScope.end(err, function(scopeErr) {
      if (scopeErr) return callback(scopeErr);

      return callback(null, id);
    });
  });
};

EntityModel.prototype.import = function(packageData, callback) {
  var self = this;

  if ('string' === typeof packageData) {
    packageData = JSON.parse(packageData);
  }

  var scriptRecoverPointModel     = scriptRecoverPointMod.createModel(self.locals);
  var scriptSetImportHistoryModel = scriptSetImportHistoryMod.createModel(self.locals);

  var scriptSetIds   = toolkit.arrayElementValues(packageData.scriptSets, 'id');
  var dataSourceIds  = toolkit.arrayElementValues(packageData.dataSources, 'id');
  var envVariableIds = toolkit.arrayElementValues(packageData.envVariables, 'id');

  var transScope = modelHelper.createTransScope(self.db);
  async.series([
    function(asyncCallback) {
      transScope.start(asyncCallback);
    },
    // 创建还原点
    function(asyncCallback) {
      var _data = {
        type: 'import',
        note: '系统：导入脚本包前自动创建的还原点',
      };
      scriptRecoverPointModel.add(_data, asyncCallback);
    },
    // 删除相关数据（授权链接/自动触发配置/批处理）
    // 注意：此处必须先删除「授权链接/自动触发配置/批处理」，后删除「脚本集/脚本/函数」
    //  如果顺序调换，会导致无法正常找到需要删除的授权链接等数据
    function(asyncCallback) {
      if (toolkit.isNothing(scriptSetIds)) return asyncCallback();

      var sql = toolkit.createStringBuilder();
      sql.append('DELETE main');
      sql.append('FROM ?? AS main');
      sql.append('JOIN biz_main_func AS func');
      sql.append('  ON main.funcId = func.id');
      sql.append('WHERE');
      sql.append('  func.scriptSetId IN (?)');

      // 删除规则
      var _rules = [
        { name: 'authLinks',      table: 'biz_main_auth_link' },
        { name: 'crontabConfigs', table: 'biz_main_crontab_config' },
        { name: 'batches',        table: 'biz_main_batch' },
      ];
      async.eachSeries(_rules, function(_rule, eachCallback) {
        if (!packageData[_rule.name]) return eachCallback();

        var sqlParams = [_rule.table, scriptSetIds];

        self.db.query(sql, sqlParams, eachCallback);
      }, asyncCallback);
    },
    // 删除所有涉及的脚本集
    function(asyncCallback) {
      if (toolkit.isNothing(scriptSetIds)) return asyncCallback();

      var sql = toolkit.createStringBuilder();
      sql.append('DELETE FROM biz_main_script_set');
      sql.append('WHERE');
      sql.append('   id IN (?)');

      var sqlParams = [scriptSetIds];
      self.db.query(sql, sqlParams, asyncCallback);
    },
    // 删除相关数据（脚本/函数）
    function(asyncCallback) {
      if (toolkit.isNothing(scriptSetIds)) return asyncCallback();

      var sql = toolkit.createStringBuilder();
      sql.append('DELETE FROM ??');
      sql.append('WHERE');
      sql.append('  scriptSetId IN (?)');

      var tables = [
        'biz_main_script',
        'biz_main_func',
      ];
      async.eachSeries(tables, function(table, eachCallback) {
        var sqlParams = [table, scriptSetIds];

        self.db.query(sql, sqlParams, eachCallback);
      }, asyncCallback);
    },
    // 删除所有涉及的数据源
    function(asyncCallback) {
      if (toolkit.isNothing(dataSourceIds)) return asyncCallback();

      var sql = toolkit.createStringBuilder();
      sql.append('DELETE FROM biz_main_data_source');
      sql.append('WHERE');
      sql.append('   id IN (?)');

      var sqlParams = [dataSourceIds];
      self.db.query(sql, sqlParams, asyncCallback);
    },
    // 删除所有涉及的环境变量
    function(asyncCallback) {
      if (toolkit.isNothing(envVariableIds)) return asyncCallback();

      var sql = toolkit.createStringBuilder();
      sql.append('DELETE FROM biz_main_env_variable');
      sql.append('WHERE');
      sql.append('   id IN (?)');

      var sqlParams = [envVariableIds];
      self.db.query(sql, sqlParams, asyncCallback);
    },
    // 插入数据
    function(asyncCallback) {
      // 预处理
      if (packageData.scripts) {
        packageData.scripts.forEach(function(s) {
          s.code    = s.code || '';          // 保证code字段不为NULL
          s.codeMD5 = toolkit.getMD5(s.code) // 计算MD5值
        });
      }

      // 插入规则
      var _rules = [
        { name: 'scriptSets',     table: 'biz_main_script_set' },
        { name: 'scripts',        table: 'biz_main_script' },
        { name: 'funcs',          table: 'biz_main_func' },
        { name: 'authLinks',      table: 'biz_main_auth_link' },
        { name: 'crontabConfigs', table: 'biz_main_crontab_config' },
        { name: 'batches',        table: 'biz_main_batch' },
        { name: 'dataSources',    table: 'biz_main_data_source' },
        { name: 'envVariables',   table: 'biz_main_env_variable' },
      ];
      async.eachSeries(_rules, function(_rule, eachCallback) {
        var _dataSet = packageData[_rule.name];
        if (toolkit.isNothing(_dataSet)) return eachCallback();

        async.eachSeries(_dataSet, function(_data, innerEachCallback) {
          var _data = _prepareImportData(_data);

          var sql = toolkit.createStringBuilder();
          sql.append('REPLACE INTO ??');
          sql.append('SET');
          sql.append('  ?');

          var sqlParams = [_rule.table, _data];

          self.db.query(sql, sqlParams, innerEachCallback);
        }, eachCallback);
      }, asyncCallback);
    },
    // 脚本计算MD5并发布
    function(asyncCallback) {
      if (toolkit.isNothing(scriptSetIds)) return asyncCallback();

      var sql = toolkit.createStringBuilder();
      sql.append('UPDATE biz_main_script');
      sql.append('SET');
      sql.append('   codeDraft    = code');
      sql.append('  ,codeDraftMD5 = codeMD5');
      sql.append('WHERE');
      sql.append('  scriptSetId IN (?)');

      var sqlParams = [scriptSetIds];

      self.db.query(sql, sqlParams, asyncCallback);
    },
    // 记录导入历史
    function(asyncCallback) {
      var summary = toolkit.jsonCopy(packageData);
      summary.scripts.forEach(function(d) {
        delete d.code; // 摘要中不含代码
      });

      var _data = {
        note       : packageData.note,
        summaryJSON: summary,
      }
      scriptSetImportHistoryModel.add(_data, asyncCallback);
    },
  ], function(err) {
    transScope.end(err, function(scopeErr) {
      if (scopeErr) return callback(scopeErr);

      return callback();
    });
  });
};

function _prepareImportData(data) {
  data = toolkit.jsonCopy(data);

  for (var f in data) {
    var v = data[f];

    if (v === null)                   continue; // NULL值不转换
    if (!toolkit.endsWith(f, 'JSON')) continue; // 非JSON字段不转换

    if ('string' !== typeof v) {
      data[f] = JSON.stringify(v);
    }
  }

  return data;
}
