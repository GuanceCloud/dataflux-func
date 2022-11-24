'use strict';

/* Builtin Modules */

/* 3rd-party Modules */

/* Project Modules */
var E           = require('./serverError');
var CONFIG      = require('./yamlResources').get('CONFIG');
var toolkit     = require('./toolkit');

var common = exports;

var SCRIPT_TYPE_EXT_MAP = {
  python  : 'py',
  markdown: 'md',
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

      script.code    = script.code || '';          // 保证code字段不为NULL
      script.codeMD5 = toolkit.getMD5(script.code) // 计算MD5值

      if (script.codeDraft) {
        script.codeDraft    = script.codeDraft || '';          // 保证codeDraft字段不为NULL
        script.codeDraftMD5 = toolkit.getMD5(script.codeDraft) // 计算MD5值
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
}