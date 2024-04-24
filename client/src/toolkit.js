import axios from 'axios'
import router from '@/router'
import store from '@/store'
import { MessageBox, Notification } from 'element-ui';

// CodeMirror
import CodeMirror from 'codemirror/lib/codemirror'
import 'codemirror/lib/codemirror.css'
import 'codemirror/keymap/sublime'
// CodeMirror高亮
import 'codemirror/mode/python/python'
import 'codemirror/mode/javascript/javascript'
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

// ID
import { customAlphabet } from 'nanoid'
const nanoid = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ', 12)
const nanoid_BlueprintNode = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 6)

// Base64
import { Base64 } from 'js-base64'

// 时间处理
import moment from 'moment'

// DIFF
import { diffTrimmedLines } from 'diff'

// Useragent
import Bowser from "bowser"

// 字节大小
import byteSize from 'byte-size'

// DataFlux Func hint
import '@/assets/css/dff-hint.css'
import '@/assets/js/dff-anyword.js'

export const MIN_UNIX_TIMESTAMP    = moment('1970-01-01T00:00:00Z').unix();
export const MIN_UNIX_TIMESTAMP_MS = MIN_UNIX_TIMESTAMP * 1000;
export const MAX_UNIX_TIMESTAMP    = moment('2099-12-31T23:59:59Z').unix();
export const MAX_UNIX_TIMESTAMP_MS = MAX_UNIX_TIMESTAMP * 1000;

// Markdown
import { marked } from 'marked'

import i18n from '@/i18n'
import C from '@/const'

// 网络错误提示
let IS_UNDER_NETWORK_ERROR_NOTICE = false;

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

export function getUILocale() {
  var vuexData = localStorage.getItem('vuex');
  if (!vuexData) {
    vuexData = {};
  } else if ('string' === typeof vuexData) {
    vuexData = JSON.parse(vuexData);
  }

  let uiLocale = vuexData.uiLocale || window.navigator.language;
  let uiLocaleParts = uiLocale.split('.')[0].split(/[_-]/);

  // 英文不区分国家
  if (uiLocaleParts[0] == 'en') uiLocale = 'en';

  return uiLocale;
};

export function getBaseURL() {
  let baseURL = store.getters.SYSTEM_INFO('WEB_BASE_URL') || location.origin;
  return baseURL;
};

export function isLocalhost() {
  return location.hostname === 'localhost' || location.hostname === 'localdev';
}
export function isFuncDev() {
  return location.hostname === 'func-dev.dataflux.cn' || isLocalhost();
};

export function isFuncDemo() {
  return location.hostname === 'func-demo.dataflux.cn' || isLocalhost();
};

export function autoScrollTable() {
  let key = router.currentRoute.name;
  let y = (store.state.TableList_scrollY || {})[key];

  if (y && store.state.highlightedTableDataId && document.getElementsByClassName('hl-row')[0]) {
    // 滚动到指定高度
    let el = document.getElementsByClassName('el-table__body-wrapper')[0];
    if (el) {
      el.scrollTo(null, y);
      return;
    }
  }
};

export function getTableScrollY() {
  let el = document.getElementsByClassName('el-table__body-wrapper')[0];
  if (!el) return null;

  return el.scrollTop;
};

export function getBrowser() {
  return Bowser.getParser(window.navigator.userAgent).getBrowserName();
};
export function getEngine() {
  return Bowser.getParser(window.navigator.userAgent).getEngineName();
};

export function isMac() {
  return (navigator.platform == 'Mac68K')
      || (navigator.platform == 'MacPPC')
      || (navigator.platform == 'Macintosh')
      || (navigator.platform == 'MacIntel');
};

export function getSuperKeyName() {
  return isMac() ? 'command' : 'Ctrl';
};
export function getAltKeyName() {
  return isMac() ? 'option' : 'Alt';
};
export function getShiftKeyName() {
  return isMac() ? 'shift' : 'Shift';
};

export function debounce(fn, delay) {
  delay = delay || 300;
  let T;

  return function() {
    let self = this;
    let args = arguments;

    if (T) clearTimeout(T);
    T = setTimeout(function() {
      T = null;
      fn.apply(self, args);
    }, delay);
  };
};

export function throttle(fn, interval) {
  interval = interval || 1000;
  let last = 0;

  return function () {
    let self = this;
    let args = arguments;
    let now = Date.now();
    // 根据当前时间和上次执行时间的差值判断是否频繁
    if (now - last >= interval) {
      last = now;
      fn.apply(self, args);
    }
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
  } catch (err) {
    pattern = '';
  }

  return pattern.replace(/\{(\d+)\}/g, function replaceFunc(m, i) {
    return args[i] + '';
  });
};

export function genDataId(prefix) {
  prefix = prefix || 'data';
  return prefix + '-' + nanoid();
};

export function genBlueprintNodeId(prefix) {
  prefix = prefix || 'node';
  return prefix + '-' + nanoid_BlueprintNode();
}

export function byteSizeHuman(s) {
  return byteSize(s, { units: 'iec' });
};

export function getBase64(str, uriSafe) {
  if (uriSafe) {
    return Base64.encodeURI(str);
  } else {
    return Base64.encode(str);
  }
};

export function fromBase64(base64str) {
  return Base64.decode(base64str);
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

  if ('number' === typeof o) {
    return false;
  } else if ('boolean' === typeof o) {
    return false;
  } else if ('string' === typeof o) {
    return o.trim().length === 0;
  } else if (Array.isArray(o)) {
    return o.length === 0;
  } else if ('object' === typeof o){
    try {
      return JSON.stringify(o) === '{}';
    } catch(err) {
      return false;
    }
  }

  return false;
};

export function notNothing(o) {
  return !isNothing(o);
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

export function noDuplication(arr) {
  var tmp = {};
  for (var i = 0; i < arr.length; i++) {
    tmp[arr[i]] = null;
  }

  var newArr = [];
  for (var k in tmp) if (tmp.hasOwnProperty(k)) {
    newArr.push(k);
  }

  return newArr;
};

export function limitText(text, maxLength, options) {
  text      = text      || '';
  maxLength = maxLength || 30;
  options   = options   || {};

  if (text.length <= maxLength) {
    return text;
  } else {
    var limited = text.slice(0, maxLength - 3) + '...';

    if (options.showLength) {
      if (options.showLength === 'newLine') {
        limited += `\n <Length: ${text.length}>`;
      } else {
        limited += ` <Length: ${text.length}>`;
      }
    }
    return limited;
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

export function numberLimit(n, limit) {
  n     = n || 0;
  limit = limit || 99;

  if (n > limit) {
    return `${limit}+`;
  } else {
    return n;
  }
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
export function jsonFindSafe(j, path) {
  return jsonFind(j, path, true);
}

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

export function splitCamel(s) {
  var converted = '';

  for (var i = 0; i < s.length; i++) {
    var ch = s[i];
    if (s.charCodeAt(i) < 90 && s.charCodeAt(i - 1) > 96) {
      converted = converted.trim() + ' ';
    }
    if (s.charCodeAt(i) < 90 && s.charCodeAt(i + 1) > 96) {
      converted = converted.trim() + ' ';
      ch = ch.toLowerCase();
    }

    converted += ch;
  };

  return converted;
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
      let v = options.params[k].replace('', '');
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
    let authQuery = store.getters.SYSTEM_INFO('_WEB_AUTH_QUERY');
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

export function parseVersion(ver) {
  let m = ('' + ver).trim().match(/^\d+(\.\d+)+$/g);
  if (!m) {
    return false;
  } else {
    return m[0].split('.').map(x => parseInt(x));
  }
};

export function compareVersion(a, b) {
  let aParts = parseVersion(a);
  let bParts = parseVersion(b);

  if (!aParts && bParts) return -1;
  else if (aParts && !bParts) return 1;
  else if (!aParts && !bParts) return 0;

  for (let i = 0; i < Math.min(aParts.length, bParts.length); i++) {
    if (aParts[i] < bParts[i]) return -1;
    else if (aParts[i] > bParts[i]) return 1;
  }

  if (aParts.length < bParts.length) return -1;
  else if (aParts.length > bParts.length) return -1;
  else return 0;
};

export function isExpired(dt) {
  return getMoment(dt).unix() < getMoment().unix();
};

export function getMoment(d) {
  if ('number' === typeof d || ('string' === typeof d && d.match(/^\d+$/))) {
    d = parseInt(d);
    if (d < MIN_UNIX_TIMESTAMP_MS) {
      d *= 1000;
    }
  }

  return moment(d || undefined);
};

export function getTimestamp(ndigits) {
  ndigits = ndigits || 0;
  if (ndigits === 0) {
    return Math.round(Date.now() / 1000);
  } else if (ndigits === 3) {
    return Date.now() / 1000;
  } else {
    return parseFloat((Date.now() / 1000).toFixed(ndigits));
  }
};
export function getTimestampMs() {
  return Date.now();
};

export function getDateTimeString(d, f) {
  let uiLocale = getUILocale();
  let utcOffset = (0 - new Date().getTimezoneOffset() / 60);
  return getMoment(d).locale(uiLocale).utcOffset(utcOffset).format(f || 'YYYY-MM-DD HH:mm:ss');
};

export function fromNow(d) {
  let uiLocale = getUILocale();
  return getMoment(d).locale(uiLocale).fromNow();
};

export function duration(d, humanized) {
  let uiLocale = getUILocale();
  let duration = moment.duration(d).locale(uiLocale);
  if (humanized) {
    return duration.humanize();
  } else {
    var parts = [];
    [ 'y', 'd', 'h', 'm', 's' ].forEach(t => {
      let v = duration.get(t);
      if (v) parts.push(i18n.tc(`n${t.toUpperCase()}`, v));
    });
    return parts.join(' ');
  }
};

export function getTimeDiff(from, to, humanized) {
  let diff = getMoment(to).diff(getMoment(from));
  return duration(diff, humanized);
};

export function filterBySimilar(s, l, key, minScore) {
  minScore = minScore || 0.5;

  let listScore = l.reduce((acc, x) => {
    if (key) {
      acc.push([ stringSimilar(s, x[key]), x])
    } else {
      acc.push([ stringSimilar(s, x), x])
    }
    return acc;
  }, []);

  listScore.filter(x => {
    return x[0] >= minScore;
  });

  listScore.sort((a, b) => {
    if (a[0] > b[0]) {
      return -1;
    } else if (a[0] < b[0]) {
      return 1;
    } else {
      return 0;
    }
  });

  let result = listScore.map(x => x[1]);
  return result;
};

export function sortBySimilar(s, l, key) {
  let scoreMap = {}
  l.sort((a, b) => {
    if (key) {
      a = a[key];
      b = b[key];
    }

    let scoreA = scoreMap[a];
    let scoreB = scoreMap[b];

    if (isNothing(scoreA)) {
      scoreA = scoreMap[a] = stringSimilar(s, a);
    }
    if (isNothing(scoreB)) {
      scoreB = scoreMap[b] = stringSimilar(s, b);
    }

    if (scoreA > scoreB) {
      return -1;
    } else if (scoreA < scoreB) {
      return 1;
    } else {
      return 0;
    }
  });
  return l;
};

export function stringSimilar(s, t, f) {
  s = s.toLowerCase();
  t = t.toLowerCase();

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
  // 根据置顶排序
  let isPinnedA = !!a.pinTime;
  let isPinnedB = !!b.pinTime;

  if (isPinnedA < isPinnedB) return 1;
  if (isPinnedA > isPinnedB) return -1;

  if (isPinnedA && isPinnedB) {
    if (a.pinTime > b.pinTime) return -1;
    if (a.pinTime < b.pinTime) return 1;
  }

  if (a.label < b.label) return -1;
  if (a.label > b.label) return 1;

  return 0;
}

export function scriptSetSorter(a, b) {
  // 根据置顶排序
  let isPinnedA = !!a.pinTime;
  let isPinnedB = !!b.pinTime;

  if (isPinnedA < isPinnedB) return 1;
  if (isPinnedA > isPinnedB) return -1;

  if (isPinnedA && isPinnedB) {
    if (a.pinTime > b.pinTime) return -1;
    if (a.pinTime < b.pinTime) return 1;
  }

  // 根据来源排序
  let aOrigin = a.origin;
  let bOrigin = b.origin;
  let orders = [ 'user', 'scriptMarket', 'builtin' ];
  if (orders.indexOf(aOrigin) < orders.indexOf(bOrigin)) return -1;
  if (orders.indexOf(aOrigin) > orders.indexOf(bOrigin)) return 1;

  // 根据名称 / ID 排序
  let aLabel = a.label || a.title || a.id;
  let bLabel = b.label || b.title || b.id;
  if (aLabel < bLabel) return -1;
  if (aLabel > bLabel) return 1;

  return 0;
};

export function alert(message, type) {
  type = type || 'error';

  let confirmButtonText = null;
  switch(type) {
    case 'success':
      confirmButtonText = i18n.t('Very good');
      break;

    default:
      confirmButtonText = i18n.t('OK');
      break;
  }

  if (!message) return;

  // 简单提示，不需要区分标题和内容
  return MessageBox.alert(message, {
    showClose               : false,
    dangerouslyUseHTMLString: true,
    confirmButtonText       : confirmButtonText,
    type                    : type,
  });
};

export async function confirm(message) {
  try {
    // 简单提示，不需要区分标题和内容
    await MessageBox.confirm(message, {
      dangerouslyUseHTMLString: true,
      confirmButtonText       : i18n.t('Yes'),
      cancelButtonText        : i18n.t('No'),
      type                    : 'warning',
    });

    // 确认操作
    return true;

  } catch(err) {
    // 取消操作
    return false;
  }
};

export async function prompt(message, defaultValue, options) {
  options = options || {};

  try {
    Object.assign(options, {
      inputValue              : defaultValue,
      dangerouslyUseHTMLString: true,
      closeOnClickModal       : false,
      confirmButtonText       : i18n.t('Confirm'),
      cancelButtonText        : i18n.t('Cancel'),
    })
    let promptRes = await MessageBox.prompt(message, options);

    return promptRes ? promptRes.value || null : null;

  } catch(err) {
    // 取消操作
    return null;
  }
};

export function notify(message, type) {
  type = type || 'success';

  let duration = null;
  switch(type) {
    case 'success':
    case 'info':
      duration = 3 * 1000;
      break

    default:
      duration = 10 * 1000;
      break;
  }

  // 简单提示，不需要区分标题和内容
  return Notification({
    title                   : null,
    message                 : message,
    dangerouslyUseHTMLString: true,
    type                    : type,
    position                : 'top-right',
    duration                : duration,
    offset                  : 85,
  });
};

function _createAxiosOpt(method, pathPattern, options) {
  options = options || {};

  let url = formatURL(pathPattern, {
    params: options.params,
  });

  let axiosOpt = {
    method      : method,
    url         : url,
    timeout     : options.timeout || 3 * 60 * 1000,
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

  if (options.onUploadProgress) {
    axiosOpt.onUploadProgress = options.onUploadProgress;
  }

  axiosOpt.headers = axiosOpt.headers || {};

  // 添加客户端时间
  if (store.getters.SYSTEM_INFO('_WEB_CLIENT_TIME_HEADER')) {
    axiosOpt.headers[store.getters.SYSTEM_INFO('_WEB_CLIENT_TIME_HEADER')] = new Date().toISOString();
  }

  // 注入认证信息
  if (store.state.xAuthToken) {
    axiosOpt.headers[store.getters.SYSTEM_INFO('_WEB_CLIENT_ID_HEADER')] = store.getters.clientId;

    let authHeaderField = store.getters.SYSTEM_INFO('_WEB_AUTH_HEADER');
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

async function _prepareAxiosRes(axiosRes) {
  let respContentType = axiosRes.headers['content-type'];

  if ('string' === typeof respContentType && respContentType.indexOf('application/json') >= 0) {
    let apiRespData = axiosRes.data;

    switch (Object.prototype.toString.call(apiRespData)) {
      case '[object Blob]':
        apiRespData = await apiRespData.text();
        apiRespData = JSON.parse(apiRespData);
        break;

      case '[object String]':
        apiRespData = JSON.parse(apiRespData);
        break;
    }

    axiosRes.data = apiRespData;
  }

  return axiosRes;
};

async function _doAxios(axiosOpt) {
  let isNoCount = false;
  if (axiosOpt.extraOptions && axiosOpt.extraOptions.noCountProcessing) {
    isNoCount = true;
  }

  if (!isNoCount){
    store.commit('startProcessing');
  }

  try {
    // if (axiosOpt.method.toLowerCase() === 'post' && isNothing(axiosOpt.body)) {
    //   axiosOpt.body = {};
    // }

    let axiosRes = await axios(axiosOpt);

    // 升级监测
    let serverInfo = {
      VERSION          : axiosRes.headers[store.getters.SYSTEM_INFO('_WEB_SERVER_VERSION_HEADER')],
      RELEASE_TIMESTAMP: parseInt(axiosRes.headers[store.getters.SYSTEM_INFO('_WEB_SERVER_RELEASE_TIMESTAMP_HEADER')]),
    }
    store.dispatch('checkServerUpgradeInfo', serverInfo);

    axiosRes = await _prepareAxiosRes(axiosRes);
    return axiosRes;

  } catch (err) {
    if (err.response) {
      // 服务端存在错误响应
      if (err.response.status === 401) {
        // 认证失败时，自动清除Token
        store.commit('updateXAuthToken', null);
      }

      let errResp = await _prepareAxiosRes(err.response)
      return errResp;

    } else {
      if (!IS_UNDER_NETWORK_ERROR_NOTICE) {
        // 防止多请求反复提示
        IS_UNDER_NETWORK_ERROR_NOTICE = true;

        // 通讯失败，服务端没有响应
        await MessageBox.alert(`${i18n.t('Failed to communicate with the server, please refresh the page and try again.')}
            <br>${i18n.t('If the problem continues to occur, please contact the administrator to check the status of the server.')}
            <br><small>${err.toString()}</small>`, {
          showClose               : false,
          dangerouslyUseHTMLString: true,
          confirmButtonText       : i18n.t('OK'),
          type                    : 'error',
        });

        IS_UNDER_NETWORK_ERROR_NOTICE = false;
      }

      throw err;
    }

  } finally {
    if (!isNoCount){
      store.commit('endProcessing');
    }
  }
};

export async function callAPI(method, pathPattern, options) {
  /* 请求 */
  if (method[0] === '/') {
    options     = pathPattern;
    pathPattern = method;
    method      = 'get';
  }

  options = options || {};

  const axiosOpt = _createAxiosOpt(method, pathPattern, options);
  let axiosRes = await _doAxios(axiosOpt);

  /* 提示 */
  let alert = options.alert || {};
  if (axiosRes.status < 400) {
    // 成功提示
    if (alert.okMessage) {
      setImmediate(() => {
        Notification({
          title                   : null, // 简单提示，不需要区分标题和内容
          message                 : alert.okMessage,
          dangerouslyUseHTMLString: true,
          type                    : 'success',
          position                : 'top-right',
          duration                : 3000,
          offset                  : 85,
        });
      });
    }

  } else {
    // 失败提示
    if (axiosRes.status === 401) {
      // 【特殊处理】令牌过期等，不用弹框提示

    } else {
      // 其他错误正常提示

      if (!alert.muteError) {
        // 自动根据错误信息生成消息
        let message = alert.reasonMap && alert.reasonMap[axiosRes.data.reason]
                    ? alert.reasonMap[axiosRes.data.reason]
                    : i18n.t(axiosRes.data.message);

        // 进一步添加小字详细信息
        [ 'message', 'exception' ].forEach(detailField => {
          if (axiosRes.data.detail && axiosRes.data.detail[detailField]) {
            message += `<br><small class="text-smaller">${i18n.t(axiosRes.data.detail[detailField].replace(/\n/g, '<br>'))}<small>`;
          }
        });

        // 简单提示，不需要区分标题和内容
        if (!message) {
          message = `${i18n.t('Failed to access data, please refresh the page and try again.')}<br><small>${method.toUpperCase()} ${pathPattern}</small>`
        }
        MessageBox.alert(message, {
          showClose               : false,
          dangerouslyUseHTMLString: true,
          confirmButtonText       : i18n.t('OK'),
          type                    : 'error',
        });
      }
    }
  }

  let apiRes = axiosRes.data;

  // 【特殊处理】返回二进制数据则重新组装返回JSON
  if (options.packResp && axiosRes.status < 400) {
    apiRes = {
      ok     : true,
      error  : axiosRes.status,
      message: '',
      data   : axiosRes.data,
      extra: {
        contentType: axiosRes.headers['content-type'],
      }
    };
  }

  return apiRes;
};

export async function callAPI_get(pathPattern, options) {
  if (endsWith(pathPattern, '/do/delete')) {
    throw Error(`toolkit.callAPI_get(...) can not be used for ~/do/delete APIs, got pathPattern: ${pathPattern}`)
  }

  return await callAPI('get', pathPattern, options);
};

export async function callAPI_getOne(pathPattern, id, options) {
  if (!endsWith(pathPattern, '/do/list')) {
    throw Error(`toolkit.callAPI_getOne(...) can only be used for ~/do/list APIs, got pathPattern: ${pathPattern}`)
  }

  /* 请求 */
  options = options || {};
  options.query = options.query || {}
  options.query.id = id;
  let apiRes = await callAPI('get', pathPattern, options);

  // 取第一条
  if (Array.isArray(apiRes.data)) {
    apiRes.data = apiRes.data[0];
  }

  /* 提示 */
  if (options.alert) {
    let alert = options.alert;

    if (isNothing(apiRes.data)) {
      apiRes.ok = false;

      // 无数据提示
      if (!alert.muteError) {
        setTimeout(() => {
          // 简单提示，不需要区分标题和内容
          MessageBox.alert(i18n.t('Data not found. It may have been deleted'), {
            showClose: false,
            confirmButtonText: i18n.t('OK'),
            type: 'error',
          });
        }, 300);
      }
    }
  }

  return apiRes;
};

export async function callAPI_getAll(pathPattern, options) {
  if (!endsWith(pathPattern, '/do/list')) {
    throw Error(`toolkit.callAPI_getAll(...) can only be used for ~/do/list APIs, got pathPattern: ${pathPattern}`)
  }

  /* 请求 */
  options = options || {};

  let axiosOpt = _createAxiosOpt('get', pathPattern, options);
  let pagingOpt = { pageSize: 100 };

  let apiRes   = null;
  let isFailed = false;
  let axiosRes = null;
  while (true) {
    // 注入分页选项
    axiosOpt        = axiosOpt        || {};
    axiosOpt.params = axiosOpt.params || {};
    Object.assign(axiosOpt.params, pagingOpt)

    axiosRes = await _doAxios(axiosOpt);

    if (axiosRes.data.ok) {
      // 成功继续翻页
      if (!apiRes) {
        // 第一页
        apiRes = axiosRes.data;

      } else {
        // 后续页
        apiRes.data = apiRes.data.concat(axiosRes.data.data);
      }

    } else {
      // 失败中断
      apiRes = axiosRes.data;
      isFailed = true;

      break;
    }

    // 没有更多数据/不支持翻页/非列表/未知分页类型：结束循环
    if (!axiosRes.data.pageInfo
        || !Array.isArray(axiosRes.data.data)
        || axiosRes.data.pageInfo.count < axiosRes.data.pageInfo.pageSize
        || ['simple', 'normal', 'marker'].indexOf(axiosRes.data.pageInfo.pagingStyle) < 0) {
      break;
    }

    // 下一页数据
    switch (axiosRes.data.pageInfo.pagingStyle) {
      case 'simple':
      case 'normal':
        pagingOpt.pageNumber = (axiosRes.data.pageInfo.pageNumber || 1) + 1;
        break;

      case 'marker':
        pagingOpt.pageNumber = (axiosRes.data.pageInfo.pageNumber || 1) + 1;
        break;

      default:
        // Should never be here
        return apiResp.data;
    }
  }

  /* 提示 */
  let alert = options.alert || {};
  if (isFailed) {
    // 请求失败
    if (axiosRes.status === 401) {
      // 【特殊处理】令牌过期等，不用弹框提示

    } else {
      // 其他错误正常提示

      if (!alert.muteError) {
        setTimeout(() => {
          // 自动根据错误信息生成消息
          let message = alert.reasonMap && alert.reasonMap[axiosRes.data.reason]
                      ? alert.reasonMap[axiosRes.data.reason]
                      : i18n.t(axiosRes.data.message);

          // 进一步添加小字详细信息
          [ 'message', 'exception' ].forEach(detailField => {
            if (axiosRes.data.detail && axiosRes.data.detail[detailField]) {
              message += `<br><small class="text-smaller">${i18n.t(axiosRes.data.detail[detailField].replace(/\n/g, '<br>'))}<small>`;
            }
          });

          // 简单提示，不需要区分标题和内容
          if (!message) {
            message = `${i18n.t('Failed to access data, please refresh the page and try again.')}<br><small>GET ${pathPattern}</small>`
          }
          MessageBox.alert(message, {
            showClose               : false,
            dangerouslyUseHTMLString: true,
            confirmButtonText       : i18n.t('OK'),
            type                    : 'error',
          });
        }, 300);
      }
    }
  }

  // 获取全部数据时移除分页信息
  try { delete apiRes.pageInfo } catch(_) {};

  return apiRes;
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
  let filter = router.currentRoute.query.filter;

  let listQuery = {};
  if (notNothing(filter)) {
    try {
      listQuery = JSON.parse(fromBase64(filter));
    } catch(err) {
      console.error(err);
    }
  }

  Object.assign(listQuery, nextListQuery || {});

  listQuery = noNullOrWhiteSpace(listQuery);
  return listQuery;
};

export function createPageInfo() {
  return {
    totalCount: 0,
    pageCount : 0,
    pageSize  : 20,
    pageNumber: 1,
  };
};

export function createPageFilter(listQuery) {
  return getBase64(JSON.stringify(listQuery), true);
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
  nextRoute.query.ts = Date.now();

  if (pushNow) {
    setImmediate(() => {
      router.push(nextRoute);
    })
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
    for (var k in nextListQuery) {
      listQuery[k] = nextListQuery[k];
    }
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
  let packedRouteQuery = getBase64(JSON.stringify(router.currentRoute.query), true);
  return { prevRouteQuery: packedRouteQuery };
};

export function unpackRouteQuery(collectedRouteQuery) {
  if (isNothing(collectedRouteQuery)) return null;
  return JSON.parse(fromBase64(collectedRouteQuery));
};

export function getPrevQuery() {
  return unpackRouteQuery(router.currentRoute.query.prevRouteQuery);
};

export function initCodeMirror(id, options) {
  options = options || {};

  let config = {
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
  }

  if (options.config) {
    Object.assign(config, options.config);
  }

  let cm = CodeMirror.fromTextArea(document.getElementById(id), config);

  // 随键入代码提示
  cm.on('change', debounce((editor, change) => {
    // 触发代码提示
    if (change.origin == "+input" && change.text.join().match(/[a-zA-Z]/)) {
      editor.showHint();
    }
  }, 150));

  resetCodeMirrorPhrases(cm);
  setCodeMirrorMode(cm, options.mode || 'python');
  return cm;
};

export function destoryCodeMirror(codeMirror) {
  if (!codeMirror) return;

  const codeMirrorElem = codeMirror.doc.cm.getWrapperElement();
  codeMirrorElem && codeMirrorElem.remove && codeMirrorElem.remove();
};

export function resetCodeMirrorPhrases(codeMirror) {
  if (!codeMirror) return;

  setImmediate(() => {
    var phrases = {
      "(Use /re/ syntax for regexp search)": i18n.t("(Use /re/ syntax for regexp search)"),
      "All"                                : i18n.t("All"),
      "No"                                 : i18n.t("No"),
      "Replace all:"                       : i18n.t("Replace all:"),
      "Replace with:"                      : i18n.t("Replace with:"),
      "Replace:"                           : i18n.t("Replace:"),
      "Replace?"                           : i18n.t("Replace?"),
      "Search:"                            : i18n.t("Search:"),
      "Stop"                               : i18n.t("Stop"),
      "With:"                              : i18n.t("With:"),
      "Yes"                                : i18n.t("Yes"),
    }
    codeMirror.setOption('phrases', phrases);
  });
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

export function setCodeMirrorMode(codeMirror, mode) {
  let opt = mode || null;
  switch(mode) {
    case 'python':
      opt = {
        name          : 'python',
        version       : 3,
        extra_keywords: ['DFF'],
      }
      break;
  }

  codeMirror.setOption('mode', opt);
  return codeMirror;
};

export function getCodeMirrorThemeName() {
  return store.getters.codeMirrorSettings.theme || C.CODE_MIRROR_THEME_DEFAULT.key;
};

export function jumpToCodeMirrorLine(codeMirror, cursor) {
  if (!cursor) return;

  // 编辑器高度
  let margin = parseInt(codeMirror.getWrapperElement().clientHeight / 3);

  // 光标位置
  if ('number' === typeof cursor) {
    cursor = { line: cursor, ch: 0 };
  }

  codeMirror.scrollIntoView(cursor, margin);
};

export function foldCode(codeMirror, level) {
  if (!codeMirror) return;

  // 全部展开
  codeMirror.execCommand('unfoldAll');

  if (level < 0) return;

  // 折叠特定层级
  let foldBlankCount = (level - 1) * 4;
  for (let i = 0; i < codeMirror.lineCount(); i++) {
    let linePreBlank = codeMirror.lineInfo(i).text.trimEnd().match(/^ */)[0] || '';
    let linePreBlankCount = linePreBlank.length;

    if (foldBlankCount === linePreBlankCount) {
      codeMirror.foldCode(i);
    }
  }
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

/*** 简化代码 ***/

export function setupPageMode() {
  return router.currentRoute.name.split('-').pop();
};

export function getHighlightRowCSS({row, rowIndex}) {
  return (store.state.highlightedTableDataId === row.id) ? 'hl-row' : '';
};

export function appendSearchKeywords(data, searchKeywords) {
  searchKeywords = asArray(searchKeywords);

  if (isNothing(data.searchKeywords)) {
    data.searchKeywords = [];
  }

  searchKeywords.forEach(v => {
    if (v) data.searchKeywords.push(('' + v).trim());
  })

  return data;
};

export function appendSearchFields(data, keys) {
  keys = asArray(keys);

  let searchKeywords = [];
  keys.forEach(k => {
    let v = '';
    try {
      v = jsonFindSafe(data, k) || '';
    } catch(err) {
      // Nope
    }

    if (v) {
      searchKeywords.push(('' + v).trim());
    }
  });

  if (isNothing(data.searchKeywords)) {
    data.searchKeywords = [];
  }

  data.searchKeywords = data.searchKeywords.concat(searchKeywords);
  return data;
};

export function filterByKeywords(s, l) {
  let searchTexts = s
  .replace(/[.\-_ \(\)（）]/g, ' ')
  .toLowerCase()
  .split(' ')
  .filter(x => notNothing(x));

  let maxScore                = 0;
  let maxSearchKeywordsLength = 0;

  let listScore = l.reduce((acc, x) => {
    let exactlyMatch = false;
    let subScore     = 0;
    let simScore     = 0;

    maxSearchKeywordsLength = Math.max(maxSearchKeywordsLength, x.searchKeywords.length);

    x.searchKeywords.forEach(keyword => {
      keyword = keyword.toLowerCase().trim();

      if (keyword === s) {
        exactlyMatch = true;
      }

      searchTexts.forEach(searchText => {
        // 字符串查询
        if (keyword.indexOf(searchText) >= 0) {
          // 子字符串
          subScore += searchText.length * 2;
        }

        // 相似度匹配
        simScore += parseInt(stringSimilar(searchText, keyword) * 10);
      });
    });

    let item = {
      exactlyMatch: exactlyMatch,
      score       : (subScore + simScore) * maxSearchKeywordsLength / x.searchKeywords.length,
      subScore    : subScore,
      simScore    : simScore,
      item        : x,
    };

    maxScore = Math.max(maxScore, item.score);
    acc.push(item);
    return acc;
  }, []);

  listScore.sort((a, b) => {
    if (a.exactlyMatch && !b.exactlyMatch) return -1;
    else if (!a.exactlyMatch && b.exactlyMatch) return 1;
    else {
      if (a.score > b.score) return -1;
      else if (a.score < b.score) return 1;
      else return 0;
    }
  });

  if (window._DFF_DEBUG) {
    console.log('-----------------')
    console.log(searchTexts.toString())
    listScore.slice(0, 10).forEach(x => {
      console.log(`Score: ${x.score} / Sub: ${x.subScore} / Sim: ${x.simScore} >>>> ${x.item.searchKeywords.toString()}`)
    })
  }

  listScore = listScore.filter(x => {
    if (x.exactlyMatch) {
      return true;
    } else if (s.length === 1) {
      return x.score > 0;
    } else {
      return x.score > maxScore * 0.5;
    }
  });

  let result = listScore.map(x => x.item);
  return result;
};

export function htmlSpace(count, lang) {
  let s = null;
  switch(lang) {
    case 'zh':
      s = '&#12288;';
      break;

    default:
      s = '&ensp;';
      break;
  }

  if ('number' !== typeof count) {
    count = 1;
  }
  count = parseInt(count);
  return s.repeat(count);
};

export function openURL(url) {
  if ('object' === typeof url) {
    url = router.resolve(url).href;
  }
  window.open(url);
};

export function jumpDeletedEntity(id) {
  if (id !== router.currentRoute.params.id) return;

  switch(router.currentRoute.name) {
    case 'code-editor':
    case 'code-viewer':
      router.push({
        name: 'intro',
      });
      break;
  }
};

export function renderMarkdown(text, options) {
  options = options || {};

  let renderer = options.renderer || false;
  delete options.renderer;

  marked.use({ renderer });

  if (options.inline === true) {
    return marked.parseInline(text, options);
  } else {
    return marked.parse(text, options);
  }
};

export function textLength(str) {
  return str.replace(/[\u0391-\uFFE5]/g, '__').length;
};

let waitLoading = function(minLoadingTime) {
  this.startTime = Date.now();
  this.minLoadingTime = minLoadingTime || 500;
};

waitLoading.prototype.end = function(fn) {
  let endTime = Date.now();
  let processedTime = endTime - this.startTime;
  if (processedTime > this.minLoadingTime) {
    fn();

  } else {
    console.log(this.minLoadingTime - processedTime)
    setTimeout(() => {
      fn();
    }, this.minLoadingTime - processedTime);
  }
};

export function createWaitLoading(minLoadingTime) {
  return new waitLoading(minLoadingTime);
};
