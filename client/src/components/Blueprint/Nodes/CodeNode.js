import { BaseNode, BaseNodeModel } from "./BaseNode";

import * as T from '@/toolkit';

// 国际化
import app from '@/main';
const $t = function(s) {
  return app ? app.$t(s) : s;
}

class CodeNode extends BaseNode {
  setHtml(rootEl) {
    const { properties } = this.props.model;

    const el = document.createElement('div');
    el.className = 'node';
    const html = `
      <div class="node-icon"><i class="fa fa-fw fa-code"></i></div>
      <div class="node-text">${properties.title || $t('Code')}</div>
    `;
    el.innerHTML = html;

    rootEl.innerHTML = '';
    rootEl.appendChild(el);
  }
}

class CodeNodeModel extends BaseNodeModel {
  createId() {
    return T.genBlueprintNodeId('code-node');
  }
}

export default {
  type : 'CodeNode',
  view : CodeNode,
  model: CodeNodeModel,
};
