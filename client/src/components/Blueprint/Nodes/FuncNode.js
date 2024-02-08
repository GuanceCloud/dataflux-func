import { BaseNode, BaseNodeModel } from "./BaseNode";

import * as T from '@/toolkit';
import i18n from '@/i18n';

class FuncNode extends BaseNode {
  setHtml(rootEl) {
    const { properties } = this.props.model;

    const el = document.createElement('div');
    el.className = 'node';
    const html = `
      <div class="node-icon code-font text-info">def</div>
      <div class="node-text">${properties.title || properties.funcTitle || i18n.t('Func')}</div>
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
