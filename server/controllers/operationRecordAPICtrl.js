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

        listData.forEach(function(d) {
          // 解析 IP 真实地址
          d.clientIPRegionsJSON = [];
          if (d.clientIPsJSON) {
            d.clientIPRegionsJSON = d.clientIPsJSON.map(function(ip) {
              var ipRegion = toolkit.ipRegion(ip);
              var ipRegionParts = [];
              if (ipRegion.country)  ipRegionParts.push(ipRegion.country);
              if (ipRegion.province) ipRegionParts.push(ipRegion.province);
              if (ipRegion.city)     ipRegionParts.push(ipRegion.city);
              if (ipRegion.isp)      ipRegionParts.push(ipRegion.isp);
              return toolkit.noDuplication(ipRegionParts).join(' / ');
            });
          }
        });

        return asyncCallback();
      });
    },
    // 补充集成登录用户信息
    function(asyncCallback) {
      var funcModel = funcMod.createModel(res.locals);

      var opt = {
        filters: {
          integration: { eq: 'signIn' }
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
          // 集成登录用户
          if (d.userId && toolkit.startsWith(d.userId, 'igu_')) {
            d.integratedSignInFuncId = true;

            var _tmp = d.userId.split('-');
            d.username = d.username || _tmp[1];

            var funcIdMD5 = _tmp[0].split('_')[1];
            if (integratedSignInFuncMap[funcIdMD5]) {
              d.integratedSignInFuncId    = integratedSignInFuncMap[funcIdMD5].id;
              d.integratedSignInFuncTitle = integratedSignInFuncMap[funcIdMD5].title;
            }
          }
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
