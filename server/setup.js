'use strict';

/* Built-in Modules */
var path = require('path');
var http = require('http');
var fs   = require('fs-extra');

/* 3rd-party Modules */
var express    = require('express');
var bodyParser = require('body-parser');
var async      = require('async');
var yaml       = require('js-yaml');
var request    = require('request');

/* Project Modules */
var toolkit = require('./utils/toolkit');
var common  = require('./utils/common');

/* Load YAML resources */
var yamlResources = require('./utils/yamlResources');

var CONFIG       = null;
var USER_CONFIG  = null;
var UPGRADE_INFO = null;
var IMAGE_INFO   = require('../image-info.json');

var CHECKER_INTERVAL                 = 3 * 1000;
var ADMIN_USER_ID                    = 'u-admin';
var ADMIN_DEFUALT_USERNAME           = 'admin';
var ADMIN_DEFUALT_PASSWORD           = 'admin';
var AUTO_SETUP_DEFAULT_AK_ID         = 'ak-auto-setup';
var SYS_CONFIG_ID_UPGRADE_DB_SEQ     = 'UPGRADE_DB_SEQ';
var SYS_CONFIG_ID_UPGRADE_DB_SEQ_OLD = 'upgrade.db.upgradeSeq';
var MEMORY_1GB_BYTES                 = 1 * 1024 * 1024 * 1024;

// DB/Cache helper should load AFTER config is loaded.
var mysqlHelper = null;
var redisHelper = null;

// Setup error
var SetupErrorWrap = function() {
  this.errors = {}
};
SetupErrorWrap.prototype.set = function(key, message, error) {
  if (!this.errors[key]) {
    this.errors[key] = [];
  }

  var line = {
    message: message.toString(),
  }

  if (error) {
    line.error = error.toString();
  }

  this.errors[key].push(line);
};
SetupErrorWrap.prototype.has = function(key) {
  return (key in this.errors);
};
SetupErrorWrap.prototype.hasError = function(key) {
  return Object.keys(this.errors).length > 0;
};
SetupErrorWrap.prototype.toJSON = function() {
  return this.errors;
};

