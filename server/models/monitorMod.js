'use strict';

/* Built-in Modules */

/* 3rd-party Modules */
var async  = require('async');

/* Project Modules */
var E           = require('../utils/serverError');
var CONFIG      = require('../utils/yamlResources').get('CONFIG');
var toolkit     = require('../utils/toolkit');
var modelHelper = require('../utils/modelHelper');
var routeLoader = require('../utils/routeLoader');

/* Init */
var TABLE_OPTIONS = exports.TABLE_OPTIONS = {
};

exports.createModel = function(locals) {
  return new EntityModel(locals);
};

var EntityModel = exports.EntityModel = modelHelper.createSubModel(TABLE_OPTIONS);

var GROUP_TIME = 10 * 60;

/*
 * System stats data in Redis
 */
EntityModel.prototype.getSystemMetrics = function(callback) {
  var self = this;

  var data = {};

  self.locals.cacheDB.skipLog = true;
  async.parallel([
    // Get CPU/Memory usage
    function(asyncCallback) {
      var metricScaleMap = {
        serverCPUPercent        : 1,
        serverMemoryRSS         : 1024 * 1024,
        serverMemoryHeapTotal   : 1024 * 1024,
        serverMemoryHeapUsed    : 1024 * 1024,
        serverMemoryHeapExternal: 1024 * 1024,
        workerCPUPercent        : 1,
        workerMemoryPSS         : 1024 * 1024,
      };

      async.eachOfSeries(metricScaleMap, function(scale, metric, eachCallback) {
        data[metric] = {};

        var cacheKeyPattern = toolkit.getMonitorCacheKey('monitor', 'systemMetrics', ['metric', metric, 'hostname', '*']);
        var opt = { timeUnit: 'ms', groupTime: GROUP_TIME, scale: scale, fillZero: true };

        self.locals.cacheDB.tsGetByPattern(cacheKeyPattern, opt, function(err, tsDataMap) {
          if (err) return eachCallback(err);

          for (var k in tsDataMap) {
            var hostname = toolkit.parseCacheKey(k).tags.hostname;
            data[metric][hostname] = tsDataMap[k];
          }

          return eachCallback();
        });
      }, asyncCallback);
    },
    // Get DB Disk usage
    function(asyncCallback) {
      var dbMetrics = [
        'dbTableTotalUsed',
        'dbTableDataUsed',
        'dbTableIndexUsed',
      ];
      async.eachSeries(dbMetrics, function(metric, eachCallback) {
        data[metric] = {};

        var cacheKeyPattern = toolkit.getMonitorCacheKey('monitor', 'systemMetrics', ['metric', metric, 'table', '*']);
        var opt = { timeUnit: 'ms', groupTime: GROUP_TIME, scale: 1024 * 1024, fillZero: true };

        self.locals.cacheDB.tsGetByPattern(cacheKeyPattern, opt, function(err, tsDataMap) {
          if (err) return eachCallback(err);

          for (var k in tsDataMap) {
            var table = toolkit.parseCacheKey(k).tags.table;
            data[metric][table] = tsDataMap[k];
          }

          return eachCallback();
        });
      }, asyncCallback);
    },
    // Get Cache DB usage
    function(asyncCallback) {
      var metricScaleMap = {
        cacheDBKeyUsed   : 1,
        cacheDBMemoryUsed: 1024 * 1024,
      };

      async.eachOfSeries(metricScaleMap, function(scale, metric, eachCallback) {
        var cacheKey = toolkit.getMonitorCacheKey('monitor', 'systemMetrics', ['metric', metric]);
        var opt = { timeUnit: 'ms', groupTime: GROUP_TIME, scale: scale, fillZero: true };

        self.locals.cacheDB.tsGet(cacheKey, opt, function(err, tsData) {
          if (err) return eachCallback(err);

          data[metric] = tsData;
          return eachCallback();
        });
      }, asyncCallback);
    },
    // Get Func call count
    function(asyncCallback) {
      var metric = 'funcCallCount';

      data[metric] = {};

      var cacheKeyPattern = toolkit.getMonitorCacheKey('monitor', 'systemMetrics', ['metric', metric, 'funcId', '*']);
      var opt = { timeUnit: 'ms', groupTime: GROUP_TIME, agg: 'sum', fillZero: true };

      self.locals.cacheDB.tsGetByPattern(cacheKeyPattern, opt, function(err, tsDataMap) {
        if (err) return asyncCallback(err);

        for (var k in tsDataMap) {
          var funcId = toolkit.parseCacheKey(k).tags.funcId;
          data[metric][funcId] = tsDataMap[k];
        }

        return asyncCallback();
      });
    },
    // Get Delay queue length
    function(asyncCallback) {
      var metric = 'delayQueueLength';

      data[metric] = {};

      var cacheKeyPattern = toolkit.getMonitorCacheKey('monitor', 'systemMetrics', ['metric', metric, 'queue', '*']);
      var opt = { timeUnit: 'ms', groupTime: GROUP_TIME, fillZero: true };

      self.locals.cacheDB.tsGetByPattern(cacheKeyPattern, opt, function(err, tsDataMap) {
        if (err) return asyncCallback(err);

        for (var k in tsDataMap) {
          var queue = toolkit.parseCacheKey(k).tags.queue;
          data[metric][queue] = tsDataMap[k];
        }

        return asyncCallback();
      });
    },
    // Get Worker queue length
    function(asyncCallback) {
      var metric = 'workerQueueLength';

      data[metric] = {};

      var cacheKeyPattern = toolkit.getMonitorCacheKey('monitor', 'systemMetrics', ['metric', metric, 'queue', '*']);
      var opt = { timeUnit: 'ms', groupTime: GROUP_TIME, fillZero: true };

      self.locals.cacheDB.tsGetByPattern(cacheKeyPattern, opt, function(err, tsDataMap) {
        if (err) return asyncCallback(err);

        for (var k in tsDataMap) {
          var queue = toolkit.parseCacheKey(k).tags.queue;
          data[metric][queue] = tsDataMap[k];
        }

        return asyncCallback();
      });
    },
    // Get Matched route count
    function(asyncCallback) {
      var metric = 'matchedRouteCount';

      var cacheKey = toolkit.getMonitorCacheKey('monitor', 'systemMetrics', ['metric', metric, 'date', toolkit.getDateString()]);

      self.cacheDB.hgetall(cacheKey, function(err, cacheRes) {
        if (err) return asyncCallback(err);

        var parsedData = [];
        for (var route in cacheRes) {
          var count = parseInt(cacheRes[route]) || 0;
          parsedData.push([route, count]);
        }
        parsedData.sort(function(a, b) {
          return b[1] - a[1];
        });

        data[metric] = parsedData;

        return asyncCallback();
      });
    },
  ], function(err) {
    self.locals.cacheDB.skipLog = false;

    if (err) return callback(err);
    return callback(null, data);
  })
};

