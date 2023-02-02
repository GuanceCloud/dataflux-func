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
            <i class="fa fa-fw fa-sitemap"></i>
            <span>{{ $t('Blueprint') }}</span>
          </span>
        </el-menu-item>

        <el-menu-item index="/management/overview">
          <span>
            <i class="fa fa-fw fa-tasks"></i>
            <span>{{ $t('Management') }}</span>
          </span>
        </el-menu-item>

        <el-menu-item index="/management/script-market-list">
          <el-badge :hidden="!common.getScriptMarketUpdateBadge()" is-dot>
            <span>
              <i class="fa fa-fw fa-shopping-cart"></i>
              <span>{{ $t('Script Market') }}</span>
            </span>
          </el-badge>
        </el-menu-item>
      </template>

      <el-menu-item
        v-if="$root.variableConfig['NAVI_DOC_LINK_ENABLED'] && $root.variableConfig['NAVI_DOC_LINK_URL']"
        :index="$root.variableConfig['NAVI_DOC_LINK_URL']">
        <span>
          <i class="fa fa-fw fa-book"></i>
          <span>{{ $t('Documents') }}</span>
        </span>
      </el-menu-item>

      <el-submenu v-if="isSignedIn"
        class="menu-right menu-compact"
        index="user"
        popper-class="navi-content"
        :show-timeout="0"
        :hide-timeout="0">
        <template slot="title">
          <span>
            <el-badge :hidden="!common.hasNewVersion()" is-dot>
              <i v-if="$store.getters.isIntegratedUser" class="fa fa-fw fa-user-circle"></i>
              <i v-else class="fa fa-fw fa-user-md"></i>
              <span>{{ userProfileName }}</span>
            </el-badge>
          </span>
        </template>

        <el-menu-item v-if="common.hasNewVersion()" index="https://func.guance.com/">
          <strong class="text-bad">{{ $t('New Version') }}{{ $t(':') }} {{ $store.state.latestVersion }}</strong>
        </el-menu-item>
        <el-menu-item index="/setting/profile-setup">{{ $t('Profile') }}</el-menu-item>
        <el-menu-item @click="$root.goToSignOut">{{ $t('Sign Out') }}</el-menu-item>
      </el-submenu>

      <el-menu-item v-else
        class="menu-right menu-compact"
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
            <span class="ui-locale-tip" v-if="_locale.tip">{{ _locale.tip }}</span>
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
        this.T.openURL(index);
      }
    },
  },
  computed: {
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
    uiThemeDetail() {
      return this.C.UI_THEME_MAP.get(this.$store.getters.uiTheme);
    },
    uiLocaleDetail() {
      return this.C.UI_LOCALE_MAP.get(this.$store.getters.uiLocale);
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
.navi-content .el-menu {
  padding-right: 10px;
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
  margin-top: 2px;
}
.navi-content .ui-locale-tip {
  margin-left: 5px;
  padding: 4px;
  border-radius: 3px;
  background: #FF6600;
  display: inline-block;
  font-size: 12px;
  color: white !important;
  font-weight: normal !important;
  line-height: 1;
}
.selected-option,
.selected-option * {
  color: #FF6600 !important;
  font-weight: bold !important;
  border-color: #FF6600 !important;
}
</style>
