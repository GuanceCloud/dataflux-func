'use strict';

/* Built-in Modules */
var path         = require('path');
var childProcess = require('child_process');

/* 3rd-party Modules */
var async   = require('async');
var request = require('request');

/* Project Modules */
var IMAGE_INFO = require('../utils/yamlResources').get('IMAGE_INFO');
var ROUTE      = require('../utils/yamlResources').get('ROUTE');
var CONST      = require('../utils/yamlResources').get('CONST');
var CONFIG     = require('../utils/yamlResources').get('CONFIG');
var toolkit    = require('../utils/toolkit');
var common     = require('../utils/common');

var funcMod = require('../models/funcMod');
const { BYTE_ORDER_MARK } = require('babyparse');

/* Init */
var API_LIST_CACHE = {};

var OPEN_API_PARAM_TYPES = [
  { name: 'params', in: 'path' },
  { name: 'query' , in: 'query' },
];
var LANGUAGE_ZH_CN_SUFFIX = '_zhCN';

// Redis Key agg
var REDIS_KEY_AGG = [
  [ /[a-zA-Z0-9]{32}/g,                              '<Hash>'],
  [ /:date:[0-9]{4}-[0-9]{2}-[0-9]{2}:/g,            ':date:<Date>:'],
  [ /:hostname:[a-zA-Z0-9_-]+:/g,                    ':hostname:<Hostname>:'],
  [ /:pid:[0-9]+:/g,                                 ':pid:<Process ID>:'],
  [ /:xAuthTokenId:[a-zA-Z0-9_-]+:/g,                ':xAuthTokenId:<X-Auth-Token ID>:'],
  [ /:userId:[a-zA-Z0-9_-]+:/g,                      ':userId:<User ID>:'],
  [ /:username:[a-zA-Z0-9_-]+:/g,                    ':username:<Username>:'],
  [ /:workerId:[a-zA-Z0-9_-]+:/g,                    ':workerId:<Worker ID>:'],
  [ /:queue:[0-9]+:/g,                               ':queue:<Queue>:'],
  [ /:workerQueue:[0-9]+:/g,                         ':workerQueue:<Worker Queue>:'],
  [ /:funcId:[a-zA-Z0-9_.]+:/g,                      ':funcId:<Func ID>:'],
  [ /:table:[a-zA-Z0-9_]+:/g,                        ':table:<Table>:'],
  [ /:routeName:[a-zA-Z0-9_-]+:/g,                   ':routeName:<Route Name>:'],
  [ /:routeParams\.[a-zA-Z0-9_-]+:[a-zA-Z0-9_-]+:/g, ':routeParams.<Field>:<Value>:'],
]

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

