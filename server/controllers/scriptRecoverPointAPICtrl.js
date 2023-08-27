'use strict';

/* Built-in Modules */

/* 3rd-party Modules */
var async = require('async');

/* Project Modules */
var E       = require('../utils/serverError');
var CONFIG  = require('../utils/yamlResources').get('CONFIG');
var toolkit = require('../utils/toolkit');

var scriptRecoverPointMod = require('../models/scriptRecoverPointMod');

/* Init */

/* Handlers */
var crudHandler = exports.crudHandler = scriptRecoverPointMod.createCRUDHandler();

exports.list = crudHandler.createListHandler();
exports.add  = crudHandler.createAddHandler();

exports.recover = function(req, res, next) {
  var id = req.params.id;

  var scriptRecoverPointModel = scriptRecoverPointMod.createModel(res.locals);

  async.series([
    function(asyncCallback) {
      scriptRecoverPointModel.recover(id, asyncCallback);
    },
    // 发送更新脚本代码 MD5 缓存任务
    function(asyncCallback) {
      var taskReq = {
        name  : 'Internal.ReloadDataMD5Cache',
        kwargs: { all: true },
      }
      res.locals.cacheDB.putTask(taskReq, asyncCallback);
    },
  ], function(err) {
    if (err) return next(err);

    var ret = toolkit.initRet();
    return res.locals.sendJSON(ret);
  });
};
