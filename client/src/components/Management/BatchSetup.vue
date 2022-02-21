<i18n locale="en" lang="yaml">
randomIDString: bat-{Random ID}

parameterHint: 'When a parameter is set to "INPUT_BY_CALLER" means the parameter can be specified by the caller'

recenTaskCount: 'recent {n} task | recent {n} tasks'
</i18n>

<i18n locale="zh-CN" lang="yaml">
randomIDString: bat-{随机ID}

Add Batch  : 添加批处理
Setup Batch: 修改批处理

Customize ID: 定制ID
Func        : 执行函数
Arguments   : 参数指定
Task Info   : 任务信息
Keep        : 保留
Tags        : 标签
Add Tag     : 添加标签
Note        : 备注

URL Preview: URL预览
ID will be a part of the calling URL: 此ID用于生成调用时的URL
'JSON formated arguments (**kwargs)': 'JSON格式的参数（**kwargs）'
The Func accepts extra arguments not listed above: 本函数允许传递额外的自定义函数参数

'ID must starts with "{prefix}"': 'ID必须以"{prefix}"开头'
'Only numbers, alphabets, dot(.), underscore(_) and hyphen(-) are allowed': 只能输入数字、英文、点（.）、下划线（_）以及连字符（-）
Please select Func: 请选择执行函数
'Please input arguments, input "{}" when no argument': '请输入参数，无参数时填写 "{}"'

Batch created: 批处理已创建
Batch saved  : 批处理已保存
Batch deleted: 批处理已删除

Are you sure you want to delete the Batch?: 是否确认删除此批处理？
Invalid argument format: 参数格式不正确

parameterHint: '参数值指定为"INPUT_BY_CALLER"时表示允许调用时指定本参数'

recenTaskCount: '{n}个近期任务'
</i18n>

<template>
  <transition name="fade">
    <el-container direction="vertical" v-show="$store.state.isLoaded">
      <!-- 标题区 -->
      <el-header height="60px">
        <h1>{{ pageTitle }} <code class="text-main">{{ data.func_title }}</code></h1>
      </el-header>

      <!-- 编辑区 -->
      <el-main>
        <el-row :gutter="20">
          <el-col :span="15">
            <div class="common-form">
              <el-form ref="form" label-width="120px" :model="form" :rules="formRules">
                <el-form-item :label="$t('Customize ID')" prop="useCustomId" v-if="T.setupPageMode() === 'add'">
                  <el-switch v-model="useCustomId"></el-switch>
                  <span class="text-main float-right">
                    {{ $t('URL Preview') }}{{ $t(':') }}
                    <code>{{ `/api/v1/bat/${useCustomId ? form.id : $t('randomIDString')}` }}</code>
                  </span>
                </el-form-item>

                <el-form-item label="ID" prop="id" v-show="useCustomId" v-if="T.setupPageMode() === 'add'">
                  <el-input
                    maxlength="50"
                    show-word-limit
                    v-model="form.id">
                  </el-input>
                  <InfoBlock :title="$t('ID will be a part of the calling URL')"></InfoBlock>
                </el-form-item>

                <el-form-item :label="$t('Func')" prop="funcId">
                  <el-cascader class="func-cascader-input" ref="funcCascader"
                    placeholder="--"
                    filterable
                    v-model="form.funcId"
                    :options="funcCascader"
                    :props="{expandTrigger: 'hover', emitPath: false, multiple: false}"
                    @change="autoFillFuncCallKwargsJSON"></el-cascader>
                </el-form-item>

                <el-form-item :label="$t('Arguments')" prop="funcCallKwargsJSON">
                  <el-input
                    type="textarea"
                    v-model="form.funcCallKwargsJSON"
                    resize="none"
                    :autosize="true"></el-input>
                  <InfoBlock :title="$t('JSON formated arguments (**kwargs)')"></InfoBlock>
                  <InfoBlock :title="$t('parameterHint')"></InfoBlock>

                  <InfoBlock v-if="apiCustomKwargsSupport" type="success" :title="$t('The Func accepts extra arguments not listed above')"></InfoBlock>
                </el-form-item>

                <el-form-item :label="$t('Tags')" prop="tagsJSON">
                  <el-tag v-for="t in form.tagsJSON" :key="t" type="warning" size="mini" closable @close="removeTag(t)">{{ t }}</el-tag>
                  <el-input v-if="showAddTag" ref="newTag"
                    v-model="newTag"
                    size="mini"
                    @keyup.enter.native="addTag"
                    @blur="addTag"></el-input>
                  <el-button v-else
                    type="text"
                    @click="openAddTagInput">{{ $t('Add Tag') }}</el-button>
                </el-form-item>

                <el-form-item :label="$t('Task Info')">
                  <span class="task-info-limit-prefix">{{ $t('Keep') }} </span>
                  <el-input-number class="task-info-limit-input" v-if="fixedTaskInfoLimit"
