<i18n locale="zh-CN" lang="yaml">
Code Editor  : 脚本编辑器
Management   : 管理
Guide        : 手册
Settings     : 设置
Sign Out     : 登出
Not Signed In: 尚未登录
Auth Link Doc: 授权链接文档
Func Doc     : 函数文档
Signed In    : 已登录
Light Mode   : 明亮模式
Dark Mode    : 黑暗模式
Auto         : 自动
</i18n>

<template>
  <div class="navi-content">
    <el-menu
      mode="horizontal"
      :router="true"
      :unique-opened="true"
      :default-active="$route.path"
      menu-trigger="hover"
      background-color="#3c3c3c"
      text-color="#fff"
      active-text-color="#fff">
      <el-menu-item index="/editor/intro">
        <Logo type="auto"></Logo>
      </el-menu-item>
      <template v-if="isSignedIn">
        <el-menu-item index="/editor/intro">
          <span>
            <i class="fa fa-fw fa-edit"></i>
            <span class="hidden-sm-and-down">{{ $t('Code Editor') }}</span>
          </span>
        </el-menu-item>

        <el-menu-item index="/management/overview">
          <span>
            <i class="fa fa-fw fa-tasks"></i>
            <span class="hidden-md-and-down">{{ $t('Management') }}</span>
          </span>
        </el-menu-item>
      </template>

      <el-menu-item index="">
        <a href="https://function.dataflux.cn/#/doc-index" target="_blank">
          <i class="fa fa-fw fa-question-circle-o"></i>
          <span class="hidden-md-and-down">{{ $t('Guide') }}</span>
        </a>
      </el-menu-item>

      <el-submenu v-if="isSignedIn" class="menu-right" index="user" popper-class="navi-content" :show-timeout="0">
        <template slot="title">
          <span>
            <i v-if="$store.getters.isIntegratedUser" class="fa fa-fw fa-user-circle"></i>
            <i v-else class="fa fa-fw fa-user-md"></i>
            <span class="hidden-md-and-down">{{ userProfileName }}</span>
          </span>
        </template>
        <el-menu-item index="/setting/code-editor-setup">{{ $t('Settings') }}</el-menu-item>
        <el-menu-item @click="goToSignOut">{{ $t('Sign Out') }}</el-menu-item>
      </el-submenu>

      <el-menu-item v-else class="menu-right" index="">
        <span>
          <i class="fa fa-fw fa-user-times"></i>
          <span class="hidden-md-and-down">{{ $t('Not Signed In') }}</span>
        </span>
      </el-menu-item>

      <el-submenu class="menu-right menu-compact" index="ui-locale" popper-class="navi-content" :show-timeout="0">
        <template slot="title">
          <span class="ui-locale-short-title">{{ UI_LOCALE_MAP[uiLocale].shortTitle }}</span>
        </template>
        <el-menu-item v-for="(_locale, _key) in UI_LOCALE_MAP" :key="_key" @click="setUILocale(_key)">
          <span :class="{ 'selected-option': uiLocale === _key }">
            <span class="ui-locale-short-title">{{ _locale.shortTitle }}</span>
            {{ _locale.title }}
          </span>
        </el-menu-item>
      </el-submenu>

      <el-submenu class="menu-right menu-compact" index="theme" popper-class="navi-content" :show-timeout="0">
        <template slot="title">
          <span>
            <i class="fa fa-fw" :class="UI_THEME_MAP[uiTheme].icon"></i>
          </span>
        </template>
        <el-menu-item v-for="(_theme, _key) in UI_THEME_MAP" :key="_key" @click="setUITheme(_key)">
          <span :class="{ 'selected-option': uiTheme === _key }">
            <i class="fa fa-fw" :class="_theme.icon"></i>
            {{ _theme.title }}
          </span>
        </el-menu-item>
      </el-submenu>

      <el-menu-item class="menu-right" index="">
        <a href="/#/auth-link-func-doc" target="_blank">
          <i class="fa fa-fw fa-link"></i>
          <span class="hidden-sm-and-down">{{ $t('Auth Link Doc') }}</span>
        </a>
      </el-menu-item>
      <el-menu-item class="menu-right" index="">
        <a href="/#/func-doc" target="_blank">
          <i class="fa fa-fw fa-book"></i>
          <span class="hidden-sm-and-down">{{ $t('Func Doc') }}</span>
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
    setUILocale(uiLocale) {
      this.$store.commit('updateUILocale', uiLocale);
      this.$root.$i18n.locale = uiLocale;
    },
  },
  computed: {
    UI_THEME_MAP() {
      return {
        light: {
          title: this.$t('Light Mode'),
          icon : 'fa-sun-o',
        },
        dark : {
          title: this.$t('Dark Mode'),
          icon : 'fa-moon-o',
        },
        auto : {
          title: this.$t('Auto'),
          icon : 'fa-adjust',
        },
      }
    },
    UI_LOCALE_MAP() {
      return {
        'en': {
          title     : 'English (WIP)',
          shortTitle: 'EN',
        },
        'zh-CN' : {
          title     : '简体中文',
          shortTitle: '简',
        },
        // 'zh-HK' : {
        //   title     : '香港繁體 (WIP)',
        //   shortTitle: '港',
        // },
        // 'zh-TW' : {
        //   title     : '臺灣正體 (WIP)',
        //   shortTitle: '臺',
        // },
        // 'ja' : {
        //   title     : '日本語 (WIP)',
        //   shortTitle: '日',
        // },
      }
    },
    isSignedIn() {
      return this.$store.getters.isSignedIn;
    },
    uiTheme() {
      return this.$store.getters.uiTheme;
    },
    uiLocale() {
      return this.$store.getters.uiLocale;
    },
    userProfileName() {
      if (this.$store.state.userProfile) {
        let userProfile = this.$store.state.userProfile;
        return userProfile.name || userProfile.username || this.$t('Signed In');
      } else {
        return '*' + this.$t('Signed In');
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
