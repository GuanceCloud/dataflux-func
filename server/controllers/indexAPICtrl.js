'use strict';

/* Built-in Modules */
var childProcess = require('child_process');

/* 3rd-party Modules */
var fs      = require('fs-extra');
var async   = require('async');
var request = require('request');

/* Project Modules */
var E       = require('../utils/serverError');
var ROUTE   = require('../utils/yamlResources').get('ROUTE');
var toolkit = require('../utils/toolkit');

/* Configure */
var IMAGE_INFO = require('../../image-info.json');
IMAGE_INFO.ARCHITECTURE   = childProcess.execFileSync('uname', [ '-m' ]).toString().trim();
IMAGE_INFO.PYTHON_VERSION = childProcess.execFileSync('python', [ '--version' ]).toString().trim().split(' ').pop();
IMAGE_INFO.NODE_VERSION   = childProcess.execFileSync('node', [ '--version' ]).toString().trim().replace('v', '');

var OPEN_API_SPEC = {};
var OPEN_API_PARAM_OPTIONS = [
  { name: 'params', in: 'path' },
  { name: 'query' , in: 'query' },
];
var LANGUAGE_ZH_CN_SUFFIX = '_zhCN';

function useLanguage(j, lang) {
  lang = lang.replace(/[-_]/g, '');

  function _useLanguage(j) {
    if (j && 'object' === typeof j && !Array.isArray(j)) {
      Object.keys(j).sort().forEach(function(k) {
        if (k.slice(-LANGUAGE_ZH_CN_SUFFIX.length) === LANGUAGE_ZH_CN_SUFFIX) {
          if (lang === LANGUAGE_ZH_CN_SUFFIX.slice(1)) {
            var mainK = k.slice(0, -LANGUAGE_ZH_CN_SUFFIX.length);
            j[mainK] = j[k];
          }

          delete j[k];

        } else {
          j[k] = _useLanguage(j[k]);
        }
      });

    } else if (j && Array.isArray(j)) {
      for (var i = 0; i < j.length; i++) {
        j[i] = _useLanguage(j[i])
      }
    }

    return j;
  }

  return _useLanguage(toolkit.jsonCopy(j));
};

function toOpenAPISchema(field) {
  var schemaSpec = {};
  switch(field.$type) {
    case 'enum':
      schemaSpec = {
        type: 'string',
        enum: field.$in,
      };
      break;

    case 'jsonstring':
    case 'commaArray':
      schemaSpec = {
        type  : 'string',
        format: field.$type,
      };
      break;

    case 'int':
      schemaSpec = {
        type: 'integer',
      };
      break;

    case 'bool':
      schemaSpec = {
        type: 'boolean',
      };
      break;

    case '*':
    case 'any':
    case 'json':
      break;

    default:
      schemaSpec = {
        type      : field.$type || 'object',
        properties: {},
      };
      break;
  }

  if (field.$desc) {
    schemaSpec.description = field.$desc.trim();
  }
  if (field.$allowNull) {
    schemaSpec.nullable = true;
  }
  if (field.$notEmptyString) {
    schemaSpec.allowEmptyValue = false;
  }
  if ('$minValue' in field) {
    schemaSpec.minimum = field.$minValue;
  }
  if ('$maxValue' in field) {
    schemaSpec.maximum = field.$maxValue;
  }
  if (field.$example) {
    schemaSpec.example = field.$example;
  }

  for (var subFieldKey in field) {
    if (subFieldKey[0] === '$') continue;

    var subField = field[subFieldKey];
    schemaSpec.properties[subFieldKey] = toOpenAPISchema(subField);
  }

  return schemaSpec;
};

