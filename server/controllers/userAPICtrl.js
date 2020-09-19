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
  'mobile',
  'roles',
  'customPrivileges',
  'isDisabled',
  'createTime',
  'updateTime',
];

var SUPER_ADMIN_USER_ID = 'u-admin';

/* Handlers */
var crudHandler = exports.crudHandler = userMod.createCRUDHandler();

exports.list = crudHandler.createListHandler();
exports.get = crudHandler.createGetHandler(GET_FIELDS);

exports.add = function(req, res, next) {
  var data = req.body.data || {};

  // Do business check
  var userModel = userMod.createModel(req, res);

  var opt = {
    filters: {
      'u.username': {eq: data.username},
    },
  };
  userModel.list(opt, function(err, dbRes) {
    if (err) return next(err);

    if (dbRes.length > 0) {
      return next(new E('EClientDuplicated.username', 'This username is already existed.'));
    }

    // Call the builtin handler
    var handler = crudHandler.createAddHandler();
    return handler(req, res, next);
  });
};

exports.modify = function(req, res, next) {
  var id   = req.params.id;
  var data = req.body.data || {};

  if (id === SUPER_ADMIN_USER_ID) {
    return next(new E('EBizCondition.adminUserCannotBeModified', 'Origin Admin user cannot been modified directly.'));
  }

  // Do business check
  var userModel = userMod.createModel(req, res);

  var opt = {
    filters: {
      'u.id'      : {ne: id},
      'u.username': {eq: data.username || null},
    },
  };
  userModel.list(opt, function(err, dbRes) {
    if (err) return next(err);

    if (dbRes.length > 0 && id !== dbRes[0].id) {
      return next(new E('EClientDuplicated.username', 'This username is used by others.'));
    }

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
