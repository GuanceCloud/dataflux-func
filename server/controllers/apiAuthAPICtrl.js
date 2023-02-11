'use strict';

/* Built-in Modules */

/* 3rd-party Modules */
var async     = require('async');
var splitargs = require('splitargs');

/* Project Modules */
var E       = require('../utils/serverError');
var CONFIG  = require('../utils/yamlResources').get('CONFIG');
var toolkit = require('../utils/toolkit');

var apiAuthMod = require('../models/apiAuthMod');

/* Configure */

/* Handlers */
var crudHandler = exports.crudHandler = apiAuthMod.createCRUDHandler();

exports.list   = crudHandler.createListHandler({ beforeResp: hidePassword });
exports.add    = crudHandler.createAddHandler();
exports.modify = crudHandler.createModifyHandler();
exports.delete = crudHandler.createDeleteHandler();

function hidePassword(req, res, ret, hookExtra, callback) {
  if (!ret.data) return callback(null, ret);

  toolkit.asArray(ret.data).forEach(function(d) {
    if (!Array.isArray(d.configJSON.users)) return;

    d.configJSON.users.forEach(function(x) {
      delete x.passwordCipher;
    });
  });

  return callback(null, ret);
};
