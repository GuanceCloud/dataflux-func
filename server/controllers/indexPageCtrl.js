'use strict';

/* Builtin Modules */
var path = require('path');

/* 3rd-party Modules */
var fs    = require('fs-extra');
var async = require('async');

/* Project Modules */
var E       = require('../utils/serverError');
var CONFIG  = require('../utils/yamlResources').get('CONFIG');
var urlFor  = require('../utils/routeLoader').urlFor;
var toolkit = require('../utils/toolkit');

var userMod = require('../models/userMod');

/* Handlers */
exports.index = function(req, res, next) {
  return res.locals.render('index');
};

exports.dashboard = function(req, res, next) {
  var pageData = {};

  var userModel = userMod.createModel(res.locals);

  async.series([
    // Get user count
    function(asyncCallback) {
      userModel.count(null, function(err, dbRes) {
        if (err) return asyncCallback(err);

        pageData.users_count = dbRes;

        return asyncCallback();
      });
    },
  ], function(err) {
    if (err) return next(err);

    return res.locals.render('dashboard', pageData);
  });
};

exports.authError = function(req, res, next) {
  res.locals.render('_error/authError');
};
