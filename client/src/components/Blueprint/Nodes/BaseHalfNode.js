import { BaseNode, BaseNodeModel } from "./BaseNode";

import * as T from '@/toolkit';

export class BaseHalfNode extends BaseNode {}

export class BaseHalfNodeModel extends BaseNodeModel {
  createId() {
    return T.genBlueprintNodeId('half-node');
  }

  setAttributes() {
    super.setAttributes();

    // 大小
    this.width = 120;
    this.height = 40;
  }
}
