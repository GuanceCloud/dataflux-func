'use strict';

/* Built-in Modules */
var path = require('path');

/* 3rd-party Modules */
var async  = require('async');
var Router = require('express').Router;
var marked = require('marked');

/* Project Modules */
var E                = require('./serverError');
var CONFIG           = require('./yamlResources').get('CONFIG');
var CONST            = require('./yamlResources').get('CONST');
var PRIVILEGE        = require('./yamlResources').get('PRIVILEGE');
var ROUTE            = require('./yamlResources').get('ROUTE');
var toolkit          = require('./toolkit');
var auth             = require('./auth');
var requestValidator = require('./requestValidator');
var modelHelper      = require('./modelHelper');
var uploads          = require('./uploads');
var requestDumper    = require('./requestDumper');

/**
 * All route configs.
 *
 * @type {Object[]}
 * @type {Object[].config}      - Route config.
 * @type {Object[].middlewares} - Route middlewares.
 */
var _ROUTES    = [];
var _ROUTE_MAP = {};

function getValue(value, defaultValue) {
  if ('undefined' === typeof value) {
    return defaultValue;

  } else {
    return value;
  }
}

function routeMonitor(routeConfig) {
  return function(req, res, next) {
    res.locals.routeConfig = routeConfig;

    var matchedRoute = req.route.path;

    // Only match /api/*
    if (matchedRoute.indexOf('/api/') !== 0) {
      return next();
    }

    var cacheKey = toolkit.getCacheKey('monitor', 'sysStats', [
        'metric', 'matchedRouteCount',
        'date', toolkit.getDateString()]);
    async.series([
      function(asyncCallback) {
        var method = req.method.toUpperCase();

        var record = null;
        if (method === 'POST' && matchedRoute === '/api/v1/func/:funcId') {
          // 记录函数调用
          record = `${method} ${path.join(req.baseUrl, req.path)}`;
        } else {
          // 记录路由调用
          record = `${method} ${matchedRoute}`;
        }
        res.locals.cacheDB.hincrby(cacheKey, record, 1, asyncCallback);
      },
      function(asyncCallback) {
        res.locals.cacheDB.expire(cacheKey, CONFIG._MONITOR_MATCHED_ROUTE_EXPIRES, asyncCallback);
      },
    ], next);
  };
};

// New version
function fieldSelectingCondition(req, res, next) {
  var fieldSelecting = req.query.fields;
  if (toolkit.notNothing(fieldSelecting)) {
    res.locals.fieldSelecting = fieldSelecting;

    delete req.query.fieldPicking;
    delete req.query.fieldKicking;
  }

  return next();
};

// Old version
function fieldPickingCondition(req, res, next) {
  var fieldPicking = req.query.fieldPicking;
  if (toolkit.notNothing(fieldPicking)) {
    res.locals.fieldPicking = fieldPicking;
  }

  return next();
};
function fieldKickingCondition(req, res, next) {
  var fieldKicking = req.query.fieldKicking;
  if (toolkit.notNothing(fieldKicking)) {
    res.locals.fieldKicking = fieldKicking;
  }

  return next();
};

function disablePageCache(req, res, next) {
  if (CONFIG.MODE === 'dev') {
    res.locals.logger.debug('[MID] IN routeLoader.disablePageCache');
  }

  if (res.locals.requestType === 'api') return next();

  res.set('Cache-Control', 'no-cache,no-store,must-revalidate');
  res.set('Expires', '0');
  res.set('Pragma', 'no-cache');

  return next();
};

function fixReqData(req, res, next) {
  // 转换请求数据为 plain JSON
  if ('function' !== typeof req.query.hasOwnProperty) {
    try { req.query = toolkit.jsonCopy(req.query) } catch(_) { }
  }
  if ('function' !== typeof req.body.hasOwnProperty) {
    try { req.body = toolkit.jsonCopy(req.body) } catch(_) { }
  }

  return next();
};

/**
 * Return full URL for module.handler.
 *
 * @param  {String} handlerPath - <ModuleName>.<HandlerName> (e.g. "AuthAPI.signIn")
 * @param  {Object} options
 * @param  {Object} options.params
 * @param  {Object} options.query
 * @return {String} - Full URL
 */
var urlFor = exports.urlFor = function(handlerPath, options) {
  options = options || {};

  if (!handlerPath) {
    return '#';
  }

  var parts = handlerPath.split('.');
  var moduleName = parts[0];
  var handlerName = parts[1];

  if (!ROUTE[moduleName] || !ROUTE[moduleName][handlerName]) {
    return '#';
  }

  var baseURL = ROUTE[moduleName][handlerName].url;
  var fullURL = toolkit.createFullURL(baseURL, options.params, options.query);

  return fullURL;
};

