<i18n locale="zh-CN" lang="yaml">
Execute: 执行处理
Crontab: 自动触发
Start  : 开始
Branch : 分支
End    : 结束

Yes            : 是
No             : 否
Code stage     : 代码处理步骤
Func stage     : 函数调用步骤
Auth Link entry: 授权链接入口
Crontab entry  : 自动触发入口
Start point    : 开始点
Branch point   : 分支点
End point      : 结束点
Select all     : 全选

Code: 代码
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
        :node-list="data.dataJSON.nodeList || []"
        :link-list="data.dataJSON.linkList || []"

        :before-node-create="beforeNodeCreate"
        :on-node-created="onNodeCreated"
        :before-link-create="beforeLinkCreate"
        :on-link-created="onLinkCreated">
        <template v-slot:node="{meta}">
          <!-- 阶段 -->
          <template v-if="meta.category === 'stage'">
            <el-card class="node-card stage-card" shadow="hover">
              <div class="stage-header">
                <template v-if="meta.type === 'codeStage'">
                  <i class="fa fa-fw fa-file-code-o"></i>
                </template>
                <template v-else-if="meta.type === 'funcStage'">
                  <i class="fa fa-fw fa-cog"></i>
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
              <template v-if="meta.type === 'startPoint'">
                <span>{{ $t('Start') }}</span>
              </template>
              <template v-else-if="meta.type === 'branchPoint'">
                <span>{{ $t('Branch') }}</span>
              </template>
              <template v-else-if="meta.type === 'endPoint'">
                <span>{{ $t('End') }}</span>
              </template>
            </el-card>
          </template>
        </template>
      </super-flow>

      <!-- 配置 -->
      <el-dialog :title="$t('Setup')" :visible.sync="showConfigPanel" v-if="configItem && configItem.meta">
        <el-form :model="configForm" label-width="80px">
          <el-form-item :label="$t('Title')" v-if="configItem.meta.category === 'stage'">
            <el-input v-model="configForm.title" autocomplete="off"></el-input>
          </el-form-item>

          <template v-if="['codeStage', 'branchPoint'].indexOf(configItem.meta.type) >= 0">
            <el-form-item :label="$t('Code')">
              <div id="codeStageContainer_Blueprint" :style="$store.getters.codeMirrorSetting.style">
                <textarea id="codeStage_Blueprint">{{ configForm.code }}</textarea>
              </div>
            </el-form-item>
          </template>

          <template v-else-if="configItem.meta.type === 'funcStage'">
          </template>

          <template v-else-if="configItem.meta.type === 'startPoint'">
          </template>

          <template v-else-if="configItem.meta.type === 'branchPoint'">
          </template>
        </el-form>
        <div slot="footer" class="dialog-footer">
          <el-button @click="showConfigPanel = false">{{ $t('Cancel') }}</el-button>
          <el-button type="primary" @click="updateItemMeta">{{ $t('Confirm') }}</el-button>
        </div>
      </el-dialog>
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
      // 注意点：切换语言后，需要等待i18n插件也切换语言后才能重新获取文案
      setImmediate(() => {
        this.$refs.superFlow.graph.linkList.forEach(link => {
          link.meta.updateTime = new Date().toISOString();
        });
      });
    },
    codeMirrorTheme(val) {
      this.codeMirror.setOption('theme', val);
    },
  },
  methods: {
    _getGraph() {
      if (!this.$refs.superFlow) return null;

      return this.$refs.superFlow.graph;
    },
    _dumpGraph() {
      return JSON.stringify(this._getGraph().toJSON())
    },

    genDemoData() {
      let dataJSON = '{"origin":[0,0],"nodeList":[{"id":"node-CNjeuprAp3Ed","width":60,"height":60,"coordinate":[108,133.8125],"meta":{"type":"startPoint","title":null,"updateTime":"2021-10-08T07:06:08.971Z","category":"point"}},{"id":"node-jLmr4fAcbfWB","width":200,"height":50,"coordinate":[252,138.8125],"meta":{"type":"codeStage","title":null,"updateTime":"2021-10-08T07:06:15.325Z","category":"stage","code":null}},{"id":"node-iAgy3TpDlZCN","width":60,"height":60,"coordinate":[548,133.8125],"meta":{"type":"branchPoint","title":null,"updateTime":"2021-10-08T07:06:28.239Z","category":"point"}},{"id":"node-9uPSppsvX5iw","width":200,"height":50,"coordinate":[698,73.8125],"meta":{"type":"codeStage","title":null,"updateTime":"2021-10-08T07:06:18.331Z","category":"stage","code":null}},{"id":"node-21btpMCTshO4","width":200,"height":50,"coordinate":[698,211.8125],"meta":{"type":"codeStage","title":null,"updateTime":"2021-10-08T07:06:45.595Z","category":"stage","code":null}},{"id":"node-yPMpMzb83Biy","width":60,"height":60,"coordinate":[1095,133.8125],"meta":{"type":"endPoint","title":null,"updateTime":"2021-10-08T07:06:10.525Z","category":"point"}}],"linkList":[{"id":"link-xWl9een3bv2T","startId":"node-CNjeuprAp3Ed","endId":"node-jLmr4fAcbfWB","startAt":[60,30],"endAt":[0,25],"meta":{"type":"execLink","updateTime":"2021-10-08T07:06:35.341Z"}},{"id":"link-YHMaYlqkLQqN","startId":"node-jLmr4fAcbfWB","endId":"node-iAgy3TpDlZCN","startAt":[200,25],"endAt":[0,30],"meta":{"type":"execLink","updateTime":"2021-10-08T07:06:42.068Z"}},{"id":"link-EWmKs952fRcG","startId":"node-iAgy3TpDlZCN","endId":"node-9uPSppsvX5iw","startAt":[60,30],"endAt":[0,25],"meta":{"type":"branchTrueLink","updateTime":"2021-10-08T07:06:44.063Z"}},{"id":"link-h6X23fnttH9d","startId":"node-iAgy3TpDlZCN","endId":"node-21btpMCTshO4","startAt":[60,30],"endAt":[0,25],"meta":{"type":"branchFalseLink","updateTime":"2021-10-08T07:06:47.805Z"}},{"id":"link-eCwMzs069WqM","startId":"node-9uPSppsvX5iw","endId":"node-yPMpMzb83Biy","startAt":[200,25],"endAt":[0,30],"meta":{"type":"execLink","updateTime":"2021-10-08T07:06:50.190Z"}},{"id":"link-RJ23PwABHvin","startId":"node-21btpMCTshO4","endId":"node-yPMpMzb83Biy","startAt":[200,25],"endAt":[0,30],"meta":{"type":"execLink","updateTime":"2021-10-08T07:06:52.231Z"}}]}'
      let demoData = {
        id: this.T.genDataId('blpt'),
        dataJSON: JSON.parse(dataJSON || '{}'),
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
        case 'codeStage':
          // 代码处理步骤
          node.meta.category = 'stage';
          node.meta.code     = options.code || null; // 执行代码
          break;

        case 'funcStage':
          // 函数调用步骤
          node.meta.category       = 'stage';
          node.meta.funcId         = options.funcId         || null; // 执行函数ID
          node.meta.funcCallKwargs = options.funcCallKwargs || null; // 执行函数参数
          break;

        case 'startPoint':
        case 'branchPoint':
        case 'endPoint':
          // 开始点、分支点、结束点
          node.meta.category = 'point';
          break;
      }

      // 设置大小
      switch(node.meta.category) {
        case 'stage':
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
          break;

        case 'branchTrueLink':
          // 条件为真连线
          break;

        case 'branchFalseLink':
          // 条件为假连线
          break;
      }

      return linkMeta;
    },
    updateItemMeta() {
      this.configItem.meta = this.T.jsonCopy(this.configForm);
      this.configItem.meta.updateTime = new Date().toISOString();
      if (this.configItem.meta.type === 'codeStage' && this.codeMirror) {
        this.configItem.meta.code = this.codeMirror.getValue();
      }

      this.showConfigPanel = false;
    },

    enterIntercept(fromNode, toNode, graph) {
      // 不允许入口直接指向结束点
      if (fromNode.meta.type === 'startPoint' && toNode.meta.type === 'endPoint') {
        return false;
      }

      // 任何节点都不允许指向开始点
      if (toNode.meta.type === 'startPoint') {
        return false;
      }

      return true;
    },
    outputIntercept(node, graph) {
      // 【开始点】只允许指向一处
      if (node.meta.type === 'startPoint') {
        return graph.linkList.filter(link => link.start.id === node.id).length <= 0;
      }

      // 【结束点】不允许指向任何节点
      if (node.meta.type === 'endPoint') {
        return false;
      }

      // 【执行阶段类节点】只允许指向一处
      if (node.meta.category === 'stage') {
        return graph.linkList.filter(link => link.start.id === node.id).length <= 0;
      }

      // 【分支节点】只允许指向两处
      if (node.meta.type === 'branchPoint') {
        return graph.linkList.filter(link => link.start.id === node.id).length <= 1;
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

      // 默认标题
      switch(meta.type) {
        case 'codeStage':
          return this.$t('Code stage');

        case 'funcStage':
          return this.$t('Func stage');

        case 'branchTrueLink':
          return this.$t('Yes');

        case 'branchFalseLink':
          return this.$t('No');

        default:
          return '';
      }

    },
    beforeNodeCreate(node, graph) {
    },
    async onNodeCreated(node, graph) {
    },
    beforeLinkCreate(link, graph) {
      let fromNode = graph.nodeList.find(node => node.id === link.start.id);
      if (fromNode.meta.type === 'branchPoint') {
        if (graph.linkList.filter(link => link.start.id === fromNode.id && link.meta.type === 'branchTrueLink').length === 0) {
          link.meta = this.createLinkMeta('branchTrueLink');
        } else {
          link.meta = this.createLinkMeta('branchFalseLink');
        }
      } else {
        link.meta = this.createLinkMeta('execLink');
      }

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
            icon : 'fa-file-code-o',
            label: this.$t('Code stage'),
            selected: (graph, coordinate) => {
              graph.addNode(this.createNodeData('codeStage', {
                coordinate: coordinate,
              }));
            },
          },
          {
            icon : 'fa-cogs',
            label: this.$t('Func stage'),
            selected: (graph, coordinate) => {
              graph.addNode(this.createNodeData('funcStage', {
                coordinate: coordinate,
              }));
            },
          },
        ],
        [
          {
            icon : 'fa-flag',
            label: this.$t('Start point'),
            selected: (graph, coordinate) => {
              graph.addNode(this.createNodeData('startPoint', {
                coordinate: coordinate,
              }));
            },
          },
          {
            icon : 'fa-code-fork',
            label: this.$t('Branch point'),
            selected: (graph, coordinate) => {
              graph.addNode(this.createNodeData('branchPoint', {
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
            icon: 'fa-edit',
            label: this.$t('Setup'),
            disable: false,
            selected: (node, coordinate) => {
              this.configItem = node;
              this.$set(this, 'configForm', this.T.jsonCopy(node.meta));

              this.showConfigPanel = true;

              setImmediate(() => {
                // 初始化编辑器
                if (!this.codeMirror) {
                  this.codeMirror = this.T.initCodeMirror('codeStage_Blueprint');
                  this.codeMirror.setOption('theme', this.codeMirrorTheme);
                }

                // 载入代码
                this.codeMirror.setValue(this.configItem.meta.code || '');
                this.T.setCodeMirrorMode(this.codeMirror, 'python');
                this.codeMirror.refresh();
              });
            },
          },
          {
            icon : 'fa-times',
            label: this.$t('Delete'),
            disable: false,
            selected: (node, coordinate) => {
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
    },
    codeMirrorTheme() {
      return this.T.getCodeMirrorThemeName();
    },
  },
  props: {
  },
  data() {
    return {
      data: {
        dataJSON: {
          nodeList: [],
          linkList: [],
        }
      },

      showConfigPanel: false,

      configItem: null,
      configForm: {
        title         : null,
        code          : null,
        funcId        : null,
        funcCallKwargs: null,
      },

      codeMirror: null,
    }
  },
  created() {
  },
  mounted() {
    window._DFF_Blueprint = this;
  },
}
</script>

<style>
.node-card {
  width: 100%;
  height: 100%;
  border: 2px solid #FF6600;
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
  color: white;
  background-color: #FF6600;
  display: flex;
  align-items: center;
  font-size: 18px;
}

#codeStageContainer_Blueprint {
  border: 1px solid #DCDFE6;
  border-radius: 3px;
}
#codeStageContainer_Blueprint .CodeMirror {
  height: 420px;
  width: auto;
}
</style>
