<i18n locale="zh-CN" lang="yaml">
Add User  : 添加用户
Setup User: 配置用户

Username: 登录账号
Password: 密码

Leave blank when not changing: 不修改时请留空

User created: 用户已创建
User saved  : 用户已保存

Please input username: 请输入登录账号
Only alphabets, numbers and underscore are allowed: 只能包含大小写英文、数字及下划线
Please input name: 请输入名称
Please input password: 请输入密码
</i18n>

<template>
  <transition name="fade">
    <el-container direction="vertical" v-show="$store.state.isLoaded">
      <!-- 标题区 -->
      <el-header height="60px">
        <h1>{{ pageTitle }} <code class="text-main">{{ data.name || data.username }}</code></h1>
      </el-header>

      <!-- 编辑区 -->
      <el-main>
        <el-row :gutter="20">
          <el-col :span="15">
            <div class="common-form">
              <el-form ref="form" label-width="135px" :model="form" :rules="formRules">
                <el-form-item :label="$t('Username')" prop="username">
                  <el-input
                    maxlength="20"
                    v-model="form.username"></el-input>
                </el-form-item>

                <el-form-item :label="$t('Name')" prop="name">
                  <el-input
                    maxlength="40"
                    v-model="form.name"></el-input>
                </el-form-item>

                <el-form-item :label="$t('Password')" prop="password">
                  <el-input :placeholder="passwordPlaceholder"
                    maxlength="100"
                    show-password
                    v-model="form.password"></el-input>
                </el-form-item>

                <el-form-item>
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
  name: 'UserSetup',
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
        let apiRes = await this.T.callAPI_getOne('/api/v1/users/do/list', this.$route.params.id);
        if (!apiRes || !apiRes.ok) return;

        this.data = apiRes.data;

        let nextForm = {};
        Object.keys(this.form).forEach(f => nextForm[f] = this.data[f]);
        this.form = nextForm;
      }

      if (this.T.setupPageMode() === 'add') {
        // 添加用户时，密码必填
        this.formRules['password'][0].required = true;
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
      let _formData = this.T.jsonCopy(this.form);
      _formData.roles = ['user'];

      let apiRes = await this.T.callAPI('post', '/api/v1/users/do/add', {
        body : { data: _formData },
        alert: { okMessage: this.$t('User created') },
      });
      if (!apiRes || !apiRes.ok) return;

      this.$router.push({
        name : 'user-list',
        query: this.T.getPrevQuery(),
      });
    },
    async modifyData() {
      let _formData = this.T.jsonCopy(this.form);
      if (this.T.isNothing(_formData.password)) {
        delete _formData.password;
      }

      let apiRes = await this.T.callAPI('post', '/api/v1/users/:id/do/modify', {
        params: { id: this.$route.params.id },
        body  : { data: _formData },
        alert : { okMessage: this.$t('User saved') },
      });
      if (!apiRes || !apiRes.ok) return;

      this.$router.push({
        name : 'user-list',
        query: this.T.getPrevQuery(),
      });
    },
  },
  computed: {
    formRules() {
      return {
        username: [
          {
            trigger : 'change',
            message : this.$t('Please input username'),
            required: true,
          },
          {
            trigger: 'change',
            message: this.$t('Only alphabets, numbers and underscore are allowed'),
            pattern: /^[a-zA-Z0-9_]*$/g,
          }
        ],
        name: [
          {
            trigger : 'change',
            message : this.$t('Please input name'),
            required: true,
          }
        ],
        password: [
          {
            trigger : 'change',
            message : this.$t('Please input password'),
            required: false,
          }
        ],
      }
    },
    pageTitle() {
      const _map = {
        setup: this.$t('Setup User'),
        add  : this.$t('Add User'),
      };
      return _map[this.T.setupPageMode()];
    },
    passwordPlaceholder() {
      if (this.T.setupPageMode() === 'add') {
        return '';
      } else {
        return this.$t('Leave blank when not changing');
      }
    },
  },
  props: {
  },
  data() {
    return {
      data: {},
      form: {
        username: null,
        name    : null,
        password: null,
      },
    }
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
</style>
