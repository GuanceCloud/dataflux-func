'use strict';

/* Builtin Modules */

/* 3rd-party Modules */
var async = require('async');

/* Project Modules */
var E            = require('../utils/serverError');
var CONFIG       = require('../utils/yamlResources').get('CONFIG');
var toolkit      = require('../utils/toolkit');
var celeryHelper = require('../utils/extraHelpers/celeryHelper');

var scriptRecoverPointMod = require('../models/scriptRecoverPointMod');

/* Configure */

/* Handlers */
var crudHandler = exports.crudHandler = scriptRecoverPointMod.createCRUDHandler();

exports.list = crudHandler.createListHandler();
exports.add  = crudHandler.createAddHandler();

exports.recover = function(req, res, next) {
  var id   = req.params.id;
  var data = req.body.data;

  var celery = celeryHelper.createHelper(res.locals.logger);

  var scriptRecoverPointModel = scriptRecoverPointMod.createModel(res.locals);

  async.series([
    function(asyncCallback) {
      scriptRecoverPointModel.recover(id, data, asyncCallback);
    },
    // 发送更新脚本缓存任务（强制）
    function(asyncCallback) {
      var taskKwargs = { force: true };
      celery.putTask('Main.ReloadScripts', null, taskKwargs, null, asyncCallback);
    },
  ], function(err) {
    if (err) return next(err);

    var ret = toolkit.initRet();
    return res.locals.sendJSON(ret);
  });
};
