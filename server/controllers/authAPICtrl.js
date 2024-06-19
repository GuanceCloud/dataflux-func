'use strict';

/* 3rd-party Modules */
var async = require('async');

/* Project Modules */
var E       = require('../utils/serverError');
var CONFIG  = require('../utils/yamlResources').get('CONFIG');
var toolkit = require('../utils/toolkit');
var auth    = require('../utils/auth');

var userMod = require('../models/userMod');

/* Hanlders */
exports.signIn = function(req, res, next) {
  var ret = null;

  var now = toolkit.getTimestamp();

  var userModel = userMod.createModel(res.locals);

  var username = req.body.signIn.username;
  var password = req.body.signIn.password;

  var cacheKey_badSignInCount = toolkit.getCacheKey('cache', 'badSignInCount', [ 'username', username ]);
  var cacheKey_signInWait     = toolkit.getCacheKey('cache', 'signInWait', [ 'username', username ]);

  var signInWaitTimeout = 0;

  var dbUser = null;
  async.series([
    // Check signin wait
    function(asyncCallback) {
      res.locals.cacheDB.ttl(cacheKey_signInWait, function(err, cacheRes) {
        if (err) return asyncCallback(err);

        signInWaitTimeout = parseInt(cacheRes);
        if (signInWaitTimeout > 0) {
          return asyncCallback(new E('EUserLocked', 'User has been temporarily locked', { signInWaitTimeout: signInWaitTimeout }));
        }

        return asyncCallback();
      });
    },
    // Check username
    function(asyncCallback) {
      userModel.getByField('username', username, null, function(err, dbRes) {
        if (err) return asyncCallback(err);

        if (!dbRes) {
          return asyncCallback(new E('EUserPassword', 'Invalid username or password'));
        }

        // Prepare to check
        dbUser = dbRes;

        var passwordHash = toolkit.getSaltedPasswordHash(dbUser.id, password, CONFIG.SECRET);

        // admin密码清空时，认为密码与用户名相同
        if (dbUser.id === 'u-admin' && dbUser.passwordHash === null) {
          dbUser.passwordHash = toolkit.getSaltedPasswordHash(dbUser.id, dbUser.username, CONFIG.SECRET);
        }

        if (dbUser.id !== 'u-admin' && dbUser.isDisabled) {
          return asyncCallback(new E('EUserDisabled', 'Current user has been disabled'));
        }

        if (dbUser.passwordHash !== passwordHash) {
          res.locals.logger.debug('Computed password hash: {0}', passwordHash);
          res.locals.logger.debug('Expected password hash: {0}', dbUser.passwordHash);

          return asyncCallback(new E('EUserPassword', 'Invalid username or password'));
        }

        delete dbUser.passwordHash;

        return asyncCallback();
      });
    },
    // Generate x-auth-token
    function(asyncCallback) {
      var xAuthTokenObj = auth.genXAuthTokenObj(dbUser);
      var xAuthToken    = auth.signXAuthTokenObj(xAuthTokenObj)

      var cacheKey   = auth.getCacheKey();
      var cacheField = auth.getCacheField(xAuthTokenObj);
      res.locals.cacheDB.hset(cacheKey, cacheField, now, function(err) {
        if (err) return asyncCallback(err);

        ret = toolkit.initRet({
          userId    : dbUser.id,
          xAuthToken: xAuthToken,
        });

        // If cookie-auth is allowed, send cookies in response
        console.log(toolkit.getTimestampMs() + CONFIG._WEB_AUTH_EXPIRES * 1000)
        if (CONFIG._WEB_AUTH_COOKIE) {
          res.cookie(CONFIG._WEB_AUTH_COOKIE, xAuthToken, {
            signed : true,
            expires: new Date((now + CONFIG._WEB_AUTH_EXPIRES) * 1000),
          });
        }

        return asyncCallback();
      });
    },
    // 清空用户密码错误次数
    function(asyncCallback) {
      res.locals.cacheDB.del(cacheKey_badSignInCount, asyncCallback);
    },
    // 清理过期的 Session
    function(asyncCallback) {
      var cacheKey          = auth.getCacheKey();
      var cacheFieldPattern = auth.getCacheFieldPattern();
      res.locals.cacheDB.hgetPattern(cacheKey, cacheFieldPattern, function(err, cacheRes) {
        if (err) return asyncCallback(err);
        if (toolkit.isNothing(cacheRes)) return asyncCallback();

        var expiredCacheFields = [];
        for (var cacheField in cacheRes) {
          var timestamp = parseInt(cacheRes[cacheField]);
          if (timestamp + CONFIG._WEB_AUTH_EXPIRES < now) {
            expiredCacheFields.push(cacheField);
          }
        }

        res.locals.cacheDB.hdel(cacheKey, expiredCacheFields, asyncCallback);
      });
    },
  ], function(err) {
    if (err) {
      // 记录用户密码错误次数，并设置等待时间
      var signInErr = err;
      var nextSignInWaitTimeout = 0;
      async.series([
        function(asyncCallback) {
          if (signInErr.reason === 'EUserPassword') {
            // 密码错误，记录错误次数
            res.locals.cacheDB.incr(cacheKey_badSignInCount, function(err, cacheRes) {
              if (err) return asyncCallback(err);

              var errorCount = parseInt(cacheRes);
              if (errorCount >= CONFIG.BAD_SINGIN_TEMPORARILY_LOCK_COUNT) {
                nextSignInWaitTimeout = Math.min(CONFIG.BAD_SINGIN_TEMPORARILY_LOCK_MAX_WAIT, 2 ** (errorCount - CONFIG.BAD_SINGIN_TEMPORARILY_LOCK_COUNT) * 60);
              }

              return res.locals.cacheDB.setex(cacheKey_signInWait, nextSignInWaitTimeout, 'x', asyncCallback);
            });

          } else {
            // 其他错误，直接返回剩余等待时间
            res.locals.cacheDB.ttl(cacheKey_signInWait, function(err, cacheDB) {
              if (err) return asyncCallback(err);

              nextSignInWaitTimeout = Math.max(0, parseInt(cacheDB));

              return asyncCallback();
            });
          }
        },
      ], function(err) {
        if (err) res.locals.logger.logError(err);

        signInErr.setDetail({ signInWaitTimeout: nextSignInWaitTimeout });
        return next(signInErr);
      });
    }

    return res.locals.sendJSON(ret);
  });
};

