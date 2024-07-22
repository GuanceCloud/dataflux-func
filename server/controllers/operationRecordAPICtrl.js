'use strict';

/* Built-in Modules */

/* 3rd-party Modules */
var async = require('async');

/* Project Modules */
var E       = require('../utils/serverError');
var CONFIG  = require('../utils/yamlResources').get('CONFIG');
var toolkit = require('../utils/toolkit');

var funcMod            = require('../models/funcMod');
var operationRecordMod = require('../models/operationRecordMod');

/* Init */

/* Handlers */
var crudHandler = exports.crudHandler = operationRecordMod.createCRUDHandler();

exports.list = function(req, res, next) {
  var listData     = null;
  var listPageInfo = null;

  var operationRecordModel = operationRecordMod.createModel(res.locals);

  async.series([
    function(asyncCallback) {
      var opt = res.locals.getQueryOptions();

      operationRecordModel.list(opt, function(err, dbRes, pageInfo) {
        if (err) return asyncCallback(err);

        listData     = dbRes;
        listPageInfo = pageInfo;

        return asyncCallback();
      });
    },
    // 补充集成登录用户信息
    function(asyncCallback) {
      if (CONFIG.DISABLE_INTEGRATED_SIGNIN) return asyncCallback();

      var funcModel = funcMod.createModel(res.locals);

      var opt = {
        filters: {
          integration: {eq: 'signIn'}
        }
      };
      funcModel.list(opt, function(err, dbRes) {
        if (err) return asyncCallback(err);

        var integratedSignInFuncMap = {};

        dbRes.forEach(function(d) {
          var funcIdMD5 = toolkit.getMD5(d.id);
          integratedSignInFuncMap[funcIdMD5] = {
            id   : d.id,
            title: d.title,
          };
        });

        listData.forEach(function(d) {
          if (!toolkit.startsWith(d.userId, 'igu_')) return;

          d.u_integratedSignInFuncId = true;

          var _tmp = d.userId.split('-');
          d.u_username = d.u_username || _tmp[1];

          var funcIdMD5 = _tmp[0].split('_')[1];
          if (!integratedSignInFuncMap[funcIdMD5]) return;

          d.u_integratedSignInFuncId    = integratedSignInFuncMap[funcIdMD5].id;
          d.u_integratedSignInFuncTitle = integratedSignInFuncMap[funcIdMD5].title;
        });

        return asyncCallback();
      });
    },
  ], function(err) {
    if (err) return next(err);

    var ret = toolkit.initRet(listData, listPageInfo);
    res.locals.sendJSON(ret);
  });
};
