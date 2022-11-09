'use strict';

/* Builtin Modules */
var path = require('path');
var URL  = require('url').URL;

/* 3rd-party Modules */
var async     = require('async');
var simpleGit = require('simple-git');
var fs        = require('fs-extra');

/* Project Modules */
var E       = require('../utils/serverError');
var CONFIG  = require('../utils/yamlResources').get('CONFIG');
var toolkit = require('../utils/toolkit');

var scriptMarketMod = require('../models/scriptMarketMod');

/* Configure */

function _checkScriptMarketAuth(locals, type, auth, requiredFields, optionalFields, callback) {
  // 检查字段
  for (var i = 0; i < requiredFields.length; i++) {
    var f = requiredFields[i];

    if ('undefined' === typeof auth[f]) {
      return callback(new E('EClientBadRequest.InvalidScriptMarketAuthJSON', 'Invalid auth JSON', {
        requiredFields: requiredFields,
        optionalFields: optionalFields,
        missingField  : f,
      }));
    }
  }

  // TODO 尝试连接
  return callback();
};

function _getGitRepoAuthURL(scriptMarket) {
  var auth = scriptMarket.authJSON || {};
  var authURL = new URL(scriptMarket.url);
  authURL.username = auth.username || 'anonymity';
  authURL.password = auth.password || 'anonymity';

  return authURL.toString();
};

function _getGitRepoLocalAbsPath(scriptMarket) {
  var url = new URL(scriptMarket.url);
  var localAbsPath = path.join(
    CONFIG.RESOURCE_ROOT_PATH,
    CONFIG.SCRIPT_MARKET_GIT_REPO_DIR,
    url.host,
    url.pathname.replace(/\.git$/, ''));

  return localAbsPath;
};

function _genGitErrDetail(err) {
  var errorMessage = err.toString().trim().split('\n').pop();
  var errDetail = {
    message: errorMessage,
  };
  return errDetail;
};

var SCRIPT_MARKET_CHECK_AUTH_FUNC_MAP = {
  git: function(locals, auth, callback) {
    var REQUIRED_FIELDS = [];
    var OPTIONAL_FIELDS = ['username', 'password'];

    return _checkScriptMarketAuth(locals, 'git', auth, REQUIRED_FIELDS, OPTIONAL_FIELDS, callback);
  },
  aliyun_oss: function(locals, auth, callback) {
    var REQUIRED_FIELDS = [];
    var OPTIONAL_FIELDS = ['accessKeyId', 'accessKeySecret'];

    return _checkScriptMarketAuth(locals, 'aliyun_oss', auth, REQUIRED_FIELDS, OPTIONAL_FIELDS, callback);
  },
};

// 脚本市场 - 列出脚本集
var SCRIPT_MARKET_LIST_SCRIPT_SETS_FUNC_MAP = {
  git: function(locals, scriptMarket, callback) {
    return callback()
  },
  aliyun_oss: function(locals, scriptMarket, callback) {
    return callback(new E('ENotImplemented', 'This type of Script Market is not Implemented.'));
  },
};

// 脚本市场 - 加载
var SCRIPT_MARKET_LOAD_FUNC_MAP = {
  git: function(locals, scriptMarket, callback) {
    var gitURL    = _getGitRepoAuthURL(scriptMarket);
    var localPath = _getGitRepoLocalAbsPath(scriptMarket);

    // 清理目录
    fs.emptyDirSync(localPath);

    // 操作 git
    var git = simpleGit({ baseDir: localPath })
    async.series([
      // git clone
      function(asyncCallback) {
        var opt = {
          '--depth': 1,
        };
        if (scriptMarket.gitBranch) {
          opt['--branch'] = scriptMarket.gitBranch;
        }

        git.clone(gitURL, localPath, opt, function(err) {
          if (err) {
            var errDetail = _genGitErrDetail(err);
            if (errDetail.message.indexOf('--depth=1') >= 0) {
              // 空库，重新尝试
              delete opt['--depth'];
              return git.clone(gitURL, localPath, opt, asyncCallback);

            } else {
              // 非空库，直接中断
              return asyncCallback(err);
            }
          }

          return asyncCallback();
        });
      },
    ], function(err) {
      if (err) {
        return callback(new E('EBizCondition', 'Clone git repo failed', _genGitErrDetail(err)));
      }

      return callback();
    });
  },
  aliyun_oss: function(locals, scriptMarket, callback) {
    return callback(new E('ENotImplemented', 'This type of Script Market is not Implemented.'));
  },
};

