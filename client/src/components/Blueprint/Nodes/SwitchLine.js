import { BaseLine, BaseLineModel } from "./BaseLine";

import * as T from '@/toolkit';

class SwitchLine extends BaseLine {}
class SwitchLineModel extends BaseLineModel {
  createId() {
    return T.genDataId('switch-line');
  }

  setAttributes() {
    // 业务数据分支序号展示为文本
    let _switchOrder = this.getProperties().switchOrder;
    if (T.notNothing(_switchOrder)) {
      this.updateText(` #${_switchOrder} `);
    }
  }

  // 文本样式
  getTextStyle() {
    const style = super.getTextStyle();

    style.color = '#FF6600';
    style.fontSize = 16;
    style.style = 'font-family: Iosevka; cursor: hand;';
    style.background.fill = '#FDF5EF';
    style.background.stroke = '#FF6600';
    style.background.rx = 5;
    style.background.ry = 5;
    style.background.style = 'cursor: hand;';

    return style;
  }

  // 动画线条
  getEdgeAnimationStyle() {
    const style = super.getEdgeAnimationStyle();

    style.stroke            = '#FF6600';
    style.strokeDasharray   = '10 5';
    style.animationDuration = '200s';

    return style;
  }
}

export default {
  type : 'SwitchLine',
  view : SwitchLine,
  model: SwitchLineModel,
};
