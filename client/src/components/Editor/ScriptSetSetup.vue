<i18n locale="zh-CN" lang="yaml">
Add Script Set  : 添加脚本集
Setup Script Set: 配置脚本集

Title      : 标题
Description: 描述

Script Set ID will be a part of the Func ID: 脚本集ID将作为函数ID的一部分

Please input ID: 请输入ID
Only alphabets, numbers and underscore are allowed: 只能包含大小写英文、数字及下划线
Cannot not starts with a number: 不得以数字开头
'ID cannot contains double underscore "__"': '脚本集ID不能包含"__"，"__"为脚本集ID与脚本ID的分隔标志'

Script Set created : 脚本集已创建
Script Set saved   : 脚本集已保存
Script Set locked  : 脚本集已上锁
Script Set unlocked: 脚本集已解锁
Script Set deleted : 脚本集已删除

Are you sure you want to delete the Script Set?: 是否确认删除此脚本集？

This Script Set is locked by someone else, setup is disabled: 当前脚本已被其他人锁定，无法更改配置
This Script Set is locked by you, setup is disabled to others: 当前脚本已被您锁定，其他人无法更改配置
</i18n>

<template>
  <transition name="fade">
    <el-container direction="vertical" v-if="$store.state.isLoaded">
      <!-- 标题区 -->
      <el-header height="60px">
        <h1>{{ pageTitle }} <code class="text-main">{{ data.title || data.id }}</code></h1>
      </el-header>

      <!-- 编辑区 -->
      <el-main>
        <el-row :gutter="20">
          <el-col :span="15">
            <div class="common-form">
              <el-form ref="form" label-width="120px" :model="form" :disabled="isLockedByOther" :rules="formRules">
                <el-form-item v-if="isLockedByOther">
                  <InfoBlock type="error" :title="$t('This Script Set is locked by someone else, setup is disabled')"></InfoBlock>
                </el-form-item>
                <el-form-item v-else-if="data.isLocked">
                  <InfoBlock type="success" :title="$t('This Script Set is locked by you, setup is disabled to others')"></InfoBlock>
                </el-form-item>

                <el-form-item label="ID" prop="id">
                  <el-input :disabled="T.pageMode() === 'setup'"
                    maxlength="40"
                    show-word-limit
                    v-model="form.id"></el-input>
                  <InfoBlock :title="$t('Script Set ID will be a part of the Func ID')"></InfoBlock>
                </el-form-item>

                <el-form-item :label="$t('Title')">
                  <el-input
                    maxlength="25"
                    show-word-limit
                    v-model="form.title"></el-input>
                </el-form-item>

                <el-form-item :label="$t('Description')">
                  <el-input
                    type="textarea"
                    resize="none"
                    :autosize="{minRows: 2}"
                    maxlength="200"
                    show-word-limit
                    v-model="form.description"></el-input>
                </el-form-item>

                <el-form-item>
                  <el-button v-if="T.pageMode() === 'setup'" @click="deleteData">{{ $t('Delete') }}</el-button>
                  <div class="setup-right">
                    <el-button v-if="T.pageMode() === 'setup'" @click="lockData(!data.isLocked)">{{ data.isLocked ? $t('Unlock') : $t('Lock') }}</el-button>
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
  name: 'ScriptSetSetup',
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
  },
  methods: {
    async loadData() {
      if (this.T.pageMode() === 'setup') {
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
      switch(this.T.pageMode()) {
        case 'add':
          dataId = await this.addData();
          break;

        case 'setup':
          dataId = await this.modifyData();
          break;
      }

      if (dataId) {
        this.$store.commit('updateAsideScript_currentNodeKey', dataId);
        this.$store.commit('updateEditor_highlightedFuncId', null);
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
    async lockData(isLocked) {
      let okMessage = isLocked
                    ? this.$t('Script Set locked')
                    : this.$t('Script Set unlocked');
      let apiRes = await this.T.callAPI('post', '/api/v1/script-sets/:id/do/modify', {
        params: { id: this.scriptSetId },
        body  : { data: { isLocked: isLocked } },
        alert : { okMessage: okMessage },
      });
      if (!apiRes.ok) return;

      await this.loadData();
      this.$store.commit('updateScriptListSyncTime');
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
      return _map[this.T.pageMode()];
    },
    scriptSetId() {
      switch(this.T.pageMode()) {
        case 'add':
          return this.form.id;
        case 'setup':
          return this.$route.params.id;
      }
    },
    isLockedByOther() {
      return this.data.lockedByUserId && this.data.lockedByUserId !== this.$store.getters.userId;
    },
  },
  props: {
  },
  data() {
    return {
      data: {},
      form: {
        id         : null,
        title      : null,
        description: null,
      },
    }
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
</style>
