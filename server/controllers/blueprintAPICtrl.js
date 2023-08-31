'use strict';

/* Built-in Modules */

/* 3rd-party Modules */
var async = require('async');

/* Project Modules */
var E       = require('../utils/serverError');
var CONFIG  = require('../utils/yamlResources').get('CONFIG');
var toolkit = require('../utils/toolkit');

var blueprintMod = require('../models/blueprintMod');
var scriptSetMod = require('../models/scriptSetMod');
var scriptMod    = require('../models/scriptMod');
var funcMod      = require('../models/funcMod');

var mainAPICtrl = require('./mainAPICtrl');

/* Init */
var NODE_FUNC_IMPORTS_MAP = {
  BuiltinHashNode: function(props) {
    return [ 'hashlib' ];
  },
  BuiltinBase64Node: function(props) {
    return [ 'base64' ];
  },
  BuiltinRandomNode: function(props) {
    switch(props.randomType) {
      case 'string':
        return [ 'random', 'string' ];

      default:
        return [ 'random' ];
    }
  },
  BuiltinJSONNode: function(props) {
    return [ 'json' ];
  },
  BuiltinYAMLNode: function(props) {
    return [ 'yaml' ];
  },
  BuiltinHTTPNode: function(props) {
    return [ 'requests' ];
  },
  BuiltinDingTalkNode: function(props) {
    if (props.secret) {
      return [ 'requests', 'jinja2', 'hashlib', 'time', 'hmac', 'urllib', 'base64' ];
    } else {
      return [ 'requests', 'jinja2' ];
    }
  },
};

