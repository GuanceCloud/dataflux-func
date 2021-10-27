'use strict';

/* Builtin Modules */

/* 3rd-party Modules */
var async = require('async');

/* Project Modules */
var E           = require('../utils/serverError');
var CONFIG      = require('../utils/yamlResources').get('CONFIG');
var toolkit     = require('../utils/toolkit');
var modelHelper = require('../utils/modelHelper');

var funcMod            = require('../models/funcMod');
var crontabConfigMod   = require('../models/crontabConfigMod');
var crontabTaskInfoMod = require('../models/crontabTaskInfoMod');

/* Configure */
var GLOBAL_SCOPE = 'GLOBAL';

/* Handlers */
var crudHandler = exports.crudHandler = crontabConfigMod.createCRUDHandler();

exports.list = function(req, res, next) {
  var crontabConfigs        = null;
  var crontabConfigPageInfo = null;

  var crontabConfigModel = crontabConfigMod.createModel(res.locals);

  async.series([
    function(asyncCallback) {
      var opt = res.locals.getQueryOptions();

      crontabConfigModel.list(opt, function(err, dbRes, pageInfo) {
        if (err) return asyncCallback(err);

        crontabConfigs        = dbRes;
        crontabConfigPageInfo = pageInfo;

        return asyncCallback();
      });
    },
    // 查询任务信息数量
    function(asyncCallback) {
      if (crontabConfigs.length <= 0) return asyncCallback();

      var opt = res.locals.getQueryOptions();
      if (!opt.extra.withTaskInfoCount) return asyncCallback();

      var crontabTaskInfoModel = crontabTaskInfoMod.createModel(res.locals);

      var ids = toolkit.arrayElementValues(crontabConfigs, 'id');
      crontabTaskInfoModel.countByCrontabConfigId(ids, function(err, dbRes) {
        if (err) return asyncCallback(err);

        var _map = toolkit.arrayElementMap(dbRes, 'crontabConfigId');
        crontabConfigs.forEach(function(d) {
          if (!_map[d.id]) {
            d.taskInfoCount = 0;
          } else {
            d.taskInfoCount = _map[d.id].count || 0;
          }
        });

        return asyncCallback();
      });
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