EntityModel.prototype.listAbnormalRequests = function(type, callback) {
  var self = this;

  var listData     = null;
  var listPageInfo = null;

  async.series([
    // 获取数据
    function(asyncCallback) {
      var cacheKey = toolkit.getMonitorCacheKey('monitor', 'abnormalRequest', ['type', type]);
      var paging   = self.locals.paging;
      self.locals.cacheDB.pagedList(cacheKey, paging, function(err, cacheRes, pageInfo) {
        if (err) return asyncCallback(err);

        listData     = cacheRes;
        listPageInfo = pageInfo;

        return asyncCallback();
      });
    },
    // 补充用户信息
    function(asyncCallback) {
      var userIds = listData.reduce(function(acc, x) {
        if (x.userId) {
          acc.push(x.userId);
        }
        return acc;
      }, []);

      if (toolkit.isNothing(userIds)) return asyncCallback();

      var sql = toolkit.createStringBuilder();
      sql.append('SELECT');
      sql.append('   u.id       AS u_id');
      sql.append('  ,u.username AS u_username');
      sql.append('  ,u.name     AS u_name');
      sql.append('  ,u.mobile   AS u_mobile');

      sql.append('FROM wat_main_user AS u');

      sql.append('WHERE');
      sql.append('  u.id IN (?)');

      var sqlParams = [userIds];
      self.db.query(sql, sqlParams, function(err, dbRes) {
        if (err) return asyncCallback(err);

        var userIdMap = toolkit.arrayElementMap(dbRes, 'u_id');

        listData.forEach(function(d) {
          var user = userIdMap[d.userId];
          if (user) {
            Object.assign(d, user);
          }
        });

        return asyncCallback();
      });
    },
    // 补充路由信息
    function(asyncCallback) {
      listData.forEach(function(d) {
        var key   = `${d.reqMethod.toUpperCase()} ${d.reqRoute}`;
        var route = routeLoader.getRoute(key);
        if (route) {
          d.reqRouteName = route.name;
        }
      });

      return asyncCallback();
    },
  ], function(err) {
    if (err) return callback(err);
    return callback(null, listData, listPageInfo);
  })
};
