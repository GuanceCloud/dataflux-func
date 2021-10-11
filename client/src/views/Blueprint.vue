<i18n locale="zh-CN" lang="yaml">
Execute     : 执行处理
Crontab     : 自动触发
Start       : 开始
End         : 结束
Process Step: 处理步骤
Branch Step : 分支步骤
'True'      : 真
'False'     : 假

Add Process Step: 添加处理步骤
Add Branch Step : 添加分支步骤
Select all      : 全选

'Function "entry_func(prev_result)" is the main func of the node': '函数"entry_func(prev_res)"为节点的入口函数'

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
          <!-- 开始点 -->
          <el-card class="node-card point-card" shadow="hover" v-if="meta.type === 'start'">
            <span>{{ $t('Start') }}</span>
          </el-card>

          <!-- 结束点 -->
          <el-card class="node-card point-card" shadow="hover" v-else-if="meta.type === 'end'">
            <span>{{ $t('End') }}</span>
          </el-card>

          <!-- 代码 -->
          <el-card class="node-card code-step-card" shadow="hover" v-else-if="meta.type === 'code'">
            <div class="step-header code-step-header">
              <i class="fa fa-fw fa-file-code-o"></i>
            </div>
            <div class="node-title">
              <div class="node-title-content">
                <span>{{ getTitle(meta) }}</span>
              </div>
            </div>
          </el-card>

          <!-- 分支 -->
          <el-card class="node-card branch-step-card" shadow="hover" v-else-if="meta.type === 'branch'">
            <div class="step-header branch-step-header">
              <i class="fa fa-fw fa-code-fork"></i>
            </div>
            <div class="node-title">
              <div class="node-title-content">
                <span>{{ getTitle(meta) }}</span>
              </div>
            </div>
          </el-card>
        </template>
      </super-flow>

      <!-- 配置 -->
      <el-dialog :title="`${$t('Setup')} - ${currentItem.id}`" :visible.sync="showConfigPanel" v-if="currentItem"
        :close-on-click-modal="false"
        :close-on-press-escape="false">
        <el-form :model="metaConfigForm" label-width="100px">
          <!-- 标题 -->
          <el-form-item :label="$t('Title')" v-if="hasConfig(currentItem.meta.type, 'title')">
            <el-input v-model="metaConfigForm.title" autocomplete="off"></el-input>
          </el-form-item>

          <!-- 代码 -->
          <el-form-item :label="$t('Code')" v-show="hasConfig(currentItem.meta.type, 'code')">
            <InfoBlock type="info" :title="$t('Function &quot;entry_func(prev_result)&quot; is the main func of the node')"></InfoBlock>

            <div id="codeStageContainer_Blueprint" :style="$store.getters.codeMirrorSetting.style">
              <textarea id="codeStage_Blueprint"></textarea>
            </div>
          </el-form-item>

          <!-- 输入参数 -->
          <el-form-item :label="$t('Kwargs')" prop="kwargs" v-if="hasConfig(currentItem.meta.type, 'kwargs')">
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

          <!-- 全局变量 -->
          <el-form-item :label="$t('Global Vars')" prop="globalVars" v-if="hasConfig(currentItem.meta.type, 'globalVars')">
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
        dataJSON: blueprint.genSampleData(),
        // dataJSON: "{\"origin\":[0,0],\"nodeList\":[{\"id\":\"start\",\"width\":60,\"height\":60,\"coordinate\":[72,116],\"meta\":{\"id\":\"start\",\"type\":\"start\",\"title\":null,\"updateTime\":\"2021-10-11T17:24:04.891Z\",\"kwargs\":[\"x\",\"y\"],\"globalVars\":[\"tmp\"]}},{\"id\":\"code_step_1\",\"width\":200,\"height\":50,\"coordinate\":[212,121],\"meta\":{\"id\":\"code_step_1\",\"type\":\"code\",\"title\":\"参数类型转换\",\"updateTime\":\"2021-10-11T17:25:03.830Z\",\"code\":\"def entry_func(prev_res):\\n    for k, v in prev_res.items():\\n        prev_res[k] = float(v)\\n    return prev_res\"}},{\"id\":\"branch_step_1\",\"width\":200,\"height\":50,\"coordinate\":[463,121],\"meta\":{\"id\":\"branch_step_1\",\"type\":\"branch\",\"title\":\"x > y ?\",\"updateTime\":\"2021-10-11T17:26:06.963Z\",\"code\":\"def entry_func(prev_res):\\n    return prev_res['x'] > prev_res['y']\"}},{\"id\":\"code_step_3\",\"width\":200,\"height\":50,\"coordinate\":[883,121],\"meta\":{\"id\":\"code_step_3\",\"type\":\"code\",\"title\":\"输出y值\",\"updateTime\":\"2021-10-11T17:26:37.196Z\",\"code\":\"def entry_func(prev_res):\\n    return prev_res['y']\"}},{\"id\":\"end\",\"width\":60,\"height\":60,\"coordinate\":[1335,116],\"meta\":{\"id\":\"end\",\"type\":\"end\",\"title\":null,\"updateTime\":\"2021-10-11T17:23:24.818Z\"}},{\"id\":\"code_step_2\",\"width\":200,\"height\":50,\"coordinate\":[819,43],\"meta\":{\"id\":\"code_step_2\",\"type\":\"code\",\"title\":\"输出x值\",\"updateTime\":\"2021-10-11T17:26:23.604Z\",\"code\":\"def entry_func(prev_res):\\n    return prev_res['x']\"}}],\"linkList\":[{\"id\":\"link-Ntww4dFZM47h\",\"startId\":\"start\",\"endId\":\"code_step_1\",\"startAt\":[60,30],\"endAt\":[0,25],\"meta\":{\"type\":\"next\",\"updateTime\":\"2021-10-11T17:23:12.050Z\"}},{\"id\":\"link-gXw8lu2n0Lpu\",\"startId\":\"code_step_1\",\"endId\":\"branch_step_1\",\"startAt\":[200,25],\"endAt\":[0,25],\"meta\":{\"type\":\"next\",\"updateTime\":\"2021-10-11T17:23:15.638Z\"}},{\"id\":\"link-WE4jBXiE0pea\",\"startId\":\"branch_step_1\",\"endId\":\"code_step_3\",\"startAt\":[200,25],\"endAt\":[0,25],\"meta\":{\"type\":\"nextOnFalse\",\"updateTime\":\"2021-10-11T17:23:22.097Z\"}},{\"id\":\"link-GXiDyKct3DAC\",\"startId\":\"branch_step_1\",\"endId\":\"code_step_2\",\"startAt\":[200,25],\"endAt\":[0,25],\"meta\":{\"type\":\"nextOnTrue\",\"updateTime\":\"2021-10-11T17:23:19.081Z\"}},{\"id\":\"link-q72NTrVfj1Jh\",\"startId\":\"code_step_2\",\"endId\":\"end\",\"startAt\":[200,25],\"endAt\":[0,30],\"meta\":{\"type\":\"next\",\"updateTime\":\"2021-10-11T17:23:27.496Z\"}},{\"id\":\"link-9Llttybk1NVN\",\"startId\":\"code_step_3\",\"endId\":\"end\",\"startAt\":[200,25],\"endAt\":[0,30],\"meta\":{\"type\":\"next\",\"updateTime\":\"2021-10-11T17:23:28.542Z\"}}]}"
      }

      if ('string' === demoData.dataJSON) {
        demoData.dataJSON = JSON.parse(demoData.dataJSON || '{}');
      }

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

    createNodeData(type, options) {
      options = options || {};

      // 节点ID
      let newNodeId = null;
      switch(type) {
        case 'start':
        case 'end':
          newNodeId = type;
          break;

        case 'code':
        case 'branch':
          newNodeId = `${type}_step_1`;
          let lastNodeSeq = this.$refs.superFlow.graph.nodeList
                              .filter(node => node.meta.type === type)
                              .map(node => parseInt(node.id.split('_').pop()))
                              .sort()
                              .pop();
          if (lastNodeSeq) {
            newNodeId = `${type}_step_${lastNodeSeq + 1}`;
          } else {
            newNodeId = `${type}_step_1`;
          }
          break;
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

      // 节点大小
      switch(node.meta.type) {
        case 'start':
        case 'end':
          node.width  = 60;
          node.height = 60;
          break;

        case 'code':
        case 'branch':
          node.width  = 200;
          node.height = 50;
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
        case 'next':
          // 下一步
          break;

        case 'nextOnTrue':
          // 条件为真下一步
          break;

        case 'nextOnFalse':
          // 条件为假下一步
          break;
      }

      return linkMeta;
    },
    updateItemMeta() {
      this.currentItem.meta = this.T.jsonCopy(this.metaConfigForm);
      this.currentItem.meta.updateTime = new Date().toISOString();
      if (this.codeMirror && this.hasConfig(this.currentItem.meta.type, 'code')) {
        this.currentItem.meta.code = this.codeMirror.getValue();
      }

      this.showConfigPanel = false;
    },

    enterIntercept(fromNode, toNode, graph) {
      // 不允许入口直接指向结束点
      if (fromNode.meta.type === 'start' && toNode.meta.type === 'end') {
        console.log(1)
        return false;
      }

      // 任何节点都不允许指向开始点
      if (toNode.meta.type === 'start') {
        console.log(2)
        return false;
      }

      return true;
    },
    outputIntercept(node, graph) {
      switch(node.meta.type) {
        case 'start':
          // 【开始点】只允许指向一处
          return graph.linkList.filter(link => link.start.id === node.id).length <= 0;
          break;

        case 'end':
          // 【结束点】不允许指向任何节点
          return false;
          break;

        case 'code':
          // 【代码】只允许指向一处
          return graph.linkList.filter(link => link.start.id === node.id).length <= 0;
          break;

        case 'branch':
          // 【分支】只允许指向两处
          return graph.linkList.filter(link => link.start.id === node.id).length <= 1;
          break;

        default:
          return true;
          break;
      }
    },
    linkDesc(link) {
      return this.getTitle(link.meta);
    },

    hasConfig(type, field) {
      return blueprint.hasConfig(type, field);
    },
    getTitle(meta) {
      // 非标准组件不返回
      if (!meta) return '';

      // 优先使用用户指定标题
      if (meta.title) return meta.title;

      // 默认标题
      switch(meta.type) {
        case 'code':
          return this.$t('Process Step');

        case 'branch':
          return this.$t('Branch Step');

        case 'nextOnTrue':
          return this.$t('True');

        case 'nextOnFalse':
          return this.$t('False');

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
      if (fromNode.meta.type === 'branch') {
        if (graph.linkList.filter(link => link.start.id === fromNode.id && link.meta.type === 'nextOnTrue').length === 0) {
          link.meta = this.createLinkMeta('nextOnTrue');
        } else {
          link.meta = this.createLinkMeta('nextOnFalse');
        }
      } else {
        link.meta = this.createLinkMeta('next');
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
            label: this.$t('Add Process Step'),
            selected: (graph, coordinate) => {
              graph.addNode(this.createNodeData('code', {
                coordinate: coordinate,
              }));
            },
          },
          {
            icon : 'fa-code-fork',
            label: this.$t('Add Branch Step'),
            selected: (graph, coordinate) => {
              graph.addNode(this.createNodeData('branch', {
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
            hidden: (node) => {
              return node.meta.type === 'end';
            },
            selected: (node, coordinate) => {
              let nextMeta = this.T.jsonCopy(node.meta);

              this.currentItem = node;
              this.currentItem.meta = nextMeta;
              this.$set(this, 'metaConfigForm', nextMeta);

              this.showConfigPanel = true;

              if (this.hasConfig(node.meta.type, 'code')) {
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
            hidden: (node) => {
              return ['start', 'end'].indexOf(node.meta.type) >= 0;
            },
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

      let style = {
        background: uiColorSchema === 'light' ? 'white' : '#222222',
        font      : '16px Iosevka',
      }

      return style;
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

.node-card.point-card {
  border: 2px solid #FF6600 !important;
  border-radius: 100px;
}
.node-card.point-card > .el-card__body {
  display: flex;
  align-items: center;
  justify-content: center;
}

.node-card.code-step-card {
  border: 2px solid #FF6600 !important;
}
.node-card.branch-step-card {
  border: 2px solid orange !important;
}
.node-card .step-header {
  text-align: left;
  padding: 5px;
  color: white;
  display: flex;
  align-items: center;
  font-size: 18px;
}
.node-card .code-step-header {
  background-color: #FF6600;
}
.node-card .branch-step-header {
  background-color: orange;
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
