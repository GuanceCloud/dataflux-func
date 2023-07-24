// 国际化
import app from '@/main';
import { CircleNode, CircleNodeModel } from "@logicflow/core";

import * as common from './common';

const $t = function(s) {
  return app ? app.$t(s) : s;
}

class EntryNode extends CircleNode {}
class EntryNodeModel extends CircleNodeModel {
  createId() {
    return 'entry';
  }

  initNodeData(data) {
    super.initNodeData(data);
    common.prepareNode(this);

    // 固定文案
    this.text.value = $t('Entry');

    // 圆形半径
    this.r = 35;

    // 入口节点不能被指向
    this.targetRules.push({
      message: $t('Cannot point to an Entry Node'),
      validate: (sourceNode, targetNode, sourceAnchor, targetAnchor) => {
        return false;
      },
    });
  }
}

export default {
  type : 'EntryNode',
  view : EntryNode,
  model: EntryNodeModel,
};
