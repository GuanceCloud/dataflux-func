// 国际化
import app from '@/main';
import { HtmlNode, HtmlNodeModel } from "@logicflow/core";

import * as T from '@/toolkit';
import * as common from './common';

const $t = function(s) {
  return app ? app.$t(s) : s;
}

class CodeNode extends HtmlNode {
  setHtml(rootEl) {
    const { properties } = this.props.model;

    const el = document.createElement('div');
    el.className = 'code-node';
    const html = `
      <div class="node-icon"><i class="fa fa-fw fa-code"></i></div>
      <div class="node-text">${properties.title || $t('Code')}</div>
    `;
    el.innerHTML = html;

    rootEl.innerHTML = '';
    rootEl.appendChild(el);
  }
}

class CodeNodeModel extends HtmlNodeModel {
  createId() {
    return T.genDataId('code');
  }

  setAttributes() {
    common.prepareNode(this);
  }
}

export default {
  type : 'CodeNode',
  view : CodeNode,
  model: CodeNodeModel,
};
