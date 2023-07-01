<i18n locale="zh-CN" lang="yaml">
Add Access Key: 添加 Access Key

'Auto generate...': 自动生成...

Please input name: 请输入名称

Access Key created: Access Key 已创建
</i18n>

<template>
  <transition name="fade">
    <el-container direction="vertical" v-show="$store.state.isLoaded">
      <!-- 标题区 -->
      <el-header height="60px">
        <h1>{{ $t('Add Access Key') }}</h1>
      </el-header>

      <!-- 编辑区 -->
      <el-main>
        <el-row :gutter="20">
          <el-col :span="15">
            <div class="setup-form">
              <el-form ref="form" label-width="135px" :model="form" :rules="formRules">
                <el-form-item :label="$t('Name')" prop="name">
                  <el-input
                    maxlength="40"
                    v-model="form.name"></el-input>
                </el-form-item>

                <el-form-item label="ID">
                  <el-input :value="$t('Auto generate...')" :disabled="true"></el-input>
                </el-form-item>

                <el-form-item label="Secret">
                  <el-input :value="$t('Auto generate...')" :disabled="true"></el-input>
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
          <el-button type="primary" @click="submitData">{{ $t('Save') }}</el-button>
        </div>
      </el-footer>
    </el-container>
  </transition>
</template>

<script>
export default {
  name: 'AccessKeySetup',
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
        }
      },
    },
  },
  methods: {
    async loadData() {
      if (this.T.setupPageMode() === 'setup') {
        let apiRes = await this.T.callAPI_getOne('/api/v1/access-keys/do/list', this.$route.params.id);
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
      }
    },
    async addData() {
      let apiRes = await this.T.callAPI('post', '/api/v1/access-keys/do/add', {
        body : { data: this.T.jsonCopy(this.form) },
        alert: { okMessage: this.$t('Access Key created') },
      });
      if (!apiRes || !apiRes.ok) return;

      this.$router.push({
        name : 'access-key-list',
        query: this.T.getPrevQuery(),
      });
    },
  },
  data() {
    return {
      data: {},
      form: {
        name: null,
      },
      formRules: {
        name: [
          {
            trigger : 'change',
            message : this.$t('Please input name'),
            required: true,
          }
        ],
      }
    }
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
</style>