function getOpenAPISpec(lang) {
  // From cache
  if (OPEN_API_SPEC[lang]) return OPEN_API_SPEC[lang];

  // Use language
  var route = useLanguage(ROUTE, lang);

  // Basic Structure
  var spec = {
    openapi: '3.0.0',
    info: {
      title      : 'DataFlux Func API',
      version    : IMAGE_INFO.CI_COMMIT_REF_NAME,
      description: route.$description,
    },
    tags : [],
    paths: {},
    components: {
      responses: {
        GeneralResponse: {
          content: {
            'application/json': {
              schema: toOpenAPISchema(route.$response),
            },
          }
        }
      }
    }
  }

  // Collect Paths
  for (var moduleKey in route) {
    if (moduleKey[0] === '$') continue;

    var module = route[moduleKey];
    var moduleTag = module.$tag || moduleKey;
    if (spec.tags.indexOf(moduleTag) < 0) {
      spec.tags.push(moduleTag);
    }

    for (var apiKey in module) {
      if (apiKey[0] === '$') continue;

      var api = module[apiKey];
      if (!api.showInDoc) continue;

      var apiSpec = {
        summary    : api.name,
        description: api.desc,
        tags       : [ moduleTag ],
        parameters : [],
        responses: {
          default: { $ref: '#/components/responses/GeneralResponse' }
        }
      }

      OPEN_API_PARAM_OPTIONS.forEach(function(paramOpt) {
        if (!api[paramOpt.name]) return;

        for (var k in api[paramOpt.name]) {
          var param = api[paramOpt.name][k];

          var paramSpec = {
            name       : k,
            in         : paramOpt.in,
            description: param.$desc,
            schema     : toOpenAPISchema(param),
          }
          if (paramOpt.in === 'path' || param.$isRequired || param.$required) {
            paramSpec.required = true;
          }

          apiSpec.parameters.push(paramSpec);
        }
      });

      if (api.body) {

      }

      var apiURL = api.url.replace(/\/:([a-zA-Z0-9-_]+)/g, '/{$1}');
      if (!spec.paths[apiURL]) {
        spec.paths[apiURL] = {};
      }

      spec.paths[apiURL][api.method] = apiSpec;
    }
  }

  OPEN_API_SPEC[lang] = spec;
  return OPEN_API_SPEC[lang];
};

/* Handlers */
exports.index = function(req, res, next) {
  var format = req.query.format;
  var lang   = req.query.lang;

  var ret = null;
  switch (format) {
    case 'openapi':
    case 'swagger':
      ret = getOpenAPISpec(lang);
      res.send(ret);
      break;

    default:
      ret = toolkit.initRet(ROUTE);
      res.locals.sendJSON(ret);
      break;
  }
};

exports.clientConfig = function(req, res, next) {
  var ret = toolkit.initRet(res.locals.clientConfig);
  res.locals.sendJSON(ret);
};

exports.imageInfo = function(req, res, next) {
  var ret = toolkit.initRet(IMAGE_INFO);
  res.locals.sendJSON(ret);
};

exports.ping = function(req, res, next) {
  var ret = toolkit.initRet('pong');
  res.locals.sendJSON(ret);
};

exports.echo = function(req, res, next) {
  var data = {
    query: req.query,
    body : req.body,
  }
  var ret = toolkit.initRet(data);
  res.locals.sendJSON(ret);
};

exports.proxy = function(req, res, next) {
  var requestOptions = {
    forever: true,
    timeout: (req.body.timeout || 10) * 1000,
    method : req.body.method,
    url    : req.body.url,
    headers: req.body.headers || undefined,
    json   : true,
    body   : req.body.body || undefined,
  };
  request(requestOptions, function(err, _res, _body) {
    if (err) return next(err);

    var httpResp = {
      statusCode: _res.statusCode,
      body      : _body,
    };

    if (req.body.withHeaders) {
      httpResp.headers = _res.headers;
    }

    var ret = toolkit.initRet(httpResp);

    return res.locals.sendJSON(ret, { muteLog: true });
  });
};

exports.testThrowError = function(req, res, next) {
  throw new Error('Test Throw Error');
};

exports.testThrowErrorInAsync = function(req, res, next) {
  async.series([
    function(asyncCallback) {
      throw new Error('Test Throw Error in Async');
    },
  ], function(err) {
    if (err) return next(err);

    var ret = toolkit.initRet(req.body);
    res.locals.sendJSON(ret);
  });
};

exports.testSlowAPI = function(req, res, next) {
  var simulateReqCost = req.query.simulateReqCost || 0;

  setTimeout(function() {
    res.locals.sendJSON();
  }, simulateReqCost);
};
