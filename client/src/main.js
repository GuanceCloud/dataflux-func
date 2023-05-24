import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'

import yaml from 'js-yaml'

// 公共函数
import * as toolkit from '@/toolkit'
Vue.prototype.toolkit = toolkit;
Vue.prototype.T = toolkit;

// 常量
import const_ from '@/const'
Vue.prototype.const = const_;
Vue.prototype.C = const_;

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
ElementUI.Tooltip.props.transition.default        = false;
ElementUI.Popover.props.transition.default        = false;
ElementUI.Popover.props.openDelay.default         = 50;
ElementUI.Popover.props.closeDelay.default        = 100;
ElementUI.Link.props.underline.default            = true;
ElementUI.Link.props.type.default                 = 'primary';
ElementUI.Form.props.validateOnRuleChange.default = false;
ElementUI.Dialog.props.modalAppendToBody.default  = true;
ElementUI.Dialog.props.appendToBody.default       = true;
ElementUI.Dialog.props.top.default                = '10vh';
Vue.use(ElementUI);
window.ElementUI = ElementUI
// 国际化
import VueI18n from 'vue-i18n'
Vue.use(VueI18n);

import elementUILocale_en   from 'element-ui/lib/locale/lang/en'
import elementUILocale_zhCN from 'element-ui/lib/locale/lang/zh-CN'
const elementUILocales = {
  en     : elementUILocale_en,
  'zh-CN': elementUILocale_zhCN,
}

import locales  from '@/assets/yaml/locales.yaml'
import messages from '@/assets/yaml/messages.yaml'
const_.UI_LOCALE.forEach(_locale => {
  let lang = _locale.key;
  [ elementUILocales, messages ].forEach( localeSrc => {
    if (!localeSrc || !localeSrc[lang]) return;
    Object.assign(locales[lang], localeSrc[lang]);
  })
});

const i18n = new VueI18n({
  // 参见 https://zh.wikipedia.org/wiki/%E5%8C%BA%E5%9F%9F%E8%AE%BE%E7%BD%AE
  locale                : store.getters.uiLocale,
  fallbackLocale        : 'en',
  formatFallbackMessages: true,
  silentFallbackWarn    : true,
  silentTranslationWarn : true,
  messages              : locales,
});

import ElementLocale from 'element-ui/lib/locale';
// 参考 https://blog.csdn.net/songhsia/article/details/104800966
ElementLocale.i18n((key, value) => i18n.t(key, value));
Vue.prototype.i18n = i18n;

// 时间处理
import moment, { locale } from 'moment'
Vue.prototype.moment = moment;
Vue.prototype.M = moment;
Vue.filter('datetime', function(dt, pattern) {
  return toolkit.getDateTimeString(dt, pattern);
});
Vue.filter('fromNow', function(dt) {
  return toolkit.fromNow(dt);
});
Vue.filter('duration', function(d, digits) {
  if (d < 0) d = 0;
  let seconds = toolkit.duration(d).asSeconds();
  if (digits) seconds = seconds.toFixed(digits);
  return seconds;
})

// 验证
import validator from 'validator';
Vue.prototype.validator = validator;

// 剪贴板
import clipboardJS from 'clipboard';
Vue.prototype.clipboardJS = clipboardJS;

// 防止连点
import preventReClick from '@/preventReClick'
Vue.use(preventReClick);

// 其他
import * as common from '@/common'
Vue.prototype.common = common;

Vue.config.productionTip = false

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

// 初始化 vuex 数据，避免报错

// 本体
const app = new Vue({
  router,
  store,
  i18n,
  render: h => h(App),

  created() {
    this.$store.dispatch('loadSystemInfo');
    this.$store.dispatch('loadUserProfile');
    this.$store.dispatch('loadAPINamesLocales');
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
    setUILocale(uiLocale) {
      this.$store.commit('updateUILocale', uiLocale);

      // 某些前端组件无法有效支持直接切换，刷新页面最为稳妥
      // this.$nextTick(() => {
      //   this.$i18n.locale = this.$store.getters.uiLocale;
      // });
      this.$loading();
      setImmediate(() => {
        location.reload();
      });
    },
    setUITheme(uiTheme) {
      this.$store.commit('updateUITheme', uiTheme);
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

window.conflictId = `${store.getters.clientId}:${toolkit.genRandString()}`;

export default app
