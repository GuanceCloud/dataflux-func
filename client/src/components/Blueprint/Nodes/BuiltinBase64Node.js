import { BaseNode, BaseNodeModel } from "./BaseNode";

import * as T from '@/toolkit';

// 国际化
import app from '@/main';
const $t = function(s) {
  return app ? app.$t(s) : s;
}

class BuiltinBase64Node extends BaseNode {
  setHtml(rootEl) {
    const { properties } = this.props.model;

    const el = document.createElement('div');
    el.className = 'node';

    let title = 'Base64';
    switch(properties.encodeOrDecode) {
      case 'encode':
        title = 'Get Base64';
        break;

      case 'decode':
        title = 'From Base64';
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

class BuiltinBase64NodeModel extends BaseNodeModel {
  createId() {
    return T.genBlueprintNodeId('builtin-base64-node');
  }
}

export default {
  type : 'BuiltinBase64Node',
  view : BuiltinBase64Node,
  model: BuiltinBase64NodeModel,
};
