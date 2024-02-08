import { BaseNode, BaseNodeModel } from "./BaseNode";

import * as T from '@/toolkit';
import i18n from '@/i18n';

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
      <div class="node-text">${i18n.t(title)}</div>
    `;
    el.innerHTML = html;

    rootEl.innerHTML = '';
    rootEl.appendChild(el);
  }
}

class BuiltinHashNodeModel extends BaseNodeModel {
  createId() {
    return T.genBlueprintNodeId('builtin-hash-node');
  }
}

export default {
  type : 'BuiltinHashNode',
  view : BuiltinHashNode,
  model: BuiltinHashNodeModel,
};
