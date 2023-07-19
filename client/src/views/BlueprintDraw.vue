<i18n locale="zh-CN" lang="yaml">
</i18n>

<template>
  <transition name="fade">
    <el-container direction="vertical" v-show="$store.state.isLoaded">
      <!-- 标题区 -->
      <el-header height="60px">
        <div class="page-header">
          <span>{{ $t('Blueprint') }} (WIP)</span>
          <div class="header-control header-control-left">
            <el-button  type="primary" plain size="small">
              <i class="fa fa-fw fa-plus"></i>
            </el-button>

          </div>
        </div>
      </el-header>

      <!-- 画布区 -->



    </el-container>
  </transition>
</template>

<script>
import LogicFlow from '@logicflow/core'
import { Menu, Snapshot, MiniMap } from '@logicflow/extension'
import '@logicflow/core/dist/style/index.css'
import '@logicflow/extension/lib/style/index.css'
import * as blueprint from '@/blueprint'

export default {
  name: 'BlueprintDraw',
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
    codeMirrorTheme(val) {
      this.codeMirror.setOption('theme', val);
    },
  },
  methods: {
    async loadData(selectBlueprintId) {
      // 获取蓝图列表
      let apiRes = await this.T.callAPI_getAll('/api/v1/blueprints/do/list');
      if (!apiRes || !apiRes.ok) return;

      this.blueprints = apiRes.data;

      if (selectBlueprintId) {
        this.data = this.blueprints.find(d => d.id === selectBlueprintId);

      } else {
        if (this.blueprints.length > 0) {
          this.data = this.blueprints[0];
        } else {
          this.data = {};
        }
      }

      this.$store.commit('updateLoadStatus', true);
    },

    // 跳转
    goToStartFunc(blueprintId) {
      let scriptId = `${blueprintId}__blueprint`;
      let funcId   = `${scriptId}.start`;

      // 记录选择的脚本 ID，记录函数高亮
      this.$store.commit('updateEditor_selectedItemId', funcId);

      // 跳转
      this.$router.push({
        name  : 'code-viewer',
        params: {id: scriptId},
      });
    },

    // 蓝图处理
    openAddBlueprint() {
      this.blueprintPanelMode = 'add';

      this.T.jsonClear(this.form);

      this.showBlueprintPanel = true;
    },
    openRenameBlueprint() {
      this.blueprintPanelMode = 'rename';

      this.T.jsonClear(this.form);

      let nextForm = {};
      Object.keys(this.form).forEach(f => nextForm[f] = this.data[f]);
      this.form = nextForm;

      this.showBlueprintPanel = true;
    },
    async submitBlueprint() {
      let apiRes = null;
      let nextBlueprintId = null
      switch(this.blueprintPanelMode) {
        case 'add':
          apiRes = await this.T.callAPI('post', '/api/v1/blueprints/do/add', {
            body: {
              data: {
                id        : this.form.id,
                title     : this.form.title,
                canvasJSON: this.genInitCanvasJSON(),
              }
            },
            alert: { okMessage: this.$t('Blueprint created') },
          });
          if (!apiRes || !apiRes.ok) return;

          // 成功后展示的蓝图
          nextBlueprintId = apiRes.data.id;

          break;

        case 'rename':
          apiRes = await this.T.callAPI('post', '/api/v1/blueprints/:id/do/modify', {
            params: { id: this.data.id },
            body: {
              data: {
                title: this.form.title,
              }
            },
            alert : { okMessage: this.$t('Blueprint saved') },
          });
          if (!apiRes || !apiRes.ok) return;

          // 成功后展示的蓝图
          nextBlueprintId = this.data.id;

          break;
      }

      this.loadData(nextBlueprintId);
      this.showBlueprintPanel = false;
    },
    async deployBlueprintCanvas() {
      let canvasJSON = await this.saveBlueprintCanvas();
      let scriptCode = blueprint.genScriptCode(canvasJSON.nodeList, canvasJSON.linkList);

      let blueprintScriptSetId = this.data.id;
      let blueprintScriptId    = `${blueprintScriptSetId}__blueprint`;

      // 创建脚本集
      let apiRes = await this.T.callAPI_getOne('/api/v1/script-sets/do/list', blueprintScriptSetId);
      if (!apiRes || !apiRes.ok) return;
      if (!apiRes.data) {
        apiRes = await this.T.callAPI('post', '/api/v1/script-sets/do/add', {
          body : {
            data: {
              id   : blueprintScriptSetId,
              title: this.data.title || null,
            }
          },
        });
        if (!apiRes || !apiRes.ok) return;
      }

      // 创建脚本
      apiRes = await this.T.callAPI_getOne('/api/v1/scripts/do/list', blueprintScriptId);
      if (!apiRes || !apiRes.ok) return;
      if (!apiRes.data) {
        // 未创建时创建
        apiRes = await this.T.callAPI('post', '/api/v1/scripts/do/add', {
          body : {
            data: {
              id       : blueprintScriptId,
              title    : 'Blueprint',
              codeDraft: scriptCode,
            }
          },
        });
        if (!apiRes || !apiRes.ok) return;

      } else {
        // 已创建时更新
        apiRes = await this.T.callAPI('post', '/api/v1/scripts/:id/do/modify', {
          params: { id: blueprintScriptId },
          body : {
            data: {
              codeDraft: scriptCode,
            }
          },
        });
        if (!apiRes || !apiRes.ok) return;
      }

      // 发布脚本
      apiRes = await this.T.callAPI('post', '/api/v1/scripts/:id/do/publish', {
        params: { id: blueprintScriptId },
        body  : { wait: true },
      });
      if (!apiRes || !apiRes.ok) return;

      // 标记为已部署
      apiRes = await this.T.callAPI('post', '/api/v1/blueprints/:id/do/modify', {
        params: { id: this.data.id },
        body: {
          data: {
            isDeployed: true,
          }
        },
        alert : { okMessage: this.$t('Blueprint deployed') },
      });
      if (!apiRes || !apiRes.ok) return;

      this.goToStartFunc(this.data.id);
    },
    async saveBlueprintCanvas() {
      let canvasJSON = this._getGraph().toJSON()

      let apiRes = await this.T.callAPI('post', '/api/v1/blueprints/:id/do/modify', {
        params: { id: this.data.id },
        body: {
          data: {
            canvasJSON: canvasJSON,
            isDeployed: false,
          }
        },
        alert : { okMessage: this.$t('Blueprint saved') },
      });

      this.loadData(this.data.id);

      return canvasJSON;
    },
    async deleteBlueprintCanvas() {
      if (!await this.T.confirm(this.$t('Are you sure you want to delete the Blueprint?'))) return;

      let apiRes = await this.T.callAPI('/api/v1/blueprints/:id/do/delete', {
        params: { id: this.data.id },
        alert : { okMessage: this.$t('Blueprint deleted') },
      });

      this.loadData();
    },

    // 画布处理
    genInitCanvasJSON() {
      return {
        linkList: [
          {
            id     : 'link-001',
            meta   : { 'type': 'next' },
            endId  : 'code_step_1', endAt  : [ 0, 25 ],
            startId: 'start',       startAt: [ 60, 30 ],
          },
          {
            id     : 'link-002',
            meta   : { 'type': 'next' },
            endId  : 'end',         endAt  : [ 0, 30 ],
            startId: 'code_step_1', startAt: [ 200, 25 ],
          }
        ],
        nodeList: [
          {
            id   : 'start',
            meta : { 'id': 'start', 'type': 'start' },
            width: 60, height: 60, coordinate: [ 76, 53 ]
          },
          {
            id   : 'end',
            meta : { 'id': 'end', 'type': 'end' },
            width: 60, height: 60, coordinate: [ 558, 53 ]
          },
          {
            id   : 'code_step_1',
            meta : { 'id': 'code_step_1', 'type': 'code' },
            width: 200, height: 50, coordinate: [ 253, 58 ]
          }
        ]
      };
    },
    createNodeData(type, options) {
      options = options || {};

      // 节点 ID
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
      this.currentItem.meta = this.T.jsonCopy(this.itemMetaConfigForm);
      this.currentItem.meta.updateTime = new Date().toISOString();
      if (this.codeMirror && this.hasConfig(this.currentItem.meta.type, 'code')) {
        this.currentItem.meta.code = this.codeMirror.getValue();
      }

      this.showItemConfigPanel  = false;
    },

    enterIntercept(fromNode, toNode, graph) {
      // 不允许入口直接指向结束点
      if (fromNode.meta.type === 'start' && toNode.meta.type === 'end') {
        return false;
      }

      // 任何节点都不允许指向开始点
      if (toNode.meta.type === 'start') {
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
      this.itemMetaConfigForm.kwargs.splice(this.itemMetaConfigForm.kwargs.indexOf(kw), 1);
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
        if (!Array.isArray(this.itemMetaConfigForm.kwargs)) {
          this.$set(this.itemMetaConfigForm, 'kwargs', []);
        }
        this.itemMetaConfigForm.kwargs.push(newKwargs);
      }
      this.showAddKwargs = false;
      this.newKwargs     = '';
    },

    removeGlobalVar(gv) {
      this.itemMetaConfigForm.globalVars.splice(this.itemMetaConfigForm.globalVars.indexOf(gv), 1);
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
        if (!Array.isArray(this.itemMetaConfigForm.globalVars)) {
          this.$set(this.itemMetaConfigForm, 'globalVars', []);
        }
        this.itemMetaConfigForm.globalVars.push(newGlobalVar);
      }
      this.showAddGlobalVar = false;
      this.newGlobalVar     = '';
    },
  },
  computed: {
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
              this.$set(this, 'itemMetaConfigForm', nextMeta);

              this.showItemConfigPanel  = true;

              if (this.hasConfig(node.meta.type, 'code')) {
                setImmediate(() => {
                  // 初始化编辑器
                  if (!document.querySelector('#codeStage_Blueprint + .CodeMirror')) {
                  // if (!this.codeMirror) {
                    this.codeMirror = this.T.initCodeMirror('codeStage_Blueprint');
                    this.codeMirror.setOption('theme', this.codeMirrorTheme);
                  }

                  // 载入代码
                  this.codeMirror.setValue(nextMeta.code || blueprint.genSampleCode());
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
      },
      form: {
        id   : null,
        title: null,
      },
      formRules: {
        id: [
          {
            trigger : 'change',
            message : this.$t('Please input ID'),
            required: true,
          },
          {
            trigger: 'change',
            message: this.$t('Only alphabets, numbers and underscore are allowed'),
            pattern: /^[a-zA-Z0-9_]*$/g,
          },
          {
            trigger: 'change',
            message: this.$t('Cannot not starts with a number'),
            pattern: /^[^0-9]/g,
          },
          {
            trigger: 'change',
            validator: (rule, value, callback) => {
              if (value.indexOf('__') >= 0) {
                let _message = this.$t('ID cannot contains double underscore "__"');
                return callback(new Error(_message));
              }
              return callback();
            },
          },
        ],
      },

      blueprints: [],

      // 蓝图配置
      blueprintPanelMode: '',
      showBlueprintPanel: false,

      // 项目配置
      showItemConfigPanel: false,

      showAddKwargs: false,
      newKwargs    : '',

      showAddGlobalVar: false,
      newGlobalVar    : '',

      currentItem: null,
      itemMetaConfigForm: {
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
  beforeDestroy() {
    this.T.destoryCodeMirror(this.codeMirror);
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

</style>

<style>
.blueprint-list {
  width: 300px;
}
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
  background-image: linear-gradient(to right, #FF6600FF 16%, #FFFF 16%, #FFFF);
}
.node-card.branch-step-card {
  border: 2px solid orange !important;
  background-image: linear-gradient(to right, #ffa500FF 16%, #FFFF 16%, #FFFF);
}
.node-card .step-header {
  text-align: left;
  padding: 5px;
  color: white;
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
