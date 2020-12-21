'use strict';

/* Builtin Modules */
var os = require('os');

/* 3rd-party Modules */
var async  = require('async');
var moment = require('moment');

/* Project Modules */
var E           = require('../utils/serverError');
var CONFIG      = require('../utils/yamlResources').get('CONFIG');
var toolkit     = require('../utils/toolkit');
var modelHelper = require('../utils/modelHelper');
var logLevels   = require('../utils/logHelper').LOG_LEVELS.levels;

var celeryHelper = require('../utils/extraHelpers/celeryHelper');

var nodePackages = require('../../package.json').dependencies;

/* Configure */
var TABLE_OPTIONS = exports.TABLE_OPTIONS = {
};

var METRICS_WITH_HOSTNAMES = [
  'serverCPUPercent',
  'serverMemoryRSS',
  'serverMemoryHeapTotal',
  'serverMemoryHeapUsed',
  'serverMemoryHeapExternal',
  'cacheDBKeyUsed',
  'cacheDBMemoryUsed',
]

exports.createModel = function(locals) {
  return new EntityModel(locals);
};

var EntityModel = exports.EntityModel = modelHelper.createSubModel(TABLE_OPTIONS);

/*
 * System stats data in Redis
 *
 * :type:timeSeries:
 *   Key : monitor@sysStats:type:timeSeries:metric:<Metric>:hostname:<Hostname>:
 *   Data: [[timestamp1, value1], [timestamp2, value2], ...]
 *
 * :type:count:
 *   Key : monitor@sysStats:type:timeSeries:metric:<Metric>:hostname:<Hostname>:date:<YYYY-MM-DD>:
 *   Data: {"key1": value1, "key2": value2}
 *
 */
