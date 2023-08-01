import { BaseNode, BaseNodeModel } from "./BaseNode";

import * as T from '@/toolkit';

// 国际化
import app from '@/main';
const $t = function(s) {
  return app ? app.$t(s) : s;
}

class BuiltinHashNode extends BaseNode {
  setHtml(rootEl) {
    const { properties } = this.props.model;

    const el = document.createElement('div');
    el.className = 'node';

    let title = 'Hash';
    if (properties.hashAlgorithm) {
      title = `Get ${properties.hashAlgorithm.toUpperCase()}`;
    }

    const html = `
      <div class="node-icon"><i class="fa fa-fw fa-magic"></i></div>
      <div class="node-text">${$t(title)}</div>
    `;
    el.innerHTML = html;

    rootEl.innerHTML = '';
    rootEl.appendChild(el);
  }
}

class BuiltinHashNodeModel extends BaseNodeModel {
  createId() {
    return T.genDataId('builtin-hash-node');
  }
}

export default {
  type : 'BuiltinHashNode',
  view : BuiltinHashNode,
  model: BuiltinHashNodeModel,
};
