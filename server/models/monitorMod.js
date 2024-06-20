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

  // 所有 queue 列表
  var queues = toolkit.range(10);

  // 所有 hostname 列表
  var hostnames = [];

  // 所有数据库表
  var tables = [];

  // 所有最近被调用函数 ID
  var recentCalledFuncIds = [];

  async.series([
    // 获取所有 hostname 列表
    function(asyncCallback) {
      var cacheKey = toolkit.getMonitorCacheKey('heartbeat', 'serviceInfo');
      self.locals.cacheDB.hkeysExpires(cacheKey, CONFIG._MONITOR_REPORT_EXPIRES, function(err, cacheRes) {
        if (err) return asyncCallback(err);

        hostnames = toolkit.noDuplication(cacheRes.map(function(field) {
          return toolkit.parseColonTags(field).hostname;
        }));

        return asyncCallback();
      });
    },
    // 获取所有数据库表名
    function(asyncCallback) {
      var sql = 'SHOW TABLES';
      self.locals.db.query(sql, null, function(err, dbRes) {
        if (err) return asyncCallback(err);

        dbRes.forEach(function(d) {
          tables.push(Object.values(d).pop());
        });

        return asyncCallback();
      });
    },
    // 获取最近被调用函数 ID
    function(asyncCallback) {
      var cacheKey = toolkit.getMonitorCacheKey('monitor', 'recentCalledFuncIds')
      self.locals.cacheDB.hgetallExpires(cacheKey, CONFIG.REDIS_TS_MAX_AGE, function(err, cacheRes) {
        if (err) return asyncCallback(err);

        recentCalledFuncIds = Object.keys(cacheRes);

        return asyncCallback();
      })
    },
    // 查询指标数据
    function(asyncCallback) {
      async.parallel([
        // Get CPU/Memory usage
        function(parallelCallback) {
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

            var cacheKeys = hostnames.map(function(hostname) {
              return toolkit.getMonitorCacheKey('monitor', 'systemMetrics', ['metric', metric, 'hostname', hostname]);
            });

            var opt = { timeUnit: 'ms', groupTime: GROUP_TIME, scale: scale, fillZero: true };
            self.locals.cacheDB.tsMget(cacheKeys, opt, function(err, tsDataMap) {
              if (err) return eachCallback(err);

              for (var k in tsDataMap) {
                var hostname = toolkit.parseCacheKey(k).tags.hostname;
                data[metric][hostname] = tsDataMap[k];
              }

              return eachCallback();
            });
          }, parallelCallback);
        },
        // Get DB Disk usage
        function(parallelCallback) {
          var dbMetrics = [
            'dbTableTotalUsed',
            'dbTableDataUsed',
            'dbTableIndexUsed',
          ];
          async.eachSeries(dbMetrics, function(metric, eachCallback) {
            data[metric] = {};

            var cacheKeys = tables.map(function(table) {
              return toolkit.getMonitorCacheKey('monitor', 'systemMetrics', ['metric', metric, 'table', table]);
            });

            var opt = { timeUnit: 'ms', groupTime: GROUP_TIME, scale: 1024 * 1024, fillZero: true };
            self.locals.cacheDB.tsMget(cacheKeys, opt, function(err, tsDataMap) {
              if (err) return eachCallback(err);

              for (var k in tsDataMap) {
                var table = toolkit.parseCacheKey(k).tags.table;
                data[metric][table] = tsDataMap[k];
              }

              return eachCallback();
            });
          }, parallelCallback);
        },
        // Get Cache DB usage
        function(parallelCallback) {
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
          }, parallelCallback);
        },
        // Get Func call count
        function(parallelCallback) {
          var metric = 'funcCallCount';

          data[metric] = {};

          var cacheKeys = recentCalledFuncIds.map(function(funcId) {
            return toolkit.getMonitorCacheKey('monitor', 'systemMetrics', ['metric', metric, 'funcId', funcId]);
          });

          var opt = { timeUnit: 'ms', groupTime: GROUP_TIME, agg: 'sum', fillZero: true };
          self.locals.cacheDB.tsMget(cacheKeys, opt, function(err, tsDataMap) {
            if (err) return parallelCallback(err);

            for (var k in tsDataMap) {
              var funcId = toolkit.parseCacheKey(k).tags.funcId;
              data[metric][funcId] = tsDataMap[k];
            }

            return parallelCallback();
          });
        },
        // Get Delay queue length
        function(parallelCallback) {
          var metric = 'delayQueueLength';

          data[metric] = {};

          var cacheKeys = queues.map(function(queue) {
            return toolkit.getMonitorCacheKey('monitor', 'systemMetrics', ['metric', metric, 'queue', queue]);
          });

          var opt = { timeUnit: 'ms', groupTime: GROUP_TIME, fillZero: true };
          self.locals.cacheDB.tsMget(cacheKeys, opt, function(err, tsDataMap) {
            if (err) return parallelCallback(err);

            for (var k in tsDataMap) {
              var queue = toolkit.parseCacheKey(k).tags.queue;
              data[metric][queue] = tsDataMap[k];
            }

            return parallelCallback();
          });
        },
        // Get Worker queue length
        function(parallelCallback) {
          var metric = 'workerQueueLength';

          data[metric] = {};

          var cacheKeys = queues.map(function(queue) {
            return toolkit.getMonitorCacheKey('monitor', 'systemMetrics', ['metric', metric, 'queue', queue]);
          });

          var opt = { timeUnit: 'ms', groupTime: GROUP_TIME, fillZero: true };
          self.locals.cacheDB.tsMget(cacheKeys, opt, function(err, tsDataMap) {
            if (err) return parallelCallback(err);

            for (var k in tsDataMap) {
              var queue = toolkit.parseCacheKey(k).tags.queue;
              data[metric][queue] = tsDataMap[k];
            }

            return parallelCallback();
          });
        },
        // Get Matched route count
        function(parallelCallback) {
          var metric = 'matchedRouteCount';

          var cacheKey = toolkit.getMonitorCacheKey('monitor', 'systemMetrics', ['metric', metric, 'date', toolkit.getDateString()]);

          self.cacheDB.hgetall(cacheKey, function(err, cacheRes) {
            if (err) return parallelCallback(err);

            var parsedData = [];
            for (var route in cacheRes) {
              var count = parseInt(cacheRes[route]) || 0;
              parsedData.push([route, count]);
            }
            parsedData.sort(function(a, b) {
              return b[1] - a[1];
            });

            data[metric] = parsedData;

            return parallelCallback();
          });
        },
      ], asyncCallback)
    },
  ], function(err) {
    self.locals.cacheDB.skipLog = false;

    if (err) return callback(err);
    return callback(null, data);
  });
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
