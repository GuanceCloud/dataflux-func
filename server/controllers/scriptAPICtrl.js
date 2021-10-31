'use strict';

/* Builtin Modules */

/* 3rd-party Modules */
var async = require('async');

/* Project Modules */
var E            = require('../utils/serverError');
var CONFIG       = require('../utils/yamlResources').get('CONFIG');
var toolkit      = require('../utils/toolkit');
var modelHelper  = require('../utils/modelHelper');
var celeryHelper = require('../utils/extraHelpers/celeryHelper');

var scriptMod               = require('../models/scriptMod');
var scriptSetMod            = require('../models/scriptSetMod');
var funcMod                 = require('../models/funcMod');
var scriptRecoverPointMod   = require('../models/scriptRecoverPointMod');
var scriptPublishHistoryMod = require('../models/scriptPublishHistoryMod');

/* Configure */

/* Handlers */
var crudHandler = exports.crudHandler = scriptMod.createCRUDHandler();

exports.list = crudHandler.createListHandler();
exports.get  = crudHandler.createGetHandler(null, {beforeResp: hideOfficialCode});

exports.add = function(req, res, next) {
  var data = req.body.data;

  var scriptModel    = scriptMod.createModel(res.locals);
  var scriptSetModel = scriptSetMod.createModel(res.locals);

  async.series([
    // 检查ID重名
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
      var scriptSetId = data.id.split('__')[0];
      scriptSetModel.getWithCheck(scriptSetId, ['lockedByUserId'], function(err, dbRes) {
        if (err) return asyncCallback(err);

        if (dbRes.lockedByUserId && dbRes.lockedByUserId !== res.locals.user.id) {
          return asyncCallback(new E('EBizCondition.AddingScriptNotAllowed', 'This script set is locked by other user'));
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

  var script = null;

  var codeDraftMD5 = null;
  async.series([
    // 检查脚本集锁定状态
    function(asyncCallback) {
      var scriptSetId = id.split('__')[0];
      scriptSetModel.getWithCheck(scriptSetId, ['lockedByUserId'], function(err, dbRes) {
        if (err) return asyncCallback(err);

        if (dbRes.lockedByUserId && dbRes.lockedByUserId !== res.locals.user.id) {
          return asyncCallback(new E('EBizCondition.ModifyingScriptNotAllowed', 'This script set is locked by other user'));
        }

        return asyncCallback();
      });
    },
    // 获取脚本，检查脚本锁定状态、检查代码MD5值
    function(asyncCallback) {
      scriptModel.getWithCheck(id, ['codeDraftMD5', 'lockedByUserId'], function(err, dbRes) {
        if (err) return asyncCallback(err);

        if (dbRes.lockedByUserId && dbRes.lockedByUserId !== res.locals.user.id) {
          return asyncCallback(new E('EBizCondition.ModifyingScriptNotAllowed', 'This script is locked by other user'));
        }

        if (prevCodeDraftMD5 && prevCodeDraftMD5 !== dbRes.codeDraftMD5) {
          return asyncCallback(new E('EBizRequestConflict.scriptDraftAlreadyChanged', 'Script draft already changed'));
        }

        script = dbRes;

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

  var script = null;

  async.series([
    // 检查脚本集锁定状态
    function(asyncCallback) {
      var scriptSetId = id.split('__')[0];
      scriptSetModel.getWithCheck(scriptSetId, ['lockedByUserId'], function(err, dbRes) {
        if (err) return asyncCallback(err);

        if (dbRes.lockedByUserId && dbRes.lockedByUserId !== res.locals.user.id) {
          return asyncCallback(new E('EBizCondition.DeletingScriptNotAllowed', 'This script set is locked by other user'));
        }

        return asyncCallback();
      });
    },
    // 获取脚本，检查脚本锁定状态
    function(asyncCallback) {
      scriptModel.getWithCheck(id, ['lockedByUserId'], function(err, dbRes) {
        if (err) return asyncCallback(err);

        if (dbRes.lockedByUserId && dbRes.lockedByUserId !== res.locals.user.id) {
          return asyncCallback(new E('EBizCondition.DeletingScriptNotAllowed', 'This script is locked by other user'));
        }

        script = dbRes;

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
    return res.locals.sendJSON(ret);
  });
};

exports.publish = function(req, res, next) {
  var id   = req.params.id;
  var data = req.body.data || {};

  var force = req.body.force; // 强制发布
  var wait  = req.body.wait;  // 等待发布结束

  var celery = celeryHelper.createHelper(res.locals.logger);

  var scriptModel               = scriptMod.createModel(res.locals);
  var scriptSetModel            = scriptSetMod.createModel(res.locals);
  var funcModel                 = funcMod.createModel(res.locals);
  var scriptRecoverPointModel   = scriptRecoverPointMod.createModel(res.locals);
  var scriptPublishHistoryModel = scriptPublishHistoryMod.createModel(res.locals);

  var script    = null;
  var scriptSet = null;

  var nextScriptPublishVersion = null;
  var nextExportedAPIFuncs     = null;

  var transScope = modelHelper.createTransScope(res.locals.db);
  async.series([
    // 获取脚本
    function(asyncCallback) {
      scriptModel.getWithCheck(id, null, function(err, dbRes) {
        if (err) return asyncCallback(err);

        // 没有修改的脚本不允许发布
        if (!force && (dbRes.codeMD5 === dbRes.codeDraftMD5 || dbRes.code === dbRes.codeDraft)) {
          return asyncCallback(new E('EBizCondition.ScriptNotEdited', 'Script not edited'))
        }

        script = dbRes;

        nextScriptPublishVersion = script.publishVersion + 1;

        return asyncCallback();
      });
    },
    // 获取并检查脚本集
    function(asyncCallback) {
      scriptSetModel.getWithCheck(script.scriptSetId, null, function(err, dbRes) {
        if (err) return asyncCallback(err);

        scriptSet = dbRes;

        return asyncCallback();
      });
    },
    // 发送脚本代码预检查任务
    function(asyncCallback) {
      var kwargs = {
        funcId: script.id,
      }
      var taskOptions = {
        queue            : CONFIG._FUNC_TASK_DEFAULT_DEBUG_QUEUE,
        resultWaitTimeout: CONFIG._FUNC_TASK_DEBUG_TIMEOUT * 1000,
      }
      celery.putTask('Main.FuncDebugger', null, kwargs, taskOptions, null, function(err, celeryRes, extraInfo) {
        if (err) return asyncCallback(err);

        celeryRes = celeryRes || {};
        extraInfo = extraInfo || {};

        if (celeryRes.status === 'FAILURE') {
          if (celeryRes.einfoTEXT.indexOf('billiard.exceptions.SoftTimeLimitExceeded') >= 0) {
            // 超时错误
            return callback(new E('EFuncTimeout', 'Code pre-check failed. Script does not finish in a reasonable time, please check your code', {
              id       : celeryRes.id,
              etype    : celeryRes.result && celeryRes.result.exc_type,
              einfoTEXT: celeryRes.einfoTEXT,
            }));

          } else {
            // 其他错误
            return asyncCallback(new E('EFuncFailed', 'Code pre-check failed. Script raised an EXCEPTION during executing, please check your code with the detailed information', {
              id       : celeryRes.id,
              etype    : celeryRes.result && celeryRes.result.exc_type,
              einfoTEXT: celeryRes.einfoTEXT,
            }));
          }

        } else if (extraInfo.status === 'TIMEOUT') {
          return asyncCallback(new E('EFuncTimeout', 'Code pre-check failed. Script TIMEOUT during executing, please check your code', {
            id   : extraInfo.id,
            etype: celeryRes.result && celeryRes.result.exc_type,
          }));

        } else if (celeryRes.retval.einfoTEXT) {
          return asyncCallback(new E('EScriptPreCheck', 'Code pre-check failed. Script raised an EXCEPTION during executing, please check your code', {
            id       : extraInfo.id,
            etype    : celeryRes.result && celeryRes.result.exc_type,
            einfoTEXT: celeryRes.retval.einfoTEXT,
            traceInfo: celeryRes.retval.traceInfo,
          }));
        }

        try {
          nextExportedAPIFuncs = celeryRes.retval.result.exportedAPIFuncs
        } catch(_) {
          // Nope
        } finally {
          // 保证一定为数组
          if (toolkit.isNothing(nextExportedAPIFuncs)) {
            nextExportedAPIFuncs = [];
          }
        }

        // 检查重名函数
        var funcNameMap = {};
        for (var i = 0; i < nextExportedAPIFuncs.length; i++) {
          var name = nextExportedAPIFuncs[i].name;

          if (!funcNameMap[name]) {
            funcNameMap[name] = true;
          } else {
            return asyncCallback(new E('EClientDuplicated', 'Found duplicated func names in script', {
              funcName: name,
            }));
          }
        }

        return asyncCallback();
      });
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
      funcModel.update(script.id, nextExportedAPIFuncs, asyncCallback);
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

      function doResponse() {
        var ret = toolkit.initRet({
          id              : id,
          publishVersion  : nextScriptPublishVersion,
          exportedAPIFuncs: nextExportedAPIFuncs,
        });
        res.locals.sendJSON(ret);
      }

      if (!wait) doResponse(); // 不等待发布结束

      // 发布成功后
      // 1. 重新加载脚本
      // 2. 运行发布后自动运行的函数
      celery.putTask('Main.ReloadScripts', null, null, null, null, function(err) {
        if (wait) doResponse(); // 等待发布结束
        if (err) return;

        nextExportedAPIFuncs.forEach(function(func) {
          if (func.integration !== 'autoRun') return;

          try {
            if (!func.extraConfig.integrationConfig.onPublish) return;
          } catch(err) {
            return;
          }

          var funcId = toolkit.strf('{0}.{1}', id, func.name);
          var kwargs = {
            funcId  : funcId,
            origin  : 'integration',
            execMode: 'sync',
            queue   : CONFIG._FUNC_TASK_DEFAULT_QUEUE,
          }
          var taskOptions = {
            queue: CONFIG._FUNC_TASK_DEFAULT_QUEUE,
          }
          celery.putTask('Main.FuncRunner', null, kwargs, taskOptions);
        });
      });
    });
  });
};

function getCodeSummary(code) {
  var lines = code.split('\n');

  var prevStat = null;
  var stat     = null;

  var summaryLines = [];

  var PATTERNS = {
    comment    : /^# /g,
    dffAPIStart: /^@DFF\.API\(/g,
    dffAPIEnd  : /\)$\s*/g,
    defStart   : /^def [a-zA-Z][a-zA-Z0-9_]+\(/g,
    defEnd     : /\)\:\s*/g,
    docStart   : /^\s{4}(\'\'\'|\"\"\")/g,
    docEnd     : /(\'\'\'|\"\"\")\s*$/g,
  };

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];

    prevStat = stat;
    if (line.match(PATTERNS.comment)) {
      stat = 'comment';

    } else if (line.match(PATTERNS.dffAPIStart) && line.match(PATTERNS.dffAPIEnd)) {
      stat = 'dffAPI';
    } else if (line.match(PATTERNS.dffAPIStart) && ['dffAPIStart', 'dffAPIContent'].indexOf(prevStat) < 0) {
      stat = 'dffAPIStart';
    } else if (line.match(PATTERNS.dffAPIEnd) && ['dffAPIStart', 'dffAPIContent'].indexOf(prevStat) >= 0) {
      stat = 'dffAPIEnd';

    } else if (line.match(PATTERNS.defStart) && line.match(PATTERNS.defEnd)) {
      stat = 'def';
    } else if (line.match(PATTERNS.defStart) && ['defStart', 'defContent'].indexOf(prevStat) < 0) {
      stat = 'defStart';
    } else if (line.match(PATTERNS.defEnd) && ['defStart', 'defContent'].indexOf(prevStat) >= 0) {
      stat = 'defEnd';

    } else if (line.match(PATTERNS.docStart) && line.match(PATTERNS.docEnd) && line.trim().length > 3) {
      stat = 'doc';
    } else if (line.match(PATTERNS.docStart) && ['def', 'defEnd'].indexOf(prevStat) >= 0) {
      stat = 'docStart';
    } else if (line.match(PATTERNS.docEnd) && ['docStart', 'docContent'].indexOf(prevStat) >= 0) {
      stat = 'docEnd';

    } else {
      if (['dffAPIStart', 'dffAPIContent'].indexOf(prevStat) >= 0) {
        stat = 'dffAPIContent';
      } else if (['defStart', 'defContent'].indexOf(prevStat) >= 0) {
        stat = 'defContent';
      } else if (['docStart', 'docContent'].indexOf(prevStat) >= 0) {
        stat = 'docContent';
      } else {
        stat = 'CODE';
      }
    }

    var label = `[${i}][${stat}]`;
    label += ' '.repeat(20 - label.length);

    if (stat !== 'CODE') {
      var addBlankLine = false;
      if (stat === 'dffAPI' || stat === 'dffAPIStart') {
        addBlankLine = true;
      } else if ((stat === 'def' || stat === 'defStart') && (prevStat !== 'dffAPI' && prevStat !== 'dffAPIEnd')) {
        addBlankLine = true;
      }

      if (addBlankLine) {
        summaryLines.push('');
      }

      summaryLines.push(line);
    }
  }

  var summary = summaryLines.join('\n').trim();

  return summary;
};

function hideOfficialCode(req, res, ret, hookExtra, callback) {
  if (!ret.data) return callback(null, ret);
  if (!ret.data.code && !ret.data.codeDraft) return callback(null, ret);

  var scriptSetModel = scriptSetMod.createModel(res.locals);
  scriptSetModel.getWithCheck(ret.data.scriptSetId, null, function(err, dbRes) {
    if (err) return callback(err);

    if (dbRes.type === 'official') {
      var codeSummary = getCodeSummary(ret.data.code || ret.data.codeDraft);

      if (ret.data.code)      ret.data.code      = codeSummary;
      if (ret.data.codeDraft) ret.data.codeDraft = codeSummary;
    }

    return callback(null, ret);
  });
};
