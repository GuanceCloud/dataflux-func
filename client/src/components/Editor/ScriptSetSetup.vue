<i18n locale="zh-CN" lang="yaml">
This Script Set is locked by someone else, modifying is disabled                             : 当前脚本已被其他人锁定，无法进行修改
This Script Set is locked by you, modifying is disabled to others                            : 当前脚本已被您锁定，其他人无法修改
Script Set ID will be part of the Func ID                                                    : 脚本集ID将作为函数ID的一部分
Title                                                                                        : 标题
Description                                                                                  : 描述
About this Script Set                                                                        : 介绍当前脚本集的作用、功能、目的等
Please input ID                                                                              : 请输入ID
ID can only contains alphabets, numbers and underscore, and cannot starts with a number      : ID只能包含大小写英文、数字或下划线，且不能以数字开头
'ID cannot contains double underscore "__", it is a separator of Script Set ID and Script ID': '脚本集ID不能包含"__"，"__"为脚本集ID与脚本ID的分隔标示'

Add Script Set   : 添加脚本集
Modify Script Set: 修改脚本集
Lock Script Set  : 锁定脚本集
Unlock Script Set: 解锁脚本集
Delete Script Set: 删除脚本集
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
              <el-form ref="form" :model="form" label-width="100px" :disabled="isLockedByOther" :rules="formRules">
                <el-form-item>
                  <InfoBlock v-if="isLockedByOther" type="error" :title="$t('This Script Set is locked by someone else, modifying is disabled')"></InfoBlock>
                  <InfoBlock v-else-if="data.isLocked" type="success" :title="$t('This Script Set is locked by you, modifying is disabled to others')"></InfoBlock>
                </el-form-item>

                <el-form-item label="ID" prop="id">
                  <el-input :disabled="mode === 'setup'"
                    maxlength="40"
                    show-word-limit
                    v-model="form.id"></el-input>
                  <InfoBlock :title="$t('Script Set ID will be part of the Func ID')"></InfoBlock>
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
                  <InfoBlock :title="$t('About this Script Set')"></InfoBlock>
                </el-form-item>

                <el-form-item>
                  <el-button v-if="mode === 'setup'" @click="deleteData">{{ $t('Delete') }}</el-button>
                  <div class="setup-right">
                    <el-button v-if="mode === 'setup'" @click="lockData(!data.isLocked)">{{ data.isLocked ? $t('Unlock') : $t('Lock') }}</el-button>
                    <el-button type="primary" @click="submitData">{{ modeName }}</el-button>
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
        let apiRes = await this.T.callAPI_getOne('/api/v1/script-sets/do/list', this.scriptSetId, {
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
      let apiRes = await this.T.callAPI('post', '/api/v1/script-sets/do/add', {
        body : {data: this.T.jsonCopy(this.form)},
        alert: {title: this.$t('Add Script Set'), showError: true, showSuccess: true},
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
        params: {id: this.scriptSetId},
        body  : {data: _formData},
        alert : {title: this.$t('Modify Script Set'), showError: true, showSuccess: true},
      });
      if (!apiRes.ok) return;

      // await this.loadData();
      this.$store.commit('updateScriptListSyncTime');

      return this.scriptSetId;
    },
    async lockData(isLocked) {
      let alertTitle = isLocked
                     ? this.$t('Lock Script Set')
                     : this.$t('Unlock Script Set');
      let apiRes = await this.T.callAPI('post', '/api/v1/script-sets/:id/do/modify', {
        params: {id: this.scriptSetId},
        body  : {data: { isLocked: isLocked }},
        alert : {title: alertTitle, showError: true, showSuccess: true},
      });
      if (!apiRes.ok) return;

      await this.loadData();
      this.$store.commit('updateScriptListSyncTime');
    },
    async deleteData() {
      try {
        await this.$confirm(`删除脚本集可能导致已经引用当前脚本集的脚本无法正常执行
          <br>此外，与此脚本集关联的脚本、函数、授权链接、自动触发配置、批处理及其他历史数据也会同时删除
          <hr class="br">是否确认删除？`, '删除脚本集', {
          dangerouslyUseHTMLString: true,
          confirmButtonText: this.$t('Delete'),
          cancelButtonText: this.$t('Cancel'),
          type: 'warning',
        });

      } catch(err) {
        return; // 取消操作
      }

      let apiRes = await this.T.callAPI('/api/v1/script-sets/:id/do/delete', {
        params: {id: this.scriptSetId},
        alert : {title: this.$t('Delete Script Set'), showError: true},
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
            message: this.$t('ID can only contains alphabets, numbers and underscore, and cannot starts with a number'),
            pattern: /^[a-zA-Z_][a-zA-Z0-9_]*$/g,
          },
          {
            trigger: 'change',
            validator: (rule, value, callback) => {
              if (value.indexOf('__') >= 0) {
                return callback(new Error(this.$t('ID cannot contains double underscore "__", it is a separator of Script Set ID and Script ID')));
              }
              return callback();
            },
          },
        ],
      }
    },
    mode() {
      return this.$route.name.split('-').pop();
    },
    modeName() {
      const _map = {
        setup: this.$t('Modify'),
        add  : this.$t('Add'),
      };
      return _map[this.mode];
    },
    pageTitle() {
      const _map = {
        setup: this.$t('Modify Script Set'),
        add  : this.$t('Add Script Set'),
      };
      return _map[this.mode];
    },
    scriptSetId() {
      switch(this.mode) {
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
