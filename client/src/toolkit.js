import axios from 'axios'
import router from '@/router'
import store from '@/store'
import { MessageBox } from 'element-ui';

// CodeMirror
import CodeMirror from 'codemirror/lib/codemirror'
import 'codemirror/lib/codemirror.css'
import 'codemirror/keymap/sublime'
// CodeMirror高亮
import 'codemirror/mode/python/python'
import 'codemirror/mode/diff/diff'
// CodeMirror代码折叠
import 'codemirror/addon/fold/foldgutter.css'
import 'codemirror/addon/fold/foldcode.js'
import 'codemirror/addon/fold/foldgutter.js'
import 'codemirror/addon/fold/brace-fold.js'
import 'codemirror/addon/fold/indent-fold.js'
import 'codemirror/addon/fold/comment-fold.js'
// CodeMirror当前行高亮
import 'codemirror/addon/selection/active-line.js'
// CodeMirror代码提示
import 'codemirror/addon/hint/show-hint.js'
// CodeMirror自动括号提示/自动补全
import 'codemirror/addon/edit/matchbrackets.js'
import 'codemirror/addon/edit/closebrackets.js'
// CodeMirror行尾空格
import 'codemirror/addon/edit/trailingspace.js'
// CodeMirror注释
import 'codemirror/addon/comment/comment.js'
import 'codemirror/addon/comment/continuecomment.js'
// CodeMirror查询
import 'codemirror/addon/search/search.js'
import 'codemirror/addon/search/searchcursor.js'
import 'codemirror/addon/dialog/dialog.js'
import 'codemirror/addon/dialog/dialog.css'

// CodeMirror主题
import 'codemirror/theme/eclipse.css'
import 'codemirror/theme/monokai.css'
import 'codemirror/theme/base16-light.css'
import 'codemirror/theme/base16-dark.css'
import 'codemirror/theme/duotone-light.css'
import 'codemirror/theme/duotone-dark.css'
import 'codemirror/theme/neat.css'
import 'codemirror/theme/material-darker.css'
import 'codemirror/theme/eclipse.css'
import 'codemirror/theme/idea.css'
import 'codemirror/theme/darcula.css'

// Base64
import { Base64 } from 'js-base64'

// 时间处理
import moment from 'moment'

// DIFF
import { diffTrimmedLines } from 'diff'

// DataFlux Func hint
import '@/assets/css/dff-hint.css'
import '@/assets/js/dff-anyword.js'

export const MIN_UNIX_TIMESTAMP    = 0;
export const MIN_UNIX_TIMESTAMP_MS = MIN_UNIX_TIMESTAMP * 1000;
export const MAX_UNIX_TIMESTAMP    = 2145888000; // 2038-01-01 00:00:00
export const MAX_UNIX_TIMESTAMP_MS = MAX_UNIX_TIMESTAMP * 1000;

// 国际化
import app from '@/main';

import C from '@/const'

let handleCircular = function() {
  let cache = [];
  let keyCache = []
  return function(key, value) {
    if (typeof value === 'object' && value !== null) {
      let index = cache.indexOf(value);
      if (index !== -1) {
          return '[Circular ' + keyCache[index] + ']';
      }
      cache.push(value);
      keyCache.push(key || 'root');
    }
    return value;
  }
}

let originalJSONStringify = JSON.stringify;
JSON.stringify = function(value, replacer, space) {
  replacer = replacer || handleCircular();
  return originalJSONStringify(value, replacer, space);
}

export function _switchToBuiltinAuth() {
  store.commit('switchToBuiltinAuth');
};

export function getBaseURL() {
  let baseURL = store.getters.CONFIG('WEB_BASE_URL') || location.origin;
  return baseURL;
};

export function getBrowserName() {
  var userAgent = navigator.userAgent.toLowerCase();
  var isOpera = userAgent.indexOf('opera') > -1;
  if (isOpera) return 'opera';
  else if (userAgent.indexOf('firefox') > -1) return 'firefox';
  else if (userAgent.indexOf('chrome') > -1)  return 'chrome';
  else if (userAgent.indexOf('safari') > -1)  return 'safari';
  else if (userAgent.indexOf('compatible') > -1 && userAgent.indexOf('msie') > -1 && !isOpera) return 'internet-explorer';
  return null;
};

