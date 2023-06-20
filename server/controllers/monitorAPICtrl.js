'use strict';

/* Built-in Modules */
var os = require('os');

/* 3rd-party Modules */
var async = require('async');

/* Project Modules */
var E       = require('../utils/serverError');
var CONFIG  = require('../utils/yamlResources').get('CONFIG');
var toolkit = require('../utils/toolkit');

var monitorMod = require('../models/monitorMod');

/* Configure */

/* Handlers */
exports.getSystemMetrics = function(req, res, next) {
  var monitorModel = monitorMod.createModel(res.locals);

  monitorModel.getSystemMetrics(function(err, dbRes) {
    if (err) return next(err);

    var ret = toolkit.initRet(dbRes);
    return res.locals.sendJSON(ret, { muteLog: true });
  });
};

exports.listAbnormalRequests = function(req, res, next) {
  var type = req.params.type || '5xx';

  var monitorModel = monitorMod.createModel(res.locals);
  monitorModel.listAbnormalRequests(type, function(err, dbRes, pageInfo) {
    if (err) return next(err);

    var ret = toolkit.initRet(dbRes, pageInfo);
    return res.locals.sendJSON(ret, { muteLog: true });
  });
};
