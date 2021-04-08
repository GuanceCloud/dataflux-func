'use strict';

/* Builtin Modules */

/* 3rd-party Modules */
var async = require('async');

/* Project Modules */
var E            = require('../utils/serverError');
var CONFIG       = require('../utils/yamlResources').get('CONFIG');
var toolkit      = require('../utils/toolkit');
var modelHelper  = require('../utils/modelHelper');

var fileServiceMod = require('../models/fileServiceMod');

/* Configure */

/* Handlers */
var crudHandler = exports.crudHandler = fileServiceMod.createCRUDHandler();

exports.list   = crudHandler.createListHandler();
exports.modify = crudHandler.createModifyHandler();
exports.delete = crudHandler.createDeleteHandler();

exports.add = function(req, res, next) {
  var data = req.body.data;

  var fileServiceModel = fileServiceMod.createModel(res.locals);

  async.series([
    // 检查ID重名
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
          return asyncCallback(new E('EBizCondition.DuplicatedScriptID', 'ID of file service already exists.'));
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

