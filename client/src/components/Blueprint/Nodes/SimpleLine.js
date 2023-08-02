import { BaseLine, BaseLineModel } from "./BaseLine";

import * as T from '@/toolkit';

class SimpleLine extends BaseLine {}
class SimpleLineModel extends BaseLineModel {
  createId() {
    return T.genBlueprintNodeId('simple-line');
  }
}

export default {
  type : 'SimpleLine',
  view : SimpleLine,
  model: SimpleLineModel,
};
