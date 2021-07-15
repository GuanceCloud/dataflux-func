<i18n locale="zh-CN" lang="yaml">
Overview          : 总览
About             : 关于
Auth Link         : 授权链接
Crontab Config    : 自动触发配置
Batch             : 批处理
Export Script Sets: 脚本包导出
Import Script Sets: 脚本包导入
Recover Script Lib: 脚本库还原
User              : 成员管理
Access Log        : 操作记录
Script Log        : 脚本日志
Script Failure    : 脚本故障
Experimental      : 实验性功能
Script Market     : 脚本市场
Access Key        : AccessKey
System Metric     : 系统指标
PIP Tool          : PIP工具
File Manager      : 文件管理器
File Service      : 文件服务
Func Doc          : 函数文档
</i18n>

<template>
  <el-container direction="horizontal">
    <!-- 二级导航 -->
    <el-aside width="200px">
      <div class="aside">
        <div class="aside-content">
          <el-menu
            mode="vertical"
            :unique-opened="true"
            :default-active="$route.path"
            @select="onNaviMenuSelect">
            <el-menu-item index="/management/overview">
              <span>
                <i class="fa fa-fw fa-dashboard"></i>
                {{ $t('Overview') }}
              </span>
            </el-menu-item>

            <el-menu-item index="/management/about">
              <span>
                <i class="fa fa-fw fa-info-circle"></i>
                {{ $t('About') }}
              </span>
            </el-menu-item>

            <el-menu-item index="/management/auth-link-list">
              <span>
                <i class="fa fa-fw fa-link"></i>
                {{ $t('Auth Link') }}
              </span>
            </el-menu-item>

            <el-menu-item index="/management/crontab-config-list">
              <span>
                <i class="fa fa-fw fa-clock-o"></i>
                {{ $t('Crontab Config') }}
              </span>
            </el-menu-item>

            <el-menu-item index="/management/batch-list">
              <span>
                <i class="fa fa-fw fa-tasks"></i>
                {{ $t('Batch') }}
              </span>
            </el-menu-item>

            <el-menu-item index="/management/script-set-export">
              <span>
                <i class="fa fa-fw fa-cloud-download"></i>
                {{ $t('Export Script Sets') }}
              </span>
            </el-menu-item>
            <el-menu-item index="/management/script-set-import">
              <span>
                <i class="fa fa-fw fa-cloud-upload"></i>
                {{ $t('Import Script Sets') }}
              </span>
            </el-menu-item>
            <el-menu-item index="/management/script-recover-point-add">
              <span>
                <i class="fa fa-fw fa-history"></i>
                {{ $t('Recover Script Lib') }}
              </span>
            </el-menu-item>

            <el-menu-item index="/management/user-list" v-if="$store.getters.isSuperAdmin">
              <span>
                <i class="fa fa-fw fa-users"></i>
                {{ $t('User') }}
              </span>
            </el-menu-item>

            <el-menu-item index="/management/operation-record-list">
              <span>
                <i class="fa fa-fw fa-keyboard-o"></i>
                {{ $t('Access Log') }}
              </span>
            </el-menu-item>

            <el-menu-item index="/management/script-log-list" v-if="$store.getters.CONFIG('_INTERNAL_KEEP_SCRIPT_LOG') && $store.getters.isExperimentalFeatureEnabled('ScriptLog')">
              <span>
                <i class="fa fa-fw fa-terminal"></i>
                {{ $t('Script Log') }}
                <i class="fa fa-fw fa-flask"></i>
              </span>
            </el-menu-item>
            <el-menu-item index="/management/script-failure-list" v-if="$store.getters.CONFIG('_INTERNAL_KEEP_SCRIPT_FAILURE') && $store.getters.isExperimentalFeatureEnabled('ScriptFailure')">
              <span>
                <i class="fa fa-fw fa-bug"></i>
                {{ $t('Script Failure') }}
                <i class="fa fa-fw fa-flask"></i>
              </span>
            </el-menu-item>

            <br>

            <el-menu-item index="/management/experimental-features">
              <span>
                <i class="fa fa-fw fa-flask"></i>
                {{ $t('Experimental') }}
              </span>
            </el-menu-item>

            <el-menu-item v-if="$store.getters.isSuperAdmin && $store.getters.isExperimentalFeatureEnabled('ScriptMarket')"
              class="experimental-feature" index="/management/script-market">
              <span>
                <i class="fa fa-fw fa-shopping-cart"></i>
                {{ $t('Script Market') }}
              </span>
            </el-menu-item>

            <el-menu-item v-if="$store.getters.isSuperAdmin && $store.getters.isExperimentalFeatureEnabled('AccessKey')"
              class="experimental-feature" index="/management/access-key-list">
              <span>
                <i class="fa fa-fw fa-key"></i>
                {{ $t('Access Key') }}
              </span>
            </el-menu-item>
            <el-menu-item v-if="$store.getters.isExperimentalFeatureEnabled('SysStat')"
              class="experimental-feature" index="/management/sys-stats">
              <span>
                <i class="fa fa-fw fa-line-chart"></i>
                {{ $t('System Metric') }}
              </span>
            </el-menu-item>
            <el-menu-item v-if="$store.getters.isExperimentalFeatureEnabled('PipTool')"
              class="experimental-feature" index="/management/pip-tool" >
              <span>
                <i class="fa fa-fw fa-cubes"></i>
                {{ $t('PIP Tool') }}
              </span>
            </el-menu-item>
            <el-menu-item v-if="$store.getters.isExperimentalFeatureEnabled('FileManager')"
              class="experimental-feature" index="/management/file-manager">
              <span>
                <i class="fa fa-fw fa-file"></i>
                {{ $t('File Manager') }}
              </span>
            </el-menu-item>
            <el-menu-item v-if="$store.getters.isExperimentalFeatureEnabled('FileService')"
              class="experimental-feature" index="/management/file-service-list">
              <span>
                <i class="fa fa-fw fa-folder-open"></i>
                {{ $t('File Service') }}
              </span>
            </el-menu-item>

            <el-menu-item v-if="$store.getters.isExperimentalFeatureEnabled('FuncDoc')"
              class="experimental-feature" :index="`${T.getBaseURL()}/#/func-doc`">
              <span>
                <i class="fa fa-fw fa-book"></i>
                <span class="hidden-md-and-down">{{ $t('Func Doc') }}</span>
              </span>
            </el-menu-item>
          </el-menu>
        </div>
      </div>
    </el-aside>

    <!-- 主要 -->
    <router-view />
  </el-container>
</template>

<script>
// @ is an alias to /src
export default {
  name: 'Management',
  components: {
  },
  watch: {
  },
  methods: {
    onNaviMenuSelect(index) {
      if (!index) return;

      if (this.T.startsWith(index, '/')) {
        this.$router.push({ path: index });
      } else {
        window.open(index);
      }
    },
  },
  computed: {
  },
  props: {
  },
  data() {
    return {}
  },
  created() {
  },
}
</script>

<style scoped>
.aside {
  margin-top: 40px;
  margin-bottom: 40px;
}
.aside-content {
  height: 100%;
}
.experimental-feature {
  margin-left: 10px;
}
</style>
