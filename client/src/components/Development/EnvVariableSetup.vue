<i18n locale="zh-CN" lang="yaml">
Add ENV  : 添加环境变量
Setup ENV: 配置环境变量

Value Type: 值类型

Please input ID: 请输入 ID
Only alphabets, numbers and underscore are allowed: 只能包含大小写英文、数字及下划线
Cannot not starts with a number: 不得以数字开头
Please input Value: 请输入值

ENV Variable created: 环境变量已创建
ENV Variable saved  : 环境变量已保存
ENV Variable deleted: 环境变量已删除

Are you sure you want to delete the ENV?: 是否确认删除此环境变量？
</i18n>

<template>
  <el-dialog
    id="ScriptSetSetup"
    :visible.sync="show"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    width="750px">

    <template slot="title">
      {{ pageTitle }} <code class="text-main">{{ data.title || data.id }}</code>
    </template>

    <el-container direction="vertical">
      <el-main>
        <div class="setup-form">
          <el-form ref="form" label-width="135px" :model="form" :rules="formRules">
            <el-form-item label="ID" prop="id">
              <el-input :disabled="pageMode === 'setup'"
                maxlength="60"
                v-model="form.id"></el-input>
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

            <el-form-item :label="$t('Value')" prop="valueTEXT">
              <el-input
                type="textarea"
                resize="none"
                :autosize="{minRows: 2}"
                maxlength="5000"
                v-model="form.valueTEXT"></el-input>
            </el-form-item>

            <el-form-item :label="$t('Value Type')">
              <el-select v-model="form.autoTypeCasting">
                <el-option v-for="opt in C.ENV_VARIABLE" :label="opt.name" :key="opt.key" :value="opt.key"></el-option>
              </el-select>
              <InfoBlock v-if="C.ENV_VARIABLE_MAP.get(form.autoTypeCasting)"
                :title="C.ENV_VARIABLE_MAP.get(form.autoTypeCasting).tips" />
            </el-form-item>

            <el-form-item class="setup-footer">
              <el-button class="danger-button float-left" v-if="pageMode === 'setup'" @click="deleteData">{{ $t('Delete') }}</el-button>
              <el-button type="primary" v-prevent-re-click @click="submitData">{{ $t('Save') }}</el-button>
            </el-form-item>
          </el-form>
        </div>
      </el-main>
    </el-container>
  </el-dialog>
</template>

<script>
export default {
  name: 'EnvVariableSetup',
  components: {
  },
  watch: {
  },
  methods: {
    async loadData(id) {
      if (!id) {
        this.pageMode = 'add';
        this.T.jsonClear(this.form);
        this.data = {};

        // 【特殊处理】默认自动类型转换为"string"
        this.form.autoTypeCasting = 'string';

      } else {
        this.pageMode = 'setup';
        this.data.id = id;

        let apiRes = await this.T.callAPI_getOne('/api/v1/env-variables/do/list', this.data.id);
        if (!apiRes || !apiRes.ok) return;

        this.data = apiRes.data;

        let nextForm = {};
        Object.keys(this.form).forEach(f => nextForm[f] = this.data[f]);
        this.form = nextForm;
      }

      this.show = true;
    },
    async submitData() {
      try {
        await this.$refs.form.validate();
      } catch(err) {
        return console.error(err);
      }

      switch(this.pageMode) {
        case 'add':
          return await this.addData();
        case 'setup':
          return await this.modifyData();
      }
    },
    async addData() {
      let apiRes = await this.T.callAPI('post', '/api/v1/env-variables/do/add', {
        body : { data: this.T.jsonCopy(this.form) },
        alert: { okMessage: this.$t('ENV Variable created') },
      });
      if (!apiRes || !apiRes.ok) return;

      this.$store.commit('updateEnvVariableListSyncTime');
      this.show = false;
    },
    async modifyData() {
      let _formData = this.T.jsonCopy(this.form);
      delete _formData.id;

      let apiRes = await this.T.callAPI('post', '/api/v1/env-variables/:id/do/modify', {
        params: { id: this.data.id },
        body  : { data: _formData },
        alert : { okMessage: this.$t('ENV Variable saved') },
      });
      if (!apiRes || !apiRes.ok) return;

      this.$store.commit('updateEnvVariableListSyncTime');
      this.show = false;
    },
    async deleteData() {
      if (!await this.T.confirm(this.$t('Are you sure you want to delete the ENV?'))) return;

      let apiRes = await this.T.callAPI('/api/v1/env-variables/:id/do/delete', {
        params: { id: this.data.id },
        alert : { okMessage: this.$t('ENV Variable deleted') },
      });
      if (!apiRes || !apiRes.ok) return;

      this.$store.commit('updateEnvVariableListSyncTime');
      this.show = false;
    },
  },
  computed: {
    pageTitle() {
      const _map = {
        setup: this.$t('Setup ENV'),
        add  : this.$t('Add ENV'),
      };
      return _map[this.pageMode];
    },
  },
  props: {
  },
  data() {
    return {
      show    : false,
      pageMode: null,

      data: {},
      form: {
        id             : null,
        title          : null,
        description    : null,
        valueTEXT      : null,
        autoTypeCasting: null,
      },
      formRules: {
        id: [
          {
            trigger : 'blur',
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
        ],
        valueTEXT: [
          {
            trigger : 'blur',
            message : this.$t('Please input Value'),
            required: true,
          },
        ]
      },
    }
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

</style>
