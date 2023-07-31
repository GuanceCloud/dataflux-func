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
              <el-button size="mini" @click="">
                <i class="fa fa-fw fa-coffee"></i>
                {{ $t('Deploy') }}
              </el-button>
              &nbsp;
              <el-button-group>
                <el-tooltip effect="dark" :content="$t('Undo')" placement="bottom">
                  <el-button size="mini" :disabled="!undoAble" @click="canvasAction('undo')">
                    <i class="fa fa-fw fa-undo"></i>
                  </el-button>
                </el-tooltip>
                <el-tooltip effect="dark" :content="$t('Redo')" placement="bottom">
                  <el-button size="mini" :disabled="!redoAble" @click="canvasAction('redo')">
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
                <strong class="text-main">{{ C.BLUEPRINT_ELEMENT_TYPE_MAP.get(selectedElementData.type).name }}</strong>
                &nbsp;
                <el-button v-if="selectedElementCanAction('openProps')"
                  size="mini"
                  type="primary" plain
                  @click="elementAction('openProps')">
                  <i class="fa fa-fw fa-sliders"></i>
                  {{ $t('Open Setting Panel') }}
                </el-button>

                <el-tooltip v-if="selectedElementCanAction('delete')"
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
        <!-- 画布 -->
        <div id="logicFlow" ref="logicFlow"></div>

        <!-- 拖拽面板 -->
        <div id="logicFlowDnd">
          <span>{{ $t('Add Node') }}</span>

          <div class="dnd-node">
            <div class="node" @mousedown="canvasAction('dragAddNode', { type: 'CodeNode' })">
              <div class="node-icon"><i class="fa fa-fw fa-code"></i></div>
              <div class="node-text">{{ $t('Code Node') }}</div>
            </div>
          </div>

          <div class="dnd-node">
            <div class="node" @mousedown="canvasAction('dragAddNode', { type: 'FuncNode' })">
              <div class="node-icon code-font text-info">def</div>
              <div class="node-text">{{ $t('Func Node') }}</div>
            </div>
          </div>

          <div class="dnd-node">
            <div class="node" @mousedown="canvasAction('dragAddNode', { type: 'SwitchNode' })">
              <div class="node-icon"><i class="fa fa-fw fa-sitemap fa-rotate-270"></i></div>
              <div class="node-text">{{ $t('Switch Node') }}</div>
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
        width="850px">
        <el-form ref="form" label-width="80px" :model="form" :rules="formRules">
          <!-- 标题 -->
          <el-form-item :label="$t('Title')" v-if="selectedElementHasProp('title')">
            <el-input :placeholder="$t('Optional')" v-model="form.title"></el-input>
          </el-form-item>

          <!-- 代码 -->
          <el-form-item :label="$t('Code')" v-show="selectedElementHasProp('code')">
            <div id="codeContainer_BlueprintContents" :style="$store.getters.codeMirrorSettings.style">
              <textarea id="code_BlueprintContents"></textarea>
            </div>
          </el-form-item>

          <!-- 分支表达式 -->
          <el-form-item :label="$t('Expression')" v-if="selectedElementHasProp('switchExpr')">

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
import EntryNode from '@/components/Blueprint/Nodes/EntryNode.js';
import CodeNode from '@/components/Blueprint/Nodes/CodeNode.js';
import FuncNode from '@/components/Blueprint/Nodes/FuncNode.js';
import SwitchNode from '@/components/Blueprint/Nodes/SwitchNode.js';

// 线条
import SimpleLine from '@/components/Blueprint/Nodes/SimpleLine.js';
import SwitchLine from '@/components/Blueprint/Nodes/SwitchLine.js';