/**
 * Flatten route config's param config part. (JSON -> Table)
 *
 * @param  {Object} paramConfig - Param config
 * @param  {String} curKey - Current Object's key
 * @return {Object} - Flattened param definer
 */
var flattenParamConfig = exports.flattenParamConfig = function(paramConfig, curKey) {
  var d = {};
  var sep = '.';

  if (curKey) {
    d[curKey] = {};

    if ('$' in paramConfig) {
      d[curKey]['$type'] = 'array';
    } else {
      d[curKey]['$type'] = 'json';
    }
  } else {
    curKey = sep = '';
  }

  for (var k in paramConfig) if (paramConfig.hasOwnProperty(k)) {
    var v = paramConfig[k];

    if (k === '$') {
      var child = flattenParamConfig(v, '.0');
      for (var childK in child) if (child.hasOwnProperty(childK)) {
        var childV = child[childK];
        d[curKey + childK] = childV;
      }
    } else if (k[0] === '$') {
      if (d[curKey]) {
        d[curKey][k] = v;
      }

    } else {
      var child = flattenParamConfig(v, sep + k);
      for (var childK in child) if (child.hasOwnProperty(childK)) {
        var childV = child[childK];
        d[curKey + childK] = childV;
      }
    }
  }
  return d;
};

/**
 * Flatten route config's query config part. (JSON -> Table)
 *
 * @param  {Object} queryConfig - Query config
 * @param  {String} curKey - Current Object's key
 * @return {Object} - Flattened query definer
 */
var flattenQueryConfig = exports.flattenQueryConfig = function(queryConfig, curKey) {
  // Sort key as '_fuzzySearch' > '_fulltextSearchField' > '_fulltextSearchWord' > _xxx > OTHER
  var sortedQueryConfig = {};

  // Pick '_fuzzySearch' > '_fulltextSearchField' > '_fulltextSearchWord'
  ['_fuzzySearch', '_fulltextSearchField', '_fulltextSearchWord'].forEach(function(k) {
    if ('undefined' === typeof queryConfig[k]) return;

    sortedQueryConfig[k] = queryConfig[k];
    delete queryConfig[k];
  });

  // Pick _xxx
  for (var k in queryConfig) if (queryConfig.hasOwnProperty(k) && k[0] === '_') {
    if ('undefined' === typeof queryConfig[k]) return;

    sortedQueryConfig[k] = queryConfig[k];
    delete queryConfig[k];
  }

  // Pick OTHER
  for (var k in queryConfig) if (queryConfig.hasOwnProperty(k)) {
    if ('undefined' === typeof queryConfig[k]) return;

    sortedQueryConfig[k] = queryConfig[k];
    delete queryConfig[k];
  }

  Object.assign(queryConfig, sortedQueryConfig);
  return flattenParamConfig(queryConfig, curKey);
};

/**
 * Generate parameter by param config. (JSON -> Table)
 *
 * @param  {Object} paramConfig - Param config
 * @return {Object} Sample Object
 */
var genParamSample = exports.genParamSample = function(paramConfig) {
  var flattenedParamConfig = flattenParamConfig(paramConfig);
  var deprecatedParams     = [];

  var d = {};
  for (var k in flattenedParamConfig) if (flattenedParamConfig.hasOwnProperty(k)) {
    var v = flattenedParamConfig[k];

    if (v.$isDeprecated) {
      deprecatedParams.push(k);
    }

    var isDeprecated = false;
    for (var i = 0; i < deprecatedParams.length; i++) {
      if (k.indexOf(deprecatedParams[i]) === 0) {
        isDeprecated = true;
        break;
      }
    }
    if (isDeprecated) continue;

    var parts = k.split('.');
    var obj = d;
    for (var i = 0; i < parts.length; i++) {
      var step     = parts[i];
      var prevStep = parts[i - 1];
      var isArray  = Array.isArray(obj);

      if (!obj[step]) {
        switch (v.$type) {
          case 'enum':
            var autoExample = v.$in[0];
            obj[step] = getValue(v.$example, autoExample);
            break;

          case 'string':
            if (isArray) {
              obj.push.apply(obj, v.$example || [
                v.$name || prevStep + '1',
                v.$name || prevStep + '2',
              ]);
            } else {
              var autoExample = step;
              if (step === 'id' || step.slice(-2) === 'Id') {
                autoExample = 'xxxxxDataIDxxxxx';
              }

              obj[step] = getValue(v.$example, autoExample);
            }

            break;

          case 'int':
          case 'integer':
          case 'number':
            var min = v.$minValue || 0;
            var max = v.$maxValue || (min + 10);

            if (isArray) {
              obj.push.apply(obj, getValue(v.$example, [min, max]));
            } else {
              obj[step] = getValue(v.$example, min);
            }

            break;

          case 'array':
          case 'commaArray':
            if (toolkit.isNothing(v.$example)) {
              var autoExample = (v.$in || v.$commaArrayIn || []).slice(0, 2);
              obj[step] = getValue(v.$example, autoExample);
            } else {
              if (Array.isArray(v.$example)) {
                obj[step] = v.$example;
              } else {
                obj[step] = [v.$example];
              }
            }

            if (v.$type === 'commaArray') {
              obj[step] = obj[step].join(',');
            }
            break;

          case 'boolean':
            obj[step] = toolkit.getSafeValue(v.$example, false);
            break;

          case '*':
          case 'any':
            obj[step] = getValue(v.$example, '<Any Value>');
            break;

          case 'json':
          default:
            obj[step] = getValue(v.$example, {});
            break;
        }
      }
      obj = obj[step];
    }
  }
  return d;
};

