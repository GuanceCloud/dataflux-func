'use strict';

/* Built-in Modules */

/* 3rd-party Modules */
var async      = require('async');
var cronParser = require("cron-parser");

/* Project Modules */
var E           = require('../utils/serverError');
var CONFIG      = require('../utils/yamlResources').get('CONFIG');
var toolkit     = require('../utils/toolkit');
var modelHelper = require('../utils/modelHelper');

/* Init */
var TABLE_OPTIONS = exports.TABLE_OPTIONS = {
  displayName: 'crontab config',
  entityName : 'crontabConfig',
  tableName  : 'biz_main_crontab_config',
  alias      : 'cron',

  objectFields: {
    funcCallKwargsJSON  : 'json',
    tagsJSON            : 'json',
    isDisabled          : 'boolean',
    func_extraConfigJSON: 'json',
    func_tagsJSON       : 'json',
  },

  defaultOrders: [
    {field: 'cron.seq', method: 'DESC'},
  ],
};

exports.createCRUDHandler = function() {
  return modelHelper.createCRUDHandler(EntityModel);
};

exports.createModel = function(locals) {
  return new EntityModel(locals);
};

var EntityModel = exports.EntityModel = modelHelper.createSubModel(TABLE_OPTIONS);

EntityModel.prototype.list = function(options, callback) {
  options = options || {};

  var sql = toolkit.createStringBuilder();
  sql.append('SELECT');
  sql.append('   cron.*');

  sql.append('  ,func.id              AS func_id');
  sql.append('  ,func.name            AS func_name');
  sql.append('  ,func.title           AS func_title');
  sql.append('  ,func.description     AS func_description');
  sql.append('  ,func.definition      AS func_definition');
  sql.append('  ,func.extraConfigJSON AS func_extraConfigJSON');
  sql.append('  ,func.category        AS func_category');
  sql.append('  ,func.integration     AS func_integration');
  sql.append('  ,func.tagsJSON        AS func_tagsJSON');

  sql.append('  ,scpt.id             AS scpt_id');
  sql.append('  ,scpt.title          AS scpt_title');
  sql.append('  ,scpt.description    AS scpt_description');
  sql.append('  ,scpt.publishVersion AS scpt_publishVersion');

  sql.append('  ,sset.id          AS sset_id');
  sql.append('  ,sset.title       AS sset_title');
  sql.append('  ,sset.description AS sset_description');

  sql.append('FROM biz_main_crontab_config AS cron');

  sql.append('LEFT JOIN biz_main_func AS func');
  sql.append('  ON func.id = cron.funcId');

  sql.append('LEFT JOIN biz_main_script AS scpt');
  sql.append('  ON scpt.id = func.scriptId');

  sql.append('LEFT JOIN biz_main_script_set AS sset');
  sql.append('  ON sset.id = func.scriptSetId');

  options.baseSQL = sql.toString();
  options.groups  = [ 'cron.id' ];
  options.orders  = [ { field: 'cron.seq', method: 'DESC' } ];

  this._list(options, callback);
};

EntityModel.prototype.add = function(data, callback) {
  try {
    if (!data.funcCallKwargsJSON) {
      data.funcCallKwargsJSON = {};
    }

    data = _prepareData(data);
  } catch(err) {
    this.logger.logError(err);
    if (err instanceof E) {
      return callback(err);
    } else {
      return callback(new E('EClientBadRequest', 'Invalid request post data', {
        error: err.toString(),
      }));
    }
  }

  // 添加 origin, originId
  if (!data.origin) data.origin = (this.locals.user && this.locals.user.isSignedIn) ? 'user'              : 'UNKNOWN';
  if (!data.origin) data.origin = (this.locals.user && this.locals.user.isSignedIn) ? this.locals.user.id : 'UNKNOWN';

  return this._add(data, callback);
};

EntityModel.prototype.modify = function(id, data, callback) {
  try {
    data = _prepareData(data);
  } catch(err) {
    this.logger.logError(err);
    if (err instanceof E) {
      return callback(err);
    } else {
      return callback(new E('EClientBadRequest', 'Invalid request post data', {
        error: err.toString(),
      }));
    }
  }

  return this._modify(id, data, callback);
};

function _prepareData(data) {
  data = toolkit.jsonCopy(data);

  if (data.funcCallKwargsJSON && 'object' === typeof data.funcCallKwargsJSON) {
    data.funcCallKwargsJSON = JSON.stringify(data.funcCallKwargsJSON);
  }

  if (data.tagsJSON && 'object' === typeof data.tagsJSON) {
    data.tagsJSON = toolkit.noDuplication(data.tagsJSON);
    data.tagsJSON.sort();
    data.tagsJSON = JSON.stringify(data.tagsJSON);
  }

  if (data.crontab) {
    try {
      // 检查CronTab语法
      cronParser.parseExpression(data.crontab);
    } catch(err) {
      throw new E('EClientBadRequest.InvalidCronTabExpression', 'Invalid CronTab expression', {
        crontab: data.crontab,
      });
    }
  }

  if (data.expireTime) {
    data.expireTime = toolkit.getSafeDateTime(data.expireTime);
  }

  return data;
};
