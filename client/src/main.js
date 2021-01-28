import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'

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
Vue.use(ElementUI)

// 国际化
import VueI18n from 'vue-i18n'
Vue.use(VueI18n)

import locales from '@/locales'

const i18n = new VueI18n({
  // 参见 https://zh.wikipedia.org/wiki/%E5%8C%BA%E5%9F%9F%E8%AE%BE%E7%BD%AE
  locale                : store.getters.uiLocale,
  fallbackLocale        : 'en',
  formatFallbackMessages: true,
  silentFallbackWarn    : true,
  silentTranslationWarn : true,
  messages              : locales,
})

// 时间处理
import moment from 'moment'
Vue.prototype.moment = moment;
Vue.prototype.M = moment;
Vue.filter('datetime', function(dataStr, pattern='YYYY-MM-DD HH:mm:ss') {
  return moment.utc(dataStr).locale('zh_CN').utcOffset(8).format(pattern);
});
Vue.filter('fromNow', function(dataStr) {
  return moment.utc(dataStr).locale('zh_CN').fromNow();
});

// 验证
import validator from 'validator';
Vue.prototype.validator = validator;

// 剪贴板
import clipboard from 'clipboard';
Vue.prototype.clipboard = clipboard;

// 公共函数
import * as toolkit from '@/toolkit'
Vue.prototype.toolkit = toolkit;
Vue.prototype.T = toolkit;

// 常量
import * as const_ from '@/const'
Vue.prototype.const = const_;
Vue.prototype.C = const_;

// 其他
import * as encoding from '@/encoding'
Vue.prototype.encoding = encoding;

import * as common from '@/common'
Vue.prototype.common = common;

Vue.config.productionTip = false

// 常用业务组件
import Logo           from '@/components/Logo'
import InfoBlock      from '@/components/InfoBlock'
import CopyButton     from '@/components/CopyButton'
import GotoFuncButton from '@/components/GotoFuncButton'
Vue.component('Logo', Logo);
Vue.component('InfoBlock', InfoBlock);
Vue.component('CopyButton', CopyButton);
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
const vm = new Vue({
  router,
  store,
  i18n,
  render: h => h(App)
}).$mount('#app');
window.vm = vm;

// 全剧配置
Vue.config.devtools = true;
Vue.config.productionTip = false;
Vue.config.silent = true;

import * as thanks from '@/thanks'
window.thanks = thanks.thanks;
