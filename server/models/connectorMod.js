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
  displayName: 'connector',
  entityName : 'connector',
  tableName  : 'biz_main_connector',
  alias      : 'cnct',

  objectFields: {
    configJSON: 'json',
    isBuiltin : 'boolean',
    isPinned  : 'boolean',
  },

  defaultOrders: [
    {field: 'cnct.pinTime',   method: 'DESC'},
    {field: 'cnct.isBuiltin', method: 'DESC'},
    {field: 'cnct.seq',       method: 'ASC' },
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
  var self = this;
  options = options || {};

  var sql = toolkit.createStringBuilder();
  sql.append('SELECT');
  sql.append('   cnct.*');
  sql.append('  ,NOT ISNULL(cnct.pinTime) AS isPinned');

  sql.append('FROM biz_main_connector AS cnct');

  options.baseSQL = sql.toString();

  return self._list(options, function(err, dbRes, pageInfo) {
    if (err) return callback(err);

    // 解密/隐藏相关字段
    dbRes.forEach(function(d) {
      CIPHER_CONFIG_FIELDS.forEach(function(f) {
        var fCipher = toolkit.strf('{0}Cipher', f);

        if (self.decipher && d.configJSON[fCipher]) {
          try {
            d.configJSON[f] = toolkit.decipherByAES(d.configJSON[fCipher], CONFIG.SECRET);
          } catch(err) {
            d.configJSON[f] = '';
          }
        }

        delete d.configJSON[fCipher];
      });
    });


    return callback(null, dbRes, pageInfo);
  });
};

EntityModel.prototype.add = function(data, callback) {
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

  if ('boolean' === typeof data.isPinned) {
    data.pinTime = data.isPinned ? new Date() : null;
    delete data.isPinned;
  }

  return data;
};
