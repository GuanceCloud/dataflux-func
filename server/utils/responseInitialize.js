'use strict';

/* Built-in Modules */
var path = require('path');

/* 3rd-party Modules */
var router     = require('express').Router();
var async      = require('async');
var moment     = require('moment');
var sortedJSON = require('sorted-json');
var LRU        = require('lru-cache');

/* Project Modules */
var E             = require('./serverError');
var IMAGE_INFO    = require('./yamlResources').get('IMAGE_INFO');
var CONFIG        = require('./yamlResources').get('CONFIG');
var yamlResources = require('./yamlResources');
var toolkit       = require('./toolkit');
var routeLoader   = require('./routeLoader');
var auth          = require('./auth');
var appInit       = require('../appInit');

var systemSettingMod = require('../models/systemSettingMod');

/* Init */
var STATIC_RENDER_LRU  = new LRU();
var SYSTEM_SETTING_LRU = new LRU({ maxAge: 3 * 1000 });

var CLIENT_CONFIG = {
  _WEB_CLIENT_ID_COOKIE      : CONFIG._WEB_CLIENT_ID_COOKIE,
  _WEB_CLIENT_LOCALE_COOKIE  : CONFIG._WEB_CLIENT_LOCALE_COOKIE,
  _WEB_CLIENT_LANGUAGE_COOKIE: CONFIG._WEB_CLIENT_LANGUAGE_COOKIE,
  _WEB_PAGE_SIZE_COOKIE      : CONFIG._WEB_PAGE_SIZE_COOKIE,

  _WEB_DRY_RUN_MODE_HEADER: CONFIG._WEB_DRY_RUN_MODE_HEADER,

  _WEB_AUTH_HEADER       : CONFIG._WEB_AUTH_HEADER,
  _WEB_AUTH_QUERY        : CONFIG._WEB_AUTH_QUERY,
  _WEB_AUTH_LOCAL_STORAGE: CONFIG._WEB_AUTH_LOCAL_STORAGE,
  _WEB_AUTH_COOKIE       : CONFIG._WEB_AUTH_COOKIE,
};

var ABNORMAL_REQ_COST_LEVELS = [ 1000, 5000 ];
var ABNORMAL_REQ_LOG_LIMIT   = 3000;

/**
 * Get static file path.
 *
 * @param  {String} filePath - Path to static file from `/statics`
 * @return {String} Full static file path
 */
var getStaticFilePath = function(filePath) {
  return path.join('/statics', filePath);
};

/**
 * Get return JSON sample
 * @param  {Object} ret
 * @return {String}
 */
var getRetSample = function(ret) {
  var retSample = {};
  for (var k in ret) if (ret.hasOwnProperty(k)) {
    var v = ret[k];
    if (Array.isArray(v)) {
      v = toolkit.strf('<{0} Records>', v.length);
    }

    retSample[k] = v;
  }
  return JSON.stringify(retSample);
};

/**
 * Add Server Info
 */
router.all('*', function addServerInfo(req, res, next) {
  res.set(CONFIG._WEB_SERVER_VERSION_HEADER,           IMAGE_INFO.VERSION);
  res.set(CONFIG._WEB_SERVER_RELEASE_TIMESTAMP_HEADER, IMAGE_INFO.RELEASE_TIMESTAMP);

  return next();
});

/**
 * Prepare basic client information.
 *
 * @return {String} res.locals.traceId
 * @return {String} res.locals.requestTime
 * @return {String} res.locals.requestType
 * @return {String} res.locals.clientId
 * @return {String} res.locals.clientAccept
 * @return {String} res.locals.clientLocale
 * @return {String} res.locals.clientLanguage
 * @return {String} res.locals.clientTerritory
 * @return {String} res.locals.clientTimeZone
 */
