<template>
  <transition name="fade">
    <el-container direction="vertical" v-if="$store.state.isLoaded">
      <!-- 标题区 -->
      <el-header height="60px">
        <h1>
          {{ modeName }}数据源
          <code class="text-main">{{ data.title || data.id }}</code>
        </h1>
      </el-header>

      <!-- 编辑区 -->
      <el-main>
        <el-row :gutter="20">
          <el-col :span="15">
            <div class="common-form">
              <el-form ref="form" :model="form" label-width="100px" :disabled="data.isBuiltin" :rules="formRules">
                <el-form-item v-if="data.isBuiltin">
                  <InfoBlock type="error" title="当前数据源为内置数据源，请联系管理员调整集群配置"></InfoBlock>
                </el-form-item>

                <el-form-item label="类型" prop="type" v-if="mode === 'add'">
                  <el-select v-model="form.type" placeholder="请选择数据源类型" @change="switchType">
                    <el-option v-for="opt in C.DATE_SOURCE" :label="opt.fullName" :key="opt.key" :value="opt.key"></el-option>
                  </el-select>
                </el-form-item>
                <el-form-item label="类型" v-else>
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

                  <el-form-item label="兼容" v-if="!T.isNothing(C.DATE_SOURCE_MAP[selectedType].compatibleDBs)">
                    <el-tag type="info" size="medium" :disable-transitions="true" v-for="db in C.DATE_SOURCE_MAP[selectedType].compatibleDBs" :key="db">{{ db }}</el-tag>
                  </el-form-item>

                  <el-form-item label="ID" prop="id">
                    <el-input :disabled="mode === 'setup'"
                      maxlength="40"
                      show-word-limit
                      v-model="form.id"></el-input>
                  </el-form-item>

                  <el-form-item label="标题">
                    <el-input placeholder="方便区分数据源的名称，在左侧栏展示"
                      maxlength="25"
                      show-word-limit
                      v-model="form.title"></el-input>
                  </el-form-item>

                  <el-form-item label="描述">
                    <el-input placeholder="介绍当前数据源的作用、功能、目的等"
                      type="textarea"
                      resize="none"
                      :autosize="{minRows: 2}"
                      maxlength="200"
                      show-word-limit
                      v-model="form.description"></el-input>
                  </el-form-item>

                  <!-- 可变区域 -->
                  <el-form-item label="主机" v-if="hasConfigField(selectedType, 'host')" prop="configJSON.host">
                    <el-input placeholder="连接地址，IP或域名" @blur="unpackURL"
                      v-model="form.configJSON.host"></el-input>
                  </el-form-item>

                  <el-form-item label="端口" v-if="hasConfigField(selectedType, 'port')" prop="configJSON.port">
                    <el-input placeholder="连接端口"
                      v-model.number="form.configJSON.port" min="0" max="65535"></el-input>
                  </el-form-item>

                  <el-form-item label="服务器列表" v-if="hasConfigField(selectedType, 'servers')" prop="configJSON.servers">
                    <el-input placeholder="连接地址列表，如：host1:80,host2:81"
                      type="textarea"
                      resize="none"
                      :autosize="{minRows: 2}"
                      v-model="form.configJSON.servers"></el-input>
                  </el-form-item>

                  <el-form-item label="协议" v-if="hasConfigField(selectedType, 'protocol')" prop="configJSON.protocol">
                    <el-select v-model="form.configJSON.protocol" placeholder="请选择协议">
                      <el-option label="HTTP" key="http" value="http"></el-option>
                      <el-option label="HTTPS" key="https" value="https"></el-option>
                    </el-select>
                  </el-form-item>

                  <el-form-item label="数据库" v-if="hasConfigField(selectedType, 'database')" prop="configJSON.database">
                    <el-input placeholder="访问数据库"
                      v-model="form.configJSON.database"></el-input>
                  </el-form-item>

                  <el-form-item label="用户名" v-if="hasConfigField(selectedType, 'user')" prop="configJSON.user">
                    <el-input placeholder="认证用户名，无写入需求时请使用只读用户"
                      v-model="form.configJSON.user"></el-input>
                  </el-form-item>

                  <el-form-item label="密码" v-if="hasConfigField(selectedType, 'password')" prop="configJSON.password">
                    <el-input placeholder="认证密码"
                      v-model="form.configJSON.password" show-password></el-input>
                    <InfoBlock v-if="!data.isBuiltin && mode === 'setup'" type="info" title="如数据源需要密码，则每次修改都必须重新输入密码"></InfoBlock>
                  </el-form-item>

                  <el-form-item label="编码" v-if="hasConfigField(selectedType, 'charset')" prop="configJSON.charset">
                    <el-input placeholder="数据库编码"
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

                  <el-form-item label="客户端ID" v-if="hasConfigField(selectedType, 'clientId')" prop="configJSON.clientId">
                    <el-input placeholder="客户端ID"
                      v-model="form.configJSON.clientId"></el-input>
                  </el-form-item>

                  <el-form-item v-if="hasConfigField(selectedType, 'topicHandlers') && selectedType === 'mqtt'"
                    label="订阅/处理">
                    <InfoBlock type="info" :title="'建议使用共享订阅方式订阅，避免重复接收消息。如：订阅以下主题都能接收到来自{topic}的消息：\n 1. MQTTv5 的 $share/{group}/{topic}\n 2. EMQX 的 $queue/{topic}'"></InfoBlock>
                  </el-form-item>
                  <el-form-item v-for="(topicHandler, index) in form.configJSON.topicHandlers || []"
                    :label="`#${index + 1}`"
                    :key="index" v-if="hasConfigField(selectedType, 'topicHandlers')"
                    :prop="`configJSON.topicHandlers.${index}`"
                    :rules="formRules_topicHandler">
                    <el-row type="flex" justify="space-between">
                      <el-col :span="21">
                        <el-input placeholder="订阅主题" v-model="topicHandler.topic"></el-input>
                      </el-col>
                      <el-col :span="2">
                        <el-link type="primary" @click.prevent="removeTopicHandler(index)">删除</el-link>
                      </el-col>
                    </el-row>
                    <el-row type="flex">
                      <el-col :span="24">
                        <el-cascader class="func-cascader-input" ref="funcCascader"
                          filterable
                          placeholder="请选择主题消息处理函数"
                          v-model="topicHandler.funcId"
                          :options="funcCascader"
                          :props="{expandTrigger: 'hover', emitPath: false, multiple: false}"></el-cascader>
                      </el-col>
                    </el-row>
                  </el-form-item>
                  <el-form-item v-if="hasConfigField(selectedType, 'topicHandlers')">
                    <el-link type="primary" @click="addTopicHandler"><i class="fa fa-fw fa-plus"></i> 新增主题处理函数</el-link>
                  </el-form-item>
                  <!-- 可变区域结束 -->

                  <el-form-item>
                    <el-button v-if="mode === 'setup' && !data.isBuiltin" @click="deleteData">删除</el-button>

                    <div class="setup-right">
                      <el-button @click="testDataSource" v-if="mode === 'setup'">
                        <i class="fa fa-fw fa-check text-good" v-if="testDataSourceResult === 'ok'"></i>
                        <i class="fa fa-fw fa-times text-bad" v-if="testDataSourceResult === 'ng'"></i>
                        <i class="fa fa-fw fa-circle-o-notch fa-spin" v-if="testDataSourceResult === 'running'"></i>
                        测试
                      </el-button>

                      <el-button v-if="!data.isBuiltin" type="primary" @click="submitData">保存</el-button>
                    </div>
                  </el-form-item>
                </template>
              </el-form>
            </div>
          </el-col>
          <el-col :span="9" class="hidden-md-and-down">
            <DataSourceArticles :type="form.type || data.type"></DataSourceArticles>
          </el-col>
        </el-row>
      </el-main>
    </el-container>
  </transition>
