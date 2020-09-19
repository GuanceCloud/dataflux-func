'use strict';

/* Builtin Modules */

/* 3rd-party Modules */
var async = require('async');

/* Project Modules */
var E       = require('../utils/serverError');
var CONFIG  = require('../utils/yamlResources').get('CONFIG');
var CONST   = require('../utils/yamlResources').get('CONST');
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

  if (!CONST.displayText.systemConfig_id[id]) {
    return next(new E('EClientUnsupported', toolkit.strf('Unsupproted system config.'),{
      id: id,
    }));
  }

  var systemConfigModel = systemConfigMod.createModel(req, res);

  systemConfigModel.set(id, value, function(err, dbRes) {
    if (err) return next(err);

    var ret = toolkit.initRet(dbRes);
    return res.locals.sendJSON(ret);
  });
};
