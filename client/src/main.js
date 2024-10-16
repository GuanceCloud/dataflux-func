import Vue from 'vue'
import App from '@/App.vue'
import router from '@/router'
import store from '@/store'

// 公共函数
import * as T from '@/toolkit'
Vue.prototype.T = T;

// 常量
import C from '@/const'
Vue.prototype.const = C;
Vue.prototype.C = C;

// 图标
import 'font-awesome/css/font-awesome.css'

// 分割
import splitPane from 'vue-splitpane'
Vue.component('split-pane', splitPane);

// 前端组件框架
// import 'element-ui/lib/theme-chalk/index.css'
// import '@/theme/element-#FF6600/index.css'
import '@/theme/element-#FF6600-v2/index.css'
import ElementUI from 'element-ui'
ElementUI.Footer.props.height.default = '80px';

ElementUI.Tooltip.props.transition.default = false;

ElementUI.Popover.props.transition.default = false;
ElementUI.Popover.props.openDelay.default  = 50;
ElementUI.Popover.props.closeDelay.default = 500;

ElementUI.Link.props.underline.default = true;
ElementUI.Link.props.type.default      = 'primary';

ElementUI.Dialog.props.modalAppendToBody.default = true;
ElementUI.Dialog.props.appendToBody.default      = true;
ElementUI.Dialog.props.top.default               = '10vh';
ElementUI.Dialog.props.destroyOnClose.default    = true;

ElementUI.Form.props.validateOnRuleChange.default = false;

if (store.getters.uiColorSchema === 'dark') {
  ElementUI.Progress.props.defineBackColor.default = '#555';
}

Vue.use(ElementUI);
window.ElementUI = ElementUI

// 国际化
import i18n from '@/i18n'
Vue.prototype.i18n = i18n;

// 时间处理
import moment, { locale } from 'moment'
Vue.prototype.moment = moment;
Vue.prototype.M = moment;

Vue.filter('datetime', function(d, f) {
  return T.getDateTimeString(d, f);
});
Vue.filter('fromNow', function(d) {
  return T.fromNow(d);
});
Vue.filter('toNow', function(d) {
  return T.toNow(d);
});
Vue.filter('toFuture', function(d) {
  return T.toFuture(d);
});

// 验证
import validator from 'validator';
Vue.prototype.validator = validator;

// 剪贴板
import clipboardJS from 'clipboard';
Vue.prototype.clipboardJS = clipboardJS;

// JSON 查看器
import JsonViewer from 'vue-json-viewer';
Vue.use(JsonViewer);

// 防止连点
import preventReClick from '@/preventReClick'
Vue.use(preventReClick);

// 其他
import * as common from '@/common'
Vue.prototype.common = common;

// 常用业务组件
import Logo             from '@/components/Logo'
import InfoBlock        from '@/components/InfoBlock'
import RelativeDateTime from '@/components/RelativeDateTime'
import FuncInfo         from '@/components/FuncInfo'
import FuzzySearchInput from '@/components/FuzzySearchInput'
import Pager            from '@/components/Pager'
import PageLoading      from '@/components/PageLoading'
import GotoFuncButton   from '@/components/GotoFuncButton'
import CopyButton       from '@/components/CopyButton'
Vue.component('Logo', Logo);
Vue.component('InfoBlock', InfoBlock);
Vue.component('RelativeDateTime', RelativeDateTime);
Vue.component('FuncInfo', FuncInfo);
Vue.component('FuzzySearchInput', FuzzySearchInput);
Vue.component('Pager', Pager);
Vue.component('PageLoading', PageLoading);
Vue.component('GotoFuncButton', GotoFuncButton);
Vue.component('CopyButton', CopyButton);

// 全局异常处理
const apiRespErrorHandler = (err, vm) => {
  if (err.status) {
    console.error(err);
  } else {
    throw err;
  }
};

Vue.config.errorHandler = apiRespErrorHandler;
Vue.prototype.$throw = err => apiRespErrorHandler(err, this);

// 错误弹框增加抖动效果
let originAlert = Vue.prototype.$alert;
Vue.prototype.$alert = (message, title, options) => {
  options = options || {};
  if (options.type === 'error') {
    options.customClass = 'error-input-shake';
  }
  return originAlert(message, title, options);
}

// LocalStorage 监听
window.addEventListener('storage', function(ev) {
  if (ev.key !== 'vuex') return;

  let nextState = null;
  try {
    nextState = JSON.parse(ev.newValue);
  } catch(err) {
    console.error(err)
  }

  store.commit('syncState', nextState);
});

// Vue 实例
const app = new Vue({
  router,
  store,
  i18n,
  render: h => h(App),

  async created() {
    this.$store.dispatch('loadSystemInfo');
    this.$store.dispatch('loadUserProfile');

    let apiNamesLocales_zhCN = await this.$store.dispatch('getAPINamesLocales');
    i18n.mergeLocaleMessage('zh-CN', apiNamesLocales_zhCN);
  },
  computed: {
    systemSettings() {
      return this.$store.getters.SYSTEM_INFO('SYSTEM_SETTINGS', {});
    },
  },
  methods: {
    goToSignOut() {
      this.$router.push({ name: 'sign-out' });
    },
    reloadPage() {
      this.$loading();

      setImmediate(() => {
        location.reload();
      });
    },
    setUILocale(uiLocale) {
      this.$store.commit('updateUILocale', uiLocale);

      // 某些前端组件无法有效支持直接切换，刷新页面最为稳妥
      this.reloadPage();
    },
    setUITheme(uiTheme) {
      this.$store.commit('updateUITheme', uiTheme);

      // 某些前端组件无法有效支持直接切换，刷新页面最为稳妥
      this.reloadPage();
    },

    checkUserProfileForGit() {
      let userProfile = this.$store.state.userProfile || {};

      if (!userProfile.name || !userProfile.email) {
        this.$store.commit('updateShowCompleteUserProfile', true);
        return false;
      }
      return true;
    },
  }
}).$mount('#app');
window.app = app;

// 全局配置
Vue.config.devtools      = true;
Vue.config.productionTip = false;
Vue.config.silent        = true;

import * as thanks from '@/thanks'
window.thanks = thanks.thanks;

window.conflictId = `${store.getters.clientId}:${T.genRandString()}`;

export default app
