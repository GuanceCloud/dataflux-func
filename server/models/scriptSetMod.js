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

EntityModel.prototype.clone = function(id, newId, callback) {
  var self = this;

  var transScope = modelHelper.createTransScope(self.db);
  async.series([
    function(asyncCallback) {
      transScope.start(asyncCallback);
    },
    // 克隆脚本集
    function(asyncCallback) {
      var sql = toolkit.createStringBuilder();
      sql.append('SELECT');
      sql.append('   title');
      sql.append('  ,description');
      sql.append('  ,requirements');
      sql.append('FROM biz_main_script_set');
      sql.append('WHERE');
      sql.append('   id = ?');

      var sqlParams = [id];
      self.db.query(sql, sqlParams, function(err, dbRes) {
        if (err) return asyncCallback(err);

        var cloneData = [];
        dbRes.forEach(function(d) {
          cloneData.push([
            newId, // id
            d.title,
            d.description,
            d.requirements,
          ]);
        })

        var sql = toolkit.createStringBuilder();
        sql.append('INSERT INTO biz_main_script_set');
        sql.append('(');
        sql.append('   id');
        sql.append('  ,title');
        sql.append('  ,description');
        sql.append('  ,requirements');
        sql.append(')');
        sql.append('VALUES');
        sql.append('  ?');

        var sqlParams = [cloneData];
        self.db.query(sql, sqlParams, asyncCallback);
      });
    },
    // 克隆脚本
    function(asyncCallback) {
      var sql = toolkit.createStringBuilder();
      sql.append('SELECT');
      sql.append('    id');
      sql.append('   ,title');
      sql.append('   ,description');
      sql.append('   ,publishVersion');
      sql.append('   ,type');
      sql.append('   ,code');
      sql.append('   ,codeMD5');
      sql.append('   ,codeDraft');
      sql.append('   ,codeDraftMD5');
      sql.append('FROM biz_main_script');
      sql.append('WHERE');
      sql.append('   scriptSetId = ?');

      var sqlParams = [id];
      self.db.query(sql, sqlParams, function(err, dbRes) {
        if (err) return asyncCallback(err);
        if (dbRes.length <= 0) return asyncCallback();

        var cloneData = [];
        dbRes.forEach(function(d) {
          // 计算新脚本ID
          var idParts = d.id.split('__');
          idParts[0] = newId;
          var newScriptId = idParts.join('__');

          cloneData.push([
            newScriptId, // id
            newId,       // scriptSetId
            d.title,
            d.description,
            1, // publishVersion
            d.type,
            d.code,
            d.codeMD5,
            d.codeDraft,
            d.codeDraftMD5,
          ]);
        })

        var sql = toolkit.createStringBuilder();
        sql.append('INSERT INTO biz_main_script');
        sql.append('(');
        sql.append('   id');
        sql.append('  ,scriptSetId');
        sql.append('  ,title');
        sql.append('  ,description');
        sql.append('  ,publishVersion');
        sql.append('  ,type');
        sql.append('  ,code');
        sql.append('  ,codeMD5');
        sql.append('  ,codeDraft');
        sql.append('  ,codeDraftMD5');
        sql.append(')');
        sql.append('VALUES');
        sql.append('  ?');

        var sqlParams = [cloneData];
        self.db.query(sql, sqlParams, asyncCallback);
      });
    },
    // 克隆函数
    function(asyncCallback) {
      var sql = toolkit.createStringBuilder();
      sql.append('SELECT');
      sql.append('   id');
      sql.append('  ,name');
      sql.append('  ,title');
      sql.append('  ,description');
      sql.append('  ,definition');
      sql.append('  ,argsJSON');
      sql.append('  ,kwargsJSON');
      sql.append('  ,extraConfigJSON');
      sql.append('  ,category');
      sql.append('  ,integration');
      sql.append('  ,tagsJSON');
      sql.append('  ,defOrder');
      sql.append('FROM biz_main_func');
      sql.append('WHERE');
      sql.append('   scriptSetId = ?');

      var sqlParams = [id];
      self.db.query(sql, sqlParams, function(err, dbRes) {
        if (err) return asyncCallback(err);
        if (dbRes.length <= 0) return asyncCallback();

        var cloneData = [];
        dbRes.forEach(function(d) {
          // 计算新脚本、函数ID
          var idParts = d.id.split('__');
          idParts[0] = newId;
          var newFuncId   = idParts.join('__');
          var newScriptId = newFuncId.split('.')[0]

          cloneData.push([
            newFuncId,   // id
            newId,       // scriptSetId
            newScriptId, // scriptId
            d.name,
            d.title,
            d.description,
            d.definition,
            toolkit.ensureJSONString(d.argsJSON),
            toolkit.ensureJSONString(d.kwargsJSON),
            toolkit.ensureJSONString(d.extraConfigJSON),
            d.category,
            d.integration,
            toolkit.ensureJSONString(d.tagsJSON),
            d.defOrder,
          ]);
        })

        var sql = toolkit.createStringBuilder();
        sql.append('INSERT INTO biz_main_func');
        sql.append('(');
        sql.append('   id');
        sql.append('  ,scriptSetId');
        sql.append('  ,scriptId');
        sql.append('  ,name');
        sql.append('  ,title');
        sql.append('  ,description');
        sql.append('  ,definition');
        sql.append('  ,argsJSON');
        sql.append('  ,kwargsJSON');
        sql.append('  ,extraConfigJSON');
        sql.append('  ,category');
        sql.append('  ,integration');
        sql.append('  ,tagsJSON');
        sql.append('  ,defOrder');
        sql.append(')');
        sql.append('VALUES');
        sql.append('  ?');

        var sqlParams = [cloneData];
        self.db.query(sql, sqlParams, asyncCallback);
      });
    },
  ], function(err) {
    transScope.end(err, function(scopeErr) {
      if (scopeErr) return callback(scopeErr);

      return callback();
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

  var scriptSetIds     = toolkit.arrayElementValues(packageData.scriptSets      || [], 'id');
  var authLinkIds      = toolkit.arrayElementValues(packageData.authLinks       || [], 'id');
  var crontabConfigIds = toolkit.arrayElementValues(packageData.crontabConfigs  || [], 'id');
  var batchIds         = toolkit.arrayElementValues(packageData.batches         || [], 'id');
  var dataSourceIds    = toolkit.arrayElementValues(packageData.dataSources     || [], 'id');
  var envVariableIds   = toolkit.arrayElementValues(packageData.envVariables    || [], 'id');

  var transScope = modelHelper.createTransScope(self.db);
  async.series([
    function(asyncCallback) {
      transScope.start(asyncCallback);
    },
    // TODO
    // 由于占用磁盘、处理时间过长，导入自动创建还原点的功能暂时搁置
    //
    // // 创建还原点
    // function(asyncCallback) {
    //   var _data = {
    //     type: 'import',
    //     note: '系统：导入脚本包前自动创建的还原点',
    //   };
    //   scriptRecoverPointModel.add(_data, asyncCallback);
    // },
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
    // 删除所有涉及的授权链接
    function(asyncCallback) {
      if (toolkit.isNothing(authLinkIds)) return asyncCallback();

      var sql = toolkit.createStringBuilder();
      sql.append('DELETE FROM biz_main_auth_link');
      sql.append('WHERE');
      sql.append('   id IN (?)');

      var sqlParams = [authLinkIds];
      self.db.query(sql, sqlParams, asyncCallback);
    },
    // 删除所有涉及的自动触发配置
    function(asyncCallback) {
      if (toolkit.isNothing(crontabConfigIds)) return asyncCallback();

      var sql = toolkit.createStringBuilder();
      sql.append('DELETE FROM biz_main_crontab_config');
      sql.append('WHERE');
      sql.append('   id IN (?)');

      var sqlParams = [crontabConfigIds];
      self.db.query(sql, sqlParams, asyncCallback);
    },
    // 删除所有涉及的批处理
    function(asyncCallback) {
      if (toolkit.isNothing(batchIds)) return asyncCallback();

      var sql = toolkit.createStringBuilder();
      sql.append('DELETE FROM biz_main_batch');
      sql.append('WHERE');
      sql.append('   id IN (?)');

      var sqlParams = [batchIds];
      self.db.query(sql, sqlParams, asyncCallback);
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

      // 提取依赖包
      var pkgs = []
      packageData.scriptSets.forEach(function(s) {
        if (!s.requirements) return;
        pkgs = pkgs.concat(s.requirements.split('\n'));
      });

      pkgs = toolkit.noDuplication(pkgs);
      if (toolkit.isNothing(pkgs)) {
        pkgs = null;
      }

      return callback(null, pkgs);
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
