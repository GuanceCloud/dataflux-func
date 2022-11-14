'use strict';

/* Builtin Modules */
var path = require('path');
var URL  = require('url').URL;

/* 3rd-party Modules */
var async     = require('async');
var simpleGit = require('simple-git');
var yaml      = require('js-yaml');
var fs        = require('fs-extra');

/* Project Modules */
var E       = require('../utils/serverError');
var CONFIG  = require('../utils/yamlResources').get('CONFIG');
var toolkit = require('../utils/toolkit');

var scriptMarketMod = require('../models/scriptMarketMod');
var scriptSetMod    = require('../models/scriptSetMod');
var scriptMod       = require('../models/scriptMod');

/* Configure */
var SCRIPT_TYPE_EXT_MAP = {
  python  : 'py',
  markdown: 'md',
};

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

function _getToken(scriptMarket) {
  return toolkit.getStringSign(scriptMarket.id);
};

function _getRemoteTokenInfo(scriptMarket) {
  var localPath = _getGitRepoLocalAbsPath(scriptMarket);

  var tokenFilePath = path.join(localPath, CONFIG.SCRIPT_MARKET_TOKEN_FILE);
  var remoteToken = null;
  try {
    remoteToken = fs.readFileSync(tokenFilePath).toString().trim();
  } catch(err) {
    // nope
  }

  var info = {
    path : tokenFilePath,
    value: remoteToken,
  }
  return info;
};

function _getGitErrDetail(err) {
  var errorMessage = err.toString().trim().split('\n').pop();
  var errDetail = {
    message: errorMessage,
  };
  return errDetail;
};

function _getDefaultReadmeContent(scriptSet) {
  function toMarkdownTextBlock(s) {
    if (toolkit.isNothing(s)) return '';
    return s.split('\n').join('  \n');
  }

  function toHTMLTextBlock(s) {
    if (toolkit.isNothing(s)) return '';
    return s.split('\n').join('<br>');
  }

  // 脚本集信息
  var content = [
    `# ${scriptSet.title || scriptSet.id}`,
    `| ID | 标题 / title | 推送时间 / Push Time |`
    + `\n|---|---|---|`
    + `\n| `
    + [
          `\`${scriptSet.id}\``,
          `${scriptSet.title || '-'}`,
          `${toolkit.getDateTimeStringCN()}`,
      ].join(' | ') + ' |',

    `## 1. 描述 / Description`,
    `${toMarkdownTextBlock(scriptSet.description) || '*没有具体描述 / No description*'}`,

    `## 2. 依赖包 / Dependency`,
    toolkit.isNothing(scriptSet.requirements)
      ? `*不需要任何依赖包 / No dependency required*`
      : `~~~text\n${scriptSet.requirements.trim()}\n~~~`,
  ].join('\n\n');

  if (toolkit.isNothing(scriptSet.scripts)) return content;

  // 脚本信息
  content += [
    `\n\n## 3. 脚本 / Scripts`,
    `本脚本集包含以下脚本：  `,
    `This Script Set contains the following Scripts:   `,
  ].join('\n\n');

  content += [
    `\n\n| # | ID | 标题 / title | MD5 | 更新时间 / Update Time |`,
    `|---|---|---|---|---|`,
  ].join('\n');

  var codeLines = 0;
  var codeChars = 0;
  scriptSet.scripts.forEach(function(s, index) {
    content += `\n| `
            + [
              `${index + 1}`,
              `\`${s.id}\``,
              `${s.title || '-'}`,
              `\`${s.codeMD5 || '-'}\``,
              `${toolkit.getDateTimeStringCN(s.updateTime)}`,
            ].join(' | ') + ' |';

    if ('string' === typeof s.code) {
      codeLines += s.code.split('\n').length;
      codeChars += s.code.length;
    }
  });

  // 统计
  content += [
    `\n\n## 4. 统计 / Statistics`,
    `本脚本集统计信息如下：  `,
    `The statistics of this Script Set are as follows:   `,
  ].join('\n\n');

  content += [
    `\n\n| 项目 / Item | 结果 / Result |`,
    `|---|---|`,
    `| 脚本数量 / Script Count  | ${scriptSet.scripts.length} |`,
    `| 脚本总行数 / Total Lines | ${codeLines} |`,
    `| 脚本总字符数 / Total Characters | ${codeChars} |`,
  ].join('\n');

  return content;
};

