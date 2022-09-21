'use strict';

/* Builtin Modules */
var os = require('os');

/* 3rd-party Modules */
var async  = require('async');
var mysql  = require('mysql2');
var moment = require('moment');

/* Project Modules */
var g             = require('./utils/g');
var E             = require('./utils/serverError');
var yamlResources = require('./utils/yamlResources');
var modelHelper   = require('./utils/modelHelper');
var toolkit       = require('./utils/toolkit');
var routeLoader   = require('./utils/routeLoader');

var ROUTE  = yamlResources.get('ROUTE');
var CONFIG = yamlResources.get('CONFIG');

exports.convertJSONResponse = function(ret) {
  // Will disabled by `"X-Wat-Disable-Json-Response-Converting"` Header
  return ret;
};

exports.beforeAppCreate = function(callback) {
  // UV thread pool
  process.env.UV_THREADPOOL_SIZE = parseInt(CONFIG._NODE_UV_THREADPOOL_SIZE);

  // Init toolkit
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
      // 无法连接数据库也不要报错
      if (err) {
        console.log('Cannot detect database Timezone, skip');
        return callback();
      }

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

  async.series([
    loadDatabaseTimezone,
  ], function(err) {
    if (err) throw err;

    /********** Content for YOUR project below **********/

    return callback();
  });
};

