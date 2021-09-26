<i18n locale="zh-CN" lang="yaml">
Add API Auth  : 添加API认证
Setup API Auth: 配置API认证

Auth Type  : 认证类型
Auth Config: 认证配置
Func       : 认证函数
Note       : 备注

Fixed Fields   : 固定字段
Add Fixed Field: 添加固定字段
Field Name     : 字段名
Field Value    : 字段值
HTTP Auth      : HTTP认证
Add HTTP Auth  : 添加HTTP认证
Username       : 用户名

'Password (leave blank when not changing)': 密码（不修改时请留空）

Please select Func: 请选择认证函数

API Auth created: API认证已创建
API Auth saved  : API认证已保存
API Auth deleted: API认证已删除

Are you sure you want to delete the API Auth?: 是否确认删除此API认证？
</i18n>

<template>
  <transition name="fade">
    <el-container direction="vertical" v-if="$store.state.isLoaded">
      <!-- 标题区 -->
      <el-header height="60px">
        <h1>{{ pageTitle }} <code class="text-main" v-if="data.name">{{ data.name || C.API_AUTH_MAP.get(selectedType).name }}</code></h1>
      </el-header>

      <!-- 编辑区 -->
      <el-main>
        <el-row :gutter="20">
          <el-col :span="15">
            <div class="common-form">
              <el-form ref="form" label-width="120px" :model="form" :rules="formRules">
                <el-form-item :label="$t('Auth Type')" prop="type" v-if="T.pageMode() === 'add'">
                  <el-select v-model="form.type" @change="switchType">
                    <el-option v-for="opt in C.API_AUTH" :label="opt.name" :key="opt.key" :value="opt.key"></el-option>
                  </el-select>
                </el-form-item>
                <el-form-item :label="$t('Auth Type')" v-else>
                  <el-select v-model="selectedType" :disabled="true">
                    <el-option :label="C.API_AUTH_MAP.get(selectedType).name" :value="selectedType"></el-option>
                  </el-select>
                </el-form-item>

                <template v-if="selectedType">
                  <el-form-item v-if="C.API_AUTH_MAP.get(selectedType).tips">
                    <InfoBlock type="info" :title="C.API_AUTH_MAP.get(selectedType).tips"></InfoBlock>
                  </el-form-item>

                  <el-form-item :label="$t('Name')">
                    <el-input :placeholder="$t('Optional')"
                      maxlength="25"
                      show-word-limit
                      v-model="form.name"></el-input>
                  </el-form-item>

                  <!-- 固定字段配置 -->
                  <template v-if="hasConfigField(selectedType, 'fixedFields')">
                    <el-form-item class="config-divider" :label="$t('Fixed Fields')">
                      <el-divider></el-divider>
                    </el-form-item>

                    <template v-for="(fixedField, index) in form.configJSON.fixedFields || []">
                      <el-form-item
                        class="fixed-field-location"
                        :label="`#${index + 1}`"
                        :key="`fieldLocation-${index}`"
                        :prop="`configJSON.fixedFields.${index}.location`"
                        :rules="formRules_fixedFieldLocation">
                        <el-select
                          v-model="fixedField.location">
                          <el-option v-for="location in C.API_AUTH_FIXED_FIELD_LOCATION" :label="location.name" :key="location.key" :value="location.key"></el-option>
                        </el-select>

                        <!-- 删除按钮 -->
                        <el-link type="primary" @click.prevent="removeFixedFieldItem(index)">{{ $t('Delete') }}</el-link>
                      </el-form-item>
                      <el-form-item
                        class="fixed-field"
                        :key="`fieldName-${index}`"
                        :prop="`configJSON.fixedFields.${index}.name`"
                        :rules="formRules_fixedFieldName">
                        <el-input :placeholder="$t('Field Name')" v-model="fixedField.name"></el-input>
                      </el-form-item>
                      <el-form-item
                        class="fixed-field"
                        :key="`fieldValue-${index}`"
                        :prop="`configJSON.fixedFields.${index}.value`"
                        :rules="formRules_fixedFieldValue">
                        <el-input :placeholder="$t('Field Value')" v-model="fixedField.value"></el-input>
                      </el-form-item>
                    </template>
                    <el-form-item>
                      <el-link type="primary" @click="addFixedFieldItem"><i class="fa fa-fw fa-plus"></i> {{ $t('Add Fixed Field') }}</el-link>
                    </el-form-item>
                  </template>

                  <!-- HTTP认证配置 -->
                  <template v-if="hasConfigField(selectedType, 'httpAuth')">
                    <el-form-item class="config-divider" :label="$t('HTTP Auth')">
                      <el-divider></el-divider>
                    </el-form-item>

                    <template v-for="(httpAuth, index) in form.configJSON.httpAuth || []">
                      <el-form-item
                        class="http-auth"
                        :label="`#${index + 1}`"
                        :key="`username-${index}`"
                        :prop="`configJSON.httpAuth.${index}.username`"
                        :rules="formRules_httpAuthUsername">
                        <el-input :placeholder="$t('Username')" v-model="httpAuth.username"></el-input>

                        <!-- 删除按钮 -->
                        <el-link type="primary" @click.prevent="removeHTTPAuthItem(index)">{{ $t('Delete') }}</el-link>
                      </el-form-item>
                      <el-form-item
                        class="http-auth"
                        :key="`password-${index}`"
                        :prop="`configJSON.httpAuth.${index}.password`"
                        :rules="formRules_httpAuthPassword">
                        <el-input :placeholder="$t('Password (leave blank when not changing)')"
                          show-password
                          v-model="httpAuth.password"></el-input>
                      </el-form-item>
                    </template>
                    <el-form-item>
                      <el-link type="primary" @click="addHTTPAuthItem"><i class="fa fa-fw fa-plus"></i> {{ $t('Add HTTP Auth') }}</el-link>
                    </el-form-item>
                  </template>

                  <!-- 函数认证配置 -->
                  <template v-if="hasConfigField(selectedType, 'funcId')">
                    <el-form-item :label="$t('Func')" prop="configJSON.funcId">
                      <el-cascader class="func-cascader-input" ref="funcCascader"
                        placeholder="--"
                        filterable
                        v-model="form.configJSON.funcId"
                        :options="funcCascader"
                        :props="{expandTrigger: 'hover', emitPath: false, multiple: false}"></el-cascader>
                    </el-form-item>
                  </template>

                  <!-- 可变部分结束 -->

                  <el-form-item :label="$t('Note')">
                    <el-input :placeholder="$t('Optional')"
                      type="textarea"
                      resize="none"
                      :autosize="{minRows: 2}"
                      maxlength="200"
                      show-word-limit
                      v-model="form.note"></el-input>
                  </el-form-item>
                </template>

                <el-form-item>
                  <el-button v-if="T.pageMode() === 'setup'" @click="deleteData">{{ $t('Delete') }}</el-button>
                  <div class="setup-right">
                    <el-button type="primary" @click="submitData">{{ $t('Save') }}</el-button>
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
  name: 'APIAuthSetup',
  components: {
  },
  watch: {
    $route: {
      immediate: true,
      async handler(to, from) {
        await this.loadData();

        switch(this.T.pageMode()) {
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

      let fieldMap = this.C.API_AUTH_MAP.get(type).configFields;
      if (!fieldMap) return;

      for (let f in fieldMap) if (fieldMap.hasOwnProperty(f)) {
        let opt = fieldMap[f];
        if (!opt) continue;

        let rule = this.formRules[`configJSON.${f}`];
        if (rule) {
          rule[0].required = !!opt.isRequired;
        }
      }
    },
    fillDefault(type) {
      let fieldMap = this.C.API_AUTH_MAP.get(type).configFields;
      if (!fieldMap) return;

      let nextConfigJSON = {};
      for (let f in fieldMap) if (fieldMap.hasOwnProperty(f)) {
        let opt = fieldMap[f];
        if (!opt) continue;

        if (!this.T.isNothing(opt.default)) {
          nextConfigJSON[f] = opt.default;
        }
      }

      this.form.configJSON = nextConfigJSON;
    },
    switchType(type) {
      this.fillDefault(type);
      this.updateValidator(type);
    },
    async loadData() {
      if (this.T.pageMode() === 'setup') {
        let apiRes = await this.T.callAPI_getOne('/api/v1/api-auth/do/list', this.$route.params.id);
        if (!apiRes.ok) return;

        this.data = apiRes.data;

        let nextForm = {};
        Object.keys(this.form).forEach(f => nextForm[f] = this.data[f]);
        this.form = nextForm;

        this.updateValidator(this.data.type);
      }

      // 获取函数列表
      let funcList = await this.common.getFuncList();

      this.funcMap      = funcList.map;
      this.funcCascader = funcList.cascader;
      this.$store.commit('updateLoadStatus', true);
    },
    async submitData() {
      try {
        await this.$refs.form.validate();
      } catch(err) {
        return console.error(err);
      }

      switch(this.T.pageMode()) {
        case 'add':
          return await this.addData();
        case 'setup':
          return await this.modifyData();
      }
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
      let _formData = this._getFromData();

      let apiRes = await this.T.callAPI('post', '/api/v1/api-auth/do/add', {
        body : { data: _formData },
        alert: { okMessage: this.$t('API Auth created') },
      });
      if (!apiRes.ok) return;

      this.$store.commit('updateAuthLinkList_scrollY', null);
      this.$store.commit('updateHighlightedTableDataId', apiRes.data.id);

      this.$router.push({
        name : 'api-auth-list',
        query: this.T.getPrevQuery(),
      });
    },
    async modifyData() {
      let _formData = this._getFromData();
      delete _formData.id;
      delete _formData.type;

      let apiRes = await this.T.callAPI('post', '/api/v1/api-auth/:id/do/modify', {
        params: { id: this.$route.params.id },
        body  : { data: _formData },
        alert : { okMessage: this.$t('API Auth saved') },
      });
      if (!apiRes.ok) return;

      this.$store.commit('updateHighlightedTableDataId', apiRes.data.id);

      this.$router.push({
        name : 'api-auth-list',
        query: this.T.getPrevQuery(),
      });
    },
    async deleteData() {
      if (!await this.T.confirm(this.$t('Are you sure you want to delete the API Auth?'))) return;

      let apiRes = await this.T.callAPI('/api/v1/api-auth/:id/do/delete', {
        params: { id: this.$route.params.id },
        alert : { okMessage: this.$t('API Auth deleted') },
      });
      if (!apiRes.ok) return;

      this.$router.push({
        name : 'api-auth-list',
        query: this.T.getPrevQuery(),
      });
    },
    hasConfigField(type, field) {
      if (!this.C.API_AUTH_MAP.get(type) || !this.C.API_AUTH_MAP.get(type).configFields) {
        return false;
      }
      return (field in this.C.API_AUTH_MAP.get(type).configFields);
    },

    addFixedFieldItem() {
      if (this.T.isNothing(this.form.configJSON.fixedFields)) {
        this.$set(this.form.configJSON, 'fixedFields', []);
      }
      this.form.configJSON.fixedFields.push({ location: '', name: '', value: '' });
    },
    removeFixedFieldItem(index) {
      this.form.configJSON.fixedFields.splice(index, 1);
    },
    addHTTPAuthItem() {
      if (this.T.isNothing(this.form.configJSON.httpAuth)) {
        this.$set(this.form.configJSON, 'httpAuth', []);
      }
      this.form.configJSON.httpAuth.push({ username: '', password: '' });
    },
    removeHTTPAuthItem(index) {
      this.form.configJSON.httpAuth.splice(index, 1);
    },
  },
  computed: {
    formRules() {
      return {
        type: [
          {
            trigger : 'change',
            message : this.$t('Please input API Auth type'),
            required: true,
          },
        ],
        funcId: [
          {
            trigger : 'change',
            message : this.$t('Please select Func'),
            required: true,
          },
        ],
      }
    },
    formRules_fixedFieldLocation() {
      return {
        trigger: 'change',
        message : this.$t('Please input location'),
        required: true,
      }
    },
    formRules_fixedFieldName() {
      return {
        trigger: 'change',
        message : this.$t('Please input field name'),
        required: true,
      }
    },
    formRules_fixedFieldValue() {
      return {
        trigger: 'change',
        message : this.$t('Please input field value'),
        required: true,
      }
    },
    formRules_httpAuthUsername() {
      return {
        trigger: 'change',
        message : this.$t('Please input HTTP Auth username'),
        required: true,
      }
    },
    formRules_httpAuthPassword() {
      return {
        trigger: 'change',
        message : this.$t('Please input HTTP Auth password'),
        required: false,
      }
    },
    pageTitle() {
      const _map = {
        setup: this.$t('Setup API Auth'),
        add  : this.$t('Add API Auth'),
      };
      return _map[this.T.pageMode()];
    },
    selectedType() {
      switch(this.T.pageMode()) {
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
      data        : {},
      funcMap     : {},
      funcCascader: [],

      form: {
        name      : null,
        type      : null,
        configJSON: {},
        note      : null,
      },
    }
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.config-divider {
  margin-bottom: 0;
}

.func-cascader-input {
  width: 500px;
}

.fixed-field-location .el-select {
  width: 420px;
  display: inline-block;
}
.fixed-field .el-input,
.http-auth .el-input {
  width: 420px;
}

.fixed-field-location .el-link,
.fixed-field .el-link,
.http-auth .el-link {
  float: right;
}
</style>
