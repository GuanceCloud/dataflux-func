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
            <el-menu-item index="/setting/clear-cache">
              <span>
                <i class="fa fa-fw fa-refresh"></i>
                清除缓存
              </span>
            </el-menu-item>
            <el-menu-item index="/setting/code-editor-setup">
              <span>
                <i class="fa fa-fw fa-edit"></i>
                代码编辑器配置
              </span>
            </el-menu-item>
            <el-menu-item index="/setting/profile-setup" v-if="!$store.getters.isIntegratedUser">
              <span>
                <i class="fa fa-fw fa-user-circle"></i>
                用户信息
              </span>
            </el-menu-item>
            <el-menu-item index="/setting/password-setup" v-if="!$store.getters.isIntegratedUser">
              <span>
                <i class="fa fa-fw fa-lock"></i>
                修改密码
              </span>
            </el-menu-item>
            <el-menu-item index="/setting/user-list" v-if="$store.getters.isSuperAdmin">
              <span>
                <i class="fa fa-fw fa-users"></i>
                成员管理
              </span>
            </el-menu-item>
            <el-menu-item index="/setting/access-key-list" v-if="$store.getters.isSuperAdmin && $store.getters.isExperimentalFeatureEnabled('AccessKey')">
              <span>
                <i class="fa fa-fw fa-key"></i>
                AccessKey 管理
              </span>
            </el-menu-item>

            <el-menu-item index="/setting/experimental-features">
              <span>
                <i class="fa fa-fw fa-flask"></i>
                实验性功能
              </span>
            </el-menu-item>

            <el-menu-item index="/setting/about">
              <span>
                <i class="fa fa-fw fa-info-circle"></i>
                关于
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
  name: 'Setting',
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
  margin-top: 60px;
}
.aside-content {
  height: 100%;
}
</style>

<style>
</style>
