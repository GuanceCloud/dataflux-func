<i18n locale="zh-CN" lang="yaml">
Add Script Set  : 添加脚本集
Setup Script Set: 配置脚本集

Title       : 标题
Description : 描述
Requirements: 依赖包

Script Set ID will be a part of the Func ID: 脚本集ID将作为函数ID的一部分
requirements.txt format, one for each line : requirements.txt 文件格式，一行一个
Go to PIP tool to install                  : 前往PIP工具安装

Please input ID: 请输入ID
Script Set ID too long: 脚本集ID过长
Only alphabets, numbers and underscore are allowed: 只能包含大小写英文、数字及下划线
Cannot not starts with a number: 不得以数字开头
'ID cannot contains double underscore "__"': '脚本集ID不能包含"__"，"__"为脚本集ID与脚本ID的分隔标志'

Script Set created : 脚本集已创建
Script Set saved   : 脚本集已保存
Script Set deleted : 脚本集已删除
Script Set cloned  : 脚本集已克隆

Are you sure you want to delete the Script Set?: 是否确认删除此脚本集？

This Script Set is locked by you: 当前脚本已被您锁定
This Script Set is locked by other user({user}): 当前脚本已被其他用户（{user}）锁定

Please input new Script Set ID: 请输入新脚本集ID
Inputed Script Set ID already exists: 输入的脚本集ID已经存在
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
              <el-form ref="form" label-width="120px" :model="form" :disabled="!isEditable" :rules="formRules">
                <el-form-item v-if="isLockedByMe">
                  <InfoBlock type="success" :title="$t('This Script Set is locked by you')"></InfoBlock>
                </el-form-item>
                <el-form-item v-else-if="isLockedByOther">
                  <InfoBlock :type="isEditable ? 'warning' : 'error'" :title="$t('This Script Set is locked by other user({user})', { user: lockedByUser })"></InfoBlock>
                </el-form-item>

                <el-form-item label="ID" prop="id">
                  <el-input :disabled="T.setupPageMode() === 'setup'"
                    maxlength="32"
                    show-word-limit
                    v-model="form.id"></el-input>
                  <InfoBlock :title="$t('Script Set ID will be a part of the Func ID')"></InfoBlock>
                </el-form-item>

                <el-form-item :label="$t('Title')">
                  <el-input :placeholder="$t('Optional')"
                    maxlength="25"
                    show-word-limit
                    v-model="form.title"></el-input>
                </el-form-item>

                <el-form-item :label="$t('Description')">
                  <el-input :placeholder="$t('Optional')"
                    type="textarea"
                    resize="none"
                    :autosize="{minRows: 2}"
                    maxlength="5000"
                    show-word-limit
                    v-model="form.description"></el-input>
                </el-form-item>

                <el-form-item :label="$t('Requirements')">
                  <el-input :placeholder="$t('Optional')"
                    type="textarea"
                    resize="none"
                    :autosize="{minRows: 2}"
                    maxlength="5000"
                    show-word-limit
                    v-model="form.requirements"></el-input>
                  <InfoBlock :title="$t('requirements.txt format, one for each line')"></InfoBlock>
                  <div class="setup-right">
                    <el-button v-if="requirementsTEXT" type="text" @click="goToPIPTool">{{ $t('Go to PIP tool to install') }}</el-button>
                  </div>
                </el-form-item>

                <el-form-item>
                  <el-button v-if="T.setupPageMode() === 'setup'" @click="deleteData">{{ $t('Delete') }}</el-button>
                  <div class="setup-right">
                    <template v-if="T.setupPageMode() === 'setup'">
                      <el-button @click="cloneData">{{ $t('Clone') }}</el-button>
                    </template>
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
        if (!apiRes.ok) return;

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
      if (!apiRes.ok) return;

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
      if (!apiRes.ok) return;

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
      if (!apiRes.ok) return;

      this.$router.push({
        name: 'intro',
      });
      this.$store.commit('updateScriptListSyncTime');
    },
    async cloneData() {
      let promptOpt = {
        inputValidator: v => {
          if (v.length <= 0) {
            return this.$t('Please input ID');
          } else if (v.length > 32) {
            return this.$t('Script Set ID too long');
          } else if (!v.match(/^[a-zA-Z0-9_]*$/g)) {
            return this.$t('Only alphabets, numbers and underscore are allowed');
          } else if (!v.match(/^[^0-9]/g)) {
            return this.$t('Cannot not starts with a number');
          }
          return true;
        }
      }
      let newScriptSetId = await this.T.prompt(this.$t('Please input new Script Set ID'), `${this.scriptSetId}_2`, promptOpt);
      if (!newScriptSetId) return;

      // 检查重名
      let apiRes = await this.T.callAPI_getOne('/api/v1/script-sets/do/list', newScriptSetId);
      if (apiRes.data) {
        return this.T.alert(this.$t('Inputed Script Set ID already exists'));
      }

      // 执行克隆
      apiRes = await this.T.callAPI('post', '/api/v1/script-sets/:id/do/clone', {
        params: { id: this.scriptSetId },
        body  : { newId: newScriptSetId },
        alert : { okMessage: this.$t('Script Set cloned') },
      });
      if (!apiRes.ok) return;

      this.$store.commit('updateScriptListSyncTime');
    },
    goToPIPTool() {
      this.$router.push({
        name: 'pip-tool',
        query: { pkgs: this.T.getBase64(this.requirementsTEXT) },
      });
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

    requirementsTEXT() {
      if (!this.form.requirements) return null;

      let pkgs = this.form.requirements.split(/\s+/).join(' ');
      return pkgs;
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
    }
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
</style>
