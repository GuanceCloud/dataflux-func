'use strict';

/* Built-in Modules */

/* 3rd-party Modules */
var async = require('async');

/* Project Modules */
var E           = require('../utils/serverError');
var CONFIG      = require('../utils/yamlResources').get('CONFIG');
var toolkit     = require('../utils/toolkit');
var modelHelper = require('../utils/modelHelper');

var funcMod = require('./funcMod');

/* Init */
var TABLE_OPTIONS = exports.TABLE_OPTIONS = {
  displayName: 'sync API',
  entityName : 'syncAPI',
  tableName  : 'biz_main_sync_api',
  alias      : 'sapi',

  objectFields: {
    funcCallKwargsJSON  : 'json',
    tagsJSON            : 'json',
    throttlingJSON      : 'json',
    showInDoc           : 'boolean',
    isDisabled          : 'boolean',
    func_argsJSON       : 'json',
    func_kwargsJSON     : 'json',
    func_extraConfigJSON: 'json',
    func_tagsJSON       : 'json',
  },

  defaultOrders: [
    {field: 'sapi.seq', method: 'DESC'},
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
  sql.append('   sapi.*');

  sql.append('  ,func.id              AS func_id');
  sql.append('  ,func.name            AS func_name');
  sql.append('  ,func.title           AS func_title');
  sql.append('  ,func.description     AS func_description');
  sql.append('  ,func.definition      AS func_definition');
  sql.append('  ,func.argsJSON        AS func_argsJSON');
  sql.append('  ,func.kwargsJSON      AS func_kwargsJSON');
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

  sql.append('  ,apia.id    AS apia_id');
  sql.append('  ,apia.title AS apia_title');
  sql.append('  ,apia.type  AS apia_type');

  sql.append('FROM biz_main_sync_api AS sapi');

  sql.append('LEFT JOIN biz_main_func AS func');
  sql.append('  ON func.id = sapi.funcId');

  sql.append('LEFT JOIN biz_main_script AS scpt');
  sql.append('  ON scpt.id = func.scriptId');

  sql.append('LEFT JOIN biz_main_script_set AS sset');
  sql.append('  ON sset.id = func.scriptSetId');

  sql.append('LEFT JOIN biz_main_api_auth AS apia');
  sql.append('  ON apia.id = sapi.apiAuthId');

  options.baseSQL = sql.toString();

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
  if (!data.origin)   data.origin   = (this.locals.user && this.locals.user.isSignedIn) ? 'user'              : 'UNKNOWN';
  if (!data.originId) data.originId = (this.locals.user && this.locals.user.isSignedIn) ? this.locals.user.id : 'UNKNOWN';

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

  if (data.expireTime) {
    data.expireTime = toolkit.getSafeDateTime(data.expireTime);
  }

  if (data.throttlingJSON && 'object' === typeof data.throttlingJSON) {
    data.throttlingJSON = JSON.stringify(data.throttlingJSON);
  }

  return data;
};
