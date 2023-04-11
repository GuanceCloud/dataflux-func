import app from '@/main';
import router from '@/router'
import store from './store'
import * as T from '@/toolkit'
import C from '@/const'

let FUNC_ARGUMENT_PLACEHOLDERS = store.getters.CONFIG('_FUNC_ARGUMENT_PLACEHOLDER_LIST');

export function getSelectableItems(pythonCode, scriptId) {
  if (!pythonCode) [];

  let todoItems    = [];
  let codeItems    = [];
  let commentStack = [];
  pythonCode.split('\n').forEach((l, i) => {
    let first3chars = l.slice(0, 3);
    if ([ '"""', "'''" ].indexOf(first3chars) >= 0) {
      let lastBlockCommentIndex = commentStack.lastIndexOf(first3chars);
      if (lastBlockCommentIndex >= 0) {
        commentStack = commentStack.slice(0, lastBlockCommentIndex);
      } else {
        commentStack.push(first3chars);
      }
    }

    // 位于注释内部时跳过
    if (commentStack.length > 0) return;

    try {
      // 注释项目
      C.TODO_TYPE.forEach(x => {
        let _tag = `# ${x.key}`;
        let _pos = l.indexOf(_tag);
        if (_pos >= 0) {
          let id   = `${scriptId}.__L${i}`;
          let name = (l.slice(_pos + _tag.length) || '').trim() || x.key;
          todoItems.push({
            id      : id,
            type    : 'todo',
            todoType: x.key,
            name    : name,
            line    : i,
          })
        }
      })

      // 代码项目
      if (l.indexOf('def ') === 0 && l.indexOf('def _') < 0) {
        // 函数定义
        let _parts = l.slice(4).split('(');

        let name = _parts[0];
        let id   = `${scriptId}.${name}`;

        let kwargs = _parts[1].slice(0, -2).split(',').reduce((acc, x) => {
          let k = x.trim().split('=')[0];
          if (k && k.indexOf('*') < 0) {
            acc[k] = `${k.toUpperCase()}`; // 自动填充调用参数
          }
          return acc;
        }, {});

        codeItems.push({
          id    : id,
          type  : 'def',
          name  : name,
          kwargs: kwargs,
          line  : i,
        });

      } else if (l.indexOf('class ') === 0 && l.indexOf('class _') < 0) {
        // 类定义
        let _parts = l.slice(6).split('(');

        let name = _parts[0];
        let id   = `${scriptId}.${name}`;

        codeItems.push({
          id    : id,
          type  : 'class',
          name  : name,
          line  : i,
        });
      }

    } catch(e) {
      // 忽略解析错误
    }
  });

  let selectableItems = todoItems.concat(codeItems);
  return selectableItems;
}

export async function getAPIAuthList() {
  let apiAuthList = [];

  let apiRes = await T.callAPI_getAll('/api/v1/api-auth/do/list', {
    query: { fields: ['id', 'name', 'type'] },
  });
  if (!apiRes || !apiRes.ok) return;

  apiRes.data.forEach(d => {
    apiAuthList.push(d);
  })

  return apiAuthList;
}

export async function getFuncList() {
  // 获取关联数据
  let scriptSetMap = {};
  let scriptMap    = {};
  let funcMap      = {};
  let funcs        = [];

  let apiRes = null;

  let relatedScriptSetIds = {};
  let relatedScriptIds    = {};

  // 函数
  apiRes = await T.callAPI_getAll('/api/v1/funcs/do/list', {
    query: { fields: ['id', 'scriptSetId', 'scriptId', 'title', 'definition', 'argsJSON', 'kwargsJSON', 'extraConfigJSON', 'sset_title', 'scpt_title'] },
  });
  if (!apiRes || !apiRes.ok) return;

  apiRes.data.forEach(d => {
    relatedScriptSetIds[d.scriptSetId] = true;
    relatedScriptIds[d.scriptId]       = true;
  });

  funcs = apiRes.data;

  // 脚本集
  if (T.notNothing(relatedScriptSetIds)) {
    apiRes = await T.callAPI_getAll('/api/v1/script-sets/do/list', {
      query: {
        id    : Object.keys(relatedScriptSetIds).join(','),
        fields: ['id', 'title', 'origin', 'originId'],
      },
    });
    if (!apiRes || !apiRes.ok) return;

    apiRes.data.forEach(d => {
      if (shouldScriptSetHidden(d)) return;

      scriptSetMap[d.id] = {
        label   : d.title || d.id,
        value   : d.id,
        title   : d.title,
        children: [],
      };
    });
  }

  // 脚本
  if (T.notNothing(relatedScriptIds)) {
    apiRes = await T.callAPI_getAll('/api/v1/scripts/do/list', {
      query: {
        id    : Object.keys(relatedScriptIds).join(','),
        fields: ['id', 'title', 'scriptSetId']
      },
    });
    if (!apiRes || !apiRes.ok) return;

    apiRes.data.forEach(d => {
      scriptMap[d.id] = {
        label   : d.title || d.id,
        value   : d.id,
        title   : d.title,
        children: [],
      };

      // 插入上一层"children"
      if (scriptSetMap[d.scriptSetId]) {
        scriptSetMap[d.scriptSetId].children.push(scriptMap[d.id]);
      }
    });
  }

  // 函数插入上一层"children"
  funcs.forEach(d => {
    funcMap[d.id] = {
      label          : d.title || d.definition,
      value          : d.id,
      title          : d.title,
      argsJSON       : d.argsJSON,
      kwargsJSON     : d.kwargsJSON,
      extraConfigJSON: d.extraConfigJSON,
      scriptSetId    : d.scriptSetId,
      scriptSetTitle : d.sset_title,
      scriptId       : d.scriptId,
      scriptTitle    : d.scpt_title,
    };
    T.appendSearchFields(funcMap[d.id], ['label', 'value', 'title', 'scriptSetId', 'scriptSetTitle', 'scriptId', 'scriptTitle']);

    if (scriptMap[d.scriptId]) {
      scriptMap[d.scriptId].children.push(funcMap[d.id]);
    }
  });

  let result = {
    map     : funcMap,
    cascader: Object.values(scriptSetMap),
  }

  return result;
}

