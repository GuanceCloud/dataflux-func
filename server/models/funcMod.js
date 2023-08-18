'use strict';

/* Built-in Modules */

/* 3rd-party Modules */
var async = require('async');

/* Project Modules */
var E           = require('../utils/serverError');
var CONFIG      = require('../utils/yamlResources').get('CONFIG');
var toolkit     = require('../utils/toolkit');
var modelHelper = require('../utils/modelHelper');
var urlFor      = require('../utils/routeLoader').urlFor;

/* Configure */
var TABLE_OPTIONS = exports.TABLE_OPTIONS = {
  displayName: 'func',
  entityName : 'func',
  tableName  : 'biz_main_func',
  alias      : 'func',

  objectFields: {
    argsJSON       : 'json',
    kwargsJSON     : 'json',
    extraConfigJSON: 'json',
    tagsJSON       : 'json',
    dataJSON       : 'json',
  },

  defaultOrders: [
    {field: 'scpt.id',       method: 'ASC'},
    {field: 'func.defOrder', method: 'ASC'},
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
  var self = this;

  options = options || {};
  options.extra = options.extra || {};

  if (options.extra.asFuncDoc) {
    options.filters = options.filters;
    options.filters['func.extraConfigJSON->>$.isHidden'] = { isnull: true };
  }

  var sql = toolkit.createStringBuilder();
  sql.append('SELECT');
  sql.append('   func.*');

  sql.append('  ,scpt.id             AS scpt_id');
  sql.append('  ,scpt.title          AS scpt_title');
  sql.append('  ,scpt.description    AS scpt_description');
  sql.append('  ,scpt.codeMD5        AS scpt_codeMD5');
  sql.append('  ,scpt.publishVersion AS scpt_publishVersion');

  sql.append('  ,sset.id          AS sset_id');
  sql.append('  ,sset.title       AS sset_title');
  sql.append('  ,sset.description AS sset_description');
  sql.append('  ,sset.origin      AS sset_origin');
  sql.append('  ,sset.originId    AS sset_originId');

  sql.append('FROM biz_main_func AS func');

  sql.append('LEFT JOIN biz_main_script AS scpt');
  sql.append('  ON scpt.id = func.scriptId');

  sql.append('LEFT JOIN biz_main_script_set AS sset');
  sql.append('  ON sset.id = func.scriptSetId');

  options.baseSQL = sql.toString();

  return this._list(options, function(err, dbRes, pageInfo) {
    if (err) return callback(err);

    // 数据补全
    dbRes.forEach(function(d) {
      // 无函数定义不需要补全
      if (!d.definition) return;

      // 已存在不需要补全
      if (!d.argsJSON || !d.kwargsJSON) return;

      // 补全`argsJSON`,`kwargsJSON`
      var parsedFuncArgs = parseFuncArgs(d.definition);
      d.argsJSON   = d.argsJSON   || parsedFuncArgs.args;
      d.kwargsJSON = d.kwargsJSON || parsedFuncArgs.kwargs;

      // 补全`extraConfigJSON`
      d.extraConfigJSON = d.extraConfigJSON || {};
    });

    // 转换格式
    let funcDoc = null;
    if (options.extra.asFuncDoc) {
      funcDoc = [];
      dbRes.forEach(function(d) {
        funcDoc.push({
          url: urlFor('indexAPI.callFunc', {
            params: { funcId: d.id },
          }),

          id                  : d.id,
          name                : d.name,
          title               : d.title,
          description         : d.description,
          definition          : d.definition,
          argsJSON            : d.argsJSON,
          kwargsJSON          : d.kwargsJSON,
          extraConfigJSON     : d.extraConfigJSON,
          category            : d.category,
          integration         : d.integration,
          tagsJSON            : d.tagsJSON,
          scriptId            : d.scpt_id,
          scriptTitle         : d.scpt_title,
          scriptDescription   : d.scpt_description,
          scriptSetId         : d.sset_id,
          scriptSetTitle      : d.sset_title,
          scriptSetDescription: d.sset_description,
        });
      });
    }

    return callback(null, funcDoc || dbRes, pageInfo);
  });
};

EntityModel.prototype.update = function(scriptId, apiFuncs, callback) {
  var self = this;

  var scriptSetId = scriptId.split('__')[0];
  apiFuncs = toolkit.asArray(apiFuncs);

  var transScope = modelHelper.createTransScope(self.db);
  async.series([
    function(asyncCallback) {
      transScope.start(asyncCallback);
    },
    function(asyncCallback) {
      var sql = toolkit.createStringBuilder();
      sql.append('DELETE FROM biz_main_func');
      sql.append('WHERE');
      sql.append('  scriptId = ?');

      var sqlParams = [scriptId];
      self.db.query(sql, sqlParams, asyncCallback);
    },
    function(asyncCallback) {
      if (toolkit.isNothing(apiFuncs)) return asyncCallback();

      var _data = [];
      apiFuncs.forEach(function(d) {
        var argsJSON = null;
        if (d.args && 'string' !== typeof d.args) {
          argsJSON = JSON.stringify(d.args);
        }

        var kwargsJSON = null;
        if (d.kwargs && 'string' !== typeof d.kwargs) {
          kwargsJSON = JSON.stringify(d.kwargs);
        }

        var extraConfigJSON = {};
        if (d.extraConfig && 'string' !== typeof d.extraConfig) {
          extraConfigJSON = JSON.stringify(d.extraConfig);
        }
        var tagsJSON = null;
        if (d.tags && 'string' !== typeof d.tags) {
          tagsJSON = JSON.stringify(d.tags);
        }

        var dataId = toolkit.strf('{0}.{1}', scriptId, d.name);
        _data.push([
          dataId,          // id
          scriptSetId,     // scriptSetId
          scriptId,        // scriptId
          d.name,          // name
          d.title,         // title
          d.description,   // description
          d.definition,    // definition
          argsJSON,        // argsJSON
          kwargsJSON,      // kwargsJSON
          extraConfigJSON, // extraConfigJSON
          d.category,      // category
          d.integration,   // integration
          tagsJSON,        // tagsJSON
          d.defOrder,      // defOrder
        ])
      });

      var sql = toolkit.createStringBuilder();
      sql.append('INSERT INTO biz_main_func');
      sql.append('(');
      sql.append('   id');
      sql.append('  ,scriptSetId');
      sql.append('  ,scriptId');
      sql.append('  ,name');
      sql.append('  ,title');
      sql.append('  ,description');
      sql.append('  ,definition');
      sql.append('  ,argsJSON');
      sql.append('  ,kwargsJSON');
      sql.append('  ,extraConfigJSON');
      sql.append('  ,category');
      sql.append('  ,integration');
      sql.append('  ,tagsJSON');
      sql.append('  ,defOrder');
      sql.append(')');
      sql.append('VALUES');
      sql.append('  ?');

      var sqlParams = [_data];
      self.db.query(sql, sqlParams, asyncCallback);
    },
  ], function(err) {
    transScope.end(err, function(scopeErr) {
      if (scopeErr) return callback(scopeErr);

      // 清除函数名缓存
      var cacheKeyPattern = toolkit.getCacheKey('cache', 'integrationFuncId', [ '*' ]);
      self.cacheDB.delByPattern(cacheKeyPattern, callback);
    });
  });
};

var parseFuncArgs = exports.parseFuncArgs = function(funcDefinition) {
  var args       = [];
  var argsJSON   = '[]';
  var kwargs     = {};
  var kwargsJSON = '{}';

  try {
    if (funcDefinition) {
      funcDefinition
      .replace(/\w+\(/g, '')
      .replace(/\)$/g, '')
      .split(',')
      .forEach(function(s) {
        var k = s.trim().split('=')[0];
        if (!k) return;

        args.push(k);
        kwargs[k] = null;
      });
    }

    argsJSON   = JSON.stringify(args);
    kwargsJSON = JSON.stringify(kwargs);

  } catch(err) {
    // 容许出错
  }

  var parsedFuncArgs = {
    args      : args,
    argsJSON  : argsJSON,
    kwargs    : kwargs,
    kwargsJSON: kwargsJSON,
  }
  return parsedFuncArgs;
};
