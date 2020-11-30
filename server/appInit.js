'use strict';

/* Builtin Modules */
var os = require('os');

/* 3rd-party Modules */
var async = require('async');
var mysql = require('mysql');

/* Project Modules */
var g             = require('./utils/g');
var E             = require('./utils/serverError');
var yamlResources = require('./utils/yamlResources');
var modelHelper   = require('./utils/modelHelper');
var toolkit       = require('./utils/toolkit');

var CONFIG = yamlResources.get('CONFIG');

exports.convertJSONResponse = function(ret) {
  // Will disabled by `"X-Wat-Disable-Json-Response-Converting"` Header
  return ret;
};

exports.beforeAppCreate = function(callback) {
  var APP_NAME_SERVER = CONFIG.APP_NAME + '-server';
  var APP_NAME_WORKER = CONFIG.APP_NAME + '-worker';

  toolkit.getCacheKey = function(topic, name, tags, appName) {
    var cacheKey = toolkit._getCacheKey(topic, name, tags);

    // Add app name to cache key
    appName = appName || APP_NAME_SERVER;
    var cacheKeyWithAppName = toolkit.strf('{0}#{1}', appName, cacheKey);
    return cacheKeyWithAppName;
  };

  toolkit.getWorkerCacheKey = function(topic, name, tags) {
    return toolkit.getCacheKey(topic, name, tags, APP_NAME_WORKER);
  };

  toolkit.getWorkerQueue = function(name) {
    var workerQueue = toolkit._getWorkerQueue(name);

    // Add app name to cache key
    var workerQueueWithPrefix = toolkit.strf('{0}#{1}', APP_NAME_WORKER, workerQueue);
    return workerQueueWithPrefix;
  };

  toolkit.parseCacheKey = function(cacheKey) {
    var cacheKeyInfo = toolkit._parseCacheKey(cacheKey);

    var appNameTopicParts = cacheKeyInfo.topic.split('#');
    cacheKeyInfo.appName = appNameTopicParts[0];
    cacheKeyInfo.topic   = appNameTopicParts[1];

    return cacheKeyInfo;
  };

  var loadDatabaseTimezone = function(callback) {
    var mysqlConfig = {
      host    : CONFIG.MYSQL_HOST,
      port    : CONFIG.MYSQL_PORT,
      user    : CONFIG.MYSQL_USER,
      password: CONFIG.MYSQL_PASSWORD,
    };
    var conn = mysql.createConnection(mysqlConfig);
    conn.query("SHOW VARIABLES LIKE '%time_zone%'", function(err, dbRes) {
      if (err) return callback(err);

      var serverSettings = {};
      dbRes.forEach(function(d) {
        serverSettings[d['Variable_name']] = d['Value'];
      });

      var timezone       = serverSettings['time_zone'];
      var systemTimezone = serverSettings['system_time_zone'];

      if (!timezone || timezone.toUpperCase() === 'SYSTEM') {
        timezone = systemTimezone;
      }

      switch(timezone) {
        case 'UTC':
        case 'GMT':
          timezone = '+00:00';
          break;

        case 'CST':
        case 'Asia/Shanghai':
          timezone = '+08:00';
          break;
      }

      conn.end();

      if (timezone) {
        yamlResources.set('CONFIG', '_MYSQL_TIMEZONE', timezone);
      }
      console.log('Database Timezone: ' + timezone);

      return callback();
    });
  };

  /********** Content for YOUR project below **********/

  async.series([
    loadDatabaseTimezone,
  ], function(err) {
    if (err) throw err;

    return callback();
  });
};

