'use strict';

/* Builtin Modules */

/* 3rd-party Modules */
var async = require('async');

/* Project Modules */
var E       = require('../utils/serverError');
var CONFIG  = require('../utils/yamlResources').get('CONFIG');
var toolkit = require('../utils/toolkit');
var urlFor  = require('../utils/routeLoader').urlFor;

var funcMod = require('../models/funcMod');

/* Configure */

/* Handlers */
exports.clientApp = function(req, res, next) {
  res.locals.sendText('加载中...');
};
