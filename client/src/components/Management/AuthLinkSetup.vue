<i18n locale="en" lang="yaml">
randomIDString: auln-{Random ID}

parameterHint  : 'When the parameter value is specified as "INPUT_BY_CALLER", this parameter is allowed to be specified by the caller'
shortcutDays   : '{n} day | {n} days'
recentTaskCount: 'recent {n} task | recent {n} tasks'
</i18n>

<i18n locale="zh-CN" lang="yaml">
randomIDString: auln-{随机ID}

Add Auth Link  : 添加授权链接
Setup Auth Link: 配置授权链接

Customize ID: 定制ID
Func        : 执行函数
Arguments   : 参数指定
Task Info   : 任务信息
Keep        : 保留
Tags        : 标签
Add Tag     : 添加标签
Show in doc : 显示于文档
Expires     : 有效期
Limiting    : 限流
Note        : 备注

URL Preview: URL预览
ID will be a part of the calling URL: 此ID用于生成调用时的URL
'JSON formated arguments (**kwargs)': 'JSON格式的参数（**kwargs）'
The Func accepts extra arguments not listed above: 本函数允许传递额外的自定义函数参数

'ID must starts with "{prefix}"': 'ID必须以"{prefix}"开头'
'Only numbers, alphabets, dot(.), underscore(_) and hyphen(-) are allowed': 只能输入数字、英文、点（.）、下划线（_）以及连字符（-）
Please select Func: 请选择执行函数
'Please input arguments, input "{}" when no argument': '请输入参数，无参数时填写 "{}"'
Only date-time between 1970 and 2037 are allowed: 只能选择1970年至2037年之间的日期
Date-time cannot earlier than 1970: 日期不能早于1970年
Date-time cannot later than 2037: 时间不能晚于2037年

Auth Link created: 授权链接已创建
Auth Link saved  : 授权链接已保存
Auth Link deleted: 授权链接已删除

Are you sure you want to delete the Auth Link?: 是否确认删除此授权链接？
Invalid argument format: 参数格式不正确