const demoData =
{
  nodes: [
    {
      id: 'entry',
      type: 'EntryNode',
      x: 350, y: 50,
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

      // 初始化画布
      this.initCanvas();
      this.initCanvasEvent();

      this.$store.commit('updateLoadStatus', true);
    },
    async saveData() {
      // 画布数据
      let canvasJSON = this.logicFlow.getGraphRawData();

      // 视图数据
      let currentTransform = this.logicFlow.getTransform();
      let viewJSON = {
        zoom             : currentTransform.SCALE_X,
        moveX            : currentTransform.TRANSLATE_X,
        moveY            : currentTransform.TRANSLATE_Y,
        selectedElementId: this.selectedElementData ? this.selectedElementData.id : null,
      }

      let apiRes = this.T.callAPI('post', '/api/v1/blueprints/:id/do/modify', {
        params: { id: this.$route.params.id },
        body: { data: { canvasJSON, viewJSON } },
      });
      if (!apiRes || !apiRes.ok) return;

      // Nope
    },

    initCanvas() {
      // 初始化 LogicFlow
      this.logicFlow = new LogicFlow(this.canvasConfig);

      // 限制缩放大小
      this.logicFlow.setZoomMaxSize(3);
      this.logicFlow.setZoomMiniSize(0.4);

      // 注册组件
      this.logicFlow.batchRegister([
        EntryNode,
        CodeNode,
        FuncNode,
        SwitchNode,

        SimpleLine,
        SwitchLine,
      ]);

      // 渲染
      this.logicFlow.render(this.data.canvasJSON);

      // 恢复视图
      if (this.T.notNothing(this.data.viewJSON)) {
        let viewJSON = this.data.viewJSON;

        if (viewJSON.zoom) {
          this.logicFlow.zoom(viewJSON.zoom);
        }
        if (viewJSON.moveX || viewJSON.moveY) {
          this.logicFlow.translate(viewJSON.moveX || 0, viewJSON.moveY || 0);
        }
        if (viewJSON.selectedElementId) {
          this.selectElement(viewJSON.selectedElementId);
        }
      }
    },
    initCanvasEvent() {
      if (!this.logicFlow) return;

      // 双击元素后打开设置界面
      this.logicFlow.on('node:dbclick,edge:dbclick', ({ data }) => {
        // 打开设置界面
        this.selectElement(data.id);
        this.elementAction('openProps');
      });

      // 添加节点后选中
      this.logicFlow.on('node:dnd-add', ({ data }) => {
        this.selectElement(data.id);
      });

      // 元素连线后
      this.logicFlow.on('edge:add', ({ data }) => {
        let sourceNode = this.logicFlow.getNodeDataById(data.sourceNodeId);
        let lines      = this.logicFlow.getNodeOutgoingEdge(data.sourceNodeId);

        if (sourceNode.type === 'SwitchNode') {
          // Switch 节点允许多个出线，并自动重新分配序号

          // 重复连接只保留最后一个
          lines.forEach(line => {
            if (line.id !== data.id
              && line.sourceNodeId === data.sourceNodeId
              && line.targetNodeId === data.targetNodeId) {
              this.logicFlow.deleteEdge(line.id);
            }
          });

          // 重新获取所有出线
          lines = this.logicFlow.getNodeOutgoingEdge(data.sourceNodeId);

          // 提取当前已分配的序号（从 1 开始）
          let _currentOrders = [ true ];
          lines.forEach(line => {
            let _lineProp = line.getProperties();
            let _order = _lineProp.switchOrder;
            if (this.T.notNothing(_order)) {
              _currentOrders[_order] = true;
            }
          });
          console.log(_currentOrders)

          // 补充空缺序号
          lines.forEach(line => {
            let _lineProp = line.getProperties();
            if (this.T.notNothing(_lineProp.switchOrder)) return;

            // 从空缺补充
            for (let i = 0; i <= _currentOrders.length; i++) {
              if (!_currentOrders[i]) {
                line.setProperties({ switchOrder: i });
                console.log('set text', i)
                _currentOrders[i] = true;
                break;
              }
            }
          });

        } else {
          // 其他节点只保留最后一个出线
          lines.forEach(line => {
            if (line.id !== data.id) {
              this.logicFlow.deleteEdge(line.id);
            }
          });
        }
      });

      // 禁止连线
      this.logicFlow.on('connection:not-allowed', ({ data, msg }) => {
        this.T.alert(msg, 'error');
      });

      // 元素点击
      this.logicFlow.on('element:click', ({ data }) => {
        this.selectElement(data.id);
      });

      // 画布点击
      this.logicFlow.on('blank:click', () => {
        // 清除被选择的元素
        this.selectedElement = null;
      });

      // 画布移动
      this.logicFlow.on('graph:transform', this.T.debounce(() => {
        // 触发保存
        this.logicFlow.emit('custom:save-canvas-view');
      }));

      // 历史记录
      this.logicFlow.on('history:change', ({ data }) => {
        // 记录是否可以撤销、重做
        this.redoAble = data.redoAble;
        this.undoAble = data.undoAble;

        // 触发保存
        this.logicFlow.emit('custom:save-canvas-view');
      });

      // 保存画布、视图
      this.logicFlow.on('custom:save-canvas-view', () => {
        this.saveData();
      });
    },

    selectElement(id) {
      if (!this.logicFlow) return;

      // 选中元素
      this.logicFlow.selectElementById(id);

      // 记录新创建的元素
      this.selectedElement = this.logicFlow.getModelById(id);

      // 触发保存
      this.logicFlow.emit('custom:save-canvas-view');
    },
    selectedElementHasProp(prop) {
      if (!this.selectedElement) return false;
      return this.C.BLUEPRINT_ELEMENT_TYPE_MAP.get(this.selectedElement.type).props.indexOf(prop) >= 0;
    },
    selectedElementCanAction(action) {
      if (!this.selectedElement) return false;
      return this.elementActionMap[action].indexOf(this.selectedElement.type) >= 0;
    },

    elementAction(action) {
      if (!this.selectedElement || !this.selectedElementCanAction(action)) return;

      let elementType = this.C.BLUEPRINT_ELEMENT_TYPE_MAP.get(this.selectedElementData.type);
      let elementProps = this.selectedElement.getProperties();

      switch(action) {
        case 'openProps':
          let currentProps = {}
          elementType.props.forEach(prop => {
            currentProps[prop] = elementProps[prop] || null;
          });

          this.form = currentProps;

          this.showSetting = true;

          // 加载代码
          if ('code' in currentProps) {
            setImmediate(() => {
              // 初始化代码编辑器
              if (!this.codeMirror) {
                this.codeMirror = this.T.initCodeMirror('code_BlueprintContents');
                this.codeMirror.setOption('theme', this.T.getCodeMirrorThemeName());
              }

              // 代码需要使用 CodeMirror 加载
              this.codeMirror.setValue(currentProps.code || '');
            });
          }
          break;

        case 'setProps':
          let nextProps = {};
          elementType.props.forEach(prop => {
            if (prop === 'code') {
              // 代码需要从 CodeMirror 中读取
              nextProps.code = this.codeMirror.getValue();

            } else {
              // 其他属性从 Form 中读取
              nextProps[prop] = this.form[prop] || null;
            }
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

        // 默认连线类型
        edgeType: 'SimpleLine',

        // 分支节点出线为分支连线
        edgeGenerator: (sourceNode, targetNode, currentEdge) => {
          if (sourceNode.type === 'SwitchNode') return 'SwitchLine';
        },

        // 允许调整连线起始点
        adjustEdgeStartAndEnd: false,
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
        'openProps': [ 'CodeNode', 'FuncNode' ],
        'setProps' : [ 'CodeNode', 'FuncNode' ],
        'delete'   : [ 'CodeNode', 'FuncNode', 'SimpleLine', 'SwitchLine' ],
      }
    },

    propSettingTitle() {
      if (!this.selectedElementData) return '';

      return this.C.BLUEPRINT_ELEMENT_TYPE_MAP.get(this.selectedElementData.type).name;
    },
  },
  props: {
  },
  data() {
    return {
      logicFlow : null,
      codeMirror: null,

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
    this.T.destoryCodeMirror(this.codeMirror);
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
  .node {
    border: 1px solid #FF6600;
    border-radius: 5px;
    display: flex;
    flex-direction: row;
    align-items: center;
    flex-wrap: nowrap;
    background-color: #FDF5EF;
  }

  .node-icon {
    color: #FF6600;
  }
  .node-text {
    color: #FF6600;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: auto;
  }
}

#logicFlow {
  .node {
    width: 218px;
    height: 38px;
  }

  .node.node-half {
    width: 118px;
    height: 38px;
  }

  .node-icon {
    font-size: 18px;
    width: 20px;
    margin: 0 15px;
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

  .node {
    width: 110px;
    height: 28px;
  }

  .node-icon {
    font-size: 12px;
    width: 14px;
    margin: 0px 10px;
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

#codeContainer_BlueprintContents {
  border: 1px solid #DCDFE6;
  border-radius: 3px;
}
#codeContainer_BlueprintContents .CodeMirror {
  height: 420px;
  width: auto;
}
</style>
