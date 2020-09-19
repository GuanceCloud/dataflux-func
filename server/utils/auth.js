'use strict';

/* 3rd-party Modules */
var jwt = require('jsonwebtoken');

/* Project Modules */
var E         = require('./serverError');
var CONFIG    = require('./yamlResources').get('CONFIG');
var PRIVILEGE = require('./yamlResources').get('PRIVILEGE');
var toolkit   = require('./toolkit');

/**
 * Generate a new x-auth-token ID.
 *
 * @return {String} New x-auth-token ID
 */
var genId = exports.genId = function() {
  return toolkit.genDataId('xat');
};

/**
 * Get the Redis key for the x-auth-token.
 *
 * @param  {Object} xAuthTokenObj - x-auth-token Object
 * @return {String}               - Cache key
 */
exports.getCacheKey = function(xAuthTokenObj) {
  var tags = [
    'xAuthTokenId', xAuthTokenObj.xatid,
    'userId'      , xAuthTokenObj.uid,
  ];
  return toolkit.getCacheKey('token', 'xAuthToken', tags);
};

/**
 * Get the Redis key pattern for the x-auth-token.
 *
 * @param  {String} [type='*']
 * @param  {String} [xAuthTokenId='*']
 * @param  {String} [userId='*']
 * @return {String} - Cache key pattern
 */
exports.getCachePattern = function(options) {
  var tags = [
    'xAuthTokenId', options.xAuthTokenId || '*',
    'userId'      , options.userId       || '*',
  ];
  return toolkit.getCacheKey('token', 'xAuthToken', tags);
};

/**
 * Generate an x-auth-token Object.
 *
 * @param  {String} userId
 * @return {Object}                - x-auth-token object
 */
exports.genXAuthTokenObj = function(userId) {
  return {
    xatid: genId(),
    uid  : userId,
  };
};

/**
 * Sign the x-auth-token Object.
 *
 * @param  {Object} xAuthTokenObj - x-auth-token Object
 * @return {Object}               - x-auth-token string
 */
exports.signXAuthTokenObj = function(xAuthTokenObj) {
  var xAuthToken = jwt.sign(xAuthTokenObj, CONFIG.SECRET);
  return xAuthToken;
};

/**
 * Verify x-auth-token and return the x-auth-token Object.
 *
 * @param  {String}   token
 * @param  {Function} callback
 * @return {Object}   err      - Error
 * @return {Object}   obj      - x-auth-token Object
 */
exports.verifyXAuthToken = function(xAuthToken, callback) {
  jwt.verify(xAuthToken, CONFIG.SECRET, callback);
};

/**
 * A user handler for some functional methods.
 */
var UserHandler = function() {
  this.isSignedIn = false;
  this.error      = null;
};

/**
 * Load user data.
 *
 * @param {Object} data
 */
UserHandler.prototype.load = function(data) {
  if (!data) return;

  data = toolkit.convertObject(data, {
    roles           : 'commaArray',
    customPrivileges: 'commaArray',
    isDisabled      : 'boolean',
  });

  for (var k in data) if (data.hasOwnProperty(k)) {
    this[k] = data[k];
  }

  this.isSignedIn = true;
};

/**
 * Check if the user is specified role.
 *
 * @param  {String|String...} - role
 * @return {Boolean}          - Is the role or not
 */
UserHandler.prototype.is = function() {
  if (!this.isSignedIn) return false;

  if (this.roles.indexOf('*') > -1) {
    // All roles
    return true;
  } else {
    var requiredRoles = Array.prototype.slice.call(arguments);

    if (requiredRoles.length === 1 && requiredRoles[0].indexOf(',') > -1) {
      requiredRoles = requiredRoles[0].split(',');
    }

    for (var i = 0; i < requiredRoles.length; i++) {
      var roleName = requiredRoles[i].trim();

      if (this.roles.indexOf(roleName) > -1) {
        return true;
      }
    }
  }

  return false;
};

