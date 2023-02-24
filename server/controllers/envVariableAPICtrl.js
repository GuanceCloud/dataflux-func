'use strict';

/* Built-in Modules */

/* 3rd-party Modules */
var async = require('async');

/* Project Modules */
var E            = require('../utils/serverError');
var CONFIG       = require('../utils/yamlResources').get('CONFIG');
var toolkit      = require('../utils/toolkit');
var celeryHelper = require('../utils/extraHelpers/celeryHelper');

var envVariableMod = require('../models/envVariableMod');

/* Configure */

/* Handlers */
var crudHandler = exports.crudHandler = envVariableMod.createCRUDHandler();

exports.list = crudHandler.createListHandler();

exports.add = function(req, res, next) {
  var data = req.body.data;

  var envVariableModel = envVariableMod.createModel(res.locals);

  async.series([
    // 检查ID重名
    function(asyncCallback) {
      var opt = {
        limit  : 1,
        fields : ['evar.id'],
        filters: {
          'evar.id': {eq: data.id},
        },
      };
      envVariableModel.list(opt, function(err, dbRes) {
        if (err) return asyncCallback(err);

        if (dbRes.length > 0) {
          return asyncCallback(new E('EBizCondition.DuplicatedEnvVariableID', 'ID of ENV Variable already exists'));
        }

        return asyncCallback();
      });
    },
    // 数据入库
    function(asyncCallback) {
      envVariableModel.add(data, asyncCallback);
    },
  ], function(err) {
    if (err) return next(err);

    var ret = toolkit.initRet({
      id: data.id,
    });
    return res.locals.sendJSON(ret);
  });
};

exports.modify = function(req, res, next) {
  var id   = req.params.id;
  var data = req.body.data;

  var envVariableModel = envVariableMod.createModel(res.locals);

  var envVariable = null;

  async.series([
    // 获取环境变量
    function(asyncCallback) {
      envVariableModel.getWithCheck(id, null, function(err, dbRes) {
        if (err) return asyncCallback(err);

        envVariable = dbRes;

        return asyncCallback();
      });
    },
    // 数据入库
    function(asyncCallback) {
      envVariableModel.modify(id, data, asyncCallback);
    },
  ], function(err) {
    if (err) return next(err);

    var ret = toolkit.initRet({
      id: id,
    });
    res.locals.sendJSON(ret);

    var celery = celeryHelper.createHelper(res.locals.logger);
    reloadDataMD5Cache(celery, id);
  });
};

exports.delete = function(req, res, next) {
  var id = req.params.id;

  var envVariableModel = envVariableMod.createModel(res.locals);

  var envVariable = null;

  async.series([
    // 获取环境变量
    function(asyncCallback) {
      envVariableModel.getWithCheck(id, null, function(err, dbRes) {
        if (err) return asyncCallback(err);

        envVariable = dbRes;

        return asyncCallback();
      });
    },
    // 数据入库
    function(asyncCallback) {
      envVariableModel.delete(id, asyncCallback);
    },
  ], function(err) {
    if (err) return next(err);

    var ret = toolkit.initRet({
      id: id,
    });
    res.locals.sendJSON(ret);

    var celery = celeryHelper.createHelper(res.locals.logger);
    reloadDataMD5Cache(celery, id);
  });
};

function reloadDataMD5Cache(celery, envVariableId, callback) {
  var taskKwargs = { type: 'envVariable', id: envVariableId };
  celery.putTask('Sys.ReloadDataMD5Cache', null, taskKwargs, null, null, callback);
};
