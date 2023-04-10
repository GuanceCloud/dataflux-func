<i18n locale="zh-CN" lang="yaml">
Experimental Features that have not been officially released can be enabled here, configuration is only saved locally in the browser.: 一些尚未正式公开的实验性功能可在本页面开启，本页面配置仅保存在浏览器本地

Enable Blueprint: 启用蓝图
For developing Scripts graphically: 用于图形化方式开发脚本
Once enabled, it can be accessed from Navigation Bar {0} Blueprint: 启用后，可在顶部「导航栏」{0}「蓝图」进入

Enable PIP Tool: 启用 PIP 工具
For installing 3rd-party Python package: 用于安装第三方 Python 包
Once enabled, it can be accessed from Management page {0} PIP tool: 启用后，可在「管理」{0}「PIP 工具」进入

Enable File Manage: 启用文件管理
For managing files on the server side: 用于管理服务器端文件
Once enabled, it can be accessed from Management page {0} File Manage: 启用后，可在「管理」{0}「文件管理」进入

Enable File Service: 启用文件服务
For serving resource directories as file services: 用于将资源目录提供为文件服务
Once enabled, it can be accessed from Management page {0} File Service: 启用后，可在「管理」{0}「文件服务」进入

Enable Func Cache Manage: 启用函数缓存管理
For managing cached data from Scripts: 用于管理脚本产生的缓存数据
Once enabled, it can be accessed from Management page {0} Func Cache Manage: 启用后，可在「管理」{0}「函数缓存管理」进入

Enable Func Store Manage: 启用函数存储管理
For managing stored data from Scripts: 用于管理脚本产生的存储数据
Once enabled, it can be accessed from Management page {0} Func Store Manage: 启用后，可在「管理」{0}「函数存储管理」进入

Enable Func Doc: 启用函数文档
Document page for all exported Python functions and Auth Links: 函数的文档，包含所有导出的 Python 函数和授权链接
Once enabled, it can be accessed from Management page {0} Func Doc / Auth Link Doc: 启用后，可在「管理」{0}「函数文档 / 授权链接文档」进入

Enable Open API Doc: 启用 Open API 文档
Document page for Open API powered by Swagger: 基于 Swagger 的 Open API 文档
Once enabled, it can be accessed from Management page {0} Open API Doc: 启用后，可在「管理」{0}「Open API 文档」进入

Enable System Status Page: 启用系统状态查看页面
Status Page for current system: 本系统状态查看页面
Once enabled, it can be accessed from Management page {0} System Status: 启用后，可在「管理」{0}「系统状态」进入

Enable System Log Page: 启用系统日志查看页面
Log Page for current system: 本系统日志查看页面
Once enabled, it can be accessed from Management page {0} System Logs: 启用后，可在「管理」{0}「系统日志」进入

Enable Abnormal Request Page: 启用异常请求查看页面
Abnormal Request Page for current system: 本系统异常请求查看页面
Once enabled, it can be accessed from Management page {0} Abnormal Requests: 启用后，可在「管理」{0}「异常请求」进入

Enable Script Log Page: 启用脚本日志查看页面
Log Page for Script runtime: 脚本运行时日志查看页面
Once enabled, it can be accessed from Management page {0} Script Logs: 启用后，可在「管理」{0}「脚本日志」进入

Enable Script Failure Page: 启用脚本故障查看页面
Failure Page for Script runtime: 脚本运行时故障查看页面
Once enabled, it can be accessed from Management page {0} Script Failures: 启用后，可在「管理」{0}「脚本故障」进入

Enable Access Key Manage: 启用 Access Key 管理
For allowing external systems to call Open APIs: 用于管理允许外部系统调用 DataFlux Func 的 API
Once enabled, it can be accessed from Management page {0} Access Keys: 启用后，可在「管理」{0}「Access Keys」进入

Enable Connector for Guance: 启用观测云连接器
For allowing local DataFlux Func to connect to Guance for advanced features: 用于允许本地 DataFlux Func 连接到观测云，以实现进阶功能
Once enabled, it can be accessed from Add Connector {0} type Guance: 启用后，可在「添加连接器」{0}「类型：观测云」选择
</i18n>

