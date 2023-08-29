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
  var taskRecords        = null;
  var taskRecordPageInfo = null;

  var taskRecordFuncModel = taskRecordFuncMod.createModel(res.locals);

  async.series([
    function(asyncCallback) {
      var opt = res.locals.getQueryOptions();
      taskRecordFuncModel.list(opt, function(err, dbRes, pageInfo) {
        if (err) return asyncCallback(err);

        taskRecords        = dbRes;
        taskRecordPageInfo = pageInfo;

        // 添加子任务数量 subTaskCount
        return taskRecordFuncModel.appendSubTaskCount(taskRecords, asyncCallback);
      });
    },
  ], function(err) {
    if (err) return next(err);

    var ret = toolkit.initRet(taskRecords, taskRecordPageInfo);
    res.locals.sendJSON(ret);
  });
};
