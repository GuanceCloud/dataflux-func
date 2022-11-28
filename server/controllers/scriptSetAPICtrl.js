'use strict';

/* Builtin Modules */
var path = require('path');

/* 3rd-party Modules */
var fs     = require('fs-extra');
var async  = require('async');
var moment = require('moment');
var AdmZip = require("adm-zip");
var yaml   = require('js-yaml');

/* Project Modules */
var E            = require('../utils/serverError');
var CONFIG       = require('../utils/yamlResources').get('CONFIG');
var ROUTE        = require('../utils/yamlResources').get('ROUTE');
var toolkit      = require('../utils/toolkit');
var common       = require('../utils/common');
var celeryHelper = require('../utils/extraHelpers/celeryHelper');

var scriptSetMod              = require('../models/scriptSetMod');
var scriptMod                 = require('../models/scriptMod');
var connectorMod              = require('../models/connectorMod');
var envVariableMod            = require('../models/envVariableMod');
var authLinkMod               = require('../models/authLinkMod');
var crontabConfigMod          = require('../models/crontabConfigMod');
var batchMod                  = require('../models/batchMod');
var scriptSetExportHistoryMod = require('../models/scriptSetExportHistoryMod');

/* Configure */

/* Handlers */
var crudHandler = exports.crudHandler = scriptSetMod.createCRUDHandler();

exports.list = function(req, res, next) {
  var scriptSets        = null;
  var scriptSetPageInfo = null;

  var scriptSetModel = scriptSetMod.createModel(res.locals);

  async.series([
    function(asyncCallback) {
      var opt = res.locals.getQueryOptions();

      scriptSetModel.list(opt, function(err, dbRes, pageInfo) {
        if (err) return asyncCallback(err);

        scriptSets        = dbRes;
        scriptSetPageInfo = pageInfo;

        return asyncCallback();
      });
    },
  ], function(err) {
    if (err) return next(err);

    var ret = toolkit.initRet(scriptSets, scriptSetPageInfo);
    res.locals.sendJSON(ret);
  });
};

exports.add = function(req, res, next) {
  var data = req.body.data;

  var scriptSetModel = scriptSetMod.createModel(res.locals);

  async.series([
    // 检查ID重名
    function(asyncCallback) {
      var opt = {
        limit  : 1,
        fields : ['sset.id'],
        filters: {
          'sset.id': {eq: data.id},
        },
      };
      scriptSetModel.list(opt, function(err, dbRes) {
        if (err) return asyncCallback(err);

        if (dbRes.length > 0) {
          return asyncCallback(new E('EBizCondition.DuplicatedScriptSetID', 'ID of script set already exists'));
        }

        return asyncCallback();
      });
    },
    // 数据入库
    function(asyncCallback) {
      scriptSetModel.add(data, asyncCallback);
    },
  ], function(err) {
    if (err) return next(err);

    var ret = toolkit.initRet({
      id: data.id,
    });
    return res.locals.sendJSON(ret);
  });
};

exports.modify = function(req, res, next) {
  var id   = req.params.id;
  var data = req.body.data;

  var scriptSetModel = scriptSetMod.createModel(res.locals);

  async.series([
    // 检查脚本集锁定状态
    function(asyncCallback) {
      // 超级管理员不受限制
      if (res.locals.user.is('sa')) return asyncCallback();

      scriptSetModel.getWithCheck(id, ['lockedByUserId'], function(err, dbRes) {
        if (err) return asyncCallback(err);

        if (dbRes.lockedByUserId && dbRes.lockedByUserId !== res.locals.user.id) {
          return asyncCallback(new E('EBizCondition.ModifyingScriptSetNotAllowed', 'This script set is locked by other user'));
        }

        return asyncCallback();
      });
    },
    // 数据入库
    function(asyncCallback) {
      // 锁定状态
      if (data.isLocked === true) {
        data.lockedByUserId = res.locals.user.id;
      } else if (data.isLocked === false) {
        data.lockedByUserId = null;
      }
      delete data.isLocked;

      scriptSetModel.modify(id, data, asyncCallback);
    },
  ], function(err) {
    if (err) return next(err);

    var ret = toolkit.initRet({
      id: id,
    });
    return res.locals.sendJSON(ret);
  });
};

