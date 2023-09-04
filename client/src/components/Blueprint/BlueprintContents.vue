<i18n locale="zh-CN" lang="yaml">
  Undo    : 撤销
  Redo    : 重做
  Reset   : 重置

  Zoom In : 放大
  Zoom Out: 缩小
  Fit View: 适合大小
  Drag to add: 拖拽添加节点

  Selected: 已选中
  Open Setting Panel: 打开设置面板

  Parameter                 : 参数
  Calling Preview           : 调用预览
  Passed as first parameter : 作为第一个参数传递
  Unpack as named parameters: 以具名参数解包
  Assign by name            : 按名称指定
  No parameter              : 不传递参数
  Add Switch                : 添加分支
  IF                        : 如果
  ELSE                      : 除此之外
  Python expression         : Python 表达式

  Input Field   : 输入字段
  Output Field  : 输出字段
  Algorithm     : 算法
  Operation     : 操作
  Encode        : 编码
  Decode        : 解码
  Serialize     : 序列化
  Deserialize   : 反序列化
  Cipher        : 加密
  Decipher      : 解密
  Length        : 长度
  Type          : 类型
  Text          : 文本
  Min Value     : 最小值
  Max Value     : 最大值
  Method        : 方法
  Body          : 请求体
  Body Type     : 请求体类型
  Plain Text    : 纯文本
  Content       : 内容
  URL           : URL 地址
  Secret        : 密钥

  Or double-click the node: 或鼠标双击节点
  Enter this branch if no expression returns True: 没有任何表达式返回 True 时，进入本分支
  Please input a Python Expression which returns a bool for Switch: 请输入一个返回布尔值的 Python 表达式

  Blueprint deployed: 蓝图已部署

  Are you sure you want to deploy the Blueprint?: 是否确认部署此蓝图？
</i18n>

