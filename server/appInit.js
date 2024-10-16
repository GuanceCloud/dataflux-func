'use strict';

/* Built-in Modules */
var os   = require('os');
var path = require('path');

/* 3rd-party Modules */
var async   = require('async');
var mysql   = require('mysql2');
var moment  = require('moment-timezone');

/* Project Modules */
var E             = require('./utils/serverError');
var yamlResources = require('./utils/yamlResources');
var toolkit       = require('./utils/toolkit');
var routeLoader   = require('./utils/routeLoader');

var ROUTE      = yamlResources.get('ROUTE');
var CONFIG     = yamlResources.get('CONFIG');
var IMAGE_INFO = yamlResources.get('IMAGE_INFO');
var TZ_ABBR    = yamlResources.get('TZ_ABBR');

if (!TZ_ABBR) {
  TZ_ABBR = yamlResources.loadFile('TZ_ABBR', path.join(__dirname, '../tz-abbr.yaml'));
}

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

exports.prepare = function(callback) {
  // UV thread pool
  process.env.UV_THREADPOOL_SIZE = parseInt(CONFIG._NODE_UV_THREADPOOL_SIZE);

  // Init toolkit
  var APP_NAME_SERVER  = CONFIG.APP_NAME + '-server';
  var APP_NAME_WORKER  = CONFIG.APP_NAME + '-worker';
  var APP_NAME_MONITOR = CONFIG.APP_NAME + '-monitor';
  var APP_NAME_GLOBAL  = CONFIG.APP_NAME + '-global';

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

  toolkit.getGlobalCacheKey = function(topic, name, tags) {
    return toolkit.getCacheKey(topic, name, tags, APP_NAME_GLOBAL);
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
        conn.end(function(err) {
          // Nope
        });

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

        if (!timezone) {
          timezone = '+00:00';

        } else {
          switch(timezone) {
            case 'UTC':
            case 'GMT':
            case '0:00':
            case '00:00':
            case '-0:00':
            case '-00:00':
            case '+0:00':
            case '+00:00':
              timezone = '+00:00';
              break;

            case 'CST':
            case 'Asia/Beijing':
              timezone = '+08:00';
              break;

            default:
              if (TZ_ABBR[timezone]) {
                timezone = TZ_ABBR[timezone];

              } else {
                var m = timezone.match(/^(\+|\-)(\d{1}:\d{2})$/);
                if (m) timezone = `${m[1]}0${m[2]}`;

                var m = timezone.match(/^(\+|\-)(\d{1})$/);
                if (m) timezone = `${m[1]}0${m[2]}:00`;

                var m = timezone.match(/^(\+|\-)(\d{2})$/);
                if (m) timezone = `${m[1]}${m[2]}:00`;
              }

              break;
          }

          if (!timezone.match(/^(\+|\-)(\d{2}:\d{2})$/)) {
            if (moment.tz.zone(timezone)) {
              timezone = moment().tz(timezone).format('Z');

            } else {
              console.log(`> 无法解析数据库时区配置（${timezone}），建议使用类似 +08:00 格式直接指定时区。`);
              console.log(`> Cannot parse the database time zone configuration (${timezone}), it is recommended to use the format such as +08:00 to specify the time zone directly.`);
              var e = new Error(`Bad database timezone: ${timezone}`);
              throw e;
            }
          }
        }

        yamlResources.set('CONFIG', '_MYSQL_TIMEZONE', timezone);
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

exports.afterServe = function(app, server) {
  var hostname = os.hostname();

  // 记录主机，PID，所启动服务
  function recordServiceInfo() {
    var now = toolkit.getTimestamp();

    var serviceName = process.argv[1].split('/').pop();
    if ('app.js' === serviceName) {
      serviceName = 'server';
    }

    var serviceInfo = {
      ts     : now,
      name   : serviceName,
      version: IMAGE_INFO.VERSION,
      edition: IMAGE_INFO.EDITION,
      uptime : toolkit.sysUpTime(),
    }
    var cacheKey   = toolkit.getMonitorCacheKey('heartbeat', 'serviceInfo')
    var cacheField = toolkit.getColonTags([ 'hostname', hostname, 'pid', process.pid ]);
    return app.locals.cacheDB.hset(cacheKey, cacheField, JSON.stringify(serviceInfo));
  }
  setInterval(recordServiceInfo, CONFIG._MONITOR_REPORT_INTERVAL * 1000);
  recordServiceInfo();

  // System Metrics
  var startCPUUsage = process.cpuUsage();
  function recordSystemMetrics() {
    var now = toolkit.getTimestamp();

    var currentCPUUsage    = process.cpuUsage(startCPUUsage);
    var currentMemoryUsage = process.memoryUsage();

    var cpuPercent = (currentCPUUsage.user + currentCPUUsage.system) * 100 / (CONFIG._MONITOR_REPORT_INTERVAL * 1000 * 1000);
    cpuPercent = parseFloat(cpuPercent.toFixed(2));

    // Update `startCPUUsage` for next tick.
    startCPUUsage = process.cpuUsage();

    async.series([
      function(asyncCallback) {
        var cacheKey = toolkit.getMonitorCacheKey('monitor', 'systemMetrics', [ 'metric', 'serverCPUPercent', 'hostname', hostname ]);
        var opt = { timestamp: now, value: cpuPercent };
        return app.locals.cacheDB.tsAdd(cacheKey, opt, asyncCallback);
      },
      function(asyncCallback) {
        var cacheKey = toolkit.getMonitorCacheKey('monitor', 'systemMetrics', [ 'metric', 'serverMemoryRSS', 'hostname', hostname ]);
        var opt = { timestamp: now, value: currentMemoryUsage.rss };
        return app.locals.cacheDB.tsAdd(cacheKey, opt, asyncCallback);
      },
      function(asyncCallback) {
        var cacheKey = toolkit.getMonitorCacheKey('monitor', 'systemMetrics', [ 'metric', 'serverMemoryHeapTotal', 'hostname', hostname ]);
        var opt = { timestamp: now, value: currentMemoryUsage.heapTotal };
        return app.locals.cacheDB.tsAdd(cacheKey, opt, asyncCallback);
      },
      function(asyncCallback) {
        var cacheKey = toolkit.getMonitorCacheKey('monitor', 'systemMetrics', [ 'metric', 'serverMemoryHeapUsed', 'hostname', hostname ]);
        var opt = { timestamp: now, value: currentMemoryUsage.heapUsed };
        return app.locals.cacheDB.tsAdd(cacheKey, opt, asyncCallback);
      },
      function(asyncCallback) {
        var cacheKey = toolkit.getMonitorCacheKey('monitor', 'systemMetrics', [ 'metric', 'serverMemoryHeapExternal', 'hostname', hostname ]);
        var opt = { timestamp: now, value: currentMemoryUsage.external };
        return app.locals.cacheDB.tsAdd(cacheKey, opt, asyncCallback);
      },
    ], function(err) {
      if (err) return app.locals.logger.logError(err);
    });
  };
  setInterval(recordSystemMetrics, CONFIG._MONITOR_REPORT_INTERVAL * 1000);
  recordSystemMetrics();

  var fs = require('fs-extra');

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
          var e = new Error('Task "Init DataFlux Func ID" is just launched');
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

  // 更新脚本市场数据
  async.series([
    // 获取锁
    function(asyncCallback) {
      var lockKey   = toolkit.getCacheKey('lock', 'updateOfficialScriptMarket');
      var lockValue = toolkit.genRandString();
      var lockAge   = CONFIG._UPDATE_OFFICIAL_SCRIPT_MARKET_LOCK_AGE;

      app.locals.cacheDB.lock(lockKey, lockValue, lockAge, function(err, cacheRes) {
        if (err) return asyncCallback(err);

        if (!cacheRes) {
          var e = new Error('Task "Update Official Script Market" is just launched');
          e.isWarning = true;
          return asyncCallback(e);
        }

        return asyncCallback();
      });
    },
    // 强制更新官方脚本市场
    function(asyncCallback) {
      var data = {
        id        : CONFIG._OFFICIAL_SCRIPT_MARKET_ID,
        type      : 'httpService',
        configJSON: JSON.stringify({ "url": CONFIG._OFFICIAL_SCRIPT_MARKET_URL }),
      }
      app.locals.db.query('UPDATE biz_main_script_market SET ? WHERE id = ? LIMIT 1', [ data, CONFIG._OFFICIAL_SCRIPT_MARKET_ID ], asyncCallback);
    },
  ], printError);

  // 自动运行脚本
  if (!CONFIG._DISABLE_INIT_SCRIPTS) {
    async.series([
      // 获取锁
      function(asyncCallback) {
        var lockKey   = toolkit.getCacheKey('lock', 'initScripts');
        var lockValue = toolkit.genRandString();
        var lockAge   = CONFIG._INIT_SCRIPTS_LOCK_AGE;

        app.locals.cacheDB.lock(lockKey, lockValue, lockAge, function(err, cacheRes) {
          if (err) return asyncCallback(err);

          if (!cacheRes) {
            var e = new Error('Task "Run Init Script" is just launched');
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
      // 执行初始化脚本
      function(asyncCallback) {
        var localhostAuthToken = toolkit.safeReadFileSync(CONFIG._WEB_LOCALHOST_AUTH_TOKEN_PATH).trim();

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

          var baseURL = CONFIG.GUANCE_FUNC_BASE_URL;
          if (!baseURL) {
            var protocol = toolkit.toBoolean(process.env['GUANCE_SELF_TLS_ENABLE']) ? 'https' : 'http';
            var webBind = CONFIG.WEB_BIND === '0.0.0.0' ? 'localhost' : CONFIG.WEB_BIND;
            baseURL = `${protocol}://${webBind}:${CONFIG.WEB_PORT}`;
          }

          var scriptPath  = path.join(initScriptDir, script);
          var projectPath = path.join(__dirname, '..');
          var opt = {
            cwd: initScriptDir,
            env: {
              BASE_URL   : baseURL,
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

  if (!operationRecord || !route) {
    // 未经过操作记录中间件、没有对应路由 -> 不记录
    shouldRecordOperation = false;

  } else if (route.response === 'html') {
    // 打开页面 -> 不记录
    shouldRecordOperation = false;

  } else if (route.method === 'post' && route.url === ROUTE.authAPI.signIn.url) {
    // 登录接口 -> 需要记录
    try { operationRecord.username = req.body.signIn.username } catch(_) {};
    try { operationRecord.userId   = respContent.data.userId } catch(_) {};

  } else if (route.method === 'post' && route.url === ROUTE.mainAPI.integratedSignIn.url) {
    // 集成登录接口 -> 需要记录
    try { operationRecord.username = req.body.signIn.username } catch(_) {};
    try { operationRecord.userId = respContent.data.userId } catch(_) {};

  } else if(!route.privilege || !toolkit.endsWith(route.privilege, '_w')) {
    // 非写操作接口 -> 不记录
    shouldRecordOperation = false;

  } else if (req.route.path === ROUTE.scriptAPI.modify.url
      && operationRecord.reqBodyJSON.data.codeDraft
      && operationRecord.reqBodyJSON.prevCodeDraftMD5) {
    // 【特殊处理】由于脚本自动保存可能产生大量日志 -> 不记录
    shouldRecordOperation = false;
  }

  if (shouldRecordOperation) {
    operationRecord.reqCost        = reqCost;
    operationRecord.respStatusCode = statusCode || 200;
    operationRecord.respBodyJSON   = respType === 'json' ? toolkit.jsonCopy(respContent) : null;

    require('./models/operationRecordMod').createModel(res.locals).add(operationRecord);
  }
};
