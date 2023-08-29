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
  displayName: 'script publish history',
  entityName : 'scriptPublishHistory',
  tableName  : 'biz_main_script_publish_history',
  alias      : 'scph',
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
  sql.append('   scph.seq');
  sql.append('  ,scph.id');
  sql.append('  ,scph.scriptSetId');
  sql.append('  ,scph.scriptId');
  sql.append('  ,scph.scriptPublishVersion');
  sql.append('  ,scph.note');
  sql.append('  ,scph.createTime');
  sql.append('  ,scph.updateTime');

  sql.append('  ,scpt.id          AS scpt_id');
  sql.append('  ,scpt.title       AS scpt_title');
  sql.append('  ,scpt.description AS scpt_description');

  sql.append('  ,sset.title       AS sset_title');
  sql.append('  ,sset.description AS sset_description');

  sql.append('FROM biz_main_script_publish_history AS scph');

  sql.append('LEFT JOIN biz_main_script AS scpt');
  sql.append('  ON scpt.id = scph.scriptId');

  sql.append('LEFT JOIN biz_main_script_set AS sset');
  sql.append('  ON sset.id = scph.scriptSetId');

  options.baseSQL = sql.toString();

  return this._list(options, callback);
};
