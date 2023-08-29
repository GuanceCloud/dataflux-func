'use strict';

/* Built-in Modules */

/* 3rd-party Modules */
var async = require('async');

/* Project Modules */
var E       = require('../utils/serverError');
var CONFIG  = require('../utils/yamlResources').get('CONFIG');
var toolkit = require('../utils/toolkit');
var urlFor  = require('../utils/routeLoader').urlFor;

var funcMod = require('../models/funcMod');

/* Init */

/* Handlers */
var crudHandler = exports.crudHandler = funcMod.createCRUDHandler();

exports.list = function(req, res, next) {
  if (req.query.scriptSetId && !toolkit.endsWith(req.query.scriptSetId, '__')) {
    req.query.scriptSetId = req.query.scriptSetId + '__';
  }
  if (req.query.scriptId && !toolkit.endsWith(req.query.scriptId, '.')) {
    req.query.scriptId = req.query.scriptId + '.';
  }

  var funcs        = null;
  var funcPageInfo = null;

  var funcModel = funcMod.createModel(res.locals);

  async.series([
    function(asyncCallback) {
      var opt = res.locals.getQueryOptions();

      funcModel.list(opt, function(err, dbRes, pageInfo) {
        if (err) return asyncCallback(err);

        funcs        = dbRes;
        funcPageInfo = pageInfo;

        return asyncCallback();
      });
    },
  ], function(err) {
    if (err) return next(err);

    var ret = toolkit.initRet(funcs, funcPageInfo);
    res.locals.sendJSON(ret);
  });
};