parameterHint  : '参数值指定为 "INPUT_BY_CALLER" 时，允许调用时指定本参数'
shortcutDays   : '{n} 天'
recentTaskCount: '{n} 个近期任务'
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
              <el-form ref="form" label-width="135px" :model="form" :rules="formRules">
                <el-form-item :label="$t('Customize ID')" prop="useCustomId" v-if="T.setupPageMode() === 'add'">
                  <el-switch v-model="useCustomId"></el-switch>
                  <span class="text-main float-right">
                    {{ $t('URL Preview') }}{{ $t(':') }}
                    <code class="code-font">{{ `/api/v1/al/${useCustomId ? form.id : $t('randomIDString')}` }}</code>
                  </span>
                </el-form-item>

                <el-form-item label="ID" prop="id" v-show="useCustomId" v-if="T.setupPageMode() === 'add'">
                  <el-input
                    maxlength="50"
                    v-model="form.id">
                  </el-input>
                  <InfoBlock :title="$t('ID will be a part of the calling URL')" />
                </el-form-item>

                <el-form-item :label="$t('Func')" prop="funcId">
                  <el-cascader class="func-cascader-input" ref="funcCascader"
                    popper-class="code-font"
                    placeholder="--"
                    filterable
                    :filter-method="common.funcCascaderFilter"
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
                    :autosize="{ minRows: 2 }"></el-input>
                  <InfoBlock :title="$t('JSON formated arguments (**kwargs)')" />
                  <InfoBlock :title="$t('parameterHint')" />

                  <InfoBlock v-if="apiCustomKwargsSupport" type="success" :title="$t('The Func accepts extra arguments not listed above')" />
                </el-form-item>

                <el-form-item :label="$t('Tags')" prop="tagsJSON">
                  <el-tag v-for="t in form.tagsJSON" :key="t" type="warning" size="small" closable @close="removeTag(t)">{{ t }}</el-tag>
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
                    :precision="0"
                    v-model="form.taskInfoLimit"></el-input-number>
                  <span class="task-info-limit-unit">{{ $tc('recentTaskCount', form.taskInfoLimit, { n: '' }) }} </span>
                  <el-link class="task-info-limit-clear" type="primary" @click.stop="form.taskInfoLimit = $store.getters.CONFIG('_TASK_INFO_DEFAULT_LIMIT_AUTH_LINK')">{{ $t('Restore Default') }}</el-link>
                </el-form-item>

                <el-form-item :label="$t('API Auth')" prop="apiAuthId">
                  <el-select v-model="form.apiAuthId">
                    <el-option v-for="opt in apiAuthOptions" :label="opt.label" :key="opt.id" :value="opt.id"></el-option>
                  </el-select>
                </el-form-item>

                <el-form-item :label="$t('Show in doc')" prop="showInDoc">
                  <el-switch
                    v-model="form.showInDoc">
                  </el-switch>
                </el-form-item>

                <el-form-item :label="$t('Expires')" prop="expireTime">
                  <el-date-picker class="expire-time-input"
                    v-model="form.expireTime"
                    type="datetime"
                    align="left"
                    format="yyyy-MM-dd HH:mm"
                    :clearable="true"
                    :picker-options="datetimePickerOptions">
                  </el-date-picker>
                </el-form-item>

                <template v-for="(opt, index) in C.AUTH_LINK_THROTTLING">
                  <el-form-item :label="index === 0 ? $t('Limiting') : ''" :prop="`throttlingJSON.${opt.key}`">
                    <el-input-number class="throttling-input"
                      :min="1"
                      :step="1"
                      :precision="0"
                      v-model="form.throttlingJSON[opt.key]"></el-input-number>
                    <span class="throttling-unit">{{ $tc(opt.name, form.throttlingJSON[opt.key], { n: '' }) }} </span>
                    <el-link class="throttling-clear" @click.stop="form.throttlingJSON[opt.key] = undefined">{{ $t('Clear') }}</el-link>
                  </el-form-item>
                </template>

                <el-form-item :label="$t('Note')">
                  <el-input :placeholder="$t('Optional')"
                    type="textarea"
                    resize="none"
                    :autosize="{minRows: 2}"
                    maxlength="200"
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
  name: 'AuthLinkSetup',
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
            this.form.throttlingJSON = {};
            this.form.showInDoc      = false;
            this.form.taskInfoLimit  = this.$store.getters.CONFIG('_TASK_INFO_DEFAULT_LIMIT_AUTH_LINK');
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
        let apiRes = await this.T.callAPI_getOne('/api/v1/auth-links/do/list', this.$route.params.id);
        if (!apiRes || !apiRes.ok) return;

        this.data = apiRes.data;

        let nextForm = {};
        Object.keys(this.form).forEach(f => nextForm[f] = this.data[f]);
        nextForm.funcCallKwargsJSON = JSON.stringify(nextForm.funcCallKwargsJSON, null, 2);
        nextForm.tagsJSON           = nextForm.tagsJSON || [];
        nextForm.apiAuthId          = this.data.apia_id;
        nextForm.throttlingJSON     = nextForm.throttlingJSON || {};

        if (this.T.isNothing(nextForm.taskInfoLimit)) {
          nextForm.taskInfoLimit = this.$store.getters.CONFIG('_TASK_INFO_DEFAULT_LIMIT_AUTH_LINK')
        }

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
      let opt = {
        body : { data: this.T.jsonCopy(this.form) },
        alert: { okMessage: this.$t('Auth Link created') },
      };

      // 添加函数调用参数kwargsJSON
      try {
        opt.body.data.funcCallKwargsJSON = JSON.parse(this.form.funcCallKwargsJSON);
      } catch(err) {
        return this.T.alert(`${this.$t('Invalid argument format')}<br>${err.toString()}`);
      }

      let apiRes = await this.T.callAPI('post', '/api/v1/auth-links/do/add', opt);
      if (!apiRes || !apiRes.ok) return;

      this.$store.commit('updateTableList_scrollY');
      this.$store.commit('updateHighlightedTableDataId', apiRes.data.id);

      this.$router.push({
        name : 'auth-link-list',
        query: this.T.getPrevQuery(),
      });
    },
    async modifyData() {
      let _formData = this.T.jsonCopy(this.form);
      delete _formData.id;

      let opt = {
        params: { id: this.$route.params.id },
        body  : { data: _formData },
        alert : { okMessage: this.$t('Auth Link saved') },
      };

      // 添加函数调用参数kwargsJSON
      try {
        opt.body.data.funcCallKwargsJSON = JSON.parse(this.form.funcCallKwargsJSON);

      } catch(err) {
        return this.T.alert(`${this.$t('Invalid argument format')}<br>${err.toString()}`);
      }

      let apiRes = await this.T.callAPI('post', '/api/v1/auth-links/:id/do/modify', opt);
      if (!apiRes || !apiRes.ok) return;

      this.$store.commit('updateHighlightedTableDataId', apiRes.data.id);

      this.$router.push({
        name : 'auth-link-list',
        query: this.T.getPrevQuery(),
      });
    },
    async deleteData() {
      if (!await this.T.confirm(this.$t('Are you sure you want to delete the Auth Link?'))) return;

      let apiRes = await this.T.callAPI('/api/v1/auth-links/:id/do/delete', {
        params: { id: this.$route.params.id },
        alert : { okMessage: this.$t('Auth Link deleted') },
      });
      if (!apiRes || !apiRes.ok) return;

      this.$router.push({
        name : 'auth-link-list',
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
    formRules() {
      let errorMessage_funcCallKwargsJSON = this.$t('Please input arguments, input "{}" when no argument');

      return {
        id: [
          {
            trigger: 'change',
            validator: (rule, value, callback) => {
              if (this.T.notNothing(value)) {
                if ((value.indexOf(this.ID_PREFIX) !== 0 || value === this.ID_PREFIX)) {
                  return callback(new Error(this.$t('ID must starts with "{prefix}"', { prefix: this.ID_PREFIX })));
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
            message : this.$t('Please select Func'),
            required: true,
          },
        ],
        expireTime: [
          {
            trigger: 'change',
            message  : this.$t('Only date-time between 1970 and 2037 are allowed'),
            validator: (rule, value, callback) => {
              let ts = this.M(value).unix();
              if (ts < this.T.MIN_UNIX_TIMESTAMP) {
                return callback(new Error(this.$t('Date-time cannot earlier than 1970')));
              } else if (ts > this.T.MAX_UNIX_TIMESTAMP) {
                return callback(new Error(this.$t('Date-time cannot later than 2037')));
              }
              return callback();
            },
          }
        ],
        funcCallKwargsJSON: [
          {
            trigger : 'change',
            message : errorMessage_funcCallKwargsJSON,
            required: true,
          },
          {
            trigger  : 'change',
            validator: (rule, value, callback) => {
              try {
                let j = JSON.parse(value);
                if (Array.isArray(j)) {
                  return callback(new Error(errorMessage_funcCallKwargsJSON));
                }
                return callback();

              } catch(err) {
                return callback(new Error(errorMessage_funcCallKwargsJSON));
              }
            },
          }
        ],
      }
    },
    ID_PREFIX() {
      return 'auln-';
    },
    pageTitle() {
      const _map = {
        setup: this.$t('Setup Auth Link'),
        add  : this.$t('Add Auth Link'),
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
    apiAuthOptions() {
      return this.apiAuthList.map(d => {
        let _typeName = this.C.API_AUTH_MAP.get(d.type).name;
        d.label = `[${_typeName}] ${d.name || ''}`;
        return d;
      });
    },
    datetimePickerOptions() {
      const now = new Date().getTime();
      const shortcutDaysList = [1, 3, 7, 30, 90, 365];
      let shortcuts = [];
      shortcutDaysList.forEach((days) => {
        const date = new Date();
        date.setTime(now + 3600 * 24 * days * 1000);

        shortcuts.push({
          text: this.$tc('shortcutDays', days),
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
        expireTime        : null,
        throttlingJSON    : {},
        showInDoc         : false,
        taskInfoLimit     : this.$store.getters.CONFIG('_TASK_INFO_DEFAULT_LIMIT_AUTH_LINK'),
        note              : null,
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
.expire-time-input {
  width: 500px;
}
.throttling-input {
  width: 260px;
}
.throttling-unit {
  color: grey;
  padding-left: 10px;
}
.throttling-unit > span {
  width: 35px;
  display: inline-block;
}
.throttling-clear {
  float: right
}
</style>