EntityModel.prototype.getSysStats = function(callback) {
  var self = this;

  var sysStats = {};

  var sysStatsKeys = [];
  async.series([
    // Get all sysStats keys
    function(asyncCallback) {
      var heartbeatCacheKey = toolkit.getCacheKey('monitor', 'heartbeat');

      var serverTimestamp            = parseInt(Date.now() / 1000);
      var validHeartbeatMinTimestamp = serverTimestamp - (300 * 1000);

      self.cacheDB._run('ZRANGEBYSCORE', heartbeatCacheKey, validHeartbeatMinTimestamp, '+inf', function(err, cacheRes) {
        if (err) return asyncCallback(err);

        var hostnames = cacheRes;

        // CPU/Memory/Cache
        METRICS_WITH_HOSTNAMES.forEach(function(metric) {
          hostnames.forEach(function(hostname) {
            var cacheKey = toolkit.getCacheKey('monitor', 'sysStats', [
                  'metric', metric,
                  'hostname', hostname]);

            sysStatsKeys.push(cacheKey);
          });
        });

        // Worker Queue Length
        CONFIG._MONITOR_WORKER_QUEUE_LIST.forEach(function(queueName) {
          hostnames.forEach(function(hostname) {
            var cacheKey = toolkit.getCacheKey('monitor', 'sysStats', [
                  'metric', 'workerQueueLength',
                  'queueName', queueName,
                  'hostname', hostname]);

            sysStatsKeys.push(cacheKey);
          });
        });

        // Cache Key count by prefix
        var cacheKey = toolkit.getCacheKey('monitor', 'sysStats', [
            'metric', 'cacheDBKeyCountByPrefix']);
        sysStatsKeys.push(cacheKey);

        // Matched Route Count
        var cacheKey = toolkit.getCacheKey('monitor', 'sysStats', [
            'metric', 'matchedRouteCount',
            'date', toolkit.getDateString()]);
        sysStatsKeys.push(cacheKey);

        return asyncCallback();
      });
    },
    // Get all sysStats data
    function(asyncCallback) {
      if (toolkit.isNothing(sysStatsKeys)) return asyncCallback();

      var collectedQueueNameMap = {};

      async.eachLimit(sysStatsKeys, 5, function(key, eachCallback) {
        var keyInfo = toolkit.parseCacheKey(key);

        if (!sysStats[keyInfo.tags.metric]) {
          sysStats[keyInfo.tags.metric] = [];
        }

        switch(keyInfo.tags.metric) {
          case 'serverCPUPercent':
          case 'serverMemoryRSS':
          case 'serverMemoryHeapTotal':
          case 'serverMemoryHeapUsed':
          case 'serverMemoryHeapExternal':
            self.cacheDB.lrange(key, 0, -1, function(err, cacheRes) {
              if (err) return eachCallback(err);

              var parsedData = [];
              cacheRes.forEach(function(r) {
                parsedData.push(JSON.parse(r));
              });

              sysStats[keyInfo.tags.metric].push({
                name: keyInfo.tags.hostname,
                data: parsedData,
              });

              return eachCallback();
            });
            break;

          case 'cacheDBKeyUsed':
          case 'cacheDBMemoryUsed':
            self.cacheDB.lrange(key, 0, -1, function(err, cacheRes) {
              if (err) return eachCallback(err);

              var parsedData = [];
              cacheRes.forEach(function(r) {
                parsedData.push(JSON.parse(r));
              })

              sysStats[keyInfo.tags.metric].push({
                name: 'CACHE',
                data: parsedData,
              });

              return eachCallback();
            });
            break;

          case 'workerQueueLength':
            self.cacheDB.lrange(key, 0, -1, function(err, cacheRes) {
              if (err) return eachCallback(err);

              var parsedData = [];
              cacheRes.forEach(function(r) {
                parsedData.push(JSON.parse(r));
              })

              sysStats[keyInfo.tags.metric].push({
                name: keyInfo.tags.queueName,
                data: parsedData,
              });

              return eachCallback();
            });
            break;

          case 'cacheDBKeyCountByPrefix':
          case 'matchedRouteCount':
            self.cacheDB.hgetall(key, function(err, cacheRes) {
              if (err) return eachCallback(err);

              var parsedData = [];
              for (var k in cacheRes) if (cacheRes.hasOwnProperty(k)) {
                var v = parseInt(cacheRes[k]) || 0;
                parsedData.push([k, v]);
              }
              parsedData.sort(function(a, b) {
                return b[1] - a[1];
              });

              sysStats[keyInfo.tags.metric].push({
                name: keyInfo.tags.metric,
                data: parsedData,
              });

              return eachCallback();
            });
            break;

          default:
            eachCallback();
            break;
        }
      }, asyncCallback);
    },
  ], function(err) {
    if (err) return callback(err);

    for (var metric in sysStats) if (sysStats.hasOwnProperty(metric)) {
      var series = sysStats[metric];

      var nameDataMap = {};

      // Concat
      switch(metric) {
        case 'cacheDBKeyUsed':
        case 'cacheDBMemoryUsed':
        case 'workerQueueLength':
        case 'matchedRouteCount':
          series.forEach(function(s) {
            if (!nameDataMap[s.name]) {
              nameDataMap[s.name] = s.data;
            } else {
              nameDataMap[s.name] = nameDataMap[s.name].concat(s.data);
            }
          });

          sysStats[metric] = [];

          break;
      }

      // Sort and Compact and Replace
      for (var name in nameDataMap) if (nameDataMap.hasOwnProperty(name)) {
        var data = nameDataMap[name];

        var compactedData = [];
        switch(metric) {
          case 'cacheDBKeyUsed':
          case 'cacheDBMemoryUsed':
          case 'workerQueueLength':
            data.sort(function(a, b) {
              return a[0] - b[0];
            });

            var prevD = null;
            data.forEach(function(d) {
              if (!prevD || prevD[0] != d[0]) {
                compactedData.push(d);
                prevD = d;
              }
            });
            break;

          case 'cacheDBKeyCountByPrefix':
          case 'matchedRouteCount':
            data.sort(function(a, b) {
              return b[1] - a[1];
            });

            var prevD = null
            data.forEach(function(d) {
              if (!prevD || prevD[1] != d[1]) {
                compactedData.push(d);
                prevD = d;
              }
            });
            break;
        }

        sysStats[metric].push({
          name: name,
          data: compactedData,
        });
      }
    }

    // Sort worker queue length
    if (sysStats.workerQueueLength) {
      sysStats.workerQueueLength.sort(function(a, b) {
        var queueOrder = CONFIG._MONITOR_WORKER_QUEUE_LIST;
        return queueOrder.indexOf(a.name) - queueOrder.indexOf(b.name);
      });
    }

    return callback(null, sysStats);
  });
};

