// 国际化
import app from '@/main';
import { BezierEdge, BezierEdgeModel } from "@logicflow/core";

import * as T from '@/toolkit';

const $t = function(s) {
  return app ? app.$t(s) : s;
}

class LineModel extends BezierEdgeModel {
  createId() {
    return T.genDataId('l');
  }

  initEdgeData(data) {
    super.initEdgeData(data);

    // 不允许文本被拖动
    this.text.draggable = false;
    // 不允许文本被编辑
    this.text.editable = false;
  }

  setAttributes() {
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

export default {
  type : 'Line',
  view : BezierEdge,
  model: LineModel,
};
