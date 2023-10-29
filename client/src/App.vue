<i18n locale="zh-CN" lang="yaml">
Processing, please wait...: 正在处理中，请稍后...

Multiple Editing: 多重编辑
This page does not support multiple users or multiple tabs for editing at the same time, to avoid the possible problem of data overwriting each other, please confirm before operation: 本功能不支持多人或多窗口同时编辑。为避免可能出现的数据相互覆盖等问题，请确认后再进行操作

System Upgraded                                            : 系统已更新
System has been upgraded<br>and the page may be out of date: 系统已经升级，页面可能已经过时
Please refresh the page and continue                       : 请刷新页面后继续
Not Now                                                    : 等会再说
</i18n>

<template>
  <div id="AppContainer"
    :element-loading-text="$t('Processing, please wait...')"
    element-loading-spinner="el-icon-loading"
    v-loading.fullscreen.body.lock="$store.getters.isProcessing">
    <div id="NoticeBar" v-if="showNoticeBar" :style="{ backgroundColor: $store.getters.SYSTEM_SETTINGS('NOTICE_BAR_COLOR') }">
      {{ $store.getters.SYSTEM_SETTINGS('NOTICE_BAR_TEXT') }}
    </div>
    <div id="Navi" v-if="showNavi">
      <Navi></Navi>
    </div>
    <div id="View" :style="{top: viewTop}">
      <router-view />
    </div>

    <el-dialog
      id="CompleteUserProfile"
      :title="$t('Complete User Profile for git committing')"
      :visible.sync="$store.state.showCompleteUserProfile"
      :show-close="false"
      :close-on-click-modal="false"
      :close-on-press-escape="false">
      <p class="text-main">
        {{ $t('Managing Script Market based on git requires your user NAME and EMAIL.') }}
        <br>{{ $t('This information will be used as the user information for git commits.') }}
      </p>
      <br>
      <el-form ref="form" label-width="115px" :model="form" :rules="formRules">
        <el-form-item :label="$t('User Name')" prop="name">
          <el-input
            maxlength="200"
            v-model="form.name"></el-input>
        </el-form-item>
        <el-form-item :label="$t('Email')" prop="email">
          <el-input
            maxlength="200"
            v-model="form.email"></el-input>
        </el-form-item>
      </el-form>

      <div slot="footer">
        <el-button size="small" @click="$store.commit('updateShowCompleteUserProfile', false)">{{ $t('Cancel') }}</el-button>
        <el-button size="small" type="primary" @click="updateUserProfile()">{{ $t('Save') }}</el-button>
      </div>
    </el-dialog>

    <el-dialog
      id="UpgradeNotice"
      :visible.sync="showUpgradeNotice"
      :show-close="false"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      top="15vh"
      :title="$t('System Upgraded')"
      width="600px">
      <div class="upgrade-notice">
        <div class="upgrade-notice-logo">
          <div class="upgrade-notice-logo-old">
            <Logo type="auto" width="245px" height="49px"></Logo>
            <span class="upgrade-notice-version" v-if="T.notNothing($store.state.serverUpgradeInfo)">{{ $store.state.serverUpgradeInfo.prev }}&emsp;</span>
          </div>
          <span class="upgrade-notice-arrow text-main">&#10132;</span>
          <div class="upgrade-notice-logo-new">
            <Logo type="auto" width="245px" height="49px"></Logo>
            <span class="upgrade-notice-version" v-if="T.notNothing($store.state.serverUpgradeInfo)">{{ $store.state.serverUpgradeInfo.next }}&emsp;</span>
          </div>
        </div>
        <p class="upgrade-notice-refresh">
          <span class="text-main" v-html="$t('System has been upgraded<br>and the page may be out of date')"></span>
          <br>
          <br>
          <span class="text-bad">{{ $t('Please refresh the page and continue') }}</span>
        </p>
        <el-button @click="showUpgradeNotice = false">{{ $t('Not Now') }}</el-button>
      </div>
    </el-dialog>

  </div>
</template>

<script>
import 'element-ui/lib/theme-chalk/display.css';
import Navi from '@/components/Navi'

import { io } from 'socket.io-client';
import axios from 'axios';

