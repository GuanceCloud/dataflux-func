'use strict';

/* Monkey patch */
require('./monkeyPatch');

/* Built-in Modules */
var path         = require('path');
var http         = require('http');
var https        = require('https');
var childProcess = require('child_process');

/* 3rd-party Modules */
var fs               = require('fs-extra');
var express          = require('express');
var expressUseragent = require('express-useragent');
var bodyParser       = require('body-parser');
var cookieParser     = require('cookie-parser');
var cors             = require('cors');

/* Init */

/* Load YAML resources */
var yamlResources = require('./utils/yamlResources');

yamlResources.loadFile('IMAGE_INFO', path.join(__dirname, '../image-info.json'));
yamlResources.loadFile('CONST',      path.join(__dirname, '../const.yaml'));
yamlResources.loadFile('ROUTE',      path.join(__dirname, './route.yaml'));
yamlResources.loadFile('PRIVILEGE',  path.join(__dirname, './privilege.yaml'));

// Load arch
yamlResources.set('IMAGE_INFO', 'ARCHITECTURE',
  childProcess.execFileSync('uname', [ '-m' ]).toString().trim());

var CONFIG = null;

// Load extra YAML resources
yamlResources.loadConfig(path.join(__dirname, '../config.yaml'), function(err, _config) {
  if (err) throw err;

  CONFIG = _config;

  // 优先使用观测云集群指定的 Web 绑定地址
  if (process.env['GUANCE_BIND_IP']) {
    CONFIG.WEB_BIND = process.env['GUANCE_BIND_IP'];
  }

  require('./appInit').prepare(function() {
    startApplication();
  });
});

