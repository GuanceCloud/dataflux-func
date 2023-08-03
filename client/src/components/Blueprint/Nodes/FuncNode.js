import { BaseNode, BaseNodeModel } from "./BaseNode";

import * as T from '@/toolkit';

// 国际化
import app from '@/main';
const $t = function(s) {
  return app ? app.$t(s) : s;
}

class FuncNode extends BaseNode {
  setHtml(rootEl) {
    const { properties } = this.props.model;

    const el = document.createElement('div');
    el.className = 'node';
    const html = `
      <div class="node-icon code-font text-info">def</div>
      <div class="node-text">${properties.title || properties.funcTitle || $t('Func')}</div>
    `;
    el.innerHTML = html;

    rootEl.innerHTML = '';
    rootEl.appendChild(el);
  }
}

class FuncNodeModel extends BaseNodeModel {
  createId() {
    return T.genBlueprintNodeId('func-node');
  }
}

export default {
  type : 'FuncNode',
  view : FuncNode,
  model: FuncNodeModel,
};
