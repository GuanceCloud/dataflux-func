'use strict';

/* Built-in Modules */

/* 3rd-party Modules */
var async = require('async');

/* Project Modules */
var E       = require('../utils/serverError');
var CONFIG  = require('../utils/yamlResources').get('CONFIG');
var toolkit = require('../utils/toolkit');

var taskRecordFuncMod = require('../models/taskRecordFuncMod');

/* Init */

/* Handlers */
var crudHandler = exports.crudHandler = taskRecordFuncMod.createCRUDHandler();

exports.list = function(req, res, next) {
  var listData     = null;
  var listPageInfo = null;

  var taskRecordFuncModel = taskRecordFuncMod.createModel(res.locals);

  async.series([
    function(asyncCallback) {
      var opt = res.locals.getQueryOptions();
      taskRecordFuncModel.list(opt, function(err, dbRes, pageInfo) {
        if (err) return asyncCallback(err);

        listData     = dbRes;
        listPageInfo = pageInfo;

        // 添加子任务数量 subTaskCount
        return taskRecordFuncModel.appendSubTaskCount(listData, asyncCallback);
      });
    },
  ], function(err) {
    if (err) return next(err);

    var ret = toolkit.initRet(listData, listPageInfo);
    res.locals.sendJSON(ret);
  });
};

exports.getStatistic = function(req, res, next) {
  var groupField = req.query.groupField;
  var groupIds   = req.query.groupIds;

  var taskRecordFuncModel = taskRecordFuncMod.createModel(res.locals);
  taskRecordFuncModel.getStatistic(groupField, groupIds, function(err, dbRes) {
    if (err) return next(err);

    var ret = toolkit.initRet(dbRes);
    return res.locals.sendJSON(ret);
  });
};
