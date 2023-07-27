<i18n locale="zh-CN" lang="yaml">
  Undo    : 撤销
  Redo    : 重做
  Reset   : 重置

  Zoom In : 放大
  Zoom Out: 缩小
  Fit View: 适合大小
  Add Node: 添加节点

  Selected: 已选中
  Open Setting Panel: 打开设置面板

  Cannot point to an Entry Node: 不能指向一个入口节点
</i18n>

<template>
  <transition name="fade">
    <el-container direction="vertical" v-show="$store.state.isLoaded">
      <!-- 标题区 -->
      <el-header height="60px">
        <div class="list-page-header">
          <span>
            {{ $t('Blueprint') }}
            <span class="text-main">{{ data.title || data.id }}</span>
            &#12288;
            <span class="header-control-left">
              <el-button-group>
                <el-tooltip effect="dark" :content="$t('Undo')" placement="bottom">
                  <el-button size="mini" plain :disabled="!undoAble" @click="canvasAction('undo')">
                    <i class="fa fa-fw fa-undo"></i>
                  </el-button>
                </el-tooltip>
                <el-tooltip effect="dark" :content="$t('Redo')" placement="bottom">
                  <el-button size="mini" plain :disabled="!redoAble" @click="canvasAction('redo')">
                    <i class="fa fa-fw fa-repeat"></i>
                  </el-button>
                </el-tooltip>
              </el-button-group>
              &nbsp;
              <el-button-group>
                <el-tooltip effect="dark" :content="$t('Zoom In')" placement="bottom">
                  <el-button size="mini" @click="canvasAction('zoomIn')">
                    <i class="fa fa-fw fa-plus"></i>
                  </el-button>
                </el-tooltip>
                <el-tooltip effect="dark" :content="$t('Reset')" placement="bottom">
                  <el-button size="mini" @click="canvasAction('resetZoom')" style="width: 70px">
                    {{ parseInt(currentScale * 100) }}%
                  </el-button>
                </el-tooltip>
                <el-tooltip effect="dark" :content="$t('Zoom Out')" placement="bottom">
                  <el-button size="mini" @click="canvasAction('zoomOut')">
                    <i class="fa fa-fw fa-minus"></i>
                  </el-button>
                </el-tooltip>
                <el-button size="mini" @click="canvasAction('fitView')">
                  <i class="fa fa-fw fa-window-maximize"></i>
                  {{ $t('Fit View') }}
                </el-button>
              </el-button-group>

              &#12288;
              <template v-if="selectedElementData">
                <span>{{ $t('Selected') }}{{ $t(':') }}</span>
                <strong class="text-main">{{ C.BLUEPRINT_NODE_TYPE_MAP.get(selectedElementData.type).name }}</strong>
                &nbsp;
                <el-button v-if="selectedElementCan('openProps')"
                  size="mini"
                  type="primary" plain
                  @click="elementAction('openProps')">
                  <i class="fa fa-fw fa-sliders"></i>
                  {{ $t('Open Setting Panel') }}
                </el-button>

                <el-tooltip v-if="selectedElementCan('delete')"
                  effect="dark"
                  :content="$t('Delete')"
                  placement="bottom">
                  <el-button size="mini" @click="elementAction('delete')">
                    <i class="fa fa-fw fa-trash"></i>
                  </el-button>
                </el-tooltip>
              </template>
            </span>
          </span>
        </div>
      </el-header>

      <!-- 画布区 -->
      <div id="logicFlowContainer">
        <div id="logicFlow" ref="logicFlow"></div>
        <div id="logicFlowDnd">
          <span>{{ $t('Add Node') }}</span>

          <div class="dnd-node">
            <div class="code-node" @mousedown="canvasAction('dragAddNode', { type: 'CodeNode' })">
              <div class="node-icon"><i class="fa fa-fw fa-code"></i></div>
              <div class="node-text">{{ $t('Code Node') }}</div>
            </div>
          </div>

          <div class="dnd-node">
            <div class="func-node" @mousedown="canvasAction('dragAddNode', { type: 'FuncNode' })">
              <div class="node-icon code-font text-info">def</div>
              <div class="node-text">{{ $t('Func Node') }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 编辑弹框 -->
      <el-dialog
        :title="propSettingTitle"
        :visible.sync="showSetting"
        :close-on-click-modal="false"
        :close-on-press-escape="false"
        width="650px">
        <el-form ref="form" label-width="50px" :model="form" :rules="formRules">
          <el-form-item :label="$t('Title')" v-if="selectedElementHas('title')">
            <el-input :placeholder="$t('Optional')" v-model="form.title"></el-input>
          </el-form-item>
        </el-form>
        <div slot="footer">
          <el-button @click="showSetting = false">{{ $t('Cancel') }}</el-button>
          <el-button type="primary" @click="elementAction('setProps')">{{ $t('Save') }}</el-button>
        </div>
      </el-dialog>
    </el-container>
  </transition>
</template>

<script>
import LogicFlow from '@logicflow/core'
import '@logicflow/core/dist/style/index.css'

// 节点
import Line from '@/components/Blueprint/Nodes/Line.js';
import EntryNode from '@/components/Blueprint/Nodes/EntryNode.js';
import CodeNode from '@/components/Blueprint/Nodes/CodeNode.js';
import FuncNode from '@/components/Blueprint/Nodes/FuncNode.js';

const demoData =
{
  nodes: [
    {
      id: 'entry',
      type: 'EntryNode',
      x: 230, y: 70,
      properties: {},
    },
    {
      id: 'code-1',
      type: 'CodeNode',
      x: 500, y: 100,
      properties: {},
    },
    {
      id: 'func-1',
      type: 'FuncNode',
      x: 900, y: 100,
      properties: {},
    },
  ],
};

export default {
  name: 'BlueprintContents',
  components: {
  },
  watch: {
    $route: {
      immediate: true,
      async handler(to, from) {
        await this.loadData();
      },
    },
  },
  methods: {
    async loadData(selectBlueprintId) {
      // 获取蓝图信息
      let apiRes = await this.T.callAPI_getOne('/api/v1/blueprints/do/list', this.$route.params.id, {
        query: { _withCanvas: true },
        alert: true,
      });
      if (!apiRes || !apiRes.ok) return;

      this.data = apiRes.data;

      this.initCanvas();
      this.initCanvasEvent();

      this.$store.commit('updateLoadStatus', true);
    },

    initCanvas() {
      // 初始化 LogicFlow
      this.logicFlow = new LogicFlow(this.canvasConfig);

      // 限制缩放大小
      this.logicFlow.setZoomMaxSize(3);
      this.logicFlow.setZoomMiniSize(0.4);

      // 注册组件
      this.logicFlow.batchRegister([
        Line,
        EntryNode,
        CodeNode,
        FuncNode,
      ]);

      // 渲染
      this.logicFlow.render(demoData);
    },
    initCanvasEvent() {
      if (!this.logicFlow) return;

      // 添加节点、双击元素后打开设置界面
      this.logicFlow.on('node:dnd-add,node:dbclick,edge:dbclick', ({ data }) => {
        // 选中元素
        this.logicFlow.selectElementById(data.id);

        // 记录新创建的元素
        this.selectedElement = this.logicFlow.getModelById(data.id);

        // 打开设置界面
        this.elementAction('openProps');
      });

      // 元素连线后
      this.logicFlow.on('edge:add', ({ data }) => {
        // 防止重复连线
        let sourceNode = this.logicFlow.getNodeDataById(data.sourceNodeId);

        if (sourceNode.type === 'SwitchNode') {
          // Switch 节点允许多个出线

        } else {
          // 其他节点不允许多个出线
          let lines = this.logicFlow.getNodeOutgoingEdge(data.sourceNodeId);
          lines.forEach(line => {
            if (line.id !== data.id) {
              this.logicFlow.deleteEdge(line.id);
            }
          });
        }
      });

      // 禁止连线
      this.logicFlow.on('connection:not-allowed', ({ data, msg }) => {
        console.log(msg);
      });

      // 元素点击
      this.logicFlow.on('element:click', ({ data }) => {
        // 记录选中元素
        this.selectedElement = this.logicFlow.getModelById(data.id);
      });

      // 画布点击
      this.logicFlow.on('blank:click', () => {
        // 清除被选择的元素
        this.selectedElement = null;
      });

      // 历史记录
      this.logicFlow.on('history:change', ({ data }) => {
        this.redoAble = data.redoAble;
        this.undoAble = data.undoAble;
      });
    },

    selectedElementHas(prop) {
      if (!this.selectedElement) return false;
      return this.C.BLUEPRINT_NODE_TYPE_MAP.get(this.selectedElement.type).props.indexOf(prop) >= 0;
    },
    selectedElementCan(action) {
      if (!this.selectedElement) return false;
      return this.elementActionMap[action].indexOf(this.selectedElement.type) >= 0;
    },

    elementAction(action) {
      if (!this.selectedElement || !this.selectedElementCan(action)) return;

      let elementType = this.C.BLUEPRINT_NODE_TYPE_MAP.get(this.selectedElementData.type);
      let elementProps = this.selectedElement.getProperties();

      switch(action) {
        case 'openProps':
          let currentProps = {}
          elementType.props.forEach(prop => {
            currentProps[prop] = elementProps[prop] || null;
          });

          this.form = currentProps;

          this.showSetting = true;
          break;

        case 'setProps':
          let nextProps = {};
          elementType.props.forEach(prop => {
            nextProps[prop] = this.form[prop] || null;
          });

          this.selectedElement.setProperties(nextProps);

          this.showSetting = false;
          break;

        case 'delete':
          this.logicFlow.deleteElement(this.selectedElementData.id);
          this.selectedElementData = null;
          break;

        default:
          return;
      }
    },
    canvasAction(action, options) {
      // 缩放刻度
      let zoomInterval = 0.2;

      // 当前缩放、移动
      let currentTransform = this.logicFlow.getTransform();

      // 缩放中心点
      let zoomBasePoint = this.logicFlow.getPointByClient(
        this.$refs.logicFlow.offsetWidth / 2,
        this.$refs.logicFlow.offsetHeight / 2).canvasOverlayPosition;
      zoomBasePoint = [ zoomBasePoint.x, zoomBasePoint.y ];

      switch(action) {
        case 'undo':
          this.logicFlow.undo();
          break;

        case 'redo':
          this.logicFlow.redo();
          break;

        case 'zoomIn':
          this.logicFlow.zoom(this.currentScale + zoomInterval, zoomBasePoint);
          break;

        case 'zoomOut':
          this.logicFlow.zoom(this.currentScale - zoomInterval, zoomBasePoint);
          break;

        case 'resetZoom':
          this.logicFlow.zoom(1, zoomBasePoint);
          break;

        case 'fitView':
          this.logicFlow.fitView(100, 100);
          break;

        case 'dragAddNode':
          this.logicFlow.dnd.startDrag(options);
          break;

        default:
          return;
      }
    },
  },
  computed: {
    canvasConfig() {
      let backgroundColor = '#FFF';
      let gridColor       = '#EEE';
      let nodeStroke      = '#FF6600';
      let nodeFill        = '#FDF5EF';
      if (this.$store.getters.uiColorSchema === 'dark') {
        backgroundColor = '#000';
        gridColor       = '#222';
        nodeStroke      = '#FF6600';
        nodeFill        = '#222';
      }

      return {
        container: this.$refs.logicFlow,

        // 开启动画
        animation: true,

        // 连线类型
        edgeType: 'Line',

        // 允许调整连线起始点
        adjustEdgeStartAndEnd: true,
        // 禁止鼠标滚动画布
        stopScrollGraph: true,

        // 背景
        background: {
          backgroundColor: backgroundColor,
        },

        // 网格
        grid: {
          size   : 10,
          visible: true,
          type   : 'dot',
          config: {
            color    : gridColor,
            thickness: 1,
          },
        },

        // 样式
        style: {
          // 对齐辅助线
          snapline: {
            stroke     : 'red',
            strokeWidth: 1,
          },
          // 锚点
          anchorLine: {
            stroke         : 'red',
            strokeDasharray: '10 5',
          },
          // 连线
          bezier: {
            strokeWidth: 3,
            adjustLine: {
              stroke: 'red',
            },
            adjustAnchor: {
              r     : 5,
              fill  : 'red',
              stroke: 'red',
            },
          },
          // 节点
          baseNode: {
            stroke     : nodeStroke,
            strokeWidth: 1,
            fill       : nodeFill,
            cursor     : 'move',
          },
          // 节点文本
          nodeText: {
            fontSize    : 16,
            color       : '#FF6600',
            overflowMode: 'ellipsis',
          },
          // 选中框
          outline: {
            fill: 'transparent',
            stroke: 'red',
            strokeWidth: 2,
            strokeDasharray: '5 5',
            hover: {
              stroke: 'red',
              strokeWidth: 2,
            },
          },
        }
      }
    },
    currentScale() {
      if (!this.logicFlow) return 1;
      return this.logicFlow.getTransform().SCALE_X;
    },
    selectedElementData() {
      if (!this.selectedElement) return null;
      return this.selectedElement.getData();
    },
    elementActionMap() {
      return {
        'openProps': [ 'CodeNode', 'FuncNode', 'Line' ],
        'setProps' : [ 'CodeNode', 'FuncNode', 'Line' ],
        'delete'   : [ 'CodeNode', 'FuncNode', 'Line' ],
      }
    },

    propSettingTitle() {
      if (!this.selectedElementData) return '';

      return this.C.BLUEPRINT_NODE_TYPE_MAP.get(this.selectedElementData.type).name;
    },
  },
  props: {
  },
  data() {
    return {
      logicFlow: null,

      data: {},

      selectedElement: null,

      undoAble   : false,
      redoAble   : false,
      showSetting: false,

      form: {
      },
      formRules: {
      },
    }
  },
  mounted() {
    window.vmc = this;
  },
  beforeDestroy() {
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
#logicFlowContainer {
  width: 100%;
  height: 100%;
  position: relative;
}
#logicFlow {
  width: 100%;
  height: 100%;
}
</style>

<style>
.lf-drag-able {
  cursor: grab;
}

#logicFlow,
#logicFlowDnd {
  .code-node,
  .func-node {
    border: 1px solid #FF6600;
    display: flex;
    flex-direction: row;
    align-items: center;
    flex-wrap: nowrap;
    background-color: #FDF5EF;
  }

  .code-node {
    border-radius: 5px;
  }
  .func-node {
    border-radius: 20px;
  }

  .node-icon {
    color: #FF6600;
    margin: 0 10px;
  }
  .node-text {
    color: #FF6600;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: auto;
  }
}

#logicFlow {
  .code-node,
  .func-node {
    width: 218px;
    height: 38px;
  }

  .node-icon {
    font-size: 18px;
  }
  .node-text {
    font-size: 16px;
    width: 150px;
  }
}

#logicFlowDnd {
  user-select: none;
  position: absolute;
  top: 20px;
  left: 10px;
  padding: 15px 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  border: 1px solid #ccc;
  border-radius: 5px;
  background: white;

  .code-node,
  .func-node {
    width: 110px;
    height: 28px;
  }

  .node-icon {
    font-size: 12px;
  }
  .node-text {
    font-size: 12px;
    width: 150px;
  }
  .dnd-node {
    cursor: copy;
    margin-top: 15px;
  }
}
</style>
