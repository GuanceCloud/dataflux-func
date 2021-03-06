'use strict';

/* Builtin Modules */

/* 3rd-party Modules */
var async = require('async');

/* Project Modules */
var E       = require('../utils/serverError');
var CONFIG  = require('../utils/yamlResources').get('CONFIG');
var toolkit = require('../utils/toolkit');

var dfWorkspaceMod = require('../models/dfWorkspaceMod');

/* Configure */
var DF_WORKSPACE_MAX_FETCH_PAGES = 10;
var DF_WORKSPACE_PAGE_SIZE       = 100;

/* Handlers */
var crudHandler = exports.crudHandler = dfWorkspaceMod.createCRUDHandler();

exports.list = function(req, res, next) {
  var dfWorkspaces        = null;
  var dfWorkspacePageInfo = null;

  var dfWorkspaceModel = dfWorkspaceMod.createModel(res.locals);

  async.series([
    // 正常查询
    function(asyncCallback) {
      var opt = res.locals.getQueryOptions();

      dfWorkspaceModel.list(opt, function(err, dbRes, pageInfo) {
        if (err) return asyncCallback(err);

        dfWorkspaces        = dbRes;
        dfWorkspacePageInfo = pageInfo;

        return asyncCallback();
      });
    },
    // 查询函数限制关联
    function(asyncCallback) {
      if (dfWorkspaces.length <= 0) return asyncCallback();

      if (!toolkit.toBoolean(req.query._withLimitedFuncs)) {
        return asyncCallback();
      }

      var dfWorkspaceUUIDs = toolkit.arrayElementValues(dfWorkspaces, 'uuid');
      dfWorkspaceModel.listRelFuncs(dfWorkspaceUUIDs, function(err, dbRes) {
        if (err) return asyncCallback(err);

        var dfWorkspaceToFuncMap = dbRes.reduce(function(acc, x) {
          if (!acc[x.rel_dfWorkspaceUUID]) {
            acc[x.rel_dfWorkspaceUUID] = [];
          }
          acc[x.rel_dfWorkspaceUUID].push(x);

          delete x.rel_funcId;
          delete x.rel_dfWorkspaceUUID;

          return acc;
        }, {});

        // 填入数据
        dfWorkspaces.forEach(function(d) {
          var limitedFuncs = dfWorkspaceToFuncMap[d.uuid];
          if (toolkit.isNothing(limitedFuncs)) {
            d.limitedFuncs = [];
          } else {
            d.limitedFuncs = limitedFuncs;
          }
        });

        return asyncCallback();
      });
    },
  ], function(err) {
    if (err) return next(err);

    var ret = toolkit.initRet(dfWorkspaces, dfWorkspacePageInfo);
    res.locals.sendJSON(ret);
  });
};
