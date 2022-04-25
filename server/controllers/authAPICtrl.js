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

  var userModel = userMod.createModel(res.locals);

  var username = req.body.signIn.username;
  var password = req.body.signIn.password;

  var dbUser = null;
  async.series([
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
      var xAuthTokenObj = auth.genXAuthTokenObj(dbUser.id);

      var cacheKey   = auth.getCacheKey(xAuthTokenObj);
      var xAuthToken = auth.signXAuthTokenObj(xAuthTokenObj);

      res.locals.cacheDB.setex(cacheKey, CONFIG._WEB_AUTH_EXPIRES, 'x', function(err) {
        if (err) return asyncCallback(err);

        ret = toolkit.initRet({
          userId    : dbUser.id,
          xAuthToken: xAuthToken,
        });

        // If cookie-auth is allowed, send cookies in response
        if (CONFIG._WEB_AUTH_COOKIE) {
          res.cookie(CONFIG._WEB_AUTH_COOKIE, xAuthToken, {
            signed : true,
            expires: new Date(Date.now() + CONFIG._WEB_AUTH_EXPIRES * 1000),
          });
        }

        return asyncCallback();
      });
    },
  ], function(err) {
    if (err) return next(err);
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
    var cacheKey = auth.getCacheKey(res.locals.xAuthTokenObj);
    res.locals.cacheDB.del(cacheKey);
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