:disabled="true"
                    :value="fixedTaskInfoLimit"></el-input-number>
                  <el-input-number class="task-info-limit-input" v-else
                    :min="$store.getters.CONFIG('_TASK_INFO_MIN_LIMIT')"
                    :max="$store.getters.CONFIG('_TASK_INFO_MAX_LIMIT')"
                    :step="10"
                    :step-strictly="true"
                    v-model="form.taskInfoLimit"></el-input-number>
                  <span class="task-info-limit-unit">{{ $tc('recenTaskCount', form.taskInfoLimit, { n: '' }) }} </span>
                  <el-link class="task-info-limit-clear" type="primary" @click.stop="form.taskInfoLimit = $store.getters.CONFIG('_TASK_INFO_DEFAULT_LIMIT')">{{ $t('Restore Default') }}</el-link>
                </el-form-item>

                <el-form-item :label="$t('API Auth')" prop="apiAuthId">
                  <el-select v-model="form.apiAuthId">
                    <el-option v-for="opt in apiAuthOptions" :label="opt.label" :key="opt.id" :value="opt.id"></el-option>
                  </el-select>
                </el-form-item>

                <el-form-item :label="$t('Note')">
                  <el-input :placeholder="$t('Optional')"
                    type="textarea"
                    resize="none"
                    :autosize="{minRows: 2}"
                    maxlength="200"
                    show-word-limit
                    v-model="form.note"></el-input>
                </el-form-item>

                <el-form-item>
                  <el-button v-if="T.setupPageMode() === 'setup'" @click="deleteData">{{ $t('Delete') }}</el-button>
                  <div class="setup-right">
                    <el-button type="primary" v-prevent-re-click @click="submitData">{{ $t('Save') }}</el-button>
                  </div>
                </el-form-item>
              </el-form>
            </div>
          </el-col>
          <el-col :span="9" class="hidden-md-and-down">
          </el-col>
        </el-row>
      </el-main>
    </el-container>
  </transition>
</template>

