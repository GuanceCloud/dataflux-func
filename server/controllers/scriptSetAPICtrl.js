'use strict';

/* Builtin Modules */

/* 3rd-party Modules */
var fs      = require('fs-extra');
var async   = require('async');
var request = require('request');
var moment  = require('moment');
var JSZip   = require('jszip');

/* Project Modules */
var E            = require('../utils/serverError');
var CONFIG       = require('../utils/yamlResources').get('CONFIG');
var toolkit      = require('../utils/toolkit');
var modelHelper  = require('../utils/modelHelper');
var celeryHelper = require('../utils/extraHelpers/celeryHelper');

var scriptSetMod          = require('../models/scriptSetMod');
var scriptRecoverPointMod = require('../models/scriptRecoverPointMod');

/* Configure */
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

    // 内置标记
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
  var opt = req.body;

  var scriptSetModel = scriptSetMod.createModel(res.locals);
  scriptSetModel.export(opt, function(err, fileBuf) {
    if (err) return next(err);

    // 文件名为固定开头+时间
    var fileNameParts = [
      CONFIG._FUNC_PKG_EXPORT_FILENAME,
      moment().utcOffset('+08:00').format('YYYYMMDD_HHmmss'),
    ];
    var fileName = fileNameParts.join('-') + CONFIG._FUNC_PKG_EXPORT_EXT;

    return res.locals.sendFile(fileBuf, fileName);
  });
};

