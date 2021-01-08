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

exports.createModel = function(locals) {
  return new EntityModel(locals);
};

var EntityModel = exports.EntityModel = modelHelper.createSubModel(TABLE_OPTIONS);

/*
 * System stats data in Redis
 */
EntityModel.prototype.getSysStats = function(callback) {
  var self = this;

  var sysStats = {};

  self.locals.cacheDB.skipLog = true;
  async.series([
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
        sysStats[metric] = {};

        var cacheKeyPattern = toolkit.getCacheKey('monitor', 'sysStats', ['metric', metric, 'hostname', '*']);
        var opt = { timeUnit: 'ms', groupTime: 60, scale: scale };

        self.locals.cacheDB.tsGetByPattern(cacheKeyPattern, opt, function(err, tsDataMap) {
          if (err) return eachCallback(err);

          for (var k in tsDataMap) {
            var hostname = toolkit.parseCacheKey(k).tags.hostname;
            sysStats[metric][hostname] = tsDataMap[k];
          }

          return eachCallback();
        });
      }, asyncCallback);
    },
    // Get DB Disk usage
    function(asyncCallback) {
      var metric = 'dbDiskUsed';

      sysStats[metric] = {};

      var cacheKeyPattern = toolkit.getCacheKey('monitor', 'sysStats', ['metric', metric, 'table', '*']);
      var opt = { timeUnit: 'ms', groupTime: 60, scale: 1024 * 1024 };

      self.locals.cacheDB.tsGetByPattern(cacheKeyPattern, opt, function(err, tsDataMap) {
        if (err) return asyncCallback(err);

        for (var k in tsDataMap) {
          var table = toolkit.parseCacheKey(k).tags.table;
          sysStats[metric][table] = tsDataMap[k];
        }

        return asyncCallback();
      });
    },
    // Get Cache DB usage
    function(asyncCallback) {
      var metricScaleMap = {
        cacheDBKeyUsed   : 1,
        cacheDBMemoryUsed: 1024 * 1024,
      };

      async.eachOfSeries(metricScaleMap, function(scale, metric, eachCallback) {
        var cacheKey = toolkit.getCacheKey('monitor', 'sysStats', ['metric', metric]);
        var opt = { timeUnit: 'ms', groupTime: 60, scale: scale };

        self.locals.cacheDB.tsGet(cacheKey, opt, function(err, tsData) {
          if (err) return eachCallback(err);

          sysStats[metric] = tsData;
          return eachCallback();
        });
      }, asyncCallback);
    },
    // Get Worker queue length
    function(asyncCallback) {
      var metric = 'workerQueueLength';

      sysStats[metric] = {};

      var cacheKeyPattern = toolkit.getCacheKey('monitor', 'sysStats', ['metric', metric, 'queueName', '*']);
      var opt = { timeUnit: 'ms', groupTime: 60 };

      self.locals.cacheDB.tsGetByPattern(cacheKeyPattern, opt, function(err, tsDataMap) {
        if (err) return asyncCallback(err);

        for (var k in tsDataMap) {
          var queueName = toolkit.parseCacheKey(k).tags.queueName;
          sysStats[metric][queueName] = tsDataMap[k];
        }

        return asyncCallback();
      });
    },
    // Get Cache key prefixs
    function(asyncCallback) {
      var metric = 'cacheDBKeyCountByPrefix';

      sysStats[metric] = {};

      var cacheKeyPattern = toolkit.getCacheKey('monitor', 'sysStats', ['metric', metric, 'prefix', '*']);
      var opt = { timeUnit: 'ms', groupTime: 60 };

      self.locals.cacheDB.tsGetByPattern(cacheKeyPattern, opt, function(err, tsDataMap) {
        if (err) return asyncCallback(err);

        for (var k in tsDataMap) {
          var prefix = toolkit.parseCacheKey(k).tags.prefix;
          prefix = toolkit.fromBase64(prefix);
          sysStats[metric][prefix] = tsDataMap[k];
        }

        return asyncCallback();
      });
    },
    // Get Matched route count
    function(asyncCallback) {
      var metric = 'matchedRouteCount';

      var cacheKey = toolkit.getCacheKey('monitor', 'sysStats', ['metric', metric, 'date', toolkit.getDateString()]);

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

        sysStats[metric] = parsedData;

        return asyncCallback();
      });
    },
  ], function(err) {
    self.locals.cacheDB.skipLog = false;

    if (err) return callback(err);
    return callback(null, sysStats);
  })
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
