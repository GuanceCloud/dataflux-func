<i18n locale="zh-CN" lang="yaml">
Add Blueprint  : 添加蓝图
Setup Blueprint: 配置蓝图

Blueprint ID will be used as Script Set ID after deployment: 蓝图 ID 在部署后将作为脚本集 ID

Please input title: 请输入标题

Blueprint created: 蓝图已创建
Blueprint saved  : 蓝图已保存
Blueprint deleted: 蓝图已删除

Are you sure you want to delete the Blueprint?: 是否确认删除此蓝图？
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
                  <InfoBlock :title="$t('Blueprint ID will be used as Script Set ID after deployment')" />
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
  name: 'BlueprintSetup',
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
        let apiRes = await this.T.callAPI_getOne('/api/v1/blueprints/do/list', this.$route.params.id);
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
      let apiRes = await this.T.callAPI('post', '/api/v1/blueprints/do/add', {
        body : { data: this.T.jsonCopy(this.form) },
        alert: { okMessage: this.$t('Blueprint created') },
      });
      if (!apiRes || !apiRes.ok) return;

      this.$store.commit('updateTableList_scrollY');
      this.$store.commit('updateHighlightedTableDataId', apiRes.data.id);

      this.$router.push({
        name : 'blueprint-list',
        query: this.T.getPrevQuery(),
      });
    },
    async modifyData() {
      let _formData = this.T.jsonCopy(this.form);
      delete _formData.id;

      let apiRes = await this.T.callAPI('post', '/api/v1/blueprints/:id/do/modify', {
        params: { id: this.$route.params.id },
        body  : { data: _formData },
        alert : { okMessage: this.$t('Blueprint saved') },
      });
      if (!apiRes || !apiRes.ok) return;

      this.$store.commit('updateHighlightedTableDataId', apiRes.data.id);

      this.$router.push({
        name : 'blueprint-list',
        query: this.T.getPrevQuery(),
      });
    },
    async deleteData() {
      if (!await this.T.confirm(this.$t('Are you sure you want to delete the Blueprint?'))) return;

      let apiRes = await this.T.callAPI('/api/v1/blueprints/:id/do/delete', {
        params: { id: this.$route.params.id },
        alert : { okMessage: this.$t('Blueprint deleted') },
      });
      if (!apiRes || !apiRes.ok) return;

      this.$router.push({
        name : 'blueprint-list',
        query: this.T.getPrevQuery(),
      });
    },
  },
  computed: {
    pageTitle() {
      const _map = {
        setup: this.$t('Setup Blueprint'),
        add  : this.$t('Add Blueprint'),
      };
      return _map[this.T.setupPageMode()];
    },
  },
  data() {
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
          {
            trigger: 'change',
            validator: (rule, value, callback) => {
              if (value.indexOf('__') >= 0) {
                let _message = this.$t('ID cannot contains double underscore "__"');
                return callback(new Error(_message));
              }
              return callback();
            },
          },
        ],
      }
    }
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
</style>