exports.import = function(req, res, next) {
  var file                 = req.files ? req.files[0] : null;
  var packageInstallURL    = req.body.packageInstallURL;
  var packageInstallId     = req.body.packageInstallId;
  var scriptRecoverPointId = req.body.scriptRecoverPointId;
  var password             = req.body.password || '';
  var checkOnly            = toolkit.toBoolean(req.body.checkOnly);

  var celery = celeryHelper.createHelper(res.locals.logger);

  var scriptSetModel = scriptSetMod.createModel(res.locals);

  var fileBuf     = null;
  var packageData = null;
  var pkgs        = null;

  var confirmId = toolkit.genDataId('import');
  var summary   = null;
  var diff      = null;

  var recoverPoint = null;
  // 预处理
  if (file) {
    // 从文件导入
    recoverPoint = {
      type: 'import',
      note: '系统：导入脚本包前自动创建的还原点',
    };

  } else if (packageInstallURL) {
    // 从远端安装
    // 脚本包安装不支持checkOnly操作
    checkOnly = false;
    recoverPoint = {
      type: 'install',
      note: '系统：安装脚本包前自动创建的还原点',
    };

  } else if (scriptRecoverPointId) {
    // 从还原点还原
    // 还原脚本库不支持checkOnly操作
    checkOnly = false;
    recoverPoint = {
      type: 'recover',
      note: '系统：还原脚本库至还原点',
    };

  } else {
    return next(new E('EBizCondition.PackageNotProvided', 'Import source not specified'));
  }

  var fileBuf = null;
  async.series([
    // 获取包数据
    function(asyncCallback) {
      if (file) {
        // 来自上传文件
        fileBuf = fs.readFileSync(file.path).toString();
        fs.removeSync(file.path);

        // 补充还原信息
        recoverPoint.note += toolkit.strf(' (文件名: {0})', file.originalname);

        return asyncCallback();

      } else if (packageInstallURL) {
        // 来自远端下载
        var requestOptions = {
          method : 'get',
          url    : packageInstallURL,
          timeout: 3 * 1000,
        };
        request(requestOptions, function(err, _res, _body) {
          if (err) return asyncCallback(err);

          fileBuf = _body;

          // 补充还原信息
          if (packageInstallId) {
            recoverPoint.note += toolkit.strf(' (ID: {0})', packageInstallId);
          }

          return asyncCallback();
        });

      } else if (scriptRecoverPointId) {
        // 来自脚本还原点
        var scriptRecoverPointModel = scriptRecoverPointMod.createModel(res.locals);
        scriptRecoverPointModel.getWithCheck(scriptRecoverPointId, ['seq', 'exportData'], function(err, dbRes) {
          if (err) return asyncCallback(err);

          if (toolkit.isNothing(dbRes.exportData)) {
            return asyncCallback(new E('EClientUnsupported', 'Importing from such recover point not supported'));
          }

          fileBuf = dbRes.exportData;

          // 补充还原信息
          recoverPoint.note += toolkit.strf(' (# {0})', dbRes.seq);

          return asyncCallback();
        });

      } else {
        return asyncCallback(new E('EClientBadRequest', 'Importing data not found'));
      }
    },
    // AES解密、JWT验签
    function(asyncCallback) {
      // AES解密
      try {
        fileBuf = toolkit.decipherByAES(fileBuf, password);
        res.locals.logger.debug(toolkit.strf('File Data: {0}...{1}, MD5: {2}',
            fileBuf.slice(0, 20), fileBuf.slice(-20), toolkit.getMD5(fileBuf)));

      } catch(err) {
        res.locals.logger.logError(err);
        return asyncCallback(new E('EBizCondition.InvalidPassword', 'Invalid password'));
      }

      return asyncCallback();
    },
    // zip解压
    function(asyncCallback) {
      var zipBuf = toolkit.fromBase64(fileBuf, true);

      JSZip.loadAsync(zipBuf)
      .then(function(z) {
        return z.file(scriptSetMod.FILENAME_IN_ZIP).async('string');
      })
      .then(function(zipData) {
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
      })
      .catch(function(err) {
        res.locals.logger.logError(err);
        return asyncCallback(new E('EBizCondition.InvalidPassword', 'Invalid password'));
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
        // 直接导入
        return scriptSetModel.import(packageData, recoverPoint, function(err, _pkgs) {
          if (err) return asyncCallback(err);

          pkgs = _pkgs;

          reloadDataMD5Cache(celery, asyncCallback);
        });
      }
    },
    // 获取脚本集并计算差异（添加、替换）
    function(asyncCallback) {
      var opt = {
        fields: ['sset.id', 'sset.title'],
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
  ], function(err) {
    if (err) return next(err);

    var ret = toolkit.initRet({
      confirmId : confirmId,
      summary   : summary,
      diff      : diff,
      pkgs      : pkgs,
    });
    return res.locals.sendJSON(ret);
  });
};

exports.confirmImport = function(req, res, next) {
  var confirmId = req.body.confirmId;

  var packageData = null;
  var pkgs = null;

  var celery = celeryHelper.createHelper(res.locals.logger);

  var scriptSetModel = scriptSetMod.createModel(res.locals);

  async.series([
    // 从缓存中读取导入数据
    function(asyncCallback) {
      var cacheKey = toolkit.getCacheKey('stage', 'importScriptSet', ['confirmId', confirmId]);
      res.locals.cacheDB.get(cacheKey, function(err, cacheRes) {
        if (err) return asyncCallback(err);

        if (!cacheRes) {
          return asyncCallback(new E('EBizCondition.ConfirmingImportTimeout', 'Confirming import timeout'));
        }

        packageData = JSON.parse(cacheRes);

        return asyncCallback();
      });
    },
    // 执行导入
    function(asyncCallback) {
      var recoverPoint = {
        // 存在确认导入的，只有「导入脚本包」操作
        type: 'import',
        note: '系统：导入脚本包前自动创建的还原点',
      };
      scriptSetModel.import(packageData, recoverPoint, function(err, _pkgs) {
        if (err) return asyncCallback(err);

        pkgs = _pkgs;

        reloadDataMD5Cache(celery, asyncCallback);
      });
    },
  ], function(err) {
    if (err) return next(err);

    var ret = toolkit.initRet({
      pkgs: pkgs,
    });
    return res.locals.sendJSON(ret);
  });
};

function reloadDataMD5Cache(celery, callback) {
  var taskKwargs = { all: true };
  celery.putTask('Main.ReloadDataMD5Cache', null, taskKwargs, null, null, callback);
};