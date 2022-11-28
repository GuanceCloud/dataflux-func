<template>
  <transition name="fade">
    <el-container direction="vertical" v-show="$store.state.isLoaded">
      <!-- 标题区 -->
      <el-header height="60px">
        <h1>
          实验性功能
        </h1>
      </el-header>

      <!-- 编辑区 -->
      <el-main>
        <el-row :gutter="20">
          <el-col :span="15">
            <div class="common-form">
              <el-form ref="form" :model="form"  label-width="0px">
                <el-form-item>
                  <InfoBlock type="info" :title="'一些尚未正式公开的实验性功能可在本页面开启\n本页面配置仅保存在浏览器本地'"></InfoBlock>
                </el-form-item>

                <el-form-item prop="Blueprint">
                  <el-switch active-text="开启蓝图模块" v-model="form.Blueprint"></el-switch>
                  <div class="text-small form-item-tip">
                    用于图形化方式开发脚本
                    <br>开启后，可在顶部「导航栏」<i class="fa fa-fw fa-long-arrow-right"></i>「蓝图」进入模块
                  </div>
                </el-form-item>

                <br><br>

                <el-form-item prop="PIPTool">
                  <el-switch active-text="开启PIP工具模块" v-model="form.PIPTool"></el-switch>
                  <div class="text-small form-item-tip">
                    用于安装脚本所需的额外第三方Python包（PIP）
                    <br>开启后，可在「管理」<i class="fa fa-fw fa-long-arrow-right"></i>「PIP工具」进入模块
                  </div>
                </el-form-item>

                <el-form-item prop="FileManager">
                  <el-switch active-text="开启文件管理器模块" v-model="form.FileManager"></el-switch>
                  <div class="text-small form-item-tip">
                    用于在服务器端处理/保存文件
                    <br>开启后，可在「管理」<i class="fa fa-fw fa-long-arrow-right"></i>「文件管理器」进入模块
                  </div>
                </el-form-item>

                <el-form-item prop="FileService">
                  <el-switch active-text="开启文件服务模块" v-model="form.FileService"></el-switch>
                  <div class="text-small form-item-tip">
                    用于将资源目录提供为文件服务的功能
                    <br>开启后，可在「管理」<i class="fa fa-fw fa-long-arrow-right"></i>「文件服务」进入模块
                  </div>
                </el-form-item>

                <el-form-item prop="FuncCacheManager">
                  <el-switch active-text="开启函数缓存管理器模块" v-model="form.FuncCacheManager"></el-switch>
                  <div class="text-small form-item-tip">
                    用于展示、管理当前函数缓存数据的功能
                    <br>开启后，可在「管理」<i class="fa fa-fw fa-long-arrow-right"></i>「函数缓存管理器」进入模块
                  </div>
                </el-form-item>
                <el-form-item prop="FuncStoreManager">
                  <el-switch active-text="开启函数存储管理器模块" v-model="form.FuncStoreManager"></el-switch>
                  <div class="text-small form-item-tip">
                    用于展示、管理当前函数存储数据的功能
                    <br>开启后，可在「管理」<i class="fa fa-fw fa-long-arrow-right"></i>「函数存储管理器」进入模块
                  </div>
                </el-form-item>

                <el-form-item prop="FuncDoc">
                  <el-switch active-text="开启函数文档模块" v-model="form.FuncDoc"></el-switch>
                  <div class="text-small form-item-tip">
                    用于展示所有可用函数的文档功能
                    <br>开启后，可在「管理」<i class="fa fa-fw fa-long-arrow-right"></i>「函数文档」进入模块
                  </div>
                </el-form-item>

                <el-form-item prop="SysStat">
                  <el-switch active-text="开启系统指标查看模块" v-model="form.SysStat"></el-switch>
                  <div class="text-small form-item-tip">
                    用于查看本系统的一些运行指标信息
                    <br>开启后，可在「管理」<i class="fa fa-fw fa-long-arrow-right"></i>「系统指标」进入模块
                  </div>
                </el-form-item>
                <el-form-item prop="SystemLogs">
                  <el-switch active-text="开启系统日志查看模块" v-model="form.SystemLogs"></el-switch>
                  <div class="text-small form-item-tip">
                    用于查看当前系统日志的功能
                    <br>开启后，可在「管理」<i class="fa fa-fw fa-long-arrow-right"></i>「系统日志」进入模块
                  </div>
                </el-form-item>
                <el-form-item prop="AbnormalReqs">
                  <el-switch active-text="开启异常请求查看模块" v-model="form.AbnormalReqs"></el-switch>
                  <div class="text-small form-item-tip">
                    用于查看当前系统异常请求的功能
                    <br>开启后，可在「管理」<i class="fa fa-fw fa-long-arrow-right"></i>「异常请求」进入模块
                  </div>
                </el-form-item>

                <el-form-item prop="ScriptLog" v-if="$store.getters.CONFIG('_INTERNAL_KEEP_SCRIPT_LOG')">
                  <el-switch active-text="开启脚本日志查看模块" v-model="form.ScriptLog"></el-switch>
                  <div class="text-small form-item-tip">
                    用于查看脚本运行时，通过<code>print()</code>函数输出的内容。每次运行产生一条记录，并包含所有输出内容
                    <br>开启后，可在「管理」<i class="fa fa-fw fa-long-arrow-right"></i>「脚本日志」进入模块
                  </div>
                </el-form-item>

                <el-form-item prop="ScriptFailure" v-if="$store.getters.CONFIG('_INTERNAL_KEEP_SCRIPT_FAILURE')">
                  <el-switch active-text="开启脚本故障查看模块" v-model="form.ScriptFailure"></el-switch>
                  <div class="text-small form-item-tip">
                    用于查看脚本运行时，最终由平台处理的报错信息。每次报错产生一条记录，并包含了完整错误堆栈
                    <br>开启后，可在「管理」<i class="fa fa-fw fa-long-arrow-right"></i>「脚本故障」进入模块
                  </div>
                </el-form-item>

                <el-form-item prop="AccessKey" v-if="$store.getters.isAdmin">
                  <el-switch active-text="开启AccessKey 管理模块" v-model="form.AccessKey"></el-switch>
                  <div class="text-small form-item-tip">
                    用于管理允许外部系统调用本平台接口的认证信息
                    <br>开启后，可在「管理」<i class="fa fa-fw fa-long-arrow-right"></i>「AccessKey」进入模块
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
        PIPTool         : false,
        Blueprint       : false,
        FileManager     : false,
        FileService     : false,
        FuncCacheManager: false,
        FuncStoreManager: false,
        FuncDoc         : false,
        SysStat         : false,
        SystemLogs      : false,
        AbnormalReqs    : false,
        ScriptLog       : false,
        ScriptFailure   : false,
        AccessKey       : false,
      },
    }
  },
}
</script>

<style scoped>
</style>