EntityModel.prototype.getServerEnvironment = function(callback) {
  var self = this;

  var cpus = os.cpus();
  var serverEnvironment = {
    osArch      : os.arch(),
    osType      : os.type(),
    osRelease   : os.release(),
    cpuModel    : cpus[0].model,
    cpuCores    : cpus.length,
    nodeVersion : process.versions.node,
    nodePackages: nodePackages,
    mysqlVersion: 'UNKNOW',
    redisVersion: 'UNKNOW',
  };

  async.series([
    // 获取Redis版本
    function(asyncCallback) {
      self.cacheDB.info(function(err, cacheRes) {
        if (err) return asyncCallback(err);

        serverEnvironment.redisVersion = cacheRes.match(/redis_version:(.+)/)[1] || 'UNKNOW';

        return asyncCallback();
      });
    },
    // 获取MySQL版本
    function(asyncCallback) {
      var sql = 'SELECT VERSION() AS mysqlVersion';
      self.db.query(sql, null, function(err, dbRes) {
        if (err) return asyncCallback(err);

        if (dbRes.length > 0) {
          serverEnvironment.mysqlVersion = dbRes[0].mysqlVersion || 'UNKNOW';
        }

        return asyncCallback();
      });
    },
  ], function(err) {
    if (err) return callback(err);

    return callback(null, serverEnvironment);
  });
};

EntityModel.prototype.clearSysStats = function(callback) {
  var self = this;

  var cacheKeyPattern = toolkit.getCacheKey('monitor', 'sysStats', ['*']);
  self.cacheDB.delByPattern(cacheKeyPattern, callback);
};

EntityModel.prototype.listQueuedTasks = function(options, callback) {
  var self = this;

  var celery = celeryHelper.createHelper(self.logger);

  options = options || {};

  var task = options.task;

  var workerQueues = null;
  var result       = [];
  async.series([
    // Get all worker queues
    function(asyncCallback) {
      celery.listQueues(function(err, celeryRes) {
        if (err) return asyncCallback(err);

        workerQueues = celeryRes;

        return asyncCallback();
      });
    },
    // Get all queued tasks
    function(asyncCallback) {
      async.eachLimit(workerQueues, 5, function(workerQueue, eachCallback) {
        celery.listQueued(workerQueue, function(err, celeryRes) {
          if (err) return eachCallback(err);

          for (var i = 0; i < celeryRes.length; i++) {
            var t = celeryRes[i];

            if (task && !toolkit.runCompare(t.headers.task, 'pattern', task)) {
              continue;
            }

            result.push({
              queue : t.properties.delivery_info.routing_key,
              origin: t.headers.origin,
              id    : t.headers.id,
              task  : t.headers.task,
              args  : t.body[0],
              kwargs: t.body[1],
              eta   : t.headers.eta,
            });
          }

          return eachCallback();
        });
      }, asyncCallback);
    },
  ], function(err) {
    if (err) return callback(err);

    // Get sample only
    var totalCount = result.length;
    result = result.slice(0, 20);

    return callback(null, result, totalCount);
  });
};

EntityModel.prototype.listScheduledTasks = function(options, callback) {
  var self = this;

  var celery = celeryHelper.createHelper(self.logger);

  options = options || {};

  var task = options.task;
  celery.listScheduled(function(err, celeryRes) {
    if (err) return callback(err);

    var result = [];

    for (var i = 0; i < celeryRes.length; i++) {
      var t = celeryRes[i];

      if (task && !toolkit.runCompare(t.headers.task, 'pattern', task)) {
        continue;
      }

      result.push({
        queue : t.properties.delivery_info.routing_key,
        origin: t.headers.origin,
        id    : t.headers.id,
        task  : t.headers.task,
        args  : t.body[0],
        kwargs: t.body[1],
        eta   : t.headers.eta,
      });
    }

    // Sort by ETA
    result.sort(function(a, b) {
      return a.eta > b.eta ? 1 : -1;
    });

    // Get sample only
    var totalCount = result.length;
    result = result.slice(0, 20);

    return callback(null, result, totalCount);
  });
};