export function autoScrollTable(y) {
  if (y && vm.$store.state.highlightedTableDataId && document.getElementsByClassName('hl-row')[0]) {
    // 滚动到指定高度
    let el = document.getElementsByClassName('el-table__body-wrapper')[0];
    if (el) {
      el.scrollTo(null, y);
      return;
    }
  }
}

export function getTableScrollY() {
  let el = document.getElementsByClassName('el-table__body-wrapper')[0];
  if (!el) return null;

  return el.scrollTop;
}

export function isChrome() {
  return navigator.userAgent.indexOf('Chrome') >= 0;
}

export function isMac() {
  return (navigator.platform == "Mac68K")
      || (navigator.platform == "MacPPC")
      || (navigator.platform == "Macintosh")
      || (navigator.platform == "MacIntel");
}

export function getSuperKeyName() {
  return isMac() ? 'cmd' : 'CTRL';
}
export function getAltKeyName() {
  return isMac() ? 'opt' : 'ALT';
}
export function getShiftKeyName() {
  return isMac() ? 'shift' : 'SHIFT';
}

export function debounce(fn, delay) {
  let delays = delay || 500;
  let timer;
  return function() {
    let self = this;
    let args = arguments;
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(function() {
      timer = null;
      fn.apply(self, args);
    }, delays);
  };
};

export function sleep(duration) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve()
    }, duration)
  })
};

export function strf() {
  let args = Array.prototype.slice.call(arguments);
  if (0 === args.length) {
    return '';
  }

  let pattern = args.shift();
  try {
    pattern = pattern.toString();
  } catch (ex) {
    pattern = '';
  }

  return pattern.replace(/\{(\d+)\}/g, function replaceFunc(m, i) {
    return args[i] + '';
  });
};

export function getBase64(str, uriSafe) {
  if (uriSafe) {
    return Base64.encodeURI(str);
  } else {
    return Base64.encode(str);
  }
};
export function getBase64_old(str) {
  return btoa(encodeURIComponent(str)).replace(/ /g, '+');
};

export function fromBase64(base64str, keepBuffer) {
  if (keepBuffer) {
    return Base64.atob(base64str);
  } else {
    return Base64.decode(base64str);
  }
};
export function fromBase64_old(base64str) {
  return decodeURIComponent(atob(base64str.replace(/ /g, '+')));
};

export function genRandString(len, chars) {
  if (!len) len = 32;

  var samples = chars || '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

  var randString = '';
  for (var i = 0; i < len; i++) {
    var randIndex = Math.floor(Math.random() * samples.length);
    randString += samples[randIndex];
  }

  return randString;
};

export function isNullOrUndefined(o) {
  if (o === null || o === undefined) {
    return true;
  }

  return false;
};

export function isNullOrEmpty(o) {
  if (isNullOrUndefined(o) === true) {
    return true;
  }

  if ('string' === typeof o && o.length === 0) {
    return true;
  }

  return false;
};

export function isNullOrWhiteSpace(o) {
  if (isNullOrEmpty(o) === true) {
    return true;
  }

  if ('string' === typeof o && o.trim().length === 0) {
    return true;
  }

  return false;
};

export function noNullOrWhiteSpace(o) {
  var newObj = {};
  for (var k in o) {
    if (isNullOrWhiteSpace(o[k])) continue;

    newObj[k] = o[k];
  }

  return newObj;
};

export function isNothing(o) {
  if (isNullOrWhiteSpace(o) === true) {
    return true;
  }

  if ('string' === typeof o && o.trim().length === 0) {
    return true;
  } else if (Array.isArray(o) && o.length === 0) {
    return true;
  } else if (JSON.stringify(o) === '{}') {
    return true;
  }

  return false;
};

export function asArray(o) {
  if (isNullOrUndefined(o)) {
    return o;

  } else if (Array.isArray(o)) {
    return o;

  } else {
    return [o];
  }
};

