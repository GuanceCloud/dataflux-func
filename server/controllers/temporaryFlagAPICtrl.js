'use strict';

/* Built-in Modules */

/* 3rd-party Modules */
var async = require('async');

/* Project Modules */
var E       = require('../utils/serverError');
var CONST   = require('../utils/yamlResources').get('CONST');
var toolkit = require('../utils/toolkit');

/* Init */

/* Handlers */
exports.get = function(req, res, next) {
  var temporaryFlagIds = req.query.id || CONST.temporaryFlags;

  var temporaryFlags = {};

  async.eachLimit(temporaryFlagIds, 5, function(id, eachCallback) {
    var cacheKey = toolkit.getWorkerCacheKey('temporaryFlag', id);
    res.locals.cacheDB.ttl(cacheKey, function(err, cacheRes) {
      if (err) return eachCallback(err);

      if (cacheRes === -2) {
        // 不存在
        temporaryFlags[id] = 0;

      } else if (cacheRes === -1) {
        // 永不过期
        temporaryFlags[id] = -1;

      } else {
        // 正常过期
        temporaryFlags[id] = cacheRes;
      }

      return eachCallback();
    });
  }, function(err) {
    if (err) return next(err);

    var ret = toolkit.initRet(temporaryFlags);
    res.locals.sendJSON(ret);
  });
};

exports.set = function(req, res, next) {
  var id       = req.params.id;
  var duration = req.body.duration;

  if (CONST.temporaryFlags.indexOf(id) < 0) {
    // return next(new E('EClientUnsupported', 'Unsupported temporary flag'));
  }

  var cacheKey = toolkit.getWorkerCacheKey('temporaryFlag', id);
  var apiCallback = function(err) {
    if (err) return next(err);
    return res.locals.sendJSON();
  }

  if (duration <= 0) {
    // 永久标记
    return res.locals.cacheDB.set(cacheKey, 'x', apiCallback);

  } else {
    // 自动过期标记
    return res.locals.cacheDB.setex(cacheKey, duration, 'x', apiCallback);
  }
};

exports.clear = function(req, res, next) {
  var id = req.params.id;

  var cacheKey = toolkit.getWorkerCacheKey('temporaryFlag', id);

  return res.locals.cacheDB.del(cacheKey, function(err) {
    if (err) return next(err);
    return res.locals.sendJSON();
  });
};
