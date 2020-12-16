'use strict';

/* 3rd-party Modules */
var async = require('async');

/* Project Modules */
var E        = require('../utils/serverError');
var CONFIG   = require('../utils/yamlResources').get('CONFIG');
var toolkit  = require('../utils/toolkit');

var userMod = require('../models/userMod');

/* Configure */

/* Handlers */
exports.list = function(req, res, next) {
  var userModel = userMod.createModel(res.locals);

  var pageData = {};
  async.series([
    function(asyncCallback) {
      var opt = res.locals.getQueryOptions();
      userModel.list(opt, function(err, dbRes, pageInfo) {
        if (err) return asyncCallback(err);

        pageData.data     = dbRes;
        pageData.pageInfo = pageInfo;

        return asyncCallback();
      });
    },
  ], function(err) {
    if (err) return next(err);

    res.locals.render('user/users', pageData);
  });
};

exports.add = function(req, res, next) {
  res.locals.render('user/userAdd');
};

exports.modify = function(req, res, next) {
  var pageData = {};

  var userModel = userMod.createModel(res.locals);

  var id = req.params.id;

  async.series([
    function(asyncCallback) {
      userModel.getWithCheck(id, null, function(err, dbRes) {
        if (err) return asyncCallback(err);

        pageData.data = dbRes;

        return asyncCallback();
      });
    },
  ], function(err) {
    if (err) return next(err);

    res.locals.render('user/userModify', pageData);
  });
};