exports.delete = function(req, res, next) {
  var id = req.params.id;

  var scriptSetModel = scriptSetMod.createModel(res.locals);

  async.series([
    // 检查脚本集锁定状态
    function(asyncCallback) {
      // 超级管理员不受限制
      if (res.locals.user.is('sa')) return asyncCallback();

      scriptSetModel.getWithCheck(id, ['lockedByUserId'], function(err, dbRes) {
        if (err) return asyncCallback(err);

        if (dbRes.lockedByUserId && dbRes.lockedByUserId !== res.locals.user.id) {
          return asyncCallback(new E('EBizCondition.DeletingScriptSetNotAllowed', 'This script set is locked by other user'));
        }

        return asyncCallback();
      });
    },
    // 数据入库
    function(asyncCallback) {
      scriptSetModel.delete(id, asyncCallback);
    },
  ], function(err) {
    if (err) return next(err);

    var ret = toolkit.initRet({
      id: id,
    });
    return res.locals.sendJSON(ret);
  });
};

exports.clone = function(req, res, next) {
  var id    = req.params.id;
  var newId = req.body.newId;

  var scriptSetModel = scriptSetMod.createModel(res.locals);
  var scriptModel    = scriptMod.createModel(res.locals);

  async.series([
    // 检查ID重名
    function(asyncCallback) {
      var opt = {
        limit  : 1,
        fields : ['sset.id'],
        filters: {
          'sset.id': {eq: newId},
        },
      };
      scriptSetModel.list(opt, function(err, dbRes) {
        if (err) return asyncCallback(err);

        if (dbRes.length > 0) {
          return asyncCallback(new E('EBizCondition.DuplicatedScriptSetID', 'ID of script set already exists'));
        }

        return asyncCallback();
      });
    },
    // 检查ID过长
    function(asyncCallback) {
      var opt = {
        fields : ['scpt.id'],
        filters: {
          'scpt.scriptsetId': {eq: id},
        },
      };
      scriptModel.list(opt, function(err, dbRes) {
        if (err) return asyncCallback(err);

        for (var i = 0; i < dbRes.length; i++) {
          var newScriptid = `${newId}__${dbRes[i].id.split('__')[1]}`;
          if (newScriptid.length > ROUTE.scriptAPI.add.body.data.id.$maxLength) {
            return asyncCallback(new E('EBizCondition.ClonedScriptIDTooLong', 'ID of cloned Script will be too long'));
          }
        }

        return asyncCallback();
      });
    },
    // 复制脚本集
    function(asyncCallback) {
      scriptSetModel.clone(id, newId, asyncCallback);
    },
  ], function(err) {
    if (err) return next(err);

    var ret = toolkit.initRet({
      id: newId,
    });
    return res.locals.sendJSON(ret);
  });
};

exports.export = function(req, res, next) {
  var opt = req.body;

  var scriptSetModel              = scriptSetMod.createModel(res.locals);
  var scriptSetExportHistoryModel = scriptSetExportHistoryMod.createModel(res.locals);

  var exportData = null;
  var fileBuf    = null;
  async.series([
    // 导出
    function(asyncCallback) {
      scriptSetModel.getExportData(opt, function(err, _exportData, summary) {
        if (err) return asyncCallback(err);

        exportData = _exportData;

        // 生成 zip
        var zip = new AdmZip();

        // 导出注释
        if (!toolkit.isNothing(exportData.note)) {
          zip.addFile(CONFIG.SCRIPT_EXPORT_NOTE_FILE, exportData.note)
        }

        // 导出脚本集 / 脚本
        exportData.scriptSets.forEach(function(scriptSet) {
          var scriptSetDir = path.join(CONFIG.SCRIPT_EXPORT_SCRIPT_SET_DIR, scriptSet.id);

          // 导出 META 内容
          var metaData = {
            scriptSet: toolkit.jsonCopy(scriptSet),
          };

          // 导出脚本文件
          metaData.scriptSet.scripts.forEach(function(script) {
            var filePath = path.join(scriptSetDir, common.getScriptFilename(script));
            zip.addFile(filePath, script.code || '');

            // 去除 META 中代码
            delete script.code;
          });

          // 导出 META 信息
          var metaFilePath = path.join(scriptSetDir, CONFIG.SCRIPT_EXPORT_META_FILE);
          var metaFileText = yaml.dump(metaData);
          zip.addFile(metaFilePath, metaFileText);
        });

        // 导出其他数据
        [
          'connectors',
          'envVariables',
          'authLinks',
          'crontabConfigs',
          'batches',
        ].forEach(function(name) {
          if (toolkit.isNothing(exportData[name])) return;

          var filePath = `${name}.yaml`;
          var fileData = yaml.dump(exportData[name]);
          zip.addFile(filePath, fileData);
        });

        fileBuf = zip.toBuffer();

        return asyncCallback();
      });
    },
    // 记录导出历史
    function(asyncCallback) {
      // 生成摘要
      var summary = common.flattenImportExportData(exportData);
      if (!toolkit.isNothing(summary.scripts)) {
        summary.scripts.forEach(function(d) {
          delete d.code; // 摘要中不含代码
        });
      }

      var _data = {
        note       : exportData.note,
        summaryJSON: summary,
      }
      scriptSetExportHistoryModel.add(_data, asyncCallback);
    },
  ], function(err) {
    if (err) return next(err);

    // 文件名为固定开头+时间
    var fileNameParts = [
      CONFIG._FUNC_EXPORT_FILENAME,
      moment().utcOffset('+08:00').format('YYYYMMDD_HHmmss'),
    ];
    var fileName = fileNameParts.join('-') + '.zip';

    // 下载文件
    return res.locals.sendFile(fileBuf, fileName);
  });
};

