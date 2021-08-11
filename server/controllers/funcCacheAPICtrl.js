'use strict';

/* Builtin Modules */

/* 3rd-party Modules */
var async = require('async');

/* Project Modules */
var E       = require('../utils/serverError');
var CONFIG  = require('../utils/yamlResources').get('CONFIG');
var toolkit = require('../utils/toolkit');

/* Configure */

/* Handlers */

exports.list = function(req, res, next) {
  var scope = req.query.scope || '*';
  var key   = req.query.key   || '*';

  var cacheKeyPattern = toolkit.getWorkerCacheKey('funcCache', scope, [ 'key', key ]);

  var data = [];
  async.series([
    // 获取相关的键
    function(asyncCallback) {
      res.locals.cacheDB.keys(cacheKeyPattern, function(err, keys) {
        if (err) return asyncCallback(err);

        keys.forEach(function(key) {
          var parsedKey = toolkit.parseCacheKey(key);

          data.push({
            fullKey: key,
            scope  : parsedKey.name,
            key    : parsedKey.tags.key,
          });
        });

        return asyncCallback();
      })
    },
    // 获取数据类型
    function(asyncCallback) {
      async.eachLimit(data, 10, function(d, eachCallback) {
        res.locals.cacheDB.type(d.fullKey, function(err, cacheRes) {
          if (err) return eachCallback(err);

          d.type = cacheRes;

          return eachCallback()
        });
      }, asyncCallback);
    },
    // 获取过期时间
    function(asyncCallback) {
      async.eachLimit(data, 10, function(d, eachCallback) {
        res.locals.cacheDB.ttl(d.fullKey, function(err, cacheRes) {
          if (err) return eachCallback(err);

          d.ttl = parseInt(cacheRes);

          return eachCallback()
        });
      }, asyncCallback);
    },
  ], function(err) {
    if (err) return next(err);

    var ret = toolkit.initRet(data);
    return res.locals.sendJSON(ret);
  })
};

exports.delete = function(req, res, next) {
  var scope = req.params.scope;
  var key   = req.params.key;

  var cacheKey = toolkit.getWorkerCacheKey('funcCache', scope, [ 'key', key ]);

  res.locals.cacheDB.del(cacheKey, function(err) {
    if (err) return next(err);

    return res.locals.sendJSON();
  });
};