exports.signOut = function(req, res, next) {
  var ret = toolkit.initRet();

  // Clear Cookie
  if (CONFIG._WEB_AUTH_COOKIE) {
    res.clearCookie(CONFIG._WEB_AUTH_COOKIE);
  }

  // Revoke x-auth-token
  if (res.locals.xAuthTokenObj) {
    var cacheKey   = auth.getCacheKey();
    var cacheField = auth.getCacheField(res.locals.xAuthTokenObj);
    res.locals.cacheDB.hdel(cacheKey, cacheField);
  }

  return res.locals.sendJSON(ret);
};

exports.changePassword = function(req, res, next) {
  var userModel = userMod.createModel(res.locals);

  var userId = res.locals.user.id;

  var oldPassword = req.body.changePassword.oldPassword;
  var newPassword = req.body.changePassword.newPassword;

  var oldPasswordHash = toolkit.getSaltedPasswordHash(userId, oldPassword, CONFIG.SECRET);
  var newPasswordHash = toolkit.getSaltedPasswordHash(userId, newPassword, CONFIG.SECRET);

  var dbUser = null;
  async.series([
    // Check old password
    function(asyncCallback) {
      userModel.get(userId, null, function(err, dbRes) {
        if (err) return asyncCallback(err);

        if (!dbRes) {
          return asyncCallback(new E('EBizBadData', 'Current user does not exists'));
        }

        dbUser = dbRes;

        // admin密码清空时，认为密码与用户名相同
        if (dbUser.id === 'u-admin' && dbUser.passwordHash === null) {
          dbUser.passwordHash = toolkit.getSaltedPasswordHash(dbUser.id, dbUser.username, CONFIG.SECRET);
        }

        if (oldPasswordHash !== dbUser.passwordHash) {
          return asyncCallback(new E('EUserPassword', 'Invalid old password'));
        }

        return asyncCallback();
      });
    },
    // Update password
    function(asyncCallback) {
      var nextData = {
        passwordHash: newPasswordHash,
      };
      userModel.modify(userId, nextData, asyncCallback);
    },

  ], function(err) {
    if (err) return next(err);

    var ret = toolkit.initRet();
    return res.locals.sendJSON(ret);
  });
};

exports.profile = function(req, res, next) {
  var ret = toolkit.initRet(res.locals.user);
  return res.locals.sendJSON(ret);
};

exports.modifyProfile = function(req, res, next) {
  var userModel = userMod.createModel(res.locals);

  var userId = res.locals.user.id;
  var data   = req.body.data;

  userModel.modify(userId, data, function(err, dbRes) {
    if (err) return next(err);

    var ret = toolkit.initRet(dbRes);
    return res.locals.sendJSON(ret);
  });
};