<template>
  <transition name="fade">
    <el-container direction="vertical" v-show="$store.state.isLoaded">
      <!-- 标题区 -->
      <el-header height="60px">
        <div class="common-page-header">
          <div>
            <h1>{{ $t('Blueprint') }}</h1>
            <span class="text-main">{{ data.title || data.id }}</span>
            &#12288;
            <el-button size="mini" @click="deploy">
              <i class="fa fa-fw fa-coffee"></i>
              {{ $t('Deploy') }}
            </el-button>
            &nbsp;
            <el-button-group>
              <el-tooltip effect="dark" :content="$t('Undo')" placement="bottom">
                <el-button size="mini" :disabled="!undoAble" @click="canvasAction('undo')">
                  <i class="fa fa-fw fa-undo"></i>
                </el-button>
              </el-tooltip>
              <el-tooltip effect="dark" :content="$t('Redo')" placement="bottom">
                <el-button size="mini" :disabled="!redoAble" @click="canvasAction('redo')">
                  <i class="fa fa-fw fa-repeat"></i>
                </el-button>
              </el-tooltip>
            </el-button-group>
            &nbsp;
            <el-button-group>
              <el-tooltip effect="dark" :content="$t('Zoom In')" placement="bottom">
                <el-button size="mini" @click="canvasAction('zoomIn')">
                  <i class="fa fa-fw fa-plus"></i>
                </el-button>
              </el-tooltip>
              <el-tooltip effect="dark" :content="$t('Reset')" placement="bottom">
                <el-button size="mini" @click="canvasAction('resetZoom')" style="width: 70px">
                  {{ parseInt(currentScale * 100) }}%
                </el-button>
              </el-tooltip>
              <el-tooltip effect="dark" :content="$t('Zoom Out')" placement="bottom">
                <el-button size="mini" @click="canvasAction('zoomOut')">
                  <i class="fa fa-fw fa-minus"></i>
                </el-button>
              </el-tooltip>
              <el-button size="mini" @click="canvasAction('fitView')">
                <i class="fa fa-fw fa-window-maximize"></i>
                {{ $t('Fit View') }}
              </el-button>
            </el-button-group>

            &#12288;
            <template v-if="selectedElementData">
              <span>{{ $t('Selected') }}{{ $t(':') }}</span>
              <strong class="text-main">{{ C.BLUEPRINT_ELEMENT_TYPE_MAP.get(selectedElementData.type).name }}</strong>
              &nbsp;
              <el-tooltip effect="dark" :content="$t('Or double-click the node')" placement="bottom">
                <el-button v-if="selectedElementCanAction('openProps')"
                  size="mini"
                  type="primary" plain
                  @click="elementAction('openProps')">
                  <i class="fa fa-fw fa-sliders"></i>
                  {{ $t('Open Setting Panel') }}
                </el-button>
              </el-tooltip>

              <el-tooltip v-if="selectedElementCanAction('delete')"
                effect="dark"
                :content="$t('Delete')"
                placement="bottom">
                <el-button size="mini" @click="elementAction('delete')">
                  <i class="fa fa-fw fa-trash"></i>
                </el-button>
              </el-tooltip>
            </template>
          </div>
          <div class="header-control">
          </div>
        </div>
      </el-header>

      <!-- 画布区 -->
      <div id="logicFlowContainer">
        <!-- 画布 -->
        <div id="logicFlow" ref="logicFlow"></div>

        <!-- 拖拽面板 -->
        <div id="logicFlowDnd">
          <div class="dnd-title">{{ $t('Drag to add') }}</div>

          <div class="dnd-node">
            <div class="node" @mousedown="canvasAction('dragAddNode', { type: 'CodeNode' })">
              <div class="node-icon"><i class="fa fa-fw fa-code"></i></div>
              <div class="node-text">{{ $t('Code Node') }}</div>
            </div>
          </div>

          <div class="dnd-node">
            <div class="node" @mousedown="canvasAction('dragAddNode', { type: 'FuncNode' })">
              <div class="node-icon code-font text-info">def</div>
              <div class="node-text">{{ $t('Func Node') }}</div>
            </div>
          </div>

          <div class="dnd-node">
            <div class="node" @mousedown="canvasAction('dragAddNode', { type: 'SwitchNode' })">
              <div class="node-icon"><i class="fa fa-fw fa-sitemap fa-rotate-270"></i></div>
              <div class="node-text">{{ $t('Switch Node') }}</div>
            </div>
          </div>

          <div class="dnd-title">{{ $t('Built-in') }}</div>

          <div class="dnd-node">
            <div class="node" @mousedown="canvasAction('dragAddNode', { type: 'BuiltinHashNode' })">
              <div class="node-icon"><i class="fa fa-fw fa-magic"></i></div>
              <div class="node-text">{{ $t('Hash') }}</div>
            </div>
          </div>

          <div class="dnd-node">
            <div class="node" @mousedown="canvasAction('dragAddNode', { type: 'BuiltinBase64Node' })">
              <div class="node-icon"><i class="fa fa-fw fa-magic"></i></div>
              <div class="node-text">{{ $t('Base64') }}</div>
            </div>
          </div>

          <div class="dnd-node">
            <div class="node" @mousedown="canvasAction('dragAddNode', { type: 'BuiltinRandomNode' })">
              <div class="node-icon"><i class="fa fa-fw fa-magic"></i></div>
              <div class="node-text">{{ $t('Random') }}</div>
            </div>
          </div>

          <div class="dnd-node">
            <div class="node" @mousedown="canvasAction('dragAddNode', { type: 'BuiltinJSONNode' })">
              <div class="node-icon"><i class="fa fa-fw fa-magic"></i></div>
              <div class="node-text">{{ $t('JSON') }}</div>
            </div>
          </div>

          <div class="dnd-node">
            <div class="node" @mousedown="canvasAction('dragAddNode', { type: 'BuiltinYAMLNode' })">
              <div class="node-icon"><i class="fa fa-fw fa-magic"></i></div>
              <div class="node-text">{{ $t('YAML') }}</div>
            </div>
          </div>

          <div class="dnd-node">
            <div class="node" @mousedown="canvasAction('dragAddNode', { type: 'BuiltinHTTPNode' })">
              <div class="node-icon"><i class="fa fa-fw fa-magic"></i></div>
              <div class="node-text">{{ $t('HTTP Request') }}</div>
            </div>
          </div>

          <div class="dnd-node">
            <div class="node" @mousedown="canvasAction('dragAddNode', { type: 'BuiltinDingTalkNode' })">
              <div class="node-icon"><i class="fa fa-fw fa-magic"></i></div>
              <div class="node-text">{{ $t('DingTalk Robot') }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 编辑弹框 -->
      <el-dialog
        :title="propSettingTitle"
        :visible.sync="showSetting"
        :close-on-click-modal="false"
        :close-on-press-escape="false"
        @closed="onCloseProp"
        width="850px">
        <div class="prop-form">
          <el-form ref="form" label-width="120px" :model="form" :rules="formRules">
            <!-- 标题 -->
            <el-form-item :label="$t('Title')" v-if="selectedElementHasProp('title')">
              <el-input :placeholder="$t('Optional')" v-model="form.title"></el-input>
            </el-form-item>

            <!-- 代码 -->
            <el-form-item :label="$t('Code')" v-show="selectedElementHasProp('code')">
              <div id="codeContainer_BlueprintContents" :style="$store.getters.codeMirrorSettings.style">
                <textarea id="code_BlueprintContents"></textarea>
              </div>
            </el-form-item>

            <!-- 函数 -->
            <el-form-item :label="$t('Func')" v-show="selectedElementHasProp('funcId')">
              <el-cascader ref="funcCascader"
                popper-class="code-font"
                placeholder="--"
                filterable
                :filter-method="common.funcCascaderFilter"
                v-model="form.funcId"
                :options="funcCascader"
                :props="{ expandTrigger: 'hover', emitPath: false, multiple: false }"
                @change=""></el-cascader>
            </el-form-item>

            <!-- 参数传递方式 -->
            <el-form-item :label="$t('Parameter')" v-if="selectedElementHasProp('parameterPassingMethod')">
              <el-select v-model="form.parameterPassingMethod">
                <el-option :label="$t('Passed as first parameter')" value="passAsFirstParameter"></el-option>
                <el-option :label="$t('Unpack as named parameters')" value="unpackAsNamedParameters"></el-option>
                <el-option :label="$t('Assign by name')" value="assignByName"></el-option>
                <el-option :label="$t('No parameter')" value="noParameter"></el-option>
              </el-select>
            </el-form-item>

            <!-- 参数指定 -->
            <template v-if="form.parameterPassingMethod === 'assignByName'">
              <el-form-item v-for="arg in selectedFunc.argsJSON" :key="arg">
                <span slot="label" class="parameter-assign-label">{{ arg }} =</span>
                <el-input
                  v-model="form.parameterAssigningMap[arg]"
                  :placeholder="$t('Python expression')"></el-input>
              </el-form-item>
            </template>

            <!-- 分支表达式 -->
            <template v-if="selectedElementHasProp('switchItems')">
              <el-form-item class="config-divider" :label="$t('Switch')">
                <el-divider></el-divider>
              </el-form-item>

              <template v-for="(item, index) in form.switchItems || []">
                <el-form-item
                  :label="`#${index + 1}`"
                  :key="`switch-${index}`"
                  :rules="formRules_item">
                  <span slot="label" class="switch-item-label">#{{ index + 1 }}</span>
                  <div class="switch-item">
                    <div>
                      <el-select class="switch-item-type" v-model="item.type">
                        <el-option :label="$t('IF')" value="expr"></el-option>
                        <el-option :label="$t('ELSE')" value="else"></el-option>
                      </el-select>

                      <el-input v-if="item.type === 'expr'"
                        class="switch-item-expr"
                        v-model="item.expr"
                        :placeholder="$t('Python expression')"></el-input>
                      <span class="text-info switch-item-else" v-else-if="item.type === 'else'">{{ $t('Enter this branch if no expression returns True' ) }}</span>
                    </div>

                    <!-- 删除按钮 -->
                    <el-link type="primary" @click.prevent="removeSwitchExpr(index)">{{ $t('Delete') }}</el-link>
                  </div>
                </el-form-item>
              </template>

              <el-form-item>
                <el-link type="primary" @click="addSwitchExpr"><i class="fa fa-fw fa-plus"></i> {{ $t('Add Switch') }}</el-link>
              </el-form-item>
            </template>

            <!-- 输入字段 -->
            <el-form-item :label="$t('Input Field')" v-if="selectedElementHasProp('inputField')">
              <el-input v-model="form.inputField"></el-input>
            </el-form-item>

            <!-- 输出字段 -->
            <el-form-item :label="$t('Output Field')" v-if="selectedElementHasProp('outputField')">
              <el-input v-model="form.outputField"></el-input>
            </el-form-item>

            <!-- 编码 / 解码 -->
            <el-form-item :label="$t('Operation')" v-if="selectedElementHasProp('encodeOrDecode')">
              <el-select
                v-model="form.encodeOrDecode">
                <el-option :label="$t('Encode')" value="encode"></el-option>
                <el-option :label="$t('Decode')" value="decode"></el-option>
              </el-select>
            </el-form-item>

            <!-- 序列化 / 反序列化 -->
            <el-form-item :label="$t('Operation')" v-if="selectedElementHasProp('serializeOrDeserialize')">
              <el-select
                v-model="form.serializeOrDeserialize">
                <el-option :label="$t('Serialize')" value="serialize"></el-option>
                <el-option :label="$t('Deserialize')" value="deserialize"></el-option>
              </el-select>
            </el-form-item>

            <!-- 加密 / 解密 -->
            <el-form-item :label="$t('Operation')" v-if="selectedElementHasProp('cipherOrDecipher')">
              <el-select
                v-model="form.cipherOrDecipher">
                <el-option :label="$t('Cipher')" value="cipher"></el-option>
                <el-option :label="$t('Decipher')" value="decipher"></el-option>
              </el-select>
            </el-form-item>

            <!-- 哈希算法 -->
            <el-form-item :label="$t('Algorithm')" v-if="selectedElementHasProp('hashAlgorithm')">
              <el-select
                v-model="form.hashAlgorithm">
                <el-option label="MD5" value="md5"></el-option>
                <el-option label="SHA1" value="sha1"></el-option>
                <el-option label="SHA256" value="sha256"></el-option>
                <el-option label="SHA512" value="sha512"></el-option>
              </el-select>
            </el-form-item>

            <!-- 值类型 -->
            <el-form-item :label="$t('Type')" v-if="selectedElementHasProp('randomType')">
              <el-select
                v-model="form.randomType">
                <el-option :label="$t('String')" value="string"></el-option>
                <el-option :label="$t('Integer')" value="integer"></el-option>
                <el-option :label="$t('Float')" value="float"></el-option>
              </el-select>
            </el-form-item>

            <!-- 钉钉机器人消息类型 -->
            <el-form-item :label="$t('Type')" v-if="selectedElementHasProp('dingTalkMessageType')">
              <el-select
                v-model="form.dingTalkMessageType">
                <el-option :label="$t('Text')" value="text"></el-option>
                <el-option :label="$t('Markdown')" value="markdown"></el-option>
                <el-option :label="$t('JSON')" value="json"></el-option>
              </el-select>
            </el-form-item>

            <!-- 长度 -->
            <el-form-item :label="$t('Length')" v-if="selectedElementHasProp('randomLength')">
              <el-input-number v-model="form.randomLength" :step="1" :min="1" :max="100" step-strictly></el-input-number>
            </el-form-item>

            <!-- 最小值 -->
            <el-form-item :label="$t('Min Value')" v-if="selectedElementHasProp('minValue')">
              <el-input-number v-model="form.minValue" :step="1"></el-input-number>
            </el-form-item>

            <!-- 最大值 -->
            <el-form-item :label="$t('Max Value')" v-if="selectedElementHasProp('maxValue')">
              <el-input-number v-model="form.maxValue" :step="1"></el-input-number>
            </el-form-item>

            <!-- HTTP 方法 -->
            <el-form-item :label="$t('Method')" v-if="selectedElementHasProp('httpMethod')">
              <el-select
                v-model="form.httpMethod">
                <el-option label="GET" value="get"></el-option>
                <el-option label="POST" value="post"></el-option>
                <el-option label="PUT" value="put"></el-option>
                <el-option label="PATCH" value="patch"></el-option>
                <el-option label="DELETE" value="delete"></el-option>
              </el-select>
            </el-form-item>

            <!-- URL -->
            <el-form-item :label="$t('URL')" v-if="selectedElementHasProp('url')">
              <el-input v-model="form.url"></el-input>
            </el-form-item>

            <!-- 密钥 -->
            <el-form-item :label="$t('Secret')" v-if="selectedElementHasProp('secret')">
              <el-input v-model="form.secret"></el-input>
            </el-form-item>

            <!-- Body Type -->
            <el-form-item :label="$t('Body Type')" v-if="selectedElementHasProp('httpContentType')">
              <el-select
                v-model="form.httpContentType">
                <el-option :label="$t('Plain Text')" value="text/plain"></el-option>
                <el-option label="JSON" value="application/json"></el-option>
              </el-select>
            </el-form-item>

            <!-- Body -->
            <el-form-item :label="$t('Body')" v-if="selectedElementHasProp('httpBody')">
              <el-input
                type="textarea"
                :autosize="{ minRows: 3 }"
                v-model="form.httpBody"></el-input>
            </el-form-item>

            <!-- 内容 -->
            <el-form-item :label="$t('Content')" v-if="selectedElementHasProp('content')">
              <el-input
                type="textarea"
                :autosize="{ minRows: 3 }"
                v-model="form.content"></el-input>
            </el-form-item>

            <!-- 函数调用预览 -->
            <el-form-item :label="$t('Calling Preview')" v-if="selectedFunc">
              <p class="form-item text-main code-font">
                <template v-if="form.parameterPassingMethod === 'passAsFirstParameter'">
                  {{ selectedFunc.id }}(data)
                </template>
                <template v-else-if="form.parameterPassingMethod === 'unpackAsNamedParameters'">
                  {{ selectedFunc.id }}(**data)
                </template>
                <template v-else-if="form.parameterPassingMethod === 'assignByName'">
                  <span v-if="form.outputField">data['{{ form.outputField }}']&nbsp;=&nbsp;</span>
                  {{ selectedFunc.id }}(<span v-for="(v, k, i) in form.parameterAssigningMap"><span v-if="i > 0">,&nbsp;</span>{{ k }}={{ v }}</span>)
                </template>
                <template v-else>
                  {{ selectedFunc.id }}()
                </template>
              </p>
            </el-form-item>
          </el-form>
        </div>
        <div slot="footer">
          <el-button @click="showSetting = false">{{ $t('Cancel') }}</el-button>
          <el-button :disabled="!isPropSettingSatisfied" type="primary" @click="elementAction('setProps')">{{ $t('Save') }}</el-button>
        </div>
      </el-dialog>
    </el-container>
  </transition>
</template>

<script>
import LogicFlow from '@logicflow/core'
import '@logicflow/core/dist/style/index.css'

// 连线
import SimpleLine from '@/components/Blueprint/Nodes/SimpleLine.js';
import SwitchLine from '@/components/Blueprint/Nodes/SwitchLine.js';

// 基础节点
import EntryNode from '@/components/Blueprint/Nodes/EntryNode.js';
import CodeNode from '@/components/Blueprint/Nodes/CodeNode.js';
import FuncNode from '@/components/Blueprint/Nodes/FuncNode.js';
import SwitchNode from '@/components/Blueprint/Nodes/SwitchNode.js';

// 内建节点
import BuiltinHashNode from '@/components/Blueprint/Nodes/BuiltinHashNode.js';
import BuiltinBase64Node from '@/components/Blueprint/Nodes/BuiltinBase64Node.js';
import BuiltinRandomNode from '@/components/Blueprint/Nodes/BuiltinRandomNode.js';
import BuiltinJSONNode from '@/components/Blueprint/Nodes/BuiltinJSONNode.js';
import BuiltinYAMLNode from '@/components/Blueprint/Nodes/BuiltinYAMLNode.js';
import BuiltinHTTPNode from '@/components/Blueprint/Nodes/BuiltinHTTPNode.js';
import BuiltinDingTalkNode from '@/components/Blueprint/Nodes/BuiltinDingTalkNode.js';


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
    'form.parameterPassingMethod': function(val) {
      if (val === 'assignByName') {
        this.form.parameterAssigningMap = this.form.parameterAssigningMap || {};
      }
    }
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

      // 获取函数列表
      let funcList = await this.common.getFuncList();

      this.funcMap      = funcList.map;
      this.funcCascader = funcList.cascader;

      // 初始化画布
      this.initCanvas();
      this.initCanvasEvent();

      this.$store.commit('updateLoadStatus', true);
    },
    async saveData() {
      // 画布数据
      let canvasJSON = this.logicFlow.getGraphRawData();

      // 视图数据
      let currentTransform = this.logicFlow.getTransform();
      let viewJSON = {
        zoom             : currentTransform.SCALE_X,
        moveX            : currentTransform.TRANSLATE_X,
        moveY            : currentTransform.TRANSLATE_Y,
        selectedElementId: this.selectedElementData ? this.selectedElementData.id : null,
      }

      let apiRes = await this.T.callAPI('post', '/api/v1/blueprints/:id/do/modify', {
        params: { id: this.$route.params.id },
        body: { data: { canvasJSON, viewJSON } },
      });
      if (!apiRes || !apiRes.ok) return;

      // Nope
    },
    async deploy() {
      if (!await this.T.confirm(this.$t('Are you sure you want to deploy the Blueprint?'))) return;

      await this.saveData();

      let apiRes = await this.T.callAPI('post', '/api/v1/blueprints/:id/do/deploy', {
        params: { id: this.$route.params.id },
        alert : { okMessage: this.$t('Blueprint deployed') },
      });
      if (!apiRes || !apiRes.ok) return;

      this.$router.push({
        name  : 'code-viewer',
        params: { id: apiRes.data.scriptId },
      });
    },

    initCanvas() {
      // 初始化 LogicFlow
      this.logicFlow = new LogicFlow(this.canvasConfig);

      // 限制缩放大小
      this.logicFlow.setZoomMaxSize(3);
      this.logicFlow.setZoomMiniSize(0.4);

      // 注册组件
      this.logicFlow.batchRegister([
        SimpleLine,
        SwitchLine,

        EntryNode,
        CodeNode,
        FuncNode,
        SwitchNode,

        BuiltinHashNode,
        BuiltinBase64Node,
        BuiltinRandomNode,
        BuiltinJSONNode,
        BuiltinYAMLNode,
        BuiltinHTTPNode,
        BuiltinDingTalkNode,
      ]);

      // 渲染
      this.logicFlow.render(this.data.canvasJSON);

      // 恢复视图
      if (this.T.notNothing(this.data.viewJSON)) {
        let viewJSON = this.data.viewJSON;

        if (viewJSON.zoom) {
          this.logicFlow.zoom(viewJSON.zoom);
        }
        if (viewJSON.moveX || viewJSON.moveY) {
          this.logicFlow.translate(viewJSON.moveX || 0, viewJSON.moveY || 0);
        }
        if (viewJSON.selectedElementId) {
          this.selectElement(viewJSON.selectedElementId);
        }
      }
    },
    initCanvasEvent() {
      if (!this.logicFlow) return;

      // 双击元素后打开设置界面
      this.logicFlow.on('node:dbclick,edge:dbclick', ({ data }) => {
        // 打开设置界面
        this.selectElement(data.id);
        this.elementAction('openProps');
      });

      // 添加节点后选中并打开设置界面
      this.logicFlow.on('node:dnd-add', ({ data }) => {
        this.selectElement(data.id);
        this.elementAction('openProps');
      });

      // 元素连线后
      this.logicFlow.on('edge:add', ({ data }) => {
        let sourceNode = this.logicFlow.getNodeDataById(data.sourceNodeId);
        let lines      = this.logicFlow.getNodeOutgoingEdge(data.sourceNodeId);

        if (sourceNode.type === 'SwitchNode') {
          // Switch 节点允许多个出线，并自动重新分配序号

          // 重复连接只保留最后一个
          lines.forEach(line => {
            if (line.id !== data.id
              && line.sourceNodeId === data.sourceNodeId
              && line.targetNodeId === data.targetNodeId) {
              this.logicFlow.deleteEdge(line.id);
            }
          });

          // 重新获取所有出线
          lines = this.logicFlow.getNodeOutgoingEdge(data.sourceNodeId);

          // 提取当前已分配的序号（从 1 开始）
          let _currentOrders = [ true ];
          lines.forEach(line => {
            let _lineProp = line.getProperties();
            let _order = _lineProp.switchOrder;
            if (this.T.notNothing(_order)) {
              _currentOrders[_order] = true;
            }
          });

          // 补充空缺序号
          lines.forEach(line => {
            let _lineProp = line.getProperties();
            if (this.T.notNothing(_lineProp.switchOrder)) return;

            // 从空缺补充
            for (let i = 0; i <= _currentOrders.length; i++) {
              if (!_currentOrders[i]) {
                line.setProperties({ switchOrder: i });
                _currentOrders[i] = true;
                break;
              }
            }
          });

        } else {
          // 其他节点只保留最后一个出线
          lines.forEach(line => {
            if (line.id !== data.id) {
              this.logicFlow.deleteEdge(line.id);
            }
          });
        }
      });

      // 禁止连线
      this.logicFlow.on('connection:not-allowed', ({ data, msg }) => {
        this.T.alert(msg, 'error');
      });

      // 元素点击
      this.logicFlow.on('element:click', ({ data }) => {
        this.selectElement(data.id);
      });

      // 画布点击
      this.logicFlow.on('blank:click', () => {
        // 清除被选择的元素
        this.selectedElement = null;
      });

      // 画布移动
      this.logicFlow.on('graph:transform', this.T.debounce(() => {
        // 触发保存
        this.logicFlow.emit('custom:save-canvas-view');
      }));

      // 历史记录
      this.logicFlow.on('history:change', ({ data }) => {
        // 记录是否可以撤销、重做
        this.redoAble = data.redoAble;
        this.undoAble = data.undoAble;

        // 触发保存
        this.logicFlow.emit('custom:save-canvas-view');
      });

      // 保存画布、视图
      this.logicFlow.on('custom:save-canvas-view', () => {
        this.saveData();
      });
    },

    selectElement(id) {
      if (!this.logicFlow) return;

      // 选中元素
      this.logicFlow.selectElementById(id);

      // 记录新创建的元素
      this.selectedElement = this.logicFlow.getModelById(id);

      // 触发保存
      this.logicFlow.emit('custom:save-canvas-view');
    },
    selectedElementHasProp(prop) {
      if (!this.selectedElement) return false;

      let hasProp = prop in this.C.BLUEPRINT_ELEMENT_TYPE_MAP.get(this.selectedElement.type).props;
      if (!hasProp) return false;

      // 特殊处理
      switch(this.selectedElement.type) {
        case 'FuncNode':
          switch(prop) {
            case 'parameterPassingMethod':
              if (!this.form.funcId) return false;
              if (!this.selectedFunc || this.T.isNothing(this.selectedFunc.argsJSON)) return false;
              break;
          }
          break;

        case 'BuiltinRandomNode':
          switch(prop) {
            case 'randomLength':
              if (this.form.randomType !== 'string') return false;
              break;

            case 'minValue':
            case 'maxValue':
              if (this.form.randomType !== 'integer'
                && this.form.randomType !== 'float') return false;
              break;
          }
          break;

        case 'BuiltinHTTPNode':
          switch(prop) {
            case 'httpBody':
              if (['post', 'put', 'patch'].indexOf(this.form.httpMethod) < 0) return false;
              break;
          }
          break;

        case 'BuiltinDingTalkNode':
          switch(prop) {
            case 'httpBody':
              if (this.form.dingTalkMessageType !== 'json') return false;
              break;

            case 'content':
              if (this.form.dingTalkMessageType !== 'text'
                && this.form.dingTalkMessageType !== 'markdown') return false;
              break;
          }
          break;
      }

      return true;
    },
    selectedElementCanAction(action) {
      if (!this.selectedElement) return false;

      let type     = this.selectedElement.type;
      let baseType = this.selectedElement.BaseType;

      // 入口节点不能进行任何操作
      if (type === 'EntryNode') return false;

      switch(action) {
        // 连线不允许设置
        case 'openProps':
        case 'setProps':
          if (baseType === 'edge') return false;
          break;
      }

      return true;
    },

    elementAction(action) {
      if (!this.selectedElement || !this.selectedElementCanAction(action)) return;

      let elementType = this.C.BLUEPRINT_ELEMENT_TYPE_MAP.get(this.selectedElementData.type);
      let elementProps = this.selectedElement.getProperties();

      switch(action) {
        case 'openProps':
          let currentProps = {}
          Object.keys(elementType.props).forEach(prop => {
            switch(prop) {
              case 'inputField':
              case 'outputField':
                currentProps[prop] = elementProps[prop] || 'value';
                break;

              default:
                currentProps[prop] = elementProps[prop] || null;
            }
          });

          this.form = currentProps;

          this.showSetting = true;

          // 加载代码
          if ('code' in currentProps) {
            setImmediate(() => {
              // 初始化代码编辑器
              if (!this.codeMirror) {
                this.codeMirror = this.T.initCodeMirror('code_BlueprintContents');
                this.codeMirror.setOption('theme', this.T.getCodeMirrorThemeName());
              }

              // 代码需要使用 CodeMirror 加载
              this.codeMirror.setValue(currentProps.code || '');
            });
          }

          break;

        case 'setProps':
          let nextProps = {};
          Object.keys(elementType.props).forEach(prop => {
            if (prop === 'code') {
              // 代码需要从 CodeMirror 中读取
              nextProps.code = this.codeMirror.getValue();

            } else {
              // 其他属性从 Form 中读取
              nextProps[prop] = this.form[prop] || null;
            }
          });

          // 函数节点自动添加 funcTitle
          if ('funcId' in nextProps) {
            let funcTitle = this.funcMap[nextProps.funcId].title;
            if (funcTitle) {
              nextProps.funcTitle = funcTitle;
            }
          }

          this.selectedElement.setProperties(nextProps);

          this.showSetting = false;
          break;

        case 'delete':
          this.logicFlow.deleteElement(this.selectedElementData.id);
          this.selectedElementData = null;
          break;

        default:
          return;
      }
    },
    canvasAction(action, options) {
      // 缩放刻度
      let zoomInterval = 0.2;

      // 当前缩放、移动
      let currentTransform = this.logicFlow.getTransform();

      // 缩放中心点
      let zoomBasePoint = this.logicFlow.getPointByClient(
        this.$refs.logicFlow.offsetWidth / 2,
        this.$refs.logicFlow.offsetHeight / 2).canvasOverlayPosition;
      zoomBasePoint = [ zoomBasePoint.x, zoomBasePoint.y ];

      switch(action) {
        case 'undo':
          this.logicFlow.undo();
          break;

        case 'redo':
          this.logicFlow.redo();
          break;

        case 'zoomIn':
          this.logicFlow.zoom(this.currentScale + zoomInterval, zoomBasePoint);
          break;

        case 'zoomOut':
          this.logicFlow.zoom(this.currentScale - zoomInterval, zoomBasePoint);
          break;

        case 'resetZoom':
          this.logicFlow.zoom(1, zoomBasePoint);
          break;

        case 'fitView':
          this.logicFlow.fitView(100, 100);
          break;

        case 'dragAddNode':
          this.logicFlow.dnd.startDrag(options);
          break;

        default:
          return;
      }
    },

    onCloseProp() {
      this.T.destoryCodeMirror(this.codeMirror);
      this.codeMirror = null;
    },
    addSwitchExpr() {
      if (this.T.isNothing(this.form.switchItems)) {
        this.$set(this.form, 'switchItems', []);
      }
      this.form.switchItems.push({ expr: '' });
    },
    removeSwitchExpr(index) {
      this.form.switchItems.splice(index, 1);
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

        // 开启动画
        animation: true,

        // 默认连线类型
        edgeType: 'SimpleLine',

        // 分支节点出线为分支连线
        edgeGenerator: (sourceNode, targetNode, currentEdge) => {
          if (sourceNode.type === 'SwitchNode') return 'SwitchLine';
        },

        // 允许调整连线起始点
        adjustEdgeStartAndEnd: false,
        // 禁止鼠标滚动画布
        stopScrollGraph: true,

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
            strokeWidth: 3,
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
          // 选中框
          outline: {
            fill: 'transparent',
            stroke: 'red',
            strokeWidth: 2,
            strokeDasharray: '5 5',
            hover: {
              stroke: 'red',
              strokeWidth: 2,
            },
          },
        }
      }
    },
    currentScale() {
      if (!this.logicFlow) return 1;
      return this.logicFlow.getTransform().SCALE_X;
    },
    selectedElementData() {
      if (!this.selectedElement) return null;
      return this.selectedElement.getData();
    },
    selectedFunc() {
      if (!this.form.funcId) return null;

      return this.funcMap[this.form.funcId] || null;
    },

    propSettingTitle() {
      if (!this.selectedElement) return '';

      return this.C.BLUEPRINT_ELEMENT_TYPE_MAP.get(this.selectedElementData.type).name;
    },
    isPropSettingSatisfied() {
      if (!this.selectedElement) return false;

      let elementProps = this.C.BLUEPRINT_ELEMENT_TYPE_MAP.get(this.selectedElementData.type).props;
      for (let prop in elementProps) {
        if (elementProps[prop].isRequired
          && this.T.isNothing(this.form[prop])) {
          return false;
        }
      }

      switch(this.selectElement.type) {
        case 'SwitchNode':
          if (this.T.isNothing(this.form.switchItems)) return false;
          break;

        case 'BuiltinRandomNode':
          if (this.form.randomType === 'string'
            && this.T.isNothing(this.form.randomLength)) return false;

          if ((this.form.randomType === 'integer'
              || this.form.randomType === 'float')
            && (this.T.isNothing(this.form.minValue)
              || this.T.isNothing(this.form.maxValue))) return false;

          break;

        case 'BuiltinDingTalkNode':
          if (this.T.isNothing(this.form.dingTalkMessageType)) return false;

          if ((this.form.dingTalkMessageType === 'text'
              || this.form.dingTalkMessageType === 'markdown')
            && this.T.isNothing(this.form.content)) return false;

          if (this.form.dingTalkMessageType === 'json'
            && this.T.isNothing(this.form.httpBody)) return false;
      }

      return true;
    },
  },
  props: {
  },
  data() {
    return {
      logicFlow : null,
      codeMirror: null,

      data        : {},
      funcMap     : {},
      funcCascader: [],

      selectedElement: null,

      undoAble   : false,
      redoAble   : false,
      showSetting: false,

      form: {
      },
      formRules: {
        formRules_switchExpr: {
          trigger: 'change',
          message : this.$t('Please input a Python Expression which returns a bool for Switch'),
          required: true,
        },
      },
    }
  },
  mounted() {
    window.vmc = this;
  },
  beforeDestroy() {
    this.T.destoryCodeMirror(this.codeMirror);
    this.codeMirror = null;
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
#logicFlowContainer {
  width: 100%;
  height: 100%;
  position: relative;
}
#logicFlow {
  width: 100%;
  height: 100%;
}