function _prepareGitRepo(git, callback) {
  var prevCommitId = null;
  async.series([
    // 获取 Commit ID
    function(asyncCallback) {
      git.revparse(['HEAD'], function(err, commitId) {
        prevCommitId = commitId || null;

        // 忽略空库报错
        return asyncCallback();
      })
    },
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
      if (!prevCommitId) return asyncCallback();

      git.pull(asyncCallback);
    },
  ], function(err) {
    if (err) return callback(err);
    return callback(null, prevCommitId);
  });
};

function _syncToGitRepo(git, message, callback) {
  async.series([
    // git add
    function(asyncCallback) {
      git.add('.', asyncCallback);
    },
    // git commit
    function(asyncCallback) {
      git.commit(message, asyncCallback);
    },
    // git push / reset
    function(asyncCallback) {
      git.push(function(err) {
        if (err) {
          return git.raw(['reset', '--hard', prevCommitId], function() {
            // 保证错误依旧抛出
            return asyncCallback(err);
          })
        }

        return asyncCallback();
      });
    },
  ], callback);
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
    var gitURL    = _getGitRepoAuthURL(scriptMarket);
    var localPath = _getGitRepoLocalAbsPath(scriptMarket);

    var scriptSets = [];

    // 操作 git
    var git = simpleGit({ baseDir: localPath });
    async.series([
      // 准备 Git 库
      function(asyncCallback) {
        _prepareGitRepo(git, asyncCallback);
      },
      // 读取脚本集目录
      function(asyncCallback) {
        var scriptSetBaseDir = path.join(localPath, CONFIG.SCRIPT_MARKET_SCRIPT_SET_DIR);

        fs.readdirSync(scriptSetBaseDir, { withFileTypes: true }).forEach(function(d) {
          // 忽略非目录
          if (!d.isDirectory()) return;

          // 忽略不包含 META 信息的目录
          var metaFilePath = path.join(scriptSetBaseDir, d.name, CONFIG.SCRIPT_MARKET_SCRIPT_SET_META_FILE);
          var metaData = null;
          try {
            metaData = fs.readFileSync(metaFilePath).toString().trim();
            metaData = yaml.load(metaData);

          } catch(err) {
            return;
          }

          if (metaData) {
            scriptSets.push(metaData);
          }
        });

        return asyncCallback();
      },
    ], function(err) {
      if (err) return callback(err);
      return callback(null, scriptSets);
    });
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
            var errDetail = _getGitErrDetail(err);
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
    ], callback);
  },
  aliyun_oss: function(locals, scriptMarket, callback) {
    return callback(new E('ENotImplemented', 'This type of Script Market is not Implemented.'));
  },
};

// 脚本市场 - 设置所有权
var SCRIPT_MARKET_SET_OWNER_FUNC_MAP = {
  git: function(locals, scriptMarket, callback) {
    var token     = _getToken(scriptMarket);
    var localPath = _getGitRepoLocalAbsPath(scriptMarket);

    // 操作 git
    var git = simpleGit({ baseDir: localPath });
    async.series([
      // 准备 Git 库
      function(asyncCallback) {
        _prepareGitRepo(git, asyncCallback);
      },
      // 检查并修改 Token
      function(asyncCallback) {
        var remoteTokenInfo = _getRemoteTokenInfo(scriptMarket);
        console.log(remoteTokenInfo)
        if (!remoteTokenInfo.value) {
          // 尚未确定所有者，写入 Token
          return fs.outputFile(remoteTokenInfo.path, token, asyncCallback);

        } else if (remoteTokenInfo.value === token) {
          // 已经获得所有权，中断处理
          return callback();

        } else {
          // 所有权已被其他 DataFlux Func 占据
          return asyncCallback(new E('EClient', 'The Script Market is not owned by current DataFlux Func'));
        }
      },
      // 同步至 Git
      function(asyncCallback) {
        _syncToGitRepo(git, 'Set Token', asyncCallback);
      },
    ], callback);
  },
  aliyun_oss: function(locals, scriptMarket, callback) {
    return callback(new E('ENotImplemented', 'This type of Script Market is not Implemented.'));
  },
};

// 脚本市场 - 放弃所有权
var SCRIPT_MARKET_UNSET_OWNER_FUNC_MAP = {
  git: function(locals, scriptMarket, callback) {
    var token     = _getToken(scriptMarket);
    var localPath = _getGitRepoLocalAbsPath(scriptMarket);

    // 操作 git
    var git = simpleGit({ baseDir: localPath });
    async.series([
      // 准备 Git 库
      function(asyncCallback) {
        _prepareGitRepo(git, asyncCallback);
      },
      // 检查并修改 Token
      function(asyncCallback) {
        var remoteTokenInfo = _getRemoteTokenInfo(scriptMarket);

        // 尚未获得所有权，中断处理
        if (!remoteTokenInfo.value || remoteTokenInfo.value !== token) return callback();

        // 已经获得所有权，删除 Token
        return fs.remove(remoteTokenInfo.path, asyncCallback);
      },
      // 同步至 Git
      function(asyncCallback) {
        _syncToGitRepo(git, 'Unset Token', asyncCallback);
      },
    ], callback);
  },
  aliyun_oss: function(locals, scriptMarket, callback) {
    return callback(new E('ENotImplemented', 'This type of Script Market is not Implemented.'));
  },
};

