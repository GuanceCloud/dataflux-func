<i18n locale="zh-CN" lang="yaml">
Add Connector  : 添加连接器
Setup Connector: 配置连接器

Compatibility               : 兼容性
Connector Development Doc   : 连接器开发文档
Python SDK used by Connector: 连接器所使用的 Python SDK
Node SDK used by Subscriber : 订阅器所使用的 Node SDK
Guance Node                 : 观测云节点
Name in Guance              : 观测云中名称
OpenAPI URL                 : OpenAPI 地址
WebSocket URL               : WebSocket 地址
OpenWay URL                 : OpenWay 地址
API Key ID                  : API Key ID
API Key                     : API Key
Host                        : 主机
Port                        : 端口
Servers                     : 服务器列表
Protocol                    : 协议
Source                      : 源
Database                    : 数据库
User                        : 用户
Password                    : 密码
Auth Type                   : 认证类型
Charset                     : 编码
Client ID                   : 客户端 ID
Group ID                    : 分组 ID
Security Protocol           : 安全协议
SASL Mechanisms             : SASL 机制
Multi Sub                   : 多订阅器
Sub Offset                  : 订阅 Offset
'Topic/Handler'             : 主题 / 处理函数
Topic                       : 主题
Handler Func                : 处理函数
No Recent Message           : 无近期消息
Recent Message              : 近期消息
'Add Topic / Handler'       : 添加主题 / 处理函数
Test connection             : 测试连通性

Received Time   : 接收时间
Received Message: 接收消息
Func Return     : 函数返回值
Traceback       : 调用堆栈

Save without connection test: 保存（忽略连通性测试）

This Title will also be displayed in Guance                                     : 这个标题同时也会展示在观测云中
'Servers to connect (e.g. host1:80,host2:81)'                                   : 连接地址列表，如：host1:80,host2:81
Password here is always required when the Connector requires password to connect: 如连接器需要密码，则每次修改都必须重新输入密码
API Key here is always required                                                 : 每次修改都必须重新输入 API Key
'1. $share/GROUP/TOPIC in MQTTv5'                                               : '1. MQTTv5 的 $share/GROUP/TOPIC'
'2. $queue/TOPIC in EMQX'                                                       : '2. EMQX 的 $queue/TOPIC'

Please input ID                                      : 请输入 ID
Only alphabets, numbers and underscore are allowed   : 只能包含大小写英文、数字及下划线
Cannot not starts with a number                      : 不得以数字开头
Please input Connector type                          : 请选择连接器类型
Please select Guance Node                            : 请选择观测云节点
Please input OpenAPI URL                             : 请输入 OpenAPI 地址
Please input Websocket URL                           : 请输入 WebSocket 地址
Please input OpenWay URL                             : 请输入 OpenWay 地址
Please input API Key ID                              : 请输入 API Key ID
Please input API Key                                 : 请输入 API Key
'Should start with http:// or https://'              : '必须以 http:// 或 https:// 开头'
Please input host                                    : 请输入主机地址
Please input port                                    : 请输入主机端口
Only integer between 1 and 65535 are allowed         : 主机端口范围为 1-65535
Please input servers                                 : 请输入服务器列表
Please select HTTP protocol                          : 请选择HTTP协议
Only HTTP and HTTPS are allowed                      : 协议只能为HTTP或HTTPS
Please input source                                  : 请输入连接器名称
Please input database                                : 请输入数据库名
Please input user                                    : 请输入用户名
Please input password                                : 请输入密码
Please input auth type                               : 请输入认证方式
Please input charset                                 : 请输入字符集
Please input Access Key                              : 请输入Access Key
Please input Secret Key                              : 请输入Secret Key
Please input client ID                               : 请输入客户端 ID
Please input topic                                   : 请输入订阅主题
Please select handler Func                           : 请选择处理函数

Connector created: 连接器已创建
Connector saved  : 连接器已保存
Connector deleted: 连接器已删除

Are you sure you want to delete the Connector?: 是否确认删除此连接器？

Learn more about subscribing using Connector: 了解通过连接器进行订阅
This is a built-in Connector, please contact the admin to change the config: 当前连接器为内置连接器，请联系管理员调整集群配置
</i18n>

