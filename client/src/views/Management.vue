<i18n locale="zh-CN" lang="yaml">
Overview      : 总览
About         : 关于
Auth Link     : 授权链接
Crontab Config: 自动触发配置
Batch         : 批处理
Export        : 脚本包导出
Import        : 脚本包导入
Recover       : 脚本库还原
Member        : 成员管理
Access Log    : 操作记录
Script Log    : 脚本日志
Script Failure: 脚本故障
Experimental  : 实验性功能
Access Key    : AccessKey
System Metric : 系统指标
</i18n>

<template>
  <el-container direction="horizontal">
    <!-- 二级导航 -->
    <el-aside width="200px">
      <div class="aside">
        <div class="aside-content">
          <el-menu
            mode="vertical"
            :router="true"
            :unique-opened="true"
            :default-active="$route.path">
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

            <el-menu-item index="/management/script-set-export-history-list">
              <span>
                <i class="fa fa-fw fa-cloud-download"></i>
                {{ $t('Export') }}
              </span>
            </el-menu-item>
            <el-menu-item index="/management/script-set-import-history-list">
              <span>
                <i class="fa fa-fw fa-cloud-upload"></i>
                {{ $t('Import') }}
              </span>
            </el-menu-item>
            <el-menu-item index="/management/script-recover-point-list">
              <span>
                <i class="fa fa-fw fa-history"></i>
                {{ $t('Recover') }}
              </span>
            </el-menu-item>

            <el-menu-item index="/management/user-list" v-if="$store.getters.isSuperAdmin">
              <span>
                <i class="fa fa-fw fa-users"></i>
                {{ $t('Member') }}
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

            <el-menu-item index="/management/experimental-features">
              <span>
                <i class="fa fa-fw fa-flask"></i>
                {{ $t('Experimental') }}
              </span>
            </el-menu-item>

            <el-menu-item index="/management/access-key-list" v-if="$store.getters.isSuperAdmin && $store.getters.isExperimentalFeatureEnabled('AccessKey')">
              <span>
                <i class="fa fa-fw fa-key"></i>
                {{ $t('Access Key') }}
                <i class="fa fa-fw fa-flask"></i>
              </span>
            </el-menu-item>
            <el-menu-item index="/management/sys-stats" v-if="$store.getters.isExperimentalFeatureEnabled('SysStat')">
              <span>
                <i class="fa fa-fw fa-line-chart"></i>
                {{ $t('System Metric') }}
                <i class="fa fa-fw fa-flask"></i>
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
</style>
