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
            <div class="setup-form">
              <el-form ref="form" label-width="135px" :model="form" :rules="formRules">
                <el-form-item label="ID" prop="id">
                  <el-input :disabled="T.setupPageMode() === 'setup'"
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
              </el-form>
            </div>
          </el-col>
          <el-col :span="9" class="hidden-md-and-down">
          </el-col>
        </el-row>
      </el-main>

      <!-- 底部栏 -->
      <el-footer>
        <div class="setup-footer">
          <el-button class="delete-button" v-if="T.setupPageMode() === 'setup'" @click="deleteData">{{ $t('Delete') }}</el-button>
          <el-button type="primary" v-prevent-re-click @click="submitData">{{ $t('Save') }}</el-button>
        </div>
      </el-footer>
    </el-container>
  </transition>
</template>

<script>
export default {
  name: 'EnvVariableSetup',
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

            // 【特殊处理】默认自动类型转换为"string"
            this.form.autoTypeCasting = 'string';
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
        let apiRes = await this.T.callAPI_getOne('/api/v1/env-variables/do/list', this.$route.params.id);
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

      switch(this.T.setupPageMode()) {
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

      this.$router.push({
        name  : 'env-variable-setup',
        params: {id: apiRes.data.id},
      });
      this.$store.commit('updateEnvVariableListSyncTime');
    },
    async modifyData() {
      let _formData = this.T.jsonCopy(this.form);
      delete _formData.id;

      let apiRes = await this.T.callAPI('post', '/api/v1/env-variables/:id/do/modify', {
        params: { id: this.$route.params.id },
        body  : { data: _formData },
        alert : { okMessage: this.$t('ENV Variable saved') },
      });
      if (!apiRes || !apiRes.ok) return;

      this.$store.commit('updateEnvVariableListSyncTime');
    },
    async deleteData() {
      if (!await this.T.confirm(this.$t('Are you sure you want to delete the ENV?'))) return;

      let apiRes = await this.T.callAPI('/api/v1/env-variables/:id/do/delete', {
        params: { id: this.$route.params.id },
        alert : { okMessage: this.$t('ENV Variable deleted') },
      });
      if (!apiRes || !apiRes.ok) return;

      this.$router.push({
        name: 'intro',
      });
      this.$store.commit('updateEnvVariableListSyncTime');
    },
  },
  computed: {
    pageTitle() {
      const _map = {
        setup: this.$t('Setup ENV'),
        add  : this.$t('Add ENV'),
      };
      return _map[this.T.setupPageMode()];
    },
  },
  props: {
  },
  data() {
    return {
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
        ],
        valueTEXT: [
          {
            trigger : 'change',
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
