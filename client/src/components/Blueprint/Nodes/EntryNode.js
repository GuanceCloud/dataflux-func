import { BaseHalfNode, BaseHalfNodeModel } from "./BaseHalfNode";

import * as T from '@/toolkit';
import i18n from '@/i18n';

class EntryNode extends BaseHalfNode {
  setHtml(rootEl) {
    const { properties } = this.props.model;

    const el = document.createElement('div');
    el.className = 'node node-half';
    const html = `
      <div class="node-icon"><i class="fa fa-fw fa-sign-in"></i></div>
      <div class="node-text">${properties.title || i18n.t('Entry')}</div>
    `;
    el.innerHTML = html;

    rootEl.innerHTML = '';
    rootEl.appendChild(el);
  }
}

class EntryNodeModel extends BaseHalfNodeModel {
  createId() {
    return 'entry-node';
  }
}

export default {
  type : 'EntryNode',
  view : EntryNode,
  model: EntryNodeModel,
};
