<i18n locale="zh-CN" lang="yaml">
Add Script Market  : 添加脚本市场
Setup Script Market: 配置脚本市场

Branch      : 分支
Region      : 地域
Homepage URL: 主页 URL

Password here is always required when the Script Market requires password : 如脚本市场需要密码，则每次修改都必须重新输入密码
AK Secret here is always required when the Script Market requires password: 如脚本市场需要 AK Secret，则每次修改都必须重新输入 AK Secret

Please input Script Market type        : 请输入脚本市场类型
Please input URL                       : 请输入 URL
Please input Branch                    : 请输入分支
Please input user                      : 请输入用户名
Please input password                  : 请输入密码
Please input endpoint                  : 请输入访问地址
Please input bucket                    : 请输入 Bucket
Please input folder                    : 请输入文件夹
Please input AK Id                     : 请输入 AK ID
Please input AK Secret                 : 请输入 AK Secret
'Should start with http:// or https://': '必须以 http:// 或 https://开头'
Manage this Script Market              : 管理此脚本市场

Script Market added  : 脚本市场已添加
Script Market saved  : 脚本市场已保存
Script Market removed: 脚本市场已删除

Are you sure you want to delete the Script Market?: 是否确认删除此脚本市场？
</i18n>

<template>
  <transition name="fade">
    <el-container direction="vertical" v-show="$store.state.isLoaded">
      <!-- 标题区 -->
      <el-header height="60px">
        <h1>{{ pageTitle }} <code class="text-main" v-if="data.name">{{ data.name || C.API_AUTH_MAP.get(selectedType).name }}</code></h1>
      </el-header>

      <!-- 编辑区 -->
      <el-main>
        <el-row :gutter="20">
          <el-col :span="15">
            <div class="common-form">
              <el-form ref="form" label-width="135px" :model="form" :rules="formRules">
                <!-- Fake user/password -->
                <el-form-item style="height: 0; overflow: hidden">
                  <input tabindex="-1" type="text" name="username" />
                  <input tabindex="-1" type="password" name="password" />
                </el-form-item>

                <el-form-item :label="$t('Type')" prop="type" v-if="T.setupPageMode() === 'add'">
                  <el-select v-model="form.type" @change="switchType">
                    <el-option v-for="opt in C.SCRIPT_MARKET" :label="opt.name" :key="opt.key" :value="opt.key"></el-option>
                  </el-select>
                </el-form-item>
                <el-form-item :label="$t('Type')" v-else>
                  <el-select v-model="selectedType" :disabled="true">
                    <el-option :label="C.SCRIPT_MARKET_MAP.get(selectedType).name" :value="selectedType"></el-option>
                  </el-select>
                </el-form-item>

                <template v-if="selectedType">
                  <el-form-item v-if="C.SCRIPT_MARKET_MAP.get(selectedType).logo">
                    <el-image class="script-market-logo" :class="common.getScriptMarketClass(form)" :src="common.getScriptMarketLogo(form)"></el-image>
                  </el-form-item>

                  <el-form-item>
                    <InfoBlock type="warning" :title="C.SCRIPT_MARKET_MAP.get(selectedType).tip" />
                  </el-form-item>

                  <el-form-item :label="$t('Name')">
                    <el-input :placeholder="$t('Optional')"
                      maxlength="25"
                      v-model="form.name"></el-input>
                  </el-form-item>

                  <el-form-item :label="$t('Description')">
                    <el-input :placeholder="$t('Optional')"
                      type="textarea"
                      resize="none"
                      :autosize="{minRows: 2}"
                      maxlength="5000"
                      v-model="form.description"></el-input>
                  </el-form-item>

                  <!-- 可变区域 -->
                  <el-form-item label="URL" v-if="hasConfigField(selectedType, 'url')" prop="configJSON.url">
                    <el-input
                      type="textarea"
                      resize="none"
                      :autosize="{minRows: 2}"
                      maxlength="5000"
                      v-model="form.configJSON.url"></el-input>
                  </el-form-item>

                  <el-form-item :label="$t('Branch')" v-if="hasConfigField(selectedType, 'branch')" prop="configJSON.branch">
                    <el-input :placeholder="$t('Default')"
                      v-model="form.configJSON.branch"></el-input>
                  </el-form-item>

                  <el-form-item :label="$t('User')" v-if="hasConfigField(selectedType, 'user')" prop="configJSON.user">
                    <el-input
                      v-model="form.configJSON.user"></el-input>
                  </el-form-item>

                  <el-form-item :label="$t('Password')" v-if="hasConfigField(selectedType, 'password')" prop="configJSON.password">
                    <el-input
                      v-model="form.configJSON.password" show-password></el-input>
                    <InfoBlock v-if="T.setupPageMode() === 'setup'" type="info" :title="$t('Password here is always required when the Script Market requires password')" />
                  </el-form-item>

                  <el-form-item :label="$t('Endpoint')" v-if="hasConfigField(selectedType, 'endpoint')" prop="configJSON.endpoint">
                    <el-input
                      v-model="form.configJSON.endpoint"></el-input>
                  </el-form-item>

                  <el-form-item label="Bucket" v-if="hasConfigField(selectedType, 'bucket')" prop="configJSON.bucket">
                    <el-input
                      v-model="form.configJSON.bucket"></el-input>
                  </el-form-item>

                  <el-form-item :label="$t('Folder')" v-if="hasConfigField(selectedType, 'folder')" prop="configJSON.folder">
                    <el-input
                      v-model="form.configJSON.folder"></el-input>
                  </el-form-item>

                  <el-form-item label="AK ID" v-if="hasConfigField(selectedType, 'accessKeyId')" prop="configJSON.accessKeyId">
                    <el-input
                      v-model="form.configJSON.accessKeyId"></el-input>
                  </el-form-item>

                  <el-form-item label="AK Secret" v-if="hasConfigField(selectedType, 'accessKeySecret')" prop="configJSON.accessKeySecret">
                    <el-input
                      v-model="form.configJSON.accessKeySecret" show-password></el-input>
                    <InfoBlock v-if="T.setupPageMode() === 'setup'" type="info" :title="$t('AK Secret here is always required when the Script Market requires password')" />
                  </el-form-item>

                  <el-form-item v-if="T.setupPageMode() === 'add' && !C.SCRIPT_MARKET_MAP.get(selectedType).isReadonly">
                    <el-switch
                      v-model="setAdmin"
                      :active-text="$t('Manage this Script Market')">
                    </el-switch>
                  </el-form-item>

                  <el-form-item v-if="T.setupPageMode() === 'setup' && data.isAdmin">
                    <div class="manage-this-script-market-tip">
                      <i class="fa fa-fw fa-check text-main fa-2x"></i>
                      <span>{{ $t('Manage this Script Market') }}</span>
                    </div>
                  </el-form-item>

                  <template v-if="setAdmin || data.isAdmin">
                    <el-form-item :label="$t('Homepage URL')" prop="configJSON.homepageURL">
                      <el-input
                        v-model="form.configJSON.homepageURL"></el-input>
                    </el-form-item>
                  </template>
                  <!-- 可变部分结束 -->
                </template>

                <el-form-item>
                  <el-button v-if="T.setupPageMode() === 'setup'" @click="deleteData">{{ $t('Delete') }}</el-button>

                  <div class="setup-right">
                    <el-button type="primary" @click="submitData"
                      :disabled="isSaving">
                      <i class="fa fa-fw fa-circle-o-notch fa-spin" v-if="isSaving"></i>
                      {{ $t('Save') }}
                    </el-button>
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
  name: 'ScriptMarketSetup',
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
            this.form.configJSON = {};
            this.data = {};
            break;

          case 'setup':
            break;
        }
      },
    },
  },
  methods: {
    updateValidator(type) {
      if (this.$refs.form) {
        this.$refs.form.clearValidate();
      }

      let fieldMap = this.C.SCRIPT_MARKET_MAP.get(type).configFields;
      if (!fieldMap) return;

      for (let f in fieldMap) if (fieldMap.hasOwnProperty(f)) {
        let opt = fieldMap[f];
        if (!opt) continue;

        let rule = this.formRules[`configJSON.${f}`];
        if (rule) {

          if (type === 'git' && [ 'user', 'password' ].indexOf(f) >= 0) {
            // git 库的 user, password 需要特殊处理
            rule[0].required = this.isUserPasswordRequired;
          } else {
            rule[0].required = !!opt.isRequired;
          }
        }
      }
    },
    fillDefault(type) {
      let fieldMap = this.C.SCRIPT_MARKET_MAP.get(type).configFields;
      if (!fieldMap) return;

      let nextConfigJSON = {};
      for (let f in fieldMap) if (fieldMap.hasOwnProperty(f)) {
        let opt = fieldMap[f];
        if (!opt) continue;

        if (this.T.notNothing(opt.default)) {
          nextConfigJSON[f] = opt.default;
        }
      }

      this.form.configJSON = nextConfigJSON;
    },
    switchType(type) {
      this.setAdmin = false;
      this.fillDefault(type);
      this.updateValidator(type);
    },
    async loadData() {
      if (this.T.setupPageMode() === 'setup') {
        let apiRes = await this.T.callAPI_getOne('/api/v1/script-markets/do/list', this.$route.params.id);
        if (!apiRes || !apiRes.ok) return;

        this.data = apiRes.data;

        let nextForm = {};
        Object.keys(this.form).forEach(f => nextForm[f] = this.data[f]);
        this.form = nextForm;

        this.updateValidator(this.data.type);
      }

      this.$store.commit('updateLoadStatus', true);
    },
    async submitData() {
      try {
        await this.$refs.form.validate();
      } catch(err) {
        return console.error(err);
      }

      this.isSaving = true;

      switch(this.T.setupPageMode()) {
        case 'add':
          await this.addData();
          break;

        case 'setup':
          await this.modifyData();
          break;

      }

      setTimeout(() => {
        this.isSaving = false;
      }, 500);
    },
    _getFromData() {
      let _formData = this.T.jsonCopy(this.form);
      if (_formData.configJSON) {
        for (let k in _formData.configJSON) {
          if (this.T.isNothing(_formData.configJSON[k])) {
            _formData.configJSON[k] = null;
          }
        }
      }
      return _formData;
    },
    async addData() {
      if (this.form.type === 'git'
        && this.form.configJSON.user
        && this.form.configJSON.password
        && !this.$root.checkUserProfileForGit()) return;

      let _formData = this._getFromData();

      let apiRes = await this.T.callAPI('post', '/api/v1/script-markets/do/add', {
        body : { data: _formData, setAdmin: this.setAdmin },
        alert: { okMessage: this.$t('Script Market added') },
      });
      if (!apiRes || !apiRes.ok) return;

      this.$store.commit('updateTableList_scrollY');
      this.$store.commit('updateHighlightedTableDataId', apiRes.data.id);

      this.$router.push({
        name : 'script-market-list',
        query: this.T.getPrevQuery(),
      });
    },
    async modifyData() {
      let _formData = this._getFromData();

      delete _formData.id;
      delete _formData.type;

      let apiRes = await this.T.callAPI('post', '/api/v1/script-markets/:id/do/modify', {
        params: { id: this.$route.params.id },
        body  : { data: _formData },
        alert : { okMessage: this.$t('Script Market saved') },
      });
      if (!apiRes || !apiRes.ok) return;

      this.$store.commit('updateHighlightedTableDataId', apiRes.data.id);

      this.$router.push({
        name : 'script-market-list',
        query: this.T.getPrevQuery(),
      });
    },
    async deleteData() {
      if (this.data.type === 'git'
        && this.data.isAdmin
        && !this.$root.checkUserProfileForGit()) return;

      if (!await this.T.confirm(this.$t('Are you sure you want to delete the Script Market?'))) return;

      let apiRes = await this.T.callAPI('/api/v1/script-markets/:id/do/delete', {
        params: { id: this.$route.params.id },
        alert : { okMessage: this.$t('Script Market removed') },
      });
      if (!apiRes || !apiRes.ok) return;

      this.$router.push({
        name : 'script-market-list',
        query: this.T.getPrevQuery(),
      });
    },
    hasConfigField(type, field) {
      if (!this.C.SCRIPT_MARKET_MAP.get(type) || !this.C.SCRIPT_MARKET_MAP.get(type).configFields) {
        return false;
      }
      return (field in this.C.SCRIPT_MARKET_MAP.get(type).configFields);
    },
  },
  computed: {
    isUserPasswordRequired() {
      let configJSON = this.T.setupPageMode() === 'setup'
                    ? this.data.configJSON
                    : this.form.configJSON;
      configJSON = configJSON || {};
      return !!(configJSON.user || configJSON.password) || this.setAdmin;
    },
    formRules() {
      return {
        type: [
          {
            trigger : 'change',
            message : this.$t('Please input Script Market type'),
            required: true,
          },
        ],
        'configJSON.url': [
          {
            trigger : 'change',
            message : this.$t('Please input URL'),
            required: false,
          },
          {
            trigger: 'change',
            message: this.$t('Should start with http:// or https://'),
            pattern: this.C.RE_PATTERN.httpURL,
          },
        ],
        'configJSON.branch': [
          {
            trigger : 'change',
            message : this.$t('Please input Branch'),
            required: false,
          },
        ],
        'configJSON.user': [
          {
            trigger : 'change',
            message : this.$t('Please input user'),
            required: this.isUserPasswordRequired,
          },
        ],
        'configJSON.password': [
          {
            trigger : 'change',
            message : this.$t('Please input password'),
            required: this.isUserPasswordRequired,
          },
        ],
        'configJSON.endpoint': [
          {
            trigger : 'change',
            message : this.$t('Please input endpoint'),
            required: true,
          },
          {
            trigger: 'change',
            message: this.$t('Should start with http:// or https://'),
            pattern: this.C.RE_PATTERN.httpURL,
          },
        ],
        'configJSON.bucket': [
          {
            trigger : 'change',
            message : this.$t('Please input bucket'),
            required: true,
          },
        ],
        'configJSON.folder': [
          {
            trigger : 'change',
            message : this.$t('Please input folder'),
            required: true,
          },
        ],
        'configJSON.accessKeyId': [
          {
            trigger : 'change',
            message : this.$t('Please input AK Id'),
            required: true,
          },
        ],
        'configJSON.accessKeySecret': [
          {
            trigger : 'change',
            message : this.$t('Please input AK Secret'),
            required: true,
          },
        ],
        'configJSON.homepageURL': [
          {
            trigger: 'change',
            message: this.$t('Should start with http:// or https://'),
            pattern: this.C.RE_PATTERN.httpURL,
          },
        ],
      }
    },
    pageTitle() {
      const _map = {
        setup: this.$t('Setup Script Market'),
        add  : this.$t('Add Script Market'),
      };
      return _map[this.T.setupPageMode()];
    },
    selectedType() {
      switch(this.T.setupPageMode()) {
        case 'add':
          return this.form.type;

        case 'setup':
          return this.data.type;
      }
    },
  },
  props: {
  },
  data() {
    return {
      data: {},

      setAdmin: false,

      form: {
        name       : null,
        type       : null,
        description: null,
        configJSON : {},
      },

      isSaving: false,
    }
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.manage-this-script-market-tip {
  display: flex;
  align-items: center;
}
.manage-this-script-market-tip > * {
  margin-right: 10px;
}
</style>
<style>
.script-market-logo img {
  width: auto;
}
.script-market-logo.logo-git {
  height: 60px !important;
}
.script-market-logo.logo-github-com {
  height: 70px !important;
}
.script-market-logo.logo-gitlab-com {
  height: 80px !important;
}
.script-market-logo.logo-gitee-com {
  height: 60px !important;
}
.script-market-logo.logo-bitbucket-org {
  height: 50px !important;
}
.script-market-logo.logo-aliyunOSS {
  height: 80px !important;
}
.script-market-logo.logo-httpService {
  height: 70px !important;
}
</style>