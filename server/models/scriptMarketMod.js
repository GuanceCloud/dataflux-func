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
    configJSON: 'json',
    isLocked  : 'boolean',
    isPinned  : 'boolean',
  },

  defaultOrders: [
    {field: 'smkt.pinTime', method: 'DESC'},
    {field: 'smkt.seq',     method: 'ASC' },
  ],
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

EntityModel.prototype.get = function(id, options, callback) {
  var self = this;

  return self._get(id, options, function(err, dbRes) {
    if (err) return callback(err);

    // 解密/隐藏相关字段
    if (dbRes) {
      if (self.decipher) {
        _doDecipher(dbRes.configJSON);
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
  sql.append('   smkt.*');
  sql.append('  ,NOT ISNULL(smkt.pinTime) AS isPinned');
  sql.append('  ,locker.username          AS lockedByUserUsername');
  sql.append('  ,locker.name              AS lockedByUserName');

  sql.append('FROM biz_main_script_market AS smkt');

  sql.append('LEFT JOIN wat_main_user AS locker');
  sql.append('  ON locker.id = smkt.lockedByUserId');

  options.baseSQL = sql.toString();

  return self._list(options, function(err, dbRes, pageInfo) {
    if (err) return callback(err);

    // 解密/隐藏相关字段
    dbRes.forEach(function(d) {
      if (self.decipher) {
        _doDecipher(d.configJSON);
      } else {
        _removeCipherFields(d.configJSON);
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

function _doCipher(configJSON) {
  if (toolkit.isNothing(configJSON)) return configJSON;

  CIPHER_CONFIG_FIELDS.forEach(function(f) {
    var fCipher = toolkit.strf('{0}Cipher', f);

    if (configJSON[f]) {
      configJSON[fCipher] = toolkit.cipherByAES(configJSON[f], CONFIG.SECRET);
      delete configJSON[f];
    }
  });

  return configJSON;
};

function _doDecipher(configJSON) {
  if (toolkit.isNothing(configJSON)) return configJSON;

  CIPHER_CONFIG_FIELDS.forEach(function(f) {
    var fCipher = toolkit.strf('{0}Cipher', f);

    if (configJSON[fCipher]) {
      try {
        configJSON[f] = toolkit.decipherByAES(configJSON[fCipher], CONFIG.SECRET);
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
    _doCipher(data.configJSON);

    ['url', 'endpoint', 'folder'].forEach(function(f) {
      if (data.configJSON[f]) {
        data.configJSON[f] = data.configJSON[f].replace(/\/*$/g, '').replace(/^\/*/g, '');
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
