<template>
  <div id="app"
    element-loading-text="正在处理中，请稍后..."
    element-loading-spinner="el-icon-loading"
    v-loading.fullscreen.body.lock="$store.getters.isProcessing">
    <div id="Navi" v-if="showNavi">
      <Navi></Navi>
    </div>
    <div id="View" :style="{top: showNavi ? '30px' : '0'}">
      <router-view />
    </div>
  </div>
</template>

<script>
import 'element-ui/lib/theme-chalk/display.css';
import Navi from '@/components/Navi'

import io from 'socket.io-client'

export default {
  name: 'App',
  components: {
    Navi,
  },
  watch: {
    isSignedIn(val) {
      if (val) {
        // 登录后
        this.$store.dispatch('updateUserProfile');

        // Socket.io 登录
        this.socketIO.emit('auth', this.$store.state.xAuthToken);

        // 跳转
        if (this.$route.name === 'index') {
          this.$router.push({
            name: 'intro',
          });
        }

      } else {
        // 登出后
        if (this.$route.name !== 'sign-out') {
          this.$router.push({
            name: 'index',
          });
        }
      }
    },
    '$store.getters.uiTheme': function(val) {
      let $uiThemeLink = document.getElementById('uiTheme');
      let cssHref = $uiThemeLink.getAttribute('href-pattern').replace('XXX', val);
      $uiThemeLink.setAttribute('href', cssHref);
    },
    $route: {
      immediate: true,
      handler(to, from) {
        if (to && to.name) {
          this.reportAndCheckClientConflict(true);
        }
      }
    },
  },
  methods: {
    reportAndCheckClientConflict(showNotice) {
      if (!this.$store.getters.isSocketIOReady) return;

      if (showNotice) {
        this.$notify.closeAll();
      }

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
      let checkRouteInfo = JSON.stringify({
        routeName  : routeName,
        routeQuery : this.$route.query,
        routeParams: this.$route.params,
        checkOnly  : checkOnly,
        instanceId : window.instanceId,
      });
      this.socketIO.emit('socketio.reportAndCheckClientConflict', checkRouteInfo, resData => {
        if (this.$store.getters.CONFIG('MODE') === 'dev' && resData !== this.prevReportAndCheckClientConflictResData) {
          this.prevReportAndCheckClientConflictResData = resData;
          console.log(`Socket.io[socketio.reportAndCheckClientConflict.ack] ${resData}`);
        }
        resData = JSON.parse(resData);

        // 无冲突信息无需任何处理
        if (!resData || !resData.data) return;

        let isConflicted = resData.data.isConflict;

        // 记录路径冲突状态
        this.$store.commit('setConflictedRoute', {
          routeInfo   : this.$route,
          isConflicted: isConflicted,
        });

        // 展示提示信息
        if (isConflicted && showNotice) {
          switch(this.$route.name) {
            case 'code-viewer':
            case 'code-editor':
              // 代码查看/编辑页面已经有固定文字提示，不需要额外提示
              break;

            default:
              this.$notify({
                dangerouslyUseHTMLString: true,
                title   : '有其他用户或窗口也在本页面操作',
                message : `本系统<span class="text-bad">不支持多人或多窗口同时编辑</span>。<br>为避免可能出现的数据相互覆盖等问题，请确认后再进行操作`,
                type    : 'warning',
                position: 'top-right',
                offset  : 20,
                duration: 0,
              });
              break;
          }
        }
      });
    },
  },
  computed: {
    showNavi() {
      switch(this.$route.name) {
        case 'index':
        case 'func-doc':
        case 'auth-link-func-doc':
        case 'sign-out':
          return false;

        default:
          return true;
      }
    },
    isSignedIn() {
      return this.$store.getters.isSignedIn;
    },
  },
  props: {
  },
  data() {
    return {
      fullscreenLoading: false,

      prevReportAndCheckClientConflictResData: null,
    }
  },
  created() {
    this.$store.dispatch('reloadSystemConfig');
    this.$store.dispatch('reloadUserProfile');
  },
  mounted() {
    const connectSocketIO = () => {
      if (this.$store.getters.isSocketIOReady) return;

      if (this.$store.getters.CONFIG('MODE') === 'dev') {
        console.info('Socket.io CONNECTED');
      }

      // SocketIO 连接/认证
      if (this.isSignedIn) {
        this.socketIO.emit('auth', this.$store.state.xAuthToken);
      }
    }
    const handleDisconnect = () => {
      if (this.$store.getters.CONFIG('MODE') === 'dev') {
        console.info('Socket.io DISCONNECTED');
      }

      setTimeout(() => {
        this.socketIO.connect();
      }, 1000)
    }
    const handleAuth = () => {
      this.$store.commit('updateSocketIOStatus', true);
    }
    const handleError = err => {
      console.error(err)
      try {
        err = JSON.parse(err);
        switch (err.reason) {
          case 'ESocketIOAuth':
            this.$store.commit('updateSocketIOStatus', false);
            connectSocketIO();
            break;
        }

      } catch(err) {
        console.error(err)
      }
    }

    this.$nextTick(() => {
      // 初始化Socket.io
      this.socketIO = window.socketIO = io(process.env.VUE_APP_SERVER_BASE_URL, { transports: ['websocket'] });
      this.socketIO
        .on('connect', connectSocketIO)
        .on('reconnect', connectSocketIO)
        .on('disconnect', handleDisconnect)
        .on('auth.ack', handleAuth)
        .on('ftAuth.ack', handleAuth)
        .on('error', handleError);

      // 定期报告当前页面
      setInterval(() => {
        connectSocketIO()
        this.reportAndCheckClientConflict();
      }, 1 * 1000);
    });

    setImmediate(() => {
      // 监听快捷键
      var app = this;

      document.onkeydown = function(e) {
        function shortcutAction(action) {
          e.preventDefault();
          app.$store.commit('updateShortcutAction', {
            action   : action,
            timestamp: parseInt(Date.now() / 1000),
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
  },
}
</script>

<style>
@font-face {
  font-family: Iosevka;
  src: url(./assets/font/iosevka-fixed-regular.woff2);
}
* {
  font-family: Iosevka,"Helvetica Neue",Helvetica,"PingFang SC","Hiragino Sans GB","Microsoft YaHei","微软雅黑",Arial,sans-serif;
}
a {
  text-decoration: none;
}
input, textarea, code, pre, pre * {
  font-family: Iosevka !important;
}
html, body {
  height: 100%;
  margin: 0;
}
pre {
  word-break: break-all;
  white-space: pre-wrap;
}
#app, .el-container {
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
.fade-enter-active {
  transition: opacity .15s;
}
.fade-enter {
  opacity: 0;
}
.fade-enter-to {
  opacity: 1;
}

#Navi {
  position: absolute;
  height: 30px;
  top: 0;
  left: 0;
  right: 0;
  z-index: 2000;
}
#View {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
}
.paging-area {
  height: 45px;
  text-align: right;
}
.common-form {
  width: 620px;
}
.common-form .form-item-tip {
  color: darkgrey !important;
  margin-left: 25px;
  line-height: 1.5;
}
.common-table {
  width: 100%;
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
  scroll-behavior: smooth;
  padding-left: 0 !important;
  padding-right: 0 !important;
}

.text-main {
  color: #FF6600;
  font-weight: bold;
  text-shadow: #ffa5004d 0 0 10px;
}
.text-info {
  color: darkgrey;
  font-weight: bold;
}
.text-watch {
  color: orange;
  font-weight: bold;
  text-shadow: #ffc58e 0 0 10px;
}
.text-good {
  color: green;
  font-weight: bold;
}
.text-bad {
  color: red;
  font-weight: bold;
}
.text-code {
  padding: 1px 3px;
  background-color: #ffefe4;
  border-radius: 3px;
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
tr.hl-row {
  background-image: linear-gradient(to right, #FFF, #ffefe4);
}
tr.hl-row:hover {
  background-image: linear-gradient(to right, #ffefe4, #ffefe4);
}
tr.hl-row:hover td {
  background-color: #ffefe4 !important;
}
hr.br {
  border: none;
  margin: 3px auto;
}
kbd {
  padding: 2px 4px;
  font-size: 90%;
  color: #fff;
  background-color: #333;
  border-radius: 3px;
  -webkit-box-shadow: inset 0 -1px 0 rgba(0,0,0,0.25);
  box-shadow: inset 0 -1px 0 rgba(0,0,0,0.25);
}
.header-control {
  float: right;
}
.header-control > * {
  margin-left: 5px !important;
}
.no-data-area {
  text-align: center;
}
.no-data-area .no-data-title {
  color: darkgrey !important;
  font-weight: bold;
  font-size: x-large
}
.no-data-area .no-data-tip {
  color: darkgrey !important;
  line-height: 2;
  padding-top: 20px;
}
.timeline-tip {
  width: 800px;
  margin-left: 69px;
}
.timeline-tip:last-of-type {
  margin-bottom: 20px;
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
  padding: 8px 2px;
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
  padding: 0px 8px;
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

/* Element-UI 修正 */
.fix-list-button .el-button {
  border: none;
}
.fix-list-button .el-link {
  font-size: 12px;
  line-height: 1;
  display: inline;
  margin-left: 10px;
}
.fix-list-button .el-link + .el-button {
  margin-left: 10px;
}
.fix-list-button .el-dropdown {
  margin-left: 10px;
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
.el-popover {
  z-index: 3000 !important;
}
.el-message {
  top: 40px !important;
  z-index: 3000 !important;
}
.el-message-box {
  width: 520px !important;
}
.el-message-box__status {
  top: 22px !important;
}
.el-notification__content {
  text-align: start !important;
}

.el-row {
  margin-bottom: 20px;
}
.el-row:last-child {
  margin-bottom: 0;
}
.el-form-item__content .el-select {
  display: block;
}
.el-form-item__error {
  font-size: 14px !important;
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
.el-tooltip__popper {
  z-index: 9999 !important;
}
.el-form .el-transfer-panel__item {
  /*https://github.com/ElemeFE/element/issues/18228*/
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
  vertical-align: none;
}
.el-menu-item {
  height: 47px !important;
  line-height: 47px !important;
}
.switch-tips {
  padding-left: 10px;
  font-size: 1px;
  font-weight: normal;
  color: darkgrey !important;
}
.el-checkbox.el-transfer-panel__item {
  margin-right: 0px !important;
}
.el-divider--horizontal:not(:first-of-type) {
  margin-top: 60px !important;
}

/* CodeMirror 修正 */
.CodeMirror-line * {
  font-family: Iosevka !important;
}
.cm-searching {
  background: none !important;
  border: 1px solid #f60 !important;
  border-radius: 3px !important;
}
.cm-trailingspace {
  background-color: lightgrey;
  border-radius: 3px;
}

/*动画效果*/
@keyframes highlight-code-line-blink {
  from, to {
    opacity: 1.0;
  }
  50% {
    opacity: 0.3;
  }
}
.highlight-code-line-blink {
  animation: highlight-code-line-blink .25s ease-in-out 0.3s 3;
}

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
  background-image: linear-gradient(to top, rgb(255, 102, 0, 0), rgb(255, 102, 0) 40%, rgb(255, 102, 0) 60%, rgb(255, 102, 0, 0));
}
::-webkit-scrollbar-track {
  background: none;
}
</style>
