'use strict';

/* Builtin Modules */

/* 3rd-party Modules */
var async = require('async');

/* Project Modules */
var E       = require('../utils/serverError');
var CONFIG  = require('../utils/yamlResources').get('CONFIG');
var toolkit = require('../utils/toolkit');

var slowAPICountMod = require('../models/slowAPICountMod');

/* Configure */

/* Handlers */
exports.list = function(req, res, next) {
  var pageData = {};

  var slowAPICountModel = slowAPICountMod.createModel(req, res);

  slowAPICountModel.list(null, function(err, dbRes) {
    if (err) return next(err);

    pageData.data = dbRes;

    res.locals.render('slowAPICount/slowAPICount', pageData);
  });
};
