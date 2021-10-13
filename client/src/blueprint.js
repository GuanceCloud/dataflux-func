// 国际化
import app from '@/main';

const $t = function(s) {
  return app ? app.$t(s) : s;
}

export function hasConfig(type, field) {
  let configMap = {
    start : ['kwargs', 'globalVars'],
    end   : [],
    code  : ['title', 'code'],
    branch: ['title', 'code'],
  }

  if (configMap[type] && configMap[type].indexOf(field) >= 0) {
    return true;
  }
  return false;
};

function genBaseCode(nodeList, linkList) {
  // 获取开始点
  let startNode = nodeList.find(node => node.meta.type === 'start');
  let startLink = linkList.find(link => link.startId === startNode.id);

  // 生成代码
  let codeLines = [];

  // 全局变量
  if (startNode.meta.globalVars) {
    codeLines.push(`# Global Variables\n`);
    startNode.meta.globalVars.forEach(gv => {
      codeLines.push(`${gv} = None`);
    });
  }

  // 入口函数
  let funcParameterStr = '';
  let startPrevResStr  = '';
  let kwargs = startNode.meta.kwargs || [];
  if (kwargs.length > 0) {
    funcParameterStr = kwargs.map(kw => `${kw}=None`).join(', ');
    startPrevResStr  = kwargs.map(kw => `${kw}=${kw}`).join(', ');
  }
  codeLines.push(``)
  codeLines.push(`# Blueprint entry/exit\n`);
  codeLines.push(`def start(${funcParameterStr}):`);
  codeLines.push(`    # Entry of blueprint`)
  codeLines.push(`    next_node = '${startLink.endId}'`);
  codeLines.push(`    prev_res = dict(${startPrevResStr})`);
  codeLines.push(``)
  codeLines.push(`    for i in range(1000):`);
  codeLines.push(`        # Func call depth limit`);
  codeLines.push(`        next_func = _FUNC_MAP[next_node]`);
  codeLines.push(`        func_res = next_func(prev_res)`);
  codeLines.push(``)
  codeLines.push(`        if next_node == 'end':`);
  codeLines.push(`            break`);
  codeLines.push(`        else:`);
  codeLines.push(`            next_node, prev_res = func_res`);
  codeLines.push(``)
  codeLines.push(`    return prev_res`);
  codeLines.push(``)
  codeLines.push(`def end(prev_res):`);
  codeLines.push(`    # Exit of blueprint`)
  codeLines.push(`    return prev_res`)

  return codeLines.join('\n');
};

function genNodeFuncCode(nodeList, linkList) {
  // 生成代码
  let codeLines = [];

  // 节点函数
  codeLines.push(`# Node funcs\n`);
  nodeList.forEach(node => {
    if (!hasConfig(node.meta.type, 'code')) return;

    codeLines.push(`def ${node.meta.id}(prev_res):`);

    if (node.meta.title) {
      codeLines.push(`    '''`);
      codeLines.push(`    ${node.meta.title}`);
      codeLines.push(`    '''`);
    }

    (node.meta.code || genSampleCode()).split('\n').forEach(l => {
      codeLines.push('    ' + l)
    })

    codeLines.push(``);
    let outLinks = linkList.filter(link => link.startId === node.id);


    if (node.meta.type === 'branch') {
      // 分支点有两个去处
      let trueLink = outLinks.find(link => link.meta.type === 'nextOnTrue');
      if (!trueLink) {
        throw Error($t('Missing branch for True'));
      }

      let falseLink = outLinks.find(link => link.meta.type === 'nextOnFalse');
      if (!falseLink) {
        throw Error($t('Missing branch for False'));
      }

      codeLines.push(`    return '${trueLink.endId}' if entry_func(prev_res) else '${falseLink.endId}', prev_res`);

    } else {
      // 普通节点只有一个去处
      let nextLink = outLinks[0];
      if (!nextLink) {
        throw Error($t('Incomplete processing flow'));
      }

      codeLines.push(`    return '${outLinks[0].endId}', entry_func(prev_res)`);
    }
    codeLines.push(``);
  });

  return codeLines.join('\n');
};

function genLinkMapCode(nodeList) {
  // 生成代码
  let codeLines = [];

  // 节点映射表
  codeLines.push(`# Link map\n`);
  codeLines.push(`_FUNC_MAP = {`);

  nodeList.forEach(node => {
    codeLines.push(`    '${node.id}': ${node.id},`);
  });

  codeLines.push(`}`);

  return codeLines.join('\n');
};

export function genScriptCode(nodeList, linkList) {
  // 检查
  if (!nodeList || nodeList.length <= 0) return '';
  if (!linkList || linkList.length <= 0) return '';

  // 排序
  nodeList.sort((a, b) => {
    if (a.id < b.id) {
      return -1;
    } else if (a.id > b.id) {
      return 1;
    } else {
      return 0
    }
  });

  let baseCode     = genBaseCode(nodeList, linkList);
  let nodeFuncCode = genNodeFuncCode(nodeList, linkList);
  let linkMapCode  = genLinkMapCode(nodeList, linkList);

  let code = [baseCode, nodeFuncCode, linkMapCode].join('\n\n');

  return code;
};

export function genSampleCode() {
  let lines = [];
  lines.push('def entry_func(prev_res):');
  lines.push('    return prev_res');

  return lines.join('\n');
};
