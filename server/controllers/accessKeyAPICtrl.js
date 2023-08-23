'use strict';

/* Built-in Modules */

/* 3rd-party Modules */
var async = require('async');

/* Project Modules */
var E       = require('../utils/serverError');
var CONFIG  = require('../utils/yamlResources').get('CONFIG');
var toolkit = require('../utils/toolkit');

var accessKeyMod = require('../models/accessKeyMod');

/* Init */

/* Handlers */
var crudHandler = exports.crudHandler = accessKeyMod.createCRUDHandler();

exports.list   = crudHandler.createListHandler();
exports.get    = crudHandler.createGetHandler();
exports.add    = crudHandler.createAddHandler();
exports.modify = crudHandler.createModifyHandler();
exports.delete = crudHandler.createDeleteHandler();

exports.testWebhook = function(req, res, next) {
  // TODO 测试 Webhook

  return res.locals.sendJSON();
};