exports.afterAppCreated = function(app, server) {
  g.runUpTime = parseInt(Date.now() / 1000);

  function getTimestampMsByInterval(interval) {
    var timestampMs = Date.now() + 1000;
    timestampMs = timestampMs - timestampMs % (interval * 1000);

    return timestampMs;
  }

  // Heartbeat
  function recordHeartbeat() {
    var heartbeatCacheKey = toolkit.getCacheKey('monitor', 'heartbeat');

    var serverTimestamp            = parseInt(Date.now() / 1000);
    var validHeartbeatMinTimestamp = serverTimestamp - (300 * 1000);

    async.series([
      function(asyncCallback) {
        app.locals.cacheDB._run('ZADD', heartbeatCacheKey, serverTimestamp, os.hostname(), asyncCallback);
      },
      function(asyncCallback) {
        var validHeartbeatMinTimestamp = serverTimestamp - (300 * 1000);
        app.locals.cacheDB._run('ZREMRANGEBYSCORE', heartbeatCacheKey, '-inf', validHeartbeatMinTimestamp, asyncCallback);
      },
    ]);
  }
  recordHeartbeat();

  setInterval(recordHeartbeat, 30 * 1000);

  // CPU/Memory Usage
  var startCPUUsage = process.cpuUsage();

  function recordCPUMemoryUsage() {
    var timestampMs = getTimestampMsByInterval(CONFIG._MONITOR_CPU_MEM_USAGE_CHECK_INTERVAL);

    var currentMemoryUsage = process.memoryUsage();
    var currentCPUUsage    = process.cpuUsage(startCPUUsage);
    var cpuPercent         = (currentCPUUsage.user + currentCPUUsage.system) / (CONFIG._MONITOR_CPU_MEM_USAGE_CHECK_INTERVAL * 1000 * 1000);

    // Update `startCPUUsage` for next tick.
    startCPUUsage = process.cpuUsage();

    var cpuMemoryUsageData = {
      serverCPUPercent        : parseFloat(cpuPercent.toFixed(4)),
      serverMemoryRSS         : currentMemoryUsage.rss,
      serverMemoryHeapTotal   : currentMemoryUsage.heapTotal,
      serverMemoryHeapUsed    : currentMemoryUsage.heapUsed,
      serverMemoryHeapExternal: currentMemoryUsage.external,
    };
    async.eachOfLimit(cpuMemoryUsageData, 5, function(value, metric, eachCallback) {
      var cacheKey = toolkit.getCacheKey('monitor', 'sysStats', [
            'metric', metric,
            'hostname', os.hostname()]);

      async.series([
        function(asyncCallback) {
          app.locals.cacheDB.lpush(cacheKey, JSON.stringify([timestampMs, value]), asyncCallback);
        },
        function(asyncCallback) {
          var keepPoints = parseInt(CONFIG._MONITOR_CPU_MEM_USAGE_KEEP_DURATION / CONFIG._MONITOR_CPU_MEM_USAGE_CHECK_INTERVAL) - 1;
          app.locals.cacheDB.ltrim(cacheKey, 0, keepPoints, asyncCallback);
        },
        function(asyncCallback) {
          app.locals.cacheDB.expire(cacheKey, CONFIG._MONITOR_CPU_MEM_USAGE_KEEP_DURATION, eachCallback);
        },
      ], eachCallback);
    });
  };
  recordCPUMemoryUsage();

  setTimeout(function() {
    setInterval(recordCPUMemoryUsage, CONFIG._MONITOR_CPU_MEM_USAGE_CHECK_INTERVAL * 1000);
  }, Date.now() % (CONFIG._MONITOR_CPU_MEM_USAGE_CHECK_INTERVAL * 1000));

  // Cache Usage
  function recordCacheUsage() {
    var timestampMs = getTimestampMsByInterval(CONFIG._MONITOR_CACHE_USAGE_CHECK_INTERVAL);

    var cacheUsageData = {
      cacheDBKeyUsed   : null,
      cacheDBMemoryUsed: null,
    };

    async.series([
      function(asyncCallback) {
        app.locals.cacheDB.dbsize(function(err, cacheRes) {
          if (err) return asyncCallback(err);

          cacheUsageData.cacheDBKeyUsed = parseInt(cacheRes) || null;

          return asyncCallback();
        });
      },
      function(asyncCallback) {
        app.locals.cacheDB.info(function(err, cacheRes) {
          if (err) return asyncCallback(err);

          cacheUsageData.cacheDBMemoryUsed = parseInt(cacheRes.match(/used_memory:(\d+)/)[1]) || null;

          return asyncCallback();
        });
      },
      function(asyncCallback) {
        async.eachOfLimit(cacheUsageData, 5, function(value, metric, eachCallback) {
          var cacheKey = toolkit.getCacheKey('monitor', 'sysStats', [
                'metric', metric,
                'hostname', os.hostname()]);

          async.series([
            function(innerCallback) {
              app.locals.cacheDB.lpush(cacheKey, JSON.stringify([timestampMs, value]), innerCallback);
            },
            function(innerCallback) {
              var keepPoints = parseInt(CONFIG._MONITOR_CACHE_USAGE_KEEP_DURATION / CONFIG._MONITOR_CACHE_USAGE_CHECK_INTERVAL) - 1;
              app.locals.cacheDB.ltrim(cacheKey, 0, keepPoints, innerCallback);
            },
            function(innerCallback) {
              app.locals.cacheDB.expire(cacheKey, CONFIG._MONITOR_CACHE_USAGE_KEEP_DURATION, eachCallback);
            },
          ], eachCallback);
        });
      },
    ]);
  };
  recordCacheUsage();

  setTimeout(function() {
    setInterval(recordCacheUsage, CONFIG._MONITOR_CACHE_USAGE_CHECK_INTERVAL * 1000);
  }, Date.now() % (CONFIG._MONITOR_CACHE_USAGE_CHECK_INTERVAL * 1000));

  // Cache Key count by prefix
  function recordCacheKeyCountByPrefix() {
    var keyPrefixCountMap = {};

    var nextCursor  = 0;
    async.doUntil(function(untilCallback) {
      app.locals.cacheDB._run('scan', nextCursor, function(err, dbRes) {
        if (err) return untilCallback(err);

        nextCursor = dbRes[0];

        var keys = dbRes[1];
        if (keys && Array.isArray(keys) && keys.length > 0) {
          keys.forEach(function(key) {
            var prefix = null;
            if (key.indexOf(CONFIG.APP_NAME) === 0) {
              prefix = key.split(':')[0];
            } else {
              prefix = key.slice(0, 10) + '...';
            }

            if (prefix) {
              if (!keyPrefixCountMap[prefix]) {
                keyPrefixCountMap[prefix] = 1;
              } else {
                keyPrefixCountMap[prefix] += 1;
              }
            }
          });
        }

        setTimeout(untilCallback, 1000);
      });

    }, function() {
      return parseInt(nextCursor) === 0;

    }, function(err) {
      if (!err) {
        var cacheKey = toolkit.getCacheKey('monitor', 'sysStats', [
              'metric', 'cacheDBKeyCountByPrefix']);

        app.locals.cacheDB.del(cacheKey, function(err) {
          if (!err) {
            app.locals.cacheDB.hmset(cacheKey, keyPrefixCountMap);
          }
        });
      }
    });
  };
  recordCacheKeyCountByPrefix()

  setInterval(recordCacheKeyCountByPrefix, 15 * 60 * 1000);

  // Worker Queue Length
  function recordWorkerQueueLength() {
    var timestampMs = getTimestampMsByInterval(CONFIG._MONITOR_WORKER_QUEUE_LENGTH_CHECK_INTERVAL);

    async.eachLimit(CONFIG._MONITOR_WORKER_QUEUE_LIST, 5, function(queueName, eachCallback) {
      var cacheKey = toolkit.getCacheKey('monitor', 'sysStats', [
            'metric', 'workerQueueLength',
            'queueName', queueName,
            'hostname', os.hostname()]);
      var workerQueueLength = 0;
      async.series([
        function(asyncCallback) {
          var workerQueue = toolkit.getWorkerQueue(queueName);
          app.locals.cacheDB.llen(workerQueue, function(err, cacheRes) {
            if (err) return asyncCallback(err);

            workerQueueLength = parseInt(cacheRes);

            return asyncCallback();
          });
        },
        function(asyncCallback) {
          app.locals.cacheDB.lpush(cacheKey, JSON.stringify([timestampMs, workerQueueLength]), asyncCallback);
        },
        function(asyncCallback) {
          var keepPoints = parseInt(CONFIG._MONITOR_WORKER_QUEUE_LENGTH_KEEP_DURATION / CONFIG._MONITOR_WORKER_QUEUE_LENGTH_CHECK_INTERVAL) - 1;
          app.locals.cacheDB.ltrim(cacheKey, 0, keepPoints, asyncCallback);
        },
        function(asyncCallback) {
          app.locals.cacheDB.expire(cacheKey, CONFIG._MONITOR_WORKER_QUEUE_LENGTH_KEEP_DURATION, eachCallback);
        },
      ], eachCallback);
    });
  };
  recordWorkerQueueLength();

  setTimeout(function() {
    setInterval(recordWorkerQueueLength, CONFIG._MONITOR_WORKER_QUEUE_LENGTH_CHECK_INTERVAL * 1000);
  }, Date.now() % (CONFIG._MONITOR_WORKER_QUEUE_LENGTH_CHECK_INTERVAL * 1000));

  /********** Content for YOUR project below **********/

  var path    = require('path');
  var moment  = require('moment');
  var request = require('request');
  var fs      = require('fs-extra');

  var celeryHelper = require('./utils/extraHelpers/celeryHelper');
  var WATClient    = require('../sdk/wat_sdk').WATClient;
  var IMAGE_INFO   = require('../image-info.json');

  /***** 启动时自动运行 *****/
  function printError(err) {
    if (!err || 'string' !== typeof err.stack) return;

    if (err.isWarning) {
      app.locals.logger.warning(err.message);
    } else {
      err.stack.split('\n').forEach(function(line) {
        app.locals.logger.error(line);
      });
    }
  }

  // 重置管理员账号密码
  async.series([
    function(asyncCallback) {
      var lockKey   = toolkit.getCacheKey('lock', 'resetAdminPassword');
      var lockValue = Date.now().toString();
      var lockAge   = 30;

      app.locals.cacheDB.lock(lockKey, lockValue, lockAge, function(err, cacheRes) {
        if (err) return asyncCallback(err);

        if (!cacheRes) {
          var e = new Error('Startup process is already launched.');
          e.isWarning = true;
          return asyncCallback(e);
        }

        return asyncCallback();
      });
    },
    function(asyncCallback) {
      if (!process.env.RESET_ADMIN_USERNAME || !process.env.RESET_ADMIN_PASSWORD) return asyncCallback();

      var RESET_ADMIN_ID = 'u-admin';
      var adminPasswordHash = toolkit.getSaltedPasswordHash(
          RESET_ADMIN_ID, process.env.RESET_ADMIN_PASSWORD, CONFIG.SECRET);

      var sql = toolkit.createStringBuilder();
      sql.append('UPDATE wat_main_user');
      sql.append('SET');
      sql.append('   username     = ?');
      sql.append('  ,passwordHash = ?');
      sql.append('WHERE');
      sql.append('  id = ?')

      var sqlParams = [
        process.env.RESET_ADMIN_USERNAME,
        adminPasswordHash,
        RESET_ADMIN_ID,
      ];
      app.locals.db.query(sql, sqlParams, asyncCallback);
    },
  ], printError);

  // 自动导入脚本包
  async.series([
    // 获取锁
    function(asyncCallback) {
      var lockKey   = toolkit.getCacheKey('lock', 'autoImportPackage');
      var lockValue = Date.now().toString();
      var lockAge   = CONFIG._FUNC_PKG_AUTO_INSTALL_LOCK_AGE;

      app.locals.cacheDB.lock(lockKey, lockValue, lockAge, function(err, cacheRes) {
        if (err) return asyncCallback(err);

        if (!cacheRes) {
          var e = new Error('Function package auto importing is just launched');
          e.isWarning = true;
          return asyncCallback(e);
        }

        return asyncCallback();
      });
    },
    // 安装脚本包
    function(asyncCallback) {
      // 获取脚本包列表
      var funcPackagePath = path.join(__dirname, '../func-pkg/');
      var funcPackages = fs.readdirSync(funcPackagePath);
      funcPackages = funcPackages.filter(function(fileName) {
        return fileName.split('.').pop() === 'func-pkg';
      });

      if (toolkit.isNothing(funcPackages)) return asyncCallback();

      // 依次导入
      var watClient = new WATClient({host: 'localhost', port: 8088});

      // 本地临时认证令牌
      app.locals.localhostTempAuthTokenMap = app.locals.localhostTempAuthTokenMap || {};

      async.eachSeries(funcPackages, function(funcPackage, eachCallback) {
        app.locals.logger.info('Auto install function package: {0}', funcPackage);

        var filePath = path.join(funcPackagePath, funcPackage);
        var fileBuffer = fs.readFileSync(path.join(filePath));

        // 使用本地临时认证令牌认证
        var localhostTempAuthToken = toolkit.genRandString();
        app.locals.localhostTempAuthTokenMap[localhostTempAuthToken] = true;

        var headers = {};
        headers[CONFIG._WEB_LOCALHOST_TEMP_AUTH_TOKEN_HEADERL] = localhostTempAuthToken;

        var opt = {
          headers   : headers,
          path      : '/api/v1/script-sets/do/import',
          fileBuffer: fileBuffer,
          filename  : funcPackage,
        }
        watClient.upload(opt, function(err, apiRes) {
          if (err) return eachCallback(err);

          if (!apiRes.ok) {
            return eachCallback(new Error('Auto inport package failed: ' + apiRes.message));
          }

          return eachCallback();
        });
      }, asyncCallback);
    },
  ], printError);
};

