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

/* Configure */
var TABLE_OPTIONS = exports.TABLE_OPTIONS = {
  displayName: 'file service',
  entityName : 'fileService',
  tableName  : 'biz_main_file_service',
  alias      : 'fsvc',

  objectFields: {
    isDisabled: 'boolean',
  },

  defaultOrders: [
    {field: 'fsvc.seq', method: 'DESC'},
  ],
};

exports.createCRUDHandler = function() {
  return modelHelper.createCRUDHandler(EntityModel);
};

exports.createModel = function(locals) {
  return new EntityModel(locals);
};

var EntityModel = exports.EntityModel = modelHelper.createSubModel(TABLE_OPTIONS);

EntityModel.prototype.genDataId = function() {
  return toolkit.strf('{0}-{1}', this.alias, shortid.generate());
};

EntityModel.prototype.list = function(options, callback) {
  options = options || {};

  var sql = toolkit.createStringBuilder();
  sql.append('SELECT');
  sql.append('   fsvc.*');

  sql.append('FROM biz_main_file_service AS fsvc');

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

  if ('root' in data) {
    if (toolkit.startsWith(data.root, '/')) {
      data.root = data.root.slice(1);
    }
    if (!toolkit.endsWith(data.root, '/')) {
      data.root = data.root + '/';
    }
  }

  return data;
};
