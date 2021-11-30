'use strict';

/* Builtin Modules */

/* 3rd-party Modules */
var async = require('async');

/* Project Modules */
var E       = require('../utils/serverError');
var CONFIG  = require('../utils/yamlResources').get('CONFIG');
var toolkit = require('../utils/toolkit');

var crontabTaskInfoMod = require('../models/crontabTaskInfoMod');

/* Configure */

/* Handlers */
var crudHandler = exports.crudHandler = crontabTaskInfoMod.createCRUDHandler();

exports.list = function(req, res, next) {
  var crontabTaskInfos        = null;
  var crontabTaskInfoPageInfo = null;

  var crontabTaskInfoModel = crontabTaskInfoMod.createModel(res.locals);

  async.series([
    function(asyncCallback) {
      var opt = res.locals.getQueryOptions();

      crontabTaskInfoModel.list(opt, function(err, dbRes, pageInfo) {
        if (err) return asyncCallback(err);

        crontabTaskInfos        = dbRes;
        crontabTaskInfoPageInfo = pageInfo;

        return asyncCallback();
      });
    },
    // 查询子任务信息数量
    function(asyncCallback) {
      if (crontabTaskInfos.length <= 0) return asyncCallback();

      var opt = res.locals.getQueryOptions();
      if (!opt.extra.withSubTaskCount) return asyncCallback();

      var crontabTaskInfoModel = crontabTaskInfoMod.createModel(res.locals);

      var ids = toolkit.arrayElementValues(crontabTaskInfos, 'id');
      crontabTaskInfoModel.countByRootTaskId(ids, function(err, dbRes) {
        if (err) return asyncCallback(err);

        var _map = toolkit.arrayElementMap(dbRes, 'rootTaskId');
        crontabTaskInfos.forEach(function(d) {
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

    var ret = toolkit.initRet(crontabTaskInfos, crontabTaskInfoPageInfo);
    res.locals.sendJSON(ret);
  });
};
