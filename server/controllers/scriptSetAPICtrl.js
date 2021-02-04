'use strict';

/* Builtin Modules */

/* 3rd-party Modules */
var async  = require('async');
var moment = require('moment');
var JSZip  = require('jszip');

/* Project Modules */
var E            = require('../utils/serverError');
var CONFIG       = require('../utils/yamlResources').get('CONFIG');
var toolkit      = require('../utils/toolkit');
var modelHelper  = require('../utils/modelHelper');
var celeryHelper = require('../utils/extraHelpers/celeryHelper');

var scriptSetMod              = require('../models/scriptSetMod');
var scriptMod                 = require('../models/scriptMod');
var funcMod                   = require('../models/funcMod');
var authLinkMod               = require('../models/authLinkMod');
var crontabConfigMod          = require('../models/crontabConfigMod');
var batchMod                  = require('../models/batchMod');
var scriptSetExportHistoryMod = require('../models/scriptSetExportHistoryMod');

/* Configure */
var FILENAME_IN_ZIP = 'dataflux-func.json';
var BUILTIN_SCRIPT_SET_IDS = null;

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
    // 查询内置记录
    function(asyncCallback) {
      if (BUILTIN_SCRIPT_SET_IDS) return asyncCallback();

      var cacheKey = toolkit.getCacheKey('cache', 'builtinScriptSetIds');
      res.locals.cacheDB.get(cacheKey, function(err, cacheRes) {
        if (err) return asyncCallback(err);

        if (cacheRes) {
          BUILTIN_SCRIPT_SET_IDS = JSON.parse(cacheRes);
        } else {
          BUILTIN_SCRIPT_SET_IDS = [];
        }

        return asyncCallback();
      });
    },
  ], function(err) {
    if (err) return next(err);

    // 内置
    scriptSets.forEach(function(scriptSet) {
       scriptSet.isBuiltin = (BUILTIN_SCRIPT_SET_IDS.indexOf(scriptSet.id) >= 0);
    });

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
          return asyncCallback(new E('EBizCondition.DuplicatedScriptSetID', 'ID of script set already exists.'));
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
      scriptSetModel.getWithCheck(id, ['lockedByUserId'], function(err, dbRes) {
        if (err) return asyncCallback(err);

        if (dbRes.lockedByUserId && dbRes.lockedByUserId !== res.locals.user.id) {
          return asyncCallback(new E('EBizCondition.ModifyingScriptSetNotAllowed', 'This script set is locked by other user.'));
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
      scriptSetModel.getWithCheck(id, ['lockedByUserId'], function(err, dbRes) {
        if (err) return asyncCallback(err);

        if (dbRes.lockedByUserId && dbRes.lockedByUserId !== res.locals.user.id) {
          return asyncCallback(new E('EBizCondition.DeletingScriptSetNotAllowed', 'This script set is locked by other user.'));
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

/* 导出步骤
 *    1. 生成导出数据：大JSON，{"scripts": [<所有脚本信息及代码>], "scriptSets": [<所有脚本集信息>]}
 *    2. 压缩
 *    3. 使用importToken 进行AES对称加密
 * 导入步骤
 *    1. 使用importToken 进行AES对称解密
 *    3. 解压
 *    4. 反序列化大JSON，将数据导入数据库
 *    5. 【导入用户包，且指定立即发布时】发布脚本
 */

exports.export = function(req, res, next) {
  var scriptSetIds          = req.body.scriptSetIds;
  var password              = req.body.password              || '';
  var includeAuthLinks      = req.body.includeAuthLinks      || false;
  var includeCrontabConfigs = req.body.includeCrontabConfigs || false;
  var includeBatches        = req.body.includeBatches        || false;
  var note                  = req.body.note;

  if (toolkit.isNothing(password)) {
    password = '';
  }

  var scriptSetModel = scriptSetMod.createModel(res.locals);
  var scriptModel    = scriptMod.createModel(res.locals);
  var funcModel      = funcMod.createModel(res.locals);

  var authLinkModel      = authLinkMod.createModel(res.locals);
  var crontabConfigModel = crontabConfigMod.createModel(res.locals);
  var batchModel         = batchMod.createModel(res.locals);

  var scriptSetExportHistoryModel = scriptSetExportHistoryMod.createModel(res.locals);

  var packageData = {
    scriptSets: [],
    scripts   : [],
    funcs     : [],
    note      : note,
  };

  if (includeAuthLinks)      packageData.authLinks      = [];
  if (includeCrontabConfigs) packageData.crontabConfigs = [];
  if (includeBatches)        packageData.batches        = [];

  var fileBuf = null;
  async.series([
    // 获取脚本集
    function(asyncCallback) {
      var opt = {
        fields: [
          'sset.id',
          'sset.title',
          'sset.description'
        ],
        filters: {
          'sset.id': {in: scriptSetIds},
        },
        orders: [
          {field: 'sset.id', method: 'ASC'},
        ],
      };
      scriptSetModel.list(opt, function(err, dbRes) {
        if (err) return asyncCallback(err);

        packageData.scriptSets = dbRes;

        return asyncCallback();
      });
    },
    // 获取脚本
    function(asyncCallback) {
      var opt = {
        fields: [
          'scpt.id',
          'scpt.scriptSetId',
          'scpt.title',
          'scpt.description',
          'scpt.publishVersion',
          'scpt.type',
          'scpt.code'
        ],
        filters: {
          'scpt.scriptSetId': {in: scriptSetIds},
        },
        orders: [
          {field: 'scpt.id', method: 'ASC'},
        ]
      };
      scriptModel.list(opt, function(err, dbRes) {
        if (err) return asyncCallback(err);

        packageData.scripts = dbRes;

        return asyncCallback();
      });
    },
    // 获取函数
    function(asyncCallback) {
      var opt = {
        fields: [
          'func.id',
          'func.scriptSetId',
          'func.scriptId',
          'func.name',
          'func.title',
          'func.description',
          'func.definition',
          'func.argsJSON',
          'func.kwargsJSON',
          'func.extraConfigJSON',
          'func.category',
          'func.integration',
          'func.tagsJSON',
          'func.defOrder'
        ],
        filters: {
          'func.scriptSetId': {in: scriptSetIds},
        },
        orders: [
          {field: 'func.id', method: 'ASC'},
        ],
        extra: {
          withCode: true,
        },
      };
      funcModel.list(opt, function(err, dbRes) {
        if (err) return asyncCallback(err);

        packageData.funcs = dbRes;

        return asyncCallback();
      });
    },
    // 获取授权链接
    function(asyncCallback) {
      if (!includeAuthLinks) return asyncCallback();

      var opt = {
        fields: [
          'auln.id',
          'auln.funcId',
          'auln.funcCallKwargsJSON',
          'auln.expireTime',
          'auln.throttlingJSON',
          'auln.origin',
          'auln.showInDoc',
          'auln.isDisabled',
          'auln.note',
        ],
        filters: {
          'sset.id': {in: scriptSetIds},
        },
        orders: [
          {field: 'auln.seq', method: 'ASC'},
        ],
      };
      authLinkModel.list(opt, function(err, dbRes) {
        if (err) return asyncCallback(err);

        packageData.authLinks = dbRes;

        return asyncCallback();
      });
    },
    // 获取自动触发配置
    function(asyncCallback) {
      if (!includeCrontabConfigs) return asyncCallback();

      var opt = {
        fields: [
          'cron.id',
          'cron.funcId',
          'cron.funcCallKwargsJSON',
          'cron.crontab',
          'cron.tagsJSON',
          'cron.saveResult',
          'cron.scope',
          'cron.configMD5',
          'cron.expireTime',
          'cron.origin',
          'cron.isDisabled',
          'cron.note',
        ],
        filters: {
          'sset.id': {in: scriptSetIds},
        },
        orders: [
          {field: 'cron.seq', method: 'ASC'},
        ],
      };
      crontabConfigModel.list(opt, function(err, dbRes) {
        if (err) return asyncCallback(err);

        packageData.crontabConfigs = dbRes;

        return asyncCallback();
      });
    },
    // 获取批处理
    function(asyncCallback) {
      if (!includeBatches) return asyncCallback();

      var opt = {
        fields: [
          'bat.id',
          'bat.funcId',
          'bat.funcCallKwargsJSON',
          'bat.tagsJSON',
          'bat.origin',
          'bat.showInDoc',
          'bat.isDisabled',
          'bat.note',
        ],
        filters: {
          'sset.id': {in: scriptSetIds},
        },
        orders: [
          {field: 'bat.seq', method: 'ASC'},
        ],
      };
      batchModel.list(opt, function(err, dbRes) {
        if (err) return asyncCallback(err);

        packageData.batches = dbRes;

        return asyncCallback();
      });
    },
    // 创建压缩包
    function(asyncCallback) {
      var z = new JSZip();
      z.file(FILENAME_IN_ZIP, JSON.stringify(packageData));

      async.asyncify(function() {
        return z.generateAsync({
          type              : 'nodebuffer',
          compression       : 'DEFLATE',
          compressionOptions: {level: 9},
        })
      })(function(err, zipBuf) {
        if (err) return asyncCallback(err);

        // Base64
        fileBuf = toolkit.getBase64(zipBuf);

        // AES加密
        fileBuf = toolkit.cipherByAES(fileBuf, password);

        return asyncCallback();
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

    // 文件名为固定开头+时间
    var fileNameParts = [
      CONFIG._FUNC_PKG_EXPORT_FILENAME,
      moment().utcOffset('+08:00').format('YYYYMMDD_HHmmss'),
    ];
    var fileName = fileNameParts.join('-') + CONFIG._FUNC_PKG_EXPORT_EXT;

    return res.locals.sendFile(fileBuf, CONFIG._FUNC_PKG_EXPORT_EXT, fileName);
  });
};

exports.import = function(req, res, next) {
  var file      = req.files[0];
  var password  = req.body.password || '';
  var checkOnly = toolkit.toBoolean(req.body.checkOnly);

  var celery = celeryHelper.createHelper(res.locals.logger);

  var scriptSetModel = scriptSetMod.createModel(res.locals);

  var fileBuf     = null;
  var packageData = null;

  var confirmId = toolkit.genDataId('import');
  var summary   = null;
  var diff      = null;

  async.series([
    // AES解密、JWT验签
    function(asyncCallback) {
      // AES解密
      try {
        var _fileBuf = file.data.toString();
        var _fileMD5 = toolkit.getMD5(_fileBuf);

        fileBuf = toolkit.decipherByAES(_fileBuf, password);
        res.locals.logger.debug(toolkit.strf('File Data: {0}...{1}, MD5: {2}', fileBuf.slice(0, 20), fileBuf.slice(-20), _fileMD5));

      } catch(err) {
        res.locals.logger.logError(err);
        return asyncCallback(new E('EBizCondition.InvalidPassword', 'Invalid password.'));
      }

      return asyncCallback();
    },
    // zip解压
    function(asyncCallback) {
      var zipBuf = toolkit.fromBase64(fileBuf, true);

      async.asyncify(function() {
        return JSZip.loadAsync(zipBuf);

      })(function(err, z) {
        if (err) return asyncCallback(err);

        async.asyncify(function() {
          return z.file(FILENAME_IN_ZIP).async('string');

        })(function(err, zipData) {
          if (err) return asyncCallback(err);

          packageData = JSON.parse(zipData);

          // 生成摘要
          summary = toolkit.jsonCopy(packageData);
          summary.scripts.forEach(function(d) {
            delete d.code; // 摘要中不含代码
          });

          // 摘要中不需要具体脚本、函数信息
          delete summary.scripts;
          delete summary.funcs;

          return asyncCallback();
        });
      });
    },
    // 导入数据/暂存数据
    function(asyncCallback) {
      if (checkOnly) {
        // 仅检查时，数据暂存Redis，不进行实际导入操作
        var cacheKey = toolkit.getCacheKey('stage', 'importScriptSet', ['confirmId', confirmId]);
        var packageDataTEXT = JSON.stringify(packageData);
        return res.locals.cacheDB.setex(cacheKey, CONFIG._FUNC_PKG_IMPORT_CONFIRM_TIMEOUT, packageDataTEXT, asyncCallback);

      } else {
        return scriptSetModel.import(packageData, asyncCallback);
      }
    },
    // 获取脚本集并计算差异（添加、替换）
    function(asyncCallback) {
      var opt = {
        fields: ['id', 'title'],
      };
      scriptSetModel.list(opt, function(err, dbRes) {
        if (err) return asyncCallback(err);

        if (toolkit.isNothing(summary) || toolkit.isNothing(summary.scriptSets)) {
          return asyncCallback();
        }

        var scriptSetMap = toolkit.arrayElementMap(dbRes, 'id');

        diff = {
          add    : [],
          replace: [],
        }
        summary.scriptSets.forEach(function(d) {
          var isExisted = !!scriptSetMap[d.id];

          if (isExisted) {
            diff.replace.push(d);
          } else {
            diff.add.push(d);
          }
        });

        return asyncCallback();
      });
    },
    // 发送更新脚本缓存任务（强制）
    function(asyncCallback) {
      var taskKwargs = { force: true };
      celery.putTask('DataFluxFunc.reloadScripts', null, taskKwargs, null, asyncCallback);
    },
  ], function(err) {
    if (err) return next(err);

    var checkResult = {
      confirmId : confirmId,
      summary   : summary,
      diff      : diff,
    };
    var ret = toolkit.initRet(checkResult);
    return res.locals.sendJSON(ret);
  });
};

exports.confirmImport = function(req, res, next) {
  var confirmId = req.body.confirmId;

  var packageData = null;

  var celery = celeryHelper.createHelper(res.locals.logger);

  var scriptSetModel = scriptSetMod.createModel(res.locals);

  async.series([
    // 从缓存中读取导入数据
    function(asyncCallback) {
      var cacheKey = toolkit.getCacheKey('stage', 'importScriptSet', ['confirmId', confirmId]);
      res.locals.cacheDB.get(cacheKey, function(err, cacheRes) {
        if (err) return asyncCallback(err);

        if (!cacheRes) {
          return asyncCallback(new E('EBizCondition.ConfirmingImportTimeout', 'Confirming import timeout.'));
        }

        packageData = JSON.parse(cacheRes);

        return asyncCallback();
      });
    },
    // 执行导入
    function(asyncCallback) {
      scriptSetModel.import(packageData, asyncCallback);
    },
    // 发送更新脚本缓存任务（强制）
    function(asyncCallback) {
      var taskKwargs = { force: true };
      celery.putTask('DataFluxFunc.reloadScripts', null, taskKwargs, null, asyncCallback);
    },
  ], function(err) {
    if (err) return next(err);

    var ret = toolkit.initRet();
    return res.locals.sendJSON(ret);
  });
};

