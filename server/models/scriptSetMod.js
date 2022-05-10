'use strict';

/* Builtin Modules */

/* 3rd-party Modules */
var async  = require('async');
var moment = require('moment');
var JSZip  = require('jszip');

/* Project Modules */
var E           = require('../utils/serverError');
var CONFIG      = require('../utils/yamlResources').get('CONFIG');
var toolkit     = require('../utils/toolkit');
var modelHelper = require('../utils/modelHelper');

var scriptRecoverPointMod     = require('./scriptRecoverPointMod');
var scriptSetExportHistoryMod = require('./scriptSetExportHistoryMod');
var scriptSetImportHistoryMod = require('./scriptSetImportHistoryMod');

var dataSourceMod = require('./dataSourceMod');

/* Configure */
var TABLE_OPTIONS = exports.TABLE_OPTIONS = {
  displayName: 'script set',
  entityName : 'scriptSet',
  tableName  : 'biz_main_script_set',
  alias      : 'sset',

  objectFields: {
    isLocked: 'boolean',
    isPinned: 'boolean',
  },

  defaultOrders: [
    {field: 'sset.pinTime', method: 'DESC'},
    {field: 'sset.id',      method: 'ASC' },
  ],
};

var FILENAME_IN_ZIP = exports.FILENAME_IN_ZIP = 'dataflux-func.json';

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
  sql.append('  ,locker.username AS lockedByUserUsername');
  sql.append('  ,locker.name     AS lockedByUserName');

  sql.append('FROM biz_main_script_set AS sset');

  sql.append('LEFT JOIN wat_main_user AS locker');
  sql.append('  ON locker.id = sset.lockedByUserId');

  options.baseSQL = sql.toString();

  return this._list(options, callback);
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

