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
                </template>
              </div>
              <div class="node-title">
                <div class="node-title-content">
                  <span>{{ getTitle(meta) }}</span>
                </div>
              </div>
            </el-card>
          </template>

          <!-- 入口 -->
          <template v-else-if="meta.category === 'entry'">
            <el-card class="node-card entry-card" shadow="hover">
              <div class="entry-header">
                <template v-if="meta.type === 'authLinkEntry'">
                  <i class="fa fa-fw fa-link"></i>
                </template>
                <template v-if="meta.type === 'crontabEntry'">
                  <i class="fa fa-fw fa-clock-o"></i>
                </template>
              </div>
              <div class="node-title">
                <div class="node-title-content">
                  <span>{{ getTitle(meta) }}</span>
                </div>
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
    '$store.state.uiLocale': function() {
      // 修复切换语言后，连接描述文字由于是cavas绘制导致无法同步更新的问题
      // 解决方案：修改`updateTime`诱使GraphLink触发watch动作
      this.$refs.superFlow.graph.linkList.forEach(link => {
        link.meta.updateTime = new Date().toISOString();
      });
    },
  },
  methods: {
    _getGraph() {
      if (!this.$refs.superFlow) return null;

      return this.$refs.superFlow.graph;
    },

    genDemoData() {
      let dataJSON = '{"origin":[0,0],"nodeList":[{"id":"node-Vs6Yq0LqNOYy","width":200,"height":50,"coordinate":[157,24.8125],"meta":{"type":"authLinkEntry","title":null,"updateTime":"2021-06-10T19:18:04.438Z","category":"entry"}},{"id":"node-OufQE7LOzs7G","width":200,"height":50,"coordinate":[387,24.8125],"meta":{"type":"crontabEntry","title":null,"updateTime":"2021-06-10T19:18:06.718Z","category":"entry"}},{"id":"node-YdP5EVjzsbQo","width":200,"height":50,"coordinate":[157,146.8125],"meta":{"type":"execStage","title":null,"updateTime":"2021-06-10T19:17:44.249Z","category":"stage","code":null,"kwargs":null,"template":null}},{"id":"node-6hvn6piGex6i","width":200,"height":50,"coordinate":[387,240.8125],"meta":{"type":"execStage","title":null,"updateTime":"2021-06-10T19:17:44.975Z","category":"stage","code":null,"kwargs":null,"template":null}},{"id":"node-nrtKrQyOmFL7","width":60,"height":60,"coordinate":[957,235.8125],"meta":{"type":"mergePoint","title":null,"updateTime":"2021-06-10T19:18:54.298Z","category":"point"}},{"id":"node-m1QXhzlrr6l4","width":200,"height":50,"coordinate":[657,184.8125],"meta":{"type":"execStage","title":null,"updateTime":"2021-06-10T19:18:19.161Z","category":"stage","code":null,"kwargs":null,"template":null}},{"id":"node-M9QG6pIz0Rdb","width":200,"height":50,"coordinate":[657,295.8125],"meta":{"type":"execStage","title":null,"updateTime":"2021-06-10T19:18:21.321Z","category":"stage","code":null,"kwargs":null,"template":null}},{"id":"node-ctkEbzixtQOm","width":200,"height":50,"coordinate":[387,379.8125],"meta":{"type":"execStage","title":null,"updateTime":"2021-06-10T19:18:32.795Z","category":"stage","code":null,"kwargs":null,"template":null}},{"id":"node-l2vz8jIcdYyU","width":60,"height":60,"coordinate":[1182,235.8125],"meta":{"type":"endPoint","title":null,"updateTime":"2021-06-10T19:18:51.418Z","category":"point"}}],"linkList":[{"id":"link-5vMIPEpxUM47","startId":"node-YdP5EVjzsbQo","endId":"node-6hvn6piGex6i","startAt":[200,25],"endAt":[0,25],"meta":{"type":"execLink","updateTime":"2021-06-10T19:17:56.552Z","code":null,"kwargs":null,"template":null}},{"id":"link-rk4O7sZBOjvP","startId":"node-Vs6Yq0LqNOYy","endId":"node-YdP5EVjzsbQo","startAt":[100,50],"endAt":[100,0],"meta":{"type":"execLink","updateTime":"2021-06-10T19:18:11.360Z","code":null,"kwargs":null,"template":null}},{"id":"link-PjnJ7U62d675","startId":"node-OufQE7LOzs7G","endId":"node-6hvn6piGex6i","startAt":[100,50],"endAt":[100,0],"meta":{"type":"execLink","updateTime":"2021-06-10T19:18:17.570Z","code":null,"kwargs":null,"template":null}},{"id":"link-NcWDNmqifnSb","startId":"node-6hvn6piGex6i","endId":"node-M9QG6pIz0Rdb","startAt":[200,25],"endAt":[0,25],"meta":{"type":"execLink","updateTime":"2021-06-10T19:18:28.721Z","code":null,"kwargs":null,"template":null}},{"id":"link-d84tMR5JHec4","startId":"node-6hvn6piGex6i","endId":"node-m1QXhzlrr6l4","startAt":[200,25],"endAt":[0,25],"meta":{"type":"execLink","updateTime":"2021-06-10T19:18:23.994Z","code":null,"kwargs":null,"template":null}},{"id":"link-goRtUr1htsCn","startId":"node-m1QXhzlrr6l4","endId":"node-nrtKrQyOmFL7","startAt":[200,25],"endAt":[30,0],"meta":{"type":"execLink","updateTime":"2021-06-10T19:18:57.381Z","code":null,"kwargs":null,"template":null}},{"id":"link-XAx1ijj8yiu0","startId":"node-M9QG6pIz0Rdb","endId":"node-nrtKrQyOmFL7","startAt":[200,25],"endAt":[30,60],"meta":{"type":"execLink","updateTime":"2021-06-10T19:18:58.969Z","code":null,"kwargs":null,"template":null}},{"id":"link-rMS7cum4PobL","startId":"node-nrtKrQyOmFL7","endId":"node-l2vz8jIcdYyU","startAt":[60,30],"endAt":[0,30],"meta":{"type":"execLink","updateTime":"2021-06-10T19:19:23.022Z","code":null,"kwargs":null,"template":null}},{"id":"link-80TB9625dOoV","startId":"node-ctkEbzixtQOm","endId":"node-l2vz8jIcdYyU","startAt":[200,25],"endAt":[30,60],"meta":{"type":"execLink","updateTime":"2021-06-10T19:19:21.402Z","code":null,"kwargs":null,"template":null}},{"id":"link-7alh8N0EKRbS","startId":"node-6hvn6piGex6i","endId":"node-ctkEbzixtQOm","startAt":[100,50],"endAt":[100,0],"meta":{"type":"execLink","updateTime":"2021-06-10T19:18:40.948Z","code":null,"kwargs":null,"template":null}}]}'
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
          type      : type,
          title     : options.title || null,
          updateTime: new Date().toISOString(),
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
          node.width  = 200;
          node.height = 50;
          break;

        case 'point':
          node.width  = 60;
          node.height = 60;
          break;
      }

      return node;
    },
    createLinkMeta(type, options) {
      options = options || {};

      let linkMeta = {
        type      : type,
        title     : options.title,
        updateTime: new Date().toISOString(),
      };

      // 设置meta信息
      switch(type) {
        case 'execLink':
          // 执行连线
          linkMeta.code     = options.code     || null; // 执行代码
          linkMeta.kwargs   = options.kwargs   || null; // 执行参数
          linkMeta.template = options.template || null; // 连线模板（用于生成自动标题）
          break;
      }

      return linkMeta;
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
      return this.getTitle(link.meta);
    },

    getTitle(meta) {
      // 非标准组件不返回
      if (!meta) return '';

      // 优先使用用户指定标题
      if (meta.title) return meta.title;

      return this.$t('Title');
    },
    beforeNodeCreate(node, graph) {
    },
    async onNodeCreated(node, graph) {
    },
    beforeLinkCreate(link, graph) {
      link.meta = this.createLinkMeta('execLink');
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
                coordinate: coordinate,
              }));
            },
          },
          {
            icon : 'fa-clock-o',
            label: this.$t('Crontab entry'),
            selected: (graph, coordinate) => {
              graph.addNode(this.createNodeData('crontabEntry', {
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
  display: flex;
}
.node-card .node-title {
  text-align: center;
  font-size: 14px;
  padding: 10px 5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: flex;
  align-items: center;
}
.node-card .node-title .node-title-content {
  width: 100%;
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
  display: flex;
  align-items: center;
  font-size: 18px;
}

.node-card .entry-header {
  text-align: left;
  padding: 5px;
  color: white;
  background-color: #FF6600;
  display: flex;
  align-items: center;
  font-size: 18px;
}
</style>
