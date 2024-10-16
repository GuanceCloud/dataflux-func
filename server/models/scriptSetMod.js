'use strict';

/* Built-in Modules */

/* 3rd-party Modules */
var async     = require('async');
var validator = require('validator');

/* Project Modules */
var E           = require('../utils/serverError');
var CONFIG      = require('../utils/yamlResources').get('CONFIG');
var toolkit     = require('../utils/toolkit');
var common      = require('../utils/common');
var modelHelper = require('../utils/modelHelper');

var scriptRecoverPointMod     = require('./scriptRecoverPointMod');
var scriptSetImportHistoryMod = require('./scriptSetImportHistoryMod');

var connectorMod = require('./connectorMod');

/* Init */
var TABLE_OPTIONS = exports.TABLE_OPTIONS = {
  displayName: 'script set',
  entityName : 'scriptSet',
  tableName  : 'biz_main_script_set',
  alias      : 'sset',

  objectFields: {
    isPinned       : 'boolean',
    isLocked       : 'boolean',
    codeSize       : 'integer',
    smkt_configJSON: 'json',
  },

  defaultOrders: [
    {field: 'sset.pinTime', method: 'DESC'},
    {field: 'sset.id',      method: 'ASC' },
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
  sql.append('  ,NOT ISNULL(sset.pinTime)    AS isPinned');
  sql.append('  ,NOT ISNULL(locker.username) AS isLocked');
  sql.append('  ,locker.id                   AS lockedByUserId');
  sql.append('  ,locker.username             AS lockedByUserUsername');
  sql.append('  ,locker.name                 AS lockedByUserName');
  sql.append('  ,smkt.id                     AS smkt_id');
  sql.append('  ,smkt.title                  AS smkt_title');
  sql.append('  ,smkt.type                   AS smkt_type');
  sql.append('  ,smkt.configJSON             AS smkt_configJSON');

  sql.append('FROM biz_main_script_set AS sset');

  sql.append('LEFT JOIN wat_main_user AS locker');
  sql.append('  ON locker.id = sset.lockedByUserId');

  sql.append('LEFT JOIN biz_main_script_market AS smkt');
  sql.append("  ON  sset.origin = 'scriptMarket'");
  sql.append('  AND smkt.id = sset.originId');

  options.baseSQL = sql.toString();

  return this._list(options, callback);
};

EntityModel.prototype.overview = function(options, callback) {
  options = options || {};

  var self = this;

  var sqlParams = [];
  var sql = toolkit.createStringBuilder();
  sql.append('SELECT');
  sql.append('   sset.id');
  sql.append('  ,sset.title');
  sql.append('  ,sset.origin');
  sql.append('  ,sset.originId');

  sql.append('  ,SUM(LENGTH(scpt.code)) AS codeSize');
  sql.append('  ,MAX(scph.createTime)   AS latestPublishTime');
  sql.append('  ,COUNT(scpt.id)         AS scriptCount');
  sql.append('  ,COUNT(func.id)         AS funcCount');

  sql.append('FROM biz_main_script_set AS sset');

  sql.append('LEFT JOIN biz_main_script AS scpt');
  sql.append('  ON scpt.scriptSetId = sset.id');

  sql.append('LEFT JOIN biz_main_script_publish_history as scph');
  sql.append('  ON  scph.scriptId             = scpt.id');
  sql.append('  AND scph.scriptPublishVersion = scpt.publishVersion');

  sql.append('LEFT JOIN biz_main_func as func');
  sql.append('  ON func.scriptId = scpt.id');

  if (toolkit.notNothing(options.excludeOriginIds)) {
    sql.append('WHERE');
    sql.append('  sset.originId NOT IN (?)');

    sqlParams.push(options.excludeOriginIds);
  }

  sql.append('GROUP BY');
  sql.append('  sset.id');

  sql.append('ORDER BY');
  sql.append('   sset.id ASC');

  self.db.query(sql, sqlParams, function(err, dbRes) {
    if (err) return callback(err);

    dbRes = self.convertObject(dbRes);

    return callback(null, dbRes);
  });
};

EntityModel.prototype.add = function(data, callback) {
  try {
    data = _prepareData(data);
  } catch(err) {
    this.logger.logError(err);
    if (err instanceof E) {
      return callback(err);
    } else {
      return callback(new E('EClientBadRequest', 'Invalid request post data', {
        error: err.toString(),
      }));
    }
  }

  // 添加 origin, originId
  if (!data.origin)   data.origin   = (this.locals.user && this.locals.user.isSignedIn) ? 'user'              : 'UNKNOWN';
  if (!data.originId) data.originId = (this.locals.user && this.locals.user.isSignedIn) ? this.locals.user.id : 'UNKNOWN';

  return this._add(data, callback);
};

EntityModel.prototype.modify = function(id, data, callback) {
  try {
    data = _prepareData(data);
  } catch(err) {
    this.logger.logError(err);
    if (err instanceof E) {
      return callback(err);
    } else {
      return callback(new E('EClientBadRequest', 'Invalid request post data', {
        error: err.toString(),
      }));
    }
  }

  return this._modify(id, data, callback);
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
      sql.append('  ,originMD5');
      sql.append('FROM biz_main_script_set');
      sql.append('WHERE');
      sql.append('   id = ?');

      var sqlParams = [id];
      self.db.query(sql, sqlParams, function(err, dbRes) {
        if (err) return asyncCallback(err);

        var cloneData = [];

        var origin   = (self.locals.user && self.locals.user.isSignedIn) ? 'user'              : 'UNKNOWN';
        var originId = (self.locals.user && self.locals.user.isSignedIn) ? self.locals.user.id : 'UNKNOWN';

        dbRes.forEach(function(d) {
          cloneData.push([
            newId, // id
            d.title,
            d.description,
            d.requirements,
            origin,
            originId,
            d.originMD5,
          ]);
        })

        var sql = toolkit.createStringBuilder();
        sql.append('INSERT INTO biz_main_script_set');
        sql.append('(');
        sql.append('   id');
        sql.append('  ,title');
        sql.append('  ,description');
        sql.append('  ,requirements');
        sql.append('  ,origin');
        sql.append('  ,originId');
        sql.append('  ,originMD5');
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
          // 计算新脚本 ID
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
          // 计算新脚本、函数 ID
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

EntityModel.prototype.getExportData = function(options, callback) {
  var self = this;

  options = options || {};
  var scriptSetIds     = options.scriptSetIds;
  var connectorIds     = options.connectorIds;
  var envVariableIds   = options.envVariableIds;
  var includeSyncAPIs  = toolkit.toBoolean(options.includeSyncAPIs);
  var includeAsyncAPIs = toolkit.toBoolean(options.includeAsyncAPIs);
  var includeCronJobs  = toolkit.toBoolean(options.includeCronJobs);
  var withCodeDraft    = toolkit.toBoolean(options.withCodeDraft);

  var exportUser = common.getExportUser(self.locals);
  var exportTime = toolkit.getISO8601();
  var note       = options.note || `Exported by ${exportUser} at ${toolkit.getDateTimeStringCN(exportTime)}`;

  var exportData = {
    version: common.IMPORT_EXPORT_DATA_SCHEMA_VERSION,

    scriptSets: [],
    extra: {
      exportUser: exportUser,
      exportTime: exportTime,
      note      : note,
    }
  };

  var scriptSetMap = {};
  var scriptMap    = {};

  // 连接器/环境变量
  if (toolkit.notNothing(connectorIds))   exportData.connectors   = [];
  if (toolkit.notNothing(envVariableIds)) exportData.envVariables = [];

  // 脚本集相关数据
  if (includeSyncAPIs)  exportData.syncAPIs  = [];
  if (includeAsyncAPIs) exportData.asyncAPIs = [];
  if (includeCronJobs)  exportData.cronJobs  = [];

  async.series([
    // 获取脚本集
    function(asyncCallback) {
      if (toolkit.isNothing(scriptSetIds)) return asyncCallback();

      var sql = toolkit.createStringBuilder();
      sql.append('SELECT');
      sql.append('   sset.id');
      sql.append('  ,sset.title');
      sql.append('  ,sset.description');
      sql.append('  ,sset.requirements');
      sql.append('  ,sset.origin');
      sql.append('  ,sset.originId');

      sql.append('FROM biz_main_script_set AS sset');

      sql.append('WHERE');
      sql.append('  sset.id IN (?)');

      sql.append('ORDER BY');
      sql.append('  sset.id ASC');

      var sqlParams = [scriptSetIds];
      self.db.query(sql, sqlParams, function(err, dbRes) {
        if (err) return asyncCallback(err);

        scriptSetMap = toolkit.arrayElementMap(dbRes, 'id');

        dbRes.forEach(function(d) {
          d.scripts = [];
        });

        exportData.scriptSets = dbRes;

        return asyncCallback();
      });
    },
    // 获取脚本
    function(asyncCallback) {
      if (toolkit.isNothing(scriptSetIds)) return asyncCallback();

      var sql = toolkit.createStringBuilder();
      sql.append('SELECT');
      sql.append('   scpt.scriptSetId');

      sql.append('  ,scpt.id');
      sql.append('  ,scpt.title');
      sql.append('  ,scpt.description');
      sql.append('  ,scpt.publishVersion');
      sql.append('  ,scpt.type');
      sql.append('  ,scpt.code');
      sql.append('  ,scpt.codeMD5');

      if (withCodeDraft) {
        sql.append('  ,scpt.codeDraft');
        sql.append('  ,scpt.codeDraftMD5');
      }

      sql.append('  ,scpt.updateTime');

      sql.append('FROM biz_main_script AS scpt');

      sql.append('LEFT JOIN biz_main_script_set AS sset');
      sql.append('  ON sset.id = scpt.scriptSetId');

      sql.append('WHERE');
      sql.append('  sset.id IN (?)');

      sql.append('ORDER BY');
      sql.append('  scpt.id ASC');

      var sqlParams = [scriptSetIds];
      self.db.query(sql, sqlParams, function(err, dbRes) {
        if (err) return asyncCallback(err);

        scriptMap = toolkit.arrayElementMap(dbRes, 'id');

        dbRes.forEach(function(d) {
          d.funcs = [];

          scriptSetMap[d.scriptSetId].scripts.push(d);
          delete d.scriptSetId;
        });

        return asyncCallback();
      });
    },
    // 获取函数
    function(asyncCallback) {
      if (toolkit.isNothing(scriptSetIds)) return asyncCallback();

      var sql = toolkit.createStringBuilder();
      sql.append('SELECT');
      sql.append('   func.scriptSetId');
      sql.append('  ,func.scriptId');

      sql.append('  ,func.id');
      sql.append('  ,func.name');
      sql.append('  ,func.title');
      sql.append('  ,func.description');
      sql.append('  ,func.definition');
      sql.append('  ,func.argsJSON');
      sql.append('  ,func.kwargsJSON');
      sql.append('  ,func.extraConfigJSON');
      sql.append('  ,func.category');
      sql.append('  ,func.integration');
      sql.append('  ,func.tagsJSON');
      sql.append('  ,func.defOrder');

      sql.append('FROM biz_main_func AS func');

      sql.append('LEFT JOIN biz_main_script_set AS sset');
      sql.append('  ON sset.id = func.scriptSetId');

      sql.append('WHERE');
      sql.append('  sset.id IN (?)');

      sql.append('ORDER BY');
      sql.append('  func.id ASC');

      var sqlParams = [scriptSetIds];
      self.db.query(sql, sqlParams, function(err, dbRes) {
        if (err) return asyncCallback(err);

        dbRes.forEach(function(d) {
          scriptMap[d.scriptId].funcs.push(d);
          delete d.scriptSetId;
          delete d.scriptId;
        });

        return asyncCallback();
      });
    },
    // 获取连接器
    function(asyncCallback) {
      if (toolkit.isNothing(connectorIds)) return asyncCallback();

      var sql = toolkit.createStringBuilder();
      sql.append('SELECT');
      sql.append('   cnct.id');
      sql.append('  ,cnct.title');
      sql.append('  ,cnct.description');
      sql.append('  ,cnct.type');
      sql.append('  ,cnct.configJSON');

      sql.append('FROM biz_main_connector AS cnct')

      sql.append('WHERE');
      sql.append('  cnct.id IN (?)');

      sql.append('ORDER BY');
      sql.append('  cnct.id ASC');

      var sqlParams = [connectorIds];
      self.db.query(sql, sqlParams, function(err, dbRes) {
        if (err) return asyncCallback(err);

        // 去除加密字段
        dbRes.forEach(function(d) {
          if (toolkit.notNothing(d.configJSON) && 'string' === typeof d.configJSON) {
            d.configJSON = JSON.parse(d.configJSON);
          }

          connectorMod.CIPHER_CONFIG_FIELDS.forEach(function(f) {
            var fCipher = toolkit.strf('{0}Cipher', f);
            if (fCipher in d.configJSON) {
              d.configJSON[fCipher] = '';
            }
          });
        });

        exportData.connectors = dbRes;

        return asyncCallback();
      });
    },
    // 获取环境变量
    function(asyncCallback) {
      if (toolkit.isNothing(envVariableIds)) return asyncCallback();

      var sql = toolkit.createStringBuilder();
      sql.append('SELECT');
      sql.append('   evar.id');
      sql.append('  ,evar.title');
      sql.append('  ,evar.description');
      sql.append('  ,evar.autoTypeCasting');
      sql.append('  ,evar.valueTEXT');

      sql.append('FROM biz_main_env_variable AS evar')

      sql.append('WHERE');
      sql.append('  evar.id IN (?)');

      sql.append('ORDER BY');
      sql.append('  evar.id ASC');

      var sqlParams = [envVariableIds];
      self.db.query(sql, sqlParams, function(err, dbRes) {
        if (err) return asyncCallback(err);

        // 密码类强制变更为字符串且内容为空
        dbRes.forEach(function(d) {
          if (d.autoTypeCasting !== 'password') return;

          d.autoTypeCasting = 'string';
          d.valueTEXT       = '';
        });

        exportData.envVariables = dbRes;

        return asyncCallback();
      });
    },
    // 获取同步 API
    function(asyncCallback) {
      if (toolkit.isNothing(scriptSetIds)) return asyncCallback();
      if (!includeSyncAPIs) return asyncCallback();

      var sql = toolkit.createStringBuilder();
      sql.append('SELECT');
      sql.append('   sapi.id');
      sql.append('  ,sapi.funcId');
      sql.append('  ,sapi.funcCallKwargsJSON');
      sql.append('  ,sapi.expireTime');
      sql.append('  ,sapi.throttlingJSON');
      sql.append('  ,sapi.origin');
      sql.append('  ,sapi.originId');
      sql.append('  ,sapi.showInDoc');
      sql.append('  ,sapi.isDisabled');
      sql.append('  ,sapi.note');

      sql.append('FROM biz_main_sync_api AS sapi')

      sql.append('LEFT JOIN biz_main_func AS func');
      sql.append('  ON func.id = sapi.funcId');

      sql.append('LEFT JOIN biz_main_script_set AS sset');
      sql.append('  ON sset.id = func.scriptSetId');

      sql.append('WHERE');
      sql.append('  sset.id IN (?)');

      sql.append('ORDER BY');
      sql.append('  sapi.id ASC');

      var sqlParams = [ scriptSetIds ];
      self.db.query(sql, sqlParams, function(err, dbRes) {
        if (err) return asyncCallback(err);

        exportData.syncAPIs = dbRes;

        return asyncCallback();
      });
    },
    // 获取异步 API
    function(asyncCallback) {
      if (toolkit.isNothing(scriptSetIds)) return asyncCallback();
      if (!includeAsyncAPIs) return asyncCallback();

      var sql = toolkit.createStringBuilder();
      sql.append('SELECT');
      sql.append('   aapi.id');
      sql.append('  ,aapi.funcId');
      sql.append('  ,aapi.funcCallKwargsJSON');
      sql.append('  ,aapi.tagsJSON');
      sql.append('  ,aapi.origin');
      sql.append('  ,aapi.originId');
      sql.append('  ,aapi.showInDoc');
      sql.append('  ,aapi.isDisabled');
      sql.append('  ,aapi.note');

      sql.append('FROM biz_main_async_api AS aapi')

      sql.append('LEFT JOIN biz_main_func AS func');
      sql.append('  ON func.id = aapi.funcId');

      sql.append('LEFT JOIN biz_main_script_set AS sset');
      sql.append('  ON sset.id = func.scriptSetId');

      sql.append('WHERE');
      sql.append('  sset.id IN (?)');

      sql.append('ORDER BY');
      sql.append('  aapi.id ASC');

      var sqlParams = [ scriptSetIds ];
      self.db.query(sql, sqlParams, function(err, dbRes) {
        if (err) return asyncCallback(err);

        exportData.asyncAPIs = dbRes;

        return asyncCallback();
      });
    },
    // 获取定时任务
    function(asyncCallback) {
      if (toolkit.isNothing(scriptSetIds)) return asyncCallback();
      if (!includeCronJobs) return asyncCallback();

      var sql = toolkit.createStringBuilder();
      sql.append('SELECT');
      sql.append('   cron.id');
      sql.append('  ,cron.funcId');
      sql.append('  ,cron.funcCallKwargsJSON');
      sql.append('  ,cron.cronExpr');
      sql.append('  ,cron.tagsJSON');
      sql.append('  ,cron.scope');
      sql.append('  ,cron.expireTime');
      sql.append('  ,cron.origin');
      sql.append('  ,cron.originId');
      sql.append('  ,cron.isDisabled');
      sql.append('  ,cron.note');

      sql.append('FROM biz_main_cron_job AS cron')

      sql.append('LEFT JOIN biz_main_func AS func');
      sql.append('  ON func.id = cron.funcId');

      sql.append('LEFT JOIN biz_main_script_set AS sset');
      sql.append('  ON sset.id = func.scriptSetId');

      sql.append('WHERE');
      sql.append('  sset.id IN (?)');

      sql.append('ORDER BY');
      sql.append('  cron.id ASC');

      var sqlParams = [scriptSetIds];
      self.db.query(sql, sqlParams, function(err, dbRes) {
        if (err) return asyncCallback(err);

        exportData.cronJobs = dbRes;

        return asyncCallback();
      });
    },
  ], function(err) {
    if (err) return next(err);

    // 为脚本集数据添加额外信息
    if (toolkit.notNothing(exportData.scriptSets)) {
      exportData.scriptSets.forEach(function(scriptSet) {
        // 计算脚本集 MD5 信息
        scriptSet.originMD5 = common.getScriptSetMD5(scriptSet, scriptSet.scripts);

        // 添加额外信息
        scriptSet._extra = {
          exportUser: exportUser,
          exportTime: exportTime,
          note      : note,
        }
      });
    }

    // 兼容处理
    exportData.authLinks      = exportData.syncAPIs;
    exportData.crontabConfigs = exportData.cronJobs;
    exportData.batches        = exportData.asyncAPIs;

    return callback(null, exportData);
  });
};

EntityModel.prototype.import = function(importData, recoverPoint, callback) {
  var self = this;

  /* 兼容处理 */
  importData = common.convertImportExportDataSchema(importData);

  // 数据扁平化
  importData = common.flattenImportExportData(importData);

  var scriptRecoverPointModel     = scriptRecoverPointMod.createModel(self.locals);
  var scriptSetImportHistoryModel = scriptSetImportHistoryMod.createModel(self.locals);

  var scriptSetIds   = toolkit.arrayElementValues(importData.scriptSets   || [], 'id');
  var connectorIds   = toolkit.arrayElementValues(importData.connectors   || [], 'id');
  var envVariableIds = toolkit.arrayElementValues(importData.envVariables || [], 'id');
  var syncAPIIds     = toolkit.arrayElementValues(importData.syncAPIs     || [], 'id');
  var asyncAPIIds    = toolkit.arrayElementValues(importData.asyncAPIs    || [], 'id');
  var cronJobIds     = toolkit.arrayElementValues(importData.cronJobs     || [], 'id');

  var transScope = modelHelper.createTransScope(self.db);
  async.series([
    function(asyncCallback) {
      transScope.start(asyncCallback);
    },
    // 创建还原点
    function(asyncCallback) {
      if (toolkit.isNothing(recoverPoint)) return asyncCallback();

      scriptRecoverPointModel.add(recoverPoint, asyncCallback);
    },
    // 删除所有涉及的脚本集、脚本、函数
    function(asyncCallback) {
      if (recoverPoint && recoverPoint.type === 'recover') {
        // 恢复模式：清空所有脚本集、脚本、函数
        var sql = toolkit.createStringBuilder();
        sql.append('DELETE FROM biz_main_script_set;');
        sql.append('DELETE FROM biz_main_script;');
        sql.append('DELETE FROM biz_main_func;');

        self.db.query(sql, null, asyncCallback);

      } else {
        // 正常导入模式：只删除相关的脚本集、脚本、函数
        if (toolkit.isNothing(scriptSetIds)) return asyncCallback();

        var sql = toolkit.createStringBuilder();
        sql.append('DELETE FROM ??');
        sql.append('WHERE');
        sql.append('  ?? IN (?)');

        var deleteTargets = [
          { table: 'biz_main_script_set', field: 'id' },
          { table: 'biz_main_script',     field: 'scriptSetId' },
          { table: 'biz_main_func',       field: 'scriptSetId' },
        ];
        async.eachSeries(deleteTargets, function(t, eachCallback) {
          var sqlParams = [t.table, t.field, scriptSetIds];
          self.db.query(sql, sqlParams, eachCallback);
        }, asyncCallback);
      }
    },
    // 删除所有涉及的连接器、环境变量、同步 API、异步 API、定时任务
    function(asyncCallback) {
      if (toolkit.isNothing(syncAPIIds)) return asyncCallback();

      var sql = toolkit.createStringBuilder();
      sql.append('DELETE FROM ??');
      sql.append('WHERE');
      sql.append('   id IN (?)');

      var deleteTargets = [
        { table: 'biz_main_connector',    ids: connectorIds },
        { table: 'biz_main_env_variable', ids: envVariableIds },
        { table: 'biz_main_sync_api',     ids: syncAPIIds },
        { table: 'biz_main_async_api',    ids: asyncAPIIds },
        { table: 'biz_main_cron_job',     ids: cronJobIds },
      ];
      async.eachSeries(deleteTargets, function(t, eachCallback) {
        if (toolkit.isNothing(t.ids)) return eachCallback();

        var sqlParams = [t.table, t.ids];
        self.db.query(sql, sqlParams, eachCallback);
      }, asyncCallback);
    },

    // 插入数据
    function(asyncCallback) {
      // 插入规则
      var _rules = [
        { name: 'scriptSets',   table: 'biz_main_script_set'   },
        { name: 'scripts',      table: 'biz_main_script'       },
        { name: 'funcs',        table: 'biz_main_func'         },
        { name: 'connectors',   table: 'biz_main_connector'    },
        { name: 'envVariables', table: 'biz_main_env_variable' },
        { name: 'syncAPIs',     table: 'biz_main_sync_api'     },
        { name: 'asyncAPIs',    table: 'biz_main_async_api'    },
        { name: 'cronJobs',     table: 'biz_main_cron_job'     },

      ];
      async.eachSeries(_rules, function(_rule, eachCallback) {
        var _dataSet = importData[_rule.name];
        if (toolkit.isNothing(_dataSet)) return eachCallback();

        var tableFields = [];
        async.series([
          // 获取当前表字段
          function(innerCallback) {
              var sql = toolkit.createStringBuilder();
              sql.append('SHOW COLUMNS FROM ??');

              var sqlParams = [_rule.table];
              self.db.query(sql, sqlParams, function(err, dbRes) {
                if (err) return innerCallback(err);

                dbRes.forEach(function(col) {
                  tableFields.push(col.Field);
                });

                return innerCallback();
              });
          },
          // 执行插入
          function(innerCallback) {
            async.eachSeries(_dataSet, function(_data, innerEachCallback) {
              var _data = _prepareTableDataToImport(_data, tableFields);

              var sql = toolkit.createStringBuilder();
              sql.append('REPLACE INTO ??');
              sql.append('SET');
              sql.append('  ?');

              var sqlParams = [_rule.table, _data];

              self.db.query(sql, sqlParams, innerEachCallback);
            }, innerCallback);
          }
        ], eachCallback)
      }, asyncCallback);
    },
    // 记录导入历史
    function(asyncCallback) {
      var summary = toolkit.jsonCopy(importData);

      // 摘要中不包含代码
      if (toolkit.notNothing(summary.scripts)) {
        summary.scripts.forEach(function(d) {
          delete d.code;
          delete d.codeDraft;
        });
      }

      // 数据入库
      var _data = {
        note       : toolkit.jsonFindSafe(importData, 'extra.note'),
        summaryJSON: summary,
      }
      scriptSetImportHistoryModel.add(_data, asyncCallback);
    },
  ], function(err) {
    transScope.end(err, function(scopeErr) {
      if (scopeErr) return callback(scopeErr);

      // 提取依赖包
      var requirements = {};
      importData.scriptSets.forEach(function(s) {
        if (toolkit.isNothing(s.requirements)) return;

        s.requirements.split('\n').forEach(function(r) {
          if (toolkit.isNothing(r)) return;

          var pkgVer = r.trim().split(/[>=<!]=*/);
          var pkg = pkgVer[0].split('[')[0];
          var ver = pkgVer[1] || null;
          requirements[pkg] = ver;
        });
      });

      return callback(null, requirements);
    });
  });
};

function _prepareData(data) {
  data = toolkit.jsonCopy(data);

  if ('boolean' === typeof data.isPinned) {
    data.pinTime = data.isPinned ? new Date() : null;
    delete data.isPinned;
  }

  return data;
};

function _prepareTableDataToImport(data, tableFields) {
  data = toolkit.jsonCopy(data);

  for (var f in data) {
    // 跳过不存在的字段
    if (tableFields.indexOf(f) < 0) {
      delete data[f];
    }

    // 跳过 "_" 开头的字段
    if (toolkit.startsWith(f, '_')) {
      delete data[f];
    }

    // 字段值转换
    var v = data[f];
    if (toolkit.isNullOrUndefined(v)) {
      continue;
    }

    // JSON字段序列化
    if (toolkit.endsWith(f, 'JSON')
      && 'string' !== typeof v) {
      data[f] = JSON.stringify(v);
    }

    // 时间类字段转换
    if (toolkit.endsWith(f, 'Time')
      && 'string' === typeof v
      && validator.isISO8601(v, { strict: true, strictSeparator: true })) {
      data[f] = new Date(v);
    }
  }

  return data;
};
