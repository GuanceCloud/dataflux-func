'use strict';

/* Built-in Modules */

/* 3rd-party Modules */
var async = require('async');

/* Project Modules */
var E       = require('../utils/serverError');
var CONFIG  = require('../utils/yamlResources').get('CONFIG');
var toolkit = require('../utils/toolkit');
var auth    = require('../utils/auth');

var userMod      = require('../models/userMod');
var accessKeyMod = require('../models/accessKeyMod');

var DataFluxFunc = require('../../sdk/dataflux_func_sdk').DataFluxFunc;

/**
 * Username/password Auth.
 *
 * @return {Object} [res.locals.user=null]     - User Handler
 * @return {String} [res.locals.xAuthToken]    - x-auth-token
 * @return {Object} [res.locals.xAuthTokenObj] - x-auth-token Object
 */
exports.byXAuthToken = function byXAuthToken(req, res, next) {
  if (res.locals.user && res.locals.user.isSignedIn) return next();

  var now = toolkit.getTimestamp();

  // Get x-auth-token
  var xAuthToken = null;

  var headerField = CONFIG._WEB_AUTH_HEADER;
  var queryField  = CONFIG._WEB_AUTH_QUERY;
  var cookieField = CONFIG._WEB_AUTH_COOKIE;

  if (cookieField
      && req.signedCookies[cookieField]
      && res.locals.requestType === 'page') {
    // Try to get x-auth-token from cookie
    xAuthToken = req.signedCookies[cookieField];

  } else if (headerField && req.get(headerField)) {
    // Try to get x-auth-token from HTTP header
    xAuthToken = req.get(headerField);

  } else if (queryField && req.query[queryField]) {
    // Try to get x-auth-token from query
    xAuthToken = req.query[queryField];
  }

  // Skip if no xAuthToken
  if (!xAuthToken) return next();

  if (CONFIG.MODE === 'dev') {
    res.locals.logger.debug('[MID] IN buildinAuth.byXAuthToken');
  }

  res.locals.user = auth.createUserHandler();

  // Check x-auth-token
  var xAuthTokenObj = null;

  var cacheKey   = auth.getCacheKey();
  var cacheField = null;

  var dbUser = null;

  async.series([
    // Verify JWT
    function(asyncCallback) {
      auth.verifyXAuthToken(xAuthToken, function(err, obj) {
        if (err) {
          res.locals.reqAuthError = new E('EUserAuth', 'Invalid x-auth-token');
          return asyncCallback(res.locals.reqAuthError);
        }

        xAuthTokenObj = obj;
        cacheField = auth.getCacheField(xAuthTokenObj);

        return asyncCallback();
      });
    },
    // Check Redis
    function(asyncCallback) {
      res.locals.cacheDB.hgetExpires(cacheKey, cacheField, CONFIG._WEB_AUTH_EXPIRES, function(err, cacheRes) {
        if (err) return asyncCallback(err);

        if (!cacheRes) {
          res.locals.reqAuthError = new E('EUserAuth', 'x-auth-token is expired');
          return asyncCallback(res.locals.reqAuthError);
        }

        res.locals.xAuthToken    = xAuthToken;
        res.locals.xAuthTokenObj = xAuthTokenObj;

        return asyncCallback();
      });
    },
    // Get user data
    function(asyncCallback){
      var userModel = userMod.createModel(res.locals);

      userModel.get(xAuthTokenObj.uid, null, function(err, cacheRes) {
        if (err) return asyncCallback(err);

        dbUser = cacheRes;

        if (!dbUser) {
          res.locals.reqAuthError = new E('EUserAuth', 'User is not existed');
          return asyncCallback(res.locals.reqAuthError);
        }

        delete dbUser.passwordHash;

        return asyncCallback();
      });
    },
    // Refresh x-auth-token
    function(asyncCallback) {
      if (req.signedCookies[cookieField]) {
        res.cookie(cookieField, xAuthToken, {
          signed : true,
          expires: new Date((now + CONFIG._WEB_AUTH_EXPIRES) * 1000),
        });
      }

      var cacheData = { ts: now };
      res.locals.cacheDB.hset(cacheKey, cacheField, JSON.stringify(cacheData), asyncCallback);
    },
  ], function(err) {
    if (err && res.locals.reqAuthError === err) {
      // Skip request error here, throw later.
      return next();
    }

    if (err) return next(err);

    res.locals.user.load(dbUser);

    res.locals.logger.info('Auth by [username/password]: id=`{0}`; username=`{1}`',
      res.locals.user.id,
      res.locals.user.username);

    // client detect
    res.locals.authType = 'builtin.byXAuthToken';
    res.locals.authId   = xAuthTokenObj.uid;

    delete req.query[queryField];

    return next();
  });
};