export default {
  name: 'App',
  components: {
    Navi,
  },
  watch: {
    $route: {
      immediate: true,
      handler(to, from) {
        if (to && to.name) {
          this.reportAndCheckClientConflict(true);
        }
      }
    },
    isSignedIn(val) {
      if (val) {
        // 加载 API 翻译
        this.$store.dispatch('loadAPINamesLocales');

        // Socket.io 登录
        this.socketIO.emit('auth', this.$store.state.xAuthToken);

        // 跳转
        if (this.$route.name === 'index') {
          this.$router.push({ name: 'intro' });
        }

      } else {
        // 登出后
        if (this.$route.name !== 'sign-out') {
          location.href = '/';
        }
      }
    },
    uiTheme(val) {
      let $uiThemeLink = document.getElementById('uiTheme');
      let cssHref = $uiThemeLink.getAttribute('href-pattern').replace('XXX', val);
      $uiThemeLink.setAttribute('href', cssHref);
    },
    '$store.state.serverUpgradeInfo'(val) {
      if (this.T.notNothing(val)) {
        this.showUpgradeNotice = true;
      }
    },
  },
  methods: {
    reportAndCheckClientConflict(showNotice) {
      if (!this.$store.getters.isSocketIOReady) return;

      let routeName = null; // 路径名
      let checkOnly = null; // 是否仅做检查，不记录在线状态
      switch (this.$route.name) {
        case 'code-viewer':
          // 代码查看页面仅检查代码编辑页面是否锁定
          routeName = 'code-editor';
          checkOnly  = true;
          break;

        default:
          // 默认检查本页面是否锁定
          routeName = this.$route.name;
          checkOnly = false;
          break;
      }

      let checkRouteInfo = {
        routeName  : routeName,
        routeQuery : this.$route.query,
        routeParams: this.$route.params,
        checkOnly  : checkOnly,
        conflictId : window.conflictId,
      };
      this.socketIO.emit('reportAndCheckClientConflict', checkRouteInfo, resData => {
        if (this.$store.getters.SYSTEM_INFO('MODE') === 'dev' && resData !== this.prevReportAndCheckClientConflictResData) {
          this.prevReportAndCheckClientConflictResData = resData;
        }
        resData = JSON.parse(resData);

        // 无冲突信息无需任何处理
        if (!resData || !resData.data) return;

        let isConflict = resData.data.isConflict;

        // 记录路径冲突状态
        this.$store.commit('updateConflictedRoute', {
          routeInfo : this.$route,
          isConflict: isConflict,
          conflictId: resData.data.conflictId,
        });

        // 展示提示信息
        if (isConflict && showNotice) {
          switch(this.$route.name) {
            case 'code-viewer':
            case 'code-editor':
              // 代码查看/编辑页面已经有固定文字提示，不需要额外提示
              break;

            default:
              this.T.notify(`<span class="text-bad">${this.$t('Multiple Editing')}</span>
                <br>${this.$t('This page does not support multiple users or multiple tabs for editing at the same time, to avoid the possible problem of data overwriting each other, please confirm before operation')}`, 'warning');
              break;
          }
        }
      });
    },

    async updateUserProfile() {
      try {
        await this.$refs.form.validate();
      } catch(err) {
        return console.error(err);
      }

      let apiRes = await this.T.callAPI('post', '/api/v1/auth/profile/do/modify', {
        body  : { data: this.T.jsonCopy(this.form) },
        alert : { okMessage: this.$t('User Profile saved') },
      });
      if (!apiRes || !apiRes.ok) return;

      this.$store.commit('updateShowCompleteUserProfile', false);
      this.$store.dispatch('loadUserProfile');
    },

    async checkNewVersion() {
      if (!this.T.parseVersion(this.$store.getters.SYSTEM_INFO('VERSION'))) return;

      try {
        let axiosOpt = {
          headers: { 'Cache-Control': 'no-cache' }
        };
        let resp = await axios.get('https://static.guance.com/dataflux-func/portable/version', axiosOpt);
        let latestVersion = ('' + resp.data).trim();
        if (this.T.parseVersion(latestVersion)) {
          this.$store.commit('updateLatestVersion', latestVersion);
        }
      } catch(_) {
        // 忽略错误
      }
    },
  },
  computed: {
    showNavi() {
      switch(this.$route.name) {
        case null:
        case 'index':
        case 'func-doc':
        case 'auth-link-func-doc':
        case 'sign-out':
          return false;

        default:
          return true;
      }
    },
    showNoticeBar() {
      return this.$store.getters.SYSTEM_SETTINGS('NOTICE_BAR_ENABLED')
          && this.$store.getters.SYSTEM_SETTINGS('NOTICE_BAR_TEXT');
    },
    viewTop() {
      let top = 0;

      if (this.showNavi)      top += 30;
      if (this.showNoticeBar) top += 16;

      return `${top}px`;
    },
    isSignedIn() {
      return this.$store.getters.isSignedIn;
    },
    uiTheme() {
      return this.$store.getters.uiTheme;
    },
  },
  props: {
  },
  data() {
    let userProfile = this.$store.state.userProfile || {};

    return {
      prevReportAndCheckClientConflictResData: null,

      form: {
        name : userProfile.name  || '',
        email: userProfile.email || '',
      },
      formRules: {
        name: [
          {
            trigger : 'change',
            message : this.$t('Please input name'),
            required: true,
          },
        ],
        email: [
          {
            trigger : 'change',
            message : this.$t('Please input email'),
            required: true,
            pattern: this.C.RE_PATTERN.email,
          },
        ]
      },

      socketIOReportTimer: null,

      showUpgradeNotice: false,
    }
  },
  mounted() {
    // 初始化 Socket.io 并启动页面上报定时器
    const connectSocketIO = () => {
      if (this.$store.getters.isSocketIOReady) return;

      // SocketIO 连接/认证
      if (this.isSignedIn) {
        this.socketIO.emit('auth', this.$store.state.xAuthToken);
      }
    }
    const handleError = err => {
      console.warn(err);

      try {
        err = JSON.parse(err);
        switch (err.reason) {
          case 'ESocketIOAuth':
            this.$store.commit('updateSocketIOStatus', false);
            connectSocketIO();
            break;
        }

      } catch(err) {
        console.warn(err);
      }
    }
    const handleDisconnect = () => {
      setTimeout(() => {
        this.socketIO.connect();
      }, 1000)
    }
    const handleAuth = () => {
      this.$store.commit('updateSocketIOStatus', true);
    }

    this.$nextTick(() => {
      this.socketIO = window.socketIO = io(process.env.VUE_APP_SERVER_BASE_URL, {
        // 此项必须，否则多 Pod 部署后，Socket.io 会产生「400：Session ID unknown」错误
        transports: [ 'websocket', 'polling' ],
      });
      this.socketIO
        .on('error', handleError)
        .on('connect', connectSocketIO)
        .on('reconnect', connectSocketIO)
        .on('disconnect', handleDisconnect)
        .on('auth.resp', handleAuth)

      // 定期报告当前页面
      this.socketIOReportTimer = setInterval(() => {
        connectSocketIO();
        this.reportAndCheckClientConflict();
      }, 1 * 1000);
    });

    // 监听快捷键
    setImmediate(() => {
      var app = this;

      document.onkeydown = function(e) {
        function shortcutAction(action) {
          e.preventDefault();
          app.$store.commit('updateShortcutAction', {
            action   : action,
            timestamp: app.T.getTimestamp(),
          });
        }

        const ctrlOrCmd = app.T.isMac() ? e.metaKey : e.ctrlKey;
        const alt       = e.altKey;
        const shift     = e.shiftKey;

        const keyCode_1 = 49;
        const keyCode_2 = 50;
        const keyCode_3 = 51;
        const keyCode_B = 66;
        const keyCode_E = 69;
        const keyCode_F = 70;
        const keyCode_S = 83;

        switch(app.$route.name) {
          case 'code-editor':
            if (ctrlOrCmd && e.keyCode === keyCode_S) {
              // Ctrl/Command + S：保存
              return shortcutAction('codeEditor.save');

            } else if (ctrlOrCmd && e.keyCode === keyCode_B) {
              // Ctrl/Command + B：运行
              return shortcutAction('codeEditor.run');
            }
            break;

          case 'code-viewer':
            if (ctrlOrCmd && e.keyCode === keyCode_1) {
              // Ctrl/Command + 1： 查看草稿
              return shortcutAction('codeViewer.showDraft');

            } else if (ctrlOrCmd && e.keyCode === keyCode_2) {
              // Ctrl/Command + 2： 查看草稿
              return shortcutAction('codeViewer.showPublished');

            } else if (ctrlOrCmd && e.keyCode === keyCode_3) {
              // Ctrl/Command + 3： 查看差异
              return shortcutAction('codeViewer.showDiff');

            } else if (ctrlOrCmd && e.keyCode === keyCode_E) {
              // Ctrl/Command + E： 进入编辑
              return shortcutAction('codeViewer.enterEditor');
            }
            break;

        }
      };
    });

    // 检查更新
    this.checkNewVersion();
  },
  beforeDestroy() {
    if (this.socketIOReportTimer) clearInterval(this.socketIOReportTimer);
  },
}
</script>

