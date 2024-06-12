'use strict';

/* Built-in Modules */

/* 3rd-party Modules */
var fs = require('fs-extra');

/* Project Modules */
var E           = require('../utils/serverError');
var CONFIG      = require('../utils/yamlResources').get('CONFIG');
var toolkit     = require('../utils/toolkit');
var modelHelper = require('../utils/modelHelper');

/* Init */
var TABLE_OPTIONS = exports.TABLE_OPTIONS = {
  displayName: 'Blueprint',
  entityName : 'blueprint',
  tableName  : 'biz_main_blueprint',
  alias      : 'blpt',

  objectFields: {
    canvasJSON: 'json',
    isDeployed: 'boolean',
  },

  defaultOrders: [
    {field: 'blpt.seq', method: 'ASC'},
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
  sql.append('    blpt.seq');
  sql.append('   ,blpt.id');
  sql.append('   ,blpt.title');
  sql.append('   ,blpt.description');
  sql.append('   ,blpt.createTime');
  sql.append('   ,blpt.updateTime');

  if (options.extra.withCanvas) {
    sql.append(',blpt.canvasJSON');
    sql.append(',blpt.viewJSON');
  }

  sql.append('FROM biz_main_blueprint AS blpt');

  options.baseSQL = sql.toString();

  return this._list(options, callback);
};

EntityModel.prototype.add = function(data, callback) {
  // 自动填入基础数据
  data.canvasJSON = toolkit.isNullOrUndefined(data.canvasJSON)
                 ? JSON.parse(fs.readFileSync('blueprint-example.json'))
                 : data.canvasJSON;

  data.viewJSON = {};

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

  if (data.canvasJSON && 'object' === typeof data.canvasJSON) {
    data.canvasJSON = JSON.stringify(data.canvasJSON);
  }

  if (data.viewJSON && 'object' === typeof data.viewJSON) {
    data.viewJSON = JSON.stringify(data.viewJSON);
  }

  return data;
};