function toOpenAPISchema(fieldOpt, filesOpt, lang) {
  var schemaSpec = {};

  // 已过时参数
  if (fieldOpt.$isDeprecated) {
    schemaSpec = {
      type   : 'string',
      example: lang === 'zh-CN' ? '<已弃用>' : '<Deprecated>',
    };
    return schemaSpec;
  }

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
      schemaSpec.items = toOpenAPISchema(fieldOpt.$, null, lang);

    } else if (optKey[0] !== '$') {
      // Object
      var subFieldOpt = fieldOpt[optKey];
      schemaSpec.properties[optKey] = toOpenAPISchema(subFieldOpt, null, lang);
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

function getOpenAPISpec(route, lang) {
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
              schema: toOpenAPISchema(route.$response, null, lang),
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
        deprecated : !!api.isDeprecated || !!api.deprecated,
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
            schema     : toOpenAPISchema(paramOpt, null, lang),
            deprecated : !!paramOpt.$isDeprecated || !!paramOpt.$deprecated,
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
                schema: toOpenAPISchema(api.body, api.files, lang),
              }
            }
          }

        } else {
          apiSpec.requestBody = {
            required: true,
            content: {
              'application/json': {
                schema: toOpenAPISchema(api.body, null, lang),
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
        ret = getOpenAPISpec(route, lang);
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
    _WEB_CLIENT_TIME_HEADER             : CONFIG._WEB_CLIENT_TIME_HEADER,
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

    _TASK_RECORD_LIMIT_MIN           : CONFIG._TASK_RECORD_LIMIT_MIN,
    _TASK_RECORD_LIMIT_MAX           : CONFIG._TASK_RECORD_LIMIT_MAX,
    _TASK_RECORD_FUNC_LIMIT_SYNC_API : CONFIG._TASK_RECORD_FUNC_LIMIT_SYNC_API,
    _TASK_RECORD_FUNC_LIMIT_CRON_JOB : CONFIG._TASK_RECORD_FUNC_LIMIT_CRON_JOB,
    _TASK_RECORD_FUNC_LIMIT_ASYNC_API: CONFIG._TASK_RECORD_FUNC_LIMIT_ASYNC_API,

    _MONITOR_REPORT_INTERVAL: CONFIG._MONITOR_REPORT_INTERVAL,

    // 来自路由
    _RESOURCE_UPLOAD_FILE_SIZE_LIMIT: toolkit.toBytes(ROUTE.resourceAPI.upload.files.$limitSize),
  };

  var funcModel = funcMod.createModel(res.locals);

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
      var keys = Object.keys(CONST.systemSettings);
      res.locals.getSystemSettings(keys, function(err, systemSettings) {
        if (err) return asyncCallback(err);

        systemInfo.SYSTEM_SETTINGS = systemSettings;

        return asyncCallback();
      });
    },
  ], function(err) {
    if (err) return next(err);

    // 获取观测云节点列表
    systemInfo.GUANCE_NODES = common.getGuanceNodes();

    var ret = toolkit.initRet(systemInfo);
    return res.locals.sendJSON(ret);
  });
};

exports.metrics = function(req, res, next) {
  res.set('Content-Type', 'application/openmetrics-text; version=1.0.0; charset=utf-8');

  var deprecateInfo = [
    '# [DEPRECATE] This API is DEPRECATED, please go to "DataFlux Func / Management / System Setting" and enable "Guance Data Upload" to report system metrics.',
    '# [废除] 本 API 已被废除，请前往「DataFlux Func / 管理 / 系统配置」并开启「观测云数据上报」来上报系统指标。'
  ].join('\n');

  return res.locals.sendRaw(deprecateInfo);
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
  // 镜像信息
  var IMAGE = IMAGE_INFO;

  // 配置信息
  var _CONFIG = toolkit.jsonMask(CONFIG);

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

  var topN = 10;

  var SERVICES       = {}; // TODO 增加报告内容
  var QUEUES         = {}; // TODO 增加报告内容
  var REDIS          = {};
  var MYSQL          = {};
  var MYSQL_TABLES   = {};
  var MYSQL_ANALYSIS = {};

  async.series([
    // Redis
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
    // MySQL
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

        MYSQL_TABLES = dbRes.reduce(function(acc, x) {
          acc[x.Name] = x;
          acc[x.Name].Total_length = acc[x.Name].Data_length + acc[x.Name].Index_length;

          // 易读大小
          acc[x.Name].Data_length_human  = toolkit.byteSizeHuman(acc[x.Name].Data_length).toString();
          acc[x.Name].Index_length_human = toolkit.byteSizeHuman(acc[x.Name].Index_length).toString();
          acc[x.Name].Total_length_human = toolkit.byteSizeHuman(acc[x.Name].Total_length).toString();

          return acc;
        }, {});

        // 统计
        MYSQL_ANALYSIS = {
          topRows       : toolkit.sortJSONArray(dbRes, 'Rows', 'DESC').slice(0, topN),
          topDataLength : toolkit.sortJSONArray(dbRes, 'Data_length', 'DESC').slice(0, topN),
          topIndexLength: toolkit.sortJSONArray(dbRes, 'Index_length', 'DESC').slice(0, topN),
          topTotalLength: toolkit.sortJSONArray(dbRes, 'Total_length', 'DESC').slice(0, topN),
        };

        return asyncCallback();
      });
    },
  ], function(err) {
    if (err) return next(err);

    var systemReport = {
      IMAGE,
      CONFIG: _CONFIG,
      NODE, PYTHON,
      WEB_CLIENT,
      REDIS,
      MYSQL, MYSQL_TABLES, MYSQL_ANALYSIS,
    };

    var ret = toolkit.initRet(systemReport);
    return res.locals.sendJSON(ret);
  });
};