exports.import = function(req, res, next) {
  var file      = req.files ? req.files[0] : null;
  var checkOnly = toolkit.toBoolean(req.body.checkOnly);

  var scriptSetModel     = scriptSetMod.createModel(res.locals);
  var connectorModel     = connectorMod.createModel(res.locals);
  var envVariableModel   = envVariableMod.createModel(res.locals);
  var authLinkModel      = authLinkMod.createModel(res.locals);
  var crontabConfigModel = crontabConfigMod.createModel(res.locals);
  var batchModel         = batchMod.createModel(res.locals);

  var requirements = {};
  var confirmId    = toolkit.genDataId('import');
  var diff         = {};

  var scriptMap   = {};
  var importData  = {};
  var allFileData = {};

  async.series([
    // 加载 zip 文件
    function(asyncCallback) {
      var fileBuf = fs.readFileSync(file.path);
      var zip = new AdmZip(fileBuf);

      try {
        zip.getEntries().forEach(function(zipEntry) {
          if (zipEntry.isDirectory) return;
          allFileData[zipEntry.entryName] = zipEntry.getData().toString("utf8");
        });

      } catch(err) {
        return asyncCallback(new E('EBizCondition.InvalidImportFile', 'Invalid import file', null, err));
      }

      // 提取数据
      if (toolkit.isNothing(allFileData)) {
        return asyncCallback(new E('EBizCondition.EmptyImportFile', 'Empty import file'));
      }

      // 提取 NOTE
      importData.note = allFileData[CONFIG.SCRIPT_EXPORT_NOTE_FILE] || null;

      // 提取 META
      for (var filePath in allFileData) if (toolkit.endsWith(filePath, '/META')) {
        var data = allFileData[filePath];

        var scriptSet = yaml.load(data).scriptSet;

        // 脚本集信息
        if (!importData.scriptSets) importData.scriptSets = [];
        importData.scriptSets.push(scriptSet);

        // 脚本信息
        if (scriptSet.scripts) {
          scriptSet.scripts.forEach(function(script) {
            scriptMap[script.id] = script;
          });
        }
      }

      // 提取脚本代码
      for (var filePath in allFileData) if (toolkit.endsWith(filePath, '.py')) {
        var data = allFileData[filePath];

        var scriptId = filePath.split('/').slice(-2).join('__').replace(/\.py$/g, '');
        var script = scriptMap[scriptId];

        if (script) {
          script.code = data;
        }
      }

      // 提取其他信息
      var resourceNames = [
        'connectors',
        'envVariables',
        'authLinks',
        'crontabConfigs',
        'batches',
      ];
      resourceNames.forEach(function(name) {
        var filePath = `${name}.yaml`
        var data = allFileData[filePath];

        if (!data) return;

        importData[name] = yaml.load(data);
      });

      if (checkOnly) {
        // 仅检查时，数据暂存Redis，不进行实际导入操作
        var cacheKey = toolkit.getCacheKey('stage', 'importScriptSet', ['confirmId', confirmId]);
        return res.locals.cacheDB.setex(cacheKey, CONFIG._FUNC_IMPORT_CONFIRM_TIMEOUT, JSON.stringify(importData), asyncCallback);

      } else {
        // 直接导入
        var recoverPoint = {
          type: 'import',
          note: '系统：导入脚本集前自动创建的还原点',
        };
        return scriptSetModel.import(importData, recoverPoint, function(err, _requirements) {
          if (err) return asyncCallback(err);

          requirements = _requirements;

          var celery = celeryHelper.createHelper(res.locals.logger);
          reloadDataMD5Cache(celery, asyncCallback);
        });
      }
    },
    // 获取当前数据信息
    function(asyncCallback) {
      var currentDataOpts = [
        { key: 'scriptSets',     model: scriptSetModel,     fields: [ 'id', 'title' ] },
        { key: 'connectors',     model: connectorModel,     fields: [ 'id', 'title' ] },
        { key: 'envVariables',   model: envVariableModel,   fields: [ 'id', 'title' ] },
        { key: 'authLinks',      model: authLinkModel,      fields: [ 'id', 'funcId' ] },
        { key: 'crontabConfigs', model: crontabConfigModel, fields: [ 'id', 'funcId' ] },
        { key: 'batches',        model: batchModel,         fields: [ 'id', 'funcId' ] },
      ]
      async.eachSeries(currentDataOpts, function(dataOpt, eachCallback) {
        var opt = {
          fields: dataOpt.fields.map(function(f) {
            return `${dataOpt.model.alias}.${f}`;
          }),
        }
        dataOpt.model.list(opt, function(err, dbRes) {
          if (err) return eachCallback(err);

          if (toolkit.isNothing(importData[dataOpt.key])) return eachCallback();

          var currentDataMap = toolkit.arrayElementMap(dbRes, 'id');
          var diffAdd     = [];
          var diffReplace = [];

          importData[dataOpt.key].forEach(function(d) {
            var diffInfo = dataOpt.fields.reduce(function(acc, f) {
              acc[f] = d[f];
              return acc;
            }, {});

            if (!!currentDataMap[d.id]) {
              diffInfo.diffType = 'replace';
              diffReplace.push(diffInfo);
            } else {
              diffInfo.diffType = 'add';
              diffAdd.push(diffInfo);
            }

          });

          diff[dataOpt.key] = diffAdd.concat(diffReplace);

          return eachCallback();
        });
      }, asyncCallback);
    },
  ], function(err) {
    if (err) return next(err);

    var ret = toolkit.initRet({
      requirements: requirements,
      confirmId   : confirmId,
      diff        : diff,
      note        : importData.note,
    });
    return res.locals.sendJSON(ret);
  });
};

