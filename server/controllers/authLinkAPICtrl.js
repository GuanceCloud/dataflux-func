'use strict';

/* Builtin Modules */

/* 3rd-party Modules */
var async = require('async');

/* Project Modules */
var E       = require('../utils/serverError');
var CONFIG  = require('../utils/yamlResources').get('CONFIG');
var toolkit = require('../utils/toolkit');
var urlFor  = require('../utils/routeLoader').urlFor;

var funcMod     = require('../models/funcMod');
var authLinkMod = require('../models/authLinkMod');

/* Configure */

/* Handlers */
var crudHandler = exports.crudHandler = authLinkMod.createCRUDHandler();

exports.delete = crudHandler.createDeleteHandler();

exports.list = function(req, res, next) {
  var authLinks        = null;
  var authLinkPageInfo = null;

  var authLinkModel = authLinkMod.createModel(res.locals);

  async.series([
    function(asyncCallback) {
      var opt = res.locals.getQueryOptions();

      authLinkModel.list(opt, function(err, dbRes, pageInfo) {
        if (err) return asyncCallback(err);

        authLinks        = dbRes;
        authLinkPageInfo = pageInfo;

        return asyncCallback();
      });
    },
    // 查询最近几天调用次数
    function(asyncCallback) {
      if (authLinks.length <= 0) return asyncCallback();

      var oneDaySeconds = 60 * 60 * 24;
      async.eachLimit(authLinks, 10, function(authLink, eachCallback) {
        authLink.recentRunningCount = [];

        var days = parseInt(CONFIG._RECENT_FUNC_RUNNING_COUNT_EXPIRES / oneDaySeconds);
        async.timesLimit(days, 10, function(n, timesCallback) {
          var dateStr = toolkit.getDateString(Date.now() - n * oneDaySeconds * 1000);
          var cacheKey = toolkit.getWorkerCacheKey('cache', 'recentFuncRunningCount', [
              'funcId'  , authLink.funcId,
              'origin'  , 'authLink',
              'originId', authLink.id,
              'date'    , dateStr]);
          res.locals.cacheDB.get(cacheKey, function(err, cacheRes) {
            // 报错跳过
            if (err) return timesCallback();

            authLink.recentRunningCount.push({
              date : dateStr,
              count: parseInt(cacheRes || 0),
            });

            return timesCallback();
          });
        }, eachCallback);
      }, asyncCallback);
    },
    // 查询记录最近几次调用时长
    function(asyncCallback) {
      if (authLinks.length <= 0) return asyncCallback();

      async.eachLimit(authLinks, 10, function(authLink, eachCallback) {
        authLink.recentRunningStatus = {};
        authLink.recentRunningCost = {
          samples: null,
          min    : null,
          max    : null,
          avg    : null,
          mid    : null,
          p75    : null,
          p95    : null,
          p99    : null,
        };

        var cacheKey = toolkit.getWorkerCacheKey('cache', 'recentFuncRunningStatus', [
            'funcId'  , authLink.funcId,
            'origin'  , 'authLink',
            'originId', authLink.id]);
        res.locals.cacheDB.lrange(cacheKey, 0, -1, function(err, cacheRes) {
          // 报错跳过
          if (err) return eachCallback();
          // 无数据跳过
          if (!cacheRes) return eachCallback();

          authLink.recentRunningStatus = cacheRes.reduce(function(acc, x) {
            x = JSON.parse(x);
            if (!acc[x.status]) {
              acc[x.status] = 1;
            } else {
              acc[x.status]++;
            }
            return acc;
          }, {});
          authLink.recentRunningStatus.total = cacheRes.length;

          var costList = cacheRes.map(function(x) {
            x = JSON.parse(x);
            return x.costMs;
          });
          console.log(costList)

          authLink.recentRunningCost.samples = costList.length;
          if (costList.length > 1) {
            authLink.recentRunningCost.min = parseInt(toolkit.mathMin(costList));
            authLink.recentRunningCost.max = parseInt(toolkit.mathMax(costList));
            authLink.recentRunningCost.avg = parseInt(toolkit.mathAvg(costList));
            authLink.recentRunningCost.mid = parseInt(toolkit.mathMedian(costList));
            authLink.recentRunningCost.p75 = parseInt(toolkit.mathPercentile(costList, 75));
            authLink.recentRunningCost.p95 = parseInt(toolkit.mathPercentile(costList, 95));
            authLink.recentRunningCost.p99 = parseInt(toolkit.mathPercentile(costList, 99));
          }

          return eachCallback();
        });
      }, asyncCallback);
    },
  ], function(err) {
    if (err) return next(err);

    var ret = toolkit.initRet(authLinks, authLinkPageInfo);
    res.locals.sendJSON(ret);
  });
};

exports.add = function(req, res, next) {
  var data = req.body.data;

  // 自动记录操作界面
  data.origin = req.get('X-Dff-Origin') === 'DFF-UI' ? 'UI' : 'API';

  var funcModel     = funcMod.createModel(res.locals);
  var authLinkModel = authLinkMod.createModel(res.locals);

  var addedId = null;

  async.series([
    // 检查函数
    function(asyncCallback) {
      if (toolkit.isNothing(data.funcId)) return asyncCallback();

      funcModel.getWithCheck(data.funcId, null, asyncCallback);
    },
    // 数据入库
    function(asyncCallback) {
      authLinkModel.add(data, function(err, _addedId) {
        if (err) return asyncCallback(err);

        addedId = _addedId;

        return asyncCallback();
      });
    },
  ], function(err) {
    if (err) return next(err);

    var ret = toolkit.initRet({
      id : addedId,
      url: urlFor('datafluxFuncAPI.callAuthLinkByGet', {
        params: { id: addedId },
      }),
    });
    return res.locals.sendJSON(ret);
  });
};

exports.modify = function(req, res, next) {
  var id   = req.params.id;
  var data = req.body.data;

  var funcModel     = funcMod.createModel(res.locals);
  var authLinkModel = authLinkMod.createModel(res.locals);

  var authLink = null;

  async.series([
    // 获取数据
    function(asyncCallback) {
      authLinkModel.getWithCheck(id, null, function(err, dbRes) {
        if (err) return asyncCallback(err);

        authLink = dbRes;

        return asyncCallback();
      });
    },
    // 检查函数
    function(asyncCallback) {
      if (toolkit.isNothing(data.funcId)) return asyncCallback();

      funcModel.getWithCheck(data.funcId, null, asyncCallback);
    },
    // 数据入库
    function(asyncCallback) {
      authLinkModel.modify(id, data, asyncCallback);
    },
  ], function(err) {
    if (err) return next(err);

    var ret = toolkit.initRet({
      id : id,
      url: urlFor('datafluxFuncAPI.callAuthLinkByGet', {
        params: { id: id },
      }),
    });
    return res.locals.sendJSON(ret);
  });
};
