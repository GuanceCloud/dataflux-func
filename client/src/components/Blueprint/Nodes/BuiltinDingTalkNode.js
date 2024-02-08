import { BaseNode, BaseNodeModel } from "./BaseNode";

import * as T from '@/toolkit';
import i18n from '@/i18n';

class BuiltinDingTalkNode extends BaseNode {
  setHtml(rootEl) {
    const { properties } = this.props.model;

    const el = document.createElement('div');
    el.className = 'node';

    let title = 'DingTalk Robot';
    switch(properties.dingTalkMessageType) {
      case 'text':
        title = `DingTalk Text Message`;
        break;

      case 'markdown':
        title = `DingTalk MD Message`;
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

class BuiltinDingTalkNodeModel extends BaseNodeModel {
  createId() {
    return T.genBlueprintNodeId('builtin-dingtalk-node');
  }
}

export default {
  type : 'BuiltinDingTalkNode',
  view : BuiltinDingTalkNode,
  model: BuiltinDingTalkNodeModel,
};