<script>
export default {
  name: 'BatchSetup',
  components: {
  },
  watch: {
    $route: {
      immediate: true,
      async handler(to, from) {
        await this.loadData();

        switch(this.T.setupPageMode()) {
          case 'add':
            this.T.jsonClear(this.form);
            this.form.taskInfoLimit = this.$store.getters.CONFIG('_TASK_INFO_DEFAULT_LIMIT');
            this.data = {};
            break;

          case 'setup':
            break;
        }
      },
    },
    useCustomId(val) {
      if (val) {
        this.form.id = `${this.ID_PREFIX}foobar`;
      } else {
        this.form.id = null;
      }
    },
  },
  methods: {
    async loadData() {
      if (this.T.setupPageMode() === 'setup') {
        let apiRes = await this.T.callAPI_getOne('/api/v1/batches/do/list', this.$route.params.id);
        if (!apiRes.ok) return;

        this.data = apiRes.data;

        let nextForm = {};
        Object.keys(this.form).forEach(f => nextForm[f] = this.data[f]);
        nextForm.funcCallKwargsJSON = JSON.stringify(nextForm.funcCallKwargsJSON, null, 2);
        nextForm.taskInfoLimit      = nextForm.taskInfoLimit || this.$store.getters.CONFIG('_TASK_INFO_DEFAULT_LIMIT');
        nextForm.tagsJSON           = nextForm.tagsJSON      || [];
        nextForm.apiAuthId          = this.data.apia_id;
        this.form = nextForm;
      }

      // 获取函数列表
      let funcList = await this.common.getFuncList();

      this.funcMap      = funcList.map;
      this.funcCascader = funcList.cascader;

      // 获取API认证列表
      let apiAuthList = await this.common.getAPIAuthList();

      this.apiAuthList = apiAuthList;

      this.$store.commit('updateLoadStatus', true);
    },
    async submitData() {
      try {
        await this.$refs.form.validate();
      } catch(err) {
        return console.error(err);
      }

      switch(this.T.setupPageMode()) {
        case 'add':
          return await this.addData();
        case 'setup':
          return await this.modifyData();
      }
    },
    async addData() {
      let _formData = this.T.jsonCopy(this.form);
      if (this.fixedTaskInfoLimit) {
        _formData.taskInfoLimit = this.fixedTaskInfoLimit;
      }

      let opt = {
        body : { data: _formData },
        alert: { okMessage: this.$t('Batch created') },
      };

      // 添加函数调用参数kwargsJSON
      try {
        opt.body.data.funcCallKwargsJSON = JSON.parse(this.form.funcCallKwargsJSON);
      } catch(err) {
        return this.T.alert(`${this.$t('Invalid argument format')}<br>${err.toString()}`);
      }

      let apiRes = await this.T.callAPI('post', '/api/v1/batches/do/add', opt);
      if (!apiRes.ok) return;

      this.$store.commit('updateTableList_scrollY');
      this.$store.commit('updateHighlightedTableDataId', apiRes.data.id);

      this.$router.push({
        name: 'batch-list',
        query: this.T.getPrevQuery(),
      });
    },
    async modifyData() {
      let _formData = this.T.jsonCopy(this.form);
      if (this.fixedTaskInfoLimit) {
        _formData.taskInfoLimit = this.fixedTaskInfoLimit;
      }
      delete _formData.id;

      let opt = {
        params: { id: this.$route.params.id },
        body  : { data: _formData },
        alert : { okMessage: this.$t('Batch saved') },
      };

      // 添加函数调用参数kwargsJSON
      try {
        opt.body.data.funcCallKwargsJSON = JSON.parse(this.form.funcCallKwargsJSON);
      } catch(err) {
        return this.T.alert(`${this.$t('Invalid argument format')}<br>${err.toString()}`);
      }

      let apiRes = await this.T.callAPI('post', '/api/v1/batches/:id/do/modify', opt);
      if (!apiRes.ok) return;

      this.$store.commit('updateHighlightedTableDataId', apiRes.data.id);

      this.$router.push({
        name: 'batch-list',
        query: this.T.getPrevQuery(),
      });
    },
    async deleteData() {
      if (!await this.T.confirm(`Are you sure you want to delete the Batch?`)) return;

      let apiRes = await this.T.callAPI('/api/v1/batches/:id/do/delete', {
        params: { id: this.$route.params.id },
        alert : { okMessage: this.$t('Batch deleted') },
      });
      if (!apiRes.ok) return;

      this.$router.push({
        name: 'batch-list',
        query: this.T.getPrevQuery(),
      });
    },
    autoFillFuncCallKwargsJSON(funcId) {
      // 自动填充调用参数
      let parameters = this.funcMap[funcId].argsJSON
                    || Object.keys(this.funcMap[funcId].kwargsJSON);

      let example = {};
      parameters.forEach(p => {
        if (p.indexOf('**') === 0) {
          // 暂定：不展示**kwargs参数
        } else {
          example[p] = 'INPUT_BY_CALLER';
        }
      });

      this.form.funcCallKwargsJSON = JSON.stringify(example, null, 2);
    },
    removeTag(tag) {
      this.form.tagsJSON.splice(this.form.tagsJSON.indexOf(tag), 1);
    },
    openAddTagInput() {
      this.showAddTag = true;
      this.$nextTick(_ => {
        this.$refs.newTag.$refs.input.focus();
      });
    },
    addTag() {
      let newTag = this.newTag;
      if (newTag) {
        if (!Array.isArray(this.form.tagsJSON)) {
          this.$set(this.form, 'tagsJSON', []);
        }
        this.form.tagsJSON.push(newTag);
      }
      this.showAddTag = false;
      this.newTag     = '';
    },
  },
  computed: {
    ID_PREFIX() {
      return 'bat-';
    },
    pageTitle() {
      const _map = {
        setup: this.$t('Setup Batch'),
        add  : this.$t('Add Batch'),
      };
      return _map[this.T.setupPageMode()];
    },
    apiCustomKwargsSupport() {
      let funcId = this.form.funcId;
      if (!funcId) return false;
      if (!this.funcMap[funcId]) return false;

      for (let k in this.funcMap[funcId].kwargsJSON) {
        if (k.indexOf('**') === 0) return true;
      }
      return false;
    },
    fixedTaskInfoLimit() {
      let selectedFunc = this.funcMap[this.form.funcId];
      if (selectedFunc
          && selectedFunc.extraConfigJSON
          && selectedFunc.extraConfigJSON.fixedTaskInfoLimit) {
        return selectedFunc.extraConfigJSON.fixedTaskInfoLimit;
      } else {
        return null;
      }
    },
    apiAuthOptions() {
      return this.apiAuthList.map(d => {
        let _typeName = this.C.API_AUTH_MAP.get(d.type).name;
        d.label = `[${_typeName}] ${d.name || ''}`;
        return d;
      });
    },
  },
  props: {
  },
  data() {
    return {
      data        : {},
      funcMap     : {},
      funcCascader: [],
      apiAuthList : [],

      useCustomId: false,
      showAddTag : false,
      newTag     : '',

      form: {
        id                : null,
        funcId            : null,
        funcCallKwargsJSON: null,
        tagsJSON          : [],
        apiAuthId         : null,
        taskInfoLimit     : this.$store.getters.CONFIG('_TASK_INFO_DEFAULT_LIMIT'),
        note              : null,
      },
      formRules: {
        id: [
          {
            trigger: 'change',
            validator: (rule, value, callback) => {
              if (!this.T.isNothing(value)) {
                if ((value.indexOf(this.ID_PREFIX) !== 0 || value === this.ID_PREFIX)) {
                  return callback(new Error(`ID必须以"${this.ID_PREFIX}"开头`));
                }
                if (!value.match(/^[0-9a-zA-Z\.\-\_]+$/g)) {
                  return callback(new Error(this.$t('Only numbers, alphabets, dot(.), underscore(_) and hyphen(-) are allowed')));
                }
              }
              return callback();
            },
          }
        ],
        funcId: [
          {
            trigger : 'change',
            message : '请选择执行函数',
            required: true,
          },
        ],
        funcCallKwargsJSON: [
          {
            trigger : 'change',
            message : '请输入调用参数，无参数的直接填写 {}',
            required: true,
          },
          {
            trigger  : 'change',
            message  : '调用参数需要以 JSON 形式填写',
            validator: (rule, value, callback) => {
              try {
                let j = JSON.parse(value);
                if (Array.isArray(j)) {
                  return callback(new Error('调用参数需要以 JSON 形式填写，如 {"arg1": "value1"}'));
                }
                return callback();

              } catch(err) {
                return callback(new Error('调用参数需要以 JSON 形式填写，无参数的直接填写 {}'));
              }
            },
          }
        ],
      },
    }
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.func-cascader-input {
  width: 500px;
}
.task-info-limit-input {
  width: 180px;
}
.task-info-limit-prefix {
  color: grey;
  padding-right: 10px;
}
.task-info-limit-unit {
  color: grey;
  padding-left: 10px;
}
.task-info-limit-unit > span {
  width: 35px;
  display: inline-block;
}
.task-info-limit-clear {
  float: right
}
</style>
