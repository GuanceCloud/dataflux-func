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
  displayName: 'access key',
  entityName : 'accessKey',
  tableName  : 'wat_main_access_key',
  alias      : 'ak',

  userIdField     : 'userId',
  userIdLimitField: null,

  objectFields: {
    webhookEvents   : 'commaArray',
    allowWebhookEcho: 'boolean',
  },

  useCache    : true,
  cacheExpires: 60,
};

exports.createCRUDHandler = function() {
  return modelHelper.createCRUDHandler(EntityModel);
};

exports.createModel = function(req, res) {
  return new EntityModel(req, res);
};

var EntityModel = exports.EntityModel = modelHelper.createSubModel(TABLE_OPTIONS);

EntityModel.prototype.list = function(options, callback) {
  options = options || {};

  var sql = toolkit.createStringBuilder();
  sql.append('SELECT');
  sql.append('   ak.seq');
  sql.append('  ,ak.id');
  sql.append('  ,ak.name');
  sql.append('  ,ak.secret');
  sql.append('  ,ak.webhookURL');
  sql.append('  ,ak.webhookEvents');
  sql.append('  ,ak.allowWebhookEcho');
  sql.append('  ,ak.createTime');
  sql.append('  ,ak.updateTime');

  sql.append('  ,u.id       AS u_id');
  sql.append('  ,u.username AS u_username');
  sql.append('  ,u.name     AS u_name');
  sql.append('  ,u.mobile   AS u_mobile');

  sql.append('FROM wat_main_access_key AS ak');

  sql.append('LEFT JOIN wat_main_user AS u');
  sql.append('  ON u.id = ak.userId');

  options.baseSQL = sql.toString();

  return this._list(options, callback);
};

EntityModel.prototype.add = function(data, callback) {
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

  data.id     = toolkit.strf('{0}-{1}', this.alias, toolkit.genRandString(16));
  data.secret = toolkit.genRandString(32);

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

  if (Array.isArray(data.webhookEvents)) {
    data.webhookEvents = data.webhookEvents.join(',');
  }

  return data;
};
