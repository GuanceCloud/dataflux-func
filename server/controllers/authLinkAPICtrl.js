'use strict';

/* Built-in Modules */

/* 3rd-party Modules */
var async = require('async');

/* Project Modules */
var E           = require('../utils/serverError');
var CONFIG      = require('../utils/yamlResources').get('CONFIG');
var toolkit     = require('../utils/toolkit');
var modelHelper = require('../utils/modelHelper');
var urlFor      = require('../utils/routeLoader').urlFor;

var funcMod     = require('../models/funcMod');
var authLinkMod = require('../models/authLinkMod');

/* Init */

/* Handlers */
var crudHandler = exports.crudHandler = authLinkMod.createCRUDHandler();
exports.delete     = crudHandler.createDeleteHandler();
exports.deleteMany = crudHandler.createDeleteManyHandler();

exports.list = function(req, res, next) {
  var listData     = null;
  var listPageInfo = null;

  var authLinkModel = authLinkMod.createModel(res.locals);

  async.series([
    function(asyncCallback) {
      var opt = res.locals.getQueryOptions();

      authLinkModel.list(opt, function(err, dbRes, pageInfo) {
        if (err) return asyncCallback(err);

        listData     = dbRes;
        listPageInfo = pageInfo;

        return asyncCallback();
      });
    },
    // 追加最后任务状态
    function(asyncCallback) {
      var dataIds = toolkit.arrayElementValues(listData, 'id');
      var cacheKey = toolkit.getGlobalCacheKey('cache', 'lastTaskStatus', [ 'origin', 'authLink' ]);
      res.locals.cacheDB.hmget(cacheKey, dataIds, function(err, cacheRes) {
        if (err) return asyncCallback(err);

        listData.forEach(function(d) {
          d.lastTaskStatus = null;

          var lastTaskStatus = cacheRes[d.id];
          if (!lastTaskStatus) return;

          d.lastTaskStatus = JSON.parse(lastTaskStatus);
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

exports.add = function(req, res, next) {
  var data = req.body.data;

  _add(res.locals, data, function(err, addedId) {
    if (err) return next(err);

    var ret = toolkit.initRet({
      id : addedId,
      url: urlFor('mainAPI.callAuthLinkByGet', {
        params: { id: addedId },
      }),
    });
    return res.locals.sendJSON(ret);
  });
};

exports.modify = function(req, res, next) {
  var id   = req.params.id;
  var data = req.body.data;

  _modify(res.locals, id, data, null, function(err, modifiedId, url) {
    if (err) return next(err);

    var ret = toolkit.initRet({
      id : id,
      url: url,
    });
    return res.locals.sendJSON(ret);
  });
};

exports.addMany = function(req, res, next) {
  var data = req.body.data;

  var addedIds = [];

  var transScope = modelHelper.createTransScope(res.locals.db);
  async.series([
    function(asyncCallback) {
      transScope.start(asyncCallback);
    },
    function(asyncCallback) {
      async.eachSeries(data, function(d, eachCallback) {
        _add(res.locals, d, function(err, addedId) {
          if (err) return eachCallback(err);

          addedIds.push(addedId);

          return eachCallback();
        });
      }, asyncCallback);
    },
  ], function(err) {
    transScope.end(err, function(scopeErr) {
      if (scopeErr) return next(scopeErr);

      var ret = toolkit.initRet({
        ids: addedIds,
      });
      return res.locals.sendJSON(ret);
    });
  });
};

exports.modifyMany = function(req, res, next) {
  var data = req.body.data;

  var authLinkModel = authLinkMod.createModel(res.locals);

  var modifiedIds = [];

  var transScope = modelHelper.createTransScope(res.locals.db);
  async.series([
    function(asyncCallback) {
      var opt = res.locals.getQueryOptions();

      if (toolkit.isNothing(opt.filters)) {
        return asyncCallback(new E('EBizCondition.ModifyConditionNotSpecified', 'At least one condition should been specified'));
      }

      opt.fields = [ 'auln.id' ];
      opt.paging = false;

      authLinkModel.list(opt, function(err, dbRes) {
        if (err) return asyncCallback(err);

        modifiedIds = toolkit.arrayElementValues(dbRes, 'id');

        return asyncCallback();
      });
    },
    function(asyncCallback) {
      transScope.start(asyncCallback);
    },
    function(asyncCallback) {
      async.eachSeries(modifiedIds, function(id, eachCallback) {
        var _data = toolkit.jsonCopy(data);
        var opt = {
          funcCallKwargs: 'merge'
        };
        _modify(res.locals, id, _data, opt, eachCallback);

      }, asyncCallback);
    },
  ], function(err) {
    transScope.end(err, function(scopeErr) {
      if (scopeErr) return next(scopeErr);

      var ret = toolkit.initRet({
        ids: modifiedIds,
      });
      return res.locals.sendJSON(ret);
    });
  });
};

function _add(locals, data, callback) {
  var funcModel     = funcMod.createModel(locals);
  var authLinkModel = authLinkMod.createModel(locals);

  var addedId = null;

  async.series([
    // 检查函数
    function(asyncCallback) {
      funcModel.getWithCheck(data.funcId, ['func.seq'], asyncCallback);
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
    if (err) return callback(err);
    return callback(null, addedId);
  });
};

function _modify(locals, id, data, opt, callback) {
  opt = opt || {};

  var funcModel     = funcMod.createModel(locals);
  var authLinkModel = authLinkMod.createModel(locals);

  var authLink = null;

  async.series([
    // 获取数据
    function(asyncCallback) {
      var fields = [
        'auln.seq',
        'auln.funcCallKwargsJSON',
      ]
      authLinkModel.getWithCheck(id, fields, function(err, dbRes) {
        if (err) return asyncCallback(err);

        authLink = dbRes;

        if (opt.funcCallKwargs === 'merge' && toolkit.notNothing(data.funcCallKwargsJSON)) {
          // 合并funcCallKwargsJSON参数
          var prevFuncCallKwargs = toolkit.jsonCopy(authLink.funcCallKwargsJSON);
          data.funcCallKwargsJSON = Object.assign(prevFuncCallKwargs, data.funcCallKwargsJSON);
        }

        return asyncCallback();
      });
    },
    // 检查函数
    function(asyncCallback) {
      if (toolkit.isNothing(data.funcId)) return asyncCallback();

      funcModel.getWithCheck(data.funcId, ['func.seq'], asyncCallback);
    },
    function(asyncCallback) {
      authLinkModel.modify(id, data, asyncCallback);
    },
  ], function(err) {
    if (err) return callback(err);

    var url = urlFor('mainAPI.callAuthLinkByGet', { params: { id: id } });
    return callback(null, id, url);
  });
};