</template>

<script>
import DataSourceArticles from '@/components/Editor/DataSourceArticles.vue'

export default {
  name: 'DataSourceSetup',
  components: {
    DataSourceArticles,
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
          alert: {entity: '数据源', showError: true},
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
        alert: {entity: '数据源', action: '添加', showError: true, showSuccess: true},
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
        alert : {entity: '数据源', action: '修改', showError: true, showSuccess: true},
      });
      if (!apiRes.ok) return;

      // await this.loadData();
      this.$store.commit('updateDataSourceListSyncTime');
    },
    async deleteData() {
      try {
        await this.$confirm('删除数据源可能导致已经引用当前数据源的脚本无法正常执行<hr class="br">是否确认删除？', '删除数据源', {
          dangerouslyUseHTMLString: true,
          confirmButtonText: '确认删除',
          cancelButtonText: '取消',
          type: 'warning',
        });

      } catch(err) {
        return; // 取消操作
      }

      let apiRes = await this.T.callAPI('/api/v1/data-sources/:id/do/delete', {
        params: {id: this.$route.params.id},
        alert : {entity: '数据源', action: '删除', showError: true},
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
        alert : {entity: '数据源', action: '测试', showError: true},
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
              if (value.slice(0, 3) === 'df_') {
                return callback(new Error('ID不能以"df_"开头，"df_"为内置数据源的统一前缀'));
              }
              return callback();
            },
          },
        ],
        type: [
          {
            trigger : 'change',
            message : '请选择数据源类型',
            required: true,
          },
        ],
        'configJSON.host': [
          {
            trigger : 'change',
            message : '请输入主机地址',
            required: true,
          },
        ],
        'configJSON.port': [
          {
            trigger : 'change',
            message : '请输入主机端口',
            required: true,
          },
          {
            trigger: 'change',
            validator: (rule, value, callback) => {
              if (!value) return callback();

              value = parseInt(value);
              if (value < 1 || value > 65535) {
                return callback(new Error('主机端口范围为 1-65535'));
              }
              return callback();
            },
          },
        ],
        'configJSON.servers': [
          {
            trigger : 'change',
            message : '请输入服务器列表',
            required: true,
          }
        ],
        'configJSON.protocol': [
          {
            trigger : 'change',
            message : '请输入HTTP协议',
            required: true,
          },
          {
            trigger: 'change',
            message: '协议只能为HTTP或HTTPS',
            type   : 'enum',
            enum   : ['http', 'https'],
          },
        ],
        'configJSON.database': [
          {
            trigger : 'change',
            message : '请输入数据库名',
            required: false,
          },
        ],
        'configJSON.user': [
          {
            trigger : 'change',
            message : '请输入用户名',
            required: false,
          },
        ],
        'configJSON.password': [
          {
            trigger : 'change',
            message : '请输入密码',
            required: false,
          },
        ],
        'configJSON.charset': [
          {
            trigger : 'change',
            message : '请输入字符集',
            required: false,
          },
        ],
        'configJSON.accessKey': [
          {
            trigger : 'change',
            message : '请输入Access Key',
            required: false,
          },
        ],
        'configJSON.secretKey': [
          {
            trigger : 'change',
            message : '请输入Secret Key',
            required: false,
          },
        ],
        'configJSON.clientId': [
          {
            trigger : 'change',
            message : '请输入客户端ID',
            required: false,
          },
        ],
      },
      formRules_topicHandler: {
        trigger: 'change',
        validator: (rule, value, callback) => {
          switch(this.selectedType) {
            case 'mqtt':
              if (this.T.isNothing(value.topic)) {
                return callback(new Error('请输入订阅主题，建议使用共享订阅方式，如：MQTTv5协议的 $share/g/topic，或EMQX的 $queue/topic'));
              }
              if (this.T.isNothing(value.funcId)) {
                return callback(new Error('请选择处理函数'));
              }
              break;

            default:
              if (this.T.isNothing(value.topic)) {
                return callback(new Error('请输入订阅主题'));
              }
              if (this.T.isNothing(value.funcId)) {
                return callback(new Error('请选择处理函数'));
              }
              break;
          }

          return callback();
        },
      },

      testDataSourceResult: null,
    }
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.func-cascader-input {
  width: 400px;
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