function _doSetup(userConfig, callback) {
  var userConfig = toolkit.jsonCopy(userConfig);

  var adminUsername         = null;
  var adminPassword         = null;
  var adminPasswordRepeat   = null;
  var guanceConnectorConfig = null;

  if (userConfig.ADMIN_USERNAME) {
    // 手动初始化
    adminUsername       = userConfig.ADMIN_USERNAME;
    adminPassword       = userConfig.ADMIN_PASSWORD;
    adminPasswordRepeat = userConfig.ADMIN_PASSWORD_REPEAT;

  } else if (userConfig.AUTO_SETUP_ADMIN_USERNAME || userConfig.AUTO_SETUP_ADMIN_PASSWORD) {
    // 自动初始化
    adminUsername       = userConfig.AUTO_SETUP_ADMIN_USERNAME || ADMIN_DEFUALT_USERNAME;
    adminPassword       = userConfig.AUTO_SETUP_ADMIN_PASSWORD || ADMIN_DEFUALT_PASSWORD;
    adminPasswordRepeat = userConfig.AUTO_SETUP_ADMIN_PASSWORD || ADMIN_DEFUALT_PASSWORD;

  } else {
    // 默认初始化
    adminUsername       = ADMIN_DEFUALT_USERNAME;
    adminPassword       = ADMIN_DEFUALT_PASSWORD;
    adminPasswordRepeat = ADMIN_DEFUALT_PASSWORD;
  }

  // 错误包装
  var setupErrorWrap = new SetupErrorWrap();

  var cacheHelper = null;
  var dbHelper    = null;
  async.series([
    // Check admin username/password
    function(asyncCallback) {
      if (!adminUsername || !adminPassword) {
        setupErrorWrap.set('adminUser', 'Administrator username or password is not inputed');
        return asyncCallback();
      }

      if (toolkit.notNothing(adminPasswordRepeat) && adminPassword !== adminPasswordRepeat) {
        setupErrorWrap.set('adminUser', 'Repeated administrator password not match');
        return asyncCallback();
      }

      return asyncCallback();
    },
    // Check Guance API Key
    function(asyncCallback) {
      if (!userConfig.GUANCE_NODE) return asyncCallback();

      if (!userConfig.GUANCE_API_KEY_ID) {
        setupErrorWrap.set('guance', 'Guance API Key ID is not inputed');
      }
      if (!userConfig.GUANCE_API_KEY) {
        setupErrorWrap.set('guance', 'Guance API Key is not inputed');
      }
      if (setupErrorWrap.has('guance')) return asyncCallback();

      var guanceNode = null;
      async.series([
        // 检查观测云节点存在性
        function(innerCallback) {
          common.getGuanceNodes(function(err, guanceNodes) {
            guanceNode = guanceNodes.filter(function(node) {
              return node.key === userConfig.GUANCE_NODE;
            })[0];

            if (!guanceNode) {
              setupErrorWrap.set('guance', 'No such Guance Node');
              return innerCallback(true);
            }

            return innerCallback();
          });
        },
        // 检查观测云 API Key 有效性
        function(innerCallback) {
          common.checkGuanceAPIKey(guanceNode.key, userConfig.GUANCE_API_KEY_ID, userConfig.GUANCE_API_KEY, function(err) {
            if (err) {
              setupErrorWrap.set('guance', 'Guance API Key ID / API Key is not valid');
              return innerCallback(true);
            }

            return innerCallback();
          });
        },
      ], function(err) {
        if (!err) {
          guanceConnectorConfig = {
            guanceNode        : guanceNode.key,
            guanceOpenAPIURL  : guanceNode.openapi,
            guanceWebSocketURL: guanceNode.websocket,
            guanceOpenWayURL  : guanceNode.openway,
            guanceAPIKeyId    : userConfig.GUANCE_API_KEY_ID,
            guanceAPIKeyCipher: toolkit.cipherByAES(userConfig.GUANCE_API_KEY, userConfig.SECRET),
          };
        }

        return asyncCallback();
      });
    },
    // Check MySQL, version
    function(asyncCallback) {
      try {
        var version = '0.0.0';
        async.retry({ times: 10, interval: CHECKER_INTERVAL }, function(retryCallback) {
          console.log('Try to check MySQL version...');

          var mysqlConfig = {
            host    : userConfig.MYSQL_HOST,
            port    : userConfig.MYSQL_PORT,
            user    : userConfig.MYSQL_USER,
            password: userConfig.MYSQL_PASSWORD,
            database: userConfig.MYSQL_DATABASE,
          }
          dbHelper = mysqlHelper.createHelper(null, mysqlConfig);
          dbHelper.skipLog = true;

          dbHelper.query('SELECT VERSION() AS version', null, function(err, data) {
            if (err) return retryCallback(err);

            version = data[0].version;

            return retryCallback();
          });
        }, function(err) {
          if (err) {
            setupErrorWrap.set('mysql', 'Connecting to MySQL failed', err);

          } else {
            var versionParts = version.split('.');
            var majorVer = parseInt(versionParts[0]);
            var minorVer = parseInt(versionParts[1]);
            if (majorVer < 5 || (majorVer === 5 && minorVer < 7)) {
              setupErrorWrap.set('mysql', 'MySQL 5.7 or above is required');
            }
          }

          return asyncCallback();
        });

      } catch(err) {
        setupErrorWrap.set('mysql', 'Unexpected error with MySQL', err);
        return asyncCallback();
      }
    },
    // Check MySQL variable
    function(asyncCallback) {
      if (setupErrorWrap.has('mysql')) return asyncCallback();

      try {
        dbHelper.query("SHOW VARIABLES LIKE 'innodb_large_prefix'", null, function(err, data) {
          if (err) {
            setupErrorWrap.set('mysql', 'Connecting to MySQL failed', err);

          } else if (data.length > 0 && data[0].Value.toUpperCase() !== 'ON') {
            setupErrorWrap.set('mysql', 'MySQL system variable "innodb_large_prefix" should be ON');
          }

          return asyncCallback();
        });
      } catch(err) {
        setupErrorWrap.set('mysql', 'Unexpected error with MySQL', err);
        return asyncCallback();
      }
    },
    // Check Redis
    function(asyncCallback) {
      try {
        var redisConfig = {
          host    : userConfig.REDIS_HOST,
          port    : userConfig.REDIS_PORT,
          user    : userConfig.REDIS_USER,
          password: userConfig.REDIS_PASSWORD,
          db      : userConfig.REDIS_DATABASE || 0,
          useTLS  : userConfig.REDIS_USE_TLS  || false,

          disableRetry: true,
          errorCallback(err) {
            setupErrorWrap.set('redis', 'Connecting to Redis failed', err);

            if (cacheHelper) {
              cacheHelper.end();
            }
          }
        }
        cacheHelper = redisHelper.createHelper(null, redisConfig);
        cacheHelper.skipLog = true;

        cacheHelper.run('info', function(err, data) {
          if (err) {
            setupErrorWrap.set('redis', 'Access Redis failed', err);

          } else {
            var redisInfo = {
              redis_version      : null,
              total_system_memory: null,
              maxmemory          : null,
              cluster_enabled    : null,
            }
            data.split('\n').forEach(function(line) {
              for (var k in redisInfo) {
                if (line.indexOf(`${k}:`) === 0) {
                  redisInfo[k] = line.split(':')[1].trim();
                }
              }
            });

            // 检查版本号
            if (redisInfo['redis_version'] !== null) {
              var redisMajorVer = parseInt(redisInfo['redis_version'].split('.')[0]);
              if (redisMajorVer < 4) {
                setupErrorWrap.set('redis', 'Redis 4.0 or above is required', `redis_version: ${redisInfo['redis_version']}`);
              }
            }

            // 检查可用内存
            if (redisInfo['total_system_memory'] !== null) {
              var redisSystemMemory = parseInt(redisInfo['total_system_memory']);
              if (redisSystemMemory < MEMORY_1GB_BYTES) {
                setupErrorWrap.set('redis', 'Redis requires at least 1GB of memory', `total_system_memory: ${redisInfo['total_system_memory']}`);
              }
            }

            if (redisInfo['maxmemory'] !== null) {
              var redisMaxMemory = parseInt(redisInfo['maxmemory']);
              if (redisMaxMemory > 0 && redisMaxMemory < MEMORY_1GB_BYTES) {
                setupErrorWrap.set('redis', 'Redis requires at least 1GB of memory', `maxmemory: ${redisInfo['maxmemory']}`);
              }
            }

            // 检查是否为集群
            if (redisInfo['cluster_enabled'] !== null) {
              var redisClusterEnabled = redisInfo['cluster_enabled'] !== '0';
              if (redisClusterEnabled) {
                setupErrorWrap.set('redis', 'DataFlux Func does not support Redis Cluster', `cluster_enabled: ${redisInfo['cluster_enabled']}`);
              }
            }
          }

          return asyncCallback();
        });

      } catch(err) {
        setupErrorWrap.set('redis', 'Unexpected error with Redis', err);
        return asyncCallback();
      }
    },
    // Init DB
    function(asyncCallback) {
      if (setupErrorWrap.hasError()) return asyncCallback();

      var initSQLPath = path.join(__dirname, '../db/dataflux_func_latest.sql');
      var initSQL = fs.readFileSync(initSQLPath).toString();

      dbHelper.query(initSQL, null, function(err, data) {
        if (err) {
          setupErrorWrap.set('mysqlInit', 'Initializing MySQL database failed', err);
        }

        return asyncCallback();
      });
    },
    // Add sys config
    function(asyncCallback) {
      if (setupErrorWrap.hasError()) return asyncCallback();

      var sql = 'INSERT INTO `wat_main_system_setting` SET ?';
      var sqlParams = [
        {
          id   : SYS_CONFIG_ID_UPGRADE_DB_SEQ,
          value: UPGRADE_INFO[UPGRADE_INFO.length - 1].seq,
        }
      ];
      dbHelper.query(sql, sqlParams, function(err, data) {
        if (err) {
          setupErrorWrap.set('mysqlInit', 'Initializing system settings failed', err);
        }

        return asyncCallback();
      });
    },
    // Add Guance connector
    function(asyncCallback) {
      if (setupErrorWrap.hasError()) return asyncCallback();
      if (toolkit.isNothing(guanceConnectorConfig)) return asyncCallback();

      var sql = 'INSERT INTO `biz_main_connector` SET ?';
      var sqlParams = [
        {
          id         : 'guance',
          title      : 'Guance',
          description: `Created at ${toolkit.getDateTimeStringCN()} during Setup`,
          type       : 'guance',
          configJSON : JSON.stringify(guanceConnectorConfig),
          pinTime    : new Date(),
        }
      ];
      dbHelper.query(sql, sqlParams, function(err, data) {
        if (err) {
          setupErrorWrap.set('guanceInit', 'Initializing Guance connector failed', err);
        }

        return asyncCallback();
      });
    },
    // Auto Setup Init AK
    function(asyncCallback) {
      if (setupErrorWrap.hasError()) return asyncCallback();
      if (!userConfig.AUTO_SETUP_AK_SECRET) return asyncCallback();

      var sql = 'INSERT INTO `wat_main_access_key` SET ?';
      var sqlParams = [
        {
          id    : userConfig.AUTO_SETUP_AK_ID || AUTO_SETUP_DEFAULT_AK_ID,
          userId: ADMIN_USER_ID,
          name  : 'Auto Setup Init AK',
          secret: userConfig.AUTO_SETUP_AK_SECRET,
        }
      ];
      dbHelper.query(sql, sqlParams, function(err, data) {
        if (err) {
          setupErrorWrap.set('akInit', 'Initializing AccessKey failed', err);
        }

        return asyncCallback();
      });
    },
    // Update admin password
    function(asyncCallback) {
      if (setupErrorWrap.hasError()) return asyncCallback();

      var adminPasswordHash = toolkit.getSaltedPasswordHash(
          ADMIN_USER_ID, adminPassword, userConfig.SECRET);

      var sql = 'UPDATE `wat_main_user` SET ? WHERE `id` = ?';
      var sqlParams = [
        {
          username    : adminUsername,
          passwordHash: adminPasswordHash,
        },
        ADMIN_USER_ID,
      ]
      dbHelper.query(sql, sqlParams, function(err, data) {
        if (err) {
          setupErrorWrap.set('adminUser', 'Set administrator password failed', err);
        }

        return asyncCallback();
      });
    },
  ], function(err) {
    if (err) return process.exit(1);

    if (setupErrorWrap.hasError()) return callback(setupErrorWrap);

    // Merge to user config
    Object.assign(USER_CONFIG, userConfig);
    USER_CONFIG._IS_INSTALLED = true;

    delete USER_CONFIG.ADMIN_USERNAME;
    delete USER_CONFIG.ADMIN_PASSWORD;
    delete USER_CONFIG.ADMIN_PASSWORD_REPEAT;

    delete USER_CONFIG.AUTO_SETUP;
    delete USER_CONFIG.AUTO_SETUP_ADMIN_USERNAME;
    delete USER_CONFIG.AUTO_SETUP_ADMIN_PASSWORD;
    delete USER_CONFIG.AUTO_SETUP_AK_ID;
    delete USER_CONFIG.AUTO_SETUP_AK_SECRET;

    delete USER_CONFIG.GUANCE_NODE;
    delete USER_CONFIG.GUANCE_API_KEY_ID;
    delete USER_CONFIG.GUANCE_API_KEY;

    fs.writeFileSync(CONFIG.CONFIG_FILE_PATH, yaml.dump(USER_CONFIG));

    console.log('DataFlux Func Installed.');

    // Response for redirection
    var redirectURL = userConfig.WEB_BASE_URL || CONFIG.WEB_BASE_URL || null;
    return callback(null, redirectURL);
  });
};