// 脚本市场 - 设置所有权
var SCRIPT_MARKET_SET_OWNER_FUNC_MAP = {
  git: function(locals, scriptMarket, callback) {
    var publishToken = toolkit.getStringSign(scriptMarket.url);

    var gitURL    = _getGitRepoAuthURL(scriptMarket);
    var localPath = _getGitRepoLocalAbsPath(scriptMarket);

    // 操作 git
    var git = simpleGit({ baseDir: localPath });
    async.series([
      // git reset
      function(asyncCallback) {
        git.reset(simpleGit.ResetMode.HARD, asyncCallback);
      },
      // git clean
      function(asyncCallback) {
        git.clean(simpleGit.CleanOptions.FORCE, asyncCallback);
      },
      // git pull
      function(asyncCallback) {
        git.pull(asyncCallback);
      },
      // 检查 PublishToken
      function(asyncCallback) {
        var metaFilePath = path.join(localPath, CONFIG.SCRIPT_MARKET_META_FILE);
        var meta = fs.readJsonSync(metaFilePath, { throws: false }) || {};

        if (meta.publishToken && meta.publishToken !== publishToken) {
          // 所有权已被其他 DataFlux Func 占据
          return asyncCallback(new E('EClient', 'This Script Market is owned by others'));

        } else {
          // 尚未确定所有者，写入 PublishToken
          meta.publishToken = publishToken;
          fs.outputJson(metaFilePath, meta, asyncCallback);
        }
      },
      // git add
      function(asyncCallback) {
        git.add('.', asyncCallback);
      },
      // git commit
      function(asyncCallback) {
        git.commit('Set Publish Token', asyncCallback);
      },
      // git push / reset
      function(asyncCallback) {
        git.push(function(err) {
          if (err) {
            return git.raw('git reset --hard HEAD~1', function() {
              return asyncCallback(err);
            })
          }

          return asyncCallback();
        });
      },
    ], function(err) {
      if (err) {
        return callback(new E('EBizCondition', 'Set Publish Token failed', _genGitErrDetail(err)));
      }

      return callback();
    });
  },
  aliyun_oss: function(locals, scriptMarket, callback) {
    return callback(new E('ENotImplemented', 'This type of Script Market is not Implemented.'));
  },
};

// 脚本市场 - 放弃所有权
var SCRIPT_MARKET_UNSET_OWNER_FUNC_MAP = {
  git: function(locals, scriptMarket, callback) {
    return callback()
  },
  aliyun_oss: function(locals, scriptMarket, callback) {
    return callback(new E('ENotImplemented', 'This type of Script Market is not Implemented.'));
  },
};

// 脚本市场 - 发布
var SCRIPT_MARKET_PUBLISH_FUNC_MAP = {
  git: function(locals, scriptMarket, scriptSetId, callback) {
    return callback()
  },
  aliyun_oss: function(locals, scriptMarket, scriptSetId, callback) {
    return callback(new E('ENotImplemented', 'This type of Script Market is not Implemented.'));
  },
};

/* Handlers */
var crudHandler = exports.crudHandler = scriptMarketMod.createCRUDHandler();

exports.list = crudHandler.createListHandler();

exports.add = function(req, res, next) {
  var data = req.body.data;

  var scriptMarketModel = scriptMarketMod.createModel(res.locals);

  var newScriptMarket = null;

  async.series([
    // 检查 URL 重复
    function(asyncCallback) {
      var opt = {
        limit  : 1,
        fields : ['smkt.url'],
        filters: {
          'smkt.url': {eq: data.url},
        },
      };
      scriptMarketModel.list(opt, function(err, dbRes) {
        if (err) return asyncCallback(err);

        if (dbRes.length > 0) {
          return asyncCallback(new E('EBizCondition.DuplicatedScriptMarketURL', 'URL of Script Market already exists'));
        }

        return asyncCallback();
      });
    },
    // 检查脚本市场配置
    function(asyncCallback) {
      if (toolkit.isNothing(data.authJSON)) return asyncCallback();

      SCRIPT_MARKET_CHECK_AUTH_FUNC_MAP[data.type](res.locals, data.authJSON, asyncCallback);
    },
    // 加载脚本市场
    function(asyncCallback) {
      SCRIPT_MARKET_LOAD_FUNC_MAP[data.type](req.locals, data, asyncCallback);
    },
    // 尝试获取所有权
    function(asyncCallback) {
      SCRIPT_MARKET_SET_OWNER_FUNC_MAP[data.type](req.locals, data, function(err, _publishToken) {
        if (err) {
          // 出错表示无法获取所有权，跳过
          res.locals.logger.error(err);

        } else {
          // 成功获得所有权
          data.publishToken = _publishToken;
        }

        return asyncCallback();
      });
    },
    // 数据入库
    function(asyncCallback) {
      scriptMarketModel.add(data, function(err, _addedId, _addedData) {
        if (err) return asyncCallback(err);

        newScriptMarket = _addedData;

        return asyncCallback();
      });
    },
  ], function(err) {
    if (err) return next(err);

    var ret = toolkit.initRet({
      id: newScriptMarket.id,
    });
    return res.locals.sendJSON(ret);
  });
};

