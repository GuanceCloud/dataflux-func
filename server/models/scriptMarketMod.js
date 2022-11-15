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
  displayName: 'script market',
  entityName : 'scriptMarket',
  tableName  : 'biz_main_script_market',
  alias      : 'smkt',

  objectFields: {
    authJSON: 'json',
  }
};

var CIPHER_CONFIG_FIELDS = exports.CIPHER_CONFIG_FIELDS = [
  'password',
  'accessKeySecret',
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
  sql.append('   smkt.*');

  sql.append('FROM biz_main_script_market AS smkt');

  options.baseSQL = sql.toString();

  return self._list(options, function(err, dbRes, pageInfo) {
    if (err) return callback(err);

    // 解密/隐藏相关字段
    dbRes.forEach(function(d) {
      if (self.decipher) {
        _doDecipher(d.authJSON);
      } else {
        _removeCipherFields(d.authJSON);
      }
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

function _doCipher(authJSON) {
  if (toolkit.isNothing(authJSON)) return authJSON;

  CIPHER_CONFIG_FIELDS.forEach(function(f) {
    var fCipher = toolkit.strf('{0}Cipher', f);

    if (authJSON[f]) {
      authJSON[fCipher] = toolkit.cipherByAES(authJSON[f], CONFIG.SECRET);
      delete authJSON[f];
    }
  });

  return authJSON;
};

function _doDecipher(authJSON) {
  if (toolkit.isNothing(authJSON)) return authJSON;

  CIPHER_CONFIG_FIELDS.forEach(function(f) {
    var fCipher = toolkit.strf('{0}Cipher', f);

    if (authJSON[fCipher]) {
      try {
        authJSON[f] = toolkit.decipherByAES(authJSON[fCipher], CONFIG.SECRET);
      } catch(err) {
        authJSON[f] = '';
      }
    }
  });

  _removeCipherFields(authJSON);

  return authJSON;
};

function _removeCipherFields(authJSON) {
  if (toolkit.isNothing(authJSON)) return authJSON;

  CIPHER_CONFIG_FIELDS.forEach(function(f) {
    var fCipher = toolkit.strf('{0}Cipher', f);
    delete authJSON[fCipher];
  });
  return authJSON;
};

function _prepareData(data) {
  data = toolkit.jsonCopy(data);

  if (data.authJSON && 'object' === typeof data.authJSON) {
    _doCipher(data.authJSON);
    data.authJSON = JSON.stringify(data.authJSON);
  }

  return data;
};