/**
 * Load route.
 *
 * @param  {Object}  config - Route config
 * @param  {String}  [config.name]
 * @param  {String}  config.method - HTTP Verb. Can be "get|post|put|delete|..."
 * @param  {String}  config.url
 * @param  {String}  config.response - Response type. Can be "json|html"
 * @param  {Boolean} config.requireSignIn
 * @param  {Object}  config.params
 * @param  {Object}  config.query
 * @param  {Object}  config.body
 *
 * @param  {Function[]} middlewares - Middlewares
 */
exports.load = function(config, middlewares) {
  if (!config) {
    throw new Error('WAT: No config found, please check the `route-config` and `*Router` is correct.');
  }

  // Load requireSignIn option
  if ('string' === typeof config.requireSignIn) {
    var parts = config.requireSignIn.split('.');
    var topNode = parts[0];

    if (topNode === '$CONFIG' || topNode === '$NOT_CONFIG') {
      var nodePath = parts.slice(1).join('.');

      var requireSignIn = toolkit.jsonFind(CONFIG, nodePath, true) || false;
      config.requireSignIn = toolkit.toBoolean(requireSignIn);

      if (topNode === '$NOT_CONFIG') {
        config.requireSignIn = !config.requireSignIn;
      }
    }
  }

  // If a route does not require user-sign-in, it should not requires any privilege.
  if (!config.requireSignIn) config.privilege = null;

  // If a POST route allow tagging, add body configs
  if (config.method.toLowerCase() === 'post' && config.tagDataField) {
    var tagsConfig = {
      $desc     : 'Tags',
      $type     : 'json',
      $allowNull: false,
    };

    if (config.body.data) {
      config.body.data[config.tagDataField] = tagsConfig;
    } else {
      config.body[config.tagDataField] = tagsConfig;
    }
  }

  // If a route allow Fuzzy search, add query configs
  if (config.fuzzySearch) {
    config.query._fuzzySearch = {
      $desc     : 'Fuzzy Search',
      $type     : 'string',
      $searchKey: config.fuzzySearch,
    };
  }

  // If a route allow Full Text search, add query configs
  if (config.fulltextSearchFields) {
    config.query._fulltextSearchField = {
      $desc        : 'Full Text Search field',
      $type        : 'enum',
      $searchKeyMap: config.fulltextSearchFields,
      $in          : toolkit.jsonKeys(config.fulltextSearchFields),
    };

    config.query._fulltextSearchWord = {
      $desc: 'Full Text Search keyword',
      $type: 'string',
    };
  }

  // If a route allow export, add query configs
  if (config.export === true) {
    config.query = config.query || {};

    config.query.export = {
        $desc: 'Export file type',
        $type: 'enum',
        $in  : ['json', 'csv'],
    };

    config.query.charset = {
        $desc: 'Export file encoding',
        $type: 'enum',
        $in  : ['utf8', 'gbk'],
    };
  }

  // If a route allow paging, add query configs
  if (config.paging) {
    config.query = config.query || {};

    config.query.pageSize = {
      $desc             : 'Page size',
      $type             : 'integer',
      $isPositiveInteger: true,
      $minValue         : 1,
      $maxValue         : 100,
    };

    if (config.paging === true || config.paging === 'normal' || config.paging === 'simple') {
      config.query.pageNumber = {
        $desc             : 'Page number',
        $type             : 'integer',
        $isPositiveInteger: true,
        $minValue         : 1,
        $maxValue         : 99999,
      };

    } else if (config.paging === 'marker') {
      config.query.pageMarker = {
        $desc             : 'Page marker',
        $type             : 'integer',
        $isPositiveInteger: true,
      };
    }
  }

  // If a route allow order, add query configs
  if (config.orderFields) {
    config.query = config.query || {};

    var orderFields = [];
    for (var k in config.orderFields) if (config.orderFields.hasOwnProperty(k)) {
      orderFields.push(k);
    }

    // New version
    config.query.sort = {
      $desc: 'Sort by fields (e.g. "field1,field2")',
      $type: 'commaArray',
      $commaArrayIn: orderFields.reduce(function(acc, x) {
        acc.push(x, '-' + x);
        return acc
      }, []),
    };

    // Old version
    config.query.orderBy = {
      $desc: 'Order field',
      $type: 'enum',
      $in  : orderFields,
      $isDeprecated: true,
    };
    config.query.orderMethod = {
      $desc: 'Order method',
      $type: 'enum',
      $in  : ['asc', 'desc'],
      $isDeprecated: true,
    };
  }

  // If a route allow field selecting(picking/kicking), add query configs
  // New version
  if (config.fieldSelecting || config.fieldPicking || config.fieldKicking) {
    config.query = config.query || {};

    config.query.fields = {
      $desc: 'Field selecting (only: "field1,field2", not: "-,field1,field2" / "-field1,field2")',
      $type: 'commaArray',
    };
  }

  // Old version
  if (config.fieldPicking) {
    config.query = config.query || {};

    config.query.fieldPicking = {
      $desc: 'Field picking',
      $type: 'commaArray',
      $isDeprecated: true,
    };
  }
  if (config.fieldKicking) {
    config.query = config.query || {};

    config.query.fieldKicking = {
      $desc: 'Field kicking',
      $type: 'commaArray',
      $isDeprecated: true,
    };
  }

  middlewares = toolkit.asArray(middlewares);
  _ROUTES.push({
    config     : config,
    middlewares: middlewares,
  });

  var routeKey = toolkit.strf('{0} {1}', config.method.toUpperCase(), config.url);
  _ROUTE_MAP[routeKey] = config;
};