function runSetupServer() {
  /*
    配置向导为一个单页面应用，在服务器应用之前启动
    用户确认配置信息后，应用将配置写入`user-config.yaml`文件中并退出
    随后服务器应用启动

    **当同时启动多个实例时，
    每个进程定期检测配置信息中`_IS_INSTALLED`的值判断是否已经安装完毕
    检测发现安装完毕后自动退出
   */

  // 启动已安装检测
  setInterval(function() {
    // 每次都需要重新加载配置文件，检查是否已安装
    yamlResources.loadConfig(path.join(__dirname, '../config.yaml'), function(err, config) {
      if (err) {
        console.log(err);
        return process.exit(1);
      }

      // 进入下一轮等待
      if (!config._IS_INSTALLED) {
        console.log('Waiting for installation.');
        return;
      }

      // 退出配置程序，执行后一个程序
      console.log('Other process finished installation.');
      return process.exit(0);
    });
  }, CHECKER_INTERVAL);

  // Express
  var app = express();

  // App Setting
  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'ejs');

  // Static files
  app.use('/statics', express.static(path.join(__dirname, 'statics')));

  // Setup page
  app.get('/', function(req, res) {
    var defaultConfig = toolkit.jsonCopy(CONFIG);

    // 默认管理员用户/密码
    defaultConfig['ADMIN_USERNAME']        = ADMIN_DEFUALT_USERNAME;
    defaultConfig['ADMIN_PASSWORD']        = ADMIN_DEFUALT_PASSWORD;
    defaultConfig['ADMIN_PASSWORD_REPEAT'] = ADMIN_DEFUALT_PASSWORD;

    var GUANCE_NODES = [];
    async.series([
      // 查询所有观测云节点
      function(asyncCallback) {
        common.getGuanceNodes(function(err, guanceNodes) {
          if (err) {
            console.log('Get Guance Nodes failed', err);
            return asyncCallback(err);
          }

          GUANCE_NODES = guanceNodes;

          return asyncCallback();
        });
      },
    ], function(err) {
      var pageData = {
        CONFIG      : defaultConfig,
        IMAGE_INFO  : IMAGE_INFO,
        GUANCE_NODES: GUANCE_NODES,
      }
      res.render('setup', pageData);
    });
  });

  // Setup handler
  app.use(bodyParser.json({limit: '1mb'}));
  app.post('/setup', function(req, res, next) {
    // 配置来自接口调用上报
    var userConfig = req.body.userConfig || {};

    _doSetup(userConfig, function(setupErrorWrap, redirectURL) {
      if (setupErrorWrap && setupErrorWrap.hasError()) {
        res.status(400);
        return res.send({ setupErrors: setupErrorWrap.toJSON() });
      }

      res.send({ redirectURL: redirectURL });

      // 配置成功后，关闭服务器
      setTimeout(function() {
        server.close();
      }, 3 * 1000);
    });
  });

  // Redirect to /
  app.use(function(req, res) {
    res.redirect('/');
  });

  var server = http.createServer(app);

  var listenOpt = {
    host: '0.0.0.0',
    port: CONFIG.WEB_PORT,
  };
  server.listen(listenOpt, function() {
    // Print some message of the server
    console.log(toolkit.strf('Setup Server is listening on {0}  (Press CTRL+C to quit)', CONFIG.WEB_PORT));
  });
}

