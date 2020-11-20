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
                总览
              </span>
            </el-menu-item>

            <el-menu-item index="/management/auth-link-list">
              <span>
                <i class="fa fa-fw fa-link"></i>
                授权链接
              </span>
            </el-menu-item>

            <el-menu-item index="/management/crontab-config-list">
              <span>
                <i class="fa fa-fw fa-clock-o"></i>
                自动触发配置
              </span>
            </el-menu-item>

            <el-menu-item index="/management/batch-list">
              <span>
                <i class="fa fa-fw fa-tasks"></i>
                批处理
              </span>
            </el-menu-item>

            <el-menu-item index="/management/script-set-export-history-list">
              <span>
                <i class="fa fa-fw fa-cloud-download"></i>
                脚本包导出
              </span>
            </el-menu-item>
            <el-menu-item index="/management/script-set-import-history-list">
              <span>
                <i class="fa fa-fw fa-cloud-upload"></i>
                脚本包导入
              </span>
            </el-menu-item>
            <el-menu-item index="/management/script-recover-point-list">
              <span>
                <i class="fa fa-fw fa-history"></i>
                脚本库还原
              </span>
            </el-menu-item>

            <el-menu-item index="/management/script-log-list" v-if="$store.getters.isExperimentalFeatureEnabled('ScriptLog')">
              <span>
                <i class="fa fa-fw fa-terminal"></i>
                脚本日志
                <i class="fa fa-fw fa-flask"></i>
              </span>
            </el-menu-item>
            <el-menu-item index="/management/script-failure-list" v-if="$store.getters.isExperimentalFeatureEnabled('ScriptFailure')">
              <span>
                <i class="fa fa-fw fa-bug"></i>
                脚本故障
                <i class="fa fa-fw fa-flask"></i>
              </span>
            </el-menu-item>

            <el-menu-item index="/management/operation-record-list">
              <span>
                <i class="fa fa-fw fa-keyboard-o"></i>
                操作记录
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
}
.aside-content {
  height: 100%;
}
</style>