export function funcCascaderFilter(node, searchText) {
  searchText = (searchText || '').toLowerCase().trim();

  if (T.isNothing(node.data.searchKeywords)) {
    return false;

  } else {
    for (let i = 0; i < node.data.searchKeywords.length; i++) {
      let keyword = node.data.searchKeywords[i].toLowerCase().trim();

      if (keyword.indexOf(searchText) >= 0) {
        return true;
      }

      if (T.stringSimilar(searchText, keyword) >= .7) {
        return true;
      }
    }
  }

  return false;
}

export function isFuncArgumentPlaceholder(v) {
  for (let i = 0; i < FUNC_ARGUMENT_PLACEHOLDERS.length; i++) {
    if (v === FUNC_ARGUMENT_PLACEHOLDERS[i]) return true;
  }
  return false;
}

export function getScriptMarketLogo(scriptMarket) {
  if (scriptMarket.type === 'git') {
    try {
      let url = new URL(scriptMarket.configJSON.url);

      let brandLogo = C.SCRIPT_MARKET_MAP.get('git').brandLogo[url.host];
      if (brandLogo) return brandLogo;

    } catch (err) {
      // Nope
    }
  }

  return C.SCRIPT_MARKET_MAP.get(scriptMarket.type).logo;
}

export function getScriptMarketClass(scriptMarket) {
  if (scriptMarket.type === 'git') {
    try {
      let url = new URL(scriptMarket.configJSON.url);

      let brandLogo = C.SCRIPT_MARKET_MAP.get('git').brandLogo[url.host];
      if (brandLogo) return `logo-${url.host.replace('.', '-')}`;

    } catch (err) {
      // Nope
    }
  }

  return `logo-${scriptMarket.type}`;
}

export function getScriptMarketName(scriptMarket) {
  if (scriptMarket.name) {
    return scriptMarket.name
  } else {
    switch(scriptMarket.type) {
      case 'git':
      case 'httpService':
        var urlObj = new URL(scriptMarket.configJSON.url);
        return `${urlObj.hostname}${urlObj.pathname}`;

      case 'aliyunOSS':
        var endpointObj = new URL(scriptMarket.configJSON.endpoint);
        return `${scriptMarket.configJSON.bucket}.${endpointObj.hostname}/${scriptMarket.configJSON.folder}`;
    }
  }
}

export function goToPIPTools(requirements) {
  let requirementsParts = [];
  for (let pkg in requirements) {
    let ver = requirements[pkg];
    requirementsParts.push(ver ? `${pkg}==${ver}` : pkg);
  };

  let requirementsLine = requirementsParts.join(' ');
  router.push({
    name: 'pip-tool',
    query: { requirements: T.getBase64(requirementsLine) },
  });
}

export async function checkScriptMarketUpdate(scriptMarketId) {
  let apiRes = await T.callAPI_get('/api/v1/script-markets/do/check-update', {
    query: { scriptMarketId: scriptMarketId },
  });
  if (!apiRes || !apiRes.ok) return;

  let nextResult = null;
  if (!scriptMarketId) {
    // 检查全部脚本市场更新
    nextResult = apiRes.data;
  } else {
    // 检查部分脚本市场更新
    nextResult = T.jsonCopy(store.state.scriptMarketCheckUpdateResult || [])
      .filter(r => {
        return scriptMarketId !== r.scriptMarketId;
      })
      .concat(apiRes.data);
  }

  store.commit('updateScriptMarketCheckUpdateResult', nextResult);
}

export function getScriptMarketUpdateBadge(scriptMarketId, scriptSetId) {
  let result = store.state.scriptMarketCheckUpdateResult || [];

  if (!result) {
    return null;
  } else if (!scriptMarketId) {
    return result.length || null;
  } else if (scriptMarketId && !scriptSetId) {
    return result.filter(r => {
      return scriptMarketId === r.scriptMarketId;
    }).length || null;
  } else if (scriptMarketId && scriptSetId) {
    return result.filter(r => {
      return scriptMarketId === r.scriptMarketId && scriptSetId === r.scriptSetId;
    }).length || null;
  }
}

export function hasNewVersion() {
  let version       = store.getters.CONFIG('VERSION');
  let latestVersion = store.state.latestVersion;
  if (!T.parseVersion(version) || !T.parseVersion(latestVersion)) return;

  return T.compareVersion(version, latestVersion) < 0 ? 1 : null;
}

export function shouldScriptSetHidden(scriptSet) {
  // 隐藏来自脚本市场脚本集
  if (!app.$root.variableConfig['OFFICIAL_SCRIPT_MARKET_SCRIPT_SET_SHOWN']
    && scriptSet.origin === 'scriptMarket' && scriptSet.originId === 'smkt-official') {
    return true;
  }

  return false;
}