import { BaseNode, BaseNodeModel } from "./BaseNode";

import * as T from '@/toolkit';
import i18n from '@/i18n';

class BuiltinRandomNode extends BaseNode {
  setHtml(rootEl) {
    const { properties } = this.props.model;

    const el = document.createElement('div');
    el.className = 'node';

    let title = 'Random';
    switch(properties.randomType) {
      case 'string':
        title = 'Gen Random String';
        break;

      case 'integer':
        title = 'Gen Random Integer';
        break;

      case 'float':
        title = 'Gen Random Float';
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

class BuiltinRandomNodeModel extends BaseNodeModel {
  createId() {
    return T.genBlueprintNodeId('builtin-random-node');
  }
}

export default {
  type : 'BuiltinRandomNode',
  view : BuiltinRandomNode,
  model: BuiltinRandomNodeModel,
};