export function limitLines(text, lineLimit, columnLimit) {
  if (!text) return text;

  if (!lineLimit) lineLimit = 5;

  let start = 0;
  let end   = lineLimit;
  if (lineLimit < 0) {
    start = lineLimit;
    end   = undefined;
  }

  let lines = text.split('\n');
  if (lines.length > Math.abs(lineLimit)) {
    lines = lines.slice(start, end);

    if (lineLimit > 0) {
      lines.push('...');
    } else if (lineLimit < 0) {
      lines.unshift('...');
    }
  }

  if (columnLimit) {
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].length > columnLimit) {
        lines[i] = lines[i].slice(0, columnLimit) + '...';
      }
    }
  }

  return lines.join('\n');
};

export function jsonFind(j, path, safe) {
  if (j === null || 'undefined' === typeof j) {
    if (safe) {
      return null;
    } else {
      throw new Error('jsonFind() - hit `null`');
    }
  }

  if (path === null) {
    if (safe) {
      return null;
    } else {
      throw new Error('jsonFind() - `null` path');
    }
  }

  var currPath = '<TOP>';
  var subJ = j;
  var steps = path.split('.');
  for (var i = 0; i < steps.length; i++) {
    var step = steps[i];
    currPath = [currPath, step].join('.');

    if ('undefined' === typeof subJ) {
      if (safe) {
        return null;
      } else {
        throw new Error('jsonFind() - hit `undefined` at `' + currPath + '`');
      }

      break;
    }

    subJ = subJ[step];
  }

  return subJ;
};

export function jsonCopy(j) {
  return JSON.parse(JSON.stringify(j));
};

export function jsonPick(j, keys) {
  if (isNothing(keys)) return j;

  keys = asArray(keys);

  var ret = {};
  var _copied = jsonCopy(j);

  for (var i = 0; i < keys.length; i++) {
    var k = keys[i];
    ret[k] = _copied[k];
  }

  return ret;
};

export function jsonUpdate(src, dest, options) {
  options = options || {};

  let next = jsonCopy(src || {});
  if (dest) {
    for (let k in dest) {
      let v = dest[k];

      if (isNothing(v)) {
        delete next[k];
      } else {
        next[k] = v;
      }
    }
  }

  return next;
};

export function jsonClear(j, clearValue) {
  clearValue = clearValue || null;

  for (let k in j) if (j.hasOwnProperty(k)) {
    j[k] = clearValue
  }
};

export function jsonLength(j) {
  return Object.keys(j).length;
};

export function startsWith(s, prefix) {
  return s.indexOf(prefix) === 0;
};

export function endsWith(s, suffix) {
  return (s.slice(-1 * suffix.length) === suffix);
};

export function getDiffInfo(src, dest) {
  src  = src  || '';
  dest = dest || '';

  let diffResult = diffTrimmedLines(src, dest);

  let srcTotalCount  = src.split('\n').length;
  let destTotalCount = dest.split('\n').length;

  let addedCount   = 0;
  let removedCount = 0;
  diffResult.forEach(x => {
    if (x.added) {
      addedCount += x.value.split('\n').length - 1;
    } else if (x.removed) {
      removedCount += x.value.split('\n').length - 1;
    }
  });

  let diffInfo = {
    srcTotalCount : srcTotalCount,
    destTotalCount: destTotalCount,
    addedCount    : addedCount,
    removedCount  : removedCount,
  };
  return diffInfo;
};

export function padZero(num, length, char) {
  var len = num.toString().length;
  while (len < length) {
    num = (char || '0') + num;
    len++;
  }

  return num;
};

export function formatQuery(query) {
  let queryString = '';
  if (query) {
    let queryStringParts = [];
    for (let k in query) if (query.hasOwnProperty(k)) {
      let v = query[k];
      if ('undefined' === typeof v || null === v) continue;

      switch(typeof v) {
        case 'string':
        case 'number':
        case 'boolean':
          v = v.toString();
          break;

        case 'object':
          v = JSON.stringify(v);
          break;
      }

      v = encodeURIComponent(v);

      queryStringParts.push(`${k}=${v}`);
    }

    if (queryStringParts.length > 0) {
      queryString = `${queryStringParts.join('&')}`;
    }
  }

  return queryString;
};