.switch-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.switch-item-label {
  padding: 2px 10px;
  color: #FF6600;
  font-family: Iosevka;
  font-size: 16px;
  border: 1px solid #FF6600;
  border-radius: 5px;
  background-color: #FDF5EF;
}
.switch-item-type {
  width: 120px;
  display: inline-block;
}
.switch-item-expr {
  width: 520px;
  display: inline-block;
}
.switch-item-else {
  padding-left: 15px;
}
.switch-item-delete {
}
</style>

<style>
.lf-drag-able {
  cursor: grab;
}

#logicFlow,
#logicFlowDnd {
  .node {
    border: 1px solid #FF6600;
    border-radius: 5px;
    display: flex;
    flex-direction: row;
    align-items: center;
    flex-wrap: nowrap;
    background-color: #FDF5EF;
  }
  .node-icon {
    color: #FF6600;
  }
  .node-text {
    color: #FF6600;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: auto;
  }
}

#logicFlow {
  .node {
    width: 218px;
    height: 38px;
  }

  .node.node-half {
    width: 118px;
    height: 38px;
  }
  .node-icon {
    font-size: 18px;
    width: 20px;
    margin: 0 15px;
  }
  .node-text {
    font-size: 14px;
    width: 150px;
  }
}

#logicFlowDnd {
  user-select: none;
  position: absolute;
  top: 20px;
  left: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  border: 1px solid #ccc;
  border-radius: 5px;
  background: white;
  max-height: calc(100% - 40px);
  overflow-y: auto;

  .node {
    width: 130px;
    height: 28px;
  }

  .node-icon {
    font-size: 12px;
    width: 14px;
    margin: 0px 10px;
  }
  .node-text {
    font-size: 12px;
    width: 150px;
  }
  .dnd-title, .dnd-node {
    margin: 5px 10px;
  }
  .dnd-node {
    cursor: copy;
  }
}

#codeContainer_BlueprintContents {
  border: 1px solid #DCDFE6;
  border-radius: 3px;
}
#codeContainer_BlueprintContents .CodeMirror {
  height: 420px;
  width: auto;
}

.prop-form .el-cascader {
  width: 100%;
}
</style>