router.all('*', function prepareBasicClientInfo(req, res, next) {
  // traceId
  var upstreamTraceId = req.get(CONFIG._WEB_TRACE_ID_HEADER);
  if (upstreamTraceId) {
    res.locals.traceId = upstreamTraceId;
  } else {
    res.locals.traceId = 'TRACE-' + toolkit.genUUID().toUpperCase();
  }

  res.locals.logger.debug('[UPSTREAM TRACE ID] `{0}`', upstreamTraceId || 'NO TRACE ID');

  res.locals.traceIdShort = toolkit.getFirstPart(res.locals.traceId);
  res.set(CONFIG._WEB_TRACE_ID_HEADER, res.locals.traceId);

  // requestTime
  res.locals.requestTime = new Date();

  // requestType
  switch(req.originalUrl.split('/')[1]) {
    case 'api':
      res.locals.requestType = 'api';
      break;

    default:
      res.locals.requestType = 'page';
      break;
  }

  // clientAccept
  res.locals.clientAccpet = req.accepts(['json', 'html']);

  // Config for client
  res.locals.clientConfig = CLIENT_CONFIG;

  /***** Set Cookies *****/

  // clientId
  var clientId = null;
  if (req.useragent.isBot || !req.useragent.source || req.useragent.browser === 'unknown') {
    clientId = toolkit.strf('c_bot_{0}@{1}', req.useragent.browser, req.ip);

  } else {
    clientId = req.signedCookies[CONFIG._WEB_CLIENT_ID_COOKIE]
              || req.get(CONFIG._WEB_CLIENT_ID_HEADER);

    if (toolkit.isNullOrWhiteSpace(clientId)) {
      clientId = 'c_' + toolkit.genRandString(8);

      // [Only set in page]
      if (res.locals.requestType === 'page') {
        res.cookie(CONFIG._WEB_CLIENT_ID_COOKIE, clientId, {
          signed : true,
          expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        });
      }
    }
  }
  res.locals.clientId = clientId;

  // clientLocale, language, territory
  // [Only set in page]
  if (res.locals.requestType === 'page') {
    var clientLocale = req.cookies[CONFIG._WEB_CLIENT_LOCALE_COOKIE];
    if (toolkit.isNullOrWhiteSpace(clientLocale)) {
      clientLocale = 'zh_CN';
    }

    var clientLanguage = clientLocale === 'zh_CN' ? 'zh' : 'en';

    // Set to `res.locals` and cookie
    res.locals.clientLocale = clientLocale;
    res.cookie(CONFIG._WEB_CLIENT_LOCALE_COOKIE, clientLocale, {
      expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    });

    res.locals.clientLanguage = clientLanguage;
    res.cookie(CONFIG._WEB_CLIENT_LANGUAGE_COOKIE, clientLanguage, {
      expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    });

    res.locals.clientTerritory = clientLocale === 'zh_CN' ? 'ZH' : 8;
    res.locals.clientTimeZone  = clientLocale === 'zh_CN' ? 'US' : 0;
  }

  return next();
});

/**
 * Prepare DB / Cache / User access.
 * @return {Object} res.locals.db
 * @return {Object} res.locals.cacheDB
 * @return {Object} res.locals.getQueryOptions
 */
router.all('*', function prepareDBCacheUserAccess(req, res, next) {
  var reqLogger = res.locals.logger;

  res.locals.db          = require('./extraHelpers/mysqlHelper').createHelper(reqLogger);
  res.locals.cacheDB     = require('./extraHelpers/redisHelper').createHelper(reqLogger);
  res.locals.fileStorage = require('./extraHelpers/fileSystemHelper').createHelper(reqLogger);

  if (CONFIG.MODE === 'prod') {
    res.locals.db.skipLog      = true;
    res.locals.cacheDB.skipLog = true;
  }

  if (toolkit.toBoolean(req.get(CONFIG._WEB_DRY_RUN_MODE_HEADER))) {
    res.locals.db.isDryRun          = true;
    res.locals.cacheDB.isDryRun     = true;
    res.locals.fileStorage.isDryRun = true;
  }

  // Init user handler
  res.locals.user = auth.createUserHandler();

  return next();
});

/**
 * Prepare functional components.
 * @return {Object} res.locals.getSystemSettings
 * @return {Object} res.locals.getDateTimeRange
 * @return {Object} res.locals.getFulfilledDateTimeRange
 * @return {Object} res.locals.getDateTimeRangeFilter
 * @return {Object} res.locals.sendJSON
 * @return {Object} res.locals.redirect
 * @return {Object} res.locals.render
 * @return {Object} res.locals.sendHTML
 * @return {Object} res.locals.sendLocalFile
 * @return {Object} res.locals.sendFile
 * @return {Object} res.locals.sendText
 * @return {Object} res.locals.sendRaw
 * @return {Object} res.locals.sendData
 */
