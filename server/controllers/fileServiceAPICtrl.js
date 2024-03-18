'use strict';

/* Built-in Modules */

/* 3rd-party Modules */
var async = require('async');

/* Project Modules */
var E            = require('../utils/serverError');
var CONFIG       = require('../utils/yamlResources').get('CONFIG');
var toolkit      = require('../utils/toolkit');
var modelHelper  = require('../utils/modelHelper');

var fileServiceMod = require('../models/fileServiceMod');

/* Init */

/* Handlers */
var crudHandler = exports.crudHandler = fileServiceMod.createCRUDHandler();

exports.list   = crudHandler.createListHandler();
exports.delete = crudHandler.createDeleteHandler();

exports.add = function(req, res, next) {
  var data = req.body.data;

  // 防止路径穿越
  if (data.root && data.root.match(/\.\./g)) {
    return next(new E('EBizCondition.ParentDirectorySymbolNotAllowed', 'Parent directory symbol (..) is not allowed in path'));
  }

  var fileServiceModel = fileServiceMod.createModel(res.locals);

  async.series([
    // 检查 ID 重名
    function(asyncCallback) {
      var opt = {
        limit  : 1,
        fields : ['fsvc.id'],
        filters: {
          'fsvc.id': {eq: data.id},
        },
      };
      fileServiceModel.list(opt, function(err, dbRes) {
        if (err) return asyncCallback(err);

        if (dbRes.length > 0) {
          return asyncCallback(new E('EBizCondition.DuplicatedScriptID', 'ID of file service already exists'));
        }

        return asyncCallback();
      });
    },
    // 数据入库
    function(asyncCallback) {
      fileServiceModel.add(data, asyncCallback);
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

  // 防止路径穿越
  if (data.root && data.root.match(/\.\./g)) {
    return next(new E('EBizCondition.ParentDirectorySymbolNotAllowed', 'Parent directory symbol (..) is not allowed in path'));
  }

  async.series([
    // 数据入库
    function(asyncCallback) {
      fileServiceModel.modify(id, data, asyncCallback);
    },
  ], function(err) {
    if (err) return next(err);

    var ret = toolkit.initRet({
      id: id,
    });
    return res.locals.sendJSON(ret);
  });
};
