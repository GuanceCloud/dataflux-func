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

            <el-menu-item index="/management/api-auth-list">
              <span>
                <i class="fa fa-fw fa-lock"></i>
                {{ $t('API Auth') }}
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
                {{ $t('Script Set Exporting') }}
              </span>
            </el-menu-item>
            <el-menu-item index="/management/script-set-import">
              <span>
                <i class="fa fa-fw fa-cloud-upload"></i>
                {{ $t('Script Sets Importing') }}
              </span>
            </el-menu-item>
            <el-menu-item index="/management/script-recover-point-add">
              <span>
                <i class="fa fa-fw fa-history"></i>
                {{ $t('Script Lib Recovering') }}
              </span>
            </el-menu-item>

            <el-menu-item index="/management/user-list" v-if="$store.getters.isAdmin">
              <span>
                <i class="fa fa-fw fa-users"></i>
                {{ $t('User Managment') }}
              </span>
            </el-menu-item>

            <el-menu-item index="/management/system-config" v-if="$store.getters.isAdmin">
              <span>
                <i class="fa fa-fw fa-cog"></i>
                {{ $t('System Config') }}
              </span>
            </el-menu-item>

            <el-menu-item index="/management/operation-record-list">
              <span>
                <i class="fa fa-fw fa-keyboard-o"></i>
                {{ $t('Operation Logs') }}
              </span>
            </el-menu-item>

            <el-menu-item index="/management/experimental-features">
              <span>
                <i class="fa fa-fw fa-flask"></i>
                {{ $t('Experimental Features') }}
              </span>
            </el-menu-item>

            <el-menu-item v-if="$store.getters.isExperimentalFeatureEnabled('PIPTool')"
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
            <el-menu-item v-if="$store.getters.isExperimentalFeatureEnabled('FuncCacheManager')"
              class="experimental-feature" index="/management/func-cache-manager">
              <span>
                <i class="fa fa-fw fa-dot-circle-o"></i>
                {{ $t('Func Cache Managment') }}
              </span>
            </el-menu-item>
            <el-menu-item v-if="$store.getters.isExperimentalFeatureEnabled('FuncStoreManager')"
              class="experimental-feature" index="/management/func-store-manager">
              <span>
                <i class="fa fa-fw fa-database"></i>
                {{ $t('Func Store Managment') }}
              </span>
            </el-menu-item>

            <el-menu-item v-if="$store.getters.isExperimentalFeatureEnabled('FuncDoc')"
              class="experimental-feature" :index="`${T.getBaseURL()}/#/func-doc`">
              <span>
                <i class="fa fa-fw fa-book"></i>
                {{ $t('Func Documents') }}
              </span>
            </el-menu-item>

            <el-menu-item v-if="$store.getters.isExperimentalFeatureEnabled('FuncDoc')"
              class="experimental-feature" :index="`${T.getBaseURL()}/#/auth-link-func-doc`">
              <span>
                <i class="fa fa-fw fa-link"></i>
                {{ $t('Auth Link Documents') }}
              </span>
            </el-menu-item>

            <el-menu-item v-if="$store.getters.isExperimentalFeatureEnabled('SysStat')"
              class="experimental-feature" index="/management/sys-stats">
              <span>
                <i class="fa fa-fw fa-line-chart"></i>
                {{ $t('System Metric') }}
              </span>
            </el-menu-item>
            <el-menu-item v-if="$store.getters.isExperimentalFeatureEnabled('SystemLogs')"
              class="experimental-feature" index="/management/system-logs">
              <span>
                <i class="fa fa-fw fa-file-text-o"></i>
                {{ $t('System Logs') }}
              </span>
            </el-menu-item>
            <el-menu-item v-if="$store.getters.isExperimentalFeatureEnabled('AbnormalReqs')"
              class="experimental-feature" index="/management/abnormal-request-list">
              <span>
                <i class="fa fa-fw fa-exclamation-triangle"></i>
                {{ $t('Abnormal Accesses') }}
              </span>
            </el-menu-item>

            <el-menu-item index="/management/script-log-list" v-if="$store.getters.CONFIG('_INTERNAL_KEEP_SCRIPT_LOG') && $store.getters.isExperimentalFeatureEnabled('ScriptLog')">
              <span>
                <i class="fa fa-fw fa-terminal"></i>
                {{ $t('Script Logs') }}
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

            <el-menu-item v-if="$store.getters.isAdmin && $store.getters.isExperimentalFeatureEnabled('AccessKey')"
              class="experimental-feature" index="/management/access-key-list">
              <span>
                <i class="fa fa-fw fa-key"></i>
                {{ $t('Access Key') }}
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
