'use strict';

/* Builtin Modules */

/* 3rd-party Modules */
var async   = require('async');
var shortid = require('shortid');

/* Project Modules */
var E           = require('../utils/serverError');
var CONFIG      = require('../utils/yamlResources').get('CONFIG');
var toolkit     = require('../utils/toolkit');
var modelHelper = require('../utils/modelHelper');

var funcMod = require('./funcMod');

/* Configure */
var TABLE_OPTIONS = exports.TABLE_OPTIONS = {
  displayName: 'auth link',
  entityName : 'authLink',
  tableName  : 'biz_main_auth_link',
  alias      : 'auln',

  objectFields: {
    funcCallKwargsJSON  : 'json',
    throttlingJSON      : 'json',
    showInDoc           : 'boolean',
    isDisabled          : 'boolean',
    func_argsJSON       : 'json',
    func_kwargsJSON     : 'json',
    func_extraConfigJSON: 'json',
    func_tagsJSON       : 'json',
  },

  defaultOrders: [
    {field: 'auln.seq', method: 'DESC'},
  ],
};

exports.createCRUDHandler = function() {
  return modelHelper.createCRUDHandler(EntityModel);
};

exports.createModel = function(req, res) {
  return new EntityModel(req, res);
};

var EntityModel = exports.EntityModel = modelHelper.createSubModel(TABLE_OPTIONS);

EntityModel.prototype.genDataId = function() {
  return toolkit.strf('{0}-{1}', this.alias, shortid.generate());
};

EntityModel.prototype.list = function(options, callback) {
  options = options || {};

  var sql = toolkit.createStringBuilder();
  sql.append('SELECT');
  sql.append('   auln.*');

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

  sql.append('  ,scpt.title          AS scpt_title');
  sql.append('  ,scpt.description    AS scpt_description');
  sql.append('  ,scpt.publishVersion AS scpt_publishVersion');

  sql.append('  ,sset.title       AS sset_title');
  sql.append('  ,sset.description AS sset_description');

  sql.append('FROM biz_main_auth_link AS auln');

  sql.append('LEFT JOIN biz_main_func AS func');
  sql.append('  ON func.id = auln.funcId');

  sql.append('LEFT JOIN biz_main_script AS scpt');
  sql.append('  ON scpt.id = func.scriptId');

  sql.append('LEFT JOIN biz_main_script_set AS sset');
  sql.append('  ON sset.id = func.scriptSetId');

  options.baseSQL = sql.toString();

  this._list(options, function(err, dbRes, pageInfo) {
    if (err) return callback(err);

    // [兼容] 补全`argsJSON`,`kwargsJSON`
    dbRes.forEach(function(d) {
      if (d.func_argsJSON && d.func_kwargsJSON) return;

      var parsedFuncArgs = funcMod.parseFuncArgs(d.definition);
      d.func_argsJSON   = d.func_argsJSON   || parsedFuncArgs.args;
      d.func_kwargsJSON = d.func_kwargsJSON || parsedFuncArgs.kwargs;
    });

    return callback(null, dbRes, pageInfo);
  });
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
      return callback(new E('EClientBadRequest', 'Invalid request post data.'));
    }
  }

  // 自动记录操作界面
  data.origin = this.req.get('X-Dff-Origin') === 'DFF-UI' ? 'UI' : 'API';

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
      return callback(new E('EClientBadRequest', 'Invalid request post data.'));
    }
  }

  return this._modify(id, data, callback);
};

function _prepareData(data) {
  data = toolkit.jsonCopy(data);

  if ('funcCallKwargsJSON' in data) {
    if (data.funcCallKwargsJSON && 'object' === typeof data.funcCallKwargsJSON) {
      data.funcCallKwargsJSON = JSON.stringify(data.funcCallKwargsJSON);
    } else {
      data.funcCallKwargsJSON = '{}';
    }
  }

  if (data.expireTime) {
    data.expireTime = new Date(data.expireTime);
  }

  if (data.throttlingJSON && 'object' === typeof data.throttlingJSON) {
    data.throttlingJSON = JSON.stringify(data.throttlingJSON);
  }

  return data;
};
