import { BaseNode, BaseNodeModel } from "./BaseNode";

import * as T from '@/toolkit';
import i18n from '@/i18n';

class CodeNode extends BaseNode {
  setHtml(rootEl) {
    const { properties } = this.props.model;

    const el = document.createElement('div');
    el.className = 'node';
    const html = `
      <div class="node-icon"><i class="fa fa-fw fa-code"></i></div>
      <div class="node-text">${properties.title || i18n.t('Code')}</div>
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
