'use strict';

/* Built-in Modules */
var path         = require('path');
var childProcess = require('child_process');

/* 3rd-party Modules */
var async      = require('async');
var request    = require('request');
var promClient = require('prom-client');

/* Project Modules */
var E          = require('../utils/serverError');
var IMAGE_INFO = require('../utils/yamlResources').get('IMAGE_INFO');
var ROUTE      = require('../utils/yamlResources').get('ROUTE');
var CONST      = require('../utils/yamlResources').get('CONST');
var CONFIG     = require('../utils/yamlResources').get('CONFIG');
var toolkit    = require('../utils/toolkit');
var common     = require('../utils/common');

var funcMod          = require('../models/funcMod');
var systemSettingMod = require('../models/systemSettingMod');

/* Init */
var API_LIST_CACHE = {};

var OPEN_API_PARAM_TYPES = [
  { name: 'params', in: 'path' },
  { name: 'query' , in: 'query' },
];
var LANGUAGE_ZH_CN_SUFFIX = '_zhCN';

// OpenMetric
var METRIC_MAP = {};

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

function toOpenAPISchema(fieldOpt, filesOpt) {
  var schemaSpec = {};

  fieldOpt.$_type = fieldOpt.$ ? 'array' : (fieldOpt.$type || '').toLowerCase();
  switch(fieldOpt.$_type) {
    case 'str':
    case 'string':
      schemaSpec = {
        type: 'string',
      };
      break;

    case 'enum':
      schemaSpec = {
        type: 'string',
        enum: fieldOpt.$in,
      };
      break;

    case 'jsonstring':
      schemaSpec = {
        type  : 'string',
        format: 'JSON',
      };
      break;

    case 'commaarray':
      schemaSpec = {
        type  : 'string',
        format: 'array',
      };
      break;

    case 'int':
    case 'integer':
      schemaSpec = {
        type: 'integer',
      };
      break;

    case 'num':
    case 'number':
    case 'float':
      schemaSpec = {
        type: 'number',
      };
      break;

    case 'arr':
    case 'array':
      schemaSpec = {
        type : 'array',
        items: {},
      };
      break;

    case 'bool':
    case 'boolean':
      schemaSpec = {
        type: 'boolean',
      };
      break;

    default:
      var hasSubField = false;
      for (var optKey in fieldOpt) {
        if (optKey[0] !== '$') {
          hasSubField = true;
          break;
        }
      }

      if (hasSubField) {
        schemaSpec = {
          type      : 'object',
          properties: {},
        };

      } else {
        schemaSpec = {
          type: 'string',
        };
      }
      break;
  }

  if (fieldOpt.$desc) {
    schemaSpec.description = fieldOpt.$desc.trim();
  }
  if (fieldOpt.$allowNull) {
    schemaSpec.nullable = true;
  }
  if (fieldOpt.$notEmptyString) {
    schemaSpec.allowEmptyValue = false;
  }
  if ('$minValue' in fieldOpt) {
    schemaSpec.minimum = fieldOpt.$minValue;
  }
  if ('$maxValue' in fieldOpt) {
    schemaSpec.maximum = fieldOpt.$maxValue;
  }
  if (fieldOpt.$example) {
    schemaSpec.example = fieldOpt.$example;
  }

  for (var optKey in fieldOpt) {
    if (optKey === '$') {
      // Array
      schemaSpec.items = toOpenAPISchema(fieldOpt.$);

    } else if (optKey[0] !== '$') {
      // Object
      var subFieldOpt = fieldOpt[optKey];
      schemaSpec.properties[optKey] = toOpenAPISchema(subFieldOpt);
    }
  }

  if (filesOpt && schemaSpec.properties) {
    schemaSpec.properties.files = {
      description: filesOpt.$desc,
      type       : 'string',
      format     : 'binary',
    }
  }

  return schemaSpec;
};

