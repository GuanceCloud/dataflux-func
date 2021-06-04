<template>
  <transition name="fade">
    <el-container direction="vertical" v-if="$store.state.isLoaded">
      <h1>蓝图 (WIP)</h1>
      <super-flow ref="superFlow"
        :graph-menu="graphMenu"
        :node-menu="nodeMenu"
        :link-menu="linkMenu"
        :node-list="data.dataJSON.nodeList"
        :link-list="data.dataJSON.linkList">
        <template v-slot:node="{meta}">
          <el-card class="node-card" shadow="hover">
            <div class="node-type">
              <template v-if="meta.type === 'code'">
                <span>{{ $t('Code') }}</span>
              </template>
              <template v-if="meta.type === 'func'">
                <span>{{ $t('Func') }}</span>
              </template>
              <template v-if="meta.type === 'switch'">
                <span>{{ $t('Switch') }}</span>
              </template>
              <template v-if="meta.type === 'end'">
                <span>{{ $t('End') }}</span>
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

const nodeWidth  = 150;
const nodeHeight = 80;

const demoData = {
  id: 'blpt-001',
  dataJSON: {
    nodeList: [
      {
        id        : 'node-1',
        width     : nodeWidth,
        height    : nodeHeight,
        coordinate: [50, 100],
        meta: {
          type : 'switch',
          title: '开始',
        }
      },
      {
        id        : 'node-2',
        width     : nodeWidth,
        height    : nodeHeight,
        coordinate: [500, 250],
        meta: {
          type : 'func',
          title: '处理数据',
        }
      },
    ],
    linkList: [
      {
        id     : 'link-1',
        startId: 'node-1',
        endId  : 'node-2',
        startAt: [nodeWidth, nodeHeight / 2],
        endAt  : [0, nodeHeight / 2],
        meta   : null,
      },
    ],
  }
}
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
    async loadData() {
      let apiRes = await this.T.callAPI('/api/v1/do/ping')
      if (!apiRes.ok) return;

      this.data = demoData;

      this.$store.commit('updateLoadStatus', true);
    },
  },
  computed: {
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
      return []
    },
    linkMenu() {
      return []
    },
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
  background-color: darkred;
}
.node-card .node-title {
  text-align: center;
  font-size: 14px;
  padding: 10px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
