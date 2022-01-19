'use strict';

/* Builtin Modules */

/* 3rd-party Modules */
var async  = require('async');
var JSZip  = require('jszip');
var moment = require('moment');

/* Project Modules */
var E           = require('../utils/serverError');
var CONFIG      = require('../utils/yamlResources').get('CONFIG');
var toolkit     = require('../utils/toolkit');
var modelHelper = require('../utils/modelHelper');

var funcMod          = require('../models/funcMod');
var crontabConfigMod = require('../models/crontabConfigMod');

/* Configure */
var GLOBAL_SCOPE = 'GLOBAL';

/* Handlers */
var crudHandler = exports.crudHandler = crontabConfigMod.createCRUDHandler();

exports.list = function(req, res, next) {
  var crontabConfigs        = null;
  var crontabConfigPageInfo = null;

  async.series([
    function(asyncCallback) {
      var crontabConfigModel = crontabConfigMod.createModel(res.locals);

      var opt = res.locals.getQueryOptions();
      crontabConfigModel.list(opt, function(err, dbRes, pageInfo) {
        if (err) return asyncCallback(err);

        crontabConfigs        = dbRes;
        crontabConfigPageInfo = pageInfo;

        return asyncCallback();
      });
    },
    // 查询任务信息数量/最后任务信息
    function(asyncCallback) {
      if (crontabConfigs.length <= 0) return asyncCallback();

      var opt = res.locals.getQueryOptions();
      if (!opt.extra.withTaskInfoCount) return asyncCallback();

      async.eachSeries(crontabConfigs, function(c, eachCallback) {
        var cacheKey = toolkit.getWorkerCacheKey('syncCache', 'taskInfo', [ 'originId', c.id ]);

        res.locals.cacheDB.llen(cacheKey, function(err, cacheRes) {
          if (err) return eachCallback(err);

          c.taskInfoCount = 0;
          if (cacheRes) {
            c.taskInfoCount = parseInt(cacheRes);
          }

          res.locals.cacheDB.lrange(cacheKey, 0, 0, function(err, cacheRes) {
            if (err) return eachCallback(err);

            c.lastRanTime = null;

            if (cacheRes.length <= 0) return eachCallback();

            JSZip.loadAsync(toolkit.fromBase64(cacheRes[0], true))
            .then(function(z) {
              return z.file('task-info.log').async('string');
            })
            .then(function(zipData) {
              var taskInfo = JSON.parse(zipData);
              if (taskInfo.startTimeMs) {
                c.lastRanTime = moment(taskInfo.startTimeMs).toISOString();
              }
              return eachCallback();
            })
            .catch(function(err) {
              // 解析失败不返回
              res.locals.logger.logError(err);
              return eachCallback();
            });
          });
        });
      }, asyncCallback);
    },
  ], function(err) {
    if (err) return next(err);

    var ret = toolkit.initRet(crontabConfigs, crontabConfigPageInfo);
    res.locals.sendJSON(ret);
  });
};

exports.add = function(req, res, next) {
  var data   = req.body.data;
  var origin = req.get('X-Dff-Origin') === 'DFF-UI' ? 'UI' : 'API';

  _add(res.locals, data, origin, function(err, addedId) {
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

exports.delete = function(req, res, next) {
  var id = req.params.id;

  _delete(res.locals, id, function(err, deletedId) {
    if (err) return next(err);

    var ret = toolkit.initRet({
      id: deletedId,
    });
    return res.locals.sendJSON(ret);
  });
};

exports.addMany = function(req, res, next) {
  var data   = req.body.data;
  var origin = req.get('X-Dff-Origin') === 'DFF-UI' ? 'UI' : 'API';

  var addedIds = [];

  var transScope = modelHelper.createTransScope(res.locals.db);
  async.series([
    function(asyncCallback) {
      transScope.start(asyncCallback);
    },
    function(asyncCallback) {
      async.eachSeries(data, function(d, eachCallback) {
        _add(res.locals, d, origin, function(err, addedId) {
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

exports.deleteMany = function(req, res, next) {
  var deleteIds = [];

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

        deleteIds = dbRes.reduce(function(acc, x) {
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
      async.eachSeries(deleteIds, function(id, eachCallback) {
        _delete(res.locals, id, eachCallback);
      }, asyncCallback);
    },
  ], function(err) {
    transScope.end(err, function(scopeErr) {
      if (scopeErr) return next(scopeErr);

      var ret = toolkit.initRet({
        ids: deleteIds,
      });
      return res.locals.sendJSON(ret);
    });
  });
};

function _add(locals, data, origin, callback) {
  // 自动记录操作界面
  data.origin = origin;

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

function _delete(locals, id, callback) {
  var crontabConfigModel = crontabConfigMod.createModel(locals);

  async.series([
    function(asyncCallback) {
      crontabConfigModel.getWithCheck(id, ['cron.seq'], asyncCallback);
    },
    function(asyncCallback) {
      crontabConfigModel.delete(id, asyncCallback);
    },
  ], function(err) {
    if (err) return callback(err);
    return callback(null, id);
  });
};
