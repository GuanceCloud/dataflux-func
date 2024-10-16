'use strict';

/* Built-in Modules */

/* 3rd-party Modules */
var async = require('async');

/* Project Modules */
var E           = require('../utils/serverError');
var CONFIG      = require('../utils/yamlResources').get('CONFIG');
var toolkit     = require('../utils/toolkit');
var modelHelper = require('../utils/modelHelper');

var scriptSetMod            = require('../models/scriptSetMod');
var scriptMod               = require('../models/scriptMod');
var funcMod                 = require('../models/funcMod');
var scriptPublishHistoryMod = require('../models/scriptPublishHistoryMod');

var mainAPICtrl = require('./mainAPICtrl');

/* Init */

/* Handlers */
var crudHandler = exports.crudHandler = scriptMod.createCRUDHandler();

exports.get = crudHandler.createGetHandler();

exports.list = function(req, res, next) {
  var listData     = null;
  var listPageInfo = null;

  var scriptModel = scriptMod.createModel(res.locals);

  async.series([
    function(asyncCallback) {
      var opt = res.locals.getQueryOptions();

      scriptModel.list(opt, function(err, dbRes, pageInfo) {
        if (err) return asyncCallback(err);

        listData     = dbRes;
        listPageInfo = pageInfo;

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

  var scriptModel    = scriptMod.createModel(res.locals);
  var scriptSetModel = scriptSetMod.createModel(res.locals);

  async.series([
    // 检查 ID 重名
    function(asyncCallback) {
      var opt = {
        limit  : 1,
        fields : ['scpt.id'],
        filters: {
          'scpt.id': {eq: data.id},
        },
      };
      scriptModel.list(opt, function(err, dbRes) {
        if (err) return asyncCallback(err);

        if (dbRes.length > 0) {
          return asyncCallback(new E('EBizCondition.DuplicatedScriptID', 'ID of script already exists'));
        }

        return asyncCallback();
      });
    },
    // 检查脚本集锁定状态
    function(asyncCallback) {
      // 超级管理员不受限制
      if (res.locals.user.is('sa')) return asyncCallback();

      var scriptSetId = data.id.split('__')[0];
      scriptSetModel.getWithCheck(scriptSetId, ['lockedByUserId'], function(err, dbRes) {
        if (err) return asyncCallback(err);

        if (dbRes.lockedByUserId && dbRes.lockedByUserId !== res.locals.user.id) {
          return asyncCallback(new E('EBizCondition.AddingScriptNotAllowed', 'This Script Set is locked by other user'));
        }

        return asyncCallback();
      });
    },
    // 数据入库
    function(asyncCallback) {
      scriptModel.add(data, asyncCallback);
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

  var prevCodeDraftMD5 = req.body.prevCodeDraftMD5;

  var scriptModel    = scriptMod.createModel(res.locals);
  var scriptSetModel = scriptSetMod.createModel(res.locals);

  var codeDraftMD5 = null;
  async.series([
    // 检查脚本集锁定状态
    function(asyncCallback) {
      // 超级管理员不受限制
      if (res.locals.user.is('sa')) return asyncCallback();

      var scriptSetId = id.split('__')[0];
      scriptSetModel.getWithCheck(scriptSetId, ['lockedByUserId'], function(err, dbRes) {
        if (err) return asyncCallback(err);

        if (dbRes.lockedByUserId && dbRes.lockedByUserId !== res.locals.user.id) {
          return asyncCallback(new E('EBizCondition.ModifyingScriptNotAllowed', 'This Script Set is locked by other user'));
        }

        return asyncCallback();
      });
    },
    // 检查脚本锁定状态、检查代码 MD5 值
    function(asyncCallback) {
      scriptModel.getWithCheck(id, ['codeDraftMD5', 'lockedByUserId'], function(err, dbRes) {
        if (err) return asyncCallback(err);

        if (!res.locals.user.is('sa') // 超级管理员不受限制
            && dbRes.lockedByUserId && dbRes.lockedByUserId !== res.locals.user.id) {
          return asyncCallback(new E('EBizCondition.ModifyingScriptNotAllowed', 'This Script is locked by other user'));
        }

        if (prevCodeDraftMD5 && prevCodeDraftMD5 !== dbRes.codeDraftMD5) {
          return asyncCallback(new E('EBizRequestConflict.scriptDraftAlreadyChanged', 'Script draft already changed'));
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

      scriptModel.modify(id, data, function(err, _modifiedId, _modifiedData) {
        if (err) return asyncCallback(err);

        codeDraftMD5 = _modifiedData.codeDraftMD5 || null;

        return asyncCallback();
      });
    },
  ], function(err) {
    if (err) return next(err);

    var ret = toolkit.initRet({
      id          : id,
      codeDraftMD5: codeDraftMD5,
    });
    return res.locals.sendJSON(ret);
  });
};

exports.delete = function(req, res, next) {
  var id = req.params.id;

  var scriptModel    = scriptMod.createModel(res.locals);
  var scriptSetModel = scriptSetMod.createModel(res.locals);

  async.series([
    // 检查脚本集锁定状态
    function(asyncCallback) {
      // 超级管理员不受限制
      if (res.locals.user.is('sa')) return asyncCallback();

      var scriptSetId = id.split('__')[0];
      scriptSetModel.getWithCheck(scriptSetId, ['lockedByUserId'], function(err, dbRes) {
        if (err) return asyncCallback(err);

        if (dbRes.lockedByUserId && dbRes.lockedByUserId !== res.locals.user.id) {
          return asyncCallback(new E('EBizCondition.DeletingScriptNotAllowed', 'This Script Set is locked by other user'));
        }

        return asyncCallback();
      });
    },
    // 检查脚本锁定状态
    function(asyncCallback) {
      // 超级管理员不受限制
      if (res.locals.user.is('sa')) return asyncCallback();

      scriptModel.getWithCheck(id, ['lockedByUserId'], function(err, dbRes) {
        if (err) return asyncCallback(err);

        if (dbRes.lockedByUserId && dbRes.lockedByUserId !== res.locals.user.id) {
          return asyncCallback(new E('EBizCondition.DeletingScriptNotAllowed', 'This Script is locked by other user'));
        }

        return asyncCallback();
      });
    },
    // 数据入库
    function(asyncCallback) {
      scriptModel.delete(id, asyncCallback);
    },
  ], function(err) {
    if (err) return next(err);

    var ret = toolkit.initRet({
      id: id,
    });
    res.locals.sendJSON(ret);

    reloadDataMD5Cache(res.locals, id);
  });
};

exports.publish = function(req, res, next) {
  var id   = req.params.id;
  var data = req.body.data || {};

  var scriptModel               = scriptMod.createModel(res.locals);
  var scriptSetModel            = scriptSetMod.createModel(res.locals);
  var funcModel                 = funcMod.createModel(res.locals);
  var scriptPublishHistoryModel = scriptPublishHistoryMod.createModel(res.locals);

  var script    = null;
  var scriptSet = null;

  var nextScriptPublishVersion = null;
  var nextAPIFuncs             = [];

  var transScope = modelHelper.createTransScope(res.locals.db);
  async.series([
    // 获取并检查脚本锁定状态
    function(asyncCallback) {
      scriptModel.getWithCheck(id, null, function(err, dbRes) {
        if (err) return asyncCallback(err);

        if (!res.locals.user.is('sa') // 超级管理员不受限制
            && dbRes.lockedByUserId && dbRes.lockedByUserId !== res.locals.user.id) {
          return asyncCallback(new E('EBizCondition.PublishingScriptNotAllowed', 'This Script is locked by other user'));
        }

        script = dbRes;

        nextScriptPublishVersion = script.publishVersion + 1;

        return asyncCallback();
      });
    },
    // 获取并检查脚本集锁定状态
    function(asyncCallback) {
      scriptSetModel.getWithCheck(script.scriptSetId, null, function(err, dbRes) {
        if (err) return asyncCallback(err);

        if (!res.locals.user.is('sa') // 超级管理员不受限制
            && dbRes.lockedByUserId && dbRes.lockedByUserId !== res.locals.user.id) {
          return asyncCallback(new E('EBizCondition.PublishingScriptNotAllowed', 'This Script Set is locked by other user'));
        }

        scriptSet = dbRes;

        return asyncCallback();
      });
    },
    // 发送脚本代码预检查任务
    function(asyncCallback) {
      var opt = {
        scriptId: id,

        origin  : 'script',
        originId: id,
      }
      mainAPICtrl.callFuncDebugger(res.locals, opt, function(err, taskResp) {
        if (err) return asyncCallback(err);

        switch (taskResp.result.status) {
          case 'failure':
          case 'timeout':
            return asyncCallback(new E('EScriptPublishFailed', 'Script publishing failed. Please check your code', taskResp));
        }

        nextAPIFuncs = taskResp.result.apiFuncs;

        return asyncCallback();
      })
    },
    function(asyncCallback) {
      transScope.start(asyncCallback);
    },
    // 更新脚本
    function(asyncCallback) {
      var _data = {
        code          : script.codeDraft,
        publishVersion: nextScriptPublishVersion,
      }
      scriptModel.modify(id, _data, asyncCallback);
    },
    // 更新函数
    function(asyncCallback) {
      funcModel.update(script.id, nextAPIFuncs, asyncCallback);
    },
    // 创建发布版本历史
    function(asyncCallback) {
      var _data = {
        scriptId            : script.id,
        scriptPublishVersion: nextScriptPublishVersion,
        scriptCode_cache    : script.codeDraft, // 此时`codeDraft`已更新至`code`
        note                : data.note,
      };
      scriptPublishHistoryModel.add(_data, asyncCallback);
    },
  ], function(err) {
    transScope.end(err, function(scopeErr) {
      if (scopeErr) return next(scopeErr);

      // 响应
      var ret = toolkit.initRet({
        id            : id,
        publishVersion: nextScriptPublishVersion,
        apiFuncs      : nextAPIFuncs,
      });
      res.locals.sendJSON(ret);

      // 发布成功后
      // 1. 重新加载脚本代码 MD5 缓存
      // 2. 运行发布后自动运行的函数
      reloadDataMD5Cache(res.locals, id, function(err) {
        if (err) return;

        nextAPIFuncs.forEach(function(func) {
          if (func.integration !== 'autoRun') return;

          var onScriptPublish = false;
          try { onScriptPublish = onScriptPublish || func.extraConfig.integrationConfig.onScriptPublish } catch(err) { }
          try { onScriptPublish = onScriptPublish || func.extraConfig.integrationConfig.onPublish       } catch(err) { }

          if (!onScriptPublish) return;

          var funcId = `${id}.${func.name}`;
          var opt = {
            funcId         : funcId,
            origin         : 'integration',
            originId       : `autoRun.onScriptPublish-${funcId}`,
            taskRecordLimit: CONFIG._TASK_RECORD_FUNC_LIMIT_INTEGRATION,
            ignoreResult   : true,
          }
          mainAPICtrl.createFuncRunnerTaskReq(res.locals, opt, function(err, _taskReq) {
            if (_taskReq) return mainAPICtrl.callFuncRunner(res.locals, _taskReq);
          });
        });
      });
    });
  });
};

function reloadDataMD5Cache(locals, scriptId, callback) {
  var taskReq = {
    name  : 'Internal.ReloadDataMD5Cache',
    kwargs: { type: 'script', id: scriptId },
  }
  locals.cacheDB.putTask(taskReq, callback);
};

exports.reloadDataMD5Cache = reloadDataMD5Cache;
