<i18n locale="en" lang="yaml">
parameterHint: 'When a parameter is set to "INPUT_BY_CALLER" means the parameter can be specified by the caller'
</i18n>

<i18n locale="zh-CN" lang="yaml">
Add Batch  : 添加批处理
Setup Batch: 修改批处理

Use custom ID: 使用自定义ID
Func         : 执行函数
Arguments    : 参数指定
Tags         : 标签
Add Tag      : 添加标签
Note         : 备注

ID will be a part of the calling URL: ID关系到调用时的URL
'JSON formated arguments (**kwargs)': 'JSON格式的参数（**kwargs）'
The Func accepts extra arguments not listed above: 本函数允许传递额外的自定义函数参数

'ID must starts with "{prefix}"': 'ID必须以"{prefix}"开头'
Please select Func: 请选择执行函数
'Please input arguments, input {} when no argument': '请输入参数，无参数时填写 {}'

Batch created: 批处理已创建
Batch saved  : 批处理已保存
Batch deleted: 批处理已删除

Are you sure you want to delete the Batch?: 是否确认删除此批处理？
Invalid argument format: 参数格式不正确

parameterHint: '参数值指定为"INPUT_BY_CALLER"时表示允许调用时指定本参数'
</i18n>

<template>
  <transition name="fade">
    <el-container direction="vertical" v-if="$store.state.isLoaded">
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
                <el-form-item :label="$t('Use custom ID')" prop="useCustomId" v-if="T.pageMode() === 'add'">
                  <el-switch v-model="useCustomId"></el-switch>
                </el-form-item>

                <el-form-item label="ID" prop="id" v-show="useCustomId" v-if="T.pageMode() === 'add'">
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
                  <el-input type="textarea" v-model="form.funcCallKwargsJSON" resize="none" :autosize="true"></el-input>
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

                <el-form-item :label="$t('Note')">
                  <el-input
                    type="textarea"
                    resize="none"
                    :autosize="{minRows: 2}"
                    maxlength="200"
                    show-word-limit
                    v-model="form.note"></el-input>
                </el-form-item>

                <el-form-item>
                  <el-button v-if="T.pageMode() === 'setup'" @click="deleteData">{{ $t('Delete') }}</el-button>
                  <div class="setup-right">
                    <el-button type="primary" @click="submitData">{{ $t('Save') }}</el-button>
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

        switch(this.T.pageMode()) {
          case 'add':
            this.T.jsonClear(this.form);
            this.data = {};
            break;

          case 'setup':
            break;
        }
      },
    },
    useCustomId(val) {
      if (val) {
        this.form.id = `${this.ID_PREFIX}`;
      } else {
        this.form.id = null;
      }
    },
  },
  methods: {
    async loadData() {
      if (this.T.pageMode() === 'setup') {
        let apiRes = await this.T.callAPI_getOne('/api/v1/batches/do/list', this.$route.params.id);
        if (!apiRes.ok) return;

        this.data = apiRes.data;

        let nextForm = {};
        Object.keys(this.form).forEach(f => nextForm[f] = this.data[f]);
        nextForm.funcCallKwargsJSON = JSON.stringify(nextForm.funcCallKwargsJSON, null, 2);
        nextForm.tagsJSON           = nextForm.tagsJSON || [];
        this.form = nextForm;
      }

      // 获取函数列表
      let funcList = await this.common.getFuncList();

      this.funcMap      = funcList.map;
      this.funcCascader = funcList.cascader;
      this.$store.commit('updateLoadStatus', true);
    },
    async submitData() {
      try {
        await this.$refs.form.validate();
      } catch(err) {
        return console.error(err);
      }

      switch(this.T.pageMode()) {
        case 'add':
          return await this.addData();
        case 'setup':
          return await this.modifyData();
      }
    },
    async addData() {
      let opt = {
        body : { data: this.T.jsonCopy(this.form) },
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

      this.$store.commit('updateBatchList_scrollY', null);
      this.$store.commit('updateHighlightedTableDataId', apiRes.data.id);

      this.$router.push({
        name: 'batch-list',
        query: this.T.getPrevQuery(),
      });
    },
    async modifyData() {
      let _formData = this.T.jsonCopy(this.form);
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
      if (!await this.T.confirm(`是否确认删除此批处理？`)) return;

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
      return _map[this.T.pageMode()];
    },
    apiCustomKwargsSupport() {
      let funcId = this.form.funcId;
      if (!funcId) return false;

      for (let k in this.funcMap[funcId].kwargsJSON) {
        if (k.indexOf('**') === 0) return true;
      }
      return false;
    },
    datetimePickerOptions() {
      const now = new Date().getTime();
      const shortcutDaysList = [1, 3, 7, 30, 90, 365];
      let shortcuts = [];
      shortcutDaysList.forEach((days) => {
        const date = new Date();
        date.setTime(now + 3600 * 24 * days * 1000);

        shortcuts.push({
          text: `${days}天`,
          onClick(picker) {
            picker.$emit('pick', date)
          }
        });
      });

      return {
        shortcuts: shortcuts
      }
    },
  },
  props: {
  },
  data() {
    return {
      data        : {},
      funcMap     : {},
      funcCascader: [],

      useCustomId: false,
      showAddTag : false,
      newTag     : '',

      form: {
        id                : null,
        funcId            : null,
        funcCallKwargsJSON: null,
        tagsJSON          : [],
        note              : null,
      },
      formRules: {
        id: [
          {
            trigger: 'change',
            validator: (rule, value, callback) => {
              if (!this.T.isNothing(value) && (value.indexOf(this.ID_PREFIX) !== 0 || value === this.ID_PREFIX)) {
                return callback(new Error(`ID必须以"${this.ID_PREFIX}"开头`));
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

.el-checkbox {
  margin-left : 5px !important;
  margin-right: 0 !important;
}
</style>