<style scoped>
.upgrade-notice {
  text-align: center;
}
.upgrade-notice-refresh {
  font-size: 18px;
  padding: 20px 0;
}
.upgrade-notice-logo {
  display: flex;
  justify-content: space-evenly;
  align-items: center;
  text-align: right;
}
.upgrade-notice-arrow {
  font-size: 25px;
}
.upgrade-notice-logo-old {
  filter: grayscale(.75);
}
.upgrade-notice-version {
  color: #FF6600;
  font-weight: bold;
}
</style>
<style>
@font-face {
  font-family: "Iosevka";
  src: url(./assets/font/iosevka-fixed-regular.woff2);
}
* {
  font-family: "PingFang SC", "Microsoft YaHei", "微软雅黑", "Arial", "sans-serif";
  outline: none !important;
}
input, textarea,
pre, pre *:not(.fa)
.CodeMirror, .CodeMirror *:not(.fa),
.code-font, .code-font *:not(.fa) {
  font-family: "Iosevka", "PingFang SC", "Microsoft YaHei", "微软雅黑", "Arial", "sans-serif";
}
a {
  text-decoration: none;
}
p {
  word-break: break-word;
  line-height: 1.5;
}
html {
  min-width: 1280px;
}
html, body {
  height: 100%;
  margin: 0;
  overflow-y: hidden;
}
pre {
  word-break: break-all;
  white-space: pre-wrap;
}
code {
  font-family: "Iosevka", "PngFang SC","Microsoft YaHei","微软雅黑","Arial","sans-serif" !important;
}
#AppContainer, .el-container {
  height: 100%;
}
h1 {
  font-size: 20px;
}
h2 {
  font-size: 18px;
}
h3 {
  font-size: 16px;
}
*>small {
  color: grey;
  font-size: small;
  font-weight: normal;
}
ul {
  list-style-type: square;
}
.main-text {
  color: #303133;
}
.normal-text {
  color: #606266;
}
.sub-text {
  color: #909399
}