/**
 * Access Key Auth.
 *
 * @return {Object} [res.locals.user=null]     - User Handler
 * @return {String} [res.locals.xAuthToken]    - x-auth-token
 * @return {Object} [res.locals.xAuthTokenObj] - x-auth-token Object
 */
exports.byAccessKey = function byAccessKey(req, res, next) {
  if (res.locals.user && res.locals.user.isSignedIn) return next();

  // Get AK Sign info
  var akId        = req.get(CONFIG._WEB_AK_ID_HEADER);
  var akSign      = req.get(CONFIG._WEB_AK_SIGN_HEADER);
  var akNonce     = req.get(CONFIG._WEB_AK_NONCE_HEADER);
  var akTimestamp = parseInt(req.get(CONFIG._WEB_AK_TIMESTAMP_HEADER));

  // Skip if no AK ID/Sign
  if (!akId || !akSign) return next();

  if (CONFIG.MODE === 'dev') {
    res.locals.logger.debug('[MID] IN buildinAuth.byAccessKey');
  }

  res.locals.user = auth.createUserHandler();

  // Check AK
  if (!akNonce) {
    res.locals.reqAuthError = new E('EUserAuth', 'Access Key nonce is missing');
    return next(res.locals.reqAuthError);
  }

  if (!akTimestamp) {
    res.locals.reqAuthError = new E('EUserAuth', 'Access Key timestamp is missing');
    return next(res.locals.reqAuthError);
  }

  var serverTimestamp = toolkit.getTimestamp();
  if (Math.abs(akTimestamp - serverTimestamp) > CONFIG._WEB_AK_TIMESTAMP_DIFF_LIMIT) {
    res.locals.reqAuthError = new E('EUserAuth', 'Invalid Access Key timestamp');
    return next(res.locals.reqAuthError);
  }

  var nonceCacheKey = toolkit.getCacheKey('accessKey', 'nonce', ['akId', akId]);

  var userId = null;
  var dbUser = null;

  async.series([
    // Clean up expired AK nonce
    function(asyncCallback) {
      var maxExpiredNonceTimestamp = serverTimestamp - CONFIG._WEB_AK_NONCE_TTL;
      res.locals.cacheDB.run('ZREMRANGEBYSCORE', nonceCacheKey, '-inf', maxExpiredNonceTimestamp, asyncCallback);
    },
    // Check AK nonce
    function(asyncCallback) {
      res.locals.cacheDB.run('ZSCORE', nonceCacheKey, akNonce, function(err, cacheRes) {
        if (err) return asyncCallback(err);

        if (cacheRes) {
          res.locals.reqAuthError = new E('EUserAuth', 'Invalid Access Key nonce');
          return asyncCallback(res.locals.reqAuthError);
        }

        return asyncCallback();
      });
    },
    // Get Access Key and verify Sign
    function(asyncCallback) {
      var accessKeyModel = accessKeyMod.createModel(res.locals);

      accessKeyModel.getWithCheck(akId, null, function(err, dbRes) {
        if (err) return asyncCallback(err);

        var dff = new DataFluxFunc({ akId: akId, akSecret: dbRes.secret });
        var isValidSign = dff.verifyAuthHeader(req.headers, req.method, req.originalUrl, req.body);

        if (!isValidSign) {
          res.locals.reqAuthError = new E('EUserAuth', 'Invalid Access Key sign. Hint: akSign = HmacSha1("<AK Sign Version>&<AK Timestamp(Second)>&<AK Nonce>&<METHOD>&<FULL URL>&<Body or \'\'>", <AK Secret>)');
          return asyncCallback(res.locals.reqAuthError);
        }

        userId = dbRes.userId;

        // Verify OK. Cache nonce.
        res.locals.cacheDB.run('ZADD', nonceCacheKey, serverTimestamp, akNonce, asyncCallback);
      });
    },
    // Get user info
    function(asyncCallback) {
      var userModel = userMod.createModel(res.locals);

      userModel.getWithCheck(userId, null, function(err, dbRes) {
        if (err) return asyncCallback(err);

        // Prepare to check
        dbUser = dbRes;

        if (dbUser.isDisabled) {
          res.locals.reqAuthError = new E('EUserDisabled', 'Current user has been disabled')
          return asyncCallback(res.locals.reqAuthError);
        }

        delete dbUser.passwordHash;

        return asyncCallback();
      });
    },
  ], function(err) {
    if (err && res.locals.reqAuthError === err) {
      // Skip request error here, throw later.
      return next();
    }

    if (err) return next(err);

    res.locals.user.load(dbUser);

    res.locals.logger.info('Auth by [accessKey]: id=`{0}`; username=`{1}`',
      res.locals.user.id,
      res.locals.user.username);

    // client detect
    res.locals.authType = 'builtin.byAccessKey';
    res.locals.authId   = akId;

    return next();
  });
};

