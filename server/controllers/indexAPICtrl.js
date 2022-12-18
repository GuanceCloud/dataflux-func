'use strict';

/* Built-in Modules */
var childProcess = require('child_process');

/* 3rd-party Modules */
var fs      = require('fs-extra');
var async   = require('async');
var request = require('request');

/* Project Modules */
var E       = require('../utils/serverError');
var ROUTE   = require('../utils/yamlResources').get('ROUTE');
var toolkit = require('../utils/toolkit');

var celeryHelper = require('../utils/extraHelpers/celeryHelper');

/* Configure */
var IMAGE_INFO = require('../../image-info.json');
IMAGE_INFO.ARCHITECTURE   = childProcess.execSync('uname -m').toString().trim();
IMAGE_INFO.PYTHON_VERSION = childProcess.execSync('python --version').toString().split(' ').pop();
IMAGE_INFO.NODE_VERSION   = childProcess.execSync('node --version').toString().replace('v', '');

/* Handlers */
exports.index = function(req, res, next) {
  var ret = toolkit.initRet(ROUTE);
  res.locals.sendJSON(ret);
};

exports.clientConfig = function(req, res, next) {
  var ret = toolkit.initRet(res.locals.clientConfig);
  res.locals.sendJSON(ret);
};

exports.imageInfo = function(req, res, next) {
  var ret = toolkit.initRet(IMAGE_INFO);
  res.locals.sendJSON(ret);
};

exports.ping = function(req, res, next) {
  var ret = toolkit.initRet('pong');
  res.locals.sendJSON(ret);
};

exports.echo = function(req, res, next) {
  var data = {
    query: req.query,
    body : req.body,
  }
  var ret = toolkit.initRet(data);
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

    return res.locals.sendJSON(ret, { muteLog: true });
  });
};

exports.testThrowError = function(req, res, next) {
  throw new Error('Test Throw Error');
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
