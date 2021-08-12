'use strict';

/* Builtin Modules */
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
exports.getSysStats = function(req, res, next) {
  var monitorModel = monitorMod.createModel(res.locals);

  monitorModel.getSysStats(function(err, dbRes) {
    if (err) return next(err);

    var ret = toolkit.initRet({
      hostname: os.hostname(),
      sysStats: dbRes,
    });
    return res.locals.sendJSON(ret, { muteLog: true });
  });
};

exports.getServerEnvironment = function(req, res, next) {
  var monitorModel = monitorMod.createModel(res.locals);

  monitorModel.getServerEnvironment(function(err, dbRes) {
    if (err) return next(err);

    var ret = toolkit.initRet(dbRes);
    return res.locals.sendJSON(ret, { muteLog: true });
  });
};

exports.clearSysStats = function(req, res, next) {
  var monitorModel = monitorMod.createModel(res.locals);

  monitorModel.clearSysStats(function(err, clearCount, clearKeys) {
    if (err) return next(err);

    var ret = toolkit.initRet({
      clearCount: clearCount,
      clearKeys : clearKeys,
    });
    return res.locals.sendJSON(ret, { muteLog: true });
  });
};

exports.listQueuedTasks = function(req, res, next) {
  var monitorModel = monitorMod.createModel(res.locals);

  var opt = req.query;
  monitorModel.listQueuedTasks(opt, function(err, dbRes, totalCount) {
    if (err) return next(err);

    var ret = toolkit.initRet({
      queuedTasks: dbRes,
      totalCount : totalCount,
    });
    res.locals.sendJSON(ret);
  });
};

exports.listScheduledTasks = function(req, res, next) {
  var monitorModel = monitorMod.createModel(res.locals);

  var opt = req.query;
  monitorModel.listScheduledTasks(opt, function(err, dbRes, totalCount) {
    if (err) return next(err);

    var ret = toolkit.initRet({
      scheduledTasks: dbRes,
      totalCount    : totalCount,
    });
    res.locals.sendJSON(ret);
  });
};

exports.listRecentTasks = function(req, res, next) {
  var monitorModel = monitorMod.createModel(res.locals);

  var opt = req.query;
  monitorModel.listRecentTasks(opt, function(err, dbRes) {
    if (err) return next(err);

    var ret = toolkit.initRet({
      recentTasks: dbRes,
      totalCount : totalCount,
    });
    res.locals.sendJSON(ret);
  });
};

exports.pingNodes = function(req, res, next) {
  var monitorModel = monitorMod.createModel(res.locals);

  monitorModel.pingNodes(function(err, dbRes) {
    if (err) return next(err);

    var ret = toolkit.initRet(dbRes);
    res.locals.sendJSON(ret);
  });
};

exports.getNodesStats = function(req, res, next) {
  var monitorModel = monitorMod.createModel(res.locals);

  monitorModel.getNodesStats(function(err, dbRes) {
    if (err) return next(err);

    var ret = toolkit.initRet(dbRes);
    res.locals.sendJSON(ret);
  });
};

exports.getNodesActiveQueues = function(req, res, next) {
  var monitorModel = monitorMod.createModel(res.locals);

  monitorModel.getNodesActiveQueues(function(err, dbRes) {
    if (err) return next(err);

    var ret = toolkit.initRet(dbRes);
    res.locals.sendJSON(ret);
  });
};

exports.getNodesReport = function(req, res, next) {
  var monitorModel = monitorMod.createModel(res.locals);

  monitorModel.getNodesReport(function(err, dbRes) {
    if (err) return next(err);

    var ret = toolkit.initRet(dbRes);
    res.locals.sendJSON(ret);
  });
};

exports.clearWorkerQueues = function(req, res, next) {
  var workerQueues = req.body.workerQueues;

  var workerQueuePrefix = toolkit.getWorkerQueue('x').split('@')[0];
  async.eachSeries(workerQueues, function(workerQueue, eachCallback) {
    if (workerQueue.indexOf(workerQueuePrefix) < 0) {
      workerQueue = toolkit.getWorkerQueue(workerQueue);
    }

    res.locals.cacheDB.ltrim(workerQueue, 1, 0, eachCallback);

  }, function(err) {
    if (err) return next(err);

    var ret = toolkit.initRet();
    return res.locals.sendJSON(ret);
  });
};
