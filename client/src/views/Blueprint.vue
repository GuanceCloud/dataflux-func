<i18n locale="zh-CN" lang="yaml">
Execute: 执行处理
Crontab: 自动触发
Merge  : 合并
End    : 结束

Execute stage  : 执行处理步骤
Auth Link entry: 授权链接入口
Crontab entry  : 自动触发入口
Merge point    : 合并点
End point      : 结束点
Select all     : 全选
</i18n>

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
        :link-list="data.dataJSON.linkList"

        :before-node-create="beforeNodeCreate"
        :on-node-created="onNodeCreated"
        :before-link-create="beforeLinkCreate"
        :on-link-created="onLinkCreated">
        <template v-slot:node="{meta}">
          <!-- 节点 -->
          <template v-if="meta.category === 'stage'">
            <el-card class="node-card stage-card" shadow="hover">
              <div class="stage-header">
                <template v-if="meta.type === 'execStage'">
                  <i class="fa fa-fw fa-cogs"></i>
                  <span>{{ $t('Execute') }}</span>
                </template>
              </div>
              <div class="node-title">
                <span>{{ meta.title }}</span>
              </div>
            </el-card>
          </template>

          <!-- 入口 -->
          <template v-else-if="meta.category === 'entry'">
            <el-card class="node-card entry-card" shadow="hover">
              <div class="entry-header">
                <template v-if="meta.type === 'authLinkEntry'">
                  <i class="fa fa-fw fa-link"></i>
                  <span>{{ $t('Auth Link') }}</span>
                </template>
                <template v-if="meta.type === 'crontabEntry'">
                  <i class="fa fa-fw fa-clock-o"></i>
                  <span>{{ $t('Crontab') }}</span>
                </template>
              </div>
              <div class="node-title">
                <span>{{ meta.title }}</span>
              </div>
            </el-card>
          </template>

          <!-- 点 -->
          <template v-else-if="meta.category === 'point'">
            <el-card class="node-card point-card" shadow="hover">
              <template v-if="meta.type === 'mergePoint'">
                <span>{{ $t('Merge') }}</span>
              </template>
              <template v-if="meta.type === 'endPoint'">
                <span>{{ $t('End') }}</span>
              </template>
            </el-card>
          </template>
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
    getGraph() {
      if (!this.$refs.superFlow) return null;

      return this.$refs.superFlow.graph;
    },

    genDemoData() {
      let dataJSON = '{"origin":[-116,19],"nodeList":[{"id":"node-teaX65mrKfW8","width":150,"height":80,"coordinate":[229,37.8125],"meta":{"type":"authLinkEntry","title":"API entry","category":"entry"}},{"id":"node-Igf1w7OvZ0q3","width":180,"height":80,"coordinate":[214,229.8125],"meta":{"type":"execStage","title":"Execute stage","category":"stage","code":null,"kwargs":null,"template":null}},{"id":"node-kgPgV8x61XN1","width":150,"height":80,"coordinate":[395,37.8125],"meta":{"type":"crontabEntry","title":"Crontab entry","category":"entry"}},{"id":"node-p3MqaelTYBpZ","width":180,"height":80,"coordinate":[380,338.8125],"meta":{"type":"execStage","title":"Execute stage","category":"stage","code":null,"kwargs":null,"template":null}},{"id":"node-oLj25PmTmbT3","width":180,"height":80,"coordinate":[598,198.8125],"meta":{"type":"execStage","title":"Execute stage","category":"stage","code":null,"kwargs":null,"template":null}},{"id":"node-wXYJvED6BtEJ","width":180,"height":80,"coordinate":[803,198.8125],"meta":{"type":"execStage","title":"Execute stage","category":"stage","code":null,"kwargs":null,"template":null}},{"id":"node-M3PEKx8yPxX4","width":180,"height":80,"coordinate":[803,338.8125],"meta":{"type":"execStage","title":"Execute stage","category":"stage","code":null,"kwargs":null,"template":null}},{"id":"node-LFSYDrbRjr9C","width":180,"height":80,"coordinate":[803,63.8125],"meta":{"type":"execStage","title":"Execute stage","category":"stage","code":null,"kwargs":null,"template":null}},{"id":"node-gIwu2dcrjK6Z","width":80,"height":80,"coordinate":[1033,63.8125],"meta":{"type":"mergePoint","title":"合并点","category":"point"}},{"id":"node-xOFT4tLGHbGc","width":180,"height":80,"coordinate":[1112,198.8125],"meta":{"type":"execStage","title":"执行处理步骤","category":"stage","code":null,"kwargs":null,"template":null}},{"id":"node-Mfi2rxprtGvl","width":80,"height":80,"coordinate":[1162,338.8125],"meta":{"type":"endPoint","title":"End point","category":"point"}}],"linkList":[{"id":"link-4nD0GCp8CKi6","startId":"node-teaX65mrKfW8","endId":"node-Igf1w7OvZ0q3","startAt":[75,80],"endAt":[90,0],"meta":{"type":"execLink","title":null,"code":null,"kwargs":null,"template":null}},{"id":"link-Sd6NxRlYSeyE","startId":"node-oLj25PmTmbT3","endId":"node-LFSYDrbRjr9C","startAt":[90,0],"endAt":[0,40],"meta":{"type":"execLink","title":null,"code":null,"kwargs":null,"template":null}},{"id":"link-8UOpMquBQe2a","startId":"node-oLj25PmTmbT3","endId":"node-M3PEKx8yPxX4","startAt":[90,80],"endAt":[0,40],"meta":{"type":"execLink","title":null,"code":null,"kwargs":null,"template":null}},{"id":"link-PQ36pGbTX00U","startId":"node-oLj25PmTmbT3","endId":"node-wXYJvED6BtEJ","startAt":[180,40],"endAt":[0,40],"meta":{"type":"execLink","title":null,"code":null,"kwargs":null,"template":null}},{"id":"link-iQMsY26Y4pUW","startId":"node-M3PEKx8yPxX4","endId":"node-Mfi2rxprtGvl","startAt":[180,40],"endAt":[0,40],"meta":{"type":"execLink","title":null,"code":null,"kwargs":null,"template":null}},{"id":"link-CjOMzANjgB6j","startId":"node-Igf1w7OvZ0q3","endId":"node-p3MqaelTYBpZ","startAt":[90,80],"endAt":[0,40],"meta":{"type":"execLink","title":null,"code":null,"kwargs":null,"template":null}},{"id":"link-QQjJtzN4S4nN","startId":"node-kgPgV8x61XN1","endId":"node-p3MqaelTYBpZ","startAt":[75,80],"endAt":[90,0],"meta":{"type":"execLink","title":null,"code":null,"kwargs":null,"template":null}},{"id":"link-Q3Xrec8MFvYe","startId":"node-p3MqaelTYBpZ","endId":"node-oLj25PmTmbT3","startAt":[180,40],"endAt":[0,40],"meta":{"type":"execLink","title":null,"code":null,"kwargs":null,"template":null}},{"id":"link-nXtpDpUuvWdL","startId":"node-LFSYDrbRjr9C","endId":"node-gIwu2dcrjK6Z","startAt":[180,40],"endAt":[0,40],"meta":{"type":"execLink","title":null,"code":null,"kwargs":null,"template":null}},{"id":"link-aqZwqgUyKdsO","startId":"node-gIwu2dcrjK6Z","endId":"node-xOFT4tLGHbGc","startAt":[80,40],"endAt":[90,0],"meta":{"type":"execLink","title":null,"code":null,"kwargs":null,"template":null}},{"id":"link-BYR11d8oOc2A","startId":"node-wXYJvED6BtEJ","endId":"node-gIwu2dcrjK6Z","startAt":[180,40],"endAt":[40,80],"meta":{"type":"execLink","title":null,"code":null,"kwargs":null,"template":null}},{"id":"link-QY7kSrREUofi","startId":"node-xOFT4tLGHbGc","endId":"node-Mfi2rxprtGvl","startAt":[90,80],"endAt":[40,0],"meta":{"type":"execLink","title":null,"code":null,"kwargs":null,"template":null}}]}'
      let demoData = {
        id: this.T.genDataId('blpt'),
        dataJSON: JSON.parse(dataJSON),
      };

      return demoData;
    },
    async loadData() {
      let apiRes = await this.T.callAPI('/api/v1/do/ping')
      if (!apiRes.ok) return;

      this.data = this.genDemoData();

      this.$store.commit('updateLoadStatus', true);
    },
    createNodeData(type, options) {
      options = options || {};

      let node = {
        id        : this.T.genDataId('node'),
        coordinate: options.coordinate || [30, 30],
        meta: {
          type : type,
          title: options.title,
        },
      };

      // 设置meta信息
      switch(type) {
        case 'execStage':
          // 执行处理步骤
          node.meta.category = 'stage';
          node.meta.code     = options.code     || null; // 执行代码
          node.meta.kwargs   = options.kwargs   || null; // 执行参数
          node.meta.template = options.template || null; // 节点模板（用于生成自动标题）
          break;

        case 'authLinkEntry':
        case 'crontabEntry':
          // 授权链接入口、定时触发入口
          node.meta.category = 'entry';
          break;

        case 'mergePoint':
        case 'endPoint':
          // 合并点、结束点
          node.meta.category = 'point';
          break;
      }

      // 设置大小
      switch(node.meta.category) {
        case 'stage':
        case 'entry':
          node.width  = 180;
          node.height = 80;
          break;

        case 'point':
          node.width  = 80;
          node.height = 80;
          break;
      }

      return node;
    },
    createLinkData(type, options) {
      options = options || {};

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
        endAt  : _getLinkNodePosition(options.endNode,   options.endAt),
        meta: {
          type : type,
          title: options.title,
        },
      };

      // 设置meta信息
      switch(type) {
        case 'execLink':
          // 执行连线
          link.meta.code     = options.code     || null; // 执行代码
          link.meta.kwargs   = options.kwargs   || null; // 执行参数
          link.meta.template = options.template || null; // 连线模板（用于生成自动标题）
          break;
      }

      return link;
    },
    enterIntercept(fromNode, toNode, graph) {
      // 不允许入口直接指向结束点
      if (fromNode.meta.category === 'entry' && toNode.meta.type === 'endPoint') {
        return false;
      }

      // 任何节点都不允许指向入口
      if (toNode.meta.category === 'entry') {
        return false;
      }

      return true;
    },
    outputIntercept(node, graph) {
      // 不允许结束点指向任何节点
      if (node.meta.type === 'endPoint') {
        return false;
      }

      // 阶段节点总是可以指向
      if (node.meta.category === 'stage') {
        return true;
      }

      // 入口节点只允许指向一处
      if (node.meta.category === 'entry') {
        return graph.linkList.filter(link => link.start.id === node.id).length <= 0;
      }

      return true;
    },
    linkDesc(link) {
      if (!link.meta) return '';
      return link.meta.title || '';
    },

    beforeNodeCreate(node, graph) {
    },
    async onNodeCreated(node, graph) {
    },
    beforeLinkCreate(link, graph) {
      link.meta = {
        type    : 'execLink',
        title   : null,
        code    : null,
        kwargs  : null,
        template: null,
      };
      return link;
    },
    async onLinkCreated(link, graph) {
    },
  },
  computed: {
    graphMenu() {
      return [
        [
          {
            icon : 'fa-cogs',
            label: this.$t('Execute stage'),
            selected: (graph, coordinate) => {
              graph.addNode(this.createNodeData('execStage', {
                title     : this.$t('Execute stage'),
                coordinate: coordinate,
              }));
            },
          },
        ],
        [
          {
            icon : 'fa-link',
            label: this.$t('Auth Link entry'),
            selected: (graph, coordinate) => {
              graph.addNode(this.createNodeData('authLinkEntry', {
                title     : this.$t('Auth Link entry'),
                coordinate: coordinate,
              }));
            },
          },
          {
            icon : 'fa-clock-o',
            label: this.$t('Crontab entry'),
            selected: (graph, coordinate) => {
              graph.addNode(this.createNodeData('crontabEntry', {
                title     : this.$t('Crontab entry'),
                coordinate: coordinate,
              }));
            },
          },
        ],
        [
          {
            icon : 'fa-compress',
            label: this.$t('Merge point'),
            selected: (graph, coordinate) => {
              graph.addNode(this.createNodeData('mergePoint', {
                title     : this.$t('Merge point'),
                coordinate: coordinate,
              }));
            },
          },
          {
            icon : 'fa-stop',
            label: this.$t('End point'),
            disable(graph) {
              return !!graph.nodeList.find(node => {
                return node.meta.type === 'endPoint';
              });
            },
            selected: (graph, coordinate) => {
              graph.addNode(this.createNodeData('endPoint', {
                title     : this.$t('End point'),
                coordinate: coordinate,
              }));
            },
          },
        ],
        [
          {
            icon : 'fa-mouse-pointer',
            label: this.$t('Select all'),
            selected: (graph, coordinate) => {
              graph.selectAll();
            },
          },
        ],
      ]
    },
    nodeMenu() {
      return [
        [
          {
            icon : 'fa-times',
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
            icon : 'fa-times',
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
  border: 2px solid #ccc;
  box-sizing: border-box;
}
.node-card > .el-card__body {
  padding: 0;
  height: 100%;
  box-sizing: border-box;
}
.node-card .node-title {
  text-align: center;
  font-size: 14px;
  padding: 10px 5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.node-card.entry-card {
  border: 1px solid #FF6600 !important;
}
.node-card.point-card {
  border: 2px solid #FF6600 !important;
  border-radius: 100px;
}
.node-card.point-card > .el-card__body {
  display: flex;
  align-items: center;
  justify-content: center;
}

.node-card .stage-header {
  text-align: left;
  padding: 5px;
  color: #FF6600;
  background-color: #EEEEEE;
}

.node-card .entry-header {
  text-align: left;
  padding: 5px;
  color: white;
  background-color: #FF6600;
}
</style>