// 脚本市场 - 推送脚本集
var SCRIPT_MARKET_PUSH_FUNC_MAP = {
  git: function(locals, scriptMarket, pushContent, message, callback) {
    if (toolkit.isNothing(pushContent)) {
      return callback(new E('EClient', 'Nothing to push'));
    }

    var token     = _getToken(scriptMarket);
    var localPath = _getGitRepoLocalAbsPath(scriptMarket);

    // 操作 git
    var git = simpleGit({ baseDir: localPath });
    async.series([
      // 准备 Git 库
      function(asyncCallback) {
        _prepareGitRepo(git, asyncCallback);
      },
      // 检查 Token
      function(asyncCallback) {
        var remoteTokenInfo = _getRemoteTokenInfo(scriptMarket);

        // 所有权已被其他 DataFlux Func 占据
        if (!remoteTokenInfo.value || remoteTokenInfo.value !== token) {
          return asyncCallback(new E('EClient', 'The Script Market is not owned by current DataFlux Func'));
        }

        return asyncCallback();
      },
      // 写入待推送文件
      function(asyncCallback) {
        try {
          // 遍历脚本集
          pushContent.scriptSets.forEach(function(scriptSet) {
            var scriptSetBaseDir = path.join(localPath, CONFIG.SCRIPT_MARKET_SCRIPT_SET_DIR);

            // 创建脚本集文件夹
            var scriptSetDir = path.join(scriptSetBaseDir, scriptSet.id);
            fs.emptyDirSync(scriptSetDir);

            // 写入 README
            var defaultReadmeData = _getDefaultReadmeContent(scriptSet);
            var readmeFilePath    = path.join(scriptSetDir, CONFIG.SCRIPT_MARKET_SCRIPT_SET_README_FILE);
            fs.outputFileSync(readmeFilePath, defaultReadmeData);

            // 生成 META 内容
            var metaData = toolkit.jsonCopy(scriptSet);

            // 写入脚本文件
            metaData.scripts.forEach(function(script) {
              var filePath = null;
              var scriptName = script.id.split('__').slice(1).join('__');

              var specialType = CONFIG.SCRIPT_MARKET_SPECIAL_NAME_TYPE_MAP[scriptName];
              if (specialType && specialType === script.type) {
                // 特殊文件
                filePath = path.join(scriptSetDir, scriptName);
              } else {
                // 普通文件
                filePath = path.join(scriptSetDir, script.id);
              }

              var fileExt = SCRIPT_TYPE_EXT_MAP[script.type];
              if (fileExt) {
                filePath += '.' + fileExt;
              }

              fs.outputFileSync(filePath, script.code || '');

              // 去除 META 中代码
              delete script.code;
            });

            // 写入 META 信息
            var metaFilePath = path.join(scriptSetDir, CONFIG.SCRIPT_MARKET_SCRIPT_SET_META_FILE);
            fs.outputFileSync(metaFilePath, yaml.dump(metaData));
          });

          return asyncCallback();

        } catch(err) {
          return asyncCallback(err);
        }
      },
      // 同步至 Git
      function(asyncCallback) {
        _syncToGitRepo(git, message, asyncCallback);
      },
    ], callback);
  },
  aliyun_oss: function(locals, scriptMarket, scriptSets, message, callback) {
    return callback(new E('ENotImplemented', 'This type of Script Market is not Implemented.'));
  },
};

// 脚本市场 - 拉取脚本集
var SCRIPT_MARKET_PULL_FUNC_MAP = {
  git: function(locals, scriptMarket, pullScriptSetIds, callback) {
    if (toolkit.isNothing(pullScriptSetIds)) {
      return callback(new E('EClient', 'Nothing to pull'));
    }

    var token     = _getToken(scriptMarket);
    var localPath = _getGitRepoLocalAbsPath(scriptMarket);

    // 操作 git
    var git = simpleGit({ baseDir: localPath });
    async.series([
      // 准备 Git 库
      function(asyncCallback) {
        _prepareGitRepo(git, asyncCallback);
      },
      // 拉取脚本集
      function(asyncCallback) {

      },
    ], callback);
  },
  aliyun_oss: function(locals, scriptMarket, scriptSets, message, callback) {
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
        // 出错表示无法获取所有权，跳过
        if (err) res.locals.logger.error(err);

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
      SCRIPT_MARKET_SET_OWNER_FUNC_MAP[scriptMarket.type](req.locals, scriptMarket, asyncCallback);
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
  ], function(err) {
    if (err) return next(err);

    var ret = toolkit.initRet();
    return res.locals.sendJSON(ret);
  });
};