/**
 * Mount routes to Express.js app.
 *
 * @param  {Object} app - Express.js instance
 */
exports.mount = function(app) {
  for (var i = 0; i < _ROUTES.length; i++) {
    var r = _ROUTES[i];
    var c = r.config;

    // Check middlewares
    for (var j = 0; j < r.middlewares.length; j++) {
      if ('function' !== typeof r.middlewares[j]) {
        throw new Error(toolkit.strf('WAT: Middleware is not a function for `{0}`, please check your controller source code.', c.url));
      }
    }

    var preMiddlewares = [];

    preMiddlewares.push(routeMonitor(c));

    if (c.requireSignIn) {
      preMiddlewares.push(auth.createAuthChecker(c));

      if (c.privilege) {
        preMiddlewares.push(auth.createPrivilegeChecker(c));
      }
    }

    if (c.files) {
      preMiddlewares.push(uploads(c.files));
    }

    preMiddlewares.push(fixReqData);

    if (c.body && CONFIG.MODE === 'dev') {
      preMiddlewares.push(requestDumper.dumpRequestBody);
    }

    if (c.query || c.body || c.files) {
      preMiddlewares.push(requestValidator.createRequestValidator(c));
    }

    if (c.paging) {
      preMiddlewares.push(modelHelper.createRequestPagingCondition(c));
    }

    if (c.query) {
      preMiddlewares.push(modelHelper.createRequestWhereCondition(c));
    }

    if (c.method.toLowerCase() === 'get') {
      if (c.orderFields) {
        preMiddlewares.push(modelHelper.createRequestOrderCondition(c));
      }

      // New version
      if (c.fieldSelecting || c.fieldPicking || c.fieldKicking) {
        preMiddlewares.push(fieldSelectingCondition);
      }

      // Old version
      if (c.fieldPicking) {
        preMiddlewares.push(fieldPickingCondition);
      }
      if (c.fieldKicking) {
        preMiddlewares.push(fieldKickingCondition);
      }
    }

    if (c.query) {
      for (var k in c.query) if (c.query.hasOwnProperty(k) && k[0] === '_') {
        preMiddlewares.push(modelHelper.createRequestExtraCondition(c));
        break;
      }
    }

    preMiddlewares.push(disablePageCache);

    app[c.method](c.url, preMiddlewares, r.middlewares);
  }
};

exports.getRoute = function(key) {
  return _ROUTE_MAP[key];
};
