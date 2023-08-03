import { BaseNode, BaseNodeModel } from "./BaseNode";

import * as T from '@/toolkit';

// 国际化
import app from '@/main';
const $t = function(s) {
  return app ? app.$t(s) : s;
}

class BuiltinYAMLNode extends BaseNode {
  setHtml(rootEl) {
    const { properties } = this.props.model;

    const el = document.createElement('div');
    el.className = 'node';

    let title = 'YAML';
    switch(properties.serializeOrDeserialize) {
      case 'serialize':
        title = 'Dump YAML';
        break;

      case 'deserialize':
        title = 'Load YAML';
        break;
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

class BuiltinYAMLNodeModel extends BaseNodeModel {
  createId() {
    return T.genBlueprintNodeId('builtin-yaml-node');
  }
}

export default {
  type : 'BuiltinYAMLNode',
  view : BuiltinYAMLNode,
  model: BuiltinYAMLNodeModel,
};
