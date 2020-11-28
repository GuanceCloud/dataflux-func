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

/* Project Modules */
var toolkit = require('./utils/toolkit');

/* Load YAML resources */
var yamlResources = require('./utils/yamlResources');

var CONFIG       = null;
var UPGRADE_INFO = null;

var SETUP_CHECKING_INTERVAL = 3 * 1000;

// DB/Cache helper should load AFTER config is loaded.
var mysqlHelper = null;
var redisHelper = null;

// Load extra YAML resources
yamlResources.loadConfig(path.join(__dirname, '../config.yaml'), function(err, _config) {
  if (err) throw err;

  mysqlHelper = require('./utils/extraHelpers/mysqlHelper');
  redisHelper = require('./utils/extraHelpers/redisHelper');

  CONFIG = _config;

  if (CONFIG._DISABLE_SETUP) {
    console.log('Setup disabled, skip.');
    return process.exit(0);
  }

  // Load upgrade info
  var upgradeInfoPath = path.join(__dirname, '../upgrade-info.yaml')
  var upgradeInfo = yaml.load(fs.readFileSync(upgradeInfoPath)).upgradeInfo;
  UPGRADE_INFO = upgradeInfo[upgradeInfo.length - 1] || { seq: 0 };

  if (!CONFIG._IS_INSTALLED) {
    // New install
    console.log('Start Installation guide...')
    startInstallation();

  } else if (CONFIG._CURRENT_UPGRADE_SEQ < UPGRADE_INFO.seq) {
    // Run upgrade
    runUpgrade();

  } else {
    // Do nothing
    console.log('Nothing to setup, skip.');
    return process.exit(0);
  }
});