<template>
  <el-dialog
    id="ScriptSetSetup"
    :visible.sync="show"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    width="750px">

    <template slot="title">
      {{ pageTitle }} <code class="text-main">{{ data.title || data.id }}</code>
    </template>

    <el-container direction="vertical">
      <el-main>
        <div class="setup-form">
          <el-form ref="form" label-width="135px" :model="form" :disabled="data.isBuiltin" :rules="formRules">
            <!-- Fake user/password -->
            <el-form-item style="height: 0; overflow: hidden">
              <input tabindex="-1" type="text" name="username" />
              <input tabindex="-1" type="password" name="password" />
            </el-form-item>

            <el-form-item v-if="data.isBuiltin">
              <InfoBlock type="error" :title="$t('This is a built-in Connector, please contact the admin to change the config')" />
            </el-form-item>

            <el-form-item :label="$t('Type')" prop="type" v-if="pageMode === 'add'">
              <el-select
                v-model="form.type"
                @change="switchType"
                filterable
                :filter-method="T.debounce(doFilter)">
                <el-option v-for="opt in selectShowOptions" :label="opt.fullName" :key="opt.key" :value="opt.key"></el-option>
              </el-select>
            </el-form-item>
            <el-form-item :label="$t('Type')" v-else>
              <el-select v-model="selectedType" :disabled="true">
                <el-option :label="C.CONNECTOR_MAP.get(selectedType).fullName" :value="selectedType"></el-option>
              </el-select>
            </el-form-item>

            <template v-if="selectedType">
              <el-form-item v-if="C.CONNECTOR_MAP.get(selectedType).logo">
                <el-image class="connector-logo" :class="[`logo-${selectedType}`]" :src="C.CONNECTOR_MAP.get(selectedType).logo"></el-image>
              </el-form-item>

              <el-form-item v-if="C.CONNECTOR_MAP.get(selectedType).tips">
                <InfoBlock type="info" :title="C.CONNECTOR_MAP.get(selectedType).tips" />
              </el-form-item>

              <el-form-item :label="$t('Compatibility')" v-if="T.notNothing(C.CONNECTOR_MAP.get(selectedType).compatibleDBs)">
                <el-tag type="info" size="medium" :disable-transitions="true" v-for="db in C.CONNECTOR_MAP.get(selectedType).compatibleDBs" :key="db">{{ db }}</el-tag>
              </el-form-item>

              <el-form-item v-if="C.CONNECTOR_MAP.get(selectedType).links">
                <template v-if="C.CONNECTOR_MAP.get(selectedType).links.doc">
                  <el-link :href="C.CONNECTOR_MAP.get(selectedType).links.doc" target="_blank">
                    <i class="fa fa-fw fa-external-link"></i>
                    {{ $t('Connector Development Doc') }}
                  </el-link>
                  <br>
                </template>
                <template v-if="C.CONNECTOR_MAP.get(selectedType).links.pypi">
                  <el-link :href="C.CONNECTOR_MAP.get(selectedType).links.pypi" target="_blank">
                    <i class="fa fa-fw fa-external-link"></i>
                    {{ $t('Python SDK used by Connector') }}
                  </el-link>
                  <br>
                </template>
                <template v-if="C.CONNECTOR_MAP.get(selectedType).links.npm">
                  <el-link :href="C.CONNECTOR_MAP.get(selectedType).links.npm" target="_blank">
                    <i class="fa fa-fw fa-external-link"></i>
                    {{ $t('Node SDK used by Subscriber') }}
                  </el-link>
                  <br>
                </template>
              </el-form-item>

              <el-form-item label="ID" prop="id">
                <el-input :disabled="pageMode === 'setup'"
                  maxlength="60"
                  v-model="form.id"></el-input>
              </el-form-item>

              <el-form-item :label="$t('Title')">
                <el-input :placeholder="$t('Optional')"
                  maxlength="200"
                  v-model="form.title"></el-input>
                <InfoBlock v-if="selectedType === 'guance'" type="info" :title="$t('This Title will also be displayed in Guance')" />
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
              <el-form-item :label="$t('Guance Node')" v-if="hasConfigField(selectedType, 'guanceNode')" prop="configJSON.guanceNode">
                <el-select v-model="form.configJSON.guanceNode" @change="switchGuanceNode">
                  <el-option v-for="node in guanceNodes"
                    :label="node[`name_${$i18n.locale}`] || node.name" :key="node.key" :value="node.key"></el-option>
                </el-select>
              </el-form-item>
              <el-form-item :label="$t('OpenAPI URL')" v-show="form.configJSON.guanceNode === 'private'" v-if="hasConfigField(selectedType, 'guanceOpenAPIURL')" prop="configJSON.guanceOpenAPIURL">
                <el-input
                  v-model="form.configJSON.guanceOpenAPIURL"></el-input>
              </el-form-item>
              <el-form-item :label="$t('WebSocket URL')" v-show="form.configJSON.guanceNode === 'private'" v-if="hasConfigField(selectedType, 'guanceWebSocketURL')" prop="configJSON.guanceWebSocketURL">
                <el-input
                  v-model="form.configJSON.guanceWebSocketURL"></el-input>
              </el-form-item>
              <el-form-item :label="$t('OpenWay URL')" v-show="form.configJSON.guanceNode === 'private'" v-if="hasConfigField(selectedType, 'guanceOpenWayURL')" prop="configJSON.guanceOpenWayURL">
                <el-input
                  v-model="form.configJSON.guanceOpenWayURL"></el-input>
              </el-form-item>
              <el-form-item :label="$t('API Key ID')" v-if="hasConfigField(selectedType, 'guanceAPIKeyId')" prop="configJSON.guanceAPIKeyId">
                <el-input
                  v-model="form.configJSON.guanceAPIKeyId"></el-input>
              </el-form-item>
              <el-form-item :label="$t('API Key')" v-if="hasConfigField(selectedType, 'guanceAPIKey')" prop="configJSON.guanceAPIKey">
                <el-input
                  v-model="form.configJSON.guanceAPIKey" show-password></el-input>
                <InfoBlock v-if="pageMode === 'setup'" type="info" :title="$t('API Key here is always required')" />
              </el-form-item>

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
                <InfoBlock type="info" :title="$t('Servers to connect (e.g. host1:80,host2:81)')" />
              </el-form-item>

              <el-form-item :label="$t('Protocol')" v-if="hasConfigField(selectedType, 'protocol')" prop="configJSON.protocol">
                <el-select v-model="form.configJSON.protocol">
                  <el-option label="HTTP" key="http" value="http"></el-option>
                  <el-option label="HTTPS" key="https" value="https"></el-option>
                </el-select>
              </el-form-item>

              <el-form-item :label="$t('Security Protocol')" v-if="hasConfigField(selectedType, 'securityProtocol')" prop="configJSON.securityProtocol">
                <el-input
                  v-model="form.configJSON.securityProtocol"></el-input>
              </el-form-item>

              <el-form-item :label="$t('SASL Mechanisms')" v-if="hasConfigField(selectedType, 'saslMechanisms')" prop="configJSON.saslMechanisms">
                <el-input
                  v-model="form.configJSON.saslMechanisms"></el-input>
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
                <InfoBlock v-if="!data.isBuiltin && pageMode === 'setup'" type="info" :title="$t('Password here is always required when the Connector requires password to connect')" />
              </el-form-item>

              <el-form-item :label="$t('Auth Type')" v-if="hasConfigField(selectedType, 'authType')" prop="configJSON.authType">
                <el-select v-model="form.configJSON.authType">
                  <el-option v-if="selectedType === 'redis'" :label="$t('Default')" key="default" value="default"></el-option>
                  <el-option v-if="selectedType === 'redis'" :label="$t('Alibaba Cloud')" key="aliyun" value="aliyun"></el-option>
                </el-select>
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
                  v-model="form.configJSON.secretKey" show-password></el-input>
              </el-form-item>

              <el-form-item :label="$t('Client ID')" v-if="hasConfigField(selectedType, 'clientId')" prop="configJSON.clientId">
                <el-input
                  v-model="form.configJSON.clientId"></el-input>
              </el-form-item>

              <el-form-item :label="$t('Group ID')" v-if="hasConfigField(selectedType, 'groupId')" prop="configJSON.groupId">
                <el-input
                  v-model="form.configJSON.groupId"></el-input>
              </el-form-item>

              <el-form-item :label="$t('Multi Sub')" v-if="hasConfigField(selectedType, 'multiSubClient')" prop="configJSON.multiSubClient">
                <el-select v-model="form.configJSON.multiSubClient">
                  <el-option :label="$t('Enabled')" key="enabled" :value="true"></el-option>
                  <el-option :label="$t('Disabled')" key="disabled" :value="false"></el-option>
                </el-select>
              </el-form-item>

              <el-form-item :label="$t('Sub Offset')" v-if="hasConfigField(selectedType, 'kafkaSubOffset')" prop="configJSON.kafkaSubOffset">
                <el-select v-model="form.configJSON.kafkaSubOffset">
                  <el-option label="smallest" key="smallest" value="smallest"></el-option>
                  <el-option label="earliest" key="earliest" value="earliest"></el-option>
                  <el-option label="beginning" key="beginning" value="beginning"></el-option>
                  <el-option label="largest" key="largest" value="largest"></el-option>
                  <el-option label="latest" key="latest" value="latest"></el-option>
                  <el-option label="end" key="end" value="end"></el-option>
                </el-select>
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
                    class="func-cascader-input"
                    :key="`handler-${index}`"
                    :prop="`configJSON.topicHandlers.${index}.funcId`"
                    :rules="formRules_topicHandler">
                    <el-cascader ref="funcCascader"
                      popper-class="code-font"
                      placeholder="--"
                      filterable
                      :filter-method="common.funcCascaderFilter"
                      :placeholder="$t('Handler Func')"
                      v-model="topicHandler.funcId"
                      :options="funcCascader"
                      :props="{ expandTrigger: 'hover', emitPath: false, multiple: false }"></el-cascader>

                    <!-- 最近消费提示 -->
                    <el-link v-if="subInfoMap[topicHandler.topic]"
                      :type="subInfoMap[topicHandler.topic].error ? 'danger' : 'success'"
                      @click="showDetail(subInfoMap[topicHandler.topic])">
                      <i class="fa fa-fw" :class="subInfoMap[topicHandler.topic].error ? 'fa-times text-bad' : 'fa-check text-good'"></i>
                      {{ $t('Recent Message') }}{{ $t(':') }}
                      {{ T.getDateTimeString(subInfoMap[topicHandler.topic].timestampMs, 'MM-DD HH:mm:ss') }}
                      {{ $t('(') }}{{ T.fromNow(subInfoMap[topicHandler.topic].timestampMs) }}{{ $t(')') }}
                    </el-link>
                    <el-link v-else
                      type="info"
                      :underline="false">
                      {{ $t('No Recent Message') }}
                    </el-link>
                  </el-form-item>

                  <el-form-item class="config-divider">
                    <el-divider></el-divider>
                  </el-form-item>
                </template>
                <el-form-item>
                  <el-link
                    type="primary"
                    @click="addTopicHandler">
                    <i class="fa fa-fw fa-plus"></i>
                    {{ $t('Add Topic / Handler') }}
                  </el-link>
                  <br>
                  <el-link
                    href="https://func.guance.com/doc/development-guide-connector-subscribe/"
                    target="_blank">
                    <i class="fa fa-fw fa-external-link"></i>
                    {{ $t('Learn more about subscribing using Connector') }}
                  </el-link>
                </el-form-item>
              </template>
              <!-- 可变区域结束 -->

              <el-form-item class="setup-footer">
                <el-button class="delete-button" v-if="pageMode === 'setup' && !data.isBuiltin" @click="deleteData">{{ $t('Delete') }}</el-button>
                <el-button v-if="pageMode === 'setup'" @click="testConnector"
                  :disabled="testConnectorResult === 'running'">
                  <i class="fa fa-fw fa-check text-good" v-if="testConnectorResult === 'ok'"></i>
                  <i class="fa fa-fw fa-times text-bad" v-else-if="testConnectorResult === 'ng'"></i>
                  <i class="fa fa-fw fa-circle-o-notch fa-spin" v-else-if="testConnectorResult === 'running'"></i>
                  <i class="fa fa-fw fa-question-circle" v-else></i>
                  {{ $t('Test connection') }}
                </el-button>
                <el-dropdown split-button v-if="!data.isBuiltin" type="primary" @click="submitData" @command="submitData"
                  :disabled="isSaving">
                  <i class="fa fa-fw fa-circle-o-notch fa-spin" v-if="isSaving"></i>
                  {{ $t('Save') }}
                  <el-dropdown-menu slot="dropdown">
                    <el-dropdown-item :command="{ skipTest: true }">{{ $t('Save without connection test') }}</el-dropdown-item>
                  </el-dropdown-menu>
                </el-dropdown>
              </el-form-item>
            </template>
          </el-form>
        </div>
      </el-main>

      <LongTextDialog :showDownload="true" ref="longTextDialog" />

      <!-- 连接器提示 -->
      <FeatureNoticeDialog
        featureKey="connector.funcIsJustPythonWarpper"
        :description="$t('FeatureNotice_funcIsJustPythonWarpper')"
        icon="fa-warning"
        :image="img_noticeFuncIsJustPythonWrapper" />

    </el-container>
  </el-dialog>