EntityModel.prototype.export = function(options, callback) {
  var self = this;

  var exportTime = moment().utcOffset('+08:00');

  options = options || {};
  var password              = options.password;
  var scriptSetIds          = options.scriptSetIds;
  var dataSourceIds         = options.dataSourceIds;
  var envVariableIds        = options.envVariableIds;
  var includeAuthLinks      = options.includeAuthLinks      || false;
  var includeCrontabConfigs = options.includeCrontabConfigs || false;
  var includeBatches        = options.includeBatches        || false;
  var note                  = options.note;

  if (toolkit.isNothing(password)) {
    password = '';
  }

  var scriptRecoverPointModel     = scriptRecoverPointMod.createModel(self.locals);
  var scriptSetExportHistoryModel = scriptSetExportHistoryMod.createModel(self.locals);

  var packageData = {
    scriptSets: [],
    scripts   : [],
    funcs     : [],
    note      : note,
  };

  // 脚本集相关数据
  if (includeAuthLinks)      packageData.authLinks      = [];
  if (includeCrontabConfigs) packageData.crontabConfigs = [];
  if (includeBatches)        packageData.batches        = [];

  // 数据源/环境变量
  if (!toolkit.isNothing(dataSourceIds))  packageData.dataSources  = [];
  if (!toolkit.isNothing(envVariableIds)) packageData.envVariables = [];

  var fileBuf = null;
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

      sql.append('FROM biz_main_script_set AS sset');

      sql.append('WHERE');
      sql.append('  sset.id IN (?)');

      sql.append('ORDER BY');
      sql.append('  sset.id ASC');

      var sqlParams = [scriptSetIds];
      self.db.query(sql, sqlParams, function(err, dbRes) {
        if (err) return asyncCallback(err);

        packageData.scriptSets = dbRes;

        return asyncCallback();
      });
    },
    // 获取脚本
    function(asyncCallback) {
      if (toolkit.isNothing(scriptSetIds)) return asyncCallback();

      var sql = toolkit.createStringBuilder();
      sql.append('SELECT');
      sql.append('   scpt.id');
      sql.append('  ,scpt.scriptSetId');
      sql.append('  ,scpt.title');
      sql.append('  ,scpt.description');
      sql.append('  ,scpt.publishVersion');
      sql.append('  ,scpt.type');
      sql.append('  ,scpt.code');

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

        packageData.scripts = dbRes;

        return asyncCallback();
      });
    },
    // 获取函数
    function(asyncCallback) {
      if (toolkit.isNothing(scriptSetIds)) return asyncCallback();

      var sql = toolkit.createStringBuilder();
      sql.append('SELECT');
      sql.append('   func.id');
      sql.append('  ,func.scriptSetId');
      sql.append('  ,func.scriptId');
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

        packageData.funcs = dbRes;

        return asyncCallback();
      });
    },
    // 获取授权链接
    function(asyncCallback) {
      if (toolkit.isNothing(scriptSetIds)) return asyncCallback();
      if (!includeAuthLinks) return asyncCallback();

      var sql = toolkit.createStringBuilder();
      sql.append('SELECT');
      sql.append('   auln.id');
      sql.append('  ,auln.funcId');
      sql.append('  ,auln.funcCallKwargsJSON');
      sql.append('  ,auln.expireTime');
      sql.append('  ,auln.throttlingJSON');
      sql.append('  ,auln.origin');
      sql.append('  ,auln.showInDoc');
      sql.append('  ,auln.isDisabled');
      sql.append('  ,auln.note');

      sql.append('FROM biz_main_auth_link AS auln')

      sql.append('LEFT JOIN biz_main_func AS func');
      sql.append('  ON func.id = auln.funcId');

      sql.append('LEFT JOIN biz_main_script_set AS sset');
      sql.append('  ON sset.id = func.scriptSetId');

      sql.append('WHERE');
      sql.append('  sset.id IN (?)');

      sql.append('ORDER BY');
      sql.append('  auln.id ASC');

      var sqlParams = [scriptSetIds];
      self.db.query(sql, sqlParams, function(err, dbRes) {
        if (err) return asyncCallback(err);

        packageData.authLinks = dbRes;

        return asyncCallback();
      });
    },
    // 获取自动触发配置
    function(asyncCallback) {
      if (toolkit.isNothing(scriptSetIds)) return asyncCallback();
      if (!includeCrontabConfigs) return asyncCallback();

      var sql = toolkit.createStringBuilder();
      sql.append('SELECT');
      sql.append('   cron.id');
      sql.append('  ,cron.funcId');
      sql.append('  ,cron.funcCallKwargsJSON');
      sql.append('  ,cron.crontab');
      sql.append('  ,cron.tagsJSON');
      sql.append('  ,cron.saveResult');
      sql.append('  ,cron.scope');
      sql.append('  ,cron.expireTime');
      sql.append('  ,cron.origin');
      sql.append('  ,cron.isDisabled');
      sql.append('  ,cron.note');

      sql.append('FROM biz_main_crontab_config AS cron')

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

        packageData.crontabConfigs = dbRes;

        return asyncCallback();
      });
    },
    // 获取批处理
    function(asyncCallback) {
      if (toolkit.isNothing(scriptSetIds)) return asyncCallback();
      if (!includeBatches) return asyncCallback();

      var sql = toolkit.createStringBuilder();
      sql.append('SELECT');
      sql.append('   bat.id');
      sql.append('  ,bat.funcId');
      sql.append('  ,bat.funcCallKwargsJSON');
      sql.append('  ,bat.tagsJSON');
      sql.append('  ,bat.origin');
      sql.append('  ,bat.showInDoc');
      sql.append('  ,bat.isDisabled');
      sql.append('  ,bat.note');

      sql.append('FROM biz_main_batch AS bat')

      sql.append('LEFT JOIN biz_main_func AS func');
      sql.append('  ON func.id = bat.funcId');

      sql.append('LEFT JOIN biz_main_script_set AS sset');
      sql.append('  ON sset.id = func.scriptSetId');

      sql.append('WHERE');
      sql.append('  sset.id IN (?)');

      sql.append('ORDER BY');
      sql.append('  bat.id ASC');

      var sqlParams = [scriptSetIds];
      self.db.query(sql, sqlParams, function(err, dbRes) {
        if (err) return asyncCallback(err);

        packageData.batches = dbRes;

        return asyncCallback();
      });
    },
    // 获取数据源
    function(asyncCallback) {
      if (toolkit.isNothing(dataSourceIds)) return asyncCallback();

      var sql = toolkit.createStringBuilder();
      sql.append('SELECT');
      sql.append('   dsrc.id');
      sql.append('  ,dsrc.title');
      sql.append('  ,dsrc.description');
      sql.append('  ,dsrc.type');
      sql.append('  ,dsrc.configJSON');

      sql.append('FROM biz_main_data_source AS dsrc')

      sql.append('WHERE');
      sql.append('  dsrc.id IN (?)');

      sql.append('ORDER BY');
      sql.append('  dsrc.id ASC');

      var sqlParams = [dataSourceIds];
      self.db.query(sql, sqlParams, function(err, dbRes) {
        if (err) return asyncCallback(err);

        // 去除加密字段
        dbRes.forEach(function(d) {
          if (!toolkit.isNothing(d.configJSON) && 'string' === typeof d.configJSON) {
            d.configJSON = JSON.parse(d.configJSON);
          }

          dataSourceMod.CIPHER_CONFIG_FIELDS.forEach(function(f) {
            var fCipher = toolkit.strf('{0}Cipher', f);
            if (fCipher in d.configJSON) {
              d.configJSON[fCipher] = '';
            }
          });
        });

        packageData.dataSources = dbRes;

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
      sql.append('  ,evar.valueTEXT');
      sql.append('  ,evar.autoTypeCasting');

      sql.append('FROM biz_main_env_variable AS evar')

      sql.append('WHERE');
      sql.append('  evar.id IN (?)');

      sql.append('ORDER BY');
      sql.append('  evar.id ASC');

      var sqlParams = [envVariableIds];
      self.db.query(sql, sqlParams, function(err, dbRes) {
        if (err) return asyncCallback(err);

        packageData.envVariables = dbRes;

        return asyncCallback();
      });
    },
    // 创建压缩包
    function(asyncCallback) {
      var z = new JSZip();
      z.file(FILENAME_IN_ZIP, JSON.stringify(packageData));

      z.generateAsync({
        type              : 'nodebuffer',
        compression       : 'DEFLATE',
        compressionOptions: { level: 9 },
      })
      .then(function(zipBuf) {
        // Base64
        fileBuf = toolkit.getBase64(zipBuf);

        // AES加密
        fileBuf = toolkit.cipherByAES(fileBuf, password);

        return asyncCallback();
      })
      .catch(function(err) {
        return asyncCallback(err);
      });
    },
    // 记录导出历史
    function(asyncCallback) {
      // 生成摘要
      var summary = toolkit.jsonCopy(packageData);
      summary.scripts.forEach(function(d) {
        delete d.code; // 摘要中不含代码
      });

      var _data = {
        note       : note,
        summaryJSON: summary,
      }
      scriptSetExportHistoryModel.add(_data, asyncCallback);
    },
  ], function(err) {
    if (err) return next(err);

    return callback(null, fileBuf);
  });
};

