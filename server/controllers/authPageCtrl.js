'use strict';

/* 3rd-party Modules */
var async = require('async');

/* Project Modules */
var E       = require('../utils/serverError');
var CONFIG  = require('../utils/yamlResources').get('CONFIG');
var toolkit = require('../utils/toolkit');
var auth    = require('../utils/auth');
var urlFor  = require('../utils/routeLoader').urlFor;

var userMod = require('../models/userMod');

/* Hanlders */
exports.signIn = function(req, res, next) {
  if (res.locals.user && res.locals.user.isSignedIn) {
    return res.locals.redirect('/');
  }

  res.locals.render('_auth/signIn');
};

exports.signOut = function(req, res, next) {
  // Clear Cookie
  if (CONFIG._WEB_AUTH_COOKIE) {
    res.clearCookie(CONFIG._WEB_AUTH_COOKIE);
  }

  // Revoke x-auth-token
  if (res.locals.xAuthTokenObj) {
    var cacheKey = auth.getCacheKey(res.locals.xAuthTokenObj);
    res.locals.cacheDB.del(cacheKey);
  }

  return res.locals.render('_auth/signOut');
};

exports.changePassword = function(req, res, next) {
  res.locals.render('_auth/changePassword');
};

exports.profile = function(req, res, next) {
  res.locals.render('_auth/profile');
};
