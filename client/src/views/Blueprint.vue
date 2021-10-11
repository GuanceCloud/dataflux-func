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

'"entry_func(prev_result) is the main func of the node"': '"entry_func(...)"为本节点的入口函数'

Code          : 代码
Kwargs        : 执行参数
Add Kwargs    : 添加执行参数
Global Vars   : 全局变量
Add Global Var: 添加全局变量
</i18n>

<template>
  <transition name="fade">
    <el-container direction="vertical" v-if="$store.state.isLoaded">
      <!-- 标题区 -->
      <el-header height="60px">
        <h1>
          {{ $t('Blueprint') }} (WIP)

          &#12288;
          <el-button @click="deploy" type="primary" plain size="small" class="fix-compact-button">
            <i class="fa fa-fw fa-coffee"></i> {{ $t('Deploy') }}
          </el-button>

          <el-button @click="save" size="small">
            <i class="fa fa-fw fa-save"></i> {{ $t('Save') }}
          </el-button>

          <div class="header-control">

          </div>
        </h1>
      </el-header>

      <!-- 画布区 -->
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
        <template v-slot:node="{ meta }">
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
      <el-dialog :title="`${$t('Setup')} - ${currentItem.id}`" :visible.sync="showConfigPanel" v-if="currentItem"
        :close-on-click-modal="false"
        :close-on-press-escape="false">
        <el-form :model="metaConfigForm" label-width="100px">
          <el-form-item :label="$t('Title')" v-if="currentItem.meta.category === 'stage'">
            <el-input v-model="metaConfigForm.title" autocomplete="off"></el-input>
          </el-form-item>

          <el-form-item :label="$t('Code')" v-show="hasCodeConfig(currentItem.meta.type)">
            <span class="text-primary">{{ $t('"entry_func(prev_result) is the main func of the node"') }}</span>
            <div id="codeStageContainer_Blueprint" :style="$store.getters.codeMirrorSetting.style">
              <textarea id="codeStage_Blueprint"></textarea>
            </div>
          </el-form-item>

          <template v-if="currentItem.meta.type === 'startPoint'">
            <el-form-item :label="$t('Kwargs')" prop="kwargs">
              <el-tag v-for="kw in metaConfigForm.kwargs" :key="kw" type="primary" closable @close="removeKwargs(kw)">{{ kw }}</el-tag>
              <el-input v-if="showAddKwargs" ref="newKwargs"
                v-model="newKwargs"
                size="mini"
                @keyup.enter.native="addKwargs"
                @blur="addKwargs"></el-input>
              <el-button v-else
                type="text"
                @click="openAddKwargsInput">{{ $t('Add Kwargs') }}</el-button>
            </el-form-item>

            <el-form-item :label="$t('Global Vars')" prop="globalVars">
              <el-tag v-for="gv in metaConfigForm.globalVars" :key="gv" type="info" closable @close="removeGlobalVar(gv)">{{ gv }}</el-tag>
              <el-input v-if="showAddGlobalVar" ref="newGlobalVar"
                v-model="newGlobalVar"
                size="mini"
                @keyup.enter.native="addGlobalVar"
                @blur="addGlobalVar"></el-input>
              <el-button v-else
                type="text"
                @click="openAddGlobalVarInput">{{ $t('Add Global Var') }}</el-button>
            </el-form-item>
          </template>

          <template v-else-if="currentItem.meta.type === 'startPoint'">
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
import * as blueprint from '@/blueprint'

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
      return JSON.stringify(JSON.stringify(this._getGraph().toJSON()))
    },

    genDemoData() {
      let demoData = {
        id      : 'blpt-001',
        // dataJSON: null,
        dataJSON: "{\"origin\":[0,0],\"nodeList\":[{\"id\":\"blueprint_start\",\"width\":60,\"height\":60,\"coordinate\":[113,156],\"meta\":{\"id\":\"blueprint_start\",\"type\":\"startPoint\",\"title\":null,\"updateTime\":\"2021-10-11T03:44:41.351Z\",\"category\":\"point\",\"kwargs\":[\"a\",\"b\",\"c\"],\"globalVars\":[\"x\",\"y\",\"z\"]}},{\"id\":\"node_1\",\"width\":200,\"height\":50,\"coordinate\":[275,161],\"meta\":{\"id\":\"node_1\",\"type\":\"codeStage\",\"title\":\"预处理\",\"updateTime\":\"2021-10-11T03:48:03.634Z\",\"category\":\"stage\",\"code\":\"def entry_func(prev_res):\\n    prev_res['a'] = int(prev_res['a'])\\n    prev_res['b'] = int(prev_res['b'])\\n    prev_res['c'] = int(prev_res['c'])\\n    return prev_res\"}},{\"id\":\"node_3\",\"width\":60,\"height\":60,\"coordinate\":[559,156],\"meta\":{\"id\":\"node_3\",\"type\":\"branchPoint\",\"title\":null,\"updateTime\":\"2021-10-11T03:46:03.963Z\",\"category\":\"point\",\"code\":\"def entry_func(prev_res):\\n    return prev_res['a'] + prev_res['b'] > prev_res['c']\"}},{\"id\":\"node_5\",\"width\":200,\"height\":50,\"coordinate\":[755,236],\"meta\":{\"id\":\"node_5\",\"type\":\"codeStage\",\"title\":\"返回c\",\"updateTime\":\"2021-10-11T03:48:57.297Z\",\"category\":\"stage\",\"code\":\"def entry_func(prev_res):\\n    return prev_res['c']\"}},{\"id\":\"blueprint_end\",\"width\":60,\"height\":60,\"coordinate\":[1115,156],\"meta\":{\"id\":\"blueprint_end\",\"type\":\"endPoint\",\"title\":null,\"updateTime\":\"2021-10-11T03:30:06.593Z\",\"category\":\"point\"}},{\"id\":\"node_4\",\"width\":200,\"height\":50,\"coordinate\":[755,77],\"meta\":{\"id\":\"node_4\",\"type\":\"codeStage\",\"title\":\"返回a+b的和\",\"updateTime\":\"2021-10-11T03:48:47.278Z\",\"category\":\"stage\",\"code\":\"def entry_func(prev_res):\\n    return prev_res['a'] + prev_res['b']\"}}],\"linkList\":[{\"id\":\"link-xQFcklKg4zZp\",\"startId\":\"blueprint_start\",\"endId\":\"node_1\",\"startAt\":[60,30],\"endAt\":[0,25],\"meta\":{\"type\":\"execLink\",\"updateTime\":\"2021-10-11T03:47:01.259Z\"}},{\"id\":\"link-l6DK1ltpfAU8\",\"startId\":\"node_5\",\"endId\":\"blueprint_end\",\"startAt\":[200,25],\"endAt\":[0,30],\"meta\":{\"type\":\"execLink\",\"updateTime\":\"2021-10-11T03:47:01.259Z\"}},{\"id\":\"link-4jY6ufcTdoJm\",\"startId\":\"node_3\",\"endId\":\"node_5\",\"startAt\":[60,30],\"endAt\":[0,25],\"meta\":{\"type\":\"branchFalseLink\",\"updateTime\":\"2021-10-11T03:47:01.259Z\"}},{\"id\":\"link-9dQ9aiXDW2kZ\",\"startId\":\"node_4\",\"endId\":\"blueprint_end\",\"startAt\":[200,25],\"endAt\":[0,30],\"meta\":{\"type\":\"execLink\",\"updateTime\":\"2021-10-11T03:47:01.259Z\"}},{\"id\":\"link-iG1a3t7txY4p\",\"startId\":\"node_3\",\"endId\":\"node_4\",\"startAt\":[60,30],\"endAt\":[0,25],\"meta\":{\"type\":\"branchTrueLink\",\"updateTime\":\"2021-10-11T03:47:01.259Z\"}},{\"id\":\"link-z6iDkVY5ktD5\",\"startId\":\"node_1\",\"endId\":\"node_3\",\"startAt\":[200,25],\"endAt\":[0,30],\"meta\":{\"type\":\"execLink\",\"updateTime\":\"2021-10-11T03:47:01.259Z\"}}]}"
      }
      demoData.dataJSON = JSON.parse(demoData.dataJSON || '{}');
      demoData.dataJSON.nodeList = demoData.dataJSON.nodeList || [];
      demoData.dataJSON.linkList = demoData.dataJSON.linkList || [];

      return demoData;
    },
    async loadData() {
      let apiRes = await this.T.callAPI('/api/v1/do/ping')
      if (!apiRes.ok) return;

      this.data = this.genDemoData();

      this.$store.commit('updateLoadStatus', true);
    },
    hasCodeConfig(type) {
      return ['codeStage', 'branchPoint'].indexOf(type) >= 0;
    },
    createNodeData(type, options) {
      options = options || {};

      let newNodeId = 'node_1';
      switch(type) {
        case 'startPoint':
          newNodeId = 'blueprint_start';
          break;

        case 'endPoint':
          newNodeId = 'blueprint_end';
          break;

        default:
          let lastNodeId = this.$refs.superFlow.graph.nodeList.map(node => node.id).sort().pop();
          if (lastNodeId) {
            let lastNodeSeq = parseInt(lastNodeId.split('_')[1]) + 1;
            newNodeId = `node_${lastNodeSeq}`;
          }
      }

      let node = {
        id        : newNodeId,
        coordinate: options.coordinate || [30, 30],
        meta: {
          id        : newNodeId,
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
      this.currentItem.meta = this.T.jsonCopy(this.metaConfigForm);
      this.currentItem.meta.updateTime = new Date().toISOString();
      if (this.codeMirror && this.hasCodeConfig(this.currentItem.meta.type)) {
        this.currentItem.meta.code = this.codeMirror.getValue();
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

    removeKwargs(kw) {
      this.metaConfigForm.kwargs.splice(this.metaConfigForm.kwargs.indexOf(kw), 1);
    },
    openAddKwargsInput() {
      this.showAddKwargs = true;
      this.$nextTick(_ => {
        this.$refs.newKwargs.$refs.input.focus();
      });
    },
    addKwargs() {
      let newKwargs = this.newKwargs;
      if (newKwargs) {
        if (!Array.isArray(this.metaConfigForm.kwargs)) {
          this.$set(this.metaConfigForm, 'kwargs', []);
        }
        this.metaConfigForm.kwargs.push(newKwargs);
      }
      this.showAddKwargs = false;
      this.newKwargs     = '';
    },

    removeGlobalVar(gv) {
      this.metaConfigForm.globalVars.splice(this.metaConfigForm.globalVars.indexOf(gv), 1);
    },
    openAddGlobalVarInput() {
      this.showAddGlobalVar = true;
      this.$nextTick(_ => {
        this.$refs.newGlobalVar.$refs.input.focus();
      });
    },
    addGlobalVar() {
      let newGlobalVar = this.newGlobalVar;
      if (newGlobalVar) {
        if (!Array.isArray(this.metaConfigForm.globalVars)) {
          this.$set(this.metaConfigForm, 'globalVars', []);
        }
        this.metaConfigForm.globalVars.push(newGlobalVar);
      }
      this.showAddGlobalVar = false;
      this.newGlobalVar     = '';
    },

    async deploy() {
      let dataJSON = await this.save();

      let scriptCode = blueprint.genScriptCode(dataJSON.nodeList, dataJSON.linkList);

      console.log('Script Code: \n' + scriptCode)
      console.log('CALL DEPLOY API')
    },
    async save() {
      let dataJSON = this._getGraph().toJSON()

      console.log('CALL SAVE API', dataJSON)

      return dataJSON;
    },
  },
  computed: {
    sampleCode() {
      let lines = [];
      lines.push('def entry_func(prev_res):');
      lines.push('    return prev_res');

      return lines.join('\n');
    },
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
            disable: (node) => {
              return node.meta.type === 'endPoint';
            },
            selected: (node, coordinate) => {
              let nextMeta = this.T.jsonCopy(node.meta);

              this.currentItem = node;
              this.currentItem.meta = nextMeta;
              this.$set(this, 'metaConfigForm', nextMeta);

              this.showConfigPanel = true;

              if (this.hasCodeConfig(node.meta.type)) {
                setImmediate(() => {
                  // 初始化编辑器
                  if (!document.querySelector('#codeStage_Blueprint + .CodeMirror')) {
                  // if (!this.codeMirror) {
                    this.codeMirror = this.T.initCodeMirror('codeStage_Blueprint');
                    this.codeMirror.setOption('theme', this.codeMirrorTheme);
                  }

                  // 载入代码
                  this.codeMirror.setValue(nextMeta.code || this.sampleCode);
                  this.codeMirror.refresh();
                });
              }
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
        id: '',
        dataJSON: {
          nodeList: [],
          linkList: [],
        }
      },

      showConfigPanel: false,

      showAddKwargs: false,
      newKwargs    : '',

      showAddGlobalVar: false,
      newGlobalVar    : '',

      currentItem: null,
      metaConfigForm: {
        title     : null,
        code      : null,
        kwargs    : [],
        globalVars: [],
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