router.all('*', function prepareFunctionalComponents(req, res, next) {
  function _appendReqInfo() {
    // 请求附带信息
    var now = new Date();
    var reqCost = now.getTime() - res.locals.requestTime.getTime();

    var reqInfo = {
      traceId : res.locals.traceId,
      reqTime : res.locals.requestTime.toISOString(),
      respTime: now.toISOString(),
      reqCost : reqCost,
    };
    res.set(CONFIG._WEB_TRACE_ID_HEADER,      reqInfo.traceId);
    res.set(CONFIG._WEB_REQUEST_TIME_HEADER,  reqInfo.reqTime);
    res.set(CONFIG._WEB_RESPONSE_TIME_HEADER, reqInfo.respTime);
    res.set(CONFIG._WEB_REQUEST_COST_HEADER,  reqInfo.reqCost);

    return reqInfo;
  }

  function _recordAbnormalReq(respBody) {
    if (!res.locals.requestTime) return;

    var now = new Date();
    var reqCost = now.getTime() - res.locals.requestTime.getTime();

    var reqInfo = {
      reqMethod     : req.method,
      reqURL        : req.originalUrl,
      reqRoute      : req.route.path,
      reqTime       : res.locals.requestTime.toISOString(),
      reqCost       : reqCost,
      respTime      : now.toISOString(),
      respStatusCode: res.statusCode,
    };

    if (toolkit.notNothing(req.body)) {
      var reqBodyDump = toolkit.jsonDumps(req.body, 2);
      reqInfo.reqBodyDump = toolkit.limitText(reqBodyDump, 1000, { showLength: 'newLine' });
    }

    if (respBody) {
      if (res.statusCode >= 400) {
        // 报错时记录完整响应体
        reqInfo.respBody = respBody;
      } else {
        // 正常时记录部分响应体Dump
        var respBodyDump = toolkit.jsonDumps(respBody, 2);
        reqInfo.respBodyDump = toolkit.limitText(respBodyDump, 1000, { showLength: 'newLine' });
      }
    }

    if (res.locals.user) {
      reqInfo.userId = res.locals.user.id;
    }
    var reqInfoDumps = JSON.stringify(reqInfo);

    async.series([
      // 最近慢速请求
      function(asyncCallback) {
        async.eachSeries(ABNORMAL_REQ_COST_LEVELS, function(bucket, eachCallback) {
          if (reqCost < bucket) return eachCallback();

          var type = `reqCost${bucket}`;
          var cacheKey = toolkit.getMonitorCacheKey('monitor', 'abnormalRequest', ['type', type]);
          async.series([
            function(innerCallback) { res.locals.cacheDB.lpush(cacheKey, reqInfoDumps, innerCallback) },
            function(innerCallback) { res.locals.cacheDB.ltrim(cacheKey, 0, ABNORMAL_REQ_LOG_LIMIT - 1, innerCallback) },
          ], eachCallback);
        }, asyncCallback);
      },
      // 最近异常请求
      function(asyncCallback) {
        if (res.statusCode < 400) return asyncCallback();

        var type = `statusCode${parseInt(res.statusCode / 100)}xx`;
        var cacheKey = toolkit.getMonitorCacheKey('monitor', 'abnormalRequest', ['type', type]);

        async.series([
          function(innerCallback) { res.locals.cacheDB.lpush(cacheKey, reqInfoDumps, innerCallback)         },
          function(innerCallback) { res.locals.cacheDB.ltrim(cacheKey, 0, ABNORMAL_REQ_LOG_LIMIT - 1, innerCallback) },
        ], asyncCallback);
      },
    ]);
  };

  res.locals.getSystemSettings = function(keys, callback) {
    keys = toolkit.asArray(keys);

    // 优先从 LRU 中获取
    var systemSettings = {}
    var nonLRUIds      = [];
    keys.forEach(function(key) {
      var v = SYSTEM_SETTING_LRU.get(key);
      if (toolkit.notNothing(v)) {
        systemSettings[key] = v;
      } else {
        nonLRUIds.push(key);
      }
    });

    if (nonLRUIds.length <= 0) return callback(null, systemSettings);

    // 存在未取得的，从数据库中读取
    var systemSettingModel = systemSettingMod.createModel(res.locals);

    systemSettingModel.get(nonLRUIds, function(err, dbRes) {
      if (err) return callback(err);

      for (var key in dbRes) {
        var v = dbRes[key];

        SYSTEM_SETTING_LRU.set(key, v);
        systemSettings[key] = v;
      }

      return callback(null, systemSettings);
    });
  };

  res.locals.getQueryOptions = function getQueryOptions() {
    var opt = {
      filters: res.locals.filters || {},
      orders : res.locals.orders || [],
      paging : res.locals.paging,
      extra  : res.locals.extra || {},
    };

    opt = toolkit.jsonCopy(opt);

    return opt;
  };

  res.locals.getDateTimeRange = function getDateTimeRange(startField, endField) {
    var start = req.query[startField];
    var end   = req.query[endField];

    if (start && end) {
      var range = [start, end].sort();
      start = range[0];
      end   = range[1];
    }

    return [start, end];
  };

  res.locals.getFulfilledDateTimeRange = function getFulfilledDateTimeRange(startField, endField) {
    var MAX_DATE_RANGE = 3600 * 24 * 31 * 1000;

    var start = req.query[startField] || toolkit.getDateTimeString(Date.now() - MAX_DATE_RANGE);
    var end   = req.query[endField]   || toolkit.getDateTimeString();

    var range = [start, end].sort();
    start = range[0];
    end   = range[1];

    if (new Date(end) - new Date(start) > MAX_DATE_RANGE) {
      end = toolkit.getDateString((new Date(start)).getTime() + MAX_DATE_RANGE);
    }

    return [start, end];
  };

  res.locals.getDateTimeRangeFilter = function getDateTimeRangeFilter(startField, endField, autoFillTime) {
    var START_FORMAT = 'YYYY-MM-DD hh:mm:ss';
    var END_FORMAT   = 'YYYY-MM-DD hh:mm:ss';
    if (autoFillTime) {
      START_FORMAT = 'YYYY-MM-DD 00:00:00';
      END_FORMAT   = 'YYYY-MM-DD 23:59:59';
    }

    var range = res.locals.getDateTimeRange(startField, endField);
    var start = range[0];
    var end   = range[1];

    var filter = {};
    if (start) {
      filter.ge = toolkit.getDateTimeString(new Date(start), START_FORMAT);
    }
    if (end) {
      filter.lt = toolkit.getDateTimeString(new Date(end), END_FORMAT);
    }

    if (toolkit.isNothing(filter)) {
      return null;
    } else {
      return filter;
    }
  };

  // Add response functions
  res.locals.sendJSON = function(ret, options) {
    options = options || {}

    if (toolkit.isNullOrUndefined(ret)) {
      ret = toolkit.initRet();
    }

    if (toolkit.notNothing(res.locals.fieldSelecting) && toolkit.notNothing(ret.data)) {
      // Field selecting (New version)
      var selectingFunc = toolkit.jsonPick;
      if (toolkit.startsWith(res.locals.fieldSelecting[0], '-')) {
        selectingFunc = toolkit.jsonKick;
        res.locals.fieldSelecting[0] = res.locals.fieldSelecting[0].slice(1).trim();
      }

      var fields = [];
      res.locals.fieldSelecting.forEach(function(f) {
        if (toolkit.isNothing(f)) return;
        fields.push(f);
      })

      if (Array.isArray(ret.data)) {
        for (var i = 0; i < ret.data.length; i++) {
          ret.data[i] = selectingFunc(ret.data[i], fields);
        }
      } else if ('object' === typeof ret.data) {
        ret.data = selectingFunc(ret.data, fields);
      }

    } else {
      // Field picking (Old version)
      if (toolkit.notNothing(res.locals.fieldPicking) && toolkit.notNothing(ret.data)) {
        if (Array.isArray(ret.data)) {
          for (var i = 0; i < ret.data.length; i++) {
            ret.data[i] = toolkit.jsonPick(ret.data[i], res.locals.fieldPicking);
          }
        } else if ('object' === typeof ret.data) {
          ret.data = toolkit.jsonPick(ret.data, res.locals.fieldPicking);
        }
      }

      // Field kicking (Old version)
      if (toolkit.notNothing(res.locals.fieldKicking) && toolkit.notNothing(ret.data)) {
        if (Array.isArray(ret.data)) {
          for (var i = 0; i < ret.data.length; i++) {
            ret.data[i] = toolkit.jsonKick(ret.data[i], res.locals.fieldKicking);
          }
        } else if ('object' === typeof ret.data) {
          ret.data = toolkit.jsonKick(ret.data, res.locals.fieldKicking);
        }
      }
    }

    // 请求附带信息
    var reqInfo = _appendReqInfo();
    Object.assign(ret, reqInfo);

    // Return JSON data
    res.type('json');

    // Convert response JSON data before sending (except on built-in pages).
    if ('function' === typeof appInit.convertJSONResponse) {
      ret = appInit.convertJSONResponse(ret);
    }

    if (!options.muteLog) {
      var retDump = JSON.stringify(ret);
      var retDumpLength = retDump.length;
      var retDump = toolkit.limitText(getRetSample(ret), 1000);
      res.locals.logger.debug('[RESPONSE] JSON: `{0}`, Length: {1}', retDump, retDumpLength);
    }

    if ('function' === typeof appInit.beforeReponse) {
      appInit.beforeReponse(req, res, reqInfo.reqCost, res.locals.responseStatus, ret, 'json');
    }

    _recordAbnormalReq(ret);
    return res.send(ret);
  };

  res.locals.redirect = function(nextURL) {
    res.locals.logger.debug('{0}: {1}',
      '[RESPONSE] REDIRECT:',
      nextURL
    );

    // 请求附带信息
    var reqInfo = _appendReqInfo();

    if ('function' === typeof appInit.beforeReponse) {
      appInit.beforeReponse(req, res, reqInfo.reqCost, 301, null, 'redirect');
    }

    _recordAbnormalReq();
    return res.redirect(nextURL);
  };

  res.locals.render = function(view, pageData, options) {
    options = options || {};

    var renderMD5 = null;
    if (options.isStatic) {
      renderMD5 = view + '-' + sortedJSON.sortify(toolkit.jsonCopy(pageData), {stringify: true, sortArray: false});

      if (STATIC_RENDER_LRU.get(renderMD5)) {
        res.type('html');

        _recordAbnormalReq();
        return res.send(STATIC_RENDER_LRU.get(renderMD5));
      }
    }

    // Use Moment.js locale
    var momentLocale   = res.locals.clientLocale;
    var momentTimeZone = res.locals.clientTimeZone;

    var localMoment = function(t) {
      return moment.utc(t).locale(momentLocale).utcOffset(momentTimeZone);
    };

    var localDuration = function() {
      var args = Array.prototype.slice.call(arguments);
      return moment.duration.apply(moment.duration, args).locale(momentLocale);
    }

    pageData = pageData || {};

    var renderData = {
        pageData   : pageData,
        pageConfigs: {
          hideHeader: false,
          hideFooter: false,
          isDocPage : false,
        },

        imageInfo          : IMAGE_INFO,
        clientConfig       : res.locals.clientConfig,
        require            : require,
        components         : {},
        _componentsInPage  : {},
        req                : req,
        res                : res,
        traceId            : res.locals.traceId,
        traceIdShort       : res.locals.traceIdShort,
        clientId           : res.locals.clientId,
        requestType        : res.locals.requestType,
        clientLocale       : res.locals.clientLocale,
        shortClientLocale  : res.locals.shortClientLocale,
        currentUser        : res.locals.user || {},
        toolkit            : toolkit,
        moment             : moment,
        localMoment        : localMoment,
        localDuration      : localDuration,
        static             : getStaticFilePath,
        urlFor             : routeLoader.urlFor,
    };
    renderData.c = renderData.components; // Alias

    var ALL_YAML_RESOURCES = yamlResources.getAll();
    for (var k in ALL_YAML_RESOURCES) if (ALL_YAML_RESOURCES.hasOwnProperty(k)) {
      renderData[k] = ALL_YAML_RESOURCES[k];
    }

    res.render(view, renderData, function(err, html) {
      if (err) return next(err);

      res.locals.logger.debug('[RESPONSE] RENDER HTML: `{0}`', view);

      // 请求附带信息
      var reqInfo = _appendReqInfo();
      html += toolkit.strf('<input id="watTraceId" type="hidden" value="{0}" />',  reqInfo.traceId);
      html += toolkit.strf('<input id="watReqTime" type="hidden" value="{0}" />' , reqInfo.reqTime);
      html += toolkit.strf('<input id="watRespTime" type="hidden" value="{0}" />', reqInfo.respTime);
      html += toolkit.strf('<input id="watReqCost" type="hidden" value="{0}" />',  reqInfo.reqCost);
      html += toolkit.strf('<!-- TraceID: {0} -->'  , reqInfo.traceId);
      html += toolkit.strf('<!-- ReqTime: {0} -->'  , reqInfo.reqTime);
      html += toolkit.strf('<!-- RespTime: {0} -->' , reqInfo.respTime);
      html += toolkit.strf('<!-- ReqCost: {0}ms -->', reqInfo.reqCost);

      if (options.isStatic && renderMD5) {
        STATIC_RENDER_LRU.set(renderMD5, html);
      }

      res.type('html');

      if ('function' === typeof appInit.beforeReponse) {
        appInit.beforeReponse(req, res, reqInfo.reqCost, res.locals.responseStatus, html, 'html');
      }

      _recordAbnormalReq();
      return res.send(html);
    });
  };

  res.locals.sendHTML = function(html) {
    res.locals.logger.debug('[RESPONSE] HTML: `{0}`', req.originalUrl);

    // 请求附带信息
    var reqInfo = _appendReqInfo();
    html += toolkit.strf('<!-- TraceID: {0} -->'  , reqInfo.traceId);
    html += toolkit.strf('<!-- ReqTime: {0} -->'  , reqInfo.reqTime);
    html += toolkit.strf('<!-- RespTime: {0} -->' , reqInfo.respTime);
    html += toolkit.strf('<!-- ReqCost: {0}ms -->', reqInfo.reqCost);

    res.type('html');

    if ('function' === typeof appInit.beforeReponse) {
      appInit.beforeReponse(req, res, reqInfo.reqCost, res.locals.responseStatus, html, 'html');
    }

    _recordAbnormalReq();
    return res.send(html);
  };

  res.locals.sendLocalFile = function(filePath) {
    var fileName = filePath.split('/').pop();
    var fileType = fileName.split('.').pop();
    res.locals.logger.debug('[RESPONSE] LOCAL FILE: `{0}`', fileName);

    res.type(fileType);
    res.attachment(fileName);

    // 请求附带信息
    var reqInfo = _appendReqInfo();

    if ('function' === typeof appInit.beforeReponse) {
      appInit.beforeReponse(req, res, reqInfo.reqCost, res.locals.responseStatus, fileName, 'file');
    }

    _recordAbnormalReq();
    return res.download(filePath);
  };

  res.locals.sendFile = function(file, fileName, fileType) {
    res.locals.logger.debug('[RESPONSE] FILE: `{0}`, Length: {1}', fileName || 'FILE', file.length);

    if (!fileType && fileName.indexOf('.') >= 0) {
      fileType = fileName.split('.').pop();
    }

    if (fileType) {
      res.type(fileType);
    }

    res.attachment(fileName);

    // 请求附带信息
    var reqInfo = _appendReqInfo();

    if ('function' === typeof appInit.beforeReponse) {
      appInit.beforeReponse(req, res, reqInfo.reqCost, res.locals.responseStatus, file, 'file');
    }

    _recordAbnormalReq();
    return res.send(file);
  };

  res.locals.sendText = function(text) {
    var textDump = JSON.stringify(text);
    var textDump = toolkit.limitText(textDump, 1000, { showLength: true });
    res.locals.logger.debug('[RESPONSE] TEXT: `{0}`', textDump);

    // 请求附带信息
    var reqInfo = _appendReqInfo();

    res.type('text');

    if ('function' === typeof appInit.beforeReponse) {
      appInit.beforeReponse(req, res, reqInfo.reqCost, res.locals.responseStatus, text, 'text');
    }

    _recordAbnormalReq();
    return res.send(text);
  };

  res.locals.sendRaw = function(rawData, contentType) {
    res.locals.logger.debug('[RESPONSE] RAW: `{0}`', contentType || `js:${typeof rawData}`);

    // 请求附带信息
    var reqInfo = _appendReqInfo();

    if ('function' === typeof appInit.beforeReponse) {
      appInit.beforeReponse(req, res, reqInfo.reqCost, res.locals.responseStatus, rawData, 'raw');
    }

    if (contentType) {
      res.type(contentType);
    }

    _recordAbnormalReq();

    if ('number' === typeof rawData) rawData = '' + rawData;
    return res.send(rawData);
  };

  res.locals.sendData = function(ret) {
    // Return data, Auto detect `export` and `charset` option.
    if (req.query.export) {
      ret = toolkit.convertJSON(ret.data, req.query.export, req.query.charset);
      if (ret === null) return next(new E('EBizBadData', 'Export failed'));

      var fileName = toolkit.strf('{0}.{1}', req.path.split('/').pop(), req.query.export);
      return res.locals.sendFile(ret, fileName);

    } else {
      return res.locals.sendJSON(ret);
    }
  };

  return next();
});

// Dump request
router.all('*', require('./requestDumper').dumpRequest);
router.all('*', require('./requestDumper').dumpRequestFrom);

module.exports = router;
