import { BaseLine, BaseLineModel } from "./BaseLine";

import * as T from '@/toolkit';

class SwitchLine extends BaseLine {}
class SwitchLineModel extends BaseLineModel {
  createId() {
    return T.genDataId('switch-line');
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