/**
 * Check if the user has specified privilege.
 *
 * @param  {String|String...} - privilege
 * @return {Boolean}          - Have the privilege or not
 */
UserHandler.prototype.can = function() {
  if (!this.isSignedIn) return false;

  if (Array.isArray(this.roles) && this.roles.indexOf('*') > -1) {
    // All roles
    return true;
  } else {
    var requiredPrivileges = Array.prototype.slice.call(arguments);

    if (requiredPrivileges.length === 1 && requiredPrivileges[0].indexOf(',') > -1) {
      requiredPrivileges = requiredPrivileges[0].split(',');
    }

    for (var i = 0; i < requiredPrivileges.length; i++) {
      var privilegeName = requiredPrivileges[i].trim();
      var privilege = PRIVILEGE.privileges[privilegeName];

      // No such privilege in system
      if (!privilege) {
        return false;
      }

      var privilegeRoles = toolkit.asArray(privilege.role) || [];

      // Check by roles
      for (var j = 0; j < this.roles.length; j++) {
        if (privilegeRoles.indexOf(this.roles[j]) > -1) {
          return true;
        }
      }

      // Check by custom privileges
      if (Array.isArray(this.customPrivileges)
          && (this.customPrivileges.indexOf(privilegeName) > -1
            || this.customPrivileges.indexOf('*') > -1)) {
        return true;
      }
    }
  }

  return false;
};

exports.UserHandler = UserHandler;
exports.createUserHandler = function() {
  return new UserHandler();
};

/**
 * Create a Express.js middleware for user authentication.
 *
 * @param  {Object}   routeConfig - Route config.
 * @return {Function}             - Express.js middleware.
 */
exports.createAuthChecker = function(routeConfig) {
  return function(req, res, next) {
    if (CONFIG.MODE === 'dev') {
      res.locals.logger.debug('[MID] IN auth.authChecker');
    }

    // Check only require sign-in
    if (!routeConfig.requireSignIn) {
      return next();
    }

    // Throw error if error occured.
    if (res.locals.reqAuthError) {
      return next(res.locals.reqAuthError);
    }

    // Stop un-signed-in user
    if (!res.locals.user.isSignedIn) {
      return next(new E('EUserAuth', 'User not signed in.'));
    }

    // Stop unsupported auth type
    var isInvalidAuthType = false;
    if (routeConfig.authType) {
      if (!Array.isArray(routeConfig.authType) && !toolkit.matchWildcard(res.locals.authType, routeConfig.authType)) {
        isInvalidAuthType = true;
      }

      if (!isInvalidAuthType && Array.isArray(routeConfig.authType) && !toolkit.matchWildcards(res.locals.authType, routeConfig.authType)) {
        isInvalidAuthType = true;
      }

      if (isInvalidAuthType) {
        return next(new E('EUserAuth', 'Auth type not supported', {
          authType         : res.locals.authType,
          supportedAuthType: routeConfig.authType,
        }));
      }
    }

    return next();
  };
};

/**
 * Create a Express.js middleware for privilege checking.
 *
 * @param  {Object}   routeConfig - Route config.
 * @return {Function}             - Express.js middleware.
 */
exports.createPrivilegeChecker = function(routeConfig) {
  return function(req, res, next) {
    if (CONFIG.MODE === 'dev') {
      res.locals.logger.debug('[MID] IN auth.privilegeChecker');
    }

    if (!routeConfig.privilege) {
      return next();
    }

    var requiredPrivileges = toolkit.asArray(routeConfig.privilege);

    for (var i = 0; i < requiredPrivileges.length; i++) {
      var p = requiredPrivileges[i];

      if (res.locals.user.can(p)) {
        return next();
      }
    }

    return next(new E('EUserPrivilege', 'Privilege is not satisfied.', {
      requiredPrivileges: requiredPrivileges,
    }));
  };
};
