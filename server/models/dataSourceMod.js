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
  displayName: 'data source',
  entityName : 'dataSource',
  tableName  : 'biz_main_data_source',
  alias      : 'dsrc',

  objectFields: {
    configJSON: 'json',
    isBuiltin : 'boolean',
  },

  defaultOrders: [
    {field: 'dsrc.isBuiltin', method: 'DESC'},
    {field: 'dsrc.seq', method: 'ASC'},
  ],
};

var CIPHER_CONFIG_FIELDS = exports.CIPHER_CONFIG_FIELDS = [
  'password',
  'secretKey',
];

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
  sql.append('   dsrc.*');

  sql.append('FROM biz_main_data_source AS dsrc');

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
      return callback(new E('EClientBadRequest', 'Invalid request post data.', {
        error: err.toString(),
      }));
    }
  }

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
      return callback(new E('EClientBadRequest', 'Invalid request post data.', {
        error: err.toString(),
      }));
    }
  }

  return this._modify(id, data, callback);
};

function _prepareData(data) {
  data = toolkit.jsonCopy(data);

  if (data.configJSON && 'object' === typeof data.configJSON) {
    CIPHER_CONFIG_FIELDS.forEach(function(f) {
      var fCipher = toolkit.strf('{0}Cipher', f);

      if (data.configJSON[f]) {
        data.configJSON[fCipher] = toolkit.cipherByAES(data.configJSON[f], CONFIG.SECRET);
        delete data.configJSON[f];
      }
    });

    data.configJSON = JSON.stringify(data.configJSON);
  }

  return data;
};
