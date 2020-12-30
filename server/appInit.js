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

  var hostname = os.hostname();

  // Heartbeat
  function recordHeartbeat() {
    var heartbeatCacheKey = toolkit.getCacheKey('monitor', 'heartbeat', ['hostname', hostname]);
    app.locals.cacheDB.setex(heartbeatCacheKey, 3 * 60, hostname, function(err) {
      if (err) return app.locals.logger.logError(err);
    });
  }

  // Sys Stats
  var startCPUUsage = process.cpuUsage();
  function recordSysStats() {
    var currentTimestamp = parseInt(Date.now() / 1000) * 1000;

    var currentCPUUsage    = process.cpuUsage(startCPUUsage);
    var currentMemoryUsage = process.memoryUsage();

    var cpuPercent = (currentCPUUsage.user + currentCPUUsage.system) / (CONFIG._MONITOR_SYS_STATS_CHECK_INTERVAL * 1000 * 1000);
    cpuPercent = parseFloat(cpuPercent.toFixed(4));

    // Update `startCPUUsage` for next tick.
    startCPUUsage = process.cpuUsage();

    async.series([
      function(asyncCallback) {
        var cacheKey = toolkit.getCacheKey('monitor', 'sysStats', ['metric', 'serverCPUPercent', 'hostname', hostname]);
        return app.locals.cacheDB.tsAdd(cacheKey, currentTimestamp, cpuPercent, asyncCallback);
      },
      function(asyncCallback) {
        var cacheKey = toolkit.getCacheKey('monitor', 'sysStats', ['metric', 'serverMemoryRSS', 'hostname', hostname]);
        return app.locals.cacheDB.tsAdd(cacheKey, currentTimestamp, currentMemoryUsage.rss, asyncCallback);
      },
      function(asyncCallback) {
        var cacheKey = toolkit.getCacheKey('monitor', 'sysStats', ['metric', 'serverMemoryHeapTotal', 'hostname', hostname]);
        return app.locals.cacheDB.tsAdd(cacheKey, currentTimestamp, currentMemoryUsage.heapTotal, asyncCallback);
      },
      function(asyncCallback) {
        var cacheKey = toolkit.getCacheKey('monitor', 'sysStats', ['metric', 'serverMemoryHeapUsed', 'hostname', hostname]);
        return app.locals.cacheDB.tsAdd(cacheKey, currentTimestamp, currentMemoryUsage.heapUsed, asyncCallback);
      },
      function(asyncCallback) {
        var cacheKey = toolkit.getCacheKey('monitor', 'sysStats', ['metric', 'serverMemoryHeapExternal', 'hostname', hostname]);
        return app.locals.cacheDB.tsAdd(cacheKey, currentTimestamp, currentMemoryUsage.external, asyncCallback);
      },
      function(asyncCallback) {
        app.locals.db.query('SHOW TABLE STATUS', null, function(err, dbRes) {
          var tableInfoList = dbRes.filter(function(d) {
            return toolkit.startsWith(d.Name, 'biz_') || toolkit.startsWith(d.Name, 'wat_');
          });

          async.eachLimit(tableInfoList, 5, function(tableInfo, eachCallback) {
            var cacheKey = toolkit.getCacheKey('monitor', 'sysStats', ['metric', 'dbDiskUsed', 'table', tableInfo.Name]);
            return app.locals.cacheDB.tsAdd(cacheKey, currentTimestamp, tableInfo.Data_length, eachCallback);
          }, asyncCallback);
        });
      },
      function(asyncCallback) {
        app.locals.cacheDB.dbsize(function(err, cacheRes) {
          if (err) return asyncCallback(err);

          var cacheDBKeyUsed = parseInt(cacheRes) || null;

          var cacheKey = toolkit.getCacheKey('monitor', 'sysStats', ['metric', 'cacheDBKeyUsed']);
          return app.locals.cacheDB.tsAdd(cacheKey, currentTimestamp, cacheDBKeyUsed, asyncCallback);
        });
      },
      function(asyncCallback) {
        app.locals.cacheDB.info(function(err, cacheRes) {
          if (err) return asyncCallback(err);

          var cacheDBMemoryUsed = parseInt(cacheRes.match(/used_memory:(\d+)/)[1]) || null;

          var cacheKey = toolkit.getCacheKey('monitor', 'sysStats', ['metric', 'cacheDBMemoryUsed']);
          return app.locals.cacheDB.tsAdd(cacheKey, currentTimestamp, cacheDBMemoryUsed, asyncCallback);
        });
      },
      function(asyncCallback) {
        async.eachLimit(CONFIG._MONITOR_WORKER_QUEUE_LIST, 5, function(queueName, eachCallback) {
          var workerQueueKey = toolkit.getWorkerQueue(queueName);
          app.locals.cacheDB.llen(workerQueueKey, function(err, cacheRes) {
            if (err) return eachCallback(err);

            var cacheKey = toolkit.getCacheKey('monitor', 'sysStats', ['metric', 'workerQueueLength', 'queueName', queueName]);
            var workerQueueLength = parseInt(cacheRes) || 0;
            app.locals.cacheDB.tsAdd(cacheKey, currentTimestamp, workerQueueLength, eachCallback);
          });
        }, asyncCallback);
      },
      function(asyncCallback) {
        app.locals.cacheDB.keys('*', function(err, keys) {
          if (err) return asyncCallback(err);

          var keyPrefixCountMap = {};
          keys.forEach(function(key) {
            var prefix = key.indexOf(CONFIG.APP_NAME) === 0
                       ? key.split(':')[0]
                       : 'OTHER';

            keyPrefixCountMap[prefix] = keyPrefixCountMap[prefix] || 0;
            keyPrefixCountMap[prefix] += 1;
          });

          async.eachOfLimit(keyPrefixCountMap, 5, function(count, prefix, eachCallback) {
            var cacheKey = toolkit.getCacheKey('monitor', 'sysStats', ['metric', 'cacheDBKeyCountByPrefix', 'prefix', prefix]);
            app.locals.cacheDB.tsAdd(cacheKey, currentTimestamp, count, eachCallback);
          }, asyncCallback);
        });
      },
    ], function(err) {
      if (err) return app.locals.logger.logError(err);
    });
  };

  // Start interval
  setInterval(recordHeartbeat, 30 * 1000);
  setInterval(recordSysStats, CONFIG._MONITOR_SYS_STATS_CHECK_INTERVAL * 1000);

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
  if (process.env.RESET_ADMIN_USERNAME && process.env.RESET_ADMIN_PASSWORD) {
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
  }

  // 自动导入脚本包
  if (!CONFIG._DISABLE_AUTO_INSTALL_FUNC_PKGS) {
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
          return toolkit.endsWith(fileName, CONFIG._FUNC_PKG_EXPORT_EXT);
        });

        if (toolkit.isNothing(funcPackages)) return asyncCallback();

        // 依次导入
        var watClient = new WATClient({host: 'localhost', port: 8088});

        // 本地临时认证令牌
        app.locals.localhostTempAuthTokenMap = app.locals.localhostTempAuthTokenMap || {};

        var builtinScriptSetIds = [];
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
              return eachCallback(new Error('Auto import package failed: ' + apiRes.message));
            }

            apiRes.data.summary.scriptSets.forEach(function(scriptSet) {
              builtinScriptSetIds.push(scriptSet.id);
            });

            return eachCallback();
          });
        }, function(err) {
          if (err) return asyncCallback(err);

          var cacheKey = toolkit.getCacheKey('cache', 'builtinScriptSetIds');
          app.locals.cacheDB.set(cacheKey, JSON.stringify(builtinScriptSetIds));

          return asyncCallback();
        });
      },
    ], printError);
  }
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

      var operationRecordModel = operationRecordMod.createModel(res.locals);
      operationRecordModel.add(res.locals._operationRecord);
    }
  }
};
