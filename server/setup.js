'use strict';

/* Builtin Modules */
var path = require('path');
var http = require('http');
var fs   = require('fs-extra');

/* 3rd-party Modules */
var express    = require('express');
var bodyParser = require('body-parser');
var async      = require('async');
var yaml       = require('js-yaml');
var minimist   = require('minimist');

/* Project Modules */
var toolkit = require('./utils/toolkit');

/* Load YAML resources */
var yamlResources = require('./utils/yamlResources');

var CONFIG       = null;
var USER_CONFIG  = null;
var UPGRADE_INFO = null;

var ARGV = minimist(process.argv.slice(2));

var INSTALL_CHECK_INTERVAL            = 3 * 1000;
var SYS_CONFIG_ID_CURRENT_UPGRADE_SEQ = 'upgrade.db.upgradeSeq';

// DB/Cache helper should load AFTER config is loaded.
var mysqlHelper = null;
var redisHelper = null;

// Load extra YAML resources
yamlResources.loadConfig(path.join(__dirname, '../config.yaml'), function(err, _config, _userConfig) {
  if (err) throw err;

  mysqlHelper = require('./utils/extraHelpers/mysqlHelper');
  redisHelper = require('./utils/extraHelpers/redisHelper');

  CONFIG      = _config;
  USER_CONFIG = _userConfig;

  // Load upgrade info
  var upgradeInfoPath = path.join(__dirname, '../upgrade-info.yaml')
  UPGRADE_INFO = yaml.load(fs.readFileSync(upgradeInfoPath)).upgradeInfo;

  if (CONFIG._DISABLE_SETUP) {
    console.log('Installation disabled, skip.');
    return process.exit(0);
  }

  if (!CONFIG._IS_INSTALLED) {
    // New setup
    console.log('Start setup guide...')
    runSetup();

  } else {
    // Upgrade
    console.log('Start upgrade process...')
    checkAndRunUpgrade();
  }
});