exports.confirmImport = function(req, res, next) {
  var confirmId = req.body.confirmId;

  var requirements = null;

  var scriptSetModel = scriptSetMod.createModel(res.locals);

  var importData = null;
  async.series([
    // 从缓存中读取导入数据
    function(asyncCallback) {
      var cacheKey = toolkit.getCacheKey('stage', 'importScriptSet', ['confirmId', confirmId]);
      res.locals.cacheDB.get(cacheKey, function(err, cacheRes) {
        if (err) return asyncCallback(err);

        if (!cacheRes) {
          return asyncCallback(new E('EBizCondition.ConfirmingImportTimeout', 'Confirming import timeout'));
        }

        importData = JSON.parse(cacheRes);

        return asyncCallback();
      });
    },
    // 执行导入
    function(asyncCallback) {
      var recoverPoint = {
        // 存在确认导入的，只有「导入脚本集」操作
        type: 'import',
        note: '系统：导入脚本集前自动创建的还原点',
      };
      scriptSetModel.import(importData, recoverPoint, function(err, _requirements) {
        if (err) return asyncCallback(err);

        requirements = _requirements;

        var celery = celeryHelper.createHelper(res.locals.logger);
        reloadDataMD5Cache(celery, asyncCallback);
      });
    },
  ], function(err) {
    if (err) return next(err);

    var ret = toolkit.initRet({
      requirements: requirements,
    });
    return res.locals.sendJSON(ret);
  });
};

function reloadDataMD5Cache(celery, callback) {
  var taskKwargs = { all: true };
  celery.putTask('Main.ReloadDataMD5Cache', null, taskKwargs, null, null, callback);
};