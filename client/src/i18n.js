import Vue from 'vue'
import * as T from '@/toolkit'

import elementUILocale_en   from 'element-ui/lib/locale/lang/en'
import elementUILocale_zhCN from 'element-ui/lib/locale/lang/zh-CN'
import elementUILocale_zhTW from 'element-ui/lib/locale/lang/zh-TW'
const elementUILocales = {
  en     : elementUILocale_en,
  'zh-CN': elementUILocale_zhCN,
  'zh-HK': elementUILocale_zhTW,
  'zh-TW': elementUILocale_zhTW,
}

import locales  from '@/assets/yaml/locales.yaml'
import messages from '@/assets/yaml/messages.yaml'

import locales_zht  from '@/assets/yaml/locales.zht.yaml'
import messages_zht from '@/assets/yaml/messages.zht.yaml'
Object.assign(locales, locales_zht)
Object.assign(messages, messages_zht)

Object.keys(locales).forEach(lang => {
  [ elementUILocales, messages ].forEach( localeSrc => {
    if (!localeSrc || !localeSrc[lang]) return;
    Object.assign(locales[lang], localeSrc[lang]);
  })
});

import VueI18n from 'vue-i18n'
Vue.use(VueI18n);

const i18n = new VueI18n({
  // 参见 https://zh.wikipedia.org/wiki/%E5%8C%BA%E5%9F%9F%E8%AE%BE%E7%BD%AE
  locale                : T.getUILocale(),
  fallbackLocale        : 'en',
  formatFallbackMessages: true,
  silentFallbackWarn    : true,
  silentTranslationWarn : true,
  messages              : locales,
});

// ElementUI
// 参考 https://blog.csdn.net/songhsia/article/details/104800966
import ElementLocale from 'element-ui/lib/locale';
ElementLocale.i18n((key, value) => i18n.t(key, value));

export default i18n
