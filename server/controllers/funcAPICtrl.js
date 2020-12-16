'use strict';

/* Builtin Modules */

/* 3rd-party Modules */
var async = require('async');

/* Project Modules */
var E       = require('../utils/serverError');
var CONFIG  = require('../utils/yamlResources').get('CONFIG');
var toolkit = require('../utils/toolkit');
var urlFor  = require('../utils/routeLoader').urlFor;

var funcMod = require('../models/funcMod');

/* Configure */

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

        funcPageInfo = pageInfo;

        if (!toolkit.toBoolean(req.query._asFuncDoc)) {
          funcs = dbRes;
        } else {
          // 转换格式
          funcs = [];

          dbRes.forEach(function(d) {
            if (d.extraConfigJSON && d.extraConfigJSON.isHidden) {
              // 隐藏函数不返回
              return;
            }

            funcs.push({
              url: urlFor('datafluxFuncAPI.callFunc', {
                params: { id: d.id },
              }),

              id                  : d.id,
              name                : d.name,
              title               : d.title,
              description         : d.description,
              definition          : d.definition,
              argsJSON            : d.argsJSON,
              kwargsJSON          : d.kwargsJSON,
              extraConfigJSON     : d.extraConfigJSON,
              category            : d.category,
              integration         : d.integration,
              tagsJSON            : d.tagsJSON,
              scriptId            : d.scpt_id,
              scriptTitle         : d.scpt_title,
              scriptDescription   : d.scpt_description,
              scriptSetId         : d.sset_id,
              scriptSetTitle      : d.sset_title,
              scriptSetDescription: d.sset_description,
            });
          });
        }

        return asyncCallback();
      });
    },
  ], function(err) {
    if (err) return next(err);

    var ret = toolkit.initRet(funcs, funcPageInfo);
    res.locals.sendJSON(ret);
  });
};