function runSetup() {
  /*
    安装向导为一个单页面应用，在服务器应用之前启动
    用户确认配置信息后，应用将配置写入`user-config.yaml`文件中并退出
    随后服务器应用启动

    **当同时启动多个实例时，
    每个进程定期检测配置信息中`_IS_INSTALLED`的值判断是否已经安装完毕
    检测发现安装完毕后自动退出
   */
  function setupChecker() {
    yamlResources.loadConfig(path.join(__dirname, '../config.yaml'), function(err, _config) {
      if (err) {
        console.log(err);

        if (setupCheckerT) clearInterval(setupCheckerT);
        return process.exit(1);
      }

      if (!_config._IS_INSTALLED) {
        console.log('Waiting for setup.');
        return;
      }

      console.log('Other process finished setup.');

      if (setupCheckerT) clearInterval(setupCheckerT);
      return process.exit(0);
    });
  }
  var setupCheckerT = setInterval(setupChecker, INSTALL_CHECK_INTERVAL);

  // Express
  var app = express();

  // App Setting
  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'ejs');

  // Static files
  app.use('/statics', express.static(path.join(__dirname, 'statics')));

  // Setup page
  app.get('*', function(req, res) {
    var defaultConfig = toolkit.jsonCopy(CONFIG);

    // 默认管理员用户/密码
    defaultConfig['ADMIN_USERNAME']        = 'admin';
    defaultConfig['ADMIN_PASSWORD']        = 'admin';
    defaultConfig['ADMIN_PASSWORD_REPEAT'] = 'admin';

    res.render('setup', { CONFIG: defaultConfig });
  });

  // Setup handler
  app.use(bodyParser.json({limit: '1mb'}));
  app.post('/setup', function(req, res, next) {
    clearInterval(setupCheckerT);

    var config = req.body.config || {};

    var redirectURL = config.WEB_BASE_URL || CONFIG.WEB_BASE_URL;

    var configErrors = {};

    var cacheHelper = null;
    var dbHelper    = null;
    async.series([
      // Check MySQL
      function(asyncCallback) {
        try {
          var _config = {
            host    : config.MYSQL_HOST,
            port    : config.MYSQL_PORT,
            user    : config.MYSQL_USER,
            password: config.MYSQL_PASSWORD,
            database: config.MYSQL_DATABASE,
          }
          dbHelper = mysqlHelper.createHelper(null, _config);
          dbHelper.skipLog = true;

          dbHelper.query('SHOW DATABASES', null, function(err, data) {
            if (err) configErrors['mysql'] = '无法连接到MySQL：' + err.toString();

            return asyncCallback();
          });

        } catch(err) {
          configErrors['mysql'] = err.toString();
          return asyncCallback();
        }
      },
      // Check Redis
      function(asyncCallback) {
        try {
          var _config = {
            host    : config.REDIS_HOST,
            port    : config.REDIS_PORT,
            password: config.REDIS_PASSWORD,
          }
          cacheHelper = redisHelper.createHelper(null, _config);
          cacheHelper.skipLog = true;

          cacheHelper.run('select', (config.REDIS_DATABASE || 0), function(err, data) {
            if (err) configErrors['redis'] = '无法连接到Redis：' + err.toString();

            return asyncCallback();
          });

        } catch(err) {
          configErrors['redis'] = err.toString();
          return asyncCallback();
        }
      },
      // Init DB
      function(asyncCallback) {
        if (configErrors.mysql) return asyncCallback();

        var initSQLPath = path.join(__dirname, '../db/dataflux_func_latest.sql');
        var initSQL = fs.readFileSync(initSQLPath).toString();

        dbHelper.query(initSQL, null, function(err, data) {
          if (err) configErrors['mysqlInit'] = '初始化MySQL失败：' + err.toString();

          return asyncCallback();
        });
      },
      // Add sys config
      function(asyncCallback) {
        var sql = 'INSERT INTO `wat_main_system_config` SET `id` = ?, `value` = ?';
        var sqlParams = [SYS_CONFIG_ID_CURRENT_UPGRADE_SEQ, UPGRADE_INFO[UPGRADE_INFO.length - 1].seq];
        dbHelper.query(sql, sqlParams, function(err, data) {
          if (err) configErrors['mysqlInit'] = '初始化系统配置项失败：' + err.toString();

          return asyncCallback();
        });
      },
      // Add builtin MQTT
      function(asyncCallback) {
        if (!ARGV.mqtt) return asyncCallback();

        var userPassword = ARGV.mqtt.split(':');
        var configJSON = JSON.stringify({
          host         : 'mqtt',
          port         : 1883,
          user         : userPassword[0],
          password     : toolkit.cipherByAES(userPassword[1], config.SECRET),
          topicHandlers: [ { topic: '$share/g/test', funcId: 'demo__mqtt.mqtt_message' } ],
        });

        var sql = 'INSERT INTO `biz_main_data_source` SET ?';
        var sqlParams = {
          id        : 'mqtt',
          title     : 'Mosquitto',
          type      : 'mqtt',
          configJSON: configJSON,
        };
        dbHelper.query(sql, sqlParams, function(err) {
          if (err) configErrors['mysqlInit'] = '自动添加内置数据源失败：' + err.toString();

          return asyncCallback();
        });
      },
      // Update admin password
      function(asyncCallback) {
        if (configErrors.mysql) return asyncCallback();

        var adminUserId         = 'u-admin';
        var adminUsername       = config.ADMIN_USERNAME;
        var adminPassword       = config.ADMIN_PASSWORD;
        var adminPasswordRepeat = config.ADMIN_PASSWORD_REPEAT;

        if (!adminUsername || !adminPassword) {
          configErrors['adminUser'] = '请配置管理员用户与密码';
          return asyncCallback();
        }

        if (!toolkit.isNothing(adminPasswordRepeat) && adminPassword !== adminPasswordRepeat) {
          configErrors['adminUser'] = '两次密码输入不一致';
          return asyncCallback();
        }

        delete config.ADMIN_USERNAME;
        delete config.ADMIN_PASSWORD;
        delete config.ADMIN_PASSWORD_REPEAT;

        var adminPasswordHash = toolkit.getSaltedPasswordHash(
            adminUserId, adminPassword, config.SECRET);

        var sql = 'UPDATE `wat_main_user` SET ? WHERE `id` = ?';
        var sqlParams = [
          {
            username    : adminUsername,
            passwordHash: adminPasswordHash,
          },
          adminUserId,
        ]
        dbHelper.query(sql, sqlParams, function(err, data) {
          if (err) configErrors['adminUser'] = '更新管理员密码失败：' + err.toString();

          return asyncCallback();
        });
      },
    ], function(err) {
      if (err) return process.exit(1);

      if (Object.keys(configErrors).length > 0) {
        res.status(400);
        res.send({ configErrors: configErrors });
        return;
      }

      // Write config file
      Object.assign(USER_CONFIG, config)
      USER_CONFIG._IS_INSTALLED = true;

      fs.writeFileSync(CONFIG.CONFIG_FILE_PATH, yaml.dump(USER_CONFIG));

      console.log('App setup.')

      // Response for redirection
      res.send({ redirect: redirectURL });

      server.close();
      return process.exit(0);
    });
  });

  var server = http.createServer(app);

  var listenOpt = {
    host: '0.0.0.0',
    port: CONFIG.WEB_PORT,
  };
  server.listen(listenOpt, function() {
    // Print some message of the server
    console.log(toolkit.strf('Installation Server is listening on {0}  (Press CTRL+C to quit)', CONFIG.WEB_PORT));
  });
}

function checkAndRunUpgrade() {
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
  async.series([
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
        }, INSTALL_CHECK_INTERVAL);
      });
    },
    // Get upgrade items
    function(asyncCallback) {
      var sql = 'SELECT value FROM wat_main_system_config WHERE id = ?';
      var sqlParams = [SYS_CONFIG_ID_CURRENT_UPGRADE_SEQ];
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

        dbHelper.query(item.database, null, function(err) {
          if (err) return eachCallback(err);

          nextUpgradeSeq = item.seq;

          cacheHelper.extendLockTime(lockKey, lockValue, maxLockTime, function(err) {
            if (err) return console.log('Extend upgrading lock time failed: ', err);
          });

          return eachCallback();
        });
      }, asyncCallback);
    },
    // Update upgrade seq
    function(asyncCallback) {
      if (toolkit.isNothing(nextUpgradeSeq)) return asyncCallback();

      var sql = toolkit.isNothing(currentUpgradeSeq)
              ? 'INSERT INTO wat_main_system_config SET value = ?, id = ?'
              : 'UPDATE wat_main_system_config SET value = ? WHERE id = ?';
      var sqlParams = [nextUpgradeSeq, SYS_CONFIG_ID_CURRENT_UPGRADE_SEQ];

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
