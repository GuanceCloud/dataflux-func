'use strict';

/* Built-in Modules */

/* 3rd-party Modules */
var async = require('async');

/* Project Modules */
var E       = require('../utils/serverError');
var CONFIG  = require('../utils/yamlResources').get('CONFIG');
var toolkit = require('../utils/toolkit');

var systemConfigMod = require('../models/systemConfigMod');

/* Configure */

/* Handlers */
var crudHandler = exports.crudHandler = systemConfigMod.createCRUDHandler();

exports.list   = crudHandler.createListHandler();
exports.get    = crudHandler.createGetHandler();
exports.delete = crudHandler.createDeleteHandler();

exports.set = function(req, res, next) {
  var id   = req.params.id;
  var value = req.body.data.value;

  var systemConfigModel = systemConfigMod.createModel(res.locals);

  systemConfigModel.set(id, value, function(err, dbRes) {
    if (err) return next(err);

    var ret = toolkit.initRet(dbRes);
    return res.locals.sendJSON(ret);
  });
};
