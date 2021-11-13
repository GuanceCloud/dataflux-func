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

// 代码高亮
import hljs from 'highlight.js'
import 'highlight.js/styles/github.css'
Vue.directive('hljs', el => {
  hljs.highlightBlock(el);
});

// 分割
import splitPane from 'vue-splitpane'
Vue.component('split-pane', splitPane);

// 前端组件框架
// import 'element-ui/lib/theme-chalk/index.css'
// import '@/theme/element-#FF6600/index.css'
import '@/theme/element-#FF6600-v2/index.css'
import ElementUI from 'element-ui'
ElementUI.Tooltip.props.transition.default = false;
ElementUI.Popover.props.transition.default = false;
Vue.use(ElementUI)
window.ElementUI = ElementUI;

// 国际化
import VueI18n from 'vue-i18n'
import ElementLocale from 'element-ui/lib/locale';
import elementUILocale_en from 'element-ui/lib/locale/lang/en'
import elementUILocale_zhCN from 'element-ui/lib/locale/lang/zh-CN'
import elementUILocale_zhTW from 'element-ui/lib/locale/lang/zh-TW'
import elementUILocale_ja from 'element-ui/lib/locale/lang/ja'

import locales from '@/assets/yaml/locales.yaml'
import messages from '@/assets/yaml/messages.yaml'

Object.assign(locales.en,       messages.en);
Object.assign(locales['zh-CN'], messages['zh-CN']);

Object.assign(locales.en,       elementUILocale_en);
Object.assign(locales['zh-CN'], elementUILocale_zhCN);

Vue.use(VueI18n);

// 参考 https://blog.csdn.net/songhsia/article/details/104800966
ElementLocale.i18n((key, value) => i18n.t(key, value));

const i18n = new VueI18n({
  // 参见 https://zh.wikipedia.org/wiki/%E5%8C%BA%E5%9F%9F%E8%AE%BE%E7%BD%AE
  locale                : store.getters.uiLocale,
  fallbackLocale        : 'en',
  formatFallbackMessages: true,
  silentFallbackWarn    : true,
  silentTranslationWarn : true,
  messages              : locales,
});

// 时间处理
import moment from 'moment'
Vue.prototype.moment = moment;
Vue.prototype.M = moment;
Vue.filter('datetime', function(dt, pattern) {
  return toolkit.getDateTimeString(dt, pattern);
});
Vue.filter('fromNow', function(dt) {
  return toolkit.fromNow(dt);
});
Vue.filter('duration', function(d) {
  return toolkit.duration(d);
})

// 验证
import validator from 'validator';
Vue.prototype.validator = validator;

// 剪贴板
import clipboard from 'clipboard';
Vue.prototype.clipboard = clipboard;

// 其他
import * as encoding from '@/encoding'
Vue.prototype.encoding = encoding;

import * as common from '@/common'
Vue.prototype.common = common;

Vue.config.productionTip = false

// 常用业务组件
import Logo             from '@/components/Logo'
import InfoBlock        from '@/components/InfoBlock'
import CopyButton       from '@/components/CopyButton'
import FuncInfo         from '@/components/FuncInfo'
import FuzzySearchInput from '@/components/FuzzySearchInput'
import Pager            from '@/components/Pager'
Vue.component('Logo', Logo);
Vue.component('InfoBlock', InfoBlock);
Vue.component('CopyButton', CopyButton);
Vue.component('FuncInfo', FuncInfo);
Vue.component('FuzzySearchInput', FuzzySearchInput);
Vue.component('Pager', Pager);

// 项目业务组件
import GotoFuncButton from '@/components/GotoFuncButton'
Vue.component('GotoFuncButton', GotoFuncButton);

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
window.addEventListener('storage', function (ev) {
  let nextState = null;
  try {
    nextState = JSON.parse(ev.newValue);
  } catch(err) {
    console.error(err)
  }

  store.commit('syncState', nextState);
});

// 本体
const app = new Vue({
  router,
  store,
  i18n,
  render: h => h(App),
  methods: {
    goToSignOut() {
      this.$router.push({ name: 'sign-out' });
    },
    setUILocale(uiLocale) {
      this.$store.commit('updateUILocale', uiLocale);

      this.$nextTick(() => {
        let nextUILocale = this.$store.getters.uiLocale;
        this.$i18n.locale = nextUILocale;

        console.log(`Set UI Locale to [${nextUILocale}]`);
      });
    },
    setUITheme(uiTheme) {
      this.$store.commit('updateUITheme', uiTheme);

      this.$nextTick(() => {
        let nextUITheme = this.$store.getters.uiTheme;

        console.log(`Set UI Theme to [${nextUITheme}]`);
      });
    },
  }
}).$mount('#app');
window.app = app;

// 全剧配置
Vue.config.devtools = true;
Vue.config.productionTip = false;
Vue.config.silent = true;

import * as thanks from '@/thanks'
window.thanks = thanks.thanks;

window.conflictId = `${store.getters.clientId}:${toolkit.genRandString()}`;

export default app
