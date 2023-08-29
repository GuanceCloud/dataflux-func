'use strict';

/* 3rd-party Modules */
var async = require('async');

/* Project Modules */
var E       = require('../utils/serverError');
var CONFIG  = require('../utils/yamlResources').get('CONFIG');
var toolkit = require('../utils/toolkit');
var auth    = require('../utils/auth');

var userMod = require('../models/userMod');

/* Init */
var GET_FIELDS = [
  'seq',
  'id',
  'username',
  'name',
  'email',
  'mobile',
  'roles',
  'customPrivileges',
  'isDisabled',
  'createTime',
  'updateTime',
];

/* Handlers */
var crudHandler = exports.crudHandler = userMod.createCRUDHandler();

exports.list   = crudHandler.createListHandler({ beforeResp: appendOnlineStatus });
exports.get    = crudHandler.createGetHandler({ fields: GET_FIELDS });
exports.delete = crudHandler.createDeleteHandler();

function appendOnlineStatus(req, res, ret, hookExtra, callback) {
  if (!ret.data) return callback(null, ret);

  // 初始化
  ret.data.forEach(function(d) {
    d.sessions = [];
  });

  var userMap = toolkit.arrayElementMap(ret.data, 'id');

  // 获取所有 Key
  var cachePattern = auth.getCachePattern();
  res.locals.cacheDB.keys(cachePattern, function(err, keys) {
    if (err) return asyncCallback();

    // 获取所有 TTL
    async.each(keys, function(key, eachCallback) {
      var parsedKey = toolkit.parseCacheKey(key);

      var user = userMap[parsedKey.tags.userId];
      if (!user) return eachCallback();

      res.locals.cacheDB.pttl(key, function(err, ttlMs) {
        if (!err) {
          var idleMs = CONFIG._WEB_AUTH_EXPIRES * 1000 - ttlMs;
          user.sessions.push({
            ttlMs           : ttlMs,
            idleMs          : idleMs,
            lastAccessTime: new Date(Date.now() - idleMs),
          });
        }
        return eachCallback();
      });

    }, function() {
      // Session 排序
      ret.data.forEach(function(d, index) {
        d.sessions.sort(function(a, b) {
          if (a.ttlMs > b.ttlMs) return -1;
          else if (a.ttlMs < b.ttlMs) return 1;
          else return 0;
        });

        // 原始排序标记
        d._index = index;
      });

      // 用户排序
      ret.data.sort(function(a, b) {
        if (a.sessions.length > 0 && b.sessions.length <= 0) return -1;
        else if (a.sessions.length <= 0 && b.sessions.length > 0) return 1;
        else if (a.sessions.length <= 0 && b.sessions.length <= 0) return a._index - b._index;
        else {
          if (a.sessions[0].ttlMs > b.sessions[0].ttlMs) return -1;
          else if (a.sessions[0].ttlMs < b.sessions[0].ttlMs) return 1;
          else return a._index - b._index;
        }
      });

      // 清理原始排序标记
      ret.data.forEach(function(d) {
        delete d._index;
      });

      return callback(null, ret);
    });
  });
};

exports.add = function(req, res, next) {
  var data = req.body.data || {};

  // Do business check
  var userModel = userMod.createModel(res.locals);

  var opt = {
    filters: {
      'u.username': {eq: data.username},
    },
  };
  userModel.list(opt, function(err, dbRes) {
    if (err) return next(err);

    if (dbRes.length > 0) {
      return next(new E('EClientDuplicated.username', 'This username is already existed'));
    }

    // Call the built-in handler
    var handler = crudHandler.createAddHandler();
    return handler(req, res, next);
  });
};

exports.modify = function(req, res, next) {
  var id   = req.params.id;
  var data = req.body.data || {};

  var userModel = userMod.createModel(res.locals);
  async.series([
    // 检查当前用户
    function(asyncCallback) {
      userModel.getWithCheck(id, ['roles'], function(err, dbRes) {
        if (err) return asyncCallback(err);

        if (Array.isArray(dbRes.roles) && dbRes.roles.indexOf('sa') >= 0) {
          return asyncCallback(new E('EBizCondition.adminUserCannotBeModified', 'Super Admin user cannot been modified directly'));
        }

        return asyncCallback(err);
      });
    },
    // 检查username 重名
    function(asyncCallback) {
      if (!data.username) return asyncCallback();

      var opt = {
        filters: {
          'u.id'      : {ne: id},
          'u.username': {eq: data.username},
        },
      };
      userModel.list(opt, function(err, dbRes) {
        if (err) return asyncCallback(err);

        if (dbRes.length > 0) {
          return asyncCallback(new E('EClientDuplicated.username', 'This username is used by others'));
        }

        return asyncCallback(err);
      });
    },
  ], function(err) {
    if (err) return next(err);

    // If disabled, delete xAuthToken
    if (toolkit.toBoolean(data.isDisabled)) {
      var cachePattern = auth.getCachePattern({userId: id});
      res.locals.cacheDB.delByPattern(cachePattern);
    }

    // Call the built-in handler
    var handler = crudHandler.createModifyHandler();
    return handler(req, res, next);
  });
};
