'use strict';

/* Builtin Modules */

/* 3rd-party Modules */
var async = require('async');

/* Project Modules */
var E       = require('../utils/serverError');
var CONFIG  = require('../utils/yamlResources').get('CONFIG');
var toolkit = require('../utils/toolkit');

var monitorMod = require('../models/monitorMod');

/* Configure */

/* Handlers */
exports.sysStats = function(req, res, next) {
  res.locals.render('monitor/sysStats');
};

exports.serverEnvironment = function(req, res, next) {
  var monitorModel = monitorMod.createModel(res.locals);

  var pageData = {};

  async.series([
    function(asyncCallback) {
      monitorModel.getServerEnvironment(function(err, serverEnvironment) {
        if (err) return asyncCallback(err);

        pageData.data = serverEnvironment;

        return asyncCallback();
      });
    },
  ], function(err) {
    if (err) return next(err);

    res.locals.render('monitor/serverEnvironment', pageData);
  });
};

exports.tasks = function(req, res, next) {
  var monitorModel = monitorMod.createModel(res.locals);

  var pageData = {};

  async.series([
    function(asyncCallback) {
      var opt = req.query;
      monitorModel.listQueuedTasks(opt, function(err, dbRes, totalCount) {
        if (err) return asyncCallback(err);

        pageData.queuedTasks          = dbRes;
        pageData.queuedTaskTotalCount = totalCount;

        return asyncCallback();
      });
    },
    function(asyncCallback) {
      var opt = req.query;
      monitorModel.listScheduledTasks(opt, function(err, dbRes, totalCount) {
        if (err) return asyncCallback(err);

        pageData.scheduledTasks          = dbRes;
        pageData.scheduledTaskTotalCount = totalCount;

        return asyncCallback();
      });
    },
    function(asyncCallback) {
      var opt = req.query;
      monitorModel.listRecentTasks(opt, function(err, dbRes, totalCount) {
        if (err) return asyncCallback(err);

        pageData.recentTasks = dbRes;
        pageData.recentTaskTotalCount = totalCount;

        return asyncCallback();
      });
    },
  ], function(err) {
    if (err) return next(err);

    res.locals.render('monitor/tasks', pageData);
  });
};

exports.nodesStats = function(req, res, next) {
  var monitorModel = monitorMod.createModel(res.locals);

  var pageData = {};

  monitorModel.getNodesStats(function(err, dbRes) {
    if (err) return next(err);

    pageData.data = dbRes;

    res.locals.render('monitor/nodesStats', pageData);
  });
};

exports.nodesReport = function(req, res, next) {
  var monitorModel = monitorMod.createModel(res.locals);

  var pageData = {};

  monitorModel.getNodesReport(function(err, dbRes) {
    if (err) return next(err);

    pageData.data = dbRes;

    res.locals.render('monitor/nodesReport', pageData);
  });
};
