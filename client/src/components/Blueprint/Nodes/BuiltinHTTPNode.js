import { BaseNode, BaseNodeModel } from "./BaseNode";

import * as T from '@/toolkit';

// 国际化
import app from '@/main';
const $t = function(s) {
  return app ? app.$t(s) : s;
}

class BuiltinHTTPNode extends BaseNode {
  setHtml(rootEl) {
    const { properties } = this.props.model;

    const el = document.createElement('div');
    el.className = 'node';

    let title = 'HTTP Request';
    if (properties.httpMethod) {
      title = `${properties.httpMethod.toUpperCase()} Request`;
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

class BuiltinHTTPNodeModel extends BaseNodeModel {
  createId() {
    return T.genBlueprintNodeId('builtin-http-node');
  }
}

export default {
  type : 'BuiltinHTTPNode',
  view : BuiltinHTTPNode,
  model: BuiltinHTTPNodeModel,
};
