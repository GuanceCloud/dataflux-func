import { BezierEdge, BezierEdgeModel } from "@logicflow/core";

import * as T from '@/toolkit';

export class BaseLine extends BezierEdge {}
export class BaseLineModel extends BezierEdgeModel {
  createId() {
    return T.genBlueprintNodeId('line');
  }

  initEdgeData(data) {
    super.initEdgeData(data);

    // 不允许文本被拖动
    this.text.draggable = false;
    // 不允许文本被编辑
    this.text.editable = false;

    // 开启动画
    this.isAnimation = true;
  }

  // 动画线条
  getEdgeAnimationStyle() {
    const style = super.getEdgeAnimationStyle();

    style.stroke            = '#777';
    style.strokeDasharray   = '10 5';
    style.animationDuration = '200s';

    return style;
  }

  // 文本样式
  getTextStyle() {
    const style = super.getTextStyle();

    // 大小
    style.fontSize = 16;
    // 颜色
    style.color = '#FF6600';

    return style;
  }

  // 保存锚点信息
  getData() {
    const data = super.getData();

    data.sourceAnchorId = this.sourceAnchorId;
    data.targetAnchorId = this.targetAnchorId;

    return data;
  }
}