.bg-greyzz {
  background-image: url(./assets/img/bg-greyzz.png);
  background-repeat: repeat;
}

/* 动态效果 */
.fade-enter-active {
  transition: all .2s;
}
.fade-enter {
  transform: translateY(5px);
  opacity: 0;
}
.fade-enter-to {
  transform: translateY(0);
  opacity: 1;
}
.fade-leave-to,
.fade-leave {
  display: none;
}

/* 动态效果（简化） */
.fade-s-enter-active {
  transition: all .2s;
}
.fade-s-leave-to,
.fade-s-leave {
  display: none;
}
.fade-s-enter {
  opacity: 0;
}
.fade-s-enter-to {
  opacity: 1;
}

#NoticeBar {
  background-color: #ff6600cc;
  font-size: 12px;
  padding: 1px;
  text-align: center;
  color: white;
  height: 16px;
  z-index: 2000;
  position: relative;
}
#Navi {
  position: relative;
  height: 30px;
  z-index: 2000;
}
#View {
  position: absolute;
  bottom: 0;
  min-width: 1280px;
  width: 100%;
}

#CompleteUserProfile p {
  padding: 10px 30px;
  text-align: center;
}
#CompleteUserProfile > .el-dialog {
  width: 620px;
}

.delete-button {
  color: #FF0000 !important;
  border-color: #FF000055 !important;
  float: left;
}
.delete-button.is-disabled {
  color: #FF000055 !important;
}
.aside-on-button {
  color: #FF6600 !important
}
.aside-on-button.is-disabled {
  color: #FF660055 !important
}
.setup-footer {
  text-align: right;
  padding-top: 15px;
  margin-bottom: 0 !important;
}
.setup-footer .el-button+.el-button,
.setup-footer .el-button+.el-dropdown
 {
  margin-left: 10px;
}

