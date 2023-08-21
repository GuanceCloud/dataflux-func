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
  displayName: 'script',
  entityName : 'script',
  tableName  : 'biz_main_script',
  alias      : 'scpt',

  objectFields: {
    isLocked: 'boolean',
    codeSize: 'integer',
  },

  defaultOrders: [
    {field: 'sset.id', method: 'ASC'},
    {field: 'scpt.id', method: 'ASC'},
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
  options.extra = options.extra || {};

  var sql = toolkit.createStringBuilder();
  sql.append('SELECT');
  sql.append('   scpt.seq');
  sql.append('  ,scpt.id');
  sql.append('  ,scpt.scriptSetId');
  sql.append('  ,scpt.title');
  sql.append('  ,scpt.description');
  sql.append('  ,scpt.publishVersion');
  sql.append('  ,scpt.type');
  sql.append('  ,scpt.codeMD5');
  sql.append('  ,scpt.codeDraftMD5');
  sql.append('  ,scpt.lockedByUserId');
  sql.append('  ,scpt.createTime');
  sql.append('  ,scpt.updateTime');
  sql.append('  ,scptLocker.username AS lockedByUserUsername');
  sql.append('  ,scptLocker.name     AS lockedByUserName');

  sql.append('  ,sset.id             AS sset_id');
  sql.append('  ,sset.title          AS sset_title');
  sql.append('  ,sset.description    AS sset_description');
  sql.append('  ,sset.origin         AS sset_origin');
  sql.append('  ,sset.originId       AS sset_originId');
  sql.append('  ,sset.lockedByUserId AS sset_lockedByUserId');
  sql.append('  ,ssetLocker.username AS sset_lockedByUserUsername');
  sql.append('  ,ssetLocker.name     AS sset_lockedByUserName');

  if (options.extra.withCode)      sql.append(',scpt.code');
  if (options.extra.withCodeDraft) sql.append(',scpt.codeDraft');

  sql.append('FROM biz_main_script AS scpt');

  sql.append('LEFT JOIN biz_main_script_set AS sset');
  sql.append('  ON sset.id = scpt.scriptSetId');

  sql.append('LEFT JOIN wat_main_user as scptLocker')
  sql.append('  ON scptLocker.id = scpt.lockedByUserId')

  sql.append('LEFT JOIN wat_main_user as ssetLocker')
  sql.append('  ON ssetLocker.id = sset.lockedByUserId')

  options.baseSQL = sql.toString();

  return this._list(options, callback);
};

EntityModel.prototype.overview = function(options, callback) {
  var self = this;

  var sql = toolkit.createStringBuilder();
  sql.append('SELECT');
  sql.append('   scpt.seq');
  sql.append('  ,scpt.id');
  sql.append('  ,scpt.title');
  sql.append('  ,scpt.scriptSetId');
  sql.append('  ,scpt.publishVersion');
  sql.append('  ,scpt.codeMD5');
  sql.append('  ,scpt.codeDraftMD5');
  sql.append('  ,LENGTH(scpt.code) AS codeSize');
  sql.append('  ,scpt.createTime');
  sql.append('  ,scpt.updateTime');

  sql.append('  ,sset.title    AS scriptSetTitle');
  sql.append('  ,sset.origin   AS scriptSetOrigin');
  sql.append('  ,sset.originId AS scriptSetOriginId');

  sql.append('  ,MAX(scph.createTime) AS latestPublishTime');
  sql.append('  ,COUNT(func.id)       AS funcCount');

  sql.append('FROM biz_main_script AS scpt');

  sql.append('LEFT JOIN biz_main_script_set AS sset');
  sql.append('  ON sset.id = scpt.scriptSetId');

  sql.append('LEFT JOIN biz_main_script_publish_history as scph');
  sql.append('  ON  scph.scriptId             = scpt.id');
  sql.append('  AND scph.scriptPublishVersion = scpt.publishVersion');

  sql.append('LEFT JOIN biz_main_func as func');
  sql.append('  ON func.scriptId = scpt.id');

  sql.append('GROUP BY');
  sql.append('  scpt.id');

  sql.append('ORDER BY');
  sql.append('   sset.id ASC');
  sql.append('  ,scpt.id ASC');

  self.db.query(sql, null, function(err, dbRes) {
    if (err) return callback(err);

    dbRes = self.convertObject(dbRes);

    return callback(null, dbRes);
  });
};

EntityModel.prototype.add = function(data, callback) {
  // 自动填入脚本集 ID
  data.scriptSetId = data.id.split('__')[0];

  // 保证空代码为空字符串
  data.code = data.code || '';

  // 自动填入示例代码
  data.codeDraft = toolkit.isNullOrUndefined(data.codeDraft)
                 ? CONFIG._SAMPLE_SCRIPT
                 : data.codeDraft;

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

EntityModel.prototype.delete = function(id, callback) {
  var self = this;

  var retId = id;

  var transScope = modelHelper.createTransScope(self.db);
  async.series([
    function(asyncCallback) {
      transScope.start(asyncCallback);
    },
    // 数据入库
    function(asyncCallback) {
      self._delete(id, asyncCallback);
    },
    // 删除相关数据
    function(asyncCallback) {
      var sql = toolkit.createStringBuilder();
      sql.append('DELETE FROM ??');
      sql.append('WHERE');
      sql.append('  scriptId = ?');

      var tables = [
        'biz_main_func',
      ];
      async.eachSeries(tables, function(table, eachCallback) {
        var sqlParams = [table, id];

        self.db.query(sql, sqlParams, eachCallback);
      }, asyncCallback);
    },
  ], function(err) {
    transScope.end(err, function(scopeErr) {
      if (scopeErr) return callback(scopeErr);

      return callback(null, retId);
    });
  });
};

function _prepareData(data) {
  data = toolkit.jsonCopy(data);

  if ('undefined' !== typeof data.code) {
    data.code = data.code.replace(/\t/g, ' '.repeat(4));
    data.codeMD5 = toolkit.getMD5(data.code);
  }
  if ('undefined' !== typeof data.codeDraft) {
    data.codeDraft = data.codeDraft.replace(/\t/g, ' '.repeat(4));
    data.codeDraftMD5 = toolkit.getMD5(data.codeDraft);
  }

  return data;
};