function startApplication() {
  /* Project Modules */
  var E           = require('./utils/serverError');
  var toolkit     = require('./utils/toolkit');
  var logHelper   = require('./utils/logHelper');
  var routeLoader = require('./utils/routeLoader');

  // Linux Distro
  var linuxDistro = null;
  try {
      linuxDistro = toolkit.safeReadFileSync('/linux-distro')
                || childProcess.execFileSync('lsb_release', [ '-is' ]).toString()
                || 'UNKNOWN';
      linuxDistro = linuxDistro.trim();
  } catch(err) {
    // Nope
  } finally {
    yamlResources.set('IMAGE_INFO', 'LINUX_DISTRO', linuxDistro);
  }

  // Express
  var app = express();

  // gzip
  app.use(require('compression')());

  // For SLB Health check
  app.head('/', function(req, res, next) {
    return res.send('OK');
  });

  // For index jumping
  app.get('/', function(req, res, next) {
    return res.redirect(CONFIG._WEB_CLIENT_APP_PATH);
  });

  // Logger
  app.use(logHelper.requestLoggerInitialize);

  // App Setting
  app.set('x-powered-by', false);
  app.set('trust proxy', true);
  app.set('etag', 'weak');
  app.set('env', CONFIG.MODE === 'prod' ? 'production' : 'development');
  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'ejs');
  app.set('view cache', CONFIG.MODE === 'prod');

  // CORS
  var corsConfig = {
    origin              : CONFIG.WEB_CORS_ORIGIN,
    credentials         : CONFIG.WEB_CORS_CREDENTIALS,
    exposedHeaders      : '*',
    optionsSuccessStatus: 200,
    maxAge              : 86400,
  }
  if ('string' === typeof corsConfig.origin) {
    corsConfig.origin = toolkit.asArray(corsConfig.origin);
  }
  if (Array.isArray(corsConfig.origin)) corsConfig.origin.forEach(function(origin, index) {
    if ('string' === typeof origin && origin.indexOf('regexp:') === 0) {
      corsConfig.origin[index] = new RegExp(origin.replace('regexp:', ''));
    }
  });
  app.use(cors(corsConfig));

  // Client APP
  app.use(CONFIG._WEB_CLIENT_APP_PATH, express.static(path.join(__dirname, '../client/dist')));

  // Static files
  app.use('/statics', express.static(path.join(__dirname, 'statics')));
  app.use('/doc',     express.static(path.join(__dirname, 'doc')));

  // User agent
  app.use(expressUseragent.express());

  // Cookie
  app.use(cookieParser(CONFIG.SECRET));

  // Initialize
  app.use(require('./utils/responseInitialize'));

  // Favicon
  app.use('/favicon.ico', require('./utils/favicon'));

  // Body paser
  app.use(function(req, res, next) {
    res.locals.isBodyParsing = true;
    return next();
  });

  app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
  app.use(bodyParser.json({limit: '50mb'}));
  app.use(bodyParser.text({limit: '50mb'}));
  app.use(bodyParser.raw({limit: '50mb', type: function(req) {
    // 非文件上传的请求执行raw解析
    var isUpload = req.get('content-type') && req.get('content-type').indexOf('multipart/form-data') >= 0;
    return !isUpload;
  }}));

  app.use(function(err, req, res, next) {
    if (err && res.locals.isBodyParsing) {
      res.locals.logger.logError(err);

      // 解析错误时返回固定错误信息
      err = new E('EClientBadRequest', 'Invalid request body');
    }

    res.locals.isBodyParsing = false;
    return next(err);
  });

  // 集成登录认证
  app.use(require('./controllers/mainAPICtrl').integratedAuthMid);

  // Dump user information
  if (CONFIG.MODE === 'dev') {
    app.use(require('./utils/requestDumper').dumpUserInformation);
  }

  // Load routes
  require('./routers/indexAPIRouter');
  require('./routers/authAPIRouter');
  require('./routers/userAPIRouter');
  require('./routers/accessKeyAPIRouter');
  require('./routers/monitorAPIRouter');
  require('./routers/systemSettingAPIRouter');
  require('./routers/tempFlagAPIRouter');
  require('./routers/debugAPIRouter');

  require('./routers/mainAPIRouter');
  require('./routers/pythonPackageAPIRouter');
  require('./routers/resourceAPIRouter');

  require('./routers/scriptSetAPIRouter');
  require('./routers/scriptAPIRouter');
  require('./routers/funcAPIRouter');

  require('./routers/scriptRecoverPointAPIRouter');

  require('./routers/scriptPublishHistoryAPIRouter');
  require('./routers/scriptSetExportHistoryAPIRouter');
  require('./routers/scriptSetImportHistoryAPIRouter');

  require('./routers/connectorAPIRouter');
  require('./routers/envVariableAPIRouter');

  require('./routers/apiAuthAPIRouter');

  require('./routers/syncAPIRouter');
  require('./routers/asyncAPIRouter');
  require('./routers/cronJobAPIRouter');

  require('./routers/taskRecordAPIRouter');
  require('./routers/taskRecordFuncAPIRouter');

  require('./routers/operationRecordAPIRouter');

  require('./routers/fileServiceAPIRouter');
  require('./routers/funcCacheAPIRouter');
  require('./routers/funcStoreAPIRouter');

  require('./routers/blueprintAPIRouter');
  require('./routers/scriptMarketAPIRouter');

  // 兼容处理
  require('./routers/authLinkAPIRouter');
  require('./routers/crontabConfigAPIRouter');
  require('./routers/batchAPIRouter');

  routeLoader.mount(app);

  // More Server initialize
  var serverLogger = logHelper.createHelper();
  app.locals.logger = serverLogger;

  app.locals.db = require('./utils/extraHelpers/mysqlHelper').createHelper(serverLogger);
  app.locals.db.skipLog = true;

  app.locals.cacheDB = require('./utils/extraHelpers/redisHelper').createHelper(serverLogger);
  app.locals.cacheDB.skipLog = true;

  // Generate 404 Error
  app.use(function gen404Error(req, res, next) {
    if (CONFIG.MODE === 'dev') {
      res.locals.logger.debug('[MID] IN app.404Error');
    }

    return next(new E('EClientNotFound', 'No such router. Please make sure that the METHOD is correct and no spelling missing in the URL', {
      method: req.method,
      url   : req.originalUrl,
    }));
  });

  // Handle Error
  app.use(function handleError(err, req, res, next) {
    if (!res.locals.logger) {
      res.locals.logger = serverLogger;
    }

    if (CONFIG.MODE === 'dev') {
      res.locals.logger.debug('[MID] IN app.handleError');
    }

    // Wrap general error
    if (!E.prototype.isPrototypeOf(err)) {
      var errMessage = 'A System error occured. Please report this response to the administrator';
      var errStack   = null;

      if (CONFIG.MODE === 'dev') {
        errMessage = err.toString();
        errStack   = err.stack;
      }

      err = new E('ESys', errMessage, errStack, err);
    }

    // Set status code
    err.status = parseInt(err.status || 500);
    res.status(err.status);
    res.locals.responseStatus = err.status;

    if (err.status < 599) {
      // Print error
      if (!err.originError) {
        if (err.status >= 500) {
          res.locals.logger.error(err.toString());
        } else if (err.status >= 400) {
          res.locals.logger.warning(err.toString());
        }
      }

      // Print stack
      if (err.status >= 500) {
        var stack = err.originError
                  ? err.originError.stack
                  : err.stack;

        if (stack) {
          var stackLines = stack.split('\n');
          for (var i = 0; i < stackLines.length; i++) {
            (res.locals.logger || console).error(stackLines[i]);
          }
        }
      }
    }

    switch (res.locals.requestType) {
      case 'api':
        if ('function' !== typeof res.locals.sendJSON) {
          return res.send(err.toJSON());
        }

        // Response a JSON string
        var errorRet = err.toJSON();
        errorRet.reqDump = {
          method: req.method,
          url   : req.originalUrl,
        }
        if (toolkit.notNothing(req.body)) {
          var bodyDump = toolkit.jsonDumps(req.body, 2);
          bodyDump = toolkit.limitText(bodyDump, 1000, { showLength: 'newLine' });
          errorRet.reqDump.bodyDump = bodyDump;
        }
        return res.locals.sendJSON(errorRet);

      case 'page':
      default:
        if ('function' !== typeof res.locals.render) {
          return res.send(err.toHTML());
        }

        // Response a HTML page
        return res.locals.render('error', {
          error : err,
          CONFIG: CONFIG,
        });
    }
  });

  var server = null;
  var serveHTTPS = toolkit.toBoolean(process.env['GUANCE_SELF_TLS_ENABLE']);
  if (serveHTTPS) {
    // 启用 HTTPS
    var httpsOpt = {
      key : fs.readFileSync('/etc/guance/inner-tls.key'),
      cert: fs.readFileSync('/etc/guance/inner-tls.cert'),
    }
    server = https.createServer(httpsOpt, app);

  } else {
    // 不启用 HTTPS
    server = http.createServer(app);
  }

  require('./messageHandlers/socketIOHandler')(app, server);

  var listenOpt = {
    host: CONFIG.WEB_BIND,
    port: CONFIG.WEB_PORT,
  };
  server.listen(listenOpt, function() {
    // Print some message of the server
    console.log(toolkit.strf('Web Server is listening on {0}://{1}:{2} (Press CTRL+C to quit)', serveHTTPS ? 'https' : 'http', CONFIG.WEB_BIND, CONFIG.WEB_PORT));
    console.log(toolkit.strf('PID: {0}', process.pid));
    console.log('Have fun!');

    // Non-request code here...
    require('./appInit').afterServe(app);

    // Sub client
    require('./sub').runListener(app);

    // Guance WS client
    require('./guanceWebSocket').runListener(app);

    // Check restart flag
    setInterval(function checkRestartFlag() {
      var cacheKey = toolkit.getGlobalCacheKey('tempFlag', 'restartAllServers');
      app.locals.cacheDB.get(cacheKey, function(err, cacheRes) {
        if (!cacheRes) return;

        var restartFlagTime = parseInt(cacheRes);
        if (restartFlagTime <= toolkit.sysStartTime()) return;

        app.locals.logger.warning(`Flag \`restartAllServers\` is set at ${toolkit.getISO8601(restartFlagTime * 1000)}, all Servers will be restarted soon...`);
        toolkit.sysExitRestart();
      });
    }, 5 * 1000);
  });
}