<template>
  <transition name="fade">
    <el-container direction="vertical" v-show="$store.state.isLoaded">
      <!-- 标题区 -->
      <el-header height="60px">
        <h1>
          {{ $t('Experimental Features') }}
        </h1>
      </el-header>

      <!-- 编辑区 -->
      <el-main>
        <el-row :gutter="20">
          <el-col :span="15">
            <div class="common-form">
              <el-form ref="form" :model="form" label-width="0px">
                <el-form-item>
                  <InfoBlock type="info" :title="$t('Experimental Features that have not been officially released can be enabled here, configuration is only saved locally in the browser.')" />
                </el-form-item>

                <el-form-item prop="Blueprint">
                  <el-switch :active-text="$t('Enable Blueprint')" v-model="form.Blueprint"></el-switch>
                  <div class="text-small form-item-tip">
                    {{ $t('For developing Scripts graphically') }}
                    <br><i18n path="Once enabled, it can be accessed from Navigation Bar {0} Blueprint"><i class="fa fa-fw fa-long-arrow-right"></i></i18n>
                  </div>
                </el-form-item>

                <br><br>

                <el-form-item prop="PIPTool">
                  <el-switch :active-text="$t('Enable PIP Tool')" v-model="form.PIPTool"></el-switch>
                  <div class="text-small form-item-tip">
                    {{ $t('For installing 3rd-party Python package') }}
                    <br><i18n path="Once enabled, it can be accessed from Management page {0} PIP tool"><i class="fa fa-fw fa-long-arrow-right"></i></i18n>
                  </div>
                </el-form-item>

                <el-form-item prop="FileManage">
                  <el-switch :active-text="$t('Enable File Manage')" v-model="form.FileManage"></el-switch>
                  <div class="text-small form-item-tip">
                    {{ $t('For managing files on the server side') }}
                    <br><i18n path="Once enabled, it can be accessed from Management page {0} File Manage"><i class="fa fa-fw fa-long-arrow-right"></i></i18n>
                  </div>
                </el-form-item>

                <el-form-item prop="FileService">
                  <el-switch :active-text="$t('Enable File Service')" v-model="form.FileService"></el-switch>
                  <div class="text-small form-item-tip">
                    {{ $t('For serving resource directories as file services') }}
                    <br><i18n path="Once enabled, it can be accessed from Management page {0} File Service"><i class="fa fa-fw fa-long-arrow-right"></i></i18n>
                  </div>
                </el-form-item>

                <el-form-item prop="FuncCacheManage">
                  <el-switch :active-text="$t('Enable Func Cache Manage')" v-model="form.FuncCacheManage"></el-switch>
                  <div class="text-small form-item-tip">
                    {{ $t('For managing cached data from Scripts') }}
                    <br><i18n path="Once enabled, it can be accessed from Management page {0} Func Cache Manage"><i class="fa fa-fw fa-long-arrow-right"></i></i18n>
                  </div>
                </el-form-item>
                <el-form-item prop="FuncStoreManage">
                  <el-switch :active-text="$t('Enable Func Store Manage')" v-model="form.FuncStoreManage"></el-switch>
                  <div class="text-small form-item-tip">
                    {{ $t('For managing stored data from Scripts') }}
                    <br><i18n path="Once enabled, it can be accessed from Management page {0} Func Store Manage"><i class="fa fa-fw fa-long-arrow-right"></i></i18n>
                  </div>
                </el-form-item>

                <el-form-item prop="FuncDoc">
                  <el-switch :active-text="$t('Enable Func Doc')" v-model="form.FuncDoc"></el-switch>
                  <div class="text-small form-item-tip">
                    {{ $t('Document page for all exported Python functions and Auth Links') }}
                    <br><i18n path="Once enabled, it can be accessed from Management page {0} Func Doc / Auth Link Doc"><i class="fa fa-fw fa-long-arrow-right"></i></i18n>
                  </div>
                </el-form-item>

                <el-form-item prop="OpenAPIDoc">
                  <el-switch :active-text="$t('Enable Open API Doc')" v-model="form.OpenAPIDoc"></el-switch>
                  <div class="text-small form-item-tip">
                    {{ $t('Document page for Open API powered by Swagger') }}
                    <br><i18n path="Once enabled, it can be accessed from Management page {0} Open API Doc"><i class="fa fa-fw fa-long-arrow-right"></i></i18n>
                  </div>
                </el-form-item>

                <el-form-item prop="SysStat">
                  <el-switch :active-text="$t('Enable System Status Page')" v-model="form.SysStat"></el-switch>
                  <div class="text-small form-item-tip">
                    {{ $t('Status Page for current system') }}
                    <br><i18n path="Once enabled, it can be accessed from Management page {0} System Status"><i class="fa fa-fw fa-long-arrow-right"></i></i18n>
                  </div>
                </el-form-item>
                <el-form-item prop="SystemLogs">
                  <el-switch :active-text="$t('Enable System Log Page')" v-model="form.SystemLogs"></el-switch>
                  <div class="text-small form-item-tip">
                    {{ $t('Log Page for current system') }}
                    <br><i18n path="Once enabled, it can be accessed from Management page {0} System Logs"><i class="fa fa-fw fa-long-arrow-right"></i></i18n>
                  </div>
                </el-form-item>
                <el-form-item prop="AbnormalReqs">
                  <el-switch :active-text="$t('Enable Abnormal Request Page')" v-model="form.AbnormalReqs"></el-switch>
                  <div class="text-small form-item-tip">
                    {{ $t('Abnormal Request Page for current system') }}
                    <br><i18n path="Once enabled, it can be accessed from Management page {0} Abnormal Requests"><i class="fa fa-fw fa-long-arrow-right"></i></i18n>
                  </div>
                </el-form-item>

                <el-form-item prop="ScriptLogs" v-if="$store.getters.CONFIG('_INTERNAL_KEEP_SCRIPT_LOG')">
                  <el-switch :active-text="$t('Enable Script Log Page')" v-model="form.ScriptLogs"></el-switch>
                  <div class="text-small form-item-tip">
                    {{ $t('Log Page for Script runtime') }}
                    <br><i18n path="Once enabled, it can be accessed from Management page {0} Script Logs"><i class="fa fa-fw fa-long-arrow-right"></i></i18n>
                  </div>
                </el-form-item>

                <el-form-item prop="ScriptFailures" v-if="$store.getters.CONFIG('_INTERNAL_KEEP_SCRIPT_FAILURE')">
                  <el-switch :active-text="$t('Enable Script Failure Page')" v-model="form.ScriptFailures"></el-switch>
                  <div class="text-small form-item-tip">
                    {{ $t('Failure Page for Script runtime') }}
                    <br><i18n path="Once enabled, it can be accessed from Management page {0} Script Failures"><i class="fa fa-fw fa-long-arrow-right"></i></i18n>
                  </div>
                </el-form-item>

                <el-form-item prop="AccessKeys" v-if="$store.getters.isAdmin">
                  <el-switch :active-text="$t('Enable Access Key Manage')" v-model="form.AccessKeys"></el-switch>
                  <div class="text-small form-item-tip">
                    {{ $t('For allowing external systems to call Open APIs') }}
                    <br><i18n path="Once enabled, it can be accessed from Management page {0} Access Keys"><i class="fa fa-fw fa-long-arrow-right"></i></i18n>
                  </div>
                </el-form-item>

                <el-form-item prop="ConnectorForGuance">
                  <el-switch :active-text="$t('Enable Connector for Guance')" v-model="form.ConnectorForGuance"></el-switch>
                  <div class="text-small form-item-tip">
                    {{ $t('For allowing local DataFlux Func to connect to Guance for advanced features') }}
                    <br><i18n path="Once enabled, it can be accessed from Add Connector {0} type Guance"><i class="fa fa-fw fa-long-arrow-right"></i></i18n>
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
  name: 'ExperimentalFeatures',
  components: {
  },
  watch: {
    $route: {
      immediate: true,
      async handler(to, from) {
        await this.loadData();
      }
    },
    form: {
      deep: true,
      handler(to, from) {
        let _formData = this.T.jsonCopy(this.form);
        this.$store.commit('updateEnabledExperimentalFeatures', _formData);
      }
    },
  },
  methods: {
    async loadData() {
      let _featureMap = this.T.jsonCopy(this.$store.state.enabledExperimentalFeatureMap) || {};

      let nextForm = {};
      Object.keys(this.form).forEach(f => nextForm[f] = !!_featureMap[f]);
      this.form = nextForm;

      this.$store.commit('updateLoadStatus', true);
    },
  },
  computed: {
  },
  props: {
  },
  data() {
    return {
      form: {
        PIPTool           : false,
        Blueprint         : false,
        FileManage        : false,
        FileService       : false,
        FuncCacheManage   : false,
        FuncStoreManage   : false,
        FuncDoc           : false,
        OpenAPIDoc        : false,
        SysStat           : false,
        SystemLogs        : false,
        AbnormalReqs      : false,
        ScriptLogs        : false,
        ScriptFailures    : false,
        AccessKeys        : false,
        ConnectorForGuance: false,
      },
    }
  },
}
</script>

<style scoped>
</style>
