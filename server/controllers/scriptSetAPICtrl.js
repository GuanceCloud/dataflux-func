'use strict';

/* Builtin Modules */
var path = require('path');

/* 3rd-party Modules */
var fs      = require('fs-extra');
var async   = require('async');
var request = require('request');
var moment  = require('moment');
var JSZip   = require('jszip');
var yaml    = require('js-yaml');

/* Project Modules */
var E            = require('../utils/serverError');
var CONFIG       = require('../utils/yamlResources').get('CONFIG');
var ROUTE        = require('../utils/yamlResources').get('ROUTE');
var toolkit      = require('../utils/toolkit');
var modelHelper  = require('../utils/modelHelper');
var celeryHelper = require('../utils/extraHelpers/celeryHelper');

var scriptMarketAPICtrl = require('../controllers/scriptMarketAPICtrl');

var scriptSetMod          = require('../models/scriptSetMod');
var scriptMod             = require('../models/scriptMod');
var scriptRecoverPointMod = require('../models/scriptRecoverPointMod');

/* Configure */
var SCRIPT_TYPE_EXT_MAP = {
  python  : 'py',
  markdown: 'md',
};

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

  var scriptSetModel = scriptSetMod.createModel(res.locals);
  scriptSetModel.getExportData(opt, function(err, exportData, summary) {
    if (err) return next(err);

    // 生成 zip 包
    var zip = new JSZip();

    // 导出脚本集 / 脚本
    exportData.scriptSets.forEach(function(scriptSet) {
      var scriptSetDir = path.join(CONFIG.SCRIPT_MARKET_SCRIPT_SET_DIR, scriptSet.id);

      // 生成 META 内容
      var metaData = {
        scriptSet: toolkit.jsonCopy(scriptSet),
      };

      // 写入脚本文件
      metaData.scriptSet.scripts.forEach(function(script) {
        var filePath = path.join(scriptSetDir, scriptMarketAPICtrl._getScriptFilename(script));
        zip.file(filePath, script.code || '');

        // 去除 META 中代码
        delete script.code;
      });

      // 写入 META 信息
      var metaFilePath = path.join(scriptSetDir, CONFIG.SCRIPT_MARKET_META_FILE);
      var metaFileText = yaml.dump(metaData);
      zip.file(metaFilePath, metaFileText);
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
      zip.file(filePath, fileData);
    });

    // 压缩配置
    var zipOpt = {
      type              : 'nodebuffer',
      compression       : 'DEFLATE',
      compressionOptions: { level: 6 },
    }
    zip.generateAsync(zipOpt).then(function(fileBuf) {
      // 文件名为固定开头+时间
      var fileNameParts = [
        CONFIG._FUNC_EXPORT_FILENAME,
        moment().utcOffset('+08:00').format('YYYYMMDD_HHmmss'),
      ];
      var fileName = fileNameParts.join('-') + '.zip';

      // 下载文件
      return res.locals.sendFile(fileBuf, fileName);
    });
  });
};

exports.import = function(req, res, next) {
  var file      = req.files ? req.files[0] : null;
  var checkOnly = toolkit.toBoolean(req.body.checkOnly);

  var scriptSetModel = scriptSetMod.createModel(res.locals);

  var requirements = null;
  var confirmId    = toolkit.genDataId('import');
  var diff         = null;

  var scriptMap  = {};
  var importData = {};

  var zip = new JSZip();
  var allFilePaths = null;

  async.series([
    // 加载 zip 文件
    function(asyncCallback) {
      var fileBuf = fs.readFileSync(file.path);

      zip
      .loadAsync(fileBuf)
      .then(function(zip) {
        allFilePaths = Object.keys(zip.files);
        return asyncCallback()
      })
      .catch(function(err) {
        return asyncCallback(new E('EBizCondition.InvalidImportFile', 'Invalid import file', null, err));
      });
    },
    // 加载脚本集 META
    function(asyncCallback) {
      var filePaths = allFilePaths.filter(function(p) {
        return toolkit.endsWith(p, '/META');
      });

      async.eachSeries(filePaths, function(p, eachCallback) {
        zip.file(p).async('string')
        .then(function(data) {
          if (!importData.scriptSets) importData.scriptSets = [];

          var scriptSet = yaml.load(data).scriptSet;

          importData.scriptSets.push(scriptSet);

          if (scriptSet.scripts) {
            scriptSet.scripts.forEach(function(script) {
              scriptMap[script.id] = script;
            });
          }

          return eachCallback();
        })
        .catch(function(err) {
          return eachCallback(err);
        })
      }, asyncCallback);
    },
    // 加载代码文件
    function(asyncCallback) {
      var filePaths = allFilePaths.filter(function(p) {
        return toolkit.endsWith(p, '.py');
      });

      async.eachSeries(filePaths, function(p, eachCallback) {
        zip.file(p).async('string')
        .then(function(data) {
          var scriptId = p.split('/').slice(-2).join('__').replace(/\.py$/g, '');
          var script = scriptMap[scriptId];

          if (!script) return eachCallback();

          script.code = data;

          return eachCallback();
        })
        .catch(function(err) {
          return eachCallback(err);
        })
      }, asyncCallback);
    },
    // 加载其他资源
    function(asyncCallback) {
      var resourceNames = [
        'connectors',
        'envVariables',
        'authLinks',
        'crontabConfigs',
        'batches',
      ];
      async.eachSeries(resourceNames, function(name, eachCallback) {
        var p = `${name}.yaml`;

        if (allFilePaths.indexOf(p) < 0) return eachCallback();

        zip.file(p).async('string')
        .then(function(data) {
          importData[name] = yaml.load(data);
          return eachCallback();
        })
        .catch(function(err) {
          return eachCallback(err);
        })
      }, asyncCallback);
    },
    // 导入数据/暂存数据
    function(asyncCallback) {
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
    // 获取脚本集并计算差异（添加、替换）
    function(asyncCallback) {
      var opt = {
        fields: ['sset.id', 'sset.title'],
      };
      scriptSetModel.list(opt, function(err, dbRes) {
        if (err) return asyncCallback(err);

        var currentScriptSetMap = toolkit.arrayElementMap(dbRes, 'id');

        diff = {
          add    : [],
          replace: [],
        }
        importData.scriptSets.forEach(function(d) {
          var isExisted = !!currentScriptSetMap[d.id];
          var diffInfo = {
            id   : d.id,
            title: d.title,
          }
          if (isExisted) {
            diff.replace.push(diffInfo);
          } else {
            diff.add.push(diffInfo);
          }
        });

        return asyncCallback();
      });
    },
  ], function(err) {
    if (err) return next(err);

    var ret = toolkit.initRet({
      requirements: requirements,
      confirmId   : confirmId,
      diff        : diff,
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
        // 存在确认导入的，只有「导入脚本包」操作
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