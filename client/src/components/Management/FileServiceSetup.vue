<i18n locale="en" lang="yaml">
randomIDString: fsvc-{Random ID}
</i18n>

<i18n locale="zh-CN" lang="yaml">
randomIDString: fsvc-{随机 ID}

Add File Service  : 添加文件服务
Setup File Service: 配置文件服务

Customize ID: 定制 ID
Root        : 根目录
Note        : 备注

URL Preview: URL预览
ID is used in the access URL: 此 ID 用于生成访问时的 URL

'ID must starts with "{prefix}"': 'ID 必须以"{prefix}"开头'
'Only numbers, alphabets, dot(.), underscore(_) and hyphen(-) are allowed': 只能输入数字、英文、点（.）、下划线（_）以及连字符（-）
Please select root: 请选择根目录

File Service created: 文件服务已创建
File Service saved  : 文件服务已保存
File Service deleted: 文件服务已删除

Are you sure you want to delete the File Service?: 是否确认删除此文件服务？
</i18n>

<template>
  <transition name="fade">
    <el-container direction="vertical" v-show="$store.state.isLoaded">
      <!-- 标题区 -->
      <el-header height="60px">
        <h1>{{ pageTitle }} <code class="text-main">{{ data.root }}</code></h1>
      </el-header>

      <!-- 编辑区 -->
      <el-main>
        <el-row :gutter="20">
          <el-col :span="15">
            <div class="common-form">
              <el-form ref="form" label-width="135px" :model="form" :rules="formRules">
                <el-form-item :label="$t('Customize ID')" prop="useCustomId" v-if="T.setupPageMode() === 'add'">
                  <el-switch v-model="useCustomId"></el-switch>
                  <span class="text-main float-right">
                    {{ $t('URL Preview') }}{{ $t(':') }}
                    <code>{{ `/api/v1/fs/${useCustomId ? form.id : $t('randomIDString')}` }}</code>
                  </span>
                </el-form-item>

                <el-form-item label="ID" prop="id" v-show="useCustomId" v-if="T.setupPageMode() === 'add'">
                  <el-input
                    maxlength="50"
                    v-model="form.id">
                  </el-input>
                  <InfoBlock :title="$t('ID is used in the access URL')" />
                </el-form-item>

                <el-form-item :label="$t('Root')" prop="root">
                  <el-cascader class="root-cascader-input" ref="rootCascader"
                    placeholder="--"
                    separator=""
                    v-model="form.root"
                    :props="rootCascaderProps"></el-cascader>
                </el-form-item>

                <el-form-item :label="$t('Note')">
                  <el-input :placeholder="$t('Optional')"
                    type="textarea"
                    resize="none"
                    :autosize="{minRows: 2}"
                    maxlength="200"
                    v-model="form.note"></el-input>
                </el-form-item>

                <el-form-item>
                  <el-button v-if="T.setupPageMode() === 'setup'" @click="deleteData">{{ $t('Delete') }}</el-button>
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
  name: 'FileServiceSetup',
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
    useCustomId(val) {
      if (val) {
        this.form.id = `${this.ID_PREFIX}foobar`;
      } else {
        this.form.id = null;
      }
    },
  },
  methods: {
    async loadData() {
      if (this.T.setupPageMode() === 'setup') {
        let apiRes = await this.T.callAPI_getOne('/api/v1/file-services/do/list', this.$route.params.id);
        if (!apiRes || !apiRes.ok) return;

        this.data = apiRes.data;

        let nextForm = {};
        Object.keys(this.form).forEach(f => nextForm[f] = this.data[f]);
        this.form = nextForm;
      }

      this.$store.commit('updateLoadStatus', true);

      setImmediate(() => {
        this.$refs.rootCascader.presentText = this.data.root;
      });
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
      let apiRes = await this.T.callAPI('post', '/api/v1/file-services/do/add', {
        body : { data: this.T.jsonCopy(this.form) },
        alert: { okMessage: this.$t('File Service created') },
      });
      if (!apiRes || !apiRes.ok) return;

      this.$store.commit('updateTableList_scrollY');
      this.$store.commit('updateHighlightedTableDataId', apiRes.data.id);

      this.$router.push({
        name : 'file-service-list',
        query: this.T.getPrevQuery(),
      });
    },
    async modifyData() {
      let _formData = this.T.jsonCopy(this.form);
      delete _formData.id;

      let apiRes = await this.T.callAPI('post', '/api/v1/file-services/:id/do/modify', {
        params: { id: this.$route.params.id },
        body  : { data: _formData },
        alert : { okMessage: this.$t('File Service saved') },
      });
      if (!apiRes || !apiRes.ok) return;

      this.$store.commit('updateHighlightedTableDataId', apiRes.data.id);

      this.$router.push({
        name : 'file-service-list',
        query: this.T.getPrevQuery(),
      });
    },
    async deleteData() {
      if (!await this.T.confirm(this.$t('Are you sure you want to delete the File Service?'))) return;

      let apiRes = await this.T.callAPI('/api/v1/file-services/:id/do/delete', {
        params: { id: this.$route.params.id },
        alert : { okMessage: this.$t('File Service deleted') },
      });
      if (!apiRes || !apiRes.ok) return;

      this.$router.push({
        name : 'file-service-list',
        query: this.T.getPrevQuery(),
      });
    },
  },
  computed: {
    ID_PREFIX() {
      return 'fsvc-';
    },
    pageTitle() {
      const _map = {
        setup: this.$t('Setup File Service'),
        add  : this.$t('Add File Service'),
      };
      return _map[this.T.setupPageMode()];
    },
  },
  props: {
  },
  data() {
    return {
      data: {},

      useCustomId: false,

      form: {
        id  : null,
        root: null,
        note: null,
      },
      formRules: {
        id: [
          {
            trigger: 'change',
            validator: (rule, value, callback) => {
              if (this.T.notNothing(value)) {
                if ((value.indexOf(this.ID_PREFIX) !== 0 || value === this.ID_PREFIX)) {
                  return callback(new Error(this.$t('ID must starts with "{prefix}"', { prefix: this.ID_PREFIX })));
                }
                if (!value.match(/^[0-9a-zA-Z\.\-\_]+$/g)) {
                  return callback(new Error(this.$t('Only numbers, alphabets, dot(.), underscore(_) and hyphen(-) are allowed')));
                }
              }
              return callback();
            },
          }
        ],
        root: [
          {
            trigger : 'change',
            message : this.$t('Please select root'),
            required: true,
          },
        ],
      },

      rootCascaderProps: {
        expandTrigger: 'hover',
        emitPath     : false,
        multiple     : false,
        checkStrictly: true,
        lazy         : true,
        lazyLoad: async (node, resolve) => {
          let apiRes = await this.T.callAPI_get('/api/v1/resources/dir', {
            query: { folder: node.value, type: 'folder' },
          });
          if (!apiRes || !apiRes.ok) return;

          let baseFolder = node.value || '';
          if (baseFolder && !this.T.endsWith(baseFolder, '/')) {
            baseFolder += '/';
          }

          let nodes = apiRes.data.map(d => ({
            label: `${d.name}/`,
            value: `${baseFolder}${d.name}/`,
          }));

          resolve(nodes);
        }
      },
    }
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.root-cascader-input {
  width: 500px;
}
</style>
