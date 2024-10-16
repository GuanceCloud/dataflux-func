'use strict';

/* Built-in Modules */

/* 3rd-party Modules */
var async = require('async');

/* Project Modules */
var E           = require('../utils/serverError');
var CONFIG      = require('../utils/yamlResources').get('CONFIG');
var toolkit     = require('../utils/toolkit');
var modelHelper = require('../utils/modelHelper');

/* Init */
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
  'guanceAPIKey',
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

EntityModel.prototype.get = function(id, options, callback) {
  var self = this;

  return self._get(id, options, function(err, dbRes) {
    if (err) return callback(err);

    // 解密/隐藏相关字段
    if (dbRes) {
      if (self.decipher) {
        _doDecipher(id, dbRes.configJSON);
      } else {
        _removeCipherFields(dbRes.configJSON);
      }
    }

    return callback(null, dbRes);
  });
};

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
      if (self.decipher) {
        _doDecipher(d.id, d.configJSON);
      } else {
        _removeCipherFields(d.configJSON);
      }
    });

    return callback(null, dbRes, pageInfo);
  });
};

EntityModel.prototype.add = function(data, callback) {
  // ID 由用户指定，无需生成
  _doCipher(data.id, data.configJSON);

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
  _doCipher(id, data.configJSON);

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

function _doCipher(id, configJSON) {
  if (toolkit.isNothing(configJSON)) return configJSON;

  CIPHER_CONFIG_FIELDS.forEach(function(f) {
    var fCipher = toolkit.strf('{0}Cipher', f);

    if (configJSON[f]) {
      var salt = id;
      configJSON[fCipher] = toolkit.cipherByAES(configJSON[f], CONFIG.SECRET, salt);
      delete configJSON[f];
    }
  });

  return configJSON;
};

function _doDecipher(id, configJSON) {
  if (toolkit.isNothing(configJSON)) return configJSON;

  CIPHER_CONFIG_FIELDS.forEach(function(f) {
    var fCipher = toolkit.strf('{0}Cipher', f);

    if (configJSON[fCipher]) {
      try {
        var salt = id;
        configJSON[f] = toolkit.decipherByAES(configJSON[fCipher], CONFIG.SECRET, salt);
      } catch(err) {
        configJSON[f] = '';
      }
    }
  });

  _removeCipherFields(configJSON);

  return configJSON;
};

function _removeCipherFields(configJSON) {
  if (toolkit.isNothing(configJSON)) return configJSON;

  CIPHER_CONFIG_FIELDS.forEach(function(f) {
    var fCipher = toolkit.strf('{0}Cipher', f);
    delete configJSON[fCipher];
  });
  return configJSON;
};

function _prepareData(data) {
  data = toolkit.jsonCopy(data);

  if (data.configJSON && 'object' === typeof data.configJSON) {
    data.configJSON = JSON.stringify(data.configJSON);
  }

  if ('boolean' === typeof data.isPinned) {
    data.pinTime = data.isPinned ? new Date() : null;
    delete data.isPinned;
  }

  return data;
};
