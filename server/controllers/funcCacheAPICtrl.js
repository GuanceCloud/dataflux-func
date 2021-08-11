'use strict';

/* Builtin Modules */

/* 3rd-party Modules */
var async = require('async');

/* Project Modules */
var E       = require('../utils/serverError');
var CONFIG  = require('../utils/yamlResources').get('CONFIG');
var toolkit = require('../utils/toolkit');

/* Configure */
var LIST_KEY_LIMIT = 500;

/* Handlers */

exports.list = function(req, res, next) {
  var fuzzySearch = req.query._fuzzySearch || '';
  var scope       = req.query.scope        || '';
  var key         = req.query.key          || '';

  var data = [];
  async.series([
    // 获取相关的键（根据fuzzySearch搜索）
    function(asyncCallback) {
      if (!fuzzySearch) return asyncCallback();

      fuzzySearch = toolkit.strf('*{0}*', fuzzySearch);

      var keys = [];

      var cacheKeyPatterns = [
        toolkit.getWorkerCacheKey('funcCache', fuzzySearch, [ 'key', '*' ]),
        toolkit.getWorkerCacheKey('funcCache', '*', [ 'key', fuzzySearch ]),
      ]
      cacheKeyPatterns = toolkit.noDuplication(cacheKeyPatterns);

      async.eachSeries(cacheKeyPatterns, function(cacheKeyPattern, eachCallback) {
        res.locals.cacheDB.keys(cacheKeyPattern, LIST_KEY_LIMIT, function(err, _keys) {
          if (err) return eachCallback(err);

          keys = keys.concat(_keys);

          return eachCallback();
        })
      }, function(err) {
        if (err) return asyncCallback(err);

        keys.sort();
        keys = toolkit.noDuplication(keys);
        keys = keys.slice(0, LIST_KEY_LIMIT);
        keys.forEach(function(key) {
          var parsedKey = toolkit.parseCacheKey(key);

          data.push({
            fullKey: key,
            scope  : parsedKey.name,
            key    : parsedKey.tags.key,
          });
        });

        return asyncCallback();
      });
    },
    // 获取相关的键（根据scope, key搜索）
    function(asyncCallback) {
      if (fuzzySearch) return asyncCallback();

      scope = scope ? toolkit.strf('*{0}*', scope) : '*';
      key   = key   ? toolkit.strf('*{0}*', key)   : '*';

      var cacheKeyPattern = toolkit.getWorkerCacheKey('funcCache', scope, [ 'key', key ]);
      res.locals.cacheDB.keys(cacheKeyPattern, LIST_KEY_LIMIT, function(err, keys) {
        if (err) return asyncCallback(err);

        keys.sort();
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
    // 获取占用内存
    function(asyncCallback) {
      async.eachLimit(data, 10, function(d, eachCallback) {
        res.locals.cacheDB.run('MEMORY', 'USAGE', d.fullKey, 'SAMPLES', '0', function(err, cacheRes) {
          // 本内容即使出错也不终止
          if (err) return eachCallback(err);

          d.memoryUsage = parseInt(cacheRes);

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