export function formatURL(pathPattern, options) {
  options = options || {};

  let path = pathPattern;
  if (options.params) {
    for (let k in options.params) if (options.params.hasOwnProperty(k)) {
      let v = options.params[k];
      path = path.replace(`/:${k}`, `/${v}`);
    }
  }

  let baseURL = options.baseURL || '';
  if (baseURL === true) {
    // baseURL = process.env.VUE_APP_SERVER_BASE_URL;
    baseURL = getBaseURL();
  }
  if (baseURL && baseURL.slice(-1) === '/') {
    baseURL = baseURL.slice(0, -1);
  }

  if (options.auth) {
    options.query = options.query || {};
    let authQuery = store.getters.CONFIG('_WEB_AUTH_QUERY');
    options.query[authQuery] = store.state.xAuthToken;
  }

  let queryString = '';
  if (options.query) {
    queryString = formatQuery(options.query);
    if (queryString) {
      queryString = '?' + queryString;
    }
  }

  let url = `${baseURL}${path}${queryString}`;

  return url;
};

export function getQuery(url) {
  var query = {};

  url = url || '';
  var queryString = url.split('#')[0].split('?')[1];
  if (!queryString) {
    return query;
  }

  var parts = queryString.split('&');
  for (var i = 0; i < parts.length; i++) {
    var kv = parts[i].split('=');
    var k = kv[0];
    var v = kv[1];

    if (!query[k]) {
      query[k] = v;
    } else {
      if (Array.isArray(query[k])) {
        query[k].push(v);
      } else {
        query[k] = [query[k], v];
      }
    }
  }

  return query;
};

export function compareVersion(a, b) {
  var _parseInt = function(x) {
    return parseInt(x) || 0;
  };
  var _getVersionString = function(x) {
    var m = x.match(/^\d+(\.\d+)+/g);
    if (m) return m[0];
    return '0';
  }

  a = a || '0';
  b = b || '0';
  var _a = _getVersionString(a);
  var _b = _getVersionString(b);

  if (_a === _b && _a === '0') {
    if (a == b) return 0;
    return a < b ? -1 : 1;
  }

  var aParts = _a.split('.').map(_parseInt);
  var bParts = _b.split('.').map(_parseInt);

  for (var i = 0; i < Math.max(aParts.length, bParts.length); i++) {
    aParts[i] = aParts[i] || -1;
    bParts[i] = bParts[i] || -1;

    if (aParts[i] > bParts[i]) {
      return 1;
    } else if (aParts[i] < bParts[i]) {
      return -1;
    }
  }
  return 0;
};

export function isExpired(dt) {
  return moment.utc(dt).unix() < moment().unix();
};

export function getDateTimeString(dt, pattern) {
  let utcOffset = (0 - new Date().getTimezoneOffset() / 60);
  let inputTime = moment.utc(dt).locale(store.getters.uiLocale).utcOffset(utcOffset);

  if (!pattern) {
    pattern = 'YYYY-MM-DD HH:mm:ss';
  }
  return inputTime.format(pattern);
};

export function fromNow(dt) {
  return moment.utc(dt).locale(store.getters.uiLocale).fromNow();
};

export function stringSimilar(s, t, f) {
  if (!s || !t) {
      return 0
  }
  var l = s.length > t.length ? s.length : t.length
  var n = s.length
  var m = t.length
  var d = []
  f = f || 3
  var min = function(a, b, c) {
      return a < b ? (a < c ? a : c) : (b < c ? b : c)
  }
  var i, j, si, tj, cost
  if (n === 0) return m
  if (m === 0) return n
  for (i = 0; i <= n; i++) {
      d[i] = []
      d[i][0] = i
  }
  for (j = 0; j <= m; j++) {
      d[0][j] = j
  }
  for (i = 1; i <= n; i++) {
      si = s.charAt(i - 1)
      for (j = 1; j <= m; j++) {
          tj = t.charAt(j - 1)
          if (si === tj) {
              cost = 0
          } else {
              cost = 1
          }
          d[i][j] = min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost)
      }
  }
  let res = (1 - d[n][m] / l)
  return parseFloat(res.toFixed(f));
}

export function asideItemSorter(a, b) {
  return a.label < b.label ? -1 : a.label > b.label ? 1 : 0;
};

