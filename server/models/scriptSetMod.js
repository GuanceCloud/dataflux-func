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

EntityModel.prototype.import = function(scriptData, callback) {
  var self = this;

  if ('string' === typeof scriptData) {
    scriptData = JSON.parse(scriptData);
  }

  var scriptRecoverPointModel     = scriptRecoverPointMod.createModel(self.locals);
  var scriptSetImportHistoryModel = scriptSetImportHistoryMod.createModel(self.locals);

  var scriptSetIds = toolkit.arrayElementValues(scriptData.scriptSets, 'id');

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
    // 删除相关数据
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
    // 插入脚本集
    function(asyncCallback) {
      if (toolkit.isNothing(scriptData.scriptSets)) return asyncCallback();

      async.eachSeries(scriptData.scriptSets, function(d, eachCallback) {
        var _data = {
          id         : d.id,
          title      : d.title,
          description: d.description,
        }

        var sql = toolkit.createStringBuilder();
        sql.append('INSERT INTO biz_main_script_set');
        sql.append('SET');
        sql.append('  ?');

        var sqlParams = [_data];

        self.db.query(sql, sqlParams, eachCallback);

      }, asyncCallback);
    },
    // 插入脚本
    function(asyncCallback) {
      if (toolkit.isNothing(scriptData.scripts)) return asyncCallback();

      async.eachSeries(scriptData.scripts, function(d, eachCallback) {
        var codeMD5 = null;
        if (d.code) {
          codeMD5 = toolkit.getMD5(d.code);
        }

        var _data = {
          id            : d.id,
          scriptSetId   : d.scriptSetId,
          title         : d.title,
          description   : d.description,
          publishVersion: d.publishVersion,
          type          : d.type,
          code          : d.code,
          codeMD5       : codeMD5,
        }

        var sql = toolkit.createStringBuilder();
        sql.append('INSERT INTO biz_main_script');
        sql.append('SET');
        sql.append('  ?;');

        sql.append('UPDATE biz_main_script');
        sql.append('SET');
        sql.append('   codeDraft    = code');
        sql.append('  ,codeDraftMD5 = codeMD5');
        sql.append('WHERE');
        sql.append('  id = ?');

        var sqlParams = [_data, _data.id];

        self.db.query(sql, sqlParams, eachCallback);

      }, asyncCallback);
    },
    // 插入函数
    function(asyncCallback) {
      if (toolkit.isNothing(scriptData.funcs)) return asyncCallback();

      async.eachSeries(scriptData.funcs, function(d, eachCallback) {
        for (var f in d) {
          if (!toolkit.endsWith(f, 'JSON')) continue;

          if (d[f] && 'string' !== typeof d[f]) {
            d[f] = JSON.stringify(d[f]);
          }
        }

        var _data = {
          id             : d.id,
          scriptSetId    : d.scriptSetId,
          scriptId       : d.scriptId,
          name           : d.name,
          title          : d.title,
          description    : d.description,
          definition     : d.definition,
          argsJSON       : d.argsJSON        || null,
          kwargsJSON     : d.kwargsJSON      || null,
          extraConfigJSON: d.extraConfigJSON || null,
          category       : d.category,
          integration    : d.integration     || null,
          tagsJSON       : d.tagsJSON        || null,
          defOrder       : d.defOrder,
        }

        var sql = toolkit.createStringBuilder();
        sql.append('INSERT INTO biz_main_func');
        sql.append('SET');
        sql.append('  ?');

        var sqlParams = [_data];

        self.db.query(sql, sqlParams, eachCallback);

      }, asyncCallback);
    },
    // 记录导入历史
    function(asyncCallback) {
      var summary = toolkit.jsonCopy(scriptData);
      summary.scripts.forEach(function(d) {
        delete d.code; // 摘要中不含代码
      });

      var _data = {
        note       : scriptData.note,
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
