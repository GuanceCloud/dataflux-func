'use strict';

/* Builtin Modules */

/* 3rd-party Modules */
var async = require('async');

/* Project Modules */
var E       = require('../utils/serverError');
var CONFIG  = require('../utils/yamlResources').get('CONFIG');
var toolkit = require('../utils/toolkit');
var urlFor  = require('../utils/routeLoader').urlFor;

var funcMod          = require('../models/funcMod');
var batchMod         = require('../models/batchMod');
var batchTaskInfoMod = require('../models/batchTaskInfoMod');

/* Configure */

/* Handlers */
var crudHandler = exports.crudHandler = batchMod.createCRUDHandler();

exports.delete = crudHandler.createDeleteHandler();

exports.list = function(req, res, next) {
  var batches       = null;
  var batchPageInfo = null;

  var batchModel = batchMod.createModel(res.locals);

  async.series([
    function(asyncCallback) {
      var opt = res.locals.getQueryOptions();

      batchModel.list(opt, function(err, dbRes, pageInfo) {
        if (err) return asyncCallback(err);

        batches       = dbRes;
        batchPageInfo = pageInfo;

        return asyncCallback();
      });
    },
    // 查询任务信息数量
    function(asyncCallback) {
      if (batches.length <= 0) return asyncCallback();

      var opt = res.locals.getQueryOptions();
      if (!opt.extra.withTaskInfoCount) return asyncCallback();

      var batchTaskInfoModel = batchTaskInfoMod.createModel(res.locals);

      var ids = toolkit.arrayElementValues(batches, 'id');
      batchTaskInfoModel.countByBatchId(ids, function(err, dbRes) {
        if (err) return asyncCallback(err);

        var _map = toolkit.arrayElementMap(dbRes, 'batchId');
        batches.forEach(function(d) {
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

    var ret = toolkit.initRet(batches, batchPageInfo);
    res.locals.sendJSON(ret);
  });
};

exports.add = function(req, res, next) {
  var data = req.body.data;

  // 自动记录操作界面
  data.origin = req.get('X-Dff-Origin') === 'DFF-UI' ? 'UI' : 'API';

  var funcModel  = funcMod.createModel(res.locals);
  var batchModel = batchMod.createModel(res.locals);

  var addedId = null;

  async.series([
    // 检查函数
    function(asyncCallback) {
      if (toolkit.isNothing(data.funcId)) return asyncCallback();

      funcModel.getWithCheck(data.funcId, null, asyncCallback);
    },
    // 数据入库
    function(asyncCallback) {
      batchModel.add(data, function(err, _addedId) {
        if (err) return asyncCallback(err);

        addedId = _addedId;

        return asyncCallback();
      });
    },
  ], function(err) {
    if (err) return next(err);

    var ret = toolkit.initRet({
      id : addedId,
      url: urlFor('datafluxFuncAPI.callBatchByGet', {
        params: { id: addedId },
      }),
    });
    return res.locals.sendJSON(ret);
  });
};

exports.modify = function(req, res, next) {
  var id   = req.params.id;
  var data = req.body.data;

  var funcModel  = funcMod.createModel(res.locals);
  var batchModel = batchMod.createModel(res.locals);

  var batch = null;

  async.series([
    // 获取数据
    function(asyncCallback) {
      batchModel.getWithCheck(id, null, function(err, dbRes) {
        if (err) return asyncCallback(err);

        batch = dbRes;

        return asyncCallback();
      });
    },
    // 检查函数
    function(asyncCallback) {
      if (toolkit.isNothing(data.funcId)) return asyncCallback();

      funcModel.getWithCheck(data.funcId, null, asyncCallback);
    },
    // 数据入库
    function(asyncCallback) {
      batchModel.modify(id, data, asyncCallback);
    },
  ], function(err) {
    if (err) return next(err);

    var ret = toolkit.initRet({
      id : id,
      url: urlFor('datafluxFuncAPI.callBatchByGet', {
        params: { id: id },
      }),
    });
    return res.locals.sendJSON(ret);
  });
};
