import { BaseHalfNode, BaseHalfNodeModel } from "./BaseHalfNode";

import * as T from '@/toolkit';

// 国际化
import app from '@/main';
const $t = function(s) {
  return app ? app.$t(s) : s;
}

class SwitchNode extends BaseHalfNode {
  setHtml(rootEl) {
    const { properties } = this.props.model;

    const el = document.createElement('div');
    el.className = 'node node-half';
    const html = `
      <div class="node-icon"><i class="fa fa-fw fa-sitemap fa-rotate-270"></i></div>
      <div class="node-text">${properties.title || $t('Switch')}</div>
    `;
    el.innerHTML = html;

    rootEl.innerHTML = '';
    rootEl.appendChild(el);
  }
}

class SwitchNodeModel extends BaseHalfNodeModel {
  createId() {
    return T.genDataId('code');
  }
}

export default {
  type : 'SwitchNode',
  view : SwitchNode,
  model: SwitchNodeModel,
};
