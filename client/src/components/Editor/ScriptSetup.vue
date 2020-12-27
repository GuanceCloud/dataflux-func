<template>
  <transition name="fade">
    <el-container direction="vertical" v-if="$store.state.isLoaded">
      <!-- 标题区 -->
      <el-header height="60px">
        <h1>
          {{ modeName }}脚本
          <code class="text-main">{{ data.title || data.id }}</code>
        </h1>
      </el-header>

      <!-- 编辑区 -->
      <el-main>
        <el-row :gutter="20">
          <el-col :span="15">
            <div class="common-form">
              <el-form ref="form" :model="form" label-width="100px" :disabled="isLockedByOther" :rules="formRules">
                <el-form-item>
                  <InfoBlock v-if="isLockedByOther" type="error" title="当前脚本已被其他人锁定，无法进行修改"></InfoBlock>
                  <InfoBlock v-else-if="data.isLocked" type="success" title="当前脚本已被您锁定，其他人无法修改"></InfoBlock>
                </el-form-item>

                <el-form-item label="ID" prop="id">
                  <el-input :disabled="mode === 'setup'"
                    maxlength="80"
                    show-word-limit
                    v-model="form.id">
                  </el-input>
                  <InfoBlock title="脚本ID关系到实际函数调用时所使用的名称"></InfoBlock>
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
                  <InfoBlock title="介绍当前脚本的作用、功能、目的等"></InfoBlock>
                </el-form-item>

                <el-form-item>
                  <el-button v-if="mode === 'setup'" @click="deleteData">删除</el-button>
                  <div class="setup-right">
                    <el-button v-if="mode === 'setup'" @click="lockData(!data.isLocked)">{{ data.isLocked ? '解锁' : '锁定' }}</el-button>
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
  name: 'ScriptSetup',
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

            // 【特殊处理】脚本ID格式为"<脚本集ID>__<脚本名>"
            this.form.id = `${this.scriptSetId}__`;
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
        let apiRes = await this.T.callAPI_getOne('/api/v1/scripts/do/list', this.scriptId, {
          alert: {entity: '脚本', showError: true},
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

      let dataId = null;
      switch(this.mode) {
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
      let opt = {
        body : {data: this.T.jsonCopy(this.form)},
        alert: {entity: '脚本', action: '添加', showError: true},
      }

      let apiRes = await this.T.callAPI('post', '/api/v1/scripts/do/add', opt);
      if (!apiRes.ok) return;

      this.$store.commit('updateScriptListSyncTime');

      this.$router.push({
        name  : 'code-editor',
        params: {id: apiRes.data.id},
      });

      return apiRes.data.id;
    },
    async modifyData() {
      let _formData = this.T.jsonCopy(this.form);
      delete _formData.id;

      let apiRes = await this.T.callAPI('post', '/api/v1/scripts/:id/do/modify', {
        params: {id: this.scriptId},
        body  : {data: _formData},
        alert : {entity: '脚本', action: '修改', showError: true, showSuccess: true},
      });
      if (!apiRes.ok) return;

      await this.loadData();
      this.$store.commit('updateScriptListSyncTime');

      return this.scriptId;
    },
    async lockData(isLocked) {
      let actionTitle = isLocked ? '锁定' : '解锁';
      let apiRes = await this.T.callAPI('post', '/api/v1/scripts/:id/do/modify', {
        params: {id: this.scriptId},
        body  : {data: { isLocked: isLocked }},
        alert : {entity: '脚本', action: actionTitle, showError: true, showSuccess: true},
      });
      if (!apiRes.ok) return;

      await this.loadData();
      this.$store.commit('updateScriptListSyncTime');
    },
    async deleteData() {
      try {
        await this.$confirm(`删除脚本可能导致已经引用当前脚本的脚本无法正常执行
          <br>此外，与此脚本关联的函数、授权链接、自动触发配置、批处理及其他历史数据也会同时删除
          <hr class="br">是否确认删除？`, '删除脚本', {
          dangerouslyUseHTMLString: true,
          confirmButtonText: '确认删除',
          cancelButtonText: '取消',
          type: 'warning',
        });

      } catch(err) {
        return; // 取消操作
      }

      let apiRes = await this.T.callAPI('/api/v1/scripts/:id/do/delete', {
        params: {id: this.scriptId},
        alert : {entity: '脚本', action: '删除', showError: true},
      });
      if (!apiRes.ok) return;

      this.$router.push({
        name: 'intro',
      });
      this.$store.commit('updateScriptListSyncTime');
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
    scriptSetId() {
      switch(this.mode) {
        case 'add':
          return this.$route.params.id;
        case 'setup':
          return this.data.scriptSetId;
      }
    },
    scriptId() {
      switch(this.mode) {
        case 'add':
          return this.form.id;
        case 'setup':
          return this.$route.params.id;
      }
    },
    isLockedByOther() {
      return this.data.lockedByUserId && this.data.lockedByUserId !== this.$store.getters.userId
          || this.data.sset_lockedByUserId && this.data.sset_lockedByUserId !== this.$store.getters.userId;
    },
  },
  props: {
  },
  data() {
    let vmc = this;

    return {
      data: {},
      form: {
        id         : null,
        title      : null,
        description: null,
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
          {
            trigger: 'change',
            validator: (rule, value, callback) => {
              let prefix = `${vmc.scriptSetId}__`;
              if (value.indexOf(prefix) < 0 || value === prefix) {
                return callback(new Error(`脚本集 ${vmc.scriptSetId} 下的脚本ID必须为 "${prefix}" 开头`));
              }
              return callback();
            },
          },
        ],
      },
    }
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
</style>