.setup-page-footer {
  width: 620px;
  text-align: right;
  padding-top: 15px;
  border-top: 1px dashed #dddfe6;
}

p.form-item {
  margin: 0;
  height: 40px;
  display: flex;
  align-items: center;
  font-size: 16px;
}
.setup-form {
  width: 620px;
}
.setup-form .form-item-tip {
  color: darkgrey !important;
  margin-left: 25px;
  line-height: 1.5;
}
.setup-form .el-color-picker,
.setup-form .el-color-picker__trigger,
.setup-form .el-date-editor,
.setup-form .el-cascader {
  width: 100% !important;
}
.setup-form .el-upload-dragger {
  width: 485px;
  height: unset;
}
.setup-form .el-upload-dragger > .image-preview {
  max-width: 100%;
  padding: 10px;
}
.setup-form .el-upload-dragger > .image-preview > img {
  max-width: 100%;
}
.common-table {
  width: 100%;
}
.common-table .fa-spin {
  font-size: 1.1em;
}
.common-table .el-table__header {
  height: 60px;
}
.common-table table {
  width: unset !important;
}
.common-table th:nth-of-type(1),
.common-table td:nth-of-type(1) {
  padding-left: 20px;
}
.common-table th:nth-last-of-type(1),
.common-table td:nth-last-of-type(1) {
  padding-right: 10px;
}
.common-table-container {
  /* scroll-behavior: smooth; */
  padding: 0 !important;
}

