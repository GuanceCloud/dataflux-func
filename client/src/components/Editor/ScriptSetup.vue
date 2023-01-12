<i18n locale="zh-CN" lang="yaml">
Add Script  : 添加脚本
Setup Script: 配置脚本

Script Template     : 脚本模板
Show Script Template: 显示脚本模板
Basic Example       : 基础示例
Blank Script        : 空白脚本
From Example Script : 来自示例脚本

Script ID will be a part of the Func ID: 脚本集ID将作为函数ID的一部分

Please input ID: 请输入ID
Only alphabets, numbers and underscore are allowed: 只能包含大小写英文、数字及下划线
Cannot not starts with a number: 不得以数字开头
'Script ID should starts with "{prefix}"': '脚本ID必须以 "{prefix}" 开头'

Script created : 脚本已创建
Script saved   : 脚本已保存
Script deleted : 脚本已删除

Are you sure you want to delete the Script?: 是否确认删除此脚本？

This Script is locked by you: 当前脚本已被您锁定
This Script is locked by other user ({user}): 当前脚本已被其他用户（{user}）锁定
</i18n>

<template>
  <transition name="fade">
    <el-container direction="vertical" v-show="$store.state.isLoaded">
      <!-- 标题区 -->
      <el-header height="60px">
        <h1>{{ pageTitle }} <code class="text-main">{{ data.title || data.id }}</code></h1>
      </el-header>

      <!-- 编辑区 -->
      <el-main>
        <el-row :gutter="20">
          <el-col :span="15">
            <div class="common-form">
              <el-form ref="form" label-width="135px" :model="form" :disabled="!isEditable" :rules="formRules">
                <el-form-item v-if="isLockedByMe">
                  <InfoBlock type="success" :title="$t('This Script is locked by you')" />
                </el-form-item>
                <el-form-item v-else-if="isLockedByOther">
                  <InfoBlock :type="isEditable ? 'warning' : 'error'" :title="$t('This Script is locked by other user ({user})', { user: lockedByUser })" />
                </el-form-item>

                <el-form-item label="ID" prop="id">
                  <el-input :disabled="T.setupPageMode() === 'setup'"
                    maxlength="64"
                    v-model="form.id"></el-input>
                  <InfoBlock :title="$t('Script ID will be a part of the Func ID')" />
                </el-form-item>

                <el-form-item :label="$t('Title')">
                  <el-input :placeholder="$t('Optional')"
                    maxlength="25"
                    v-model="form.title"></el-input>
                </el-form-item>

                <el-form-item :label="$t('Description')">
                  <el-input :placeholder="$t('Optional')"
                    type="textarea"
                    resize="none"
                    :autosize="{minRows: 2}"
                    maxlength="5000"
                    v-model="form.description"></el-input>
                </el-form-item>

                <el-form-item :label="$t('Script Template')">
                  <el-select
                    v-model="templateScriptId"
                    @change="showScriptTemplate"
                    filterable
                    :filter-method="T.debounce(doFilter)">
                    <el-option-group>
                      <el-option :label="$t('Basic Example')" key="_basicExample" value="_basicExample"></el-option>
                      <el-option :label="$t('Blank Script')" key="_blankScript" value="_blankScript"></el-option>
                    </el-option-group>
                    <el-option-group :label="$t('From Example Script')" v-if="templateScriptShowOptions.length > 0">
                      <el-option v-for="s in templateScriptShowOptions" :label="s.label" :key="s.id" :value="s.id">
                        <span class="example-script">{{ s.label }}</span>
                      </el-option>
                    </el-option-group>
                  </el-select>

                  <el-button v-if="!!templateScript" @click="showScriptTemplate" type="text">{{ $t('Show Script Template') }}</el-button>
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

      <LongTextDialog :title="$t('Script Template')" mode="python" ref="longTextDialog" />
    </el-container>
  </transition>
</template>

<script>
import LongTextDialog from '@/components/LongTextDialog'

