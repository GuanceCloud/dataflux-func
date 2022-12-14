'use strict';

/* 3rd-party Modules */
var async = require('async');

/* Project Modules */
var E       = require('../utils/serverError');
var CONFIG  = require('../utils/yamlResources').get('CONFIG');
var toolkit = require('../utils/toolkit');
var auth    = require('../utils/auth');

var userMod = require('../models/userMod');

/* Configure */
var GET_FIELDS = [
  'seq',
  'id',
  'username',
  'name',
  'email',
  'mobile',
  'roles',
  'customPrivileges',
  'isDisabled',
  'createTime',
  'updateTime',
];

/* Handlers */
var crudHandler = exports.crudHandler = userMod.createCRUDHandler();

exports.list   = crudHandler.createListHandler();
exports.get    = crudHandler.createGetHandler(GET_FIELDS);
exports.delete = crudHandler.createDeleteHandler();

exports.add = function(req, res, next) {
  var data = req.body.data || {};

  // Do business check
  var userModel = userMod.createModel(res.locals);

  var opt = {
    filters: {
      'u.username': {eq: data.username},
    },
  };
  userModel.list(opt, function(err, dbRes) {
    if (err) return next(err);

    if (dbRes.length > 0) {
      return next(new E('EClientDuplicated.username', 'This username is already existed'));
    }

    // Call the builtin handler
    var handler = crudHandler.createAddHandler();
    return handler(req, res, next);
  });
};

exports.modify = function(req, res, next) {
  var id   = req.params.id;
  var data = req.body.data || {};

  var userModel = userMod.createModel(res.locals);
  async.series([
    // 检查当前用户
    function(asyncCallback) {
      userModel.getWithCheck(id, ['roles'], function(err, dbRes) {
        if (err) return asyncCallback(err);

        if (Array.isArray(dbRes.roles) && dbRes.roles.indexOf('sa') >= 0) {
          return asyncCallback(new E('EBizCondition.adminUserCannotBeModified', 'Super Admin user cannot been modified directly'));
        }

        return asyncCallback(err);
      });
    },
    // 检查username 重名
    function(asyncCallback) {
      if (!data.username) return asyncCallback();

      var opt = {
        filters: {
          'u.id'      : {ne: id},
          'u.username': {eq: data.username},
        },
      };
      userModel.list(opt, function(err, dbRes) {
        if (err) return asyncCallback(err);

        if (dbRes.length > 0) {
          return asyncCallback(new E('EClientDuplicated.username', 'This username is used by others'));
        }

        return asyncCallback(err);
      });
    },
  ], function(err) {
    if (err) return next(err);

    // If disabled, delete xAuthToken
    if (toolkit.toBoolean(data.isDisabled)) {
      var cachePattern = auth.getCachePattern({userId: id});
      res.locals.cacheDB.delByPattern(cachePattern);
    }

    // Call the builtin handler
    var handler = crudHandler.createModifyHandler();
    return handler(req, res, next);
  });
};
