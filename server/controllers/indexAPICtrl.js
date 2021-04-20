'use strict';

/* Builtin Modules */
var path = require('path');

/* 3rd-party Modules */
var fs      = require('fs-extra');
var async   = require('async');
var request = require('request');

/* Project Modules */
var E         = require('../utils/serverError');
var CONFIG    = require('../utils/yamlResources').get('CONFIG');
var CONST     = require('../utils/yamlResources').get('CONST');
var ROUTE     = require('../utils/yamlResources').get('ROUTE');
var toolkit   = require('../utils/toolkit');
var translate = require('../utils/translate');

var userMod = require('../models/userMod');

var celeryHelper = require('../utils/extraHelpers/celeryHelper');

/* Configure */
var serverConst = toolkit.jsonCopy(CONST.displayText);
delete serverConst.MODULE_FIELD;
for (var moduleField in serverConst) if (serverConst.hasOwnProperty(moduleField)) {
  var moduleFieldConsts = serverConst[moduleField];
  for (var k in moduleFieldConsts) if (moduleFieldConsts.hasOwnProperty(k)) {
    moduleFieldConsts[k] = translate(moduleFieldConsts[k]);
  }
};

var IMAGE_INFO        = require('../../image-info.json');
var WORKER_IMAGE_INFO = null;

/* Handlers */
exports.index = function(req, res, next) {
  var ret = toolkit.initRet(ROUTE);
  res.locals.sendJSON(ret);
};

exports.clientConfig = function(req, res, next) {
  var ret = toolkit.initRet(res.locals.clientConfig);
  res.locals.sendJSON(ret);
};

exports.serverConst = function(req, res, next) {
  var ret = toolkit.initRet(serverConst);
  res.locals.sendJSON(ret);
};

exports.imageInfo = function(req, res, next) {
  var ret = toolkit.initRet(IMAGE_INFO);
  res.locals.sendJSON(ret);
};

exports.workerImageInfo = function(req, res, next) {
  if (WORKER_IMAGE_INFO) {
    var ret = toolkit.initRet(WORKER_IMAGE_INFO);
    return res.locals.sendJSON(ret);
  }

  var celery = celeryHelper.createHelper(res.locals.logger);
  celery.putTask('internal.getImageInfo', null, null, null, null, function(err, celeryRes) {
    if (err) return next(err);

    celeryRes = celeryRes || {};

    if (celeryRes.status === 'SUCCESS') {
      WORKER_IMAGE_INFO = celeryRes.retval;

      var ret = toolkit.initRet(WORKER_IMAGE_INFO);
      return res.locals.sendJSON(ret);

    } else {
      return next(new E('ESysAsyncTaskFailed', 'Worker no response'));
    }
  });
};

exports.ping = function(req, res, next) {
  var ret = toolkit.initRet('pong');
  res.locals.sendJSON(ret);
};

exports.echo = function(req, res, next) {
  var ret = toolkit.initRet(req.rawData.toString());
  res.locals.sendJSON(ret);
};

exports.proxy = function(req, res, next) {
  var requestOptions = {
    forever: true,
    timeout: (req.body.timeout || 10) * 1000,
    method : req.body.method,
    url    : req.body.url,
    headers: req.body.headers || undefined,
    json   : true,
    body   : req.body.body || undefined,
  };
  request(requestOptions, function(err, _res, _body) {
    if (err) return next(err);

    var httpResp = {
      statusCode: _res.statusCode,
      body      : _body,
    };

    if (req.body.withHeaders) {
      httpResp.headers = _res.headers;
    }

    var ret = toolkit.initRet(httpResp);

    // 不要输出日志
    return res.send(ret);
  });
};

exports.testThrowError = function(req, res, next) {
  throw new Error('Test Throw Error');

  var ret = toolkit.initRet(req.body);
  res.locals.sendJSON(ret);
};

exports.testThrowErrorInAsync = function(req, res, next) {
  async.series([
    function(asyncCallback) {
      throw new Error('Test Throw Error in Async');
    },
  ], function(err) {
    if (err) return next(err);

    var ret = toolkit.initRet(req.body);
    res.locals.sendJSON(ret);
  });
};

exports.testSlowAPI = function(req, res, next) {
  var simulateReqCost = req.query.simulateReqCost || 0;

  setTimeout(function() {
    res.locals.sendJSON();
  }, simulateReqCost);
};
