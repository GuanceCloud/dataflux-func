'use strict';

/* Builtin Modules */

/* 3rd-party Modules */
var async      = require('async');
var sortedJSON = require('sorted-json');

/* Project Modules */
var E       = require('../utils/serverError');
var CONFIG  = require('../utils/yamlResources').get('CONFIG');
var toolkit = require('../utils/toolkit');

var funcMod            = require('../models/funcMod');
var crontabConfigMod   = require('../models/crontabConfigMod');
var crontabTaskInfoMod = require('../models/crontabTaskInfoMod');

/* Configure */

/* Handlers */
var crudHandler = exports.crudHandler = crontabConfigMod.createCRUDHandler();

exports.delete = crudHandler.createDeleteHandler();

function getConfigHash(req, res, funcId, funcCallKwargsJSON, callback) {
  var funcModel = funcMod.createModel(req, res);
  funcModel.getWithCheck(funcId, ['id', 'category'], function(err, dbRes) {
    if (err) return callback(err);

    var func = dbRes;

    // 规整化函数调用参数
    funcCallKwargsJSON = funcCallKwargsJSON || {};
    if ('string' === typeof funcCallKwargsJSON) {
      funcCallKwargsJSON = JSON.parse(funcCallKwargsJSON);
    }

    funcCallKwargsJSON = toolkit.jsonCopy(funcCallKwargsJSON);

    var funcKwargsDump = sortedJSON.sortify(funcCallKwargsJSON, {
          stringify: true,
          sortArray: false });
    var strToMD5  = [funcId, funcKwargsDump].join('-');
    var configMD5 = toolkit.getMD5(strToMD5);

    return callback(null, configMD5);
  });
};

exports.list = function(req, res, next) {
  var crontabConfigs        = null;
  var crontabConfigPageInfo = null;

  var crontabConfigModel = crontabConfigMod.createModel(req, res);

  async.series([
    function(asyncCallback) {
      var opt = res.locals.getQueryOptions();

      crontabConfigModel.list(opt, function(err, dbRes, pageInfo) {
        if (err) return asyncCallback(err);

        crontabConfigs        = dbRes;
        crontabConfigPageInfo = pageInfo;

        return asyncCallback();
      });
    },
    // 查询任务信息数量
    function(asyncCallback) {
      if (crontabConfigs.length <= 0) return asyncCallback();

      var opt = res.locals.getQueryOptions();
      if (!opt.extra.withTaskInfoCount) return asyncCallback();

      var crontabTaskInfoModel = crontabTaskInfoMod.createModel(req, res);

      var ids = toolkit.arrayElementValues(crontabConfigs, 'id');
      crontabTaskInfoModel.countByCrontabConfigId(ids, function(err, dbRes) {
        if (err) return asyncCallback(err);

        var _map = toolkit.arrayElementMap(dbRes, 'crontabConfigId');
        crontabConfigs.forEach(function(d) {
          if (!_map[d.id]) {
            d.taskInfoCount = 0;
          } else {
            d.taskInfoCount = _map[d.id].count || 0;
          }
        });

        return asyncCallback();
      });
    },
  ], function(err) {
    if (err) return next(err);

    var ret = toolkit.initRet(crontabConfigs, crontabConfigPageInfo);
    res.locals.sendJSON(ret);
  });
};

