<template>
  <div class="navi-content">
    <el-menu
      mode="horizontal"
      :router="true"
      :unique-opened="true"
      :default-active="$route.path"
      background-color="#3c3c3c"
      text-color="#fff"
      active-text-color="#fff">
      <el-menu-item index="/editor/intro">
        <Logo type="auto"></Logo>
      </el-menu-item>
      <template v-if="isSignedIn">
        <!--
        <el-menu-item>
          <span>
            <i class="fa fa-fw fa-dashboard"></i>
            仪表台
          </span>
        </el-menu-item>
        -->
        <el-menu-item index="/editor/intro" v-if="$store.getters.CONFIG('IS_OFFICIAL_PUBLISHER')">
          <el-tooltip content="当前为中心版，可制作/导出官方脚本集" placement="bottom" :enterable="false">
            <i class="fa fa-fw fa-star"></i>
          </el-tooltip>
        </el-menu-item>

        <el-menu-item index="/editor/intro">
          <span>
            <i class="fa fa-fw fa-edit"></i>
            脚本编辑器
          </span>
        </el-menu-item>

        <el-menu-item index="/management/overview">
          <span>
            <i class="fa fa-fw fa-tasks"></i>
            管理
          </span>
        </el-menu-item>
      </template>

      <el-menu-item index="">
        <a href="https://t.dataflux.cn/func-user-guide" target="_blank">
          <i class="fa fa-fw fa-question-circle-o"></i>
          包学包会
        </a>
      </el-menu-item>

      <el-submenu v-if="isSignedIn" class="menu-right" index="user" popper-class="navi-content">
        <template slot="title">
          <i v-if="$store.getters.isIntegratedUser" class="fa fa-fw fa-user-circle"></i>
          <i v-else class="fa fa-fw fa-user-md"></i>
          <span>{{ userProfileName }}</span>
        </template>
        <el-menu-item index="/setting/clear-cache">设置</el-menu-item>
        <el-menu-item @click="goToSignOut">登出</el-menu-item>
      </el-submenu>

      <el-menu-item v-else class="menu-right" index="">
        <span>
          <i class="fa fa-fw fa-user-times"></i>
          <span>尚未登录</span>
        </span>
      </el-menu-item>

      <el-submenu class="menu-right" index="theme" popper-class="navi-content">
        <template slot="title">
          <span>
            <i class="fa fa-fw" :class="UI_THEME_ICON_MAP[uiTheme]"></i>
          </span>
        </template>
        <el-menu-item @click="setUITheme('light')"><i class="fa fa-fw" :class="UI_THEME_ICON_MAP['light']"></i> 明亮模式 <i v-if="uiTheme === 'light'" class="fa fa-fw fa-check-circle"></i></el-menu-item>
        <el-menu-item @click="setUITheme('dark')"><i class="fa fa-fw" :class="UI_THEME_ICON_MAP['dark']"></i> 黑暗模式 <i v-if="uiTheme === 'dark'" class="fa fa-fw fa-check-circle"></i></el-menu-item>
        <el-menu-item @click="setUITheme('auto')"><i class="fa fa-fw" :class="UI_THEME_ICON_MAP['auto']"></i> 自动切换 <i v-if="uiTheme === 'auto'" class="fa fa-fw fa-check-circle"></i></el-menu-item>
      </el-submenu>
      <el-menu-item class="menu-right" index="">
        <a href="/#/auth-link-func-doc" target="_blank">
          <i class="fa fa-fw fa-link"></i>
          授权链接函数文档
        </a>
      </el-menu-item>
      <el-menu-item class="menu-right" index="">
        <a href="/#/func-doc" target="_blank">
          <i class="fa fa-fw fa-book"></i>
          函数文档
        </a>
      </el-menu-item>
    </el-menu>
  </div>
</template>

<script>
export default {
  name: 'Navi',
  components: {
  },
  methods: {
    goToSignOut() {
      this.$router.push({
        name: 'sign-out',
      });
    },
    setUITheme(uiTheme) {
      this.$store.commit('updateUITheme', uiTheme);
    },
  },
  computed: {
    UI_THEME_ICON_MAP() {
      return {
        light: 'fa-sun-o',
        dark : 'fa-moon-o',
        auto : 'fa-adjust',
      }
    },
    isSignedIn() {
      return !!this.$store.state.xAuthToken;
    },
    uiTheme() {
      return this.$store.getters.uiTheme;
    },
    userProfileName() {
      if (this.$store.state.userProfile) {
        let userProfile = this.$store.state.userProfile;
        return userProfile.name || userProfile.username || '已登陆';
      } else {
        return '*已登录';
      }
    },
  },
  props: {
  },
  data() {
    return {}
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.menu-right {
  float: right !important;
}
</style>

<style>
.navi-content .el-menu-item i,
.navi-content .el-submenu__title i {
  margin-top: -3px;
}
.navi-content .el-menu.el-menu--horizontal {
  border-bottom: none !important;
}
.navi-content .el-menu>.el-menu-item,
.navi-content .el-menu>.el-submenu .el-submenu__title {
  height: 30px !important;
  line-height: 30px !important;
}
.navi-content .el-menu>.el-menu-item.is-active,
.navi-content .el-menu>.el-submenu.is-active,
.navi-content .el-menu>.el-submenu.is-active .el-submenu__title {
  border-bottom-color: transparent !important;
}
.navi-content i.fa {
  font-size: 18px;
}
</style>