export default {
  name: 'ScriptSetup',
  components: {
    LongTextDialog,
  },
  watch: {
    $route: {
      immediate: true,
      async handler(to, from) {
        await this.loadData();

        switch(this.T.setupPageMode()) {
          case 'add':
            this.T.jsonClear(this.form);
            this.data = {};

            // 【特殊处理】脚本ID格式为"<脚本集ID>__<脚本名>"
            this.form.id = `${this.scriptSetId}__`;
            break;

          case 'setup':
            break;
        }
      },
    },
  },
  methods: {
    doFilter(q) {
      q = (q || '').toLowerCase().trim();
      if (!q || q[0] === '_') {
        this.templateScriptShowOptions = this.templateScripts;
      } else {
        this.templateScriptShowOptions = this.T.searchKeywords(q, this.templateScripts);
      }
    },

    async loadData() {
      let apiRes = null;
      switch(this.T.setupPageMode()) {
        case 'add':
          apiRes = await this.T.callAPI_getAll('/api/v1/scripts/do/list', {
            query: {
              fields    : [ 'id', 'title', 'scriptSetId', 'sset_title', 'code' ],
              _withCode : true,
              scriptName: 'example',
            },
          });
          if (!apiRes || !apiRes.ok) return;

          let templateScripts = apiRes.data;

          templateScripts.forEach(d => {
            d.shortScriptId = d.id.split('__').slice(1).join('__');
            d.label = `${d.sset_title || d.scriptSetId} / ${d.title || d.shortScriptId}`;
            this.T.appendSearchFields(d, ['sset_title', 'scriptSetId', 'title', 'shortScriptId'])
          });

          this.templateScripts           = templateScripts;
          this.templateScriptShowOptions = templateScripts;
          this.templateScriptMap = templateScripts.reduce((acc, x) => {
            acc[x.id] = x;
            return acc;
          }, {});

          break;

        case 'setup':
          apiRes = await this.T.callAPI_getOne('/api/v1/scripts/do/list', this.scriptId);
          if (!apiRes || !apiRes.ok) return;

          this.data = apiRes.data;

          let nextForm = {};
          Object.keys(this.form).forEach(f => nextForm[f] = this.data[f]);
          this.form = nextForm;
          break;
      }

      this.$store.commit('updateLoadStatus', true);
    },
    async submitData() {
      try {
        await this.$refs.form.validate();
      } catch(err) {
        return console.error(err);
      }

      let dataId = null;
      switch(this.T.setupPageMode()) {
        case 'add':
          dataId = await this.addData();
          break;

        case 'setup':
          dataId = await this.modifyData();
          break;
      }

      if (dataId) {
        this.$store.commit('updateEditor_selectedItemId', null);
      }
    },
    async addData() {
      let _data = this.T.jsonCopy(this.form);

      switch(this.templateScriptId) {
        case '_basicExample':
          delete _data.codeDraft;
          break;

        case '_blankScript':
          _data.codeDraft = '';
          break;

        default:
          let exampleScript = this.templateScriptMap[this.templateScriptId];
          _data.codeDraft = exampleScript && exampleScript.code
                          ? exampleScript.code
                          : '';
          break;
      }

      let apiRes = await this.T.callAPI('post', '/api/v1/scripts/do/add', {
        body : { data: _data },
        alert: { okMessage: this.$t('Script created') },
      });
      if (!apiRes || !apiRes.ok) return;

      this.$store.commit('updateScriptListSyncTime');

      this.$router.push({
        name  : 'code-editor',
        params: { id: apiRes.data.id },
      });

      return apiRes.data.id;
    },
    async modifyData() {
      let _formData = this.T.jsonCopy(this.form);
      delete _formData.id;

      let apiRes = await this.T.callAPI('post', '/api/v1/scripts/:id/do/modify', {
        params: { id: this.scriptId },
        body  : { data: _formData },
        alert : { okMessage: this.$t('Script saved') },
      });
      if (!apiRes || !apiRes.ok) return;

      await this.loadData();
      this.$store.commit('updateScriptListSyncTime');

      return this.scriptId;
    },
    async deleteData() {
      if (!await this.T.confirm(this.$t('Are you sure you want to delete the Script?'))) return;

      let apiRes = await this.T.callAPI('/api/v1/scripts/:id/do/delete', {
        params: { id: this.scriptId },
        alert : { okMessage: this.$t('Script deleted') },
      });
      if (!apiRes || !apiRes.ok) return;

      this.$router.push({
        name: 'intro',
      });
      this.$store.commit('updateScriptListSyncTime');
    },
    showScriptTemplate() {
      if (this.templateScript) {
        this.$refs.longTextDialog.update(this.templateScript);
      }
    },
  },
  computed: {
    pageTitle() {
      const _map = {
        setup: this.$t('Setup Script'),
        add  : this.$t('Add Script'),
      };
      return _map[this.T.setupPageMode()];
    },
    scriptSetId() {
      switch(this.T.setupPageMode()) {
        case 'add':
          return this.$route.params.id;
        case 'setup':
          return this.data.scriptSetId;
      }
    },
    scriptId() {
      switch(this.T.setupPageMode()) {
        case 'add':
          return this.form.id;
        case 'setup':
          return this.$route.params.id;
      }
    },

    lockedByUserId() {
      return this.data.sset_lockedByUserId || this.data.lockedByUserId;
    },
    lockedByUser() {
      if (this.data.sset_lockedByUserId) {
        return `${this.data.sset_lockedByUserName || this.data.sset_lockedByUsername}`
      } else if (this.data.lockedByUserId) {
        return `${this.data.lockedByUserName || this.data.lockedByUsername}`
      }
    },
    isLockedByMe() {
      return this.lockedByUserId === this.$store.getters.userId
    },
    isLockedByOther() {
      return this.lockedByUserId && !this.isLockedByMe;
    },
    isEditable() {
      // 超级管理员不受限制
      if (this.$store.getters.isAdmin) return true;
      return !this.isLockedByOther;
    },

    templateScript() {
      if (!this.templateScriptId
        || this.T.isNothing(this.templateScriptMap)
        || !this.templateScriptMap[this.templateScriptId]) {
        return '';
      } else {
        return this.templateScriptMap[this.templateScriptId].code || '';
      }
    },
  },
  props: {
  },
  data() {
    return {
      data: {},

      templateScriptId: '_basicExample',

      templateScripts          : [],
      templateScriptShowOptions: [],
      templateScriptMap        : {},

      form: {
        id         : null,
        title      : null,
        description: null,
        codeDraft  : null,
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
              let prefix = `${this.scriptSetId}__`;
              if (value.indexOf(prefix) < 0 || value === prefix) {
                let _message = this.$t('Script ID should starts with "{prefix}"', { scriptSetId: this.scriptSetId, prefix: prefix });
                return callback(new Error(_message));
              }
              return callback();
            },
          },
        ],
      }
    }
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.example-script {
  padding-left: 20px;
}
</style>
