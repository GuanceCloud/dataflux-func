import { HtmlNode, HtmlNodeModel } from "@logicflow/core";

import * as T from '@/toolkit';

// 国际化
import i18n from '@/i18n';

export class BaseNode extends HtmlNode {}

export class BaseNodeModel extends HtmlNodeModel {
  createId() {
    return T.genBlueprintNodeId('node');
  }

  setAttributes() {
    super.setAttributes();

    // 大小
    this.width = 220;
    this.height = 40;

    // 不允许文本被拖动
    this.text.draggable = false;
    // 不允许文本被编辑
    this.text.editable = false;

    // 禁止指向开始节点
    this.sourceRules.push({
      message: i18n.t('Cannot point to the Entry Node'),
      validate: (sourceNode, targetNode, sourceAnchor, targetAnchor) => {
        return targetNode.type !== 'EntryNode';
      },
    });

    // 禁止指向自己
    this.sourceRules.push({
      message: i18n.t('Cannot point to the node itself'),
      validate: (sourceNode, targetNode, sourceAnchor, targetAnchor) => {
        let isSelf = sourceNode.id === targetNode.id;

        if (isSelf) return false;
        return true;
      },
    });
  }
}
