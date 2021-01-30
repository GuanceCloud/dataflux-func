<i18n locale="zh-CN" lang="yaml">
User Info                                                                             : 用户信息
You are signed in via integrated user, please change your profile in the origin system: 当前登录用户为集成登录用户，修改信息请前往原系统进行操作
Username                                                                              : 用户名
Show Name                                                                             : 显示名
Please input display name                                                             : 请输入显示名
Modify user info                                                                      : 修改用户信息
</i18n>

<template>
  <transition name="fade">
    <el-container direction="vertical" v-if="$store.state.isLoaded">
      <!-- 标题区 -->
      <el-header height="60px">
        <h1>
          {{ $t('User Info')}}
        </h1>
      </el-header>

      <!-- 编辑区 -->
      <el-main>
        <el-row :gutter="20">
          <el-col :span="15">
            <div class="common-form">
              <el-form ref="form" :model="form" :rules="formRules" :disabled="$store.getters.isIntegratedUser" label-width="100px">
                <el-form-item>
                  <InfoBlock v-if="$store.getters.isIntegratedUser" type="warning" :title="$t('You are signed in via integrated user, please change your profile in the origin system')"></InfoBlock>
                </el-form-item>

                <el-form-item :label="$t('Username')">
                  <el-input :disabled="true" v-model="data.username"></el-input>
                </el-form-item>

                <el-form-item :label="$t('Show Name')" prop="name">
                  <el-input
                    maxlength="25"
                    show-word-limit
                    v-model="form.name"></el-input>
                </el-form-item>

                <el-form-item>
                  <el-button type="primary" @click="submitData">{{ $t('Modify') }}</el-button>
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
  name: 'ProfileSetup',
  components: {
  },
  watch: {
    $route: {
      immediate: true,
      async handler(to, from) {
        await this.loadData();
      }
    },
  },
  methods: {
    async loadData() {
      let apiRes = await this.T.callAPI('/api/v1/auth/profile/do/get', {
        alert: {showError: true},
      });
      if (!apiRes.ok) return;

      this.data = apiRes.data;

      let nextForm = {};
      Object.keys(this.form).forEach(f => nextForm[f] = this.data[f]);
      this.form = nextForm;

      this.$store.commit('updateLoadStatus', true);
    },
    async submitData() {
      try {
        await this.$refs.form.validate();
      } catch(err) {
        return console.error(err);
      }

      let apiRes = await this.T.callAPI('post', '/api/v1/auth/profile/do/modify', {
        body  : {data: this.T.jsonCopy(this.form)},
        alert : {title: this.$t('Modify user info'), showError: true, showSuccess: true},
      });
      if (!apiRes.ok) return;

      await this.loadData();
      this.$store.dispatch('updateUserProfile');
    },
  },
  computed: {
    formRules() {
      return {
        name: [
          {
            trigger : 'change',
            message : this.$t('Please input display name'),
            required: true,
          },
        ],
      }
    }
  },
  props: {
  },
  data() {
    return {
      data: {},
      form: {
        name: null,
      },
    }
  },
}
</script>

<style scoped>

</style>
