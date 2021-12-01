'use strict';

/* Builtin Modules */

/* 3rd-party Modules */
var async = require('async');

/* Project Modules */
var E       = require('../utils/serverError');
var CONFIG  = require('../utils/yamlResources').get('CONFIG');
var toolkit = require('../utils/toolkit');

var batchTaskInfoMod = require('../models/batchTaskInfoMod');

/* Configure */

/* Handlers */
var crudHandler = exports.crudHandler = batchTaskInfoMod.createCRUDHandler();

exports.list = function(req, res, next) {
  var batchTaskInfos        = null;
  var batchTaskInfoPageInfo = null;

  var batchTaskInfoModel = batchTaskInfoMod.createModel(res.locals);

  async.series([
    function(asyncCallback) {
      var opt = res.locals.getQueryOptions();

      // `rootTaskId`需要特殊处理
      var rootTaskId = req.query['rootTaskId'];
      if (rootTaskId && rootTaskId !== 'ROOT') {
        opt.filters = opt.filters || {};
        opt.filters['ROOT_TASK_ID'] = {
          raw: toolkit.strf('bati.id = {0} OR bati.rootTaskId = {0}', res.locals.db.escape(rootTaskId)),
        }
        delete opt.filters['bati.rootTaskId'];
      }

      batchTaskInfoModel.list(opt, function(err, dbRes, pageInfo) {
        if (err) return asyncCallback(err);

        batchTaskInfos        = dbRes;
        batchTaskInfoPageInfo = pageInfo;

        return asyncCallback();
      });
    },
    // 查询子任务信息数量
    function(asyncCallback) {
      if (batchTaskInfos.length <= 0) return asyncCallback();

      var opt = res.locals.getQueryOptions();
      if (!opt.extra.withSubTaskCount) return asyncCallback();

      var batchTaskInfoModel = batchTaskInfoMod.createModel(res.locals);

      var ids = toolkit.arrayElementValues(batchTaskInfos, 'id');
      batchTaskInfoModel.countByRootTaskId(ids, function(err, dbRes) {
        if (err) return asyncCallback(err);

        var _map = toolkit.arrayElementMap(dbRes, 'rootTaskId');
        batchTaskInfos.forEach(function(d) {
          if (!_map[d.id]) {
            d.subTaskCount = 0;
          } else {
            d.subTaskCount = _map[d.id].count || 0;
          }
        });

        return asyncCallback();
      });
    },
  ], function(err) {
    if (err) return next(err);

    var ret = toolkit.initRet(batchTaskInfos, batchTaskInfoPageInfo);
    res.locals.sendJSON(ret);
  });
};