function runUpgrade() {
  /*
    更新处理默认数据库/缓存能够正常连接

    **当同时启动多个实例时，
    每个进程依靠判断Redis排他锁确定是否已经有其他进程正在更新
    当发现有其他进程正在更新时，则转为定期检查是否已经更新完毕
    检测发现更新完毕后自动退出
   */
  if (toolkit.isNothing(UPGRADE_INFO)) {
    console.log('No upgrade info, skip.');
    process.exit(0);
  }

  // Init
  var cacheHelper = redisHelper.createHelper();
  var dbHelper    = mysqlHelper.createHelper();

  var currentUpgradeSeq = null;
  var nextUpgradeSeq    = null;
  var upgradeItems      = null;

  var lockKey     = toolkit.strf('{0}#upgradeLock', CONFIG.APP_NAME);
  var lockValue   = toolkit.genRandString();
  var maxLockTime = 30;

  var system_setting_table = 'wat_main_system_setting';
  async.series([
    // 检查当前系统设置表名
    //    wat_main_system_config OR wat_main_system_setting
    function(asyncCallback) {
      var sql = "SHOW TABLES LIKE 'wat_main_system_setting'";
      dbHelper.query(sql, null, function(err, dbRes) {
        if (err) return asyncCallback(err);

        // 不存在新版系统设置表，旧表
        if (dbRes.length <= 0) {
          system_setting_table = 'wat_main_system_config';
        }

        return asyncCallback();
      });
    },
    // 更新数据库旧版标记
    function(asyncCallback) {
      var sql = 'UPDATE ?? SET id = ? WHERE id = ?';
      var sqlParams = [
        system_setting_table,
        SYS_CONFIG_ID_UPGRADE_DB_SEQ,
        SYS_CONFIG_ID_UPGRADE_DB_SEQ_OLD,
      ];
      dbHelper.query(sql, sqlParams, asyncCallback);
    },
    // Check upgrade lock
    function(asyncCallback) {
      cacheHelper.lock(lockKey, lockValue, maxLockTime, function(err, cacheRes) {
        if (err) {
          console.log('Checking upgrade status failed: ', err);
          return process.exit(1);
        }

        // 正常取得锁，继续执行
        if (cacheRes) return asyncCallback();

        // 未能取得锁，其他进程正在更新，等待锁失效后认为更新完毕
        console.log('Other process is running upgrade, waiting...');
        setInterval(function() {
          cacheHelper.get(lockKey, function(err, cacheRes) {
            if (err) {
              console.log('Waiting upgrade status failed: ', err);
              return process.exit(1);
            }

            if (cacheRes) {
              console.log('Upgrading is still running...');
              return;
            }

            console.log('Upgrading ended, start application...');
            return process.exit(0)
          });
        }, CHECKER_INTERVAL);
      });
    },
    // Get upgrade items
    function(asyncCallback) {
      var sql = 'SELECT value FROM ?? WHERE id = ?';
      var sqlParams = [
        system_setting_table,
        SYS_CONFIG_ID_UPGRADE_DB_SEQ,
      ];
      dbHelper.query(sql, sqlParams, function(err, dbRes) {
        if (err) return asyncCallback(err);

        if (dbRes.length <= 0) {
          // 从未升级过，执行所有升级项
          currentUpgradeSeq = null;
          upgradeItems = UPGRADE_INFO;

        } else if (dbRes.length > 0) {
          // 曾经升级过，仅执行后续升级项
          currentUpgradeSeq = parseInt(dbRes[0].value);

          upgradeItems = UPGRADE_INFO.filter(function(d) {
            return d.seq > currentUpgradeSeq;
          });
        }

        return asyncCallback();
      });
    },
    // Do upgrade
    function(asyncCallback) {
      if (toolkit.isNothing(upgradeItems)) {
        console.log('Already up to date, skip.');
        return asyncCallback();
      }

      console.log(toolkit.strf('Run upgrade: {0} -> {1}',
          toolkit.isNothing(currentUpgradeSeq) ? 'BASE' : currentUpgradeSeq,
          upgradeItems[upgradeItems.length -1].seq));

      async.eachSeries(upgradeItems, function(item, eachCallback) {
        console.log(toolkit.strf('Upgading to SEQ {0}...', item.seq));

        if (item.skipWhenSetup) {
          // 跳过部分升级处理
          nextUpgradeSeq = item.seq;

          return eachCallback();

        } else {
          // 正常执行升级处理
          dbHelper.query(item.database, null, function(err) {
            if (err) return eachCallback(err);

            nextUpgradeSeq = item.seq;

            cacheHelper.extendLockTime(lockKey, lockValue, maxLockTime, function(err) {
              if (err) return console.log('Extend upgrading lock time failed: ', err);
            });

            return eachCallback();
          });
        }
      }, asyncCallback);
    },
    // Update upgrade seq
    function(asyncCallback) {
      if (toolkit.isNothing(nextUpgradeSeq)) return asyncCallback();

      // 此时系统设置表一定为新表名
      var sql = toolkit.isNothing(currentUpgradeSeq)
              ? 'INSERT INTO wat_main_system_setting SET value = ?, id = ?'
              : 'UPDATE wat_main_system_setting SET value = ? WHERE id = ?';
      var sqlParams = [nextUpgradeSeq, SYS_CONFIG_ID_UPGRADE_DB_SEQ];

      dbHelper.query(sql, sqlParams, function(err) {
        if (err) return asyncCallback(err);

        console.log('Upgrading completed.');

        return asyncCallback();
      });
    },
  ], function(err) {
    cacheHelper.unlock(lockKey, lockValue);

    if (err) {
      console.log('Upgrading failed: ', err);
      return process.exit(1);
    }

    return process.exit(0);
  });
}