function _getCallAPIOpt(method, pathPattern, options) {
  options = options || {};

  let url = formatURL(pathPattern, {
    params: options.params,
  });

  let axiosOpt = {
    method      : method,
    url         : url,
    timeout     : options.timeout || 180 * 1000,
    extraOptions: options.extraOptions,
  };

  if (process.env.VUE_APP_SERVER_BASE_URL) {
    axiosOpt.baseURL = process.env.VUE_APP_SERVER_BASE_URL;
  }

  if (options.query) {
    axiosOpt.params = options.query;
  }
  if (options.body) {
    axiosOpt.data = options.body;
  }
  if (options.headers) {
    axiosOpt.headers = options.headers;
  }
  if (options.respType) {
    axiosOpt.responseType = options.respType;
  }

  // 注入认证信息
  if (store.state.xAuthToken) {
    axiosOpt.headers = axiosOpt.headers || {};

    axiosOpt.headers[store.getters.CONFIG('_WEB_CLIENT_ID_HEADER')] = store.getters.clientId;
    axiosOpt.headers[store.getters.CONFIG('_WEB_ORIGIN_HEADER')]    = 'DFF-UI';

    let authHeaderField = store.getters.CONFIG('_WEB_AUTH_HEADER');
    if (store.state.xAuthToken) {
      axiosOpt.headers[authHeaderField] = store.state.xAuthToken;
    }
  }

  // 自动转换某些查询字段
  if (axiosOpt.params) {
    for (let k in axiosOpt.params) if (axiosOpt.params.hasOwnProperty(k)) {
      let v = axiosOpt.params[k];

      switch(k) {
        // 新版
        case 'fields':
        case 'sort':
        // 旧版
        case 'fieldPicking':
        case 'fieldKicking':
          if (Array.isArray(v)) axiosOpt.params[k] = v.join(',');
          break;
      }
    }
  }

  return axiosOpt;
};

async function _prepareAPIResp(apiResp) {
  let respContentType = apiResp.headers['content-type'];

  if ('string' === typeof respContentType && respContentType.indexOf('application/json') >= 0) {
    let apiRespData = apiResp.data;

    switch (Object.prototype.toString.call(apiRespData)) {
      case '[object Blob]':
        apiRespData = await apiRespData.text();
        apiRespData = JSON.parse(apiRespData);
        break;

      case '[object String]':
        apiRespData = JSON.parse(apiRespData);
        break;
    }

    apiResp.data = apiRespData;
  }

  return apiResp;
};

function _logCallingAPI(axiosOpt, apiResp) {
  return;

  // 仅开发模式输出
  if (process.env.NODE_ENV !== 'development') return;

  try {
    console.info(`%c[Call API]: ${axiosOpt.method.toUpperCase()} ${axiosOpt.url}`, 'color: cyan');
    if (axiosOpt.params) {
      console.info('    Query', axiosOpt.params);
    }
    if (axiosOpt.data) {
      console.info('    Body', axiosOpt.data);
    }

    let respColor = apiResp.status < 400 ? 'cyan' : 'red';
    let respData  = apiResp.data;
    let respContentType = apiResp.headers['content-type'];
    if (!respContentType || 'string' === typeof respContentType && respContentType.indexOf('application/json') < 0) {
      respData = {raw: respData};
    }
    console.info(`%c    [Resp]: ${apiResp.status} ${apiResp.statusText}`, `color:${respColor}`);

    // 输出完整API返回数据
    console.info('        Data', respData);
    if (respData.data && Array.isArray(respData.data) && isChrome() && 'function' === typeof console.table) {
      console.table(respData.data);
    }

  } catch(err) {
    console.error('Log Calling API:', err)
  }
};