exports.detailedRedisReport = function(req, res, next) {
  var t1 = Date.now();

  var topN = 20;

  var REDIS              = {};
  var REDIS_KEYS         = {};
  var REDIS_KEY_PATTERNS = {};
  var REDIS_ANALYSIS     = {};


  async.series([
    // Redis
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
    // Redis Keys
    function(asyncCallback) {
      res.locals.cacheDB.keys('*', function(err, keys) {
        if (err) return asyncCallback(err);

        async.eachLimit(keys, 10, function(key, eachCallback) {
          REDIS_KEYS[key] = {
            key             : key,
            type            : null,
            memoryUsage     : 0,
            memoryUsageHuman: 0,
          }

          var keyPattern = key;
          REDIS_KEY_AGG.forEach(function(agg) {
            keyPattern = keyPattern.replace(agg[0], agg[1]);
          });

          REDIS_KEY_PATTERNS[keyPattern] = REDIS_KEY_PATTERNS[keyPattern] || {
            keyPattern     : keyPattern,
            type           : [],
            count          : 0,
            memoryUsageList: [],
          };

          REDIS_KEY_PATTERNS[keyPattern].count += 1;

          async.series([
            // 获取类型 / 元素数量
            function(innerCallback) {
              res.locals.cacheDB.client.type(key, function(err, cacheRes) {
                if (err) return innerCallback(err);

                var type = cacheRes;

                REDIS_KEYS[key].type = type;

                if (REDIS_KEY_PATTERNS[keyPattern].type.indexOf(type) < 0) {
                  REDIS_KEY_PATTERNS[keyPattern].type.push(type);
                }

                var typeLengthCmdMap = {
                  list: 'llen',
                  hash: 'hlen',
                  set : 'scard',
                  zset: 'zcard',
                };
                if (typeLengthCmdMap[type]) {
                  res.locals.cacheDB.run(typeLengthCmdMap[type], key, function(err, cacheRes) {
                    if (err) return innerCallback(err);

                    var elementCount = parseInt(cacheRes);

                    REDIS_KEYS[key].elementCount = elementCount;

                    if (!REDIS_KEY_PATTERNS[keyPattern].elementCountList) {
                      REDIS_KEY_PATTERNS[keyPattern].elementCountList = [];
                    }
                    REDIS_KEY_PATTERNS[keyPattern].elementCountList.push(elementCount);

                    return innerCallback();
                  })
                } else {
                  return innerCallback();
                }
              })
            },
            // 获取内存使用量
            function(innerCallback) {
              res.locals.cacheDB.run('MEMORY', 'USAGE', key, 'SAMPLES', '0', function(err, cacheRes) {
                if (err) return innerCallback(err);

                var memoryUsage = parseInt(cacheRes) || 0;

                REDIS_KEYS[key].memoryUsage = memoryUsage;
                if (REDIS_KEYS[key].elementCount) {
                  REDIS_KEYS[key].memoryUsageElement_avg = Math.round(memoryUsage / REDIS_KEYS[key].elementCount);
                }

                REDIS_KEY_PATTERNS[keyPattern].memoryUsageList.push(memoryUsage);

                return innerCallback(err);
              })
            },
          ], eachCallback);
        }, function(err) {
          if (err) return asyncCallback(err);

          // 整理数据
          var keyTypeCount = {};
          for (var key in REDIS_KEYS) {
            var keyDetail = REDIS_KEYS[key];

            keyTypeCount[keyDetail.type] = keyTypeCount[keyDetail.type] || 0;
            keyTypeCount[keyDetail.type] += 1;

            // 易读大小
            REDIS_KEYS[key].memoryUsageHuman = toolkit.byteSizeHuman(REDIS_KEYS[key].memoryUsage).toString();
          }

          for (var keyPattern in REDIS_KEY_PATTERNS) {
            if (REDIS_KEY_PATTERNS[keyPattern].type.length === 1) {
              REDIS_KEY_PATTERNS[keyPattern].type = REDIS_KEY_PATTERNS[keyPattern].type[0];
            }

            // 多个 Key 做统计
            var methods = [ 'total', 'max', 'min', 'avg', 'median', 'p99', 'p95', 'p90'];

            methods.forEach(function(method) {
              if (REDIS_KEY_PATTERNS[keyPattern].count <= 1 && method !== 'total') return;

              var memoryUsageField = `memoryUsage_${method}`;
              REDIS_KEY_PATTERNS[keyPattern][memoryUsageField] = Math.round(toolkit[method](REDIS_KEY_PATTERNS[keyPattern].memoryUsageList));
            })

            // 易读大小
            methods.forEach(function(method) {
              if (REDIS_KEY_PATTERNS[keyPattern].count <= 1 && method !== 'total') return;

              var memoryUsageField      = `memoryUsage_${method}`;
              var memoryUsageFieldHuman = `memoryUsageHuman_${method}`;
              REDIS_KEY_PATTERNS[keyPattern][memoryUsageFieldHuman] = toolkit.byteSizeHuman(REDIS_KEY_PATTERNS[keyPattern][memoryUsageField]).toString();
            })

            if (REDIS_KEY_PATTERNS[keyPattern].elementCountList) {
              methods.forEach(function(method) {
                if (REDIS_KEY_PATTERNS[keyPattern].count <= 1 && method !== 'total') return;

                var elementCountField = `elementCount_${method}`;
                REDIS_KEY_PATTERNS[keyPattern][elementCountField] = Math.round(toolkit[method](REDIS_KEY_PATTERNS[keyPattern].elementCountList));
              });
            }

            delete REDIS_KEY_PATTERNS[keyPattern].memoryUsageList;
            delete REDIS_KEY_PATTERNS[keyPattern].elementCountList;
          }

          var sortedRedisKeys = {};
          Object.keys(REDIS_KEY_PATTERNS).sort().forEach(function(key) {
            sortedRedisKeys[key] = REDIS_KEY_PATTERNS[key];
          });
          REDIS_KEY_PATTERNS = sortedRedisKeys;

          // 统计
          REDIS_ANALYSIS = {
            keyTypeCount            : toolkit.sortJSONKeys(keyTypeCount, 'DESC'),
            topKeyMemoryUsage       : toolkit.sortJSONArray(Object.values(REDIS_KEYS), 'memoryUsage', 'DESC').slice(0, topN),
            topKeyElementCount      : toolkit.sortJSONArray(Object.values(REDIS_KEYS), 'elementCount', 'DESC').slice(0, topN),
            topKeyPatternCount      : toolkit.sortJSONArray(Object.values(REDIS_KEY_PATTERNS), 'count', 'DESC').slice(0, topN),
            topKeyPatternMemoryUsage: toolkit.sortJSONArray(Object.values(REDIS_KEY_PATTERNS), 'memoryUsage_total', 'DESC').slice(0, topN),
          };

          return asyncCallback();
        });
      });
    },
  ], function(err) {
    if (err) return next(err);

    var detailedRedisReport = {
      REDIS,
      REDIS_KEY_PATTERNS,
      REDIS_ANALYSIS,
    };

    var ret = toolkit.initRet(detailedRedisReport);

    // 给用户造成较为耗时的感觉，防止用户滥用使用本功能
    setTimeout(function() {
      return res.locals.sendJSON(ret);
    }, Math.max(0, t1 + 1500 - Date.now()));
  });
};