exports.afterAppCreated = function(app, server) {
  g.runUpTime = parseInt(Date.now() / 1000);

  var hostname = os.hostname();

  // Sys Stats
  var startCPUUsage = process.cpuUsage();
  function recordSysStats() {
    var currentTimestamp = parseInt(Date.now() / 1000);

    var currentCPUUsage    = process.cpuUsage(startCPUUsage);
    var currentMemoryUsage = process.memoryUsage();

    var cpuPercent = (currentCPUUsage.user + currentCPUUsage.system) * 100 / (CONFIG._MONITOR_SYS_STATS_CHECK_INTERVAL * 1000 * 1000);
    cpuPercent = parseFloat(cpuPercent.toFixed(2));

    // Update `startCPUUsage` for next tick.
    startCPUUsage = process.cpuUsage();

    async.series([
      function(asyncCallback) {
        var cacheKey = toolkit.getCacheKey('monitor', 'sysStats', ['metric', 'serverCPUPercent', 'hostname', hostname]);
        var opt = { timestamp: currentTimestamp, value: cpuPercent };
        return app.locals.cacheDB.tsAdd(cacheKey, opt, asyncCallback);
      },
      function(asyncCallback) {
        var cacheKey = toolkit.getCacheKey('monitor', 'sysStats', ['metric', 'serverMemoryRSS', 'hostname', hostname]);
        var opt = { timestamp: currentTimestamp, value: currentMemoryUsage.rss };
        return app.locals.cacheDB.tsAdd(cacheKey, opt, asyncCallback);
      },
      function(asyncCallback) {
        var cacheKey = toolkit.getCacheKey('monitor', 'sysStats', ['metric', 'serverMemoryHeapTotal', 'hostname', hostname]);
        var opt = { timestamp: currentTimestamp, value: currentMemoryUsage.heapTotal };
        return app.locals.cacheDB.tsAdd(cacheKey, opt, asyncCallback);
      },
      function(asyncCallback) {
        var cacheKey = toolkit.getCacheKey('monitor', 'sysStats', ['metric', 'serverMemoryHeapUsed', 'hostname', hostname]);
        var opt = { timestamp: currentTimestamp, value: currentMemoryUsage.heapUsed };
        return app.locals.cacheDB.tsAdd(cacheKey, opt, asyncCallback);
      },
      function(asyncCallback) {
        var cacheKey = toolkit.getCacheKey('monitor', 'sysStats', ['metric', 'serverMemoryHeapExternal', 'hostname', hostname]);
        var opt = { timestamp: currentTimestamp, value: currentMemoryUsage.external };
        return app.locals.cacheDB.tsAdd(cacheKey, opt, asyncCallback);
      },
      function(asyncCallback) {
        app.locals.db.query('SHOW TABLE STATUS', null, function(err, dbRes) {
          if (err) return asyncCallback(err);

          var tableInfoList = dbRes.filter(function(d) {
            return toolkit.startsWith(d.Name, 'biz_') || toolkit.startsWith(d.Name, 'wat_');
          });

          async.eachLimit(tableInfoList, 5, function(tableInfo, eachCallback) {
            var cacheKey = toolkit.getCacheKey('monitor', 'sysStats', ['metric', 'dbDiskUsed', 'table', tableInfo.Name]);
            var opt = { timestamp: currentTimestamp, value: tableInfo.Data_length };
            return app.locals.cacheDB.tsAdd(cacheKey, opt, eachCallback);
          }, asyncCallback);
        });
      },
      function(asyncCallback) {
        app.locals.cacheDB.dbsize(function(err, cacheRes) {
          if (err) return asyncCallback(err);

          var cacheDBKeyUsed = parseInt(cacheRes) || null;

          var cacheKey = toolkit.getCacheKey('monitor', 'sysStats', ['metric', 'cacheDBKeyUsed']);
          var opt = { timestamp: currentTimestamp, value: cacheDBKeyUsed };
          return app.locals.cacheDB.tsAdd(cacheKey, opt, asyncCallback);
        });
      },
      function(asyncCallback) {
        app.locals.cacheDB.info(function(err, cacheRes) {
          if (err) return asyncCallback(err);

          var cacheDBMemoryUsed = parseInt(cacheRes.match(/used_memory:(\d+)/)[1]) || null;

          var cacheKey = toolkit.getCacheKey('monitor', 'sysStats', ['metric', 'cacheDBMemoryUsed']);
          var opt = { timestamp: currentTimestamp, value: cacheDBMemoryUsed };
          return app.locals.cacheDB.tsAdd(cacheKey, opt, asyncCallback);
        });
      },
      function(asyncCallback) {
        async.eachLimit(CONFIG._MONITOR_WORKER_QUEUE_LIST, 5, function(queue, eachCallback) {
          var workerQueueKey = toolkit.getWorkerQueue(queue);
          app.locals.cacheDB.llen(workerQueueKey, function(err, cacheRes) {
            if (err) return eachCallback(err);

            var cacheKey = toolkit.getCacheKey('monitor', 'sysStats', ['metric', 'workerQueueLength', 'queue', queue]);
            var workerQueueLength = parseInt(cacheRes) || 0;
            var opt = { timestamp: currentTimestamp, value: workerQueueLength };
            app.locals.cacheDB.tsAdd(cacheKey, opt, eachCallback);
          });
        }, asyncCallback);
      },
      function(asyncCallback) {
        app.locals.cacheDB.keys('*', function(err, keys) {
          if (err) return asyncCallback(err);

          var keyPrefixCountMap = {};
          keys.forEach(function(key) {
            var prefix = null;
            if (toolkit.startsWith(key, CONFIG.APP_NAME)) {
              prefix = key.split(':')[0] + ':{Tags}';
            } else if (toolkit.startsWith(key, 'celery-task-meta-')) {
              prefix = 'celery-task-meta-{Task ID}';
            } else {
              prefix = 'OTHER';
            }

            keyPrefixCountMap[prefix] = keyPrefixCountMap[prefix] || 0;
            keyPrefixCountMap[prefix] += 1;
          });

          async.eachOfLimit(keyPrefixCountMap, 5, function(count, prefix, eachCallback) {
            prefix = toolkit.getBase64(prefix);
            var cacheKey = toolkit.getCacheKey('monitor', 'sysStats', ['metric', 'cacheDBKeyCountByPrefix', 'prefix', prefix]);
            var opt = { timestamp: currentTimestamp, value: count };
            app.locals.cacheDB.tsAdd(cacheKey, opt, eachCallback);
          }, asyncCallback);
        });
      },
    ], function(err) {
      if (err) return app.locals.logger.logError(err);
    });
  };

  // Start interval
  setInterval(recordSysStats, CONFIG._MONITOR_SYS_STATS_CHECK_INTERVAL * 1000);
  recordSysStats();

  /********** Content for YOUR project below **********/

  var path = require('path');
  var fs   = require('fs-extra');

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

  // 自动导入脚本包
  if (CONFIG._DISABLE_AUTO_INSTALL_FUNC_PKGS) {
    // 不导入脚本包时，删除自动导入脚本包标记
    var cacheKey = toolkit.getCacheKey('cache', 'builtinScriptSetIds');
    app.locals.cacheDB.del(cacheKey);

  } else {
    // 导入脚本包时，记录脚本包ID方便后续标记自动导入的脚本包
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
        var watClient = new WATClient({ host: 'localhost', port: CONFIG.WEB_PORT });

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
          headers[CONFIG._WEB_LOCALHOST_TEMP_AUTH_TOKEN_HEADER] = localhostTempAuthToken;

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

  // 自动添加本地DataKit连接器
  var request = require('request');
  var connectorModel = require('./models/connectorMod').createModel(app.locals);

  var LOCAL_DATAKIT_ID    = 'datakit';
  var LOCAL_DATAKIT_TITLE = '观测云DataKit';
  var LOCAL_DATAKIT_DESC  = `Auto updated at: ${moment().utcOffset('+08:00').format('YYYY-MM-DD HH:mm:ss')}`;
  var LOCAL_DATAKIT_PORT  = 9529;

  var localDataKitIP = null;
  async.series([
      // 获取锁
      function(asyncCallback) {
        var lockKey   = toolkit.getCacheKey('lock', 'autoCreateDataKit');
        var lockValue = Date.now().toString();
        var lockAge   = CONFIG._LOCAL_DATAKIT_AUTO_CREATE_LOCK_AGE;

        app.locals.cacheDB.lock(lockKey, lockValue, lockAge, function(err, cacheRes) {
          if (err) return asyncCallback(err);

          if (!cacheRes) {
            var e = new Error('Local DataKit auto creating is just launched');
            e.isWarning = true;
            return asyncCallback(e);
          }

          return asyncCallback();
        });
      },
    // 检查DataKit所在IP
    function(asyncCallback) {
      var fetchIPs = [
        '172.17.0.1', // Docker宿主机本地
        '127.0.0.1',  // 本机本地
      ];
      async.eachSeries(fetchIPs, function(ip, eachCallback) {
        if (localDataKitIP) return eachCallback();

        var url = toolkit.strf('http://{0}:{1}/v1/ping', ip, LOCAL_DATAKIT_PORT);
        var requestOptions = {
          method : 'get',
          url    : url,
          timeout: 3 * 1000,
        };
        request(requestOptions, function(err, _res, _body) {
          if (!err && _res.statusCode === 200) {
            app.locals.logger.info('Check local DataKit: `{0}`... OK', url);

            localDataKitIP = ip;

          } else {
            app.locals.logger.info('Check local DataKit: `{0}`... Fail: {1}', url, err);
          }

          return eachCallback();
        });
      }, asyncCallback);
    },
    // 添加DataKit连接器
    function(asyncCallback) {
      if (!localDataKitIP) return asyncCallback();

      app.locals.logger.info('Auto add local DataKit: `{0}`', localDataKitIP);

      var opt = {
        filters: {
          id: { eq: LOCAL_DATAKIT_ID }
        }
      }
      connectorModel.list(opt, function(err, dbRes) {
        if (err) return asyncCallback(err);

        var datakit = {
          id         : LOCAL_DATAKIT_ID,
          title      : LOCAL_DATAKIT_TITLE,
          description: LOCAL_DATAKIT_DESC,
          type       : 'df_datakit',
          configJSON: {
            host    : localDataKitIP,
            port    : LOCAL_DATAKIT_PORT,
            protocol: 'http',
            source  : 'dataflux_func',
          }
        }
        if (dbRes.length <= 0) {
          // 不存在，则添加
          connectorModel.add(datakit, asyncCallback);

        } else {
          // 存在，则更新
          connectorModel.modify(datakit.id, datakit, asyncCallback);
        }
      })
    },
  ], printError);
};

exports.beforeReponse = function(req, res, reqCost, statusCode, respContent, respType) {
  /********** Content for YOUR project below **********/
  var shouldRecordOperation = true;

  // 操作记录
  var reqRoute        = res.locals.route = req.route.path;
  var operationRecord = res.locals.operationRecord;

  var key   = `${req.method.toUpperCase()} ${reqRoute}`;
  var route = routeLoader.getRoute(key);

  if (!operationRecord) {
    // 未经过操作记录中间件
    shouldRecordOperation = false;

  } else if (!route
    || route.response === 'html'
    || !route.privilege
    || !toolkit.endsWith(route.privilege, '_w')) {
    // 非写操作接口跳过
    shouldRecordOperation = false;

  } else if (reqRoute === ROUTE.scriptAPI.modify.url
      && operationRecord.reqBodyJSON.data.codeDraft
      && operationRecord.reqBodyJSON.prevCodeDraftMD5) {
    // 【特殊处理】由于脚本自动保存可能产生大量日志，因此忽略
    shouldRecordOperation = false;
  }

  if (shouldRecordOperation) {
    var reqParams = null;
    if (!toolkit.isNothing(req.params)) {
      reqParams = toolkit.jsonCopy(req.params);
    }

    operationRecord.reqRoute      = reqRoute;
    operationRecord.reqParamsJSON = reqParams;
    operationRecord.reqCost       = reqCost;

    operationRecord.respStatusCode = statusCode || 200;
    operationRecord.respBodyJSON   = respType === 'json' ? toolkit.jsonCopy(respContent) : null;

    require('./models/operationRecordMod').createModel(res.locals).add(operationRecord);
  }
};
