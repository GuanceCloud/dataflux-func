<i18n locale="zh-CN" lang="yaml">
Add Data Source  : 添加数据源
Setup Data Source: 配置数据源

Type               : 类型
Compatibility      : 兼容性
Title              : 标题
Description        : 描述
Host               : 主机
Port               : 端口
Servers            : 服务器列表
Protocol           : 协议
Source             : 源
Database           : 数据库
User               : 用户
Password           : 密码
Charset            : 编码
Client ID          : 客户端ID
'Topic/Handler'    : 主题/处理
Topic              : 主题
Handler Func       : 处理函数
'Add Topic/Handler': 添加主题/处理函数
Test connection    : 测试连通性

'Servers to connect (e.g. host1:80,host2:81)': 连接地址列表，如：host1:80,host2:81
Password here is always required when the Data Source requires password to connect: 如数据源需要密码，则每次修改都必须重新输入密码
'1. $share/GROUP/TOPIC in MQTTv5': '1. MQTTv5 的 $share/GROUP/TOPIC'
'2. $queue/TOPIC in EMQX': '2. EMQX 的 $queue/TOPIC'

Please input ID: 请输入ID
Only alphabets, numbers and underscore are allowed: 只能包含大小写英文、数字及下划线
Cannot not starts with a number: 不得以数字开头
Please input Data Source type: 请选择数据源类型
Please input host: 请输入主机地址
Please input port: 请输入主机端口
Only integer between 1 and 65535 are allowed: 主机端口范围为 1-65535
Please input servers: 请输入服务器列表
Please select HTTP protocol: 请选择HTTP协议
Only HTTP and HTTPS are allowed: 协议只能为HTTP或HTTPS
Please input source: 请输入数据源名称
Please input database: 请输入数据库名
Please input user: 请输入用户名
Please input password: 请输入密码
Please input charset: 请输入字符集
Please input Access Key: 请输入Access Key
Please input Secret Key: 请输入Secret Key
Please input client ID: 请输入客户端ID
Please input topic: 请输入订阅主题
Please select handler Func: 请选择处理函数

Data Source created: 数据源已创建
Data Source saved  : 数据源已保存
Data Source deleted: 数据源已删除

Are you sure you want to delete the Data Source?: 是否确认删除此数据源？

