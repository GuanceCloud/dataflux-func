'use strict';

/* Monkey patch */
require('./monkeyPatch');

/* Built-in Modules */
var path = require('path');
var http = require('http');

/* 3rd-party Modules */
var express          = require('express');
var favicon          = require('serve-favicon');
var expressUseragent = require('express-useragent');
var bodyParser       = require('body-parser');
var cookieParser     = require('cookie-parser');
var cors             = require('cors');

/* Configure */

/* Load YAML resources */
var yamlResources = require('./utils/yamlResources');

yamlResources.loadFile('CONST',     path.join(__dirname, './const.yaml'));
yamlResources.loadFile('ROUTE',     path.join(__dirname, './route.yaml'));
yamlResources.loadFile('PRIVILEGE', path.join(__dirname, './privilege.yaml'));

var CONFIG = null;

// Load extra YAML resources
yamlResources.loadConfig(path.join(__dirname, '../config.yaml'), function(err, _config) {
  if (err) throw err;

  CONFIG = _config;

  require('./appInit').beforeAppCreate(startApplication);
});

function startApplication() {
  /* Project Modules */
  var g           = require('./utils/g');
  var E           = require('./utils/serverError');
  var toolkit     = require('./utils/toolkit');
  var logHelper   = require('./utils/logHelper');
  var routeLoader = require('./utils/routeLoader');
  var auth        = require('./utils/auth');

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

  // Favicon
  var faviconPath = 'statics/favicon.ico';
  app.use(favicon(path.join(__dirname, faviconPath)));

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

  // Enable CORS
  var corsConfig = {
    origin              : CONFIG.WEB_CORS_ORIGIN,
    credentials         : CONFIG.WEB_CORS_CREDENTIALS,
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

  // Auth
  app.use(require('./middlewares/builtinAuthMid').byXAuthToken);

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
  require('./routers/systemConfigAPIRouter');
  require('./routers/debugAPIRouter');

  /***** DataFlux Func *****/
  require('./routers/mainAPIRouter');
  require('./routers/pythonPackageAPIRouter');
  require('./routers/resourceAPIRouter');

  require('./routers/scriptSetAPIRouter');
  require('./routers/scriptAPIRouter');
  require('./routers/funcAPIRouter');

  require('./routers/scriptLogAPIRouter');
  require('./routers/scriptFailureAPIRouter');

  require('./routers/scriptRecoverPointAPIRouter');

  require('./routers/scriptPublishHistoryAPIRouter');
  require('./routers/scriptSetExportHistoryAPIRouter');
  require('./routers/scriptSetImportHistoryAPIRouter');

  require('./routers/connectorAPIRouter');
  require('./routers/envVariableAPIRouter');

  require('./routers/authLinkAPIRouter');
  require('./routers/crontabConfigAPIRouter');
  require('./routers/batchAPIRouter');
  require('./routers/apiAuthAPIRouter');

  require('./routers/taskInfoAPIRouter');

  require('./routers/datafluxFuncTaskResultAPIRouter');

  require('./routers/operationRecordAPIRouter');

  require('./routers/fileServiceAPIRouter');
  require('./routers/funcCacheAPIRouter');
  require('./routers/funcStoreAPIRouter');

  require('./routers/blueprintAPIRouter');
  require('./routers/scriptMarketAPIRouter');

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
  app.use(function handleError(originError, req, res, next) {
    if (!res.locals.logger) {
      res.locals.logger = serverLogger;
    }

    if (CONFIG.MODE === 'dev') {
      res.locals.logger.debug('[MID] IN app.handleError');
    }

    var err = originError;

    // Wrap general error
    if (!E.prototype.isPrototypeOf(originError)) {
      var data = null;

      if (CONFIG.MODE === 'dev') {
        // Response call stack if not in PROD mode
        data = originError.stack;
      }

      err = new E('ESys', 'A System error occured. Please report this response to the administrator', data, originError);
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

        // 5xx Error hook
        if ('function' === typeof g.on5xxError) {
          g.on5xxError(req, res, err);
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

  var server = http.createServer(app);

  require('./messageHandlers/socketIOHandler')(app, server);

  var listenOpt = {
    host: CONFIG.WEB_BIND,
    port: CONFIG.WEB_PORT,
  };
  server.listen(listenOpt, function() {
    // Print some message of the server
    console.log(toolkit.strf('Web Server is listening on port [ {0} ]  (Press CTRL+C to quit)', CONFIG.WEB_PORT));
    console.log(toolkit.strf('PID: {0}', process.pid));
    console.log('Have fun!');

    // Non-request code here...
    require('./appInit').afterAppCreated(app, server);

    // Sub client
    require('./sub').runListener(app);

    // Guance WS client
    require('./guanceWebSocket').runListener(app);
  });
}
