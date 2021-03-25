'use strict';

/* Builtin Modules */

/* 3rd-party Modules */
var async = require('async');

/* Project Modules */
var E             = require('../utils/serverError');
var yamlResources = require('../utils/yamlResources');
var toolkit       = require('../utils/toolkit');

var ROUTE  = yamlResources.get('ROUTE');
var CONFIG = yamlResources.get('CONFIG');

exports.prepare = function(req, res, next) {
  // Query部分
  var reqQuery = null;
  try {
    if (!toolkit.isNothing(req.query)) {
      reqQuery = toolkit.jsonCopy(req.query);
    }

  } catch(err) {
    res.locals.logger.logError(err);
  }

  // Params部分
  var reqParams = null;
  try {
    if (!toolkit.isNothing(req.query)) {
      reqParams = toolkit.jsonCopy(req.query);
    }

  } catch(err) {
    res.locals.logger.logError(err);
  }

  // Body部分
  var reqBody = null;
  try {
    if (!toolkit.isNothing(req.body)) {
      if (Buffer.isBuffer(req.body)) {
        reqBody = JSON.stringify(toolkit.strf('<Buffer, size={0}>', req.body.length));
      } else {
        reqBody = toolkit.jsonCopy(req.body);
      }
    }

  } catch(err) {
    res.locals.logger.logError(err);
  }

  var reqFileInfo = null;
  try {
    if (!toolkit.isNothing(req.files)) {
      reqFileInfo = []
      req.files.forEach(function(f) {
        reqFileInfo.push({
          name: f.originalname,
          size: f.size,
        })
      });
    }

  } catch(err) {
    res.locals.logger.logError(err);
  }

  res.locals._operationRecord = {
    userId         : res.locals.user.id   || null,
    username       : res.locals.user.name || null,
    clientId       : res.locals.clientId  || null,
    traceId        : res.locals.traceId   || null,
    reqMethod      : req.method,
    reqRoute       : null,
    reqQueryJSON   : reqQuery,
    reqParamsJSON  : null,
    reqBodyJSON    : reqBody,
    reqFileInfoJSON: reqFileInfo,
  };

  return next();
};