exports.push = function(req, res, next) {
  var id           = req.params.id;
  var scriptSetIds = req.body.scriptSetIds;
  var message      = req.body.message;

  var scriptMarketModel = scriptMarketMod.createModel(res.locals);
  var scriptSetModel    = scriptSetMod.createModel(res.locals);
  var scriptModel       = scriptMod.createModel(res.locals);

  var scriptMarket = null;
  var pushContent  = {};

  var _scriptSetMap = null;
  async.series([
    // 获取脚本市场
    function(asyncCallback) {
      scriptMarketModel.getWithCheck(id, null, function(err, dbRes) {
        if (err) return asyncCallback(err);

        scriptMarket = dbRes;

        return asyncCallback();
      })
    },
    // 获取脚本集数据
    function(asyncCallback) {
      var opt = {
        fields: [
          'sset.id',
          'sset.title',
          'sset.description',
          'sset.requirements',
          'sset.updateTime',
        ],
        filters: {
          'sset.id': { in: scriptSetIds }
        }
      }
      scriptSetModel.list(opt, function(err, dbRes) {
        if (err) return asyncCallback(err);

        pushContent.scriptSets = dbRes;
        _scriptSetMap = pushContent.scriptSets.reduce(function(acc, x) {
          acc[x.id] = x;
          return acc;
        }, {});

        return asyncCallback();
      })
    },
    // 获取脚本数据
    function(asyncCallback) {
      var opt = {
        fields: [
          'scpt.id',
          'scpt.title',
          'scpt.description',
          'scpt.publishVersion',
          'scpt.type',
          'scpt.code',
          'scpt.codeMD5',
          'scpt.updateTime',
        ],
        filters: {
          'scpt.scriptSetId': { in: scriptSetIds }
        }
      }
      scriptModel.list(opt, function(err, dbRes) {
        if (err) return asyncCallback(err);

        dbRes.forEach(function(d) {
          var scriptSetId = d.id.split('__')[0];
          if (!_scriptSetMap[scriptSetId].scripts) {
            _scriptSetMap[scriptSetId].scripts = [];
          }

          _scriptSetMap[scriptSetId].scripts.push(d);
        })

        return asyncCallback();
      })
    },
    // 发布脚本集
    function(asyncCallback) {
      SCRIPT_MARKET_PUSH_FUNC_MAP[scriptMarket.type](req.locals, scriptMarket, pushContent, message, asyncCallback);
    },
  ], function(err) {
    if (err) return next(err);

    var ret = toolkit.initRet();
    return res.locals.sendJSON(ret);
  });
};

exports.pull = function(req, res, next) {
  var id           = req.params.id;
  var scriptSetIds = req.body.scriptSetIds;

  var scriptMarketModel = scriptMarketMod.createModel(res.locals);
  var scriptSetModel    = scriptSetMod.createModel(res.locals);
  var scriptModel       = scriptMod.createModel(res.locals);

  var scriptMarket = null;
  var pullContent  = null;

  var transScope = modelHelper.createTransScope(res.locals.db);
  async.series([
    // 获取脚本市场
    function(asyncCallback) {
      scriptMarketModel.getWithCheck(id, null, function(err, dbRes) {
        if (err) return asyncCallback(err);

        scriptMarket = dbRes;

        return asyncCallback();
      })
    },
    // 获取拉取数据数据
    function(asyncCallback) {
      SCRIPT_MARKET_PULL_FUNC_MAP[scriptMarket.type](req.locals, scriptMarket, scriptSetIds, function(err, _pullContent) {
        if (err) return asyncCallback(err);

        pullContent = _pullContent;

        return asyncCallback();
      });
    },
    function(asyncCallback) {
      transScope.start(asyncCallback);
    },
    // 脚本集数据入库
    function(asyncCallback) {
    },
    // 脚本数据入库
    function(asyncCallback) {
    },
  ], function(err) {
    transScope.end(err, function(scopeErr) {
      if (scopeErr) return next(scopeErr);

      var ret = toolkit.initRet();
      return res.locals.sendJSON(ret);
    });
  });
};