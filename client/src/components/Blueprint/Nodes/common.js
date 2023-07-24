import app from '@/main';

const $t = function(s) {
  return app ? app.$t(s) : s;
}

export function prepareNode(node) {
  // 长、宽、锚点
  switch(node.type) {
    case 'CodeNode':
    case 'FuncNode':
      node.width = 220;
      node.height = 40;
      node.anchorsOffset = [
        [ node.width / 2, 0 ],
        [ 0, node.height / 2 ],
        [ -node.width / 2, 0 ],
        [0, -node.height / 2 ],
      ];
      break;

  }

  // 不允许文本被拖动
  node.text.draggable = false;
  // 不允许文本被编辑
  node.text.editable = false;

  // 禁止指向自己
  node.sourceRules.push({
    message: $t('Cannot point to the node itself'),
    validate: (sourceNode, targetNode, sourceAnchor, targetAnchor) => {
      let isSelf = sourceNode.id === targetNode.id;

      if (isSelf) return false;
      return true;
    },
  });
}
