import { BaseNode, BaseNodeModel } from "./BaseNode";

import * as T from '@/toolkit';
import i18n from '@/i18n';

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
      <div class="node-text">${i18n.t(title)}</div>
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