/**
 * Localhost Auth.
 *
 * @return {Object} [res.locals.user=null] - User Handler (Fix Admin)
 */
exports.byLocalhostAuthToken = function byLocalhostAuthToken(req, res, next) {
  if (res.locals.user && res.locals.user.isSignedIn) return next();

  // Get Localhost Auth Token
  var receivedLocalhostAuthToken = req.get(CONFIG._WEB_LOCALHOST_AUTH_TOKEN_HEADER);
  var localhostAuthToken         = toolkit.safeReadFileSync(CONFIG._WEB_LOCALHOST_AUTH_TOKEN_PATH).trim();

  // Skip if no Localhost Auth Token
  if (!receivedLocalhostAuthToken || !localhostAuthToken) return next();

  if (CONFIG.MODE === 'dev') {
    res.locals.logger.debug('[MID] IN buildinAuth.byLocalhostAuthToken');
  }

  res.locals.user = auth.createUserHandler();

  // Check Localhost Auth Token
  receivedLocalhostAuthToken = receivedLocalhostAuthToken.trim();
  if (receivedLocalhostAuthToken !== localhostAuthToken) {
    res.locals.reqAuthError = new E('EUserAuth', 'Invalid Localhost Auth Token');
    return next(res.locals.reqAuthError);
  }

  var userId = 'u-admin';
  var dbUser = null;

  async.series([
    // Get admin info
    function(asyncCallback) {
      var userModel = userMod.createModel(res.locals);

      userModel.getWithCheck(userId, null, function(err, dbRes) {
        if (err) return asyncCallback(err);

        // Prepare to check
        dbUser = dbRes;

        if (dbUser.isDisabled) {
          res.locals.reqAuthError = new E('EUserDisabled', 'Current user has been disabled')
          return asyncCallback(res.locals.reqAuthError);
        }

        delete dbUser.passwordHash;

        return asyncCallback();
      });
    },
  ], function(err) {
    if (err && res.locals.reqAuthError === err) {
      // Skip request error here, throw later.
      return next();
    }

    if (err) return next(err);

    res.locals.user.load(dbUser);

    res.locals.logger.info('Auth by [localhostAuthToken]: id=`{0}`; username=`{1}`',
      res.locals.user.id,
      res.locals.user.username);

    // client detect
    res.locals.authType = 'builtin.byLocalhostAuthToken';

    return next();
  });
};
