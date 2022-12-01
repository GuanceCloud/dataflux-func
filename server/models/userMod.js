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
  displayName: 'user',
  entityName : 'user',
  tableName  : 'wat_main_user',
  alias      : 'u',

  objectFields: {
    markers         : 'commaArray',
    roles           : 'commaArray',
    customPrivileges: 'commaArray',
    isDisabled      : 'boolean',
  },
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
  sql.append('   u.seq');
  sql.append('  ,u.id');
  sql.append('  ,u.username');
  sql.append('  ,u.name');
  sql.append('  ,u.email');
  sql.append('  ,u.mobile');
  sql.append('  ,u.markers');
  sql.append('  ,u.roles');
  sql.append('  ,u.customPrivileges');
  sql.append('  ,u.isDisabled');
  sql.append('  ,u.createTime');
  sql.append('  ,u.updateTime');

  sql.append('FROM wat_main_user AS u');

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
      return callback(new E('EClientBadRequest', 'Invalid request post data', {
        error: err.toString(),
      }));
    }
  }

  data.id = this.genDataId();

  // Create passwordHash
  data.passwordHash = toolkit.getSaltedPasswordHash(
      data.id, data.password, CONFIG.SECRET);
  delete data.password;

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

  if (toolkit.notNothing(data.password)) {
    // Get new password hash when changing password
    data.passwordHash = toolkit.getSaltedPasswordHash(
        id, data.password, CONFIG.SECRET);
    delete data.password;
  }

  return this._modify(id, data, callback);
};

function _prepareData(data) {
  data = toolkit.jsonCopy(data);

  if (Array.isArray(data.markers)) {
    data.markers = data.markers.join(',');
  }

  if (Array.isArray(data.roles)) {
    data.roles = data.roles.join(',');
  }

  if (Array.isArray(data.customPrivileges)) {
    data.customPrivileges = data.customPrivileges.join(',');
  }

  return data;
};
