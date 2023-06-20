<i18n locale="en" lang="yaml">
requirementsTip: '"package" or "package==1.2.3", one per row'
</i18n>
<i18n locale="zh-CN" lang="yaml">
requirementsTip: '"package" 或 "package==1.2.3" 格式，每行一个'

Add Script Set  : 添加脚本集
Setup Script Set: 配置脚本集

Requirements: 依赖包

Script Set ID will be a part of the Func ID: 脚本集 ID 将作为函数 ID 的一部分
Go to PIP tool to install                  : 前往 PIP 工具安装

Please input ID                                   : 请输入 ID
Only alphabets, numbers and underscore are allowed: 只能包含大小写英文、数字及下划线
Cannot not starts with a number                   : 不得以数字开头

'ID cannot contains double underscore "__"': '脚本集 ID 不能包含"__"，"__"为脚本集 ID 与脚本 ID 的分隔标志'

Script Set created : 脚本集已创建
Script Set saved   : 脚本集已保存
Script Set deleted : 脚本集已删除

Are you sure you want to delete the Script Set?: 是否确认删除此脚本集？

This Script Set is locked by you: 当前脚本已被您锁定
This Script Set is locked by other user ({user}): 当前脚本已被其他用户（{user}）锁定
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
                  <InfoBlock type="success" :title="$t('This Script Set is locked by you')" />
                </el-form-item>
                <el-form-item v-else-if="isLockedByOther">
                  <InfoBlock :type="isEditable ? 'warning' : 'error'" :title="$t('This Script Set is locked by other user ({user})', { user: lockedByUser })" />
                </el-form-item>

                <el-form-item label="ID" prop="id">
                  <el-input :disabled="T.setupPageMode() === 'setup'"
                    maxlength="60"
                    v-model="form.id"></el-input>
                  <InfoBlock :title="$t('Script Set ID will be a part of the Func ID')" />
                </el-form-item>

                <el-form-item :label="$t('Title')">
                  <el-input :placeholder="$t('Optional')"
                    maxlength="200"
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

                <el-form-item :label="$t('Requirements')">
                  <el-input :placeholder="$t('Optional')"
                    type="textarea"
                    resize="none"
                    :autosize="{minRows: 2}"
                    maxlength="5000"
                    v-model="form.requirements"></el-input>
                  <InfoBlock :title="$t('requirementsTip')" />
                  <div class="setup-right">
                    <el-button v-if="requirementsLine" type="text" @click="common.goToPIPTools(requirementsLine)">{{ $t('Go to PIP tool to install') }}</el-button>
                  </div>
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
  name: 'ScriptSetSetup',
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
            this.data = {};
            break;

          case 'setup':
            break;
        }
      },
    },
  },
  methods: {
    async loadData() {
      if (this.T.setupPageMode() === 'setup') {
        let apiRes = await this.T.callAPI_getOne('/api/v1/script-sets/do/list', this.scriptSetId);
        if (!apiRes || !apiRes.ok) return;

        this.data = apiRes.data;

        let nextForm = {};
        Object.keys(this.form).forEach(f => nextForm[f] = this.data[f]);
        this.form = nextForm;
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
      let apiRes = await this.T.callAPI('post', '/api/v1/script-sets/do/add', {
        body : { data: this.T.jsonCopy(this.form) },
        alert: { okMessage: this.$t('Script Set created') },
      });
      if (!apiRes || !apiRes.ok) return;

      this.$router.push({
        name: 'intro',
      });
      this.$store.commit('updateScriptListSyncTime');

      return apiRes.data.id;
    },
    async modifyData() {
      let _formData = this.T.jsonCopy(this.form);
      delete _formData.id;

      let apiRes = await this.T.callAPI('post', '/api/v1/script-sets/:id/do/modify', {
        params: { id: this.scriptSetId },
        body  : { data: _formData },
        alert : { okMessage: this.$t('Script Set saved') },
      });
      if (!apiRes || !apiRes.ok) return;

      // await this.loadData();
      this.$store.commit('updateScriptListSyncTime');

      return this.scriptSetId;
    },
    async deleteData() {
      if (!await this.T.confirm(this.$t('Are you sure you want to delete the Script Set?'))) return;

      let apiRes = await this.T.callAPI('/api/v1/script-sets/:id/do/delete', {
        params: { id: this.scriptSetId },
        alert : { okMessage: this.$t('Script Set deleted') },
      });
      if (!apiRes || !apiRes.ok) return;

      this.$router.push({
        name: 'intro',
      });
      this.$store.commit('updateScriptListSyncTime');
    },
  },
  computed: {
    pageTitle() {
      const _map = {
        setup: this.$t('Setup Script Set'),
        add  : this.$t('Add Script Set'),
      };
      return _map[this.T.setupPageMode()];
    },
    scriptSetId() {
      switch(this.T.setupPageMode()) {
        case 'add':
          return this.form.id;
        case 'setup':
          return this.$route.params.id;
      }
    },

    lockedByUser() {
        return `${this.data.lockedByUserName || this.data.lockedByUsername}`
    },
    isLockedByMe() {
      return this.data.lockedByUserId === this.$store.getters.userId
    },
    isLockedByOther() {
      return this.data.lockedByUserId && !this.isLockedByMe;
    },
    isEditable() {
      // 超级管理员不受限制
      if (this.$store.getters.isAdmin) return true;
      return !this.isLockedByOther;
    },

    requirementsLine() {
      if (!this.form.requirements) return null;

      let line = this.form.requirements.split(/\s+/).join(' ');
      return line;
    },
  },
  props: {
  },
  data() {
    return {
      data: {},
      form: {
        id          : null,
        title       : null,
        description : null,
        requirements: null,
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
    }
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
</style>