exports.beforeReponse = function(req, res, reqCost, statusCode, respContent, respType) {
  /********** Content for YOUR project below **********/

  // 操作记录
  if (res.locals._operationRecord) {
    var operationRecordMod = require('./models/operationRecordMod');

    var EXCLUDE_ROUTE_PATTERNS = [
      '*', '/', '/api',
      '/api/v1/do/ping',
      '/api/v1/func-list',
      '/api/v1/func-tag-list',
      '/api/v1/auth-link-func-list',
      '/api/v1/func-system-config',
      '/api/v1/upgrade-info',
      '/api/v1/self-diagnose',
      /\/do\/get$/g,
      /\/do\/list$/g,
      /^\/api\/v1\/func\//g,
      /^\/api\/v1\/al\//g,
      /^\/api\/v1\/bat\//g,
      /^\/api\/v1\/func-draft\//g,
      /^\/api\/v1\/func-result\//g,
      /^\/api\/v1\/monitor\//g,
    ];

    var shouldRecordOperation = true;
    var reqRoute = req.route.path;

    // 【特殊处理】由于脚本自动保存可能产生大量日志，因此忽略
    if (reqRoute === '/api/v1/scripts/:id/do/modify'
        && res.locals._operationRecord.reqBodyJSON.data.codeDraft
        && res.locals._operationRecord.reqBodyJSON.prevCodeDraftMD5) {
      shouldRecordOperation = false;

    } else {
      for (var i = 0; i < EXCLUDE_ROUTE_PATTERNS.length; i++) {
        if ('string' === typeof EXCLUDE_ROUTE_PATTERNS[i]) {
          if (EXCLUDE_ROUTE_PATTERNS[i] === reqRoute) {
            shouldRecordOperation = false;
          }

        } else {
          if (EXCLUDE_ROUTE_PATTERNS[i].exec(reqRoute)) {
            shouldRecordOperation = false;
          }
        }
      }
    }

    if (shouldRecordOperation) {
      var reqParams = null;
      if (!toolkit.isNothing(req.params)) {
        reqParams = toolkit.jsonCopy(req.params);
      }

      res.locals._operationRecord.reqRoute      = reqRoute;
      res.locals._operationRecord.reqParamsJSON = reqParams;
      res.locals._operationRecord.reqCost       = reqCost;

      res.locals._operationRecord.respStatusCode = statusCode || 200;
      res.locals._operationRecord.respBodyJSON   = respType === 'json' ? toolkit.jsonCopy(respContent) : null;

      var operationRecordModel = operationRecordMod.createModel(req, res);
      operationRecordModel.add(res.locals._operationRecord);
    }
  }
};