EntityModel.prototype.listRecentTasks = function(options, callback) {
  var self = this;

  var celery = celeryHelper.createHelper(self.logger);

  options = options || {};

  var task   = options.task;
  var status = options.status;

  // Fixed in Celery for saving/publishing task result.
  // See [https://github.com/celery/celery/blob/v4.1.0/celery/backends/base.py#L518]
  var taskKeyPrefix = 'celery-task-meta-';
  var keyPattern = taskKeyPrefix + '*';

  var foundTaskResultMonitorKeys = [];

  var COUNT_LIMIT = 1000;
  var nextCursor  = 0;
  async.doUntil(function(untilCallback) {
    celery.backend.scan(nextCursor, 'MATCH', keyPattern, 'COUNT', COUNT_LIMIT, function(err, dbRes) {
      if (err) return untilCallback(err);

      nextCursor = dbRes[0];

      var taskResultMonitorKeys = dbRes[1];
      if (Array.isArray(taskResultMonitorKeys) && taskResultMonitorKeys.length > 0) {
        foundTaskResultMonitorKeys = foundTaskResultMonitorKeys.concat(taskResultMonitorKeys);
      }

      return untilCallback();
    });

  }, function() {
    return parseInt(nextCursor) === 0;

  }, function(err) {
    if (err) return callback(err);

    if (foundTaskResultMonitorKeys.length <= 0) {
      return callback(null, [], 0);
    }

    celery.backend.mget(foundTaskResultMonitorKeys, function(err, celeryRes) {
      if (err) return callback(err);

      var result = [];

      for (var i = 0; i < celeryRes.length; i++) {
        var t = JSON.parse(celeryRes[i]);

        if (task && !toolkit.runCompare(t.task, 'pattern', task)) {
          continue;
        }

        if (status && !toolkit.runCompare(t.status, 'pattern', status)) {
          continue;
        }

        result.push(t);
      }

      // Sort by start time
      result.sort(function(a, b) {
        if (!a || !b) return 0;
        return a.startTime < b.startTime ? 1 : -1;
      });

      // Get sample only
      var totalCount = result.length;
      result = result.slice(0, 20);

      return callback(null, result, totalCount);
    });
  });
};

EntityModel.prototype.pingNodes = function(callback) {
  var self = this;

  var celery = celeryHelper.createHelper(self.logger);

  var task   = 'internal.ping';
  var args   = null;
  var kwargs = null;
  celery.putTask(task, args, kwargs, null, null, function(err, celeryRes) {
    if (err) return callback(err);

    if (!celeryRes) return callback();

    var result = [];
    celeryRes.result.forEach(function(r) {
      for (var node in r) if (r.hasOwnProperty(node)) {
        var d = {
          node: node,
          ping: r[node].ok || r[node],
        };

        result.push(d);
      }
    });

    result.sort(function(a, b) {
      return a.node > b.node ? 1 : -1;
    });

    return callback(null, result);
  });
};

EntityModel.prototype.getNodesStats = function(callback) {
  var self = this;

  var celery = celeryHelper.createHelper(self.logger);

  var task   = 'internal.stats';
  var args   = null;
  var kwargs = null;
  celery.putTask(task, args, kwargs, null, null, function(err, celeryRes) {
    if (err) return callback(err);

    if (!celeryRes) return callback();

    var result = [];
    for (var node in celeryRes.result) if (celeryRes.result.hasOwnProperty(node)) {
      var d = {
        node: node
      };
      Object.assign(d, celeryRes.result[node]);

      result.push(d);
    }

    result.sort(function(a, b) {
      return a.node > b.node ? 1 : -1;
    });

    return callback(null, result);
  });
};

EntityModel.prototype.getNodesActiveQueues = function(callback) {
  var self = this;

  var celery = celeryHelper.createHelper(self.logger);

  var task   = 'internal.activeQueues';
  var args   = null;
  var kwargs = null;
  celery.putTask(task, args, kwargs, null, null, function(err, celeryRes) {
    if (err) return callback(err);

    if (!celeryRes) return callback();

    var result = [];
    for (var node in celeryRes.result) if (celeryRes.result.hasOwnProperty(node)) {
      var activeQueues = celeryRes.result[node];
      activeQueues.forEach(function(q) {
        q.shortName = q.name.split('@')[1];
      });

      var d = {
        node        : node,
        activeQueues: activeQueues,
      };
      result.push(d);
    }

    result.sort(function(a, b) {
      return a.node > b.node ? 1 : -1;
    });

    return callback(null, result);
  });
};

EntityModel.prototype.getNodesReport = function(callback) {
  var self = this;

  var celery = celeryHelper.createHelper(self.logger);

  var task   = 'internal.report';
  var args   = null;
  var kwargs = null;
  celery.putTask(task, args, kwargs, null, null, function(err, celeryRes) {
    if (err) return callback(err);

    if (!celeryRes) return callback();

    var result = [];
    for (var node in celeryRes.result) if (celeryRes.result.hasOwnProperty(node)) {
        var d = {
          node  : node,
          report: celeryRes.result[node].ok || celeryRes.result[node],
        };

        result.push(d);
    }

    result.sort(function(a, b) {
      return a.node > b.node ? 1 : -1;
    });

    return callback(null, result);
  });
};