var NODE_FUNC_DEF_BODY_GENERATOR_MAP = {
  EntryNode: function() {
    var codeBlock = toolkit.createStringBuilder();

    codeBlock.append(`pass`);

    return codeBlock;
  },
  CodeNode: function(node) {
    var props = node.properties;

    var codeBlock = toolkit.createStringBuilder();

    // 函数注释
    if (props.title) {
      codeBlock.append(`'''`);
      codeBlock.append(props.title);
      codeBlock.append(`'''`);
    }

    // 函数体
    if (props.code) {
      codeBlock.append(props.code);
    }

    return codeBlock;
  },
  FuncNode: function(node) {
    var props = node.properties;

    var codeBlock = toolkit.createStringBuilder();

    var argumentSnippet = '';
    switch(props.parameterPassingMethod) {
      case 'passAsFirstParameter':
        argumentSnippet = `data`;
        break;

      case 'unpackAsNamedParameters':
        argumentSnippet = `**data`;
        break;

      case 'assignByName':
        var argumentAssignExprs = [];
        for (var k in props.parameterAssigningMap || {}) {
          var v = props.parameterAssigningMap[k];
          argumentAssignExprs.push(`${k}=${v}`);
        }
        argumentSnippet = argumentAssignExprs.join(', ');
        break;

      case 'noParameter':
      default:
        break;
    }

    // 函数注释
    if (props.title) {
      codeBlock.append(`'''`);
      codeBlock.append(props.title);
      codeBlock.append(`'''`);
    }

    // 函数体
    if (props.funcId) {
      if (props.outputField) {
        codeBlock.append(`data['${props.outputField}'] = ${props.funcId}(${argumentSnippet})`);
      } else {
        codeBlock.append(`${props.funcId}(${argumentSnippet})`);
      }
    }

    return codeBlock;
  },
  SwitchNode: function(node, blueprint) {
    var props = node.properties;

    // 获取分支连线映射
    var switchMap = {};
    blueprint.canvasJSON.edges.forEach(function(edge) {
      if (edge.type !== 'SwitchLine') return;
      if (edge.sourceNodeId !== node.id) return;

      var switchOrder = edge.properties.switchOrder;
      switchMap[switchOrder] = _genFuncName(edge.targetNodeId);
    });

    var codeBlock = toolkit.createStringBuilder();

    // 函数注释
    if (props.title) {
      codeBlock.append(`'''`);
      codeBlock.append(props.title);
      codeBlock.append(`'''`);
    }

    // 分支条件添加序号
    var switchItems = (props.switchItems || []).map(function(item, index) {
      item.switchOrder = index + 1;
      return item;
    });

    // 分支条件排序
    switchItems.sort(function(a, b) {
      if (a.type !== 'else' && b.type === 'else') return -1;
      else if (a.type === 'else' && b.type !== 'else') return 1;
      else {
        if (a.switchOrder < b.switchOrder) return -1;
        else if (a.switchOrder > b.switchOrder) return 1;
        else return 0;
      }
    });

    // 生成 if-else 语句
    for (var i = 0; i < switchItems.length; i++) {
      var item = switchItems[i];
      var nextNode = switchMap[item.switchOrder];
      var nextCall = `    globals()['${nextNode}'](data)`;

      if (i === 0) {
        codeBlock.append(`if ${item.expr}:`);
        codeBlock.append(nextCall);

      } else if (item.type !== 'else') {
        codeBlock.append(`elif ${item.expr}:`);
        codeBlock.append(nextCall);

      } else if (item.type === 'else') {
        codeBlock.append(`else:`);
        codeBlock.append(nextCall);

        break;
      }
    }

    return codeBlock;
  },

  BuiltinHashNode: function(node) {
    var props = node.properties;

    var codeBlock = toolkit.createStringBuilder();

    codeBlock.append(`hash = hashlib.${props.hashAlgorithm || 'md5'}`);
    codeBlock.append(`str_to_hash = str(data['${props.inputField}'])`);
    codeBlock.append(`data['${props.outputField}'] = hash(str_to_hash.encode()).hexdigest()`);

    return codeBlock;
  },
  BuiltinBase64Node: function(node) {
    var props = node.properties;

    var codeBlock = toolkit.createStringBuilder();

    codeBlock.append(`str_to_base64 = str(data['${props.inputField}'])`);
    switch(props.encodeOrDecode) {
      case 'encode':
        codeBlock.append(`data['${props.outputField}'] = base64.b64encode(str_to_base64.encode()).decode()`);
        break;

      case 'decode':
        codeBlock.append(`data['${props.outputField}'] = base64.b64decode(str_to_base64).decode()`);
        break;
    }

    return codeBlock;
  },
  BuiltinRandomNode: function(node) {
    var props = node.properties;

    var codeBlock = toolkit.createStringBuilder();

    switch(props.randomType) {
      case 'string':
        codeBlock.append(`sample = string.digits + string.ascii_letters`)
        codeBlock.append(`rand_chars = [ random.choice(sample) for i in range(${props.randomLength || 8})]`);
        codeBlock.append(`data['${props.outputField}'] = ''.join(rand_chars)`);
        break;

      case 'integer':
        codeBlock.append(`a, b = sorted([ ${props.minValue || 0}, ${props.maxValue || 100} ])`)
        codeBlock.append(`data['${props.outputField}'] = random.randint(a, b)`);
        break;

      case 'float':
        codeBlock.append(`a, b = sorted([ ${props.minValue || 0}, ${props.maxValue || 100} ])`)
        codeBlock.append(`data['${props.outputField}'] = random.uniform(a, b)`);
        break;
    }

    return codeBlock;
  },
  BuiltinJSONNode: function(node) {
    var props = node.properties;

    var codeBlock = toolkit.createStringBuilder();

    switch(props.serializeOrDeserialize) {
      case 'serialize':
        codeBlock.append(`data['${props.outputField}'] = json.dumps(data['${props.inputField}'])`);
        break;

      case 'deserialize':
        codeBlock.append(`data['${props.outputField}'] = json.loads(data['${props.inputField}'])`);
        break;
    }

    return codeBlock;
  },
  BuiltinYAMLNode: function(node) {
    var props = node.properties;

    var codeBlock = toolkit.createStringBuilder();

    switch(props.serializeOrDeserialize) {
      case 'serialize':
        codeBlock.append(`data['${props.outputField}'] = yaml.dump(data['${props.inputField}'])`);
        break;

      case 'deserialize':
        codeBlock.append(`data['${props.outputField}'] = yaml.safe_load(data['${props.inputField}'])`);
        break;
    }

    return codeBlock;
  },
  BuiltinHTTPNode: function(node) {
    var props = node.properties;

    var codeBlock = toolkit.createStringBuilder();

    switch(props.httpMethod) {
      case 'post':
      case 'put':
      case 'patch':
        codeBlock.append(`headers = { 'Content-Type': '${props.httpContentType}' }`);
        codeBlock.append(`payload = ${JSON.stringify(props.httpBody)}`);
        codeBlock.append(`resp = requests.${props.httpMethod}('${props.url}', headers=headers, data=payload)`);
        break;

      default:
        codeBlock.append(`resp = requests.${props.httpMethod}('${props.url}')`);
        break;
    }

    codeBlock.append(`resp.raise_for_status()`);

    return codeBlock;
  },
  BuiltinDingTalkNode: function(node) {
    var props = node.properties;

    var codeBlock = toolkit.createStringBuilder();

    codeBlock.append(`url = '${props.url}'`)

    if (props.secret) {
      codeBlock.append(`secret = '${props.secret}'`);
      codeBlock.append();
      codeBlock.append(`timestamp = str(round(time.time() * 1000))`);
      codeBlock.append(`secret_enc = secret.encode('utf-8')`);
      codeBlock.append(`str_to_sign_enc = f'{timestamp}\\n{secret}'.encode('utf-8')`);
      codeBlock.append(`hmac_code = hmac.new(secret_enc, str_to_sign_enc, digestmod=hashlib.sha256).digest()`);
      codeBlock.append(`sign = urllib.parse.quote_plus(base64.b64encode(hmac_code))`);
      codeBlock.append();
      codeBlock.append(`url = f'{url}&timestamp={timestamp}&sign={sign}'`);
    }

    codeBlock.append();

    switch(props.dingTalkMessageType) {
      case 'text':
        codeBlock.append(`content = ${JSON.stringify(props.content || '')}`);
        codeBlock.append(`content = jinja2.Template(content).render(**data)`);
        codeBlock.append(`payload = { "msgtype": "text", "text": { "content": content } }`);
        break;

      case 'markdown':
        var title = (props.content || '').split('\n')[0].replace(/^#+/g, '').trim();
        codeBlock.append(`title   = ${JSON.stringify(title)}`);
        codeBlock.append(`content = ${JSON.stringify(props.content || '')}`);
        codeBlock.append(`content = jinja2.Template(content).render(**data)`);
        codeBlock.append(`payload = { "msgtype": "markdown", "markdown": { "title": title, "text": content } }`);
        break;

      case 'json':
        codeBlock.append(`payload = ${JSON.stringify(props.httpBody)}`);
        codeBlock.append(`payload = jinja2.Template(payload).render(**data)`);
        break;
    }

    codeBlock.append(`resp = requests.post(url, json=payload)`)
    codeBlock.append(`resp.raise_for_status()`);

    return codeBlock;
  },
};

/* Handlers */
var crudHandler = exports.crudHandler = blueprintMod.createCRUDHandler();

exports.list   = crudHandler.createListHandler();
exports.add    = crudHandler.createAddHandler();
exports.modify = crudHandler.createModifyHandler();
exports.delete = crudHandler.createDeleteHandler();

exports.deploy = function(req, res, next) {
  var id = req.params.id;

  var blueprintModel = blueprintMod.createModel(res.locals);
  var scriptSetModel = scriptSetMod.createModel(res.locals);
  var scriptModel    = scriptMod.createModel(res.locals);
  var funcModel      = funcMod.createModel(res.locals);

  var blueprintScriptSetId = `blueprint_${id}`;
  var blueprintScriptId    = `${blueprintScriptSetId}__main`;
  var blueprint            = null;
  var nextAPIFuncs         = null;

  async.series([
    // 获取蓝图画布数据
    function(asyncCallback) {
      blueprintModel.getWithCheck(id, [ 'id', 'title', 'canvasJSON' ], function(err, dbRes) {
        if (err) return asyncCallback(err);

        blueprint = dbRes;

        return asyncCallback();
      });
    },
    // 清理旧数据
    function(asyncCallback) {
      scriptSetModel.delete(blueprintScriptSetId, asyncCallback);
    },
    // 创建脚本集
    function(asyncCallback) {
      var _data = {
        id      : blueprintScriptSetId,
        title   : blueprint.title,
        origin  : 'blueprint',
        originId: blueprint.id,
      };
      scriptSetModel.add(_data, asyncCallback);
    },
    // 创建脚本
    function(asyncCallback) {
      var blueprintCode = generateBlueprintCode(blueprint);
      var _data = {
        id       : blueprintScriptId,
        code     : blueprintCode,
        codeDraft: blueprintCode,
      };
      scriptModel.add(_data, asyncCallback);
    },
    // 发送脚本代码预检查任务
    function(asyncCallback) {
      var opt = {
        scriptId: blueprintScriptId,
      }
      mainAPICtrl.callFuncDebugger(res.locals, opt, function(err, taskResp) {
        if (err) return asyncCallback(err);

        if (taskResp.result.status === 'failure') {
          return asyncCallback(new E('EBlueprintDeployFailed', 'Blueprint deploying failed. Please check your configuration', taskResp));
        }

        nextAPIFuncs = taskResp.result.apiFuncs;

        return asyncCallback();
      });
    },
    // 更新函数
    function(asyncCallback) {
      if (toolkit.isNothing(nextAPIFuncs)) return asyncCallback();

      funcModel.update(blueprintScriptId, nextAPIFuncs, asyncCallback);
    },
  ], function(err) {
    if (err) return next(err);

    var ret = toolkit.initRet({
      scriptSetId: blueprintScriptSetId,
      scriptId   : blueprintScriptId,
    });
    return res.locals.sendJSON(ret);
  });
};

function _genFuncName(nodeId) {
  return nodeId.replaceAll('-', '_').toLowerCase();
}

function _indentCodeBlock(s, indent) {
  return s.split('\n').map(function(line) {
    return `${' '.repeat(indent || 4)}${line}`.trimEnd();
  }).join('\n');
};

function _genNoticeComment(blueprint) {
  var codeBlock = toolkit.createStringBuilder();
  codeBlock.append(`# 本代码由蓝图部署自动生成，请勿手工修改`);
  codeBlock.append(`# This Script is automatically generated by Blueprint deployment, please do not modify it manually`);

  return codeBlock.toString('\n');
};

function _genImportBlock(blueprint) {
  var codeBlock = toolkit.createStringBuilder();

  // 导入内置包
  var importPkgsMap = {};
  blueprint.canvasJSON.nodes.forEach(function(node) {
    var imports = NODE_FUNC_IMPORTS_MAP[node.type];
    if (toolkit.notNothing(imports)) {
      imports(node.properties).forEach(function(importPkg) {
        importPkgsMap[importPkg] = true;
      });
    }
  });

  Object.keys(importPkgsMap).sort().forEach(function(pkg) {
    codeBlock.append(`import ${pkg}`);
  });

  codeBlock.append();

  // 导入其他脚本
  var importScriptIdMap = {};
  blueprint.canvasJSON.nodes.forEach(function(node) {
    if (node.type !== 'FuncNode') return;

    var props = node.properties;
    var scriptId = props.funcId.split('.')[0];

    importScriptIdMap[scriptId] = true;
  });

  Object.keys(importScriptIdMap).sort().forEach(function(scriptId) {
    codeBlock.append(`import ${scriptId}`);
  });

  return codeBlock.toString('\n');
};

function _genNodeFuncDefBlock(blueprint) {
  var codeBlock = toolkit.createStringBuilder();
  codeBlock.append(`# 节点函数包装`);
  codeBlock.append(`# Node function wrapper`);

  blueprint.canvasJSON.nodes.sort(function(a, b) {
    if (a.id < b.id) return -1;
    else if (a.id > b.id) return 1;
    else return 0;
  }).forEach(function(node) {
    var funcDefBodyGenerator = NODE_FUNC_DEF_BODY_GENERATOR_MAP[node.type];
    if (!funcDefBodyGenerator) return;

    var funcDefBody = funcDefBodyGenerator(node, blueprint);
    if (!funcDefBody) return;

    // 函数定义
    var funcDefLine = `def ${_genFuncName(node.id)}(data):`;

    // 函数体
    funcDefBody = funcDefBody.toString('\n').trim();
    funcDefBody = _indentCodeBlock(funcDefBody);

    codeBlock.append(funcDefLine);
    codeBlock.append(funcDefBody);
    codeBlock.append();
  });

  return codeBlock.toString('\n');
};

function _genRunFunc(blueprint) {
  var codeBlock = toolkit.createStringBuilder();

  codeBlock.append(`@DFF.API(${JSON.stringify(blueprint.title || blueprint.id)})`);
  codeBlock.append(`def run():`)

  // 调用映射
  var callMap = {};
  var funcNameMaxLength = 0;
  blueprint.canvasJSON.edges.forEach(function(edge) {
    if (edge.type !== 'SimpleLine') return;

    var sourceFuncName = _genFuncName(edge.sourceNodeId);
    var targetFuncName = _genFuncName(edge.targetNodeId);
    callMap[sourceFuncName] = targetFuncName;

    if (sourceFuncName.length > funcNameMaxLength) {
      funcNameMaxLength = sourceFuncName.length;
    }
  });

  codeBlock.append(`    call_map = {`)
  for (var sourceFuncName in callMap) {
    var targetFuncName = callMap[sourceFuncName];
    var padSpaces = ' '.repeat(funcNameMaxLength - sourceFuncName.length);
    codeBlock.append(`        '${sourceFuncName}'${padSpaces}: '${targetFuncName}',`)
  }
  codeBlock.append(`    }`)

  // 根据映射表循环调用
  codeBlock.append(`
    data = {}

    next_node = 'entry'
    for i in range(1000):
        globals()[next_node](data)

        print(f'After Node ({next_node}):')
        print(f'--> data: {data}')

        next_node = call_map.get(next_node)
        if not next_node:
            return data`);

  return codeBlock.toString('\n');
};

function generateBlueprintCode(blueprint) {
  var code = [
    _genNoticeComment(blueprint),
    _genImportBlock(blueprint),
    _genNodeFuncDefBlock(blueprint),
    _genRunFunc(blueprint),
  ].filter(function(x) {
    return !!x;
  }).map(function(x) {
    return x && x.trim();
  }).join('\n\n');

  // 尾部空行
  code += '\n';

  return code;
}