// Load extra YAML resources and run
yamlResources.loadConfig(path.join(__dirname, '../config.yaml'), function(err, _config, _userConfig) {
  if (err) throw err;

  mysqlHelper = require('./utils/extraHelpers/mysqlHelper');
  redisHelper = require('./utils/extraHelpers/redisHelper');

  CONFIG      = _config;
  USER_CONFIG = _userConfig;

  // Load upgrade info
  var upgradeInfoPath = path.join(__dirname, '../upgrade-info.yaml')
  UPGRADE_INFO = yaml.load(fs.readFileSync(upgradeInfoPath)).upgradeInfo;

  var callback = null;

  if (CONFIG._DISABLE_SETUP) {
    console.log('Setup disabled, skip...');
    return process.exit(0);
  }

  if (!CONFIG._IS_INSTALLED) {
    // 尚未安装

    if (CONFIG.AUTO_SETUP) {
      // 自动配置
      console.log('Start auto setup...')

      USER_CONFIG.SECRET = toolkit.genRandString(16);
      return _doSetup(USER_CONFIG, function(setupErrorWrap) {
        if (setupErrorWrap && setupErrorWrap.hasError()) {
          console.log(setupErrorWrap.toJSON());
          return process.exit(1);
        }

        console.log('Auto setup finished.');
        return process.exit(0);
      });

    } else {
      // 运行配置服务器，并提供配置页面
      console.log('Start setup guide...');
      callback = runSetupServer;
    }

  } else {
    // Upgrade
    console.log('Start upgrade process...');
    callback = runUpgrade;
  }

  if ('function' === typeof callback) {
    require('./appInit').beforeAppCreate(callback);
  }
});