exports.add = function(req, res, next) {
  var data = req.body.data;

  var funcModel          = funcMod.createModel(req, res);
  var crontabConfigModel = crontabConfigMod.createModel(req, res);

  var configMD5 = null;
  var addedId   = null;

  async.series([
    // 检查函数
    function(asyncCallback) {
      funcModel.getWithCheck(data.funcId, null, function(err, dbRes) {
        if (err) return asyncCallback(err);

        // 存在固定Crontab时，跟随固定Crontab
        if (dbRes.extraConfigJSON && dbRes.extraConfigJSON.fixedCrontab) {
          data.crontab = null;
        }

        return asyncCallback();
      });
    },
    // 获取函数参数哈希
    function(asyncCallback) {
      getConfigHash(req, res, data.funcId, data.funcCallKwargsJSON, function(err, _configMD5) {
        if (err) return asyncCallback(err);

        configMD5 = _configMD5;

        return asyncCallback();
      });
    },
    // 检查重复
    function(asyncCallback) {
      var scope = data.scope || 'GLOBAL';

      let opt = {
        filters: {
          'cron.scope'    : {eq: scope},
          'cron.configMD5': {eq: configMD5},
        }
      };
      crontabConfigModel.list(opt, function(err, dbRes) {
        if (err) return asyncCallback(err);

        if (dbRes.length > 0) {
          return asyncCallback(new E('EBizCondition.DuplicatedCrontabConfig', toolkit.strf('Duplicated Crontab config in scope: `{0}`.', scope)));
        }

        data.configMD5 = configMD5;

        return asyncCallback(err);
      });
    },
    // 数据入库
    function(asyncCallback) {
      crontabConfigModel.add(data, function(err, _addedId) {
        if (err) return asyncCallback(err);

        addedId = _addedId;

        return asyncCallback();
      });
    },
  ], function(err) {
    if (err) return next(err);

    var ret = toolkit.initRet({
      id: addedId,
    });
    return res.locals.sendJSON(ret);
  });
};

exports.modify = function(req, res, next) {
  var id   = req.params.id;
  var data = req.body.data;

  var funcModel          = funcMod.createModel(req, res);
  var crontabConfigModel = crontabConfigMod.createModel(req, res);

  var crontabConfig  = null;
  var nextConfigMD5 = null;

  async.series([
    // 获取数据
    function(asyncCallback) {
      crontabConfigModel.getWithCheck(id, null, function(err, dbRes) {
        if (err) return asyncCallback(err);

        crontabConfig = dbRes;

        return asyncCallback();
      });
    },
    // 检查函数
    function(asyncCallback) {
      if (toolkit.isNothing(data.funcId)) return asyncCallback();

      funcModel.getWithCheck(data.funcId, null, function(err, dbRes) {
        if (err) return asyncCallback(err);

        // 存在固定Crontab时，跟随固定Crontab
        if (dbRes.extraConfigJSON && dbRes.extraConfigJSON.fixedCrontab) {
          data.crontab = null;
        }

        return asyncCallback();
      });
    },
    // 获取函数参数哈希
    function(asyncCallback) {
      var nextFuncId         = data.funcId             || crontabConfig.funcId;
      var nextFuncKwargsJSON = data.funcCallKwargsJSON || crontabConfig.funcCallKwargsJSON;

      getConfigHash(req, res, nextFuncId, nextFuncKwargsJSON, function(err, _configMD5) {
        if (err) return asyncCallback(err);

        nextConfigMD5 = _configMD5;

        return asyncCallback();
      });
    },
    // 检查重复
    function(asyncCallback) {
      var nextScope = data.scope || crontabConfig.scope;

      let opt = {
        filters: {
          'cron.scope'    : {eq: nextScope},
          'cron.configMD5': {eq: nextConfigMD5},
          'cron.id'       : {ne: id},
        }
      };
      crontabConfigModel.list(opt, function(err, dbRes) {
        if (err) return asyncCallback(err);

        if (dbRes.length > 0) {
          return asyncCallback(new E('EBizCondition.DuplicatedCrontabConfig', toolkit.strf('Duplicated Crontab config in scope: `{0}`.', nextScope)));
        }

        data.configMD5 = nextConfigMD5;

        return asyncCallback(err);
      });
    },
    // 数据入库
    function(asyncCallback) {
      crontabConfigModel.modify(id, data, asyncCallback);
    },
  ], function(err) {
    if (err) return next(err);

    var ret = toolkit.initRet({
      id: id,
    });
    return res.locals.sendJSON(ret);
  });
};
