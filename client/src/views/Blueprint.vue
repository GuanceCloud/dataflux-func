<i18n locale="zh-CN" lang="yaml">
Deployed    : 已部署
Not Deployed: 未部署

Title: 标题

Start       : 开始
End         : 结束
Process Step: 处理步骤
Branch Step : 分支步骤
'True'      : 真
'False'     : 假

Select Blueprint: 选择蓝图
Add Process Step: 添加处理步骤
Add Branch Step : 添加分支步骤
Select all      : 全选

'Function "entry_func(prev_result)" is the main func of the node': '函数"entry_func(prev_res)"为节点的入口函数'

Code          : 代码
Kwargs        : 执行参数
Add Kwargs    : 添加执行参数
Global Vars   : 全局变量
Add Global Var: 添加全局变量

Please input ID: 请输入ID
Only alphabets, numbers and underscore are allowed: 只能包含大小写英文、数字及下划线
Cannot not starts with a number: 不得以数字开头
'ID cannot contains double underscore "__"': 'ID不能包含"__"'

Blueprint created : 蓝图已创建
Blueprint saved   : 蓝图已保存
Blueprint deployed: 蓝图已部署
Blueprint deleted : 蓝图已删除

Are you sure you want to delete the Blueprint?: 是否确认删除此蓝图？
</i18n>

<template>
  <transition name="fade">
    <el-container direction="vertical" v-if="$store.state.isLoaded">
      <!-- 标题区 -->
      <el-header height="60px">
        <h1>
          {{ $t('Blueprint') }} (WIP)

          &#12288;
          <el-button @click="openAddBlueprint" type="primary" plain size="mini">
            <i class="fa fa-fw fa-plus"></i>
          </el-button>
          <el-select @change="loadData(data.id)" size="mini" v-model="data.id" :placeholder="$t('Select Blueprint')" class="blueprint-list">
            <el-option v-for="b in blueprints" :key="b.id" :label="b.title" :value="b.id">
              <span class="float-left">{{ b.title || b.id }}</span>
              <span v-if="b.isDeployed" class="float-right text-good">{{ $t('Deployed') }}</span>
              <span v-else class="float-right text-bad">{{ $t('Not Deployed') }}</span>
            </el-option>
          </el-select>

          <template v-if="data.id">
            <el-button-group>
              <el-button @click="openRenameBlueprint" size="mini">
                <i class="fa fa-fw fa-edit"></i> {{ $t('Rename') }}
              </el-button>

              <el-button @click="saveBlueprintCanvas" size="mini">
                <i class="fa fa-fw fa-save"></i> {{ $t('Save') }}
              </el-button>
            </el-button-group>

              <el-button @click="deployBlueprintCanvas" type="primary" plain size="mini" class="fix-compact-button">
                <i class="fa fa-fw fa-coffee"></i> {{ $t('Deploy') }}
              </el-button>

            <el-button @click="deleteBlueprintCanvas" size="mini" class="fix-compact-button">
              <i class="fa fa-fw fa-times"></i> {{ $t('Delete') }}
            </el-button>
          </template>
        </h1>
      </el-header>

      <!-- 画布区 -->
      <super-flow ref="superFlow" v-if="data.canvasJSON"
        :graph-menu="graphMenu"
        :node-menu="nodeMenu"
        :link-menu="linkMenu"
        :enter-intercept="enterIntercept"
        :output-intercept="outputIntercept"
        :link-base-style="linkBaseStyle"
        :link-desc="linkDesc"
        :node-list="data.canvasJSON.nodeList"
        :link-list="data.canvasJSON.linkList"

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

      <!-- 新建/重命名蓝图 -->
      <el-dialog :title="blueprintPanelMode === 'add' ? $t('Add') : $t('Rename')" :visible.sync="showBlueprintPanel"
        width="620px"
        :close-on-click-modal="false"
        :close-on-press-escape="false">
        <el-form label-width="100px" :model="form" :rules="formRules">
          <el-form-item label="ID" prop="id" v-if="blueprintPanelMode === 'add'">
            <el-input :disabled="T.pageMode() === 'setup'"
              maxlength="80"
              show-word-limit
              v-model="form.id"></el-input>
          </el-form-item>

          <el-form-item :label="$t('Title')">
            <el-input :placeholder="$t('Optional')"
              maxlength="25"
              show-word-limit
              v-model="form.title"></el-input>
          </el-form-item>

          <el-form-item>
            <div class="setup-right">
              <el-button type="primary" @click="submitBlueprint">{{ $t('Save') }}</el-button>
            </div>
          </el-form-item>
        </el-form>
      </el-dialog>

      <!-- 图表元素配置 -->
      <el-dialog :title="`${$t('Setup')} - ${currentItem.id}`" :visible.sync="showItemConfigPanel" v-if="currentItem"
        :close-on-click-modal="false"
        :close-on-press-escape="false">
        <el-form label-width="100px" :model="itemMetaConfigForm">
          <!-- 标题 -->
          <el-form-item :label="$t('Title')" v-if="hasConfig(currentItem.meta.type, 'title')">
            <el-input v-model="itemMetaConfigForm.title" autocomplete="off"></el-input>
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
            <el-tag v-for="kw in itemMetaConfigForm.kwargs" :key="kw" type="primary" closable @close="removeKwargs(kw)">{{ kw }}</el-tag>
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
            <el-tag v-for="gv in itemMetaConfigForm.globalVars" :key="gv" type="info" closable @close="removeGlobalVar(gv)">{{ gv }}</el-tag>
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
          <el-button @click="showItemConfigPanel  = false">{{ $t('Cancel') }}</el-button>
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

    async loadData(selectBlueprintId) {
      // 获取蓝图列表
      let apiRes = await this.T.callAPI_getAll('/api/v1/blueprints/do/list');
      if (!apiRes.ok) return;

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

      // 记录选择的脚本ID，记录函数高亮
      this.$store.commit('updateAsideScript_currentNodeKey', funcId);
      this.$store.commit('updateEditor_highlightedFuncId', funcId);

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
          if (!apiRes.ok) return;

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
          if (!apiRes.ok) return;

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
      if (!apiRes.ok) return;
      if (!apiRes.data) {
        apiRes = await this.T.callAPI('post', '/api/v1/script-sets/do/add', {
          body : {
            data: {
              id   : blueprintScriptSetId,
              title: this.data.title || null,
            }
          },
        });
        if (!apiRes.ok) return;
      }

      // 创建脚本
      apiRes = await this.T.callAPI_getOne('/api/v1/scripts/do/list', blueprintScriptId);
      if (!apiRes.ok) return;
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
        if (!apiRes.ok) return;

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
        if (!apiRes.ok) return;
      }

      // 发布脚本
      apiRes = await this.T.callAPI('post', '/api/v1/scripts/:id/do/publish', {
        params: { id: blueprintScriptId },
        body  : { force: true, wait : true },
      });
      if (!apiRes.ok) return;

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
      if (!apiRes.ok) return;

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
    formRules() {
      return {
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
      }
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
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
/* Special Fix */
.el-button-group {
  position: relative;
  top: 1px !important;
}
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
