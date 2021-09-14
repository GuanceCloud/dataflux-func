'use strict';

/* Builtin Modules */

/* 3rd-party Modules */
var async = require('async');

/* Project Modules */
var E       = require('../utils/serverError');
var CONFIG  = require('../utils/yamlResources').get('CONFIG');
var toolkit = require('../utils/toolkit');

/* Configure */
var LIST_KEY_LIMIT   = 500;
var PREVIEW_LIMIT_MB = 5;

/* Handlers */

function getFuncCacheKey(key) {
  var parsedKey          = toolkit.parseCacheKey(key);
  var funcCacheKeyPrefix = toolkit.getWorkerCacheKey('funcCache', parsedKey.name, [ 'key' ]);
  var funcCacheKey = key.replace(funcCacheKeyPrefix, '').replace(/:$/g, '');
  return funcCacheKey;
}

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
          var parsedKey    = toolkit.parseCacheKey(key);
          var funcCacheKey = getFuncCacheKey(key);

          data.push({
            fullKey: key,
            scope  : parsedKey.name,
            key    : funcCacheKey,
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
          var parsedKey    = toolkit.parseCacheKey(key);
          var funcCacheKey = getFuncCacheKey(key);

          data.push({
            fullKey: key,
            scope  : parsedKey.name,
            key    : funcCacheKey,
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
          if (err) return eachCallback();

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

exports.get = function(req, res, next) {
  var scope = req.params.scope;
  var key   = req.params.key;

  var cacheKey = toolkit.getWorkerCacheKey('funcCache', scope, [ 'key', key ]);

  var contentType = null;
  var content     = null;
  async.series([
    // 检查数据类型
    function(asyncCallback) {
      res.locals.cacheDB.type(cacheKey, function(err, cacheRes) {
        if (err) return asyncCallback(err);

        contentType = cacheRes;

        return asyncCallback();
      })
    },
    // 检查大小
    function(asyncCallback) {
      if (content) return asyncCallback();

      res.locals.cacheDB.run('MEMORY', 'USAGE', cacheKey, 'SAMPLES', '0', function(err, cacheRes) {
        if (err) return asyncCallback(err);

        var dataSize = parseInt(cacheRes);
        if (dataSize > 1024 * 1024 * PREVIEW_LIMIT_MB) {
          content = `<Preview of large data (over ${PREVIEW_LIMIT_MB}MB) is not supported>`;
        }

        return asyncCallback()
      });
    },
    // 获取数据
    function(asyncCallback) {
      if (content) return asyncCallback();

      switch (contentType) {
        case 'string':
          res.locals.cacheDB.get(cacheKey, function(err, cacheRes) {
            if (err) return asyncCallback(err);

            content = cacheRes;

            return asyncCallback();
          });
          break;

        case 'hash':
          res.locals.cacheDB.hgetall(cacheKey, function(err, cacheRes) {
            if (err) return asyncCallback(err);

            content = cacheRes;
            for (let k in content) {
              try { content[k] = JSON.parse(content[k]); } catch(_) {}
            }

            return asyncCallback();
          });
          break;

        case 'list':
          res.locals.cacheDB.lrange(cacheKey, 0, -1, function(err, cacheRes) {
            if (err) return asyncCallback(err);

            content = cacheRes;
            for (let i = 0; i < content.length; i++) {
              try { content[i] = JSON.parse(content[i]); } catch(_) {}
            }

            return asyncCallback();
          });
          break;

        default:
          content = `<Preview of ${contentType} data is not supported>`;
          return asyncCallback();
      }
    },
  ], function(err) {
    if (err) return next(err);

    let ret = toolkit.initRet(content)
    return res.locals.sendJSON(ret);
  });
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