async function _callAPI(axiosOpt) {
  let isNoCount = false;
  if (axiosOpt.extraOptions && axiosOpt.extraOptions.noCountProcessing) {
    isNoCount = true;
  }

  if (!isNoCount){
    store.commit('startProcessing');
  }

  try {
    let resp = await axios(axiosOpt);
    resp = await _prepareAPIResp(resp);
    return resp;

  } catch (err) {
    if (err.response) {
      if (err.response.status === 401 && err.response.data.reason === 'EUserAuth') {
        store.commit('updateXAuthToken', null);
        router.push({name: 'index'});
      }

      let errResp = await _prepareAPIResp(err.response)
      return errResp;
    }

    await MessageBox.alert(`与服务器通讯失败，请稍后再试
        <br>如果问题持续出现，请联系管理员，检查服务器状态
        <br>${err.toString()}`, `与服务器通讯失败`, {
      dangerouslyUseHTMLString: true,
      confirmButtonText: '了解',
      type: 'error',
    });

    throw err;

  } finally {
    if (!isNoCount){
      store.commit('endProcessing');
    }
  }
};

export async function callAPI(method, pathPattern, options) {
  if (method[0] === '/') {
    options     = pathPattern;
    pathPattern = method;
    method      = 'get';
  }

  options = options || {};

  const axiosOpt = _getCallAPIOpt(method, pathPattern, options);
  let apiResp = await _callAPI(axiosOpt);

  _logCallingAPI(axiosOpt, apiResp);

  if (options.alert) {
    let alert = options.alert;

    if (apiResp.status < 400) {
      if (alert.showSuccess) {
        await MessageBox.alert(app.$t('Operation succeeded'), alert.title, {
          confirmButtonText: app.$t('Very good'),
          type: 'success',
        });
      }
    } else {
      if (apiResp.status === 401 && apiResp.data.reason === 'EUserAuth') {
        // 令牌过期等，不用弹框提示

      } else if (alert.showError) {
        let message = alert.reasonMap && alert.reasonMap[apiResp.data.reason]
                    ? alert.reasonMap[apiResp.data.reason]
                    : apiResp.data.message;
        if (apiResp.data.detail && apiResp.data.detail.message) {
          message += `<br><small>${apiResp.data.detail.message}<small>`;
        }

        await MessageBox.alert(`${app.$t('Operation failed')}<br>${message}`, alert.title, {
          dangerouslyUseHTMLString: true,
          confirmButtonText: app.$t('OK'),
          type: 'error',
        });
      }
    }
  }

  if (apiResp.status < 400) {
    if (options.packResp) {
      // 返回二进制数据则重新组装返回JSON
      return {
        ok     : true,
        error  : apiResp.status,
        message: '',
        data   : apiResp.data,
        extra: {
          contentType: apiResp.headers['content-type'],
        }
      };

    } else {
      return apiResp.data;
    }

  } else {
    if (options.throwError) {
      throw apiResp;
    }

    return apiResp.data;
  }
};

export async function callAPI_getOne(pathPattern, id, options) {
  options = options || {};

  let opt = {
    query: {
      id: id,
    }
  };
  let apiRes = await callAPI('get', pathPattern, opt, options);

  if (Array.isArray(apiRes.data)) {
    apiRes.data = apiRes.data[0];
  }

  if (options.alert) {
    let alert = options.alert;
    let title = alert.title || app.$t('Read data'); // 默认当作读取数据

    if (!apiRes.data && alert.alertNoData) {
      setTimeout(() => {
        MessageBox.alert(app.$t('Data not found. It may have been deleted'), alert.title, {
          confirmButtonText: app.$t('OK'),
          type: 'error',
        });
      }, 300);
    }
  }

  return apiRes;
};

