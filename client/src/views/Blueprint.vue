<template>
  <transition name="fade">
    <el-container direction="vertical" v-if="$store.state.isLoaded">
      <h1>蓝图 (WIP)</h1>
      <super-flow ref="superFlow"
        :graph-menu="graphMenu"
        :node-menu="nodeMenu"
        :link-menu="linkMenu"
        :enter-intercept="enterIntercept"
        :output-intercept="outputIntercept"
        :link-base-style="linkBaseStyle"
        :link-desc="linkDesc"
        :node-list="data.dataJSON.nodeList"
        :link-list="data.dataJSON.linkList">
        <template v-slot:node="{meta}">
          <el-card class="node-card" shadow="hover">
            <div class="node-type">
              <template v-if="meta.type === 'nope'">
                <span>{{ $t('Nope') }}</span>
              </template>
              <template v-if="meta.type === 'func'">
                <span>{{ $t('Func') }}</span>
              </template>
              <template v-if="meta.type === 'code'">
                <span>{{ $t('Code') }}</span>
              </template>
            </div>

            <div class="node-title">
              <span>{{ meta.title }}</span>
            </div>
          </el-card>
        </template>
      </super-flow>
    </el-container>
  </transition>
</template>

<script>
/* 声明：
 * 有关流程图的代码（super-flow）
 * 是基于开源项目（https://github.com/caohuatao/vue-super-flow）定制修改而来
 */
import SuperFlow from '@/components/SuperFlow'

export default {
  name: 'Blueprint',
  components: {
    SuperFlow,
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
    genDemoData() {
      let node1 = this.createNode('func', '来自函数库函数的节点', { x: 50, y: 100 });
      let node2 = this.createNode('code', '直接编写代码的节点', { x: 500, y: 200 });
      let node3 = this.createNode('nope', '无处理', { x: 1000, y: 150 });
      let link1 = this.createLink('nope', null, {
        startNode: node1, startAt: 'right',
        endNode  : node2, endAt  : 'left',
      });
      let link2 = this.createLink('code', '存在数据时', {
        startNode: node2, startAt: 'right',
        endNode  : node3, endAt  : 'left',
      });

      let demoData = {
        id: this.T.genDataId('blpt'),
        dataJSON: {
          nodeList: [ node1, node2, node3 ],
          linkList: [ link1, link2 ],
        }
      };

      return demoData;
    },
    async loadData() {
      let apiRes = await this.T.callAPI('/api/v1/do/ping')
      if (!apiRes.ok) return;

      this.data = this.genDemoData();

      this.$store.commit('updateLoadStatus', true);
    },
    createNode(type, title, options) {
      options = options || {};

      let meta = {
        type  : type,  // 无处理=nope, 函数=func, 代码=code
        title : title, // 展示文字
        funcId: null,  // 函数ID
        code  : null,  // 代码正文（必须包含`def main(prev_ret, **kwargs)` 函数）
        kwargs: null,  // 传参（JSON格式）
      };
      Object.assign(meta, options.meta);

      let node = {
        id        : this.T.genDataId('node'),
        width     : this.NODE_WIDTH,
        height    : this.NODE_HEIGHT,
        coordinate: [options.x || 30, options.y || 30],
        meta      : meta,
      };

      return node;
    },
    createLink(type, title, options) {
      options = options || {};

      let meta = {
        type  : type,  // 无处理=nope, 函数=func, 代码=code
        title : title, // 展示文字
        funcId: null,  // 函数ID
        code  : null,  // 代码正文（必须包含`def main(prev_ret, **kwargs)` 函数）
        kwargs: null,  // 传参（JSON格式）
      }
      Object.assign(meta, options.meta);

      function _getLinkNodePosition(node, position) {
        switch(position) {
          case 'left':
            return [ 0, node.height / 2 ];
          case 'right':
            return [ node.width, node.height / 2 ];
          case 'top':
            return [ node.width / 2, 0 ];
          case 'bottom':
            return [ node.width / 2, node.height];
        }
      }

      let link = {
        id     : this.T.genDataId('link'),
        startId: options.startNode.id,
        endId  : options.endNode.id,
        startAt: _getLinkNodePosition(options.startNode, options.startAt),
        endAt  : _getLinkNodePosition(options.endNode, options.endAt),
        meta   : meta,
      };

      return link;
    },
    enterIntercept(formNode, toNode, graph) {
      console.log('IN enterIntercept')
      return true;
    },
    outputIntercept(node, graph) {
      console.log('IN outputIntercept')
      return true;
    },
    linkDesc(link) {
      if (!link.meta) return '';

      switch(link.meta.type) {
        case 'nope':
          return '';

        case 'func':
        case 'code':
          return link.meta.title || this.$('if returns True');
      }
    }
  },
  computed: {
    NODE_WIDTH : () => 180,
    NODE_HEIGHT: () => 80,
    nodeTemplates() {
      return [
        {
          label: this.$t('Func Node'),
        }
      ]
    },
    graphMenu() {
      return [
        [
          {
            label: this.$t('Add START node'),
            disable(graph) {
              return true;
            },
          },
          {
            label: this.$t('Add FUNC node'),
            disable(graph) {
              return true;
            },
          },
          {
            label: this.$t('Add SWITCH node'),
            disable(graph) {
              return true;
            },
          },
          {
            label: this.$t('Add CUSTOM node'),
            disable(graph) {
              return true;
            },
          },
        ],
        [
          {
            label: this.$t('Print graph JSON'),
            selected: (graph, coordinate) => {
              console.log(JSON.stringify(graph.toJSON(), null, 2))
            }
          },
          {
            label: this.$t('Select all'),
            selected: (graph, coordinate) => {
              graph.selectAll();
            },
          }
        ]
      ]
    },
    nodeMenu() {
      return [
        [
          {
            label: this.$t('Delete'),
            disable: false,
            selected(node, coordinate) {
              node.remove();
            }
          }
        ],
      ];
    },
    linkMenu() {
      return [
        [
          {
            label: this.$t('Delete'),
            disable: false,
            selected: (link, coordinate) => {
              link.remove();
            }
          }
        ],
      ];
    },
    linkBaseStyle() {
      let uiColorSchema = this.$store.getters.uiColorSchema;

      switch(uiColorSchema) {
        case 'light':
          return {
            background: 'white',
          }

        case 'dark':
          return {
            background: '#222222',
          }
      }
    }
  },
  props: {
  },
  data() {
    return {
      data: {},
    }
  },
  created() {
  },
  mounted() {
    window.vmc = this;
  },
}
</script>

<style>
.node-card {
  width: 100%;
  height: 100%;
  border-width: 2px;
  box-sizing: border-box;
}
.node-card > .el-card__body {
  padding: 0;
  height: 100%;
  box-sizing: border-box;
}
.node-card .node-type {
  text-align: center;
  padding: 5px;
  color: #FF6600;
  background-color: #EEEEEE;
}
.node-card .node-title {
  text-align: center;
  font-size: 14px;
  padding: 10px 5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