function getOpenAPISpec(route) {
  // Basic Structure
  var spec = {
    openapi: '3.0.0',
    info: {
      title      : 'DataFlux Func Open API',
      version    : IMAGE_INFO.VERSION,
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

      // API
      var apiSpec = {
        summary    : api.name,
        description: api.desc,
        tags       : [ moduleTag ],
        parameters : [],
        responses: {
          200: { $ref: '#/components/responses/GeneralResponse' }
        }
      }

      // Parameters
      OPEN_API_PARAM_TYPES.forEach(function(paramType) {
        if (!api[paramType.name]) return;

        for (var k in api[paramType.name]) {
          var paramOpt = api[paramType.name][k];

          var paramSpec = {
            name       : k,
            in         : paramType.in,
            description: paramOpt.$desc,
            schema     : toOpenAPISchema(paramOpt),
            deprecated : !!paramOpt.$isDeprecated,
            required   : !!(paramType.in === 'path' || paramOpt.$isRequired || paramOpt.$required),
          }

          if (toolkit.startsWith(k, '_')) {
            apiSpec.parameters.unshift(paramSpec);
          } else {
            apiSpec.parameters.push(paramSpec);
          }
        }
      });

      // Body
      if (api.body) {
        if (api.files) {
          apiSpec.requestBody = {
            required: true,
            content: {
              'multipart/form-data': {
                schema: toOpenAPISchema(api.body, api.files)
              }
            }
          }

        } else {
          apiSpec.requestBody = {
            required: true,
            content: {
              'application/json': {
                schema: toOpenAPISchema(api.body)
              }
            }
          }
        }
      }

      var apiURL = toolkit.asArray(api.url)[0].replace(/\/:([a-zA-Z0-9-_]+)/g, '/{$1}');
      if (!spec.paths[apiURL]) {
        spec.paths[apiURL] = {};
      }

      spec.paths[apiURL][api.method] = apiSpec;
    }
  }

  return spec
};

/* Handlers */
exports.api = function(req, res, next) {
  var format = req.query.format || 'openapi';
  var lang   = req.query.lang   || 'zh-CN';

  // 从缓存中获取
  var cacheKey = `${format}/${lang}`;
  var ret = API_LIST_CACHE[cacheKey]
          ? API_LIST_CACHE[cacheKey]
          : null;

  // 生成返回数据
  if (!ret) {
    var route = useLanguage(ROUTE, lang);

    switch (format) {
      case 'openapi':
      case 'swagger':
        ret = getOpenAPISpec(route);
        break;

      case 'raw':
      default:
        ret = toolkit.initRet(route);
        break;
    }
  }

  // 返回数据
  res.send(ret);
};

exports.imageInfo = function(req, res, next) {
  var ret = toolkit.initRet(IMAGE_INFO);
  res.locals.sendJSON(ret);
};