exports.delete = function(req, res, next) {
  var id = req.params.id;

  var scriptMarketModel = scriptMarketMod.createModel(res.locals);

  var scriptMarket = null;

  async.series([
    // 获取脚本市场
    function(asyncCallback) {
      scriptMarketModel.getWithCheck(id, null, function(err, dbRes) {
        if (err) return asyncCallback(err);

        scriptMarket = dbRes;

        return asyncCallback();
      });
    },
    // 放弃所有权
    function(asyncCallback) {
      if (!scriptMarket.publishToken) return asyncCallback();

      SCRIPT_MARKET_UNSET_OWNER_FUNC_MAP[scriptMarket.type](req.locals, scriptMarket, asyncCallback);
    },
    // 数据入库
    function(asyncCallback) {
      scriptMarketModel.delete(id, asyncCallback);
    },
  ], function(err) {
    if (err) return next(err);

    var ret = toolkit.initRet({
      id: id,
    });
    return res.locals.sendJSON(ret);
  });
};

exports.listScriptSets = function(req, res, next) {
  var id = req.params.id;

  var scriptMarketModel = scriptMarketMod.createModel(res.locals);

  var scriptSets   = [];
  var scriptMarket = null;
  async.series([
    // 获取脚本市场
    function(asyncCallback) {
      scriptMarketModel.getWithCheck(id, null, function(err, dbRes) {
        if (err) return asyncCallback(err);

        scriptMarket = dbRes;

        return asyncCallback();
      })
    },
    // 列出脚本市场脚本集
    function(asyncCallback) {
      SCRIPT_MARKET_LIST_SCRIPT_SETS_FUNC_MAP[scriptMarket.type](req.locals, scriptMarket, function(err, _scriptSets) {
        if (err) return asyncCallback(err);

        scriptSets = _scriptSets;

        return asyncCallback();
      });
    },
  ], function(err) {
    if (err) return next(err);

    var ret = toolkit.initRet(scriptSets);
    return res.locals.sendJSON(ret);
  });
};

exports.setOwner = function(req, res, next) {
  var id = req.params.id;

  var scriptMarketModel = scriptMarketMod.createModel(res.locals);

  var publishToken = null;
  var scriptMarket = null;
  async.series([
    // 获取脚本市场
    function(asyncCallback) {
      scriptMarketModel.getWithCheck(id, null, function(err, dbRes) {
        if (err) return asyncCallback(err);

        scriptMarket = dbRes;

        return asyncCallback();
      })
    },
    // 获取所有权
    function(asyncCallback) {
      SCRIPT_MARKET_SET_OWNER_FUNC_MAP[scriptMarket.type](req.locals, scriptMarket, function(err, _publishToken) {
        if (err) return asyncCallback(err);

        publishToken = _publishToken;

        return asyncCallback();
      });
    },
    // 更新数据库
    function(asyncCallback) {
      var _data = {
        publishToken: publishToken,
      };
      scriptMarketModel.modify(id, _data, asyncCallback);
    },
  ], function(err) {
    if (err) return next(err);

    var ret = toolkit.initRet();
    return res.locals.sendJSON(ret);
  });
};

exports.unsetOwner = function(req, res, next) {
  var id = req.params.id;

  var scriptMarketModel = scriptMarketMod.createModel(res.locals);

  var scriptMarket = null;
  async.series([
    // 获取脚本市场
    function(asyncCallback) {
      scriptMarketModel.getWithCheck(id, null, function(err, dbRes) {
        if (err) return asyncCallback(err);

        scriptMarket = dbRes;

        return asyncCallback();
      })
    },
    // 放弃所有权
    function(asyncCallback) {
      SCRIPT_MARKET_UNSET_OWNER_FUNC_MAP[scriptMarket.type](req.locals, scriptMarket, asyncCallback);
    },
    // 更新数据库
    function(asyncCallback) {
      var _data = {
        publishToken: null,
      };
      scriptMarketModel.modify(id, _data, asyncCallback);
    },
  ], function(err) {
    if (err) return next(err);

    var ret = toolkit.initRet();
    return res.locals.sendJSON(ret);
  });
};