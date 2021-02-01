<i18n locale="zh-CN" lang="yaml">
This is a builtin Data Source, please contact the admin to change the config      : 当前数据源为内置数据源，请联系管理员调整集群配置
Type                                                                              : 类型
Please select the Data Source type                                                : 请选择数据源类型
Compatibility                                                                     : 兼容性
Title                                                                             : 标题
Name of the Data Source for convenience                                           : 方便区分数据源的名称
Description                                                                       : 描述
Description about this Data Source                                                : 介绍当前数据源的作用、功能、目的等
Host                                                                              : 主机
Host address, domain or IP                                                        : 连接地址，IP或域名
Port                                                                              : 端口
Port to connect                                                                   : 连接端口
Servers                                                                           : 服务器列表
'Servers to connect (e.g. host1:80,host2:81)'                                     : 连接地址列表，如：host1:80,host2:81
Protocol                                                                          : 协议
Please select connection protocol                                                 : 请选择协议
Database                                                                          : 数据库
Database to connect                                                               : 连接数据库
User                                                                              : 用户
User for authentication. A read-only user is recommended                          : 认证用户名。如无写入操作，请使用只读用户
Password                                                                          : 密码
Password for authentication                                                       : 认证密码
Password here is always required when the Data Source requires password to connect: 如数据源需要密码，则每次修改都必须重新输入密码
Charset                                                                           : 编码
Database charset                                                                  : 数据库编码
Client ID                                                                         : 客户端ID
'Topic/Handler'                                                                   : 主题/处理
'Shared subscription can avoid duplicated message:'                               : 建议使用共享订阅方式订阅，避免重复接收消息：
'1. $share/GROUP/TOPIC in MQTTv5'                                                 : '1. MQTTv5 的 $share/GROUP/TOPIC'
'2. $queue/TOPIC in EMQX'                                                         : '2. EMQX 的 $queue/TOPIC'
Topic                                                                             : 主题
Select handler Func                                                               : 选择处理函数
Add handler Func                                                                  : 新增处理函数
Test connection                                                                   : 测试连通性

Add Data Source   : 添加数据源
Modify Data Source: 修改数据源
Delete Data Source: 删除数据源
Test Data Source  : 测试数据源

Deleting Data Source may break the dependency with other scripts: 删除数据源可能会破坏与其他脚本的依赖关系
Are you sure you want to delete the Data Source?                : 是否确认删除数据源？

Please input ID                                   : 请输入ID
Only alphabets, numbers and underscore are allowed: 只能包含大小写英文、数字及下划线
Cannot not starts with a number                   : 不得以数字开头
Please input Data Source type                     : 请选择数据源类型
Please input host                                 : 请输入主机地址
Please input port                                 : 请输入主机端口
Only integer between 1 and 65535 are allowed      : 主机端口范围为 1-65535
Please input servers                              : 请输入服务器列表
Please select HTTP protocol                       : 请选择HTTP协议
Only HTTP and HTTPS are allowed                   : 协议只能为HTTP或HTTPS
Please input database                             : 请输入数据库名
Please input user                                 : 请输入用户名
Please input password                             : 请输入密码
Please input charset                              : 请输入字符集
Please input Access Key                           : 请输入Access Key
Please input Secret Key                           : 请输入Secret Key
Please input client ID                            : 请输入客户端ID
Please input topic                                : 请输入订阅主题
Please select handler Func                        : 请选择处理函数
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

                <el-form-item :label="$t('Type')" prop="type" v-if="mode === 'add'">
                  <el-select v-model="form.type" :placeholder="$t('Please select the Data Source type')" @change="switchType">
                    <el-option v-for="opt in C.DATE_SOURCE" :label="opt.fullName" :key="opt.key" :value="opt.key"></el-option>
                  </el-select>
                </el-form-item>
                <el-form-item :label="$t('Type')" v-else>
                  <el-select v-model="selectedType" :disabled="true">
                    <el-option :label="C.DATE_SOURCE_MAP[selectedType].fullName" :value="selectedType"></el-option>
                  </el-select>
                </el-form-item>

                <template v-if="selectedType">
                  <el-form-item>
                    <el-image class="data-source-logo" :class="[`logo-${selectedType}`]" :src="C.DATE_SOURCE_MAP[selectedType].logo"></el-image>
                  </el-form-item>

                  <el-form-item v-if="C.DATE_SOURCE_MAP[selectedType].tips">
                    <InfoBlock type="info" :title="C.DATE_SOURCE_MAP[selectedType].tips"></InfoBlock>
                  </el-form-item>

                  <el-form-item :label="$t('Compatibility')" v-if="!T.isNothing(C.DATE_SOURCE_MAP[selectedType].compatibleDBs)">
                    <el-tag type="info" size="medium" :disable-transitions="true" v-for="db in C.DATE_SOURCE_MAP[selectedType].compatibleDBs" :key="db">{{ db }}</el-tag>
                  </el-form-item>

                  <el-form-item label="ID" prop="id">
                    <el-input :disabled="mode === 'setup'"
                      maxlength="40"
                      show-word-limit
                      v-model="form.id"></el-input>
                  </el-form-item>

                  <el-form-item :label="$t('Title')">
                    <el-input :placeholder="$t('Name of the Data Source for convenience')"
                      maxlength="25"
                      show-word-limit
                      v-model="form.title"></el-input>
                  </el-form-item>

                  <el-form-item :label="$t('Description')">
                    <el-input :placeholder="$t('Description about this Data Source')"
                      type="textarea"
                      resize="none"
                      :autosize="{minRows: 2}"
                      maxlength="200"
                      show-word-limit
                      v-model="form.description"></el-input>
                  </el-form-item>

                  <!-- 可变区域 -->
                  <el-form-item :label="$t('Host')" v-if="hasConfigField(selectedType, 'host')" prop="configJSON.host">
                    <el-input :placeholder="$t('Host address, domain or IP')" @blur="unpackURL"
                      v-model="form.configJSON.host"></el-input>
                  </el-form-item>

                  <el-form-item :label="$t('Port')" v-if="hasConfigField(selectedType, 'port')" prop="configJSON.port">
                    <el-input :placeholder="$t('Port to connect')"
                      v-model.number="form.configJSON.port" min="0" max="65535"></el-input>
                  </el-form-item>

                  <el-form-item :label="$t('Servers')" v-if="hasConfigField(selectedType, 'servers')" prop="configJSON.servers">
                    <el-input :placeholder="$t('Servers to connect (e.g. host1:80,host2:81)')"
                      type="textarea"
                      resize="none"
                      :autosize="{minRows: 2}"
                      v-model="form.configJSON.servers"></el-input>
                  </el-form-item>

                  <el-form-item :label="$t('Protocol')" v-if="hasConfigField(selectedType, 'protocol')" prop="configJSON.protocol">
                    <el-select v-model="form.configJSON.protocol" :placeholder="$t('Please select connection protocol')">
                      <el-option label="HTTP" key="http" value="http"></el-option>
                      <el-option label="HTTPS" key="https" value="https"></el-option>
                    </el-select>
                  </el-form-item>

                  <el-form-item :label="$t('Database')" v-if="hasConfigField(selectedType, 'database')" prop="configJSON.database">
                    <el-input :placeholder="$t('Database to connect')"
                      v-model="form.configJSON.database"></el-input>
                  </el-form-item>

                  <el-form-item :label="$t('User')" v-if="hasConfigField(selectedType, 'user')" prop="configJSON.user">
                    <el-input :placeholder="$t('User for authentication. A read-only user is recommended')"
                      v-model="form.configJSON.user"></el-input>
                  </el-form-item>

                  <el-form-item :label="$t('Password')" v-if="hasConfigField(selectedType, 'password')" prop="configJSON.password">
                    <el-input :placeholder="$t('Password for authentication')"
                      v-model="form.configJSON.password" show-password></el-input>
                    <InfoBlock v-if="!data.isBuiltin && mode === 'setup'" type="info" :title="$t('Password here is always required when the Data Source requires password to connect')"></InfoBlock>
                  </el-form-item>

                  <el-form-item :label="$t('Charset')" v-if="hasConfigField(selectedType, 'charset')" prop="configJSON.charset">
                    <el-input :placeholder="$t('Database charset')"
                      v-model="form.configJSON.charset"></el-input>
                  </el-form-item>

                  <el-form-item label="Token" v-if="hasConfigField(selectedType, 'token')" prop="configJSON.token">
                    <el-input placeholder="Token"
                      v-model="form.configJSON.token"></el-input>
                  </el-form-item>

                  <el-form-item label="Access Key" v-if="hasConfigField(selectedType, 'accessKey')" prop="configJSON.accessKey">
                    <el-input placeholder="Access Key"
                      v-model="form.configJSON.accessKey"></el-input>
                  </el-form-item>

                  <el-form-item label="Secret Key" v-if="hasConfigField(selectedType, 'secretKey')" prop="configJSON.secretKey">
                    <el-input placeholder="Secret Key"
                      v-model="form.configJSON.secretKey"></el-input>
                  </el-form-item>

                  <el-form-item :label="$t('Client ID')" v-if="hasConfigField(selectedType, 'clientId')" prop="configJSON.clientId">
                    <el-input :placeholder="$t('Client ID')"
                      v-model="form.configJSON.clientId"></el-input>
                  </el-form-item>

                  <el-form-item v-if="hasConfigField(selectedType, 'topicHandlers') && selectedType === 'mqtt'"
                    :label="$t('Topic/Handler')">
                    <InfoBlock type="info" :title="`${$t('Shared subscription can avoid duplicated message:')}\n${$t('1. $share/GROUP/TOPIC in MQTTv5')}\n${$t('2. $queue/TOPIC in EMQX')}`"></InfoBlock>
                  </el-form-item>

                  <template v-for="(topicHandler, index) in form.configJSON.topicHandlers || []">
                    <el-form-item
                      class="topic-handler"
                      :label="`#${index + 1}`"
                      :key="`topic-${index}`" v-if="hasConfigField(selectedType, 'topicHandlers')"
                      :prop="`configJSON.topicHandlers.${index}.topic`"
                      :rules="formRules_topic">
                      <el-input :placeholder="$t('Topic')" v-model="topicHandler.topic"></el-input>
                      <el-link type="primary" @click.prevent="removeTopicHandler(index)">{{ $t('Delete') }}</el-link>
                    </el-form-item>
                    <el-form-item
                      :key="`handler-${index}`" v-if="hasConfigField(selectedType, 'topicHandlers')"
                      :prop="`configJSON.topicHandlers.${index}.funcId`"
                      :rules="formRules_topic">
                      <el-cascader class="func-cascader-input" ref="funcCascader"
                        filterable
                        :placeholder="$t('Select handler Func')"
                        v-model="topicHandler.funcId"
                        :options="funcCascader"
                        :props="{expandTrigger: 'hover', emitPath: false, multiple: false}"></el-cascader>
                    </el-form-item>
                  </template>
                  <el-form-item v-if="hasConfigField(selectedType, 'topicHandlers')">
                    <el-link type="primary" @click="addTopicHandler"><i class="fa fa-fw fa-plus"></i> {{ $t('Add handler Func') }}</el-link>
                  </el-form-item>
                  <!-- 可变区域结束 -->
                </template>
              </el-form>


              <!-- 此处特殊处理：要始终保证可以测试数据源 -->
              <el-form  label-width="120px">
                <el-form-item>
                  <el-button v-if="mode === 'setup' && !data.isBuiltin" @click="deleteData">{{ $t('Delete') }}</el-button>

                  <div class="setup-right">
                    <el-button v-if="mode === 'setup'" @click="testDataSource">
                      <i class="fa fa-fw fa-check text-good" v-if="testDataSourceResult === 'ok'"></i>
                      <i class="fa fa-fw fa-times text-bad" v-if="testDataSourceResult === 'ng'"></i>
                      <i class="fa fa-fw fa-circle-o-notch fa-spin" v-if="testDataSourceResult === 'running'"></i>
                      {{ $t('Test connection') }}
                    </el-button>

                    <el-button v-if="!data.isBuiltin" type="primary" @click="submitData">{{ modeName }}</el-button>
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

        switch(this.mode) {
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

      let fieldMap = this.C.DATE_SOURCE_MAP[type].configFields;
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
      let fieldMap = this.C.DATE_SOURCE_MAP[type].configFields;
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
      let fieldMap = this.C.DATE_SOURCE_MAP[this.selectedType].configFields;
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
      if (this.mode === 'setup') {
        let apiRes = await this.T.callAPI_getOne('/api/v1/data-sources/do/list', this.$route.params.id, {
          alert: {showError: true},
        });
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

      switch(this.mode) {
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
        body : {data: _formData},
        alert: {title: this.$t('Add Data Source'), showError: true, showSuccess: true},
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

      let apiRes = await this.T.callAPI('post', '/api/v1/data-sources/:id/do/modify', {
        params: {id: this.$route.params.id},
        body  : {data: _formData},
        alert : {title: this.$t('Modify Data Source'), showError: true, showSuccess: true},
      });
      if (!apiRes.ok) return;

      // await this.loadData();
      this.$store.commit('updateDataSourceListSyncTime');
    },
    async deleteData() {
      try {
        await this.$confirm(`${this.$t('Deleting Data Source may break the dependency with other scripts')}
          <hr class="br">${this.$t('Are you sure you want to delete the Data Source?')}`, this.$t('Delete Data Source'), {
          dangerouslyUseHTMLString: true,
          confirmButtonText: this.$t('Delete'),
          cancelButtonText: this.$t('Cancel'),
          type: 'warning',
        });

      } catch(err) {
        return; // 取消操作
      }

      let apiRes = await this.T.callAPI('/api/v1/data-sources/:id/do/delete', {
        params: {id: this.$route.params.id},
        alert : {title: this.$t('Delete Data Source'), showError: true},
      });
      if (!apiRes.ok) return;

      this.$router.push({
        name: 'intro',
      });
      this.$store.commit('updateDataSourceListSyncTime');
    },
    async testDataSource() {
      this.testDataSourceResult = 'running';

      let apiRes = await this.T.callAPI('/api/v1/data-sources/:id/do/test', {
        params: {id: this.$route.params.id},
        alert : {title: this.$t('Test Data Source'), showError: true},
      });
      if (apiRes.ok) {
        this.testDataSourceResult = 'ok';
      } else {
        this.testDataSourceResult = 'ng';
      }
    },
    hasConfigField(type, field) {
      if (!this.C.DATE_SOURCE_MAP[type] || !this.C.DATE_SOURCE_MAP[type].configFields) {
        return false;
      }
      return (field in this.C.DATE_SOURCE_MAP[type].configFields);
    },
    removeTopicHandler(index) {
      this.form.configJSON.topicHandlers.splice(index, 1);
    },
    addTopicHandler() {
      if (this.T.isNothing(this.form.configJSON.topicHandlers)) {
        this.$set(this.form.configJSON, 'topicHandlers', []);
      }
      this.form.configJSON.topicHandlers.push({ topic: '', funcId: '' });
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
        message : this.$t('Please input handler Func'),
        required: true,
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
        setup: this.$t('Modify Data Source'),
        add  : this.$t('Add Data Source'),
      };
      return _map[this.mode];
    },
    selectedType() {
      switch(this.mode) {
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
.data-source-logo.logo-dataflux-dataway {
  height: 60px !important;
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