exports.systemInfo = function(req, res, next) {
  var systemInfo = {
    // 来自镜像信息
    ARCHITECTURE     : IMAGE_INFO.ARCHITECTURE,
    EDITION          : IMAGE_INFO.EDITION,
    VERSION          : IMAGE_INFO.VERSION,
    RELEASE_TIMESTAMP: IMAGE_INFO.RELEASE_TIMESTAMP,
    LINUX_DISTRO     : IMAGE_INFO.LINUX_DISTRO,

    // 来自配置
    MODE              : CONFIG.MODE,
    WEB_BASE_URL      : CONFIG.WEB_BASE_URL,
    WEB_INNER_BASE_URL: CONFIG.WEB_INNER_BASE_URL,

    _HOSTNAME       : process.env.HOSTNAME,
    _PIP_INSTALL_DIR: path.join(CONFIG.RESOURCE_ROOT_PATH, CONFIG._EXTRA_PYTHON_PACKAGE_INSTALL_DIR),

    _WEB_CLIENT_ID_HEADER               : CONFIG._WEB_CLIENT_ID_HEADER,
    _WEB_AUTH_HEADER                    : CONFIG._WEB_AUTH_HEADER,
    _WEB_AUTH_QUERY                     : CONFIG._WEB_AUTH_QUERY,
    _WEB_TRACE_ID_HEADER                : CONFIG._WEB_TRACE_ID_HEADER,
    _WEB_PULL_LOG_TRACE_ID              : CONFIG._WEB_PULL_LOG_TRACE_ID,
    _WEB_SERVER_VERSION_HEADER          : CONFIG._WEB_SERVER_VERSION_HEADER,
    _WEB_SERVER_RELEASE_TIMESTAMP_HEADER: CONFIG._WEB_SERVER_RELEASE_TIMESTAMP_HEADER,

    _FUNC_EXPORT_FILENAME: CONFIG._FUNC_EXPORT_FILENAME,

    _FUNC_ARGUMENT_PLACEHOLDER_LIST: CONFIG._FUNC_ARGUMENT_PLACEHOLDER_LIST,

    _FUNC_TASK_TIMEOUT_DEBUGGER   : CONFIG._FUNC_TASK_TIMEOUT_DEBUGGER,
    _FUNC_TASK_TIMEOUT_DEFAULT    : CONFIG._FUNC_TASK_TIMEOUT_DEFAULT,
    _FUNC_TASK_TIMEOUT_MIN        : CONFIG._FUNC_TASK_TIMEOUT_MIN,
    _FUNC_TASK_TIMEOUT_MAX        : CONFIG._FUNC_TASK_TIMEOUT_MAX,
    _FUNC_TASK_DEFAULT_API_TIMEOUT: CONFIG._FUNC_TASK_DEFAULT_API_TIMEOUT,
    _FUNC_TASK_MIN_API_TIMEOUT    : CONFIG._FUNC_TASK_MIN_API_TIMEOUT,
    _FUNC_TASK_MAX_API_TIMEOUT    : CONFIG._FUNC_TASK_MAX_API_TIMEOUT,

    _TASK_INFO_MIN_LIMIT                       : CONFIG._TASK_INFO_MIN_LIMIT,
    _TASK_RECORD_LIMIT_MAX                     : CONFIG._TASK_RECORD_LIMIT_MAX,
    _TASK_RECORD_FUNC_LIMIT_BY_ORIGIN_AUTH_LINK: CONFIG._TASK_RECORD_FUNC_LIMIT_BY_ORIGIN_AUTH_LINK,
    _TASK_RECORD_FUNC_LIMIT_BY_ORIGIN_CRONTAB  : CONFIG._TASK_RECORD_FUNC_LIMIT_BY_ORIGIN_CRONTAB,
    _TASK_RECORD_FUNC_LIMIT_BY_ORIGIN_BATCH    : CONFIG._TASK_RECORD_FUNC_LIMIT_BY_ORIGIN_BATCH,


    // 来自路由
    _RESOURCE_UPLOAD_FILE_SIZE_LIMIT: toolkit.toBytes(ROUTE.resourceAPI.upload.files.$limitSize),
  };

  var funcModel          = funcMod.createModel(res.locals);
  var systemSettingModel = systemSettingMod.createModel(res.locals);

  async.series([
    // 获取登录集成函数
    function(asyncCallback) {
      if (CONFIG.DISABLE_INTEGRATED_SIGNIN) return asyncCallback();

      var opt = {
        filters: {
          integration: {eq: 'signIn'}
        }
      };
      funcModel.list(opt, function(err, dbRes) {
        if (err) return asyncCallback(err);

        // 集成登录记录为配置信息
        var integratedSignInFuncs = [];
        dbRes.forEach(function(d) {
          integratedSignInFuncs.push({
            id  : d.id,
            name: d.title,
          });
        });

        systemInfo.INTEGRATED_SIGN_IN_FUNC = integratedSignInFuncs;

        return asyncCallback();
      });
    },
    // 获取系统设置
    function(asyncCallback) {
      systemSettingModel.get(Object.keys(CONST.systemSettings), function(err, dbRes) {
        if (err) return asyncCallback(err);

        systemInfo.SYSTEM_SETTINGS = dbRes;

        return asyncCallback();
      });
    },
    // 获取观测云节点列表
    function(asyncCallback) {
      common.getGuanceNodes(function(err, guanceNodes) {
        if (err) return asyncCallback(err);

        systemInfo.GUANCE_NODES = guanceNodes;

        return asyncCallback();
      });
    },
  ], function(err) {
    if (err) return next(err);

    var ret = toolkit.initRet(systemInfo);
    return res.locals.sendJSON(ret);
  });
};

