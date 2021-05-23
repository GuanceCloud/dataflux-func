<i18n locale="zh-CN" lang="yaml">
Add Access Key   : 添加 AccessKey
Delete Access Key: 删除 AccessKey

Access Key created: AccessKey 已创建
</i18n>

<template>
  <transition name="fade">
    <el-container direction="vertical" v-if="$store.state.isLoaded">
      <!-- 标题区 -->
      <el-header height="60px">
        <h1>
          {{ modeName }} AccessKey
          <code class="text-main">{{ data.name }}</code>
        </h1>
      </el-header>

      <!-- 编辑区 -->
      <el-main>
        <el-row :gutter="20">
          <el-col :span="15">
            <div class="common-form">
              <el-form ref="form" label-width="120px" :model="form" :rules="formRules">
                <el-form-item label="名称" prop="name">
                  <el-input
                    maxlength="40"
                    show-word-limit
                    v-model="form.name"></el-input>
                </el-form-item>

                <el-form-item label="ID">
                  <el-input value="创建后自动生成..." :disabled="true"></el-input>
                </el-form-item>

                <el-form-item label="Secret">
                  <el-input value="创建后自动生成..." :disabled="true"></el-input>
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
  name: 'AccessKeySetup',
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
        }
      },
    },
  },
  methods: {
    async loadData() {
      if (this.mode === 'setup') {
        let apiRes = await this.T.callAPI_getOne('/api/v1/access-keys/do/list', this.$route.params.id);
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

      switch(this.mode) {
        case 'add':
          return await this.addData();
      }
    },
    async addData() {
      let apiRes = await this.T.callAPI('post', '/api/v1/access-keys/do/add', {
        body : { data: this.T.jsonCopy(this.form) },
        alert: { okMessage: this.$t('Access Key created') },
      });
      if (!apiRes.ok) return;

      this.$router.push({
        name: 'access-key-list',
      });
    },
  },
  computed: {
    mode() {
      return this.$route.name.split('-').pop();
    },
    modeName() {
      const nameMap = {
        add: '添加',
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
        name: null,
      },
      formRules: {
        name: [
          {
            trigger : 'change',
            message : '请输入AccessKey 名称',
            required: true,
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
