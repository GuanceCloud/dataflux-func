'use strict';

/* Builtin Modules */

/* 3rd-party Modules */
var sortedJSON = require('sorted-json');

/* Project Modules */
var E           = require('./serverError');
var CONFIG      = require('./yamlResources').get('CONFIG');
var toolkit     = require('./toolkit');

var common = exports;

var SCRIPT_TYPE_EXT_MAP = {
  python  : 'py',
  markdown: 'md',
};

var SCRIPT_SET_MD5_FIELDS = [
  'id',
  'title',
  'description',
  'requirements',
];
var SCRIPT_MD5_FIELDS = [
  'id',
  'title',
  'description',
  'type',
  'codeMD5',
];

var IMPORT_DATA_KEYS_WITH_ORIGIN = [
  'scriptSets',
  'authLinks',
  'crontabConfigs',
  'batches',
];

common.getExportUser = function(locals) {
  var exportUser = `${locals.user.username || 'ANONYMOUS'}`;
  if (locals.user.name) {
    exportUser = `${locals.user.name || 'ANONYMOUS'} (${locals.user.username || 'ANONYMOUS'})`;
  }
  return exportUser;
};

common.getScriptFilename = function(script) {
  var filename = script.id.split('__').slice(1).join('__');
  var fileExt = SCRIPT_TYPE_EXT_MAP[script.type];
  if (fileExt) filename += '.' + fileExt;

  return filename;
};

common.flattenImportExportData = function(data) {
  if ('string' === typeof data) {
    data = JSON.parse(data);
  }

  data.scriptSets = data.scriptSets || [];
  data.scripts    = data.scripts    || [];
  data.funcs      = data.funcs      || [];

  // 展开脚本数据
  data.scriptSets.forEach(function(scriptSet) {
    var _scripts = scriptSet.scripts;
    delete scriptSet.scripts;

    if (toolkit.isNothing(_scripts)) return;

    _scripts.forEach(function(script) {
      script.scriptSetId = scriptSet.id;

      script.code    = script.code    || '';                         // 保证code字段不为NULL
      script.codeMD5 = script.codeMD5 || toolkit.getMD5(script.code) // 计算MD5值

      if (script.codeDraft) {
        script.codeDraft    = script.codeDraft || '';                              // 保证codeDraft字段不为NULL
        script.codeDraftMD5 = script.codeDraft || toolkit.getMD5(script.codeDraft) // 计算MD5值
      } else {
        script.codeDraft    = script.code;
        script.codeDraftMD5 = script.codeMD5;
      }

      data.scripts.push(script);
    });
  });

  // 展开函数数据
  data.scripts.forEach(function(script) {
    var _funcs = script.funcs;
    delete script.funcs;

    if (toolkit.isNothing(_funcs)) return;

    _funcs.forEach(function(func) {
      func.scriptId    = script.id;
      func.scriptSetId = script.scriptSetId;

      data.funcs.push(func);
    });
  });

  return data;
};

function _getScriptSetMD5Fields(fields, tableAlias) {
  fields = toolkit.jsonCopy(fields);
  if (tableAlias) {
    fields = fields.map(function(f) {
      return `${tableAlias}.${f}`;
    });
  }

  return fields;
};

common.getScriptSetMD5Fields = function(tableAlias) {
  return _getScriptSetMD5Fields(SCRIPT_SET_MD5_FIELDS, tableAlias);
};

common.getScriptMD5Fields = function(tableAlias) {
  return _getScriptSetMD5Fields(SCRIPT_MD5_FIELDS, tableAlias);
};

common.getScriptSetMD5 = function(scriptSet, scripts) {
  var dataToMD5 = {
    scriptSet: {},
    scripts  : [],
  }

  // 脚本集字段
  common.getScriptSetMD5Fields().forEach(function(f) {
    if (!(f in scriptSet)) throw new Error(`Lack of Script Set field to compute Script Set MD5: ${f}`);

    dataToMD5[f] = scriptSet[f];
  });

  // 脚本字段
  if (toolkit.notNothing(scripts)) {
    scripts.forEach(function(script) {
      var _script = {};

      common.getScriptMD5Fields().forEach(function(f) {
        if (!(f in script)) throw new Error(`Lack of Script field to compute Script Set MD5: ${f}`);

        _script[f] = script[f];
      });

      dataToMD5.scripts.push(_script);
    });

    dataToMD5.scripts.sort(function compareFn(a, b) {
      if (a.id < b.id)      return -1;
      else if (a.id > b.id) return 1;
      else                  return 0;
    });
  }

  var strToMD5 = sortedJSON.sortify(dataToMD5, { stringify: true, sortArray: false});
  var md5 = toolkit.getMD5(strToMD5);

  return md5;
};

common.replaceImportDataOrigin = function(importData, origin, originId) {
  IMPORT_DATA_KEYS_WITH_ORIGIN.forEach(function(key) {
    var data = importData[key];
    if (toolkit.isNothing(data)) return;

    data.forEach(function(d) {
      d.origin   = origin;
      d.originId = originId;
    });
  });

  return importData;
}