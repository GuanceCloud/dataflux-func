'use strict';

/* Built-in Modules */

/* 3rd-party Modules */
var async = require('async');

/* Project Modules */
var E           = require('../utils/serverError');
var CONFIG      = require('../utils/yamlResources').get('CONFIG');
var toolkit     = require('../utils/toolkit');
var modelHelper = require('../utils/modelHelper');

var funcMod          = require('../models/funcMod');
var crontabConfigMod = require('../models/crontabConfigMod');

/* Init */
var GLOBAL_SCOPE = 'GLOBAL';

/* Handlers */
var crudHandler = exports.crudHandler = crontabConfigMod.createCRUDHandler();
exports.delete     = crudHandler.createDeleteHandler();
exports.deleteMany = crudHandler.createDeleteManyHandler();

exports.list = function(req, res, next) {
  var listData     = null;
  var listPageInfo = null;

  var crontabConfigModel = crontabConfigMod.createModel(res.locals);

  async.series([
    function(asyncCallback) {
      var opt = res.locals.getQueryOptions();

      crontabConfigModel.list(opt, function(err, dbRes, pageInfo) {
        if (err) return asyncCallback(err);

        listData     = dbRes;
        listPageInfo = pageInfo;

        return asyncCallback();
      });
    },
    // 追加任务触发记录
    function(asyncCallback) {
      var dataIds = toolkit.arrayElementValues(listData, 'id');
      var cacheKey = toolkit.getGlobalCacheKey('cache', 'recentTaskTriggered', [ 'origin', 'crontabConfig' ]);
      res.locals.cacheDB.hmget(cacheKey, dataIds, function(err, cacheRes) {
        if (err) return asyncCallback(err);

        listData.forEach(function(d) {
          d.recentTaskTriggered = null;

          var recentTaskTriggered = cacheRes[d.id];
          if (!recentTaskTriggered) return;

          d.recentTaskTriggered = JSON.parse(recentTaskTriggered);
        });

        return asyncCallback();
      });
    },
    // 追加最后任务状态
    function(asyncCallback) {
      var dataIds = toolkit.arrayElementValues(listData, 'id');
      var cacheKey = toolkit.getGlobalCacheKey('cache', 'lastTaskStatus', [ 'origin', 'crontabConfig' ]);
      res.locals.cacheDB.hmget(cacheKey, dataIds, function(err, cacheRes) {
        if (err) return asyncCallback(err);

        listData.forEach(function(d) {
          d.lastTaskStatus = null;

          var lastTaskStatus = cacheRes[d.id];
          if (!lastTaskStatus) return;

          d.lastTaskStatus = JSON.parse(lastTaskStatus);
        });

        return asyncCallback();
      });
    },
    // 追加临时 Crontab 配置
    function(asyncCallback) {
      var dataIds  = toolkit.arrayElementValues(listData, 'id');
      var cacheKey = toolkit.getGlobalCacheKey('tempConfig', 'crontabConfig');
      res.locals.cacheDB.hmget(cacheKey, dataIds, function(err, cacheRes) {
        if (err) return asyncCallback(err);

        var now = parseInt(Date.now() / 1000);
        listData.forEach(function(d) {
          d.tempCrontab = null;

          var tempConfig = cacheRes[d.id];
          if (!tempConfig) return;

          tempConfig = JSON.parse(tempConfig);
          if (tempConfig.expireTime && tempConfig.expireTime < now) return;

          d.tempCrontab = tempConfig.tempCrontab;
        });

        return asyncCallback();
      });
    },
  ], function(err) {
    if (err) return next(err);

    var ret = toolkit.initRet(listData, listPageInfo);
    res.locals.sendJSON(ret);
  });
}

exports.add = function(req, res, next) {
  var data = req.body.data;

  _add(res.locals, data, function(err, addedId) {
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

  var addedIds = [];

  var transScope = modelHelper.createTransScope(res.locals.db);
  async.series([
    function(asyncCallback) {
      transScope.start(asyncCallback);
    },
    function(asyncCallback) {
      async.eachSeries(data, function(d, eachCallback) {
        _add(res.locals, d, function(err, addedId) {
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

  var crontabConfigModel = crontabConfigMod.createModel(res.locals);

  var modifiedIds = [];

  var transScope = modelHelper.createTransScope(res.locals.db);
  async.series([
    function(asyncCallback) {
      var opt = res.locals.getQueryOptions();

      if (toolkit.isNothing(opt.filters)) {
        return asyncCallback(new E('EBizCondition.ModifyConditionNotSpecified', 'At least one condition should been specified'));
      }

      opt.fields = [ 'cron.id' ];
      opt.paging = false;

      crontabConfigModel.list(opt, function(err, dbRes) {
        if (err) return asyncCallback(err);

        modifiedIds = toolkit.arrayElementValues(dbRes, 'id');

        return asyncCallback();
      });
    },
    function(asyncCallback) {
      transScope.start(asyncCallback);
    },
    function(asyncCallback) {
      async.eachSeries(modifiedIds, function(id, eachCallback) {
        var _data = toolkit.jsonCopy(data);
        var opt = {
          funcCallKwargs: 'merge'
        };
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

function _add(locals, data, callback) {
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

        if (opt.funcCallKwargs === 'merge' && toolkit.notNothing(data.funcCallKwargsJSON)) {
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