function startInstallation() {
  /*
    安装向导为一个单页面应用，在服务器应用之前启动
    用户确认配置信息后，应用将配置写入`user-config.yaml`文件中并退出
    随后服务器应用启动

    **当同时启动多个实例时，
    每个进程定期检测配置信息中`_IS_INSTALLED`的值判断是否已经安装完毕
    检测发现安装完毕后自动退出
   */
  function installationChecker() {
    yamlResources.loadConfig(path.join(__dirname, '../config.yaml'), function(err, _config) {
      if (err) {
        console.log(err);

        if (installationCheckerT) clearInterval(installationCheckerT);
        return process.exit(1);
      }

      if (!_config._IS_INSTALLED) {
        console.log('Waiting installation.');
        return;
      }

      console.log('Other process finished installation.');

      if (installationCheckerT) clearInterval(installationCheckerT);
      return process.exit(0);
    });
  }
  var installationCheckerT = setInterval(installationChecker, SETUP_CHECKING_INTERVAL);

  // Express
  var app = express();

  // App Setting
  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'ejs');

  // Static files
  app.use('/statics', express.static(path.join(__dirname, 'statics')));

  // Install page
  app.get('*', function(req, res) {
    var defaultConfig = toolkit.jsonCopy(CONFIG);

    // 默认管理员用户/密码
    defaultConfig['ADMIN_USERNAME']        = 'admin';
    defaultConfig['ADMIN_PASSWORD']        = 'admin';
    defaultConfig['ADMIN_PASSWORD_REPEAT'] = 'admin';

    res.render('install', { CONFIG: defaultConfig });
  });

  // Install handler
  app.use(bodyParser.json({limit: '1mb'}));
  app.post('/install', function(req, res, next) {
    clearInterval(installationCheckerT);

    var config = req.body.config || {};
    var initDB = req.body.initDB || false;
    var skip   = req.body.skip   || false;

    var redirectURL = config.WEB_BASE_URL || CONFIG.WEB_BASE_URL;

    // Skip install
    if (skip) {
      res.send({ redirect: redirectURL });

      server.close();
      return process.exit(0);
    }

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

          cacheHelper._run('select', (config.REDIS_DATABASE || 0), function(err, data) {
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
        if (!initDB || configErrors.mysql) return asyncCallback();

        var initSQLPath = path.join(__dirname, '../db/dataflux_func_latest.sql');
        var initSQL = fs.readFileSync(initSQLPath).toString();

        dbHelper.query(initSQL, null, function(err, data) {
          if (err) configErrors['mysqlInit'] = '初始化MySQL失败：' + err.toString();

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
      config.MODE          = 'prod';
      config._IS_INSTALLED = true;
      config._CURRENT_UPGRADE_SEQ  = UPGRADE_INFO.seq;

      fs.writeFileSync(CONFIG.CONFIG_FILE_PATH, yaml.dump(config));

      console.log('App installed.')

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

function runUpgrade() {
  /*
    更新处理默认数据库/缓存能够正常连接

    **当同时启动多个实例时，
    每个进程依靠判断Redis排他锁确定是否已经有其他进程正在更新
    当发现有其他进程正在更新时，则转为定期检查是否已经更新完毕
    检测发现更新完毕后自动退出
   */

  // Load upgrade info
  var upgradeInfoPath = path.join(__dirname, '../upgrade-info.yaml')
  var upgradeInfo = yaml.load(fs.readFileSync(upgradeInfoPath)).upgradeInfo;

  if (toolkit.isNothing(upgradeInfo)) {
    console.log('No upgrade info, skip.');
    process.exit(0);
  }

  var upgradeItems = upgradeInfo.filter(function(d) {
    return d.seq > CONFIG._CURRENT_UPGRADE_SEQ;
  });

  if (toolkit.isNothing(upgradeItems)) {
    console.log('Already up to date, skip.');
    process.exit(0);
  }

  var cacheHelper = null;
  var dbHelper    = null;

  var lockKey     = toolkit.strf('{0}#upgradeLock', CONFIG.APP_NAME);
  var lockValue   = toolkit.genRandString();
  var maxLockTime = 30;
  async.series([
    // Check upgrade lock
    function(asyncCallback) {
      var _config = {
        host    : CONFIG.REDIS_HOST,
        port    : CONFIG.REDIS_PORT,
        password: CONFIG.REDIS_PASSWORD,
      }
      cacheHelper = redisHelper.createHelper(null, _config);
      cacheHelper.skipLog = true;

      cacheHelper.lock(lockKey, lockValue, maxLockTime, function(err, cacheRes) {
        if (err) {
          console.log('Checking upgrade status failed: ', err);
          return process.exit(1);
        }

        if (!cacheRes) {
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
          }, SETUP_CHECKING_INTERVAL);

        } else {
          console.log(toolkit.strf('Run upgrade ({0} -> {1})...', CONFIG._CURRENT_UPGRADE_SEQ, UPGRADE_INFO.seq));
          return asyncCallback();
        }
      });
    },
    // Do upgrade
    function(asyncCallback) {
      var _config = {
        host    : CONFIG.MYSQL_HOST,
        port    : CONFIG.MYSQL_PORT,
        user    : CONFIG.MYSQL_USER,
        password: CONFIG.MYSQL_PASSWORD,
        database: CONFIG.MYSQL_DATABASE,
      }
      dbHelper = mysqlHelper.createHelper(null, _config);
      dbHelper.skipLog = true;

      var currentUpgradeSeq = CONFIG._CURRENT_UPGRADE_SEQ;
      async.eachSeries(upgradeItems, function(item, eachCallback) {
        console.log(toolkit.strf('Upgading to SEQ {0}...', item.seq));

        dbHelper.query(item.database, null, function(err) {
          if (err) return eachCallback(err);

          currentUpgradeSeq = item.seq;

          cacheHelper.extendLockTime(lockKey, lockValue, maxLockTime, function(err) {
            if (err) return console.log('Extend upgrading lock time failed: ', err);
          });

          return eachCallback();
        });
      }, function(err) {
        // Save upgrade seq to user-config.yaml
        var userConfig = yaml.load(fs.readFileSync(CONFIG.CONFIG_FILE_PATH));

        userConfig._CURRENT_UPGRADE_SEQ = currentUpgradeSeq;

        fs.writeFileSync(CONFIG.CONFIG_FILE_PATH, yaml.dump(userConfig));

        cacheHelper.unlock(lockKey, lockValue);

        if (err) {
          console.log('Upgrading failed: ', err);
          return process.exit(1);
        }

        console.log('Upgrading completed.');
        return process.exit(0);
      });
    },
  ]);
}
