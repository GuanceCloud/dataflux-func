// 国际化
import app from '@/main';
import { HtmlNode, HtmlNodeModel } from "@logicflow/core";

import * as T from '@/toolkit';
import * as common from './common';

const $t = function(s) {
  return app ? app.$t(s) : s;
}

class FuncNode extends HtmlNode {
  setHtml(rootEl) {
    const { properties } = this.props.model;

    const el = document.createElement('div');
    el.className = 'func-node';
    const html = `
      <div class="node-icon code-font text-info">def</div>
      <div class="node-text">${$t('My Func')}</div>
    `;
    el.innerHTML = html;

    rootEl.innerHTML = '';
    rootEl.appendChild(el);
  }
}

class FuncNodeModel extends HtmlNodeModel {
  createId() {
    return T.genDataId('func');
  }

  setAttributes() {
    common.prepareNode(this);
  }
}

export default {
  type : 'FuncNode',
  view : FuncNode,
  model: FuncNodeModel,
};
