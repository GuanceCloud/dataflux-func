'use strict';

/* Builtin Modules */

/* 3rd-party Modules */
var async = require('async');

/* Project Modules */
var E           = require('../utils/serverError');
var CONFIG      = require('../utils/yamlResources').get('CONFIG');
var toolkit     = require('../utils/toolkit');
var modelHelper = require('../utils/modelHelper');

var funcMod          = require('../models/funcMod');
var crontabConfigMod = require('../models/crontabConfigMod');
var taskInfoMod      = require('../models/taskInfoMod');

/* Configure */
var GLOBAL_SCOPE = 'GLOBAL';

/* Handlers */
var crudHandler = exports.crudHandler = crontabConfigMod.createCRUDHandler();
exports.delete     = crudHandler.createDeleteHandler();
exports.deleteMany = crudHandler.createDeleteManyHandler();

exports.list = function(req, res, next) {
  var crontabConfigs        = null;
  var crontabConfigPageInfo = null;

  var crontabConfigModel = crontabConfigMod.createModel(res.locals);
  var taskInfoModel      = taskInfoMod.createModel(res.locals);

  async.series([
    function(asyncCallback) {
      var opt = res.locals.getQueryOptions();
      crontabConfigModel.list(opt, function(err, dbRes, pageInfo) {
        if (err) return asyncCallback(err);

        crontabConfigs        = dbRes;
        crontabConfigPageInfo = pageInfo;

        if (opt.extra && opt.extra.withTaskInfo) {
          return taskInfoModel.appendTaskInfo(crontabConfigs, asyncCallback);
        } else {
          return asyncCallback();
        }
      });
    },
  ], function(err) {
    if (err) return next(err);

    var ret = toolkit.initRet(crontabConfigs, crontabConfigPageInfo);
    res.locals.sendJSON(ret);
  });
};

exports.add = function(req, res, next) {
  var data = req.body.data;

  var origin   = 'UNKNOW';
  var originId = null;
  if (res.locals.user && res.locals.user.isSignedIn) {
    origin   = 'user';
    originId = res.locals.user.id;
  }

  _add(res.locals, data, origin, originId, function(err, addedId) {
    if (err) return next(err);

    var ret = toolkit.initRet({
      id: addedId,
    });
    return res.locals.sendJSON(ret);
  });
};

exports.modify = function(req, res, next) {
  var id   = req.params.id;
  var data = req.body.data;

  _modify(res.locals, id, data, null, function(err, modifiedId) {
    if (err) return next(err);

    var ret = toolkit.initRet({
      id: id,
    });
    return res.locals.sendJSON(ret);
  });
};

exports.addMany = function(req, res, next) {
  var data = req.body.data;

  var origin   = 'UNKNOW';
  var originId = null;
  if (res.locals.user && res.locals.user.isSignedIn) {
    origin   = 'user';
    originId = res.locals.user.id;
  }

  var addedIds = [];

  var transScope = modelHelper.createTransScope(res.locals.db);
  async.series([
    function(asyncCallback) {
      transScope.start(asyncCallback);
    },
    function(asyncCallback) {
      async.eachSeries(data, function(d, eachCallback) {
        _add(res.locals, d, origin, originId, function(err, addedId) {
          if (err) return eachCallback(err);

          addedIds.push(addedId);

          return eachCallback();
        });
      }, asyncCallback);
    },
  ], function(err) {
    transScope.end(err, function(scopeErr) {
      if (scopeErr) return next(scopeErr);

      var ret = toolkit.initRet({
        ids: addedIds,
      });
      return res.locals.sendJSON(ret);
    });
  });
};

