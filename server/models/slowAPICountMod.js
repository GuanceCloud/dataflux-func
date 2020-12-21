'use strict';

/* Builtin Modules */

/* 3rd-party Modules */
var async = require('async');

/* Project Modules */
var E           = require('../utils/serverError');
var CONFIG      = require('../utils/yamlResources').get('CONFIG');
var toolkit     = require('../utils/toolkit');
var modelHelper = require('../utils/modelHelper');

/* Configure */
var TABLE_OPTIONS = exports.TABLE_OPTIONS = {
};

var SLOW_API_THRESHOLDS_ORDERS = [10000, 5000, 2000, 1000, 500, 300];

exports.createModel = function(locals) {
  return new EntityModel(locals);
};

var EntityModel = exports.EntityModel = modelHelper.createSubModel(TABLE_OPTIONS);

EntityModel.prototype.list = function(options, callback) {
  var self = this;

  var cacheKey = toolkit.getCacheKey('cache', 'slowAPICount', [
    'originalURLBase64', '*']);

  var slowAPICounts = [];

  var foundKeys = null;
  async.series([
    function(asyncCallback) {
      self.cacheDB.keys(cacheKey, function(err, keys) {
        if (err) return asyncCallback(err);

        foundKeys = keys;

        return asyncCallback();
      });
    },
    function(asyncCallback) {
      if (toolkit.isNothing(foundKeys)) return asyncCallback();

      async.eachLimit(foundKeys, 5, function(key, eachCallback) {
        var parsedKey = toolkit.parseCacheKey(key);

        var originalURLBase64 = parsedKey.tags.originalURLBase64;
        var originalURL       = toolkit.fromBase64(originalURLBase64);

        self.cacheDB.hgetall(key, function(err, cacheRes) {
          if (err) return eachCallback(err);

          var d = toolkit.jsonCopy(cacheRes);

          d.id          = originalURLBase64;
          d.originalURL = originalURL;

          slowAPICounts.push(d);

          return eachCallback();
        })
      }, asyncCallback);
    },
  ], function(err) {
    if (err) return callback(err);

    slowAPICounts.sort(function(a, b) {
      for (var i = 0; i < SLOW_API_THRESHOLDS_ORDERS.length; i++) {
        var field = toolkit.strf('over{0}Count', SLOW_API_THRESHOLDS_ORDERS[i]);

        a[field] = a[field] || 0;
        b[field] = b[field] || 0;

        if (a[field] !== b[field]) {
          return b[field] - a[field];
        }
      }
    });
    slowAPICounts = slowAPICounts.slice(0, 100);

    return callback(null, slowAPICounts);
  });
};

EntityModel.prototype.save = function(slowAPICountMapCache, callback) {
  var self = this;

  var data = [];
  for (var originalURL in slowAPICountMapCache) if (slowAPICountMapCache.hasOwnProperty(originalURL)) {
    var countMap = slowAPICountMapCache[originalURL];

    for (var thresholds in countMap) if (countMap.hasOwnProperty(thresholds)) {
      data.push({
        originalURL: originalURL,
        thresholds : toolkit.strf('over{0}Count', thresholds),
        count      : parseInt(countMap[thresholds]),
      });
    }
  }

  async.eachLimit(data, 5, function(d, eachCallback) {
    var originalURLBase64 = toolkit.getBase64(d.originalURL);

    var cacheKey = toolkit.getCacheKey('cache', 'slowAPICount', [
      'originalURLBase64', originalURLBase64]);

    async.series([
      function(asyncCallback) {
        self.cacheDB.hincrby(cacheKey, d.thresholds, d.count, asyncCallback);
      },
      function(asyncCallback) {
        self.cacheDB.expire(cacheKey, CONFIG._MONITOR_SLOW_API_COUNT_EXPIRES, asyncCallback);
      },
    ], eachCallback);

  }, function(err) {
    if (err) self.logger.logError(err);
    if ('function' === typeof callback) callback();
  });
};

EntityModel.prototype.delete = function(id, callback) {
  var self = this;

  var cacheKey = toolkit.getCacheKey('cache', 'slowAPICount', [
    'originalURLBase64', id]);

  self.cacheDB.del(cacheKey, function(err, cacheRes) {
    if (err) return callback(err);

    return callback(null, id);
  });
};

EntityModel.prototype.clear = function(callback) {
  var self = this;

  var cacheKey = toolkit.getCacheKey('cache', 'slowAPICount', [
    'originalURLBase64', '*']);

  self.cacheDB.delByPattern(cacheKey, function(err, cacheRes) {
    if (err) return callback(err);

    return callback();
  });
};
