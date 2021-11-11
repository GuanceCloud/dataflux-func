'use strict';

/* Builtin Modules */

/* 3rd-party Modules */
var async = require('async');

/* Project Modules */
var E       = require('./serverError');
var CONFIG  = require('./yamlResources').get('CONFIG');
var toolkit = require('./toolkit');

var SLOW_REQ_COST_LEVELS = [1000, 5000]; // 单位：毫秒
var MONITOR_LOG_LIMIT    = 3000;

module.exports = function(req, res, next) {
  var onReqFinish = function() {
    if (!res.locals.requestTime) return;

    var now = new Date();
    var reqCost = now.getTime() - res.locals.requestTime.getTime();

    var reqInfo = {
      reqMethod     : req.method,
      reqURL        : req.originalUrl,
      reqRoute      : req.route.path,
      reqTime       : res.locals.requestTime.toISOString(),
      reqCost       : reqCost,
      respTime      : now.toISOString(),
      respStatusCode: res.statusCode,
    };

    if (res.locals.user) {
      reqInfo.userId = res.locals.user.id;
    }
    var reqInfoDumps = JSON.stringify(reqInfo);

    async.series([
      // 最近慢速请求
      function(asyncCallback) {
        async.eachSeries(SLOW_REQ_COST_LEVELS, function(bucket, eachCallback) {
          if (reqCost < bucket) return eachCallback();

          var type = `reqCost${bucket}`;
          var cacheKey = toolkit.getCacheKey('monitor', 'abnormalRequest', ['type', type]);
          async.series([
            function(innerCallback) { res.locals.cacheDB.lpush(cacheKey, reqInfoDumps, innerCallback)         },
            function(innerCallback) { res.locals.cacheDB.ltrim(cacheKey, 0, MONITOR_LOG_LIMIT - 1, innerCallback) },
          ], eachCallback);
        }, asyncCallback);
      },
      // 最近异常请求
      function(asyncCallback) {
        if (res.statusCode < 400) return asyncCallback();

        var type = `statusCode${parseInt(res.statusCode / 100)}xx`;
        var cacheKey = toolkit.getCacheKey('monitor', 'abnormalRequest', ['type', type]);

        async.series([
          function(innerCallback) { res.locals.cacheDB.lpush(cacheKey, reqInfoDumps, innerCallback)         },
          function(innerCallback) { res.locals.cacheDB.ltrim(cacheKey, 0, MONITOR_LOG_LIMIT - 1, innerCallback) },
        ], asyncCallback);
      },
    ]);
  }

  res.once('close', onReqFinish);
  return next();
};
