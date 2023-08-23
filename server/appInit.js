'use strict';

/* Built-in Modules */
var os = require('os');

/* 3rd-party Modules */
var async   = require('async');
var mysql   = require('mysql2');
var moment  = require('moment');

/* Project Modules */
var E             = require('./utils/serverError');
var yamlResources = require('./utils/yamlResources');
var toolkit       = require('./utils/toolkit');
var routeLoader   = require('./utils/routeLoader');

var ROUTE  = yamlResources.get('ROUTE');
var CONFIG = yamlResources.get('CONFIG');

function getDBConnection() {
  var mysqlConfig = {
    host    : CONFIG.MYSQL_HOST,
    port    : CONFIG.MYSQL_PORT,
    user    : CONFIG.MYSQL_USER,
    password: CONFIG.MYSQL_PASSWORD,
    database: CONFIG.MYSQL_DATABASE,
  };
  var conn = mysql.createConnection(mysqlConfig);

  return conn;
};

exports.convertJSONResponse = function(ret) {
  // Will disabled by `"X-Wat-Disable-Json-Response-Converting"` Header
  return ret;
};

exports.beforeAppCreate = function(callback) {
  // UV thread pool
  process.env.UV_THREADPOOL_SIZE = parseInt(CONFIG._NODE_UV_THREADPOOL_SIZE);

  // Init toolkit
  var APP_NAME_SERVER  = CONFIG.APP_NAME + '-server';
  var APP_NAME_WORKER  = CONFIG.APP_NAME + '-worker';
  var APP_NAME_MONITOR = CONFIG.APP_NAME + '-monitor';

  toolkit.getCacheKey = function(topic, name, tags, appName) {
    var cacheKey = toolkit._getCacheKey(topic, name, tags);

    // Add app name to cache key
    appName = appName || APP_NAME_SERVER;
    var cacheKeyWithAppName = `${appName}#${cacheKey}`;
    return cacheKeyWithAppName;
  };

  toolkit.getWorkerCacheKey = function(topic, name, tags) {
    return toolkit.getCacheKey(topic, name, tags, APP_NAME_WORKER);
  };

  toolkit.getMonitorCacheKey = function(topic, name, tags) {
    return toolkit.getCacheKey(topic, name, tags, APP_NAME_MONITOR);
  };

  toolkit.parseCacheKey = function(cacheKey) {
    var cacheKeyInfo = toolkit._parseCacheKey(cacheKey);

    var appNameTopicParts = cacheKeyInfo.topic.split('#');
    cacheKeyInfo.appName = appNameTopicParts[0];
    cacheKeyInfo.topic   = appNameTopicParts[1];

    return cacheKeyInfo;
  };

  toolkit.getWorkerQueue = function(name) {
    return `${APP_NAME_WORKER}#${toolkit._getWorkerQueue(name)}`;
  };

  toolkit.getDelayQueue = function(name) {
    return `${APP_NAME_WORKER}#${toolkit._getDelayQueue(name)}`;
  };

  async.series([
    // 加载数据库时区
    function(asyncCallback) {
      var conn = getDBConnection();
      conn.query("SHOW VARIABLES LIKE '%time_zone%'", function(err, dbRes) {
        // 无法连接数据库也不要报错
        if (err) {
          console.log('Cannot detect database Timezone, skip');
          return asyncCallback();
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

        return asyncCallback();
      });
    }
  ], function(err) {
    if (err) throw err;

    // Nope

    return callback();
  });
};

exports.afterAppCreated = function(app, server) {
  var hostname = os.hostname();

  // System Metrics
  var startCPUUsage = process.cpuUsage();
  function recordSystemMetrics() {
    var currentTimestamp = toolkit.getTimestamp();

    var currentCPUUsage    = process.cpuUsage(startCPUUsage);
    var currentMemoryUsage = process.memoryUsage();

    var cpuPercent = (currentCPUUsage.user + currentCPUUsage.system) * 100 / (CONFIG._MONITOR_SYS_STATS_CHECK_INTERVAL * 1000 * 1000);
    cpuPercent = parseFloat(cpuPercent.toFixed(2));

    // Update `startCPUUsage` for next tick.
    startCPUUsage = process.cpuUsage();

    async.series([
      function(asyncCallback) {
        var cacheKey = toolkit.getMonitorCacheKey('monitor', 'systemMetrics', ['metric', 'serverCPUPercent', 'hostname', hostname]);
        var opt = { timestamp: currentTimestamp, value: cpuPercent };
        return app.locals.cacheDB.tsAdd(cacheKey, opt, asyncCallback);
      },
      function(asyncCallback) {
        var cacheKey = toolkit.getMonitorCacheKey('monitor', 'systemMetrics', ['metric', 'serverMemoryRSS', 'hostname', hostname]);
        var opt = { timestamp: currentTimestamp, value: currentMemoryUsage.rss };
        return app.locals.cacheDB.tsAdd(cacheKey, opt, asyncCallback);
      },
      function(asyncCallback) {
        var cacheKey = toolkit.getMonitorCacheKey('monitor', 'systemMetrics', ['metric', 'serverMemoryHeapTotal', 'hostname', hostname]);
        var opt = { timestamp: currentTimestamp, value: currentMemoryUsage.heapTotal };
        return app.locals.cacheDB.tsAdd(cacheKey, opt, asyncCallback);
      },
      function(asyncCallback) {
        var cacheKey = toolkit.getMonitorCacheKey('monitor', 'systemMetrics', ['metric', 'serverMemoryHeapUsed', 'hostname', hostname]);
        var opt = { timestamp: currentTimestamp, value: currentMemoryUsage.heapUsed };
        return app.locals.cacheDB.tsAdd(cacheKey, opt, asyncCallback);
      },
      function(asyncCallback) {
        var cacheKey = toolkit.getMonitorCacheKey('monitor', 'systemMetrics', ['metric', 'serverMemoryHeapExternal', 'hostname', hostname]);
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
            async.series([
              // 总使用量
              function(innerCallback) {
                var cacheKey = toolkit.getMonitorCacheKey('monitor', 'systemMetrics', ['metric', 'dbTableTotalUsed', 'table', tableInfo.Name]);
                var opt = { timestamp: currentTimestamp, value: tableInfo.Data_length + tableInfo.Index_length };
                return app.locals.cacheDB.tsAdd(cacheKey, opt, innerCallback);
              },
              // 数据使用量
              function(innerCallback) {
                var cacheKey = toolkit.getMonitorCacheKey('monitor', 'systemMetrics', ['metric', 'dbTableDataUsed', 'table', tableInfo.Name]);
                var opt = { timestamp: currentTimestamp, value: tableInfo.Data_length };
                return app.locals.cacheDB.tsAdd(cacheKey, opt, innerCallback);
              },
              // 索引使用量
              function(innerCallback) {
                var cacheKey = toolkit.getMonitorCacheKey('monitor', 'systemMetrics', ['metric', 'dbTableIndexUsed', 'table', tableInfo.Name]);
                var opt = { timestamp: currentTimestamp, value: tableInfo.Index_length };
                return app.locals.cacheDB.tsAdd(cacheKey, opt, innerCallback);
              },
            ], eachCallback);
          }, asyncCallback);
        });
      },
      function(asyncCallback) {
        app.locals.cacheDB.dbsize(function(err, cacheRes) {
          if (err) return asyncCallback(err);

          var cacheDBKeyUsed = parseInt(cacheRes) || null;

          var cacheKey = toolkit.getMonitorCacheKey('monitor', 'systemMetrics', ['metric', 'cacheDBKeyUsed']);
          var opt = { timestamp: currentTimestamp, value: cacheDBKeyUsed };
          return app.locals.cacheDB.tsAdd(cacheKey, opt, asyncCallback);
        });
      },
      function(asyncCallback) {
        app.locals.cacheDB.info(function(err, cacheRes) {
          if (err) return asyncCallback(err);

          var cacheDBMemoryUsed = parseInt(cacheRes.match(/used_memory:(\d+)/)[1]) || null;

          var cacheKey = toolkit.getMonitorCacheKey('monitor', 'systemMetrics', ['metric', 'cacheDBMemoryUsed']);
          var opt = { timestamp: currentTimestamp, value: cacheDBMemoryUsed };
          return app.locals.cacheDB.tsAdd(cacheKey, opt, asyncCallback);
        });
      },
      function(asyncCallback) {
        async.eachLimit(CONFIG._MONITOR_WORKER_QUEUE_LIST, 5, function(queue, eachCallback) {
          var workerQueue = toolkit.getWorkerQueue(queue);
          app.locals.cacheDB.llen(workerQueue, function(err, cacheRes) {
            if (err) return eachCallback(err);

            var cacheKey = toolkit.getMonitorCacheKey('monitor', 'systemMetrics', ['metric', 'workerQueueLength', 'queue', queue]);
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
            } else {
              prefix = 'OTHER';
            }

            keyPrefixCountMap[prefix] = keyPrefixCountMap[prefix] || 0;
            keyPrefixCountMap[prefix] += 1;
          });

          async.eachOfLimit(keyPrefixCountMap, 5, function(count, prefix, eachCallback) {
            prefix = toolkit.getBase64(prefix);
            var cacheKey = toolkit.getMonitorCacheKey('monitor', 'systemMetrics', ['metric', 'cacheDBKeyCountByPrefix', 'prefix', prefix]);
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
  setInterval(recordSystemMetrics, CONFIG._MONITOR_SYS_STATS_CHECK_INTERVAL * 1000);
  recordSystemMetrics();

  var path = require('path');
  var fs   = require('fs-extra');

  var DataFluxFunc = require('../sdk/dataflux_func_sdk').DataFluxFunc;

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

  // 初始化 DataFlux Func ID
  async.series([
    // 获取锁
    function(asyncCallback) {
      var lockKey   = toolkit.getCacheKey('lock', 'initDataFluxFuncId');
      var lockValue = toolkit.genRandString();
      var lockAge   = CONFIG._INIT_DATAFLUX_FUNC_ID_LOCK_AGE;

      app.locals.cacheDB.lock(lockKey, lockValue, lockAge, function(err, cacheRes) {
        if (err) return asyncCallback(err);

        if (!cacheRes) {
          var e = new Error('DataFlux Func ID init is just launched');
          e.isWarning = true;
          return asyncCallback(e);
        }

        return asyncCallback();
      });
    },
    // 自动生成 DataFlux Func ID
    function(asyncCallback) {
      var id = 'DATAFLUX_FUNC_ID';

      app.locals.db.query('SELECT COUNT(*) AS count FROM wat_main_system_setting WHERE id = ? LIMIT 1', [ id ], function(err, dbRes) {
        if (err) return asyncCallback(err);

        if (dbRes[0].count > 0) {
          app.locals.db.query("UPDATE wat_main_system_setting SET value = REPLACE(value, '-', '') WHERE id = ? LIMIT 1", [ id ], function(err) {
            return asyncCallback(err);
          });

        } else {
          var value = `DFF${toolkit.genUUID({ noHyphen: true }).toUpperCase()}`;
          app.locals.db.query('INSERT IGNORE INTO wat_main_system_setting SET id = ?, value = ?', [ id, JSON.stringify(value) ], function(err) {
            return asyncCallback(err);
          });
        }
      });
    },
  ], printError);

  // 自动运行脚本
  if (!CONFIG._DISABLE_INIT_SCRIPTS) {
    async.series([
      // 获取锁
      function(asyncCallback) {
        var lockKey   = toolkit.getCacheKey('lock', 'initScripts');
        var lockValue = toolkit.genRandString();
        var lockAge   = CONFIG._AUTORUN_SCRIPTS_LOCK_AGE;

        app.locals.cacheDB.lock(lockKey, lockValue, lockAge, function(err, cacheRes) {
          if (err) return asyncCallback(err);

          if (!cacheRes) {
            var e = new Error('Autorun Scriptst is just launched');
            e.isWarning = true;
            return asyncCallback(e);
          }

          return asyncCallback();
        });
      },
      // 等待若干秒
      function(asyncCallback) {
        setTimeout(asyncCallback, 3000);
      },
      // 执行 Autorun 脚本
      function(asyncCallback) {
        var localhostAuthToken = toolkit.safeReadFileSync(CONFIG._WEB_LOCALHOST_AUTH_TOKEN_PATH);

        var initScriptDir = path.join(__dirname, '../init-scripts/');
        var scripts = fs.readdirSync(initScriptDir).filter(function(filename) {
          return !toolkit.startsWith(filename, '.')
                && (toolkit.endsWith(filename, '.sh') || toolkit.endsWith(filename, '.py'));
        });

        async.eachSeries(scripts, function(script, eachCallback) {
          var cmd = null;
          if (toolkit.endsWith(script, '.sh')) {
            cmd = 'bash';
          } else if (toolkit.endsWith(script, '.py')) {
            cmd = 'python';
          }

          var scriptPath = path.join(initScriptDir, script);
          var projectPath = path.join(__dirname, '..');
          var opt = {
            cwd: initScriptDir,
            env: {
              BASE_URL   : `http://localhost:${CONFIG.WEB_PORT}`,
              AUTH_HEADER: CONFIG._WEB_LOCALHOST_AUTH_TOKEN_HEADER,
              AUTH_TOKEN : localhostAuthToken,
              PATH       : process.env.PATH,
              PYTHONPATH : `.:${projectPath}`,
            }
          }
          toolkit.childProcessSpawn(cmd, [ scriptPath ], opt, function(err, stdout) {
            if (err) return eachCallback(err);

            app.locals.logger.warning(`[INIT SCRIPT] ${script}: Run`);
            app.locals.logger.warning(`[INIT SCRIPT] ${script}: ${stdout}`);

            return eachCallback();
          });
        }, asyncCallback);
      },
    ], printError);
  }
};

exports.beforeReponse = function(req, res, reqCost, statusCode, respContent, respType) {
  var shouldRecordOperation = true;

  // 操作记录
  var operationRecord = res.locals.operationRecord;

  var key   = `${req.method.toUpperCase()} ${req.route.path}`;
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

  } else if (req.route.path === ROUTE.scriptAPI.modify.url
      && operationRecord.reqBodyJSON.data.codeDraft
      && operationRecord.reqBodyJSON.prevCodeDraftMD5) {
    // 【特殊处理】由于脚本自动保存可能产生大量日志，因此忽略
    shouldRecordOperation = false;
  }

  if (shouldRecordOperation) {
    operationRecord.reqCost        = reqCost;
    operationRecord.respStatusCode = statusCode || 200;
    operationRecord.respBodyJSON   = respType === 'json' ? toolkit.jsonCopy(respContent) : null;

    require('./models/operationRecordMod').createModel(res.locals).add(operationRecord);
  }
};