exports.metrics = function(req, res, next) {
  res.set('Content-Type', 'application/openmetrics-text; version=1.0.0; charset=utf-8');

  var interval_min = 10;
  var interval     = interval_min * 60;

  var cacheKeyPattern = toolkit.getMonitorCacheKey('monitor', 'systemMetrics', ['metric', '*']);
  var ignoreMetrics = [
    // 不适合作为OpenMetric导出的指标
    'matchedRouteCount', // 按每日统计的数据，非时序数据
  ];

  var keys = null;
  async.series([
    // 查询所有指标键
    function(asyncCallback) {
      res.locals.cacheDB.keys(cacheKeyPattern, function(err, cacheRes) {
        if (err) return asyncCallback(err);

        keys = cacheRes.sort();

        return asyncCallback();
      })
    },
    // 设置指标
    function(asyncCallback) {
      async.eachSeries(keys, function(key, eachCallback) {
        var parsedKey = toolkit.parseCacheKey(key);
        var metric = parsedKey.tags.metric;
        var labels = parsedKey.tags;
        delete labels.metric;

        if (ignoreMetrics.indexOf(metric) >= 0) return eachCallback();

        // 初始化Prom指标
        var promMetric = METRIC_MAP[metric];
        if (!promMetric) {
          promMetric = new promClient.Gauge({
            name      : `DFF_${metric}`,
            help      : toolkit.splitCamel(metric) + ` (in recent ${interval_min} minutes)`,
            labelNames: Object.keys(labels),
          });
          METRIC_MAP[metric] = promMetric;
        }

        var now = toolkit.getTimestamp();
        var opt = {
          start    : now - interval * 2,
          groupTime: interval,
          limit    : 2,
        };

        switch(metric) {
          case 'funcCallCount':
            opt.agg = 'sum';
            break;
        }

        res.locals.cacheDB.tsGet(key, opt, function(err, tsData) {
          if (err) return eachCallback(err);

          var value = 0;
          try { value = tsData[0][1] } catch(_) {}

          switch(metric) {
            case 'cacheDBKeyCountByPrefix':
              if (labels.prefix) {
                labels.prefix = toolkit.fromBase64(labels.prefix);
              }
              break
          }
          promMetric.labels(labels).set(value);

          return eachCallback();
        });
      }, asyncCallback);
    },
  ], function(err) {
    if (err) return next(err)

    promClient.register.metrics().then(function(data) {
      return res.locals.sendRaw(data);

    }) .catch(function(err) {
      return next(err)
    });
  });
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

exports.systemReport = function(req, res, next) {
  // 主程序相关
  var MAIN = IMAGE_INFO;

  // 配置信息
  var _CONFIG = toolkit.maskConfig(CONFIG);

  // Python 相关
  var PYTHON = {
    version : childProcess.execFileSync('python', [ '--version' ]).toString().trim().split(' ').pop(),
    packages: JSON.parse(childProcess.execFileSync('pip', [ 'list', '--format=json' ]).toString()).reduce(function(acc, x) {
      acc[x.name] = x.version;
      return acc;
    }, {}),
  };

  // Node 相关
  var NODE = {
    version : childProcess.execFileSync('node', [ '--version' ]).toString().trim().replace('v', ''),
    packages: toolkit.safeReadFileSync(path.join(__dirname, '../../package.json'), 'json').dependencies,
  };

  // 前端相关版本
  var WEB_CLIENT = {
    packages: toolkit.safeReadFileSync(path.join(__dirname, '../../client/package.json'), 'json').dependencies,
  };

  var WORKER      = {};
  var REDIS       = {};
  var MYSQL       = {};
  var MYSQL_TABLE = {};

  async.series([
    // Redis 信息
    function(asyncCallback) {
      res.locals.cacheDB.info(function(err, cacheRes) {
        if (err) return asyncCallback(err);

        cacheRes.split('\n').forEach(function(line) {
          line = line.trim();
          if (!line || line[0] === '#') return;

          var parts = line.split(':');
          var k = parts[0].trim();
          var v = '';
          if (parts.length >= 2) {
            v = parts[1].trim();
          }
          REDIS[k] = v;
        });

        return asyncCallback();
      });
    },
    // MySQL 信息
    function(asyncCallback) {
      res.locals.db.query('SHOW VARIABLES', null, function(err, dbRes) {
        if (err) return asyncCallback(err);

        dbRes.forEach(function(d) {
          var k = d['Variable_name'];
          var v = d['Value'];
          MYSQL[k] = v;
        });

        return asyncCallback();
      });
    },
    // MySQL 表
    function(asyncCallback) {
      res.locals.db.query('SHOW TABLE STATUS', null, function(err, dbRes) {
        if (err) return asyncCallback(err);

        MYSQL_TABLE = dbRes.reduce(function(acc, x) {
          acc[x.Name] = x;
          return acc;
        }, {});

        return asyncCallback();
      });
    },
  ], function(err) {
    if (err) return next(err);

    var systemReport = {
      MAIN,
      CONFIG: _CONFIG,
      WORKER,
      PYTHON,
      NODE,
      WEB_CLIENT,
      REDIS,
      MYSQL,
      MYSQL_TABLE,
    };

    var ret = toolkit.initRet(systemReport);
    return res.locals.sendJSON(ret);
  });
};
