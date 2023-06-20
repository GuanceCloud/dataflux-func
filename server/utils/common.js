'use strict';

/* Built-in Modules */

/* 3rd-party Modules */
var sortedJSON = require('sorted-json');
var async      = require('async');
var request    = require('request');

/* Project Modules */
var toolkit    = require('./toolkit');
var IMAGE_INFO = require('../utils/yamlResources').get('IMAGE_INFO');

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

common.IMPORT_EXPORT_DATA_SCHEMA_VERSION = 2;

common.convertImportExportDataSchema = function(data) {
  data.version = data.version || 1;

  // v1 => v2
  if (data.version === 1) {
    // scriptSets[#]._exportUser 字段位置改为 _extra.exportUser
    // scriptSets[#]._exportTime 字段位置改为 _extra.exportTime
    // scriptSets[#]._note       字段位置改为 _extra.note
    if (toolkit.notNothing(data.scriptSets)) {
      data.scriptSets.forEach(function(scriptSet) {
        scriptSet._extra = scriptSet._extra || {};
        if ('_exportUser' in scriptSet) scriptSet._extra.exportUser = scriptSet._exportUser;
        if ('_exportTime' in scriptSet) scriptSet._extra.exportTime = scriptSet._exportTime;
        if ('_note'       in scriptSet) scriptSet._extra.note       = scriptSet._note;

        delete scriptSet._exportUser;
        delete scriptSet._exportTime;
        delete scriptSet._note;
      })
    }

    // exportUser 字段位置改为 extra.exportUser
    // exportTime 字段位置改为 extra.exportTime
    // note       字段位置改为 extra.note
    data.extra = data.extra || {};
    if ('exportUser' in data) data.extra.exportUser = data.exportUser;
    if ('exportTime' in data) data.extra.exportTime = data.exportTime;
    if ('note'       in data) data.extra.note       = data.note;

    delete data.exportUser;
    delete data.exportTime;
    delete data.note;

    // 更新版本
    data.version = 2;
  }

  return data;
};

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

      script.code    = script.code    || '';                         // 保证 code 字段不为 NULL
      script.codeMD5 = script.codeMD5 || toolkit.getMD5(script.code) // 计算 MD5 值

      if (script.codeDraft) {
        script.codeDraft    = script.codeDraft || '';                              // 保证 codeDraft 字段不为 NULL
        script.codeDraftMD5 = script.codeDraft || toolkit.getMD5(script.codeDraft) // 计算 MD5 值
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
};

common.getGuanceNodes = function(callback) {
  var guanceNodes = [];

  var requestOptions = {
    method : 'get',
    url    : 'https://func.guance.com/guance-nodes.json',
    headers: { 'Cache-Control': 'no-cache' },
    json   : true,
  };
  request(requestOptions, function(err, _res, _body) {
    if (!err) {
      guanceNodes = _body.nodes || [];
      if (['0.0.0', 'dev'].indexOf(IMAGE_INFO.VERSION) < 0) {
        guanceNodes = guanceNodes.filter(function(x) {
          return x.key !== 'testing';
        });
      }
    }

    // 忽略报错
    return callback(null, guanceNodes);
  });
};

common.checkGuanceAPIKey = function(guanceNodeKey, guanceAPIKeyID, guanceAPIKey, callback) {
  var guanceNode = null;
  async.series([
    // 获取观测云节点
    function(asyncCallback) {
      common.getGuanceNodes(function(err, guanceNodes) {
        if (err) return asyncCallback(err);

        guanceNode = guanceNodes.filter(function(node) {
          return node.key === guanceNodeKey;
        })[0];

        if (!guanceNode) {
          return asyncCallback(new E('EClientNotFound', 'Guance Node not found'));
        }

        return asyncCallback();
      });
    },
    // 尝试调用观测云 OpenAPI
    function(asyncCallback) {
      var requestOptions = {
        method : 'get',
        url    : `${guanceNode.openapi}/api/v1/workspace/accesskey/list`,
        headers: { 'DF-API-KEY': guanceAPIKeyID },
        json   : true,
      };
      request(requestOptions, function(err, _res, _body) {
        if (err) return asyncCallback(err);

        if (_res.statusCode >= 400) {
          return asyncCallback(new Error('Calling Guance API Failed'));
        }

        var matchedData = _body.content.filter(function(d) {
          return d.ak === guanceAPIKeyID && d.sk === guanceAPIKey;
        });
        if (matchedData.length <= 0) {
          return asyncCallback(new Error('Guance API Key ID and API Key not match'));
        }

        return asyncCallback();
      });
    },
  ], function(err) {
    if (err) return callback(err);
    return callback();
  });
};
