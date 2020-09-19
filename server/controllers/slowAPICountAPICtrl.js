'use strict';

/* Builtin Modules */

/* 3rd-party Modules */
var async = require('async');

/* Project Modules */
var E       = require('../utils/serverError');
var CONFIG  = require('../utils/yamlResources').get('CONFIG');
var toolkit = require('../utils/toolkit');

var slowAPICountMod = require('../models/slowAPICountMod');

/* Configure */

/* Handlers */
exports.list = function(req, res, next) {
  var slowAPICountModel = slowAPICountMod.createModel(req, res);

  slowAPICountModel.list(function(err, dbRes) {
    if (err) return next(err);

    var ret = toolkit.initRet(dbRes);
    return res.locals.sendJSON(ret);
  });
};

exports.delete = function(req, res, next) {
  var id = req.params.id;

  var slowAPICountModel = slowAPICountMod.createModel(req, res);

  slowAPICountModel.delete(id, function(err, deletedId) {
    if (err) return next(err);

    var ret = toolkit.initRet({
      id: deletedId,
    });
    return res.locals.sendJSON(ret);
  });
};

exports.clear = function(req, res, next) {
  var slowAPICountModel = slowAPICountMod.createModel(req, res);

  slowAPICountModel.clear(function(err) {
    if (err) return next(err);

    var ret = toolkit.initRet();
    return res.locals.sendJSON(ret);
  });
};