.button-bad {
  color: red !important;
  border-color: red !important;
}
.text-main {
  color: #FF6600 !important;
  /* text-shadow: #ffa5004d 0 0 10px; */
}
.text-info {
  color: darkgrey !important;
}
.text-watch {
  color: orange !important;
  /* text-shadow: #ffc58e 0 0 10px; */
}
.text-good {
  color: rgb(0,128,0) !important;
}
.text-good-fade {
  color: rgb(0,128,0,.5) !important;
}
.text-bad {
  color: rgb(255,0,0) !important;
}
.text-bad-fade {
  color: rgb(255,0,0,.5) !important;
}
.text-small {
  font-size: small;
}
.text-large {
  font-size: large;
}
.text-left {
  text-align: left;
}
.text-right {
  text-align: right;
}
.float-left {
  float: left;
}
.float-right {
  float: right;
}
.press-esc-to-close-tip {
  font-size: 14px;
  position: absolute;
  right: 55px;
  line-height: 26px;
}
tr.hl-row td {
  background-color: #ffefe480;
  /*background-image: linear-gradient(to right, #FFF, #ffefe4);*/
}
.el-table--enable-row-hover .el-table__body tr.hl-row:hover>td {
  background-color: #ffefe4;
}
hr.br {
  border: none;
  margin: 3px auto;
}
kbd {
  padding: 2px 8px;
  font-size: 14px;
  font-family: "Iosevka";
  color: #fff;
  background-color: #333;
  border: 1px darkgrey solid;
  border-radius: 3px;
  box-shadow: 2px 2px 0 darkgrey;
}
.common-page-header {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.common-page-header > div:first-child > h1 {
  display: inline;
  font-weight: bold;
  font-size: 22px;
  line-height: 2;
}
.header-control {
  /* float: right;*/
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: center;
  justify-content: flex-end;
}
.header-control > * {
  margin-left: 15px !important;
}
.header-control .el-checkbox.is-bordered.el-checkbox--small {
  /* Magic Fix! */
  /* padding-top: 6px; */
}
.el-menu--horizontal > .el-submenu .el-submenu__icon-arrow {
  /* Magic Fix! */
  margin-top: 3px !important;
}
.no-data-area {
  text-align: center;
}
.no-data-area .no-data-title {
  color: darkgrey !important;
  font-size: x-large;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.no-data-area .no-data-title .fa {
  margin-bottom: 20px;
  font-size: 50px;
}
.no-data-area .no-data-tip {
  color: darkgrey !important;
  line-height: 2;
}
.timeline-tip {
  width: 800px;
  margin-left: 69px;
}
.timeline-tip:last-of-type {
  margin-bottom: 20px;
}
.config-divider {
  margin-bottom: 0 !important;
}

/* vue-splitpane 修正 */
.splitter-pane-resizer {
  opacity: 1 !important;
  z-index: 10 !important;
}
.splitter-pane-resizer.vertical {
  width: 15px !important;
}
.splitter-pane-resizer.horizontal {
  height: 15px !important;
}
.splitter-pane-resizer.vertical:after {
  content: "\25BA";
  font-size: 12px;
  display: block;
  position: absolute;
  color: grey;
  padding: 15px 2px;
  top: 50%;
  left: 0px;
  border-bottom-right-radius: 5px;
  border-top-right-radius: 5px;
  transform: scale(.7, 1);
}
.splitter-pane-resizer.horizontal:after {
  content: "\25B2";
  font-size: 12px;
  display: block;
  position: absolute;
  color: grey;
  padding: 0px 15px;
  left: 50%;
  top: -10px;
  border-top-left-radius: 5px;
  border-top-right-radius: 5px;
  transform: scale(1, .7);
}
.setup-right {
  float: right;
}

::-webkit-input-placeholder {
  color: #ccc;
}
::-moz-input-placeholder {
  color: #ccc;
}
::-ms-input-placeholder {
  color: #ccc;
}

/* Font Awesome */
.fa-fw {
  width: 1.1em !important;
}
.el-button .fa {
  line-height: 0 !important;
}

/* Element-UI 修正 */
.el-upload-dragger .fa {
  font-size: 67px;
  color: #C0C4CC;
  margin: 40px 0 16px;
  line-height: 50px;
}
.el-upload-dragger .el-upload__text {
  padding-bottom: 20px;
  color: #FF6600 !important;
}

.el-link.is-disabled {
  opacity: .6;
}

.el-button-group > .el-button.is-disabled {
  z-index: unset;
}

.el-button--mini,
.el-input--mini .el-input__inner,
.el-radio-button--mini .el-radio-button__inner {
  height: 29px !important;
}
.el-form--inline .el-form-item,
.el-form--inline .el-form-item__content {
  vertical-align: unset !important;
}
.el-form-item__error {
  word-break: break-all;
}

.fix-compact-button {
  margin-left: 0 !important;
}

.el-table .cell {
  word-break: break-word !important;
  overflow: visible !important;
}
.el-table__row > .el-table__cell:last-child > .cell {
  padding-right: 5 !important;
}
.el-table__row > .el-table__cell:last-child > .cell .el-link {
  position: relative;
  margin-left: 10px;
}
.el-row {
  margin-bottom: 20px;
}
.el-row:last-child {
  margin-bottom: 0;
}

.el-tag + .el-tag {
  margin-left: 5px;
}
.el-loading-spinner {
  top: 42% !important;
}
.el-loading-mask {
  font-size: 50px;
}
.el-loading-text {
  font-size: 18px;
}
.el-notification {
  z-index: 3003 !important;
  align-items: center !important;
}
.el-notification__content {
  margin-top: 0 !important;
}
.el-tooltip__popper {
  z-index: 3002 !important;
}
.el-tooltip__popper * {
  line-height: 1.5;
  font-size: 14px;
}
.el-popover {
  z-index: 3001 !important;
}
.el-message {
  top: 40px !important;
  z-index: 3001 !important;
}
.el-message-box {
  width: 520px !important;
}
.el-message-box__status {
  top: 22px !important;
}
.el-message-box__headerbtn {
  z-index: 1000;
}
.el-notification__content {
  text-align: start !important;
}

.el-tree-node__content {
  border: 1px solid white;
  margin-top: 3px;
}
.el-tree--highlight-current .el-tree-node.is-current>.el-tree-node__content {
  border: 1px solid #FF6600;
  border-radius: 5px;
}

[captcha] .el-input__inner {
  letter-spacing: 15px;
  font-size: x-large;
  padding-left: 45px;
  text-align: center;
}
[captcha] .el-input-group__prepend {
  padding-left: 0;
  padding-right: 0;
}
.el-input__inner {
  border-radius: 3px !important;
}

.el-form-item__label {
}
.el-form-item__error {
  font-size: 14px !important;
}
.el-form-item__content .el-select {
  display: block;
}
.el-form-item__content .el-link {
  line-height: 1.5 !important;
}
.el-form .el-transfer-panel__item {
  /* https://github.com/ElemeFE/element/issues/18228 */
  margin-left: 0;
  display: block !important;
}

.el-aside {
  border-right: solid 1px #e6e6e6;
}
.el-aside .el-menu {
  border-right: none !important;
}
.el-menu-item * {
  vertical-align: unset !important;
}

.switch-tips {
  padding-left: 10px;
  font-size: 1px;
  font-weight: normal;
  color: darkgrey !important;
}
.el-radio-button:first-child .el-radio-button__inner {
  border-top-left-radius: 3px !important;
  border-bottom-left-radius: 3px !important;
}
.el-radio-button:last-child .el-radio-button__inner {
  border-top-right-radius: 3px !important;
  border-bottom-right-radius: 3px !important;
}
.el-checkbox.el-transfer-panel__item {
  margin-right: 0px !important;
}
.el-divider--horizontal:not(:first-of-type) {
  margin-top: 60px !important;
}
.el-divider--horizontal {
  margin-bottom: 35px !important;
}
.el-divider--horizontal h1 {
  font-style: italic;
  font-weight: normal;
}

.el-drawer__wrapper {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  overflow: hidden;
  margin: 0;
}
.el-drawer__body {
  overflow-y: auto;
}

.el-dialog {
  border-radius: 10px !important;
}
.el-dialog__header {
  min-height: 20px !important;
}
.el-dialog__close {
  font-size: 28px !important;
  font-weight: bold !important;
}
.el-dialog__body {
  padding: 5px 20px 20px 20px !important;
}
.el-dialog__footer {
  padding-top: 0 !important;
  padding-bottom: 20px !important;
}

/* CodeMirror 修正 */
.cm-searching {
  background: none !important;
  border: 1px solid #f60 !important;
  border-radius: 3px !important;
}
.cm-trailingspace {
  background-color: lightgrey;
  border-radius: 3px;
}

.CodeMirror-dialog input {
  width: 30em !important;
  background-color: #FFCF003D !important;
  padding-left: 5px;
  padding-right: 5px;
  font-family: "Iosevka","PingFang SC","Microsoft YaHei","微软雅黑","Arial","sans-serif" !important;
}
.CodeMirror-wrap {
  border: 1px solid #DCDFE6;
  border-radius: 3px;
}
.CodeMirror-wrap:hover {
  border-color: #C0C4CC;
}
.CodeMirror-wrap pre.CodeMirror-line {
  word-break: break-all;
}

/*动画效果*/
@keyframes error-input-shake {
  from, to {
    transform: translate3d(0, 0, 0);
  }
  12.5%, 37.5%, 62.5%, 87.5% {
    transform: translate3d(-20px, 0, 0);
  }
  25%, 50%, 75% {
    transform: translate3d(20px, 0, 0);
  }
}
.error-input-shake {
  animation: error-input-shake .65s ease-out 0.2s;
}

::-webkit-scrollbar {
  width: 3px;
  height: 3px;
  background: none;
}
::-webkit-scrollbar-button {
  display: none;
}
::-webkit-scrollbar-thumb:vertical {
  background: #E1E1E1;
  min-height: 30%;
  /* background-image: linear-gradient(to top, rgb(255, 102, 0, 0), rgb(255, 102, 0) 40%, rgb(255, 102, 0) 60%, rgb(255, 102, 0, 0)); */
}
::-webkit-scrollbar-track {
  background: none;
}
</style>
