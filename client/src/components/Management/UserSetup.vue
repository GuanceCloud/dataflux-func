<i18n locale="zh-CN" lang="yaml">
Add User   : 添加用户
Modify User: 添加用户
</i18n>

<template>
  <transition name="fade">
    <el-container direction="vertical" v-if="$store.state.isLoaded">
      <!-- 标题区 -->
      <el-header height="60px">
        <h1>
          {{ modeName }}成员
          <code class="text-main">{{ data.name || data.username }}</code>
        </h1>
      </el-header>

      <!-- 编辑区 -->
      <el-main>
        <el-row :gutter="20">
          <el-col :span="15">
            <div class="common-form">
              <el-form ref="form" :model="form" label-width="100px" :rules="formRules">
                <el-form-item label="登录账号" prop="username">
                  <el-input
                    maxlength="20"
                    show-word-limit
                    v-model="form.username"></el-input>
                </el-form-item>

                <el-form-item label="姓名" prop="name">
                  <el-input
                    maxlength="40"
                    show-word-limit
                    v-model="form.name"></el-input>
                </el-form-item>

                <el-form-item label="密码" prop="password">
                  <el-input placeholder="不修改时请留空"
                    maxlength="100"
                    show-password
                    v-model="form.password"></el-input>
                </el-form-item>

                <el-form-item>
                  <el-button type="primary" @click="submitData">保存</el-button>
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

        switch(this.mode) {
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
      if (this.mode === 'setup') {
        let apiRes = await this.T.callAPI_getOne('/api/v1/users/do/list', this.$route.params.id, {
          alert: {showError: true},
        });
        if (!apiRes.ok) return;

        this.data = apiRes.data;

        let nextForm = {};
        Object.keys(this.form).forEach(f => nextForm[f] = this.data[f]);
        this.form = nextForm;
      }

      if (this.mode === 'add') {
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

      switch(this.mode) {
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
        body : {data: _formData},
        alert: {title: this.$t('Add User'), showError: true, showSuccess: true},
      });
      if (!apiRes.ok) return;

      this.$router.push({
        name: 'user-list',
      });
    },
    async modifyData() {
      let _formData = this.T.jsonCopy(this.form);
      if (this.T.isNothing(_formData.password)) {
        delete _formData.password;
      }

      let apiRes = await this.T.callAPI('post', '/api/v1/users/:id/do/modify', {
        params: {id: this.$route.params.id},
        body  : {data: _formData},
        alert : {title: this.$t('Modify User'), showError: true, showSuccess: true},
      });
      if (!apiRes.ok) return;

      await this.loadData();
    },
  },
  computed: {
    mode() {
      return this.$route.name.split('-').pop();
    },
    modeName() {
      const nameMap = {
        setup: '修改',
        add  : '添加',
      };
      return nameMap[this.mode];
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
      formRules: {
        username: [
          {
            trigger : 'change',
            message : '请输入登录账号',
            required: true,
          },
          {
            trigger: 'change',
            message: '引用名只能包含大小写英文、数字或下划线，且不能以数字开头',
            pattern: /^[a-zA-Z_][a-zA-Z0-9_]*$/g,
          }
        ],
        name: [
          {
            trigger : 'change',
            message : '请输入名称',
            required: true,
          }
        ],
        password: [
          {
            trigger : 'change',
            message : '请输入密码',
            required: false,
          }
        ],
      },
    }
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
</style>
