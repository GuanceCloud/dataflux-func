const os   = require('os');
const fs   = require('fs');
const path = require('path');
const cssmin = require('cssmin');

const IS_PROD = process.env.NODE_ENV == 'production';

var lightThemeCSS = fs.readFileSync(path.join(__dirname, './public/theme-light.css'));
var darkThemeCSS  = fs.readFileSync(path.join(__dirname, './public/theme-dark.css'));
var autoThemeCSS = '@media (prefers-color-scheme: light) {\n'
                 + lightThemeCSS
                 + '\n}'
                 + '@media (prefers-color-scheme: dark) {\n'
                 + darkThemeCSS
                 + '\n}';
fs.writeFileSync(path.join(__dirname, './public/theme-auto.css'), autoThemeCSS);

fs.writeFileSync(path.join(__dirname, './public/theme-light.min.css'), cssmin(lightThemeCSS.toString()));
fs.writeFileSync(path.join(__dirname, './public/theme-dark.min.css'), cssmin(darkThemeCSS.toString()));
fs.writeFileSync(path.join(__dirname, './public/theme-auto.min.css'), cssmin(autoThemeCSS.toString()));

function getNetworkIP() {
  let networkIP = null;
  let interfaces = os.networkInterfaces();
  for (let interface in interfaces) {
    let ips = interfaces[interface];

    for (let i = 0; i < ips.length; i++) {
      if (!ips[i].internal && ips[i].family === 'IPv4') {
        return ips[i].address;
      }
    }
  }
}

module.exports = {
  publicPath: IS_PROD ? '/client-app/' : '/',
  productionSourceMap: false,
  chainWebpack: config => {
    config.module
      .rule('vue')
      .use('vue-loader')
        .loader('vue-loader')
        .tap(options => {
          options.compilerOptions.whitespace = 'preserve';
          return options;
        })
        .end();
    config.module
      .rule('i18n')
      .resourceQuery(/blockType=i18n/)
      .type('javascript/auto')
      .use('i18n')
        .loader("@intlify/vue-i18n-loader")
        .end();
  },
  devServer: {
    sockHost: getNetworkIP(),
    disableHostCheck: true,
  },
  pluginOptions: {
    dll: {
      cacheFilePath: path.resolve(__dirname, './public'),
      entry: {
        'framework': [
          'element-ui',
          'vue',
          'vue-router',
          'vue-splitpane',
          'vuex',
          'vuex-persistedstate',
        ],
        'codemirror': [
          'codemirror',
        ],
        'lib': [
          'core-js',
          'axios',
          'socket.io-client',
          'clipboard',
          'diff',
          'file-saver',
          'highlight.js',
          'js-base64',
          'json-stringify-pretty-compact',
          'moment',
          'splitargs',
          'validator',
        ],
      }
    }
  },
}
