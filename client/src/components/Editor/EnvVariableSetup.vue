<i18n locale="zh-CN" lang="yaml">
Add ENV   : 添加环境变量
Modify ENV: 修改环境变量
Delete ENV: 删除环境变量
</i18n>

<template>
  <transition name="fade">
    <el-container direction="vertical" v-if="$store.state.isLoaded">
      <!-- 标题区 -->
      <el-header height="60px">
        <h1>
          {{ modeName }}环境变量
          <code class="text-main">{{ data.title || data.id }}</code>
        </h1>
      </el-header>

      <!-- 编辑区 -->
      <el-main>
        <el-row :gutter="20">
          <el-col :span="15">
            <div class="common-form">
              <el-form ref="form" :model="form" :rules="formRules" label-width="100px">
                <el-form-item label="ID" prop="id">
                  <el-input :disabled="mode === 'setup'"
                    maxlength="40"
                    show-word-limit
                    v-model="form.id"></el-input>
                  <InfoBlock title="环境变量ID关系到实际函数调用时所使用的名称"></InfoBlock>
                </el-form-item>

                <el-form-item label="标题">
                  <el-input
                    maxlength="25"
                    show-word-limit
                    v-model="form.title"></el-input>
                </el-form-item>
                <el-form-item label="描述">
                  <el-input
                    type="textarea"
                    resize="none"
                    :autosize="{minRows: 2}"
                    maxlength="200"
                    show-word-limit
                    v-model="form.description"></el-input>
                  <InfoBlock title="介绍当前环境变量的作用、功能、目的等"></InfoBlock>
                </el-form-item>

                <el-form-item label="值" prop="valueTEXT">
                  <el-input
                    type="textarea"
                    resize="none"
                    :autosize="{minRows: 2}"
                    maxlength="1000"
                    show-word-limit
                    v-model="form.valueTEXT"></el-input>
                </el-form-item>

                <el-form-item label="自动转换类型">
                  <el-select v-model="form.autoTypeCasting">
                    <el-option v-for="opt in C.ENV_VARIABLE" :label="opt.name" :key="opt.key" :value="opt.key"></el-option>
                  </el-select>
                  <InfoBlock v-if="C.ENV_VARIABLE_MAP[form.autoTypeCasting]"
                    :title="C.ENV_VARIABLE_MAP[form.autoTypeCasting].tips"></InfoBlock>
                </el-form-item>

                <el-form-item>
                  <el-button v-if="mode === 'setup'" @click="deleteData">删除</el-button>
                  <div class="setup-right">
                    <el-button type="primary" @click="submitData">保存</el-button>
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
  name: 'EnvVariableSetup',
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
      if (this.mode === 'setup') {
        let apiRes = await this.T.callAPI_getOne('/api/v1/env-variables/do/list', this.$route.params.id, {
          alert: {showError: true},
        });
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
        case 'setup':
          return await this.modifyData();
      }
    },
    async addData() {
      let apiRes = await this.T.callAPI('post', '/api/v1/env-variables/do/add', {
        body : {data: this.T.jsonCopy(this.form)},
        alert: {title: this.$t('Add ENV'), showError: true},
      });
      if (!apiRes.ok) return;

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
        params: {id: this.$route.params.id},
        body  : {data: _formData},
        alert : {title: this.$t('Modify ENV'), showError: true, showSuccess: true},
      });
      if (!apiRes.ok) return;

      // await this.loadData();
      this.$store.commit('updateEnvVariableListSyncTime');
    },
    async deleteData() {
      try {
        await this.$confirm('删除环境变量可能导致已经引用当前环境变量的脚本无法正常执行<hr class="br">是否确认删除？', '删除环境变量', {
          dangerouslyUseHTMLString: true,
          confirmButtonText: this.$t('Delete'),
          cancelButtonText: this.$t('Cancel'),
          type: 'warning',
        });

      } catch(err) {
        return; // 取消操作
      }

      let apiRes = await this.T.callAPI('/api/v1/env-variables/:id/do/delete', {
        params: {id: this.$route.params.id},
        alert : {title: this.$t('Delete ENV'), showError: true},
      });
      if (!apiRes.ok) return;

      this.$router.push({
        name: 'intro',
      });
      this.$store.commit('updateEnvVariableListSyncTime');
    },
  },
  computed: {
    mode() {
      return this.$route.name.split('-').pop();
    },
    modeName() {
      const nameMap = {
        setup: '配置',
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
            message : '请输入ID',
            required: true,
          },
          {
            trigger: 'change',
            message: 'ID只能包含大小写英文、数字或下划线，且不能以数字开头',
            pattern: /^[a-zA-Z_][a-zA-Z0-9_]*$/g,
          },
        ],
        valueTEXT: [
          {
            trigger : 'change',
            message : '请输入环境变量值',
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
