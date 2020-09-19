'use strict';

/* Builtin Modules */

/* 3rd-party Modules */
var async = require('async');

/* Project Modules */
var E           = require('../utils/serverError');
var CONFIG      = require('../utils/yamlResources').get('CONFIG');
var toolkit     = require('../utils/toolkit');
var modelHelper = require('../utils/modelHelper');

/* Configure */
var TABLE_OPTIONS = exports.TABLE_OPTIONS = {
  displayName: 'system config',
  entityName : 'systemConfig',
  tableName  : 'wat_main_system_config',
  alias      : 'sc',
};

exports.createCRUDHandler = function() {
  return modelHelper.createCRUDHandler(EntityModel);
};

exports.createModel = function(req, res) {
  return new EntityModel(req, res);
};

var EntityModel = exports.EntityModel = modelHelper.createSubModel(TABLE_OPTIONS);

EntityModel.prototype.set = function(id, newValue, callback) {
  var self = this;

  var systemConfigId = null;
  var oldValue       = null;

  async.series([
    // 查询配置项
    function(asyncCallback) {
      var opt = {
        filters: {
          id: {eq: id}
        }
      };
      self.list(opt, function(err, dbRes) {
        if (err) return asyncCallback(err);

        dbRes = dbRes[0];
        if (dbRes) {
          systemConfigId = dbRes.id;
          oldValue       = dbRes.value;
        }

        return asyncCallback();
      });
    },
    // 添加/更新配置项目
    function(asyncCallback) {
      if (systemConfigId) {
        // 更新数据
        var nextData = {
          value: newValue,
        };
        self.modify(systemConfigId, nextData, asyncCallback);

      } else {
        // 插入数据
        var newData = {
          id   : id,
          value: newValue,
        };
        self.add(newData, asyncCallback);
      }
    },
  ], function(err) {
    if (err) return callback(err);

    var ret = {
      oldValue: oldValue,
      newValue: newValue,
    }
    return callback(null, ret);
  });
};
