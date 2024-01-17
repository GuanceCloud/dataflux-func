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
    var cacheKey = toolkit.getGlobalCacheKey('temporaryFlag', id);
    res.locals.cacheDB.getWithTTL(cacheKey, function(err, cacheRes) {
      if (err) return eachCallback(err);

      temporaryFlags[id] = cacheRes;

      return eachCallback();
    });
  }, function(err) {
    if (err) return next(err);

    var ret = toolkit.initRet(temporaryFlags);
    res.locals.sendJSON(ret);
  });
};

exports.set = function(req, res, next) {
  var id    = req.params.id;
  var value = req.body.value || toolkit.getTimestamp();
  var ttl   = req.body.ttl   || 0;

  if (CONST.temporaryFlags.indexOf(id) < 0) {
    return next(new E('EClientUnsupported', 'Unsupported temporary flag'));
  }

  var cacheKey = toolkit.getGlobalCacheKey('temporaryFlag', id);
  var apiCallback = function(err) {
    if (err) return next(err);
    return res.locals.sendJSON();
  }

  value = JSON.stringify(value);
  if (ttl <= 0) {
    // 永久标记
    return res.locals.cacheDB.set(cacheKey, value, apiCallback);

  } else {
    // 自动过期标记
    return res.locals.cacheDB.setex(cacheKey, ttl, value, apiCallback);
  }
};

exports.clear = function(req, res, next) {
  var id = req.params.id;

  var cacheKey = toolkit.getGlobalCacheKey('temporaryFlag', id);

  return res.locals.cacheDB.del(cacheKey, function(err) {
    if (err) return next(err);
    return res.locals.sendJSON();
  });
};
