'use strict';

/* Built-in Modules */

/* 3rd-party Modules */
var async = require('async');

/* Project Modules */
var E       = require('../utils/serverError');
var CONST   = require('../utils/yamlResources').get('CONST');
var toolkit = require('../utils/toolkit');

var systemSettingMod = require('../models/systemSettingMod');

/* Init */

/* Handlers */
var crudHandler = exports.crudHandler = systemSettingMod.createCRUDHandler();

exports.delete = crudHandler.createDeleteHandler();

exports.get = function(req, res, next) {
  var systemSettingIds = req.query.id || Object.keys(CONST.systemSettings);

  var systemSettings = null;

  var systemSettingModel = systemSettingMod.createModel(res.locals);

  async.series([
    // 获取系统配置列表
    function(asyncCallback) {
      systemSettingModel.get(systemSettingIds, function(err, dbRes) {
        if (err) return asyncCallback(err);

        systemSettings = dbRes;

        return asyncCallback();
      });
    },
  ], function(err) {
    if (err) return next(err);

    var ret = toolkit.initRet(systemSettings);
    res.locals.sendJSON(ret);
  });
};

exports.set = function(req, res, next) {
  var id   = req.params.id;
  var value = req.body.data.value;

  var systemSettingModel = systemSettingMod.createModel(res.locals);

  systemSettingModel.set(id, value, function(err, dbRes) {
    if (err) return next(err);

    var ret = toolkit.initRet(dbRes);
    return res.locals.sendJSON(ret);
  });
};