export async function callAPI_allPage(pathPattern, options) {
  options = options || {};

  let axiosOpt = _getCallAPIOpt('get', pathPattern, options);
  let apiResp = null;

  let pagingOpt = {
    pageSize: 100,
  };

  while (true) {
    // 注入分页选项
    axiosOpt        = axiosOpt        || {};
    axiosOpt.params = axiosOpt.params || {};
    Object.assign(axiosOpt.params, pagingOpt)

    let _apiResp = await _callAPI(axiosOpt);

    // 失败：抛出/返回当前Response
    if (!_apiResp.data.ok) {
      if (options.alert) {
        let alert  = options.alert;
        let title = alert.title || app.$t('Read data'); // 默认当作读取数据

        if (_apiResp.status === 401 && _apiResp.data.reason === 'EUserAuth') {
          // 令牌过期等，不用弹框提示

        } else if (alert.showError) {
          setTimeout(() => {
            let message = alert.reasonMap && alert.reasonMap[apiResp.data.reason]
                        ? alert.reasonMap[apiResp.data.reason]
                        : apiResp.data.message;
            if (apiResp.data.detail && apiResp.data.detail.message) {
              message += `<br><small>${apiResp.data.detail.message}<small>`;
            }
            MessageBox.alert(`${app.$t('Operation failed')}<br>${message}`, alert.title, {
              dangerouslyUseHTMLString: true,
              confirmButtonText: app.$t('OK'),
              type: 'error',
            });
          }, 300);
        }
      }

      if (options.throwError) {
        throw _apiResp;
      }

      return _apiResp.data;
    }

    if (!apiResp) {
      // 第一页
      apiResp = _apiResp;

    } else {
      // 后续页面
      apiResp.data.data = apiResp.data.data.concat(_apiResp.data.data);
    }

    // 没有更多数据/不支持翻页/非列表/未知分页类型：结束循环
    if (!_apiResp.data.pageInfo
        || !Array.isArray(_apiResp.data.data)
        || _apiResp.data.pageInfo.count < _apiResp.data.pageInfo.pageSize
        || ['simple', 'normal', 'marker'].indexOf(_apiResp.data.pageInfo.pagingStyle) < 0) {
      break;
    }

    // 下一页数据
    switch (_apiResp.data.pageInfo.pagingStyle) {
      case 'simple':
      case 'normal':
        pagingOpt.pageNumber = (_apiResp.data.pageInfo.pageNumber || 1) + 1;
        break;

      case 'marker':
        pagingOpt.pageNumber = (_apiResp.data.pageInfo.pageNumber || 1) + 1;
        break;

      default:
        // Should never be here
        return apiResp.data;
    }
  }

  delete apiResp.data.pageInfo;

  _logCallingAPI(axiosOpt, apiResp);
  return apiResp.data;
};

export function isPageFiltered(options) {
  options = options || {};

  let filter = router.currentRoute.query.filter;

  let listQuery = {};
  if (!isNothing(filter)) {
    try {
      listQuery = JSON.parse(fromBase64(filter));
    } catch(err) {
      console.error(err);
    }
  }

  options.ignore = options.ignore || {};
  options.ignore.pageNumber = 1;
  for (let k in options.ignore) {
    if (listQuery[k] === options.ignore[k]) {
      delete listQuery[k];
    }
  }

  return !isNothing(listQuery);
};

export function createListQuery(nextListQuery) {
  let prevFilter = router.currentRoute.query.filter;

  let listQuery = {};
  if (!isNothing(prevFilter)) {
    try {
      listQuery = JSON.parse(fromBase64(prevFilter));
    } catch(err) {
      console.error(err);
    }
  }

  Object.assign(listQuery, nextListQuery || {});

  listQuery = noNullOrWhiteSpace(listQuery);
  return listQuery;
};

export function createPageFilter(listQuery) {
  let pageFilter = getBase64(JSON.stringify(listQuery));
  pageFilter = pageFilter.replace(/=/g, ''); // URL去除等号`=`
  return pageFilter;
};

export function doPageFilter(nextListQuery, pushNow=true) {
  if (isNothing(nextListQuery)) return;

  let listQuery = createListQuery(nextListQuery);
  let filter = createPageFilter(listQuery);

  let currentRoute = router.currentRoute;
  let nextRoute = {
    name  : jsonCopy(currentRoute.name),
    params: jsonCopy(currentRoute.params),
    query : jsonCopy(currentRoute.query),
  };
  nextRoute.query.filter = filter;

  if (pushNow) {
    router.push(nextRoute);
  }
  return nextRoute;
};

export function changePageSize(pageSize) {
  doPageFilter({
    pageNumber: null,
    pageSize  : pageSize,
  });
};

export function changePageFilter(listQuery, nextListQuery) {
  listQuery = listQuery || {};
  if (nextListQuery) {
    Object.assign(listQuery, nextListQuery);
  }
  listQuery['pageNumber'] = null;
  doPageFilter(listQuery);
};