exports.modifyMany = function(req, res, next) {
  var data = req.body.data;

  var modifiedIds = [];

  var crontabConfigModel = crontabConfigMod.createModel(res.locals);

  var transScope = modelHelper.createTransScope(res.locals.db);
  async.series([
    function(asyncCallback) {
      var opt = res.locals.getQueryOptions();
      opt.fields = ['cron.id'];

      if (toolkit.isNothing(opt.filters)) {
        return asyncCallback(new E('EBizCondition.DeleteConditionNotSpecified', 'At least one condition should been specified'));
      }

      crontabConfigModel.list(opt, function(err, dbRes) {
        if (err) return asyncCallback(err);

        modifiedIds = dbRes.reduce(function(acc, x) {
          acc.push(x.id);
          return acc;
        }, []);

        return asyncCallback();
      });
    },
    function(asyncCallback) {
      transScope.start(asyncCallback);
    },
    function(asyncCallback) {
      async.eachSeries(modifiedIds, function(id, eachCallback) {
        var opt = { funcCallKwargs: 'merge' };
        var _data = toolkit.jsonCopy(data);
        _modify(res.locals, id, _data, opt, eachCallback);
      }, asyncCallback);
    },
  ], function(err) {
    transScope.end(err, function(scopeErr) {
      if (scopeErr) return next(scopeErr);

      var ret = toolkit.initRet({
        ids: modifiedIds,
      });
      return res.locals.sendJSON(ret);
    });
  });
};

function _add(locals, data, origin, originId, callback) {
  data.origin   = origin;
  data.originId = originId;

  // 默认范围
  data.scope = data.scope || GLOBAL_SCOPE;

  var funcModel          = funcMod.createModel(locals);
  var crontabConfigModel = crontabConfigMod.createModel(locals);

  var addedId = null;

  async.series([
    // 检查函数
    function(asyncCallback) {
      funcModel.getWithCheck(data.funcId, ['func.seq'], function(err, dbRes) {
        if (err) return asyncCallback(err);

        // 存在固定Crontab时，跟随固定Crontab
        if (dbRes.extraConfigJSON && dbRes.extraConfigJSON.fixedCrontab) {
          data.crontab = null;
        }

        return asyncCallback();
      });
    },
    // 数据入库
    function(asyncCallback) {
      crontabConfigModel.add(data, function(err, _addedId) {
        if (err) return asyncCallback(err);

        addedId = _addedId;

        return asyncCallback();
      });
    },
  ], function(err) {
    if (err) return callback(err);
    return callback(null, addedId);
  });
};

function _modify(locals, id, data, opt, callback) {
  opt = opt || {};

  var funcModel          = funcMod.createModel(locals);
  var crontabConfigModel = crontabConfigMod.createModel(locals);

  var crontabConfig = null;
  var nextConfigMD5 = null;

  async.series([
    // 获取数据
    function(asyncCallback) {
      var fields = [
        'cron.seq',
        'cron.funcId',
        'cron.funcCallKwargsJSON',
        'cron.scope',
      ]
      crontabConfigModel.getWithCheck(id, fields, function(err, dbRes) {
        if (err) return asyncCallback(err);

        crontabConfig = dbRes;

        if (opt.funcCallKwargs === 'merge' && !toolkit.isNothing(data.funcCallKwargsJSON)) {
          // 合并funcCallKwargsJSON参数
          var prevFuncCallKwargs = toolkit.jsonCopy(crontabConfig.funcCallKwargsJSON);
          data.funcCallKwargsJSON = Object.assign(prevFuncCallKwargs, data.funcCallKwargsJSON);
        }

        return asyncCallback();
      });
    },
    // 检查函数
    function(asyncCallback) {
      if (toolkit.isNothing(data.funcId)) return asyncCallback();

      funcModel.getWithCheck(data.funcId, ['func.seq', 'func.extraConfigJSON'], function(err, dbRes) {
        if (err) return asyncCallback(err);

        // 存在固定Crontab时，跟随固定Crontab
        if (dbRes.extraConfigJSON && dbRes.extraConfigJSON.fixedCrontab) {
          data.crontab = null;
        }

        return asyncCallback();
      });
    },
    function(asyncCallback) {
      crontabConfigModel.modify(id, data, asyncCallback);
    },
  ], function(err) {
    if (err) return callback(err);
    return callback(null, id);
  });
};
