<i18n locale="zh-CN" lang="yaml">
Selected: 已选中
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
            <span class="header-control-left" v-if="selectedElement">
              <span>{{ $t('Selected') }}{{ $t(':') }} {{ selectedElement.type }} {{ selectedElement.id }}</span>
              <el-button size="mini" plain type="primary">按钮</el-button>
              <el-button size="mini" plain type="primary">按钮</el-button>
              <el-button size="mini" plain type="primary">按钮</el-button>
            </span>
          </span>
        </div>
      </el-header>

      <!-- 画布区 -->
      <div id="logicFlow" ref="logicFlow"></div>

    </el-container>
  </transition>
</template>

<script>
import LogicFlow from '@logicflow/core'
import { Menu, Snapshot, MiniMap } from '@logicflow/extension'
import '@logicflow/core/dist/style/index.css'
import '@logicflow/extension/lib/style/index.css'

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
      x: 200, y: 100,
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

      // 连线后
      this.logicFlow.on('edge:add', ({ data }) => {
        // 防止重复连线
        let lines = this.logicFlow.getNodeOutgoingEdge(data.sourceNodeId);
        lines.forEach(line => {
          if (line.id !== data.id && line.targetNodeId === data.targetNodeId) {
            this.logicFlow.deleteEdge(line.id);
          }
        });
      });

      // 禁止连线
      this.logicFlow.on('connection:not-allowed', ({ data, msg }) => {
        console.log(msg);
      });

      // 元素点击
      this.logicFlow.on('element:click', ({ data }) => {
        // 记录被选择的元素
        this.selectedElement = data;
      });

      // 画布点击
      this.logicFlow.on('blank:click', () => {
        // 清除被选择的元素
        this.selectedElement = null;
      });
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

        // 连线类型
        edgeType: 'Line',

        // 允许调整连线起始点
        adjustEdgeStartAndEnd: true,

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
        }
      }
    },
  },
  props: {
  },
  data() {
    return {
      logicFlow: null,

      data: {},

      selectedElement: null,
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
#logicFlow {
  width: 100%;
  height: 100%;
}
</style>

<style>
#logicFlow {
  .code-node,
  .func-node {
    width: 218px;
    height: 38px;
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
    font-size: 18px;
  }
  .node-text {
    color: #FF6600;
    width: 150px;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: auto;
  }
}
</style>