export function goToPageNumber(pageNumber) {
  doPageFilter({
    pageNumber: pageNumber,
  });
};

export function gotoPageMarker(pageMarker) {
  doPageFilter({
    pageNumber: pageNumber,
  });
};

export function packRouteQuery() {
  let packedRouteQuery = getBase64(JSON.stringify(router.currentRoute.query));
  return { prevRouteQuery: packedRouteQuery };
};

export function unpackRouteQuery(collectedRouteQuery) {
  if (isNothing(collectedRouteQuery)) return null;
  return JSON.parse(fromBase64(collectedRouteQuery));
};

export function initCodeMirror(id) {
  let cm = CodeMirror.fromTextArea(document.getElementById(id), {
    autoRefresh : true,
    autofocus   : true,
    indentUnit  : 4,
    tabSize     : 4,
    lineNumbers : true,
    keyMap      : 'sublime',
    lineWrapping: true,

    // 代码折叠
    foldGutter: true,
    gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],

    // 当前行高亮
    styleActiveLine: true,

    // 自动提示
    hintOptions: {
      hint          : CodeMirror.hint['dff-anyword'],
      completeSingle: false,
      closeOnUnfocus: true,
    },

    // 自动括号提示/自动补全
    matchBrackets    : true,
    autoCloseBrackets: true,

    // 行尾空格
    showTrailingSpace: true,

    // 连续注释
    continueComments: true,

    // 快捷键
    extraKeys: {
      // Tab转空格处理
      Tab: (cm) => {
        if (cm.somethingSelected()) {
          cm.indentSelection('add');
        } else {
          cm.replaceSelection(' '.repeat(cm.getOption('indentUnit')), 'end', '+input');
        }
      },
      'Cmd-F' : 'findPersistent',
      'Ctrl-F': 'findPersistent',
    },

    // 翻译
    phrases: {
      "(Use /re/ syntax for regexp search)": '（也可以使用 /正则表达式/ 搜索，如 /\\d+/）',
      "All": '全部',
      "No": '否',
      "Replace all:": '全部替换',
      "Replace with:": '替换为',
      "Replace:": '替换',
      "Replace?": '是否替换',
      "Search:": '搜索',
      "Stop": '停止',
      "With:": '替换为',
      "Yes": '是',
    }
  });

  // 随键入代码提示
  cm.on('change', debounce((editor, change) => {
    // 触发代码提示
    if (change.origin == "+input" && change.text.join().match(/[a-zA-Z]/)) {
      editor.showHint();
    }
  }, 150));

  // cm.on('cursorActivity', (editor) => {
  //   console.log('cursor moved')
  // });

  setCodeMirrorForPython(cm);

  return cm;
};

export function setCodeMirrorReadOnly(codeMirror, readOnly) {
  if (!codeMirror) return;

  if (readOnly) {
    // codeMirror.setOption('readOnly', 'nocursor');
    codeMirror.setOption('readOnly', true);
    codeMirror.setOption('styleActiveLine', false);
  } else {
    codeMirror.setOption('readOnly', false);
    codeMirror.setOption('styleActiveLine', true);
  }

  return codeMirror;
};

export function setCodeMirrorForPython(codeMirror) {
  codeMirror.setOption('mode', {
    name          : 'python',
    version       : 3,
    extra_keywords: ['DFF'],
  });
  return codeMirror;
};

export function setCodeMirrorForDiff(codeMirror) {
  codeMirror.setOption('mode', 'diff');
  return codeMirror;
};

export function setCodeMirrorForText(codeMirror) {
  codeMirror.setOption('mode', null);
  return codeMirror;
};

export function getCodeMirrorThemeName() {
  return store.getters.codeMirrorSetting.theme || C.CODE_MIRROR_DEFAULT_THEME;
};

export function getEchartTextStyle() {
  let colorMap = {
    light: 'black',
    dark : '#ccc',
  };
  let color = colorMap[store.getters.uiColorSchema];
  return { color: color };
};

export function getEchartSplitLineStyle() {
  let colorMap = {
    light: '#ccc',
    dark : '#3c3c3c',
  };
  let color = colorMap[store.getters.uiColorSchema];
  return { color: color };
};
