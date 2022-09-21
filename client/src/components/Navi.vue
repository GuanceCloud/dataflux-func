<i18n locale="zh-CN" lang="yaml">
Development  : 开发
Blueprint    : 蓝图
Management   : 管理
Docs         : 文档
Profile      : 个人设置
Sign Out     : 登出
Not Signed In: 尚未登录
Auth Link Doc: 授权链接文档
Signed In    : 已登录
</i18n>

<template>
  <div class="navi-content">
    <el-menu
      mode="horizontal"
      :unique-opened="true"
      :default-active="$route.path"
      menu-trigger="hover"
      background-color="#3c3c3c"
      text-color="#fff"
      active-text-color="#fff"
      @select="onNaviMenuSelect">
      <el-menu-item index="/editor/intro">
        <Logo type="auto"></Logo>
      </el-menu-item>
      <template v-if="isSignedIn">
        <el-menu-item index="/editor/intro">
          <span>
            <i class="fa fa-fw fa-edit"></i>
            <span>{{ $t('Development') }}</span>
          </span>
        </el-menu-item>

        <el-menu-item index="/blueprint" v-if="$store.getters.isExperimentalFeatureEnabled('Blueprint')">
          <span>
            <i class="fa fa-fw fa-th-large"></i>
            <span>{{ $t('Blueprint') }}</span>
          </span>
        </el-menu-item>

        <el-menu-item index="/management/overview">
          <span>
            <i class="fa fa-fw fa-tasks"></i>
            <span>{{ $t('Management') }}</span>
          </span>
        </el-menu-item>
      </template>

      <el-menu-item
        v-if="variableConfig['NAVI_DOC_LINK_ENABLED'] && variableConfig['NAVI_DOC_LINK_URL']"
        :index="variableConfig['NAVI_DOC_LINK_URL']">
        <span>
          <i class="fa fa-fw fa-book"></i>
          <span>{{ $t('Docs') }}</span>
        </span>
      </el-menu-item>

      <el-submenu v-if="isSignedIn"
        class="menu-right"
        index="user"
        popper-class="navi-content"
        :show-timeout="0"
        :hide-timeout="0">
        <template slot="title">
          <span>
            <i v-if="$store.getters.isIntegratedUser" class="fa fa-fw fa-user-circle"></i>
            <i v-else class="fa fa-fw fa-user-md"></i>
            <span>{{ userProfileName }}</span>
          </span>
        </template>
        <el-menu-item index="/setting/profile-setup">{{ $t('Profile') }}</el-menu-item>
        <el-menu-item @click="$root.goToSignOut">{{ $t('Sign Out') }}</el-menu-item>
      </el-submenu>

      <el-menu-item v-else
        class="menu-right"
        index="">
        <span>
          <i class="fa fa-fw fa-user-times"></i>
          <span>{{ $t('Not Signed In') }}</span>
        </span>
      </el-menu-item>

      <el-submenu
        class="menu-right menu-compact"
        index="ui-locale"
        popper-class="navi-content"
        :show-timeout="0"
        :hide-timeout="0">
        <template slot="title">
          <span class="ui-locale-short-title">{{ uiLocaleDetail.shortName }}</span>
        </template>
        <el-menu-item v-for="_locale in C.UI_LOCALE" :key="_locale.key" @click="$root.setUILocale(_locale.key)">
          <span :class="{ 'selected-option': uiLocaleDetail.key === _locale.key }">
            <span class="ui-locale-short-title">{{ _locale.shortName }}</span>
            {{ _locale.name }}
          </span>
        </el-menu-item>
      </el-submenu>

      <el-submenu
        class="menu-right menu-compact"
        index="theme"
        popper-class="navi-content"
        :show-timeout="0"
        :hide-timeout="0">
        <template slot="title">
          <span>
            <i class="fa fa-fw" :class="uiThemeDetail.icon"></i>
          </span>
        </template>
        <el-menu-item v-for="_theme in C.UI_THEME" :key="_theme.key" @click="$root.setUITheme(_theme.key)">
          <span :class="{ 'selected-option': uiThemeDetail.key === _theme.key }">
            <i class="fa fa-fw" :class="_theme.icon"></i>
            {{ _theme.name }}
          </span>
        </el-menu-item>
      </el-submenu>

      <el-menu-item class="menu-right" :index="`${T.getBaseURL()}/#/auth-link-func-doc`">
        <span>
          <i class="fa fa-fw fa-link"></i>
          <span>{{ $t('Auth Link Doc') }}</span>
        </span>
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
    variableConfig() {
      return this.$store.getters.CONFIG('VARIABLE_CONFIG');
    },
    isSignedIn() {
      return this.$store.getters.isSignedIn;
    },
    userProfileName() {
      if (this.$store.state.userProfile) {
        let userProfile = this.$store.state.userProfile;
        return userProfile.name || userProfile.username || this.$t('Signed In');
      } else {
        return '*' + this.$t('Signed In');
      }
    },
    uiTheme() {
      return this.$store.getters.uiTheme;
    },
    uiLocale() {
      return this.$store.getters.uiLocale;
    },
    uiThemeDetail() {
      return this.C.UI_THEME_MAP.get(this.uiTheme);
    },
    uiLocaleDetail() {
      return this.C.UI_LOCALE_MAP.get(this.uiLocale);
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
.menu-compact .el-submenu__title {
  padding-right: 0;
}
.navi-content .el-menu-item i,
.navi-content .el-submenu__title i {
}
.navi-content .el-menu.el-menu--horizontal {
  border-bottom: none !important;
}
.navi-content .el-menu>.el-menu-item,
.navi-content .el-menu>.el-submenu .el-submenu__title {
  height: 30px !important;
  line-height: 1 !important;
  display: flex;
  align-items: center;
}
.navi-content .el-menu>.el-menu-item.is-active,
.navi-content .el-menu>.el-submenu.is-active,
.navi-content .el-menu>.el-submenu.is-active .el-submenu__title {
  border-bottom-color: transparent !important;
}
.navi-content i.fa {
  font-size: 18px;
  position: relative;
  top: 2px;
}
.navi-content .ui-locale-short-title {
  border: 1px solid grey;
  border-radius: 3px;
  padding: 2px;
  width: 18px;
  height: 14px;
  display: inline-block;
  line-height: 14px;
  text-align: center;
  font-size: 12px;
}
.selected-option,
.selected-option * {
  color: #FF6600 !important;
  font-weight: bold !important;
  border-color: #FF6600 !important;
}
</style>
