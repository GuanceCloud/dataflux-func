'use strict';

/* Built-in Modules */

/* 3rd-party Modules */
var async = require('async');

/* Project Modules */
var E       = require('../utils/serverError');
var CONFIG  = require('../utils/yamlResources').get('CONFIG');
var toolkit = require('../utils/toolkit');

var taskInfoMod = require('../models/taskInfoMod');

/* Configure */

/* Handlers */
var crudHandler = exports.crudHandler = taskInfoMod.createCRUDHandler();

exports.list = function(req, res, next) {
  var taskInfos        = null;
  var taskInfoPageInfo = null;

  var taskInfoModel = taskInfoMod.createModel(res.locals);

  async.series([
    function(asyncCallback) {
      var opt = res.locals.getQueryOptions();
      taskInfoModel.list(opt, function(err, dbRes, pageInfo) {
        if (err) return asyncCallback(err);

        taskInfos        = dbRes;
        taskInfoPageInfo = pageInfo;

        // 添加子任务数量 subTaskCount
        return taskInfoModel.appendSubTaskCount(taskInfos, asyncCallback);
      });
    },
  ], function(err) {
    if (err) return next(err);

    var ret = toolkit.initRet(taskInfos, taskInfoPageInfo);
    res.locals.sendJSON(ret);
  });
};