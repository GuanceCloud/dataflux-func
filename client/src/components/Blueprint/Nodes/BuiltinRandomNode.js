import { BaseNode, BaseNodeModel } from "./BaseNode";

import * as T from '@/toolkit';

// 国际化
import app from '@/main';
const $t = function(s) {
  return app ? app.$t(s) : s;
}

class BuiltinRandomNode extends BaseNode {
  setHtml(rootEl) {
    const { properties } = this.props.model;

    const el = document.createElement('div');
    el.className = 'node';

    let title = 'Random';
    switch(properties.randomType) {
      case 'string':
        title = 'Get Random String';
        break;

      case 'integer':
        title = 'Get Random Integer';
        break;

      case 'float':
        title = 'Get Random Float';
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

class BuiltinRandomNodeModel extends BaseNodeModel {
  createId() {
    return T.genDataId('builtin-random-node');
  }
}

export default {
  type : 'BuiltinRandomNode',
  view : BuiltinRandomNode,
  model: BuiltinRandomNodeModel,
};