</template>

<script>
import axios from 'axios';

import LongTextDialog from '@/components/LongTextDialog'
import FeatureNoticeDialog from '@/components/FeatureNoticeDialog'
import img_noticeFuncIsJustPythonWrapper from '@/assets/img/notice-func-is-just-python-wrapper.png'

export default {
  name: 'ConnectorSetup',
  components: {
    LongTextDialog,
    FeatureNoticeDialog,
  },
  watch: {
    selectedType: {
      immediate: true,
      async handler(newVal) {
        // 获取观测云节点信息
        if (newVal === 'guance' && this.T.isNothing(this.guanceNodes)) {
          let guanceNodes = this.$store.getters.SYSTEM_INFO('GUANCE_NODES');

          this.guanceNodes   = guanceNodes;
          this.guanceNodeMap = guanceNodes.reduce((acc, node) => {
            acc[node.key] = node;
            return acc;
          }, {});
        }
      },
    },
  },
  methods: {
    doFilter(q) {
      q = (q || '').toLowerCase().trim();
      if (!q) {
        this.selectShowOptions = this.SUPPORTED_CONNECTORS;
      } else {
        this.selectShowOptions = this.T.filterByKeywords(q, this.SUPPORTED_CONNECTORS);
      }
    },

    updateValidator(type) {
      if (this.$refs.form) {
        this.$refs.form.clearValidate();
      }

      let fieldMap = this.C.CONNECTOR_MAP.get(type).configFields;
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
      let fieldMap = this.C.CONNECTOR_MAP.get(type).configFields;
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
      this.fillDefault(type);
      this.updateValidator(type);
    },
    switchGuanceNode(nodeKey) {
      let nextConfigJSON = this.T.jsonCopy(this.form.configJSON);

      let _node = this.T.jsonCopy(this.guanceNodeMap[nodeKey]);
      nextConfigJSON.guanceOpenAPIURL   = _node.openapi;
      nextConfigJSON.guanceWebSocketURL = _node.websocket;
      nextConfigJSON.guanceOpenWayURL   = _node.openway;

      this.form.configJSON = nextConfigJSON;
    },
    unpackURL() {
      if (!this.form || !this.form.configJSON || !this.form.configJSON.host) return;

      let parsedURL = null;
      try { parsedURL = new URL(this.form.configJSON.host) } catch(err) { /* Nope */ }

      // 非URL地址不处理
      if (!parsedURL || parsedURL.hostname == this.form.configJSON.host) return;

      // 没有对应支持不处理
      let fieldMap = this.C.CONNECTOR_MAP.get(this.selectedType).configFields;
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
    async loadData(id) {
      if (!id) {
        this.pageMode = 'add';
        this.T.jsonClear(this.form);
        this.form.configJSON = {};
        this.data = {};

      } else {
        this.pageMode = 'setup';
        this.data.id = id;

        let apiRes = await this.T.callAPI_getOne('/api/v1/connectors/do/list', this.data.id);
        if (!apiRes || !apiRes.ok) return;

        this.data = apiRes.data;

        let nextForm = {};
        Object.keys(this.form).forEach(f => nextForm[f] = this.data[f]);
        this.form = nextForm;

        this.testConnectorResult = null;

        this.updateValidator(this.data.type);

        // 获取订阅信息
        await this.updateSubInfo();
      }

      // 获取函数列表
      let funcList = await this.common.getFuncList();

      this.funcMap           = funcList.map;
      this.funcCascader      = funcList.cascader;
      this.selectShowOptions = this.SUPPORTED_CONNECTORS;

      this.show = true;
    },
    async updateSubInfo() {
      if (!this.data.id) return;

      let hasTopicHandler = false;
      try {
        hasTopicHandler = this.T.notNothing(this.form.configJSON.topicHandlers);
      } catch(err) {
        // Nope;
      }
      if (!hasTopicHandler) return;

      let apiRes = await this.T.callAPI_get('/api/v1/connector-sub-info/do/list', { query: { connectorId: this.data.id }});
      if (!apiRes || !apiRes.ok) return;

      let subInfoMap = apiRes.data.reduce((acc, x) => {
        acc[x.topic] = x.consumeInfo;
        return acc;
      }, {});
      this.subInfoMap = subInfoMap;
    },
    async submitData(opt) {
      try {
        await this.$refs.form.validate();
      } catch(err) {
        return console.error(err);
      }

      this.isSaving = true;

      switch(this.pageMode) {
        case 'add':
          await this.addData(opt);
          break;

        case 'setup':
          await this.modifyData(opt);
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
    async addData(opt) {
      opt = opt || {};

      let _formData = this._getFromData();

      // 服务器列表字段自动合并换行
      if ('string' === typeof _formData.configJSON.servers) {
        _formData.configJSON.servers = _formData.configJSON.servers.replace(/\n/g, ',').replace(/\s/g, '');
      }

      let apiRes = await this.T.callAPI('post', '/api/v1/connectors/do/add', {
        body : { data: _formData, skipTest: !!opt.skipTest },
        alert: { okMessage: this.$t('Connector created') },
      });
      if (!apiRes || !apiRes.ok) return;

      this.$store.commit('updateConnectorListSyncTime');
      this.show = false;
    },
    async modifyData(opt) {
      opt = opt || {};

      let _formData = this._getFromData();
      delete _formData.id;
      delete _formData.type;

      let apiRes = await this.T.callAPI('post', '/api/v1/connectors/:id/do/modify', {
        params: { id: this.data.id },
        body  : { data: _formData, skipTest: !!opt.skipTest },
        alert : { okMessage: this.$t('Connector saved') },
      });
      if (!apiRes || !apiRes.ok) return;

      this.$store.commit('updateConnectorListSyncTime');
      this.show = false;
    },
    async deleteData() {
      if (!await this.T.confirm(this.$t('Are you sure you want to delete the Connector?'))) return;

      let apiRes = await this.T.callAPI('/api/v1/connectors/:id/do/delete', {
        params: { id: this.data.id },
        alert : { okMessage: this.$t('Connector deleted') },
      });
      if (!apiRes || !apiRes.ok) return;

      this.$store.commit('updateConnectorListSyncTime');
      this.show = false;
    },
    async testConnector() {
      this.testConnectorResult = 'running';

      let apiRes = await this.T.callAPI_get('/api/v1/connectors/:id/do/test', {
        params: { id: this.data.id },
      });
      setTimeout(() => {
        if (apiRes.ok) {
          this.testConnectorResult = 'ok';
        } else {
          this.testConnectorResult = 'ng';
        }
      }, 500);
    },
    hasConfigField(type, field) {
      if (!this.C.CONNECTOR_MAP.get(type) || !this.C.CONNECTOR_MAP.get(type).configFields) {
        return false;
      }
      return (field in this.C.CONNECTOR_MAP.get(type).configFields);
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

    showDetail(d) {
      let lines = [];

      // 主题
      lines.push(`===== ${this.$t('Topic')} =====`);
      lines.push(d.topic);

      // 收到时间
      lines.push(`\n===== ${this.$t('Received Time')} =====`);
      lines.push(this.M(d.timestampMs).format('YYYY-MM-DD HH:mm:ss Z'));

      // 收到消息
      lines.push(`\n===== ${this.$t('Received Message')} =====`);
      lines.push(d.message);

      // 函数返回
      lines.push(`\n===== ${this.$t('Func Return')} =====`)
      lines.push(JSON.stringify(d.funcResult, null, 2));

      // 堆栈
      lines.push(`\n===== ${this.$t('Traceback')} =====`);
      if (d.error && d.error.detail && d.error.detail.traceback) {
        lines.push(d.error.detail.traceback);
      } else {
        lines.push(this.$t('No Traceback'))
      }

      let docText = lines.join('\n');

      let createTimeStr = this.M(d.timestampMs).format('YYYYMMDD_HHmmss');
      let fileName = `connector-sub-dump.${d.connectorId}.${d.topic}.${createTimeStr}`;
      this.$refs.longTextDialog.update(docText, fileName);
    },
  },
  computed: {
    SUPPORTED_CONNECTORS() {
      let connectorTypes = this.C.CONNECTOR.filter(opt => {
        // 部分连接器特殊处理
        switch (opt.key) {
          case 'sqlserver':
            return this.$store.getters.SYSTEM_INFO('ARCHITECTURE') === 'x86_64';
            break;

          case 'oracle':
            return this.$store.getters.SYSTEM_INFO('LINUX_DISTRO') !== 'UniontechOS';
            break;

          default:
            return true;
        }
      });

      // 添加搜索字段
      connectorTypes.forEach(c => {
        this.T.appendSearchFields(c, ['key', 'name', 'fullName']);
      });

      return connectorTypes;
    },
    pageTitle() {
      const _map = {
        setup: this.$t('Setup Connector'),
        add  : this.$t('Add Connector'),
      };
      return _map[this.pageMode];
    },
    selectedType() {
      switch(this.pageMode) {
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
      show    : false,
      pageMode: null,

      data        : {},
      subInfoMap  : {},
      funcMap     : {},
      funcCascader: [],

      selectShowOptions: [],

      guanceNodes  : [],
      guanceNodeMap: {},

      form: {
        id         : null,
        title      : null,
        type       : null,
        description: null,
        configJSON : {},
      },
      formRules: {
        id: [
          {
            trigger : 'blur',
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
            trigger : 'blur',
            message : this.$t('Please input Connector type'),
            required: true,
          },
        ],

        'configJSON.guanceNode': [
          {
            trigger : 'blur',
            message : this.$t('Please select Guance Node'),
            required: true,
          },
        ],
        'configJSON.guanceOpenAPIURL': [
          {
            trigger : 'blur',
            message : this.$t('Please input OpenAPI URL'),
            required: true,
          },
          {
            trigger: 'change',
            message: this.$t('Should start with http:// or https://'),
            pattern: this.C.RE_PATTERN.httpURL,
          },
        ],
        'configJSON.guanceWebSocketURL': [
          {
            trigger : 'blur',
            message : this.$t('Please input Websocket URL'),
            required: true,
          },
          {
            trigger: 'change',
            message: this.$t('Should start with http:// or https://'),
            pattern: this.C.RE_PATTERN.httpURL,
          },
        ],
        'configJSON.guanceOpenWayURL': [
          {
            trigger : 'blur',
            message : this.$t('Please input OpenWay URL'),
            required: true,
          },
          {
            trigger: 'change',
            message: this.$t('Should start with http:// or https://'),
            pattern: this.C.RE_PATTERN.httpURL,
          },
        ],
        'configJSON.guanceAPIKeyId': [
          {
            trigger : 'blur',
            message : this.$t('Please input API Key ID'),
            required: true,
          },
        ],
        'configJSON.guanceAPIKey': [
          {
            trigger : 'blur',
            message : this.$t('Please input API Key'),
            required: true,
          },
        ],

        'configJSON.host': [
          {
            trigger : 'blur',
            message : this.$t('Please input host'),
            required: true,
          },
        ],
        'configJSON.port': [
          {
            trigger : 'blur',
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
            trigger : 'blur',
            message : this.$t('Please input servers'),
            required: true,
          }
        ],
        'configJSON.protocol': [
          {
            trigger : 'blur',
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
            trigger : 'blur',
            message : this.$t('Please input source'),
            required: false,
          },
        ],
        'configJSON.database': [
          {
            trigger : 'blur',
            message : this.$t('Please input database'),
            required: false,
          },
        ],
        'configJSON.user': [
          {
            trigger : 'blur',
            message : this.$t('Please input user'),
            required: false,
          },
        ],
        'configJSON.password': [
          {
            trigger : 'blur',
            message : this.$t('Please input password'),
            required: false,
          },
        ],
        'configJSON.authType': [
          {
            trigger : 'blur',
            message : this.$t('Please input auth type'),
            required: false,
          },
        ],
        'configJSON.charset': [
          {
            trigger : 'blur',
            message : this.$t('Please input charset'),
            required: false,
          },
        ],
        'configJSON.token': [
          {
            trigger : 'blur',
            message : this.$t('Please input token'),
            required: false,
          },
        ],
        'configJSON.accessKey': [
          {
            trigger : 'blur',
            message : this.$t('Please input Access Key'),
            required: false,
          },
        ],
        'configJSON.secretKey': [
          {
            trigger : 'blur',
            message : this.$t('Please input Secret Key'),
            required: false,
          },
        ],
        'configJSON.clientId': [
          {
            trigger : 'blur',
            message : this.$t('Please input client ID'),
            required: false,
          },
        ],
        'configJSON.groupId': [
          {
            trigger : 'blur',
            message : this.$t('Please input group ID'),
            required: false,
          },
        ],
        'configJSON.securityProtocol': [
          {
            trigger : 'blur',
            message : this.$t('Please input security protocol'),
            required: false,
          },
        ],
        'configJSON.saslMechanisms': [
          {
            trigger : 'blur',
            message : this.$t('Please input SASL Mechanisms'),
            required: false,
          },
        ],
        'configJSON.multiSubClient': [
          {
            trigger : 'blur',
            message : this.$t('Please select if Multi Sub allowed'),
            required: false,
          },
        ],
        'configJSON.kafkaSubOffset': [
          {
            trigger : 'blur',
            message : this.$t('Please input Sub Offset'),
            required: false,
          },
        ],
      },
      formRules_topic: {
        trigger: 'blur',
        message : this.$t('Please input topic'),
        required: true,
      },
      formRules_topicHandler: {
        trigger: 'blur',
        message : this.$t('Please select handler Func'),
        required: true,
      },

      isSaving           : false,
      testConnectorResult: null,

      // Func 只是 Python 包装提示
      img_noticeFuncIsJustPythonWrapper: img_noticeFuncIsJustPythonWrapper,
    }
  },
  mounted() {
    this.autoRefreshTimer = setInterval(() => {
      this.updateSubInfo();
    }, 5 * 1000);
  },
  beforeDestroy() {
    if (this.autoRefreshTimer) clearInterval(this.autoRefreshTimer);
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.topic-handler .el-input,
.func-cascader-input .el-cascader,
.recent-message .form-tip {
  width: 420px !important;
}
.topic-handler .el-link {
  float: right;
}
</style>
<style>
.connector-logo img {
  width: auto;
}
.connector-logo.logo-guance {
  height: 100px !important;
}
.connector-logo.logo-df_dataway {
}
.connector-logo.logo-df_datakit {
}
.connector-logo.logo-influxdb {
  height: 60px !important;
}
.connector-logo.logo-mysql {
  height: 100px !important;
}
.connector-logo.logo-redis {
  height: 70px !important;
}
.connector-logo.logo-memcached {
  height: 70px !important;
}
.connector-logo.logo-clickhouse {
  height: 90px !important;
}
.connector-logo.logo-oracle {
  height: 30px !important;
}
.connector-logo.logo-sqlserver {
  height: 60px !important;
}
.connector-logo.logo-postgresql {
  height: 80px !important;
}
.connector-logo.logo-mongodb {
  height: 70px !important;
}
.connector-logo.logo-elasticsearch {
  height: 60px !important;
}
.connector-logo.logo-nsq {
  height: 90px !important;
}
.connector-logo.logo-mqtt {
  height: 60px !important;
}
.connector-logo.logo-kafka {
  height: 90px !important;
}
</style>