EntityModel.prototype.import = function(packageData, recoverData, callback) {
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
    // 创建还原点
    function(asyncCallback) {
      if (toolkit.isNothing(recoverData)) return asyncCallback();

      scriptRecoverPointModel.add(recoverData, asyncCallback);
    },
    // 删除所有涉及的脚本集
    function(asyncCallback) {
      if (recoverData.type === 'recover') {
        // 恢复模式
        var sql = toolkit.createStringBuilder();
        sql.append('DELETE FROM biz_main_script_set');

        self.db.query(sql, null, asyncCallback);

      } else {
        // 正常导入模式
        if (toolkit.isNothing(scriptSetIds)) return asyncCallback();

        var sql = toolkit.createStringBuilder();
        sql.append('DELETE FROM biz_main_script_set');
        sql.append('WHERE');
        sql.append('   id IN (?)');

        var sqlParams = [scriptSetIds];
        self.db.query(sql, sqlParams, asyncCallback);
      }
    },
    // 删除相关数据（脚本/函数）
    function(asyncCallback) {
      if (recoverData.type === 'recover') {
        // 恢复模式
        var sql = toolkit.createStringBuilder();
        sql.append('DELETE FROM biz_main_script;');
        sql.append('DELETE FROM biz_main_func;');

        self.db.query(sql, null, asyncCallback);

      } else {
        // 正常导入模式
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
      }
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

function _prepareData(data) {
  data = toolkit.jsonCopy(data);

  if ('boolean' === typeof data.isPinned) {
    data.pinTime = data.isPinned ? new Date() : null;
    delete data.isPinned;
  }

  return data;
};

function _prepareImportData(data) {
  data = toolkit.jsonCopy(data);

  for (var f in data) {
    var v = data[f];

    // NULL值不转换
    if (v === null) continue;

    if (toolkit.endsWith(f, 'JSON') && 'string' !== typeof v) {
      // JSON字段序列化
      data[f] = JSON.stringify(v);

    } else if (f === 'expireTime') {
      // 时间字段
      data[f] = new Date(v);
    }
  }

  return data;
}
