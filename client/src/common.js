import store from './store'
import * as T from '@/toolkit'

let FUNC_ARGUMENT_PLACEHOLDERS = store.getters.CONFIG('_FUNC_ARGUMENT_PLACEHOLDER_LIST');

export async function getFuncList() {
  // 获取关联数据
  let scriptSetMap = {};
  let scriptMap    = {};
  let funcMap      = {};

  // 脚本集
  let apiRes = await T.callAPI_getAll('/api/v1/script-sets/do/list', {
    query: { fields: ['id', 'title'] },
  });
  if (!apiRes.ok) return;

  apiRes.data.forEach(d => {
    scriptSetMap[d.id] = {
      label   : d.title || d.id,
      value   : d.id,
      children: [],
    };
  });

  // 脚本
  apiRes = await T.callAPI_getAll('/api/v1/scripts/do/list', {
    query: { fields: ['id', 'title', 'scriptSetId'] },
  });
  if (!apiRes.ok) return;

  apiRes.data.forEach(d => {
    scriptMap[d.id] = {
      label   : d.title || d.id,
      value   : d.id,
      children: [],
    };

    // 插入上一层"children"
    if (scriptSetMap[d.scriptSetId]) {
      scriptSetMap[d.scriptSetId].children.push(scriptMap[d.id]);
    }
  });

  // 函数
  apiRes = await T.callAPI_getAll('/api/v1/funcs/do/list', {
    query: { fields: ['id', 'title', 'definition', 'scriptSetId', 'scriptId', 'argsJSON', 'kwargsJSON', 'extraConfigJSON'] },
    alert: { showError: true },
  });
  if (!apiRes.ok) return;

  apiRes.data.forEach(d => {
    funcMap[d.id] = {
      label          : d.title || d.definition,
      value          : d.id,
      argsJSON       : d.argsJSON,
      kwargsJSON     : d.kwargsJSON,
      extraConfigJSON: d.extraConfigJSON,
    };

    // 插入上一层"children"
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

export function isFuncArgumentPlaceholder(v) {
  for (let i = 0; i < FUNC_ARGUMENT_PLACEHOLDERS.length; i++) {
    if (v === FUNC_ARGUMENT_PLACEHOLDERS[i]) return true;
  }
  return false;
}

export function containsFuncArgumentPlaceholder(s) {
  for (let i = 0; i < FUNC_ARGUMENT_PLACEHOLDERS.length; i++) {
    if (s.indexOf(FUNC_ARGUMENT_PLACEHOLDERS[i]) >= 0) return true;
  }
  return false;
}
