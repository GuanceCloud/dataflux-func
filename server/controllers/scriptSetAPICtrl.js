'use strict';

/* Built-in Modules */
var path = require('path');

/* 3rd-party Modules */
var fs     = require('fs-extra');
var async  = require('async');
var moment = require('moment-timezone');
var AdmZip = require("adm-zip");
var yaml   = require('js-yaml');

/* Project Modules */
var E       = require('../utils/serverError');
var CONFIG  = require('../utils/yamlResources').get('CONFIG');
var ROUTE   = require('../utils/yamlResources').get('ROUTE');
var toolkit = require('../utils/toolkit');
var common  = require('../utils/common');

var scriptSetMod              = require('../models/scriptSetMod');
var scriptMod                 = require('../models/scriptMod');
var funcMod                   = require('../models/funcMod');
var connectorMod              = require('../models/connectorMod');
var envVariableMod            = require('../models/envVariableMod');
var syncAPIMod                = require('../models/syncAPIMod');
var asyncAPIMod               = require('../models/asyncAPIMod');
var cronJobMod                = require('../models/cronJobMod');
var scriptSetExportHistoryMod = require('../models/scriptSetExportHistoryMod');

var mainAPICtrl = require('./mainAPICtrl');

/* Init */

/* Handlers */
var crudHandler = exports.crudHandler = scriptSetMod.createCRUDHandler();

exports.list = function(req, res, next) {
  var withScripts    = toolkit.toBoolean(req.query._withScripts);
  var withScriptCode = toolkit.toBoolean(req.query._withScriptCode);

  var listData     = null;
  var listPageInfo = null;

  var scriptModel    = scriptMod.createModel(res.locals);
  var scriptSetModel = scriptSetMod.createModel(res.locals);

  async.series([
    // 获取脚本集
    function(asyncCallback) {
      var opt = res.locals.getQueryOptions();

      scriptSetModel.list(opt, function(err, dbRes, pageInfo) {
        if (err) return asyncCallback(err);

        listData     = dbRes;
        listPageInfo = pageInfo;

        return asyncCallback();
      });
    },
    // 获取脚本
    function(asyncCallback) {
      if (!withScripts) return asyncCallback();

      var scriptSetIds = toolkit.arrayElementValues(listData, 'id');
      if (toolkit.isNothing(scriptSetIds)) return asyncCallback();

      var opt = {
        filters: {
          scriptSetId: { in: scriptSetIds }
        },
        extra: {
          withCode: withScriptCode,
        }
      }
      scriptModel.list(opt, function(err, dbRes) {
        if (err) return asyncCallback(err);

        var _map = dbRes.reduce(function(acc, x) {
          if (!acc[x.scriptSetId]) acc[x.scriptSetId] = [];
          acc[x.scriptSetId].push(x);
          return acc;
        }, {});

        listData.forEach(function(scriptSet) {
          scriptSet.scripts = _map[scriptSet.id] || [];
          scriptSet.md5     = common.getScriptSetMD5(scriptSet, scriptSet.scripts);
        });

        return asyncCallback();
      });
    },
  ], function(err) {
    if (err) return next(err);

    var ret = toolkit.initRet(listData, listPageInfo);
    res.locals.sendJSON(ret);
  });
};

exports.add = function(req, res, next) {
  var data = req.body.data;

  var scriptSetModel = scriptSetMod.createModel(res.locals);

  async.series([
    // 检查 ID 重名
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
    // 锁定状态
    function(asyncCallback) {
      // 超级管理员不受限制
      if (res.locals.user.is('sa')) return asyncCallback();

      scriptSetModel.getWithCheck(id, ['lockedByUserId'], function(err, dbRes) {
        if (err) return asyncCallback(err);

        if (dbRes.lockedByUserId && dbRes.lockedByUserId !== res.locals.user.id) {
          return asyncCallback(new E('EBizCondition.ModifyingScriptSetNotAllowed', 'This Script Set is locked by other user'));
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
          return asyncCallback(new E('EBizCondition.DeletingScriptSetNotAllowed', 'This Script Set is locked by other user'));
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
    // 检查 ID 重名
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
    // 检查 ID 过长
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
  var opt = req.body || {};

  // 兼容处理
  opt.includeSyncAPIs  = opt.includeSyncAPIs  || opt.includeAuthLinks;
  opt.includeAsyncAPIs = opt.includeAsyncAPIs || opt.includeBatches;
  opt.includeCronJobs  = opt.includeCronJobs  || opt.includeCrontabConfigs;

  var scriptSetModel              = scriptSetMod.createModel(res.locals);
  var scriptSetExportHistoryModel = scriptSetExportHistoryMod.createModel(res.locals);

  var exportData = null;
  var fileBuf    = null;
  async.series([
    // 导出
    function(asyncCallback) {
      scriptSetModel.getExportData(opt, function(err, _exportData) {
        if (err) return asyncCallback(err);

        exportData = _exportData;

        // 生成 zip
        var zip = new AdmZip();

        // 写入脚本集数据 / 脚本文件
        exportData.scriptSets.forEach(function(scriptSet) {
          if (toolkit.isNothing(scriptSet.scripts)) return;

          // 导出脚本集数据中不含 extra
          delete scriptSet._extra;

          var scriptSetDir = path.join(CONFIG._SCRIPT_EXPORT_SCRIPT_SET_DIR, scriptSet.id);
          scriptSet.scripts.forEach(function(script) {
            // 写入脚本文件
            var filePath = path.join(scriptSetDir, common.getScriptFilename(script));
            zip.addFile(filePath, script.code || '');

            // 导出脚本数据中不含脚本
            delete script.code;
            delete script.codeDraft;
          });
        });

        // 写入 META 文件
        zip.addFile(CONFIG._SCRIPT_EXPORT_META_FILE, yaml.dump(exportData));

        // 单独生成备注文件
        var note = toolkit.jsonFindSafe(exportData, 'extra.note');
        if (note) {
          zip.addFile(CONFIG._SCRIPT_EXPORT_NOTE_FILE, note);
        }

        fileBuf = zip.toBuffer();

        return asyncCallback();
      });
    },
    // 记录导出历史
    function(asyncCallback) {
      // 生成摘要
      var summary = common.flattenImportExportData(exportData);

      // 摘要中不含代码
      if (toolkit.notNothing(summary.scripts)) {
        summary.scripts.forEach(function(d) {
          delete d.code;
          delete d.codeDraft;
        });
      }

      var _data = {
        note       : toolkit.jsonFindSafe(summary, 'extra.note'),
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
  var file       = req.files ? req.files[0]: null;
  var checkOnly  = toolkit.toBoolean(req.body.checkOnly);
  var setBuiltin = toolkit.toBoolean(req.body.setBuiltin);

  var scriptSetModel   = scriptSetMod.createModel(res.locals);
  var connectorModel   = connectorMod.createModel(res.locals);
  var envVariableModel = envVariableMod.createModel(res.locals);
  var syncAPIModel     = syncAPIMod.createModel(res.locals);
  var asyncAPIModel    = asyncAPIMod.createModel(res.locals);
  var cronJobModel     = cronJobMod.createModel(res.locals);

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

      // 解压缩
      try {
        zip.getEntries().forEach(function(zipEntry) {
          if (zipEntry.isDirectory) return;
          allFileData[zipEntry.entryName] = zipEntry.getData().toString("utf8");
        });

      } catch(err) {
        return asyncCallback(new E('EBizCondition.InvalidImportFile', 'Invalid import file', null, err));
      }

      if (toolkit.isNothing(allFileData)) {
        return asyncCallback(new E('EBizCondition.EmptyImportFile', 'Empty import file'));
      }

      // 提升目录级别：xxx/yyy/zzz/* -> *
      var realMetaPath = Object.keys(allFileData).filter(function(filePath) {
        return toolkit.endsWith(filePath, `/${CONFIG._SCRIPT_EXPORT_META_FILE}`);
      })[0];

      if (realMetaPath) {
        var rootDir = realMetaPath.split('/').slice(0, -1).join('/');
        for (var filePath in allFileData) {
          if (!toolkit.startsWith(filePath, rootDir)) continue;

          var nextFilePath = filePath.slice(rootDir.length + 1);
          if (nextFilePath === filePath) continue;

          allFileData[nextFilePath] = allFileData[filePath];
          delete allFileData[filePath];
        }
      }

      // 提取数据
      if (allFileData[CONFIG._SCRIPT_EXPORT_META_FILE]) {
        importData = yaml.load(allFileData[CONFIG._SCRIPT_EXPORT_META_FILE]) || {};

      } else {
        /* 兼容处理 */
        importData = {};

        // 提取脚本数据
        importData.scriptSets = yaml.load(allFileData[`scriptSets.yaml`]);

        // 提取其他信息
        var resourceNameMap = {
          'connectors'  : 'connectors',
          'envVariables': 'envVariables',
          'syncAPIs'    : 'syncAPIs',
          'asyncAPIs'   : 'asyncAPIs',
          'cronJobs'    : 'cronJobs',

          // 兼容处理
          'authLinks'     : 'syncAPIs',
          'crontabConfigs': 'cronJobs',
          'batches'       : 'asyncAPIs',
        };
        for (var dataKey in resourceNameMap) {
          var importKey = resourceNameMap[dataKey];

          var data = allFileData[`${importKey}.yaml`];
          if (!data) return;

          importData[importKey] = yaml.load(data);
        }

        // 从 NOTE 文件提取备注
        importData.extra      = importData.extra || {};
        importData.extra.note = allFileData[CONFIG._SCRIPT_EXPORT_NOTE_FILE] || null;
      }

      // 提取脚本代码
      importData.scriptSets.forEach(function(scriptSet) {
        if (toolkit.isNothing(scriptSet.scripts)) return;

        scriptSet.scripts.forEach(function(script) {
          scriptMap[script.id] = script;

          // 读取代码
          var scriptZipPath = `${CONFIG._SCRIPT_EXPORT_SCRIPT_SET_DIR}/${scriptSet.id}/${common.getScriptFilename(script)}`;
          script.code = allFileData[scriptZipPath] || '';
        });
      });

      // 替换 origin, originId
      var origin   = 'UNKNOWN';
      var originId = 'UNKNOWN';

      if (setBuiltin) {
        origin   = 'builtin';
        originId = 'builtin';
      } else if (res.locals.user && res.locals.user.isSignedIn) {
        origin   = 'user';
        originId = res.locals.user.id;
      }

      common.replaceImportDataOrigin(importData, origin, originId);

      if (checkOnly) {
        // 仅检查时，数据暂存 Redis，不进行实际导入操作
        var cacheKey = toolkit.getCacheKey('stage', 'importScriptSet', ['confirmId', confirmId]);
        return res.locals.cacheDB.setex(cacheKey, CONFIG._FUNC_IMPORT_CONFIRM_TIMEOUT, JSON.stringify(importData), asyncCallback);

      } else {
        // 直接导入
        var recoverPoint = {
          type: 'import',
          note: 'System: Before importing Script Sets',
        };
        return scriptSetModel.import(importData, recoverPoint, function(err, _requirements) {
          if (err) return asyncCallback(err);

          requirements = _requirements;

          reloadDataMD5Cache(res.locals, asyncCallback);
        });
      }
    },
    // 获取当前数据信息
    function(asyncCallback) {
      var currentDataOpts = [
        { key: 'scriptSets',       model: scriptSetModel,       fields: [ 'id', 'title' ] },
        { key: 'connectors',       model: connectorModel,       fields: [ 'id', 'title' ] },
        { key: 'envVariables',     model: envVariableModel,     fields: [ 'id', 'title' ] },
        { key: 'syncAPIs',         model: syncAPIModel,         fields: [ 'id', 'funcId' ] },
        { key: 'asyncAPIs',        model: asyncAPIModel,        fields: [ 'id', 'funcId' ] },
        { key: 'cronJobs',         model: cronJobModel,         fields: [ 'id', 'funcId' ] },
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
      note        : toolkit.jsonFindSafe(importData, 'extra.note'),
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
        note: 'System: Before importing Script Sets',
      };
      scriptSetModel.import(importData, recoverPoint, function(err, _requirements) {
        if (err) return asyncCallback(err);

        requirements = _requirements;

        reloadDataMD5Cache(res.locals, asyncCallback);
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

exports.deploy = function(req, res, next) {
  var scriptSetId = req.params.id;

  var opt = {
    startupScriptTitle: req.body.startupScriptTitle || null,
    withCronJob       : req.body.withCronJob        || false,
    configReplacer    : req.body.configReplacer     || {},
  }

  // 兼容处理
  opt.withCronJob = opt.withCronJob || req.body.withCrontabConfig || false;

  doDeploy(res.locals, scriptSetId, opt, function(err, startupScriptId, startupCrontabId, startupScriptCronJobFunc) {
    if (err) return next(err);

    var ret = toolkit.initRet({
      startupScriptId         : startupScriptId,
      startupCrontabId        : startupCrontabId,
      startupScriptCronJobFunc: startupScriptCronJobFunc,
    });
    return res.locals.sendJSON(ret);
  });
};

function reloadDataMD5Cache(locals, callback) {
  var taskReq = {
    name  : 'Internal.ReloadDataMD5Cache',
    kwargs: { all: true },
  }
  locals.cacheDB.putTask(taskReq, callback);
};

function doDeploy(locals, scriptSetId, options, callback) {
  options = options || {};
  options.startupScriptTitle = options.startupScriptTitle || null;
  options.withCronJob        = options.withCronJob        || false;
  options.configReplacer     = options.configReplacer     || {};

  var startupScriptId = `${CONFIG._STARTUP_SCRIPT_SET_ID}__${scriptSetId}`;

  var startupScriptCronJobFunc = null;
  var startupCronJobId         = null;

  var scriptSetModel = scriptSetMod.createModel(locals);
  var scriptModel    = scriptMod.createModel(locals);
  var funcModel      = funcMod.createModel(locals);
  var cronJobModel   = cronJobMod.createModel(locals);

  var exampleScript = null;
  var nextAPIFuncs  = null;
  async.series([
    // 获取示例脚本
    function(asyncCallback) {
      var exampleScriptId = `${scriptSetId}__example`;
      scriptModel.get(exampleScriptId, [ 'code' ], function(err, dbRes) {
        if (err) return asyncCallback(err);

        if (dbRes) {
          exampleScript = dbRes;
          return asyncCallback();

        } else {
          // 没有示例脚本，直接结束
          return callback();
        }
      });
    },
    // 检查启动脚本集存在性 / 创建启动脚本集
    function(asyncCallback) {
      scriptSetModel.get(CONFIG._STARTUP_SCRIPT_SET_ID, [ 'seq' ], function(err, dbRes) {
        if (err) return asyncCallback(err);

        // 已经创建，忽略
        if (dbRes) return asyncCallback();

        // 尚未创建，立刻创建
        var _data = {
          id      : CONFIG._STARTUP_SCRIPT_SET_ID,
          title   : 'Startup',
          isPinned: true,
        }
        return scriptSetModel.add(_data, asyncCallback);
      })
    },
    // 检查启动脚本存在性 / 创建启动脚本
    function(asyncCallback) {
      scriptModel.get(startupScriptId, [ 'seq' ], function(err, dbRes) {
        if (err) return asyncCallback(err);

        // 已经创建，忽略
        if (dbRes) return asyncCallback();

        // 尚未创建，立刻创建
        if (toolkit.notNothing(options.configReplacer)) {
          for (var k in options.configReplacer) {
            var v = options.configReplacer[k];
            if (v) {
              exampleScript.code = exampleScript.code.replace(`"<${k}>"`, `"${v}"`);
            }
          }
        }

        // 其他配置项目修改为空字符串
        exampleScript.code = exampleScript.code.replace(/"<(.+)>"(.*)/g, '""$2 # $1');

        var _data = {
          id       : startupScriptId,
          title    : options.startupScriptTitle || scriptSetId,
          code     : exampleScript.code,
          codeDraft: exampleScript.code,
        }
        return scriptModel.add(_data, asyncCallback);
      });
    },
    // 发送脚本代码预检查任务
    function(asyncCallback) {
      var opt = {
        scriptId: startupScriptId,

        origin  : 'scriptSet',
        originId: scriptSetId,
      }
      mainAPICtrl.callFuncDebugger(locals, opt, function(err, taskResp) {
        if (err) return asyncCallback(err);

        if (taskResp.result.status === 'failure') {
          return asyncCallback(new E('EStartupScriptDeployFailed', 'Startup Script deploying failed, Please contact the author', {
            // 部署错误时，提取具体 exception, traceback
            exception: taskResp.result && taskResp.result.exception,
            traceback: taskResp.result && taskResp.result.traceback,
        }));
        }

        nextAPIFuncs = taskResp.result.apiFuncs;

        return asyncCallback();
      });
    },
    // 更新函数
    function(asyncCallback) {
      if (toolkit.isNothing(nextAPIFuncs)) return asyncCallback();

      funcModel.update(startupScriptId, nextAPIFuncs, asyncCallback);
    },
    // 检查定时任务存在性 / 创建定时任务
    function(asyncCallback) {
      if (!options.withCronJob) return asyncCallback();
      if (toolkit.isNothing(nextAPIFuncs)) return asyncCallback();

      for (var i = 0; i < nextAPIFuncs.length; i++) {
        var apiFunc = nextAPIFuncs[i];
        if (apiFunc.extraConfig && apiFunc.extraConfig.fixedCrontab) {
          startupScriptCronJobFunc = apiFunc;
          break;
        }
      }

      // 没有可用于配置定时任务的函数，忽略
      if (!startupScriptCronJobFunc) return asyncCallback();

      var crontabFuncId = `${startupScriptId}.${startupScriptCronJobFunc.name}`;

      // 检查定时任务存在性
      var opt = {
        fields : [ 'cron.id' ],
        filters: {
          funcId: { eq: crontabFuncId }
        }
      }
      cronJobModel.list(opt, function(err, dbRes) {
        if (err) return asyncCallback(err);

        // 已经存在，忽略
        if (dbRes.length > 0) {
          startupCronJobId = dbRes[0].id;
          return asyncCallback();
        }

        // 尚不存在，立即创建
        startupCronJobId = `${CONFIG._STARTUP_CRONTAB_SCHEDULE_ID_PREFIX}-${scriptSetId}`;
        var _data = {
          id                : startupCronJobId,
          funcId            : crontabFuncId,
          funcCallKwargsJSON: {},
        }
        return cronJobModel.add(_data, asyncCallback);
      });
    },
  ], function(err) {
    if (err) return callback(err);
    callback(null, startupScriptId, startupCronJobId, startupScriptCronJobFunc);

    // 刷新数据 MD5 缓存
    reloadDataMD5Cache(locals);
  });
};

exports.doDeploy = doDeploy;
