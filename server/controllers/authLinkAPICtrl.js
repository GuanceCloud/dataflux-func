'use strict';

/* Builtin Modules */

/* 3rd-party Modules */
var async = require('async');

/* Project Modules */
var E       = require('../utils/serverError');
var CONFIG  = require('../utils/yamlResources').get('CONFIG');
var toolkit = require('../utils/toolkit');
var urlFor  = require('../utils/routeLoader').urlFor;

var funcMod     = require('../models/funcMod');
var authLinkMod = require('../models/authLinkMod');

/* Configure */

/* Handlers */
var crudHandler = exports.crudHandler = authLinkMod.createCRUDHandler();

exports.list   = crudHandler.createListHandler();
exports.delete = crudHandler.createDeleteHandler();

exports.add = function(req, res, next) {
  var data = req.body.data;

  var funcModel     = funcMod.createModel(req, res);
  var authLinkModel = authLinkMod.createModel(req, res);

  var addedId = null;

  async.series([
    // 检查函数
    function(asyncCallback) {
      if (toolkit.isNothing(data.funcId)) return asyncCallback();

      funcModel.getWithCheck(data.funcId, null, asyncCallback);
    },
    // 数据入库
    function(asyncCallback) {
      authLinkModel.add(data, function(err, _addedId) {
        if (err) return asyncCallback(err);

        addedId = _addedId;

        return asyncCallback();
      });
    },
  ], function(err) {
    if (err) return next(err);

    var ret = toolkit.initRet({
      id : addedId,
      url: urlFor('datafluxFuncAPI.callAuthLinkByGet', {
        params: { id: addedId },
      }),
    });
    return res.locals.sendJSON(ret);
  });
};

exports.modify = function(req, res, next) {
  var id   = req.params.id;
  var data = req.body.data;

  var funcModel     = funcMod.createModel(req, res);
  var authLinkModel = authLinkMod.createModel(req, res);

  var authLink = null;

  async.series([
    // 获取数据
    function(asyncCallback) {
      authLinkModel.getWithCheck(id, null, function(err, dbRes) {
        if (err) return asyncCallback(err);

        authLink = dbRes;

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
      authLinkModel.modify(id, data, asyncCallback);
    },
  ], function(err) {
    if (err) return next(err);

    var ret = toolkit.initRet({
      id : id,
      url: urlFor('datafluxFuncAPI.callAuthLinkByGet', {
        params: { id: id },
      }),
    });
    return res.locals.sendJSON(ret);
  });
};