This is a builtin Data Source, please contact the admin to change the config: 当前数据源为内置数据源，请联系管理员调整集群配置
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
              <el-form ref="form" label-width="120px" :model="form" :disabled="data.isBuiltin" :rules="formRules">
                <el-form-item v-if="data.isBuiltin">
                  <InfoBlock type="error" :title="$t('This is a builtin Data Source, please contact the admin to change the config')"></InfoBlock>
                </el-form-item>

                <el-form-item :label="$t('Type')" prop="type" v-if="T.pageMode() === 'add'">
                  <el-select v-model="form.type" @change="switchType">
                    <el-option v-for="opt in SUPPORTED_DATA_SOURCE" :label="opt.fullName" :key="opt.key" :value="opt.key"></el-option>
                  </el-select>
                </el-form-item>
                <el-form-item :label="$t('Type')" v-else>
                  <el-select v-model="selectedType" :disabled="true">
                    <el-option :label="C.DATA_SOURCE_MAP.get(selectedType).fullName" :value="selectedType"></el-option>
                  </el-select>
                </el-form-item>

                <template v-if="selectedType">
                  <el-form-item v-if="C.DATA_SOURCE_MAP.get(selectedType).logo">
                    <el-image
                      class="data-source-logo"
                      :class="[`logo-${selectedType}`]"
                      :src="C.DATA_SOURCE_MAP.get(selectedType).logo">
                    </el-image>
                  </el-form-item>

                  <el-form-item v-if="C.DATA_SOURCE_MAP.get(selectedType).tips">
                    <InfoBlock type="info" :title="C.DATA_SOURCE_MAP.get(selectedType).tips"></InfoBlock>
                  </el-form-item>

                  <el-form-item :label="$t('Compatibility')" v-if="!T.isNothing(C.DATA_SOURCE_MAP.get(selectedType).compatibleDBs)">
                    <el-tag type="info" size="medium" :disable-transitions="true" v-for="db in C.DATA_SOURCE_MAP.get(selectedType).compatibleDBs" :key="db">{{ db }}</el-tag>
                  </el-form-item>

                  <el-form-item label="ID" prop="id">
                    <el-input :disabled="T.pageMode() === 'setup'"
                      maxlength="40"
                      show-word-limit
                      v-model="form.id"></el-input>
                  </el-form-item>

                  <el-form-item :label="$t('Title')">
                    <el-input :placeholder="$t('Optional')"
                      maxlength="25"
                      show-word-limit
                      v-model="form.title"></el-input>
                  </el-form-item>

                  <el-form-item :label="$t('Description')">
                    <el-input :placeholder="$t('Optional')"
                      type="textarea"
                      resize="none"
                      :autosize="{minRows: 2}"
                      maxlength="5000"
                      show-word-limit
                      v-model="form.description"></el-input>
                  </el-form-item>

                  <!-- 可变区域 -->
                  <el-form-item :label="$t('Host')" v-if="hasConfigField(selectedType, 'host')" prop="configJSON.host">
                    <el-input @blur="unpackURL"
                      v-model="form.configJSON.host"></el-input>
                  </el-form-item>

                  <el-form-item :label="$t('Port')" v-if="hasConfigField(selectedType, 'port')" prop="configJSON.port">
                    <el-input
                      v-model.number="form.configJSON.port" min="0" max="65535"></el-input>
                  </el-form-item>

                  <el-form-item :label="$t('Servers')" v-if="hasConfigField(selectedType, 'servers')" prop="configJSON.servers">
                    <el-input
                      type="textarea"
                      resize="none"
                      :autosize="{minRows: 2}"
                      v-model="form.configJSON.servers"></el-input>
                    <InfoBlock type="info" :title="$t('Servers to connect (e.g. host1:80,host2:81)')"></InfoBlock>
                  </el-form-item>

                  <el-form-item :label="$t('Protocol')" v-if="hasConfigField(selectedType, 'protocol')" prop="configJSON.protocol">
                    <el-select v-model="form.configJSON.protocol">
                      <el-option label="HTTP" key="http" value="http"></el-option>
                      <el-option label="HTTPS" key="https" value="https"></el-option>
                    </el-select>
                  </el-form-item>

                  <el-form-item :label="$t('Source')" v-if="hasConfigField(selectedType, 'source')" prop="configJSON.source">
                    <!-- DataKit专用 -->
                    <el-input
                      v-model="form.configJSON.source"></el-input>
                  </el-form-item>

                  <el-form-item :label="$t('Database')" v-if="hasConfigField(selectedType, 'database')" prop="configJSON.database">
                    <el-input
                      v-model="form.configJSON.database"></el-input>
                  </el-form-item>

                  <el-form-item :label="$t('User')" v-if="hasConfigField(selectedType, 'user')" prop="configJSON.user">
                    <el-input
                      v-model="form.configJSON.user"></el-input>
                  </el-form-item>

                  <el-form-item :label="$t('Password')" v-if="hasConfigField(selectedType, 'password')" prop="configJSON.password">
                    <el-input
                      v-model="form.configJSON.password" show-password></el-input>
                    <InfoBlock v-if="!data.isBuiltin && T.pageMode() === 'setup'" type="info" :title="$t('Password here is always required when the Data Source requires password to connect')"></InfoBlock>
                  </el-form-item>

                  <el-form-item :label="$t('Charset')" v-if="hasConfigField(selectedType, 'charset')" prop="configJSON.charset">
                    <el-input
                      v-model="form.configJSON.charset"></el-input>
                  </el-form-item>

                  <el-form-item label="Token" v-if="hasConfigField(selectedType, 'token')" prop="configJSON.token">
                    <el-input
                      v-model="form.configJSON.token"></el-input>
                  </el-form-item>

                  <el-form-item label="Access Key" v-if="hasConfigField(selectedType, 'accessKey')" prop="configJSON.accessKey">
                    <el-input
                      v-model="form.configJSON.accessKey"></el-input>
                  </el-form-item>

                  <el-form-item label="Secret Key" v-if="hasConfigField(selectedType, 'secretKey')" prop="configJSON.secretKey">
                    <el-input
                      v-model="form.configJSON.secretKey"></el-input>
                  </el-form-item>

                  <el-form-item :label="$t('Client ID')" v-if="hasConfigField(selectedType, 'clientId')" prop="configJSON.clientId">
                    <el-input
                      v-model="form.configJSON.clientId"></el-input>
                  </el-form-item>

                  <template v-if="hasConfigField(selectedType, 'topicHandlers')">
                    <el-form-item class="config-divider" :label="$t('Topic/Handler')">
                      <el-divider></el-divider>
                    </el-form-item>

                    <template v-for="(topicHandler, index) in form.configJSON.topicHandlers || []">
                      <el-form-item
                        class="topic-handler"
                        :label="`#${index + 1}`"
                        :key="`topic-${index}`"
                        :prop="`configJSON.topicHandlers.${index}.topic`"
                        :rules="formRules_topic">
                        <el-input :placeholder="$t('Topic')" v-model="topicHandler.topic"></el-input>

                        <!-- 删除按钮 -->
                        <el-link type="primary" @click.prevent="removeTopicHandler(index)">{{ $t('Delete') }}</el-link>
                      </el-form-item>
                      <el-form-item
                        :key="`handler-${index}`"
                        :prop="`configJSON.topicHandlers.${index}.funcId`"
                        :rules="formRules_topic">
                        <el-cascader class="func-cascader-input" ref="funcCascader"
                          placeholder="--"
                          filterable
                          :placeholder="$t('Handler Func')"
                          v-model="topicHandler.funcId"
                          :options="funcCascader"
                          :props="{expandTrigger: 'hover', emitPath: false, multiple: false}"></el-cascader>
                      </el-form-item>
                    </template>
                    <el-form-item>
                      <el-link type="primary" @click="addTopicHandler"><i class="fa fa-fw fa-plus"></i> {{ $t('Add Topic/Handler') }}</el-link>
                    </el-form-item>
                  </template>
                  <!-- 可变区域结束 -->
                </template>
              </el-form>


              <!-- 此处特殊处理：要始终保证可以测试数据源 -->
              <el-form  label-width="120px">
                <el-form-item>
                  <el-button v-if="T.pageMode() === 'setup' && !data.isBuiltin" @click="deleteData">{{ $t('Delete') }}</el-button>

                  <div class="setup-right">
                    <el-button v-if="T.pageMode() === 'setup'" @click="testDataSource">
                      <i class="fa fa-fw fa-check text-good" v-if="testDataSourceResult === 'ok'"></i>
                      <i class="fa fa-fw fa-times text-bad" v-if="testDataSourceResult === 'ng'"></i>
                      <i class="fa fa-fw fa-circle-o-notch fa-spin" v-if="testDataSourceResult === 'running'"></i>
                      {{ $t('Test connection') }}
                    </el-button>

                    <el-button v-if="!data.isBuiltin" type="primary" @click="submitData">{{ $t('Save') }}</el-button>
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
  name: 'DataSourceSetup',
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

      let fieldMap = this.C.DATA_SOURCE_MAP.get(type).configFields;
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
      let fieldMap = this.C.DATA_SOURCE_MAP.get(type).configFields;
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
    unpackURL() {
      if (!this.form || !this.form.configJSON || !this.form.configJSON.host) return;

      let parsedURL = null;
      try { parsedURL = new URL(this.form.configJSON.host) } catch(err) { /* Nope */ }

      // 非URL地址不处理
      if (!parsedURL || parsedURL.hostname == this.form.configJSON.host) return;

      // 没有对应支持不处理
      let fieldMap = this.C.DATA_SOURCE_MAP.get(this.selectedType).configFields;
      if (!fieldMap) return;

      let nextConfigJSON = this.T.jsonCopy(this.form.configJSON);
      if (fieldMap.host && parsedURL.hostname) {
        nextConfigJSON.host = parsedURL.hostname;
      }
      if (fieldMap.port) {
        if (parsedURL.port) {
          nextConfigJSON.port = parseInt(parsedURL.port);
        } else if (fieldMap.protocol && parsedURL.protocol) {
          nextConfigJSON.port = parsedURL.protocol.split(':')[0] === 'https' ? 443 : 80;
        }
      }
      if (fieldMap.protocol && parsedURL.protocol) {
        nextConfigJSON.protocol = parsedURL.protocol.split(':')[0];
      }
      if (fieldMap.database && parsedURL.pathname) {
        nextConfigJSON.database = parsedURL.pathname.split('/')[0];
      }
      if (fieldMap.user && parsedURL.username) {
        nextConfigJSON.user = parsedURL.username;
      }
      if (fieldMap.password && parsedURL.password) {
        nextConfigJSON.password = parsedURL.password;
      }

      // 提取额外参数
      let parsedQuery = this.T.getQuery(parsedURL.search);
      switch(this.selectedType) {
        case 'df_dataway':
          if (fieldMap.token && parsedQuery.token) {
            nextConfigJSON.token = parsedQuery.token;
          }
          break
      }

      this.form.configJSON = nextConfigJSON;
    },
    async loadData() {
      if (this.T.pageMode() === 'setup') {
        let apiRes = await this.T.callAPI_getOne('/api/v1/data-sources/do/list', this.$route.params.id);
        if (!apiRes.ok) return;

        this.data = apiRes.data;

        let nextForm = {};
        Object.keys(this.form).forEach(f => nextForm[f] = this.data[f]);
        this.form = nextForm;

        this.testDataSourceResult = null;

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

      // 服务器列表字段自动合并换行
      if ('string' === typeof _formData.configJSON.servers) {
        _formData.configJSON.servers = _formData.configJSON.servers.replace(/\n/g, ',').replace(/\s/g, '');
      }

      let apiRes = await this.T.callAPI('post', '/api/v1/data-sources/do/add', {
        body : { data: _formData },
        alert: { okMessage: this.$t('Data Source created') },
      });
      if (!apiRes.ok) return;

      this.$router.push({
        name: 'intro',
      });
      this.$store.commit('updateDataSourceListSyncTime');
    },
    async modifyData() {
      let _formData = this._getFromData();
      delete _formData.id;
      delete _formData.type;

      let apiRes = await this.T.callAPI('post', '/api/v1/data-sources/:id/do/modify', {
        params: { id: this.$route.params.id },
        body  : { data: _formData },
        alert : { okMessage: this.$t('Data Source saved') },
      });
      if (!apiRes.ok) return;

      // await this.loadData();
      this.$store.commit('updateDataSourceListSyncTime');
    },
    async deleteData() {
      if (!await this.T.confirm(this.$t('Are you sure you want to delete the Data Source?'))) return;

      let apiRes = await this.T.callAPI('/api/v1/data-sources/:id/do/delete', {
        params: { id: this.$route.params.id },
        alert : { okMessage: this.$t('Data Source deleted') },
      });
      if (!apiRes.ok) return;

      this.$router.push({
        name: 'intro',
      });
      this.$store.commit('updateDataSourceListSyncTime');
    },
    async testDataSource() {
      this.testDataSourceResult = 'running';

      let apiRes = await this.T.callAPI_get('/api/v1/data-sources/:id/do/test', {
        params: { id: this.$route.params.id },
      });
      if (apiRes.ok) {
        this.testDataSourceResult = 'ok';
      } else {
        this.testDataSourceResult = 'ng';
      }
    },
    hasConfigField(type, field) {
      if (!this.C.DATA_SOURCE_MAP.get(type) || !this.C.DATA_SOURCE_MAP.get(type).configFields) {
        return false;
      }
      return (field in this.C.DATA_SOURCE_MAP.get(type).configFields);
    },

    addTopicHandler() {
      if (this.T.isNothing(this.form.configJSON.topicHandlers)) {
        this.$set(this.form.configJSON, 'topicHandlers', []);
      }
      this.form.configJSON.topicHandlers.push({ topic: '', funcId: '' });
    },
    removeTopicHandler(index) {
      this.form.configJSON.topicHandlers.splice(index, 1);
    },
  },
  computed: {
    SUPPORTED_DATA_SOURCE() {
      return this.C.DATA_SOURCE.filter(opt => {
        // 部分数据源特殊处理
        switch (opt.key) {
          case 'sqlserver':
            if (this.$store.getters.CONFIG('_ARCH') !== 'x64') {
              return false;
            }

          default:
            return true;
        }
      });
    },
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
            message: this.$t('Only alphabets, numbers and underscore are allowed'),
            pattern: /^[a-zA-Z0-9_]*$/g,
          },
          {
            trigger: 'change',
            message: this.$t('Cannot not starts with a number'),
            pattern: /^[^0-9]/g,
          },
        ],
        type: [
          {
            trigger : 'change',
            message : this.$t('Please input Data Source type'),
            required: true,
          },
        ],
        'configJSON.host': [
          {
            trigger : 'change',
            message : this.$t('Please input host'),
            required: true,
          },
        ],
        'configJSON.port': [
          {
            trigger : 'change',
            message : this.$t('Please input port'),
            required: true,
          },
          {
            trigger: 'change',
            message: this.$t('Only integer between 1 and 65535 are allowed'),
            type   : 'integer',
            min    : 1,
            max    : 65535,
            trigger: 'change',
          },
        ],
        'configJSON.servers': [
          {
            trigger : 'change',
            message : this.$t('Please input servers'),
            required: true,
          }
        ],
        'configJSON.protocol': [
          {
            trigger : 'change',
            message : this.$t('Please select HTTP protocol'),
            required: true,
          },
          {
            trigger: 'change',
            message: this.$t('Only HTTP and HTTPS are allowed'),
            type   : 'enum',
            enum   : ['http', 'https'],
          },
        ],
        'configJSON.source': [
          {
            trigger : 'change',
            message : this.$t('Please input source'),
            required: false,
          },
        ],
        'configJSON.database': [
          {
            trigger : 'change',
            message : this.$t('Please input database'),
            required: false,
          },
        ],
        'configJSON.user': [
          {
            trigger : 'change',
            message : this.$t('Please input user'),
            required: false,
          },
        ],
        'configJSON.password': [
          {
            trigger : 'change',
            message : this.$t('Please input password'),
            required: false,
          },
        ],
        'configJSON.charset': [
          {
            trigger : 'change',
            message : this.$t('Please input charset'),
            required: false,
          },
        ],
        'configJSON.accessKey': [
          {
            trigger : 'change',
            message : this.$t('Please input Access Key'),
            required: false,
          },
        ],
        'configJSON.secretKey': [
          {
            trigger : 'change',
            message : this.$t('Please input Secret Key'),
            required: false,
          },
        ],
        'configJSON.clientId': [
          {
            trigger : 'change',
            message : this.$t('Please input client ID'),
            required: false,
          },
        ],
      }
    },
    formRules_topic() {
      return {
        trigger: 'change',
        message : this.$t('Please input topic'),
        required: true,
      }
    },
    formRules_topicHandler() {
      return {
        trigger: 'change',
        message : this.$t('Please select handler Func'),
        required: true,
      }
    },
    pageTitle() {
      const _map = {
        setup: this.$t('Setup Data Source'),
        add  : this.$t('Add Data Source'),
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
        id         : null,
        title      : null,
        type       : null,
        description: null,
        configJSON : {},
      },

      testDataSourceResult: null,
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
  width: 420px;
}
.topic-handler .el-input {
  width: 420px;
}
.topic-handler .el-link {
  float: right;
}
</style>
<style>
.data-source-logo img {
  width: auto;
}
.data-source-logo.logo-df_dataway {
}
.data-source-logo.logo-df_datakit {
}
.data-source-logo.logo-influxdb {
  height: 70px !important;
}
.data-source-logo.logo-mysql {
  height: 100px !important;
}
.data-source-logo.logo-redis {
  height: 90px !important;
}
.data-source-logo.logo-memcached {
  height: 90px !important;
}
.data-source-logo.logo-clickhouse {
  height: 100px !important;
}
.data-source-logo.logo-oracle {
  height: 40px !important;
}
.data-source-logo.logo-sqlserver {
  height: 60px !important;
}
.data-source-logo.logo-postgresql {
  height: 100px !important;
}
.data-source-logo.logo-mongodb {
  height: 100px !important;
}
.data-source-logo.logo-elasticsearch {
  height: 70px !important;
}
.data-source-logo.logo-nsq {
  height: 90px !important;
}
.data-source-logo.logo-mqtt {
  height: 90px !important;
}
</style>
