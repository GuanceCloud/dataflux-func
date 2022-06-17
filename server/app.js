'use strict';

/* Monkey patch */
require('./monkeyPatch');

/* Builtin Modules */
var path = require('path');
var http = require('http');
var fs   = require('fs-extra');

/* 3rd-party Modules */
var express          = require('express');
var favicon          = require('serve-favicon');
var expressUseragent = require('express-useragent');
var bodyParser       = require('body-parser');
var cookieParser     = require('cookie-parser');
var cors             = require('cors');
var async            = require('async');
var yaml             = require('js-yaml');

/* Configure */
var TRUST_PROXY = [
  // Subnet
  'loopback',
  'linklocal',
  'uniquelocal',
  // Aliyun SLB
  '100.64.0.0/10',
  '10.158.0.0/16',
  '10.159.0.0/16',
  '10.49.0.0/16',
];

/* Load YAML resources */
var yamlResources = require('./utils/yamlResources');

var CONST     = yamlResources.loadFile('CONST',     path.join(__dirname, './const.yaml'));
var ROUTE     = yamlResources.loadFile('ROUTE',     path.join(__dirname, './route.yaml'));
var PRIVILEGE = yamlResources.loadFile('PRIVILEGE', path.join(__dirname, './privilege.yaml'));
var CONFIG    = null;

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
    return res.redirect(routeLoader.urlFor(CONFIG._WEB_INDEX_PAGE || 'indexPage.index'));
  });

  // Favicon
  var faviconPath = CONFIG.MODE === 'prod' ? 'statics/img/wat-logo.jpg'
                                           : 'statics/img/wat-logo-warning.jpg';
  app.use(favicon(path.join(__dirname, faviconPath)));

  // Logger
  app.use(logHelper.requestLoggerInitialize);

  // App Setting
  app.set('x-powered-by', false);
  app.set('trust proxy', true /* TRUST_PROXY */);
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
  app.use('/client-app', express.static(path.join(__dirname, '../client/dist')));

  // Static files
  app.use('/statics', express.static(path.join(__dirname, 'statics')));

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
  app.use(bodyParser.raw({limit: '50mb', type: '*/*'}));

  app.use(function(err, req, res, next) {
    if (err && res.locals.isBodyParsing) {
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
  app.use(require('./middlewares/builtinAuthMid').byAccessKey);

  // Dump user information
  if (CONFIG.MODE === 'dev') {
    app.use(require('./utils/requestDumper').dumpUserInformation);
  }

  app.use(require('./middlewares/operationRecordMid').prepare);

  // Load routes
  require('./routers/indexAPIRouter');
  require('./routers/indexPageRouter');

  require('./routers/authAPIRouter');
  require('./routers/authPageRouter');

  require('./routers/userAPIRouter');
  require('./routers/userPageRouter');

  require('./routers/accessKeyAPIRouter');
  require('./routers/accessKeyPageRouter');

  require('./routers/monitorAPIRouter');
  require('./routers/monitorPageRouter');

  require('./routers/systemConfigAPIRouter');
  require('./routers/systemConfigPageRouter');

  require('./routers/debugAPIRouter');

  /***** DataFlux Func *****/

  require('./routers/mainAPIRouter');
  require('./routers/mainPageRouter.js');

  require('./routers/scriptSetAPIRouter');
  require('./routers/scriptAPIRouter');
  require('./routers/funcAPIRouter');

  require('./routers/scriptLogAPIRouter');
  require('./routers/scriptFailureAPIRouter');

  require('./routers/scriptRecoverPointAPIRouter');

  require('./routers/scriptPublishHistoryAPIRouter');
  require('./routers/scriptSetExportHistoryAPIRouter');
  require('./routers/scriptSetImportHistoryAPIRouter');

  require('./routers/dataSourceAPIRouter');
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

  routeLoader.mount(app);

  // Route Docs
  app.use(['/doc', '/docs', '/dev'],
    auth.createAuthChecker({ requireSignIn: true }),
    routeLoader.createDoc()
  );

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
      links : {doc: '/doc'},
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
        if (!toolkit.isNothing(req.body)) {
          var bodyDump = toolkit.jsonDumps(req.body, 2);
          bodyDump = toolkit.limitText(bodyDump, 1000, { showLength: 'newLine' });
          errorRet.reqDump.bodyDump = bodyDump;
        }
        return res.locals.sendJSON(errorRet);
        break;

      case 'page':
      default:
        if ('function' !== typeof res.locals.render) {
          return res.send(err.toString());
        }

        // Response a HTML page
        if (err.status === 404) {
          // Not found error
          return res.locals.render('_error/errorNotFound', {
            error: err,
          });
        } else if (err.info.reason === 'EUserAuth') {
          // User auth error
          return res.locals.render('_error/authError');
        } else if (err.info.reason === 'EUserPrivilege') {
          // User privilege error
          return res.locals.render('_error/errorPrivilege', {
            error: err,
          });
        } else if (err.status >= 500) {
          // System error
          return res.locals.render('_error/errorSys', {
            error: err,
          });
        } else if (err.status >= 400) {
          // Business logic error
          return res.locals.render('_error/errorBiz', {
            error: err,
          });
        }

        break;
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
    console.log(toolkit.strf('Web Server is listening on {0}  (Press CTRL+C to quit)', CONFIG.WEB_PORT));
    console.log('Startup time: ' + process.uptime().toFixed(2) + 's');
    console.log('Have fun!');

    // Non-request code here...
    require('./appInit').afterAppCreated(app, server);

    // Sub client
    require('./sub').runListener(app);
  });
}
