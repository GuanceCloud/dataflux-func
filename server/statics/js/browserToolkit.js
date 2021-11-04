$(function() {
var SERVER_CONFIG_COOKIE_KEY = '_watServerConfig';

window.LOG = false;

window.toolkit = {};

var SHORT_UNIX_TIMESTAMP_OFFSET = toolkit.SHORT_UNIX_TIMESTAMP_OFFSET = 1503982020;

var MIN_UNIX_TIMESTAMP    = toolkit.MIN_UNIX_TIMESTAMP    = 0;
var MIN_UNIX_TIMESTAMP_MS = toolkit.MIN_UNIX_TIMESTAMP_MS = MIN_UNIX_TIMESTAMP * 1000;
var MAX_UNIX_TIMESTAMP    = toolkit.MAX_UNIX_TIMESTAMP    = 2145888000; // 2038-01-01 00:00:00
var MAX_UNIX_TIMESTAMP_MS = toolkit.MAX_UNIX_TIMESTAMP_MS = MAX_UNIX_TIMESTAMP * 1000;

var VOLUMN_UNITS = toolkit.VOLUMN_UNITS = ['Byte', 'KB', 'MB', 'GB', 'TB'];
var VOLUMN_RADIX = toolkit.VOLUMN_RADIX = Math.pow(2, 10);

var TRANSMISSION_RATE_UNITS = toolkit.TRANSMISSION_RATE_UNITS = ['bps', 'Kbps', 'Mbps', 'Gbps'];
var TRANSMISSION_RATE_RADIX = toolkit.TRANSMISSION_RATE_RADIX = Math.pow(2, 10);

var TRANSMISSION_RATE_UNITS_IN_BYTE = toolkit.TRANSMISSION_RATE_UNITS_IN_BYTE = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
var TRANSMISSION_RATE_RADIX_IN_BYTE = toolkit.TRANSMISSION_RATE_RADIX_IN_BYTE = Math.pow(2, 10);

/**
 * Debounce
 * @param  {Function} fn
 * @param  {Integer}  delay
 */
var debounce = toolkit.debounce = function debounce(fn, delay) {
  var delays = delay || 500;
  var timer;
  return function() {
    var self = this;
    var args = arguments;
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(function() {
      timer = null;
      fn.apply(self, args);
    }, delays);
  };
};

/**
 * Extend Javascript class
 * @param  {Function} Child
 * @param  {Function} Parent
 */
var extend = toolkit.extend = function extend(Child, Parent) {
  var F = function () {};

  F.prototype = Parent.prototype;

  Child.prototype = new F();
  Child.prototype.constructor = Child;

  Child.super = Parent.prototype;
};

/**
 * Print log into console
 */
var log = toolkit.log = function log() {
  if (!window.LOG) return;

  var args = Array.prototype.slice.call(arguments);
  var messages = [];
  for (var i = 0; i < args.length; i++) {
    var m = args[i];
    if (typeof m === 'object') {
      messages.push(JSON.stringify(m, null, 2));
    } else {
      messages.push(m);
    }
  }

  console.log(messages.join(' '));
};

/**
 * Get client config fron cookie
 */
var getClientConfig = toolkit.getClientConfig = function getClientConfig() {
  var clientConfig = $('#_clientConfig').val();
  if (clientConfig) {
    return JSON.parse(clientConfig);

  } else {
    return {};
  }
};

/**
 * Format and return a string.
 *
 * @param  {String} formatter - String formatter
 * @param  {...*}   [values]  - Values
 * @return {String}           - Formatted string
 *
 * @example
 * var name = 'World';
 * console.log(toolkit.strf('Hello, {0}!', name));
 */
var strf = toolkit.strf = function strf() {
  var args = Array.prototype.slice.call(arguments);
  if (0 === args.length) {
    return '';
  }

  var pattern = args.shift();
  try {
    pattern = pattern.toString();
  } catch (ex) {
    pattern = '';
  }

  return pattern.replace(/\{(\d+)\}/g, function replaceFunc(m, i) {
    return args[i] + '';
  });
};

/**
 * Slice text by length
 *
 * @param  {String}
 * @param  {Integer}
 * @return {String}
 */
var limitedText = toolkit.limitedText = function(text, maxLength) {
  text      = text      || '';
  maxLength = maxLength || 30;

  if (text.length <= maxLength) {
    return text;
  } else {
    return text.slice(0, maxLength - 3) + '...';
  }
};
var limitedTextGB = toolkit.limitedTextGB = function(text, maxLength) {
  text      = text      || '';
  maxLength = maxLength || 30;

  var len = 0;
  for (var i = 0; i < text.length; i++) {
    var c = text.charCodeAt(i);
    len += ((c >= 0x0001 && c <= 0x007e) || (0xff60 <= c && c <= 0xff9f)) ? 1 : 2;
    if (len >= maxLength) break;
  }

  var nextText = text.slice(0, i + 1);
  if (nextText !== text) {
    nextText += '...';
  }

  return nextText;
};

/**
 * Overwrite the substring in `str` from index `start`.
 *
 * @param  {String} str
 * @param  {Number} start
 * @param  {String} newSubStr
 * @return {String}
 */
var strOverwrite = toolkit.strOverwrite = function strOverwrite(str, start, newSubStr) {
  return str.slice(0, start) + newSubStr + str.slice(start + newSubStr.length);
};

/**
 * Replace prefix of data ID to another prefix
 * @param  {String} dataId
 * @param  {String} newPrefix
 * @return {String}
 */
var replaceDataIdPrefix = toolkit.replaceDataIdPrefix = function replaceDataIdPrefix(dataId, newPrefix) {
  var dataIdParts = dataId.split('-');
  dataIdParts[0] = newPrefix;

  return dataIdParts.join('-');
};

/**
 * Generate a new time serial SEQ
 * @return {String} New time-serail SEQ
 */
var genTimeSerialSeq = toolkit.genTimeSerialSeq = function genTimeSerialSeq(d, randLength) {
  if (isNothing(d)) {
    d = new Date();
  } else if ('string' === typeof d || 'number' === typeof d) {
    d = new Date(d);
  }

  if (!randLength) randLength = 4;

  var randPowBase = Math.pow(10, randLength);

  var offsettedUnixTimestamp = parseInt(d - SHORT_UNIX_TIMESTAMP_OFFSET * 1000) * randPowBase;
  var randInt = parseInt(Math.random() * randPowBase);

  return offsettedUnixTimestamp + randInt;
};

/**
 * Get First parts from a string
 * @param  {String}   s
 * @param  {String}   sep
 * @param  {Interger} count
 * @return {String}
 */
var getFirstPart = toolkit.getFirstPart = function getFirstPart(s, sep, count) {
  s     = s || '';
  sep   = sep || '-';
  count = count || 2;

  return s.split(sep).slice(0, count).join(sep);
};

/**
 * Get value from a JSON Object by a path.
 *
 * @param  {Object}  j    - JSON Object
 * @param  {String}  path - value's path
 * @param  {Boolean} safe - Prevent Errors been throw
 * @return {*}            - Value on path
 *
 * @example
 * var j = {
 *   a: {
 *     b: 1
 *   }
 * };
 * console.log(jsonFind(j, 'a.b', true));
 */
var jsonFind = toolkit.jsonFind = function jsonFind(j, path, safe) {
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

/**
 * Override the values from source JSON Object
 * to Destination JSON Object by each KEY.
 *
 * @param {Object} s - Source JSON Object
 * @param {Object} d - Destination JSON Object
 *
 * @example
 * var src = {
 *   a: 1,
 *   b: {
 *     c: null
 *   }
 * };
 *
 * var dest = {
 *   b: {
 *     c: 2
 *   },
 *   d: 3
 * };
 *
 * console.log(toolkit.jsonOverride(src, dest));
 */
var jsonOverride = toolkit.jsonOverride = function jsonOverride(s, d) {
  if (!s) return;

  for (var k in s) if (s.hasOwnProperty(k)) {
    if ('undefined' === typeof d[k]) {
      d[k] = s[k];
    } else if (Array.isArray(s[k])) {
      d[k] = s[k];
    } else if (null === s[k]) {
      d[k] = s[k];
    } else if ('object' === typeof s[k]) {
      jsonOverride(s[k], d[k]);
    } else {
      d[k] = s[k];
    }
  }
};

/**
 * Get all keys form an object
 * @param  {object} o
 * @return {array}
 */
var jsonKeys = toolkit.jsonKeys = function jsonKeys(o) {
  if ('object' !== typeof o) return null;

  var keys = [];
  for (var k in o) if (o.hasOwnProperty(k)) {
    keys.push(k);
  }

  return keys;
};

/**
 * Get all values form an object
 * @param  {object} o
 * @return {array}
 */
var jsonValues = toolkit.jsonValues = function jsonValues(o) {
  if ('object' !== typeof o) return null;

  var values = [];
  for (var k in o) if (o.hasOwnProperty(k)) {
    values.push(o[k]);
  }

  return values;
};

/**
 * Copy plain JSON object
 * @param  {Object} j
 * @return {Object}
 */
var jsonCopy = toolkit.jsonCopy = function jsonCopy(j) {
  if ('string' === typeof j) {
    return JSON.parse(j);
  } else {
    return JSON.parse(JSON.stringify(j));
  }
};

/**
 * Pick fields from a plain JSON object
 * @param  {Object}   o
 * @param  {String[]} keys
 * @return {Object}
 */
var jsonPick = toolkit.jsonPick = function jsonPick(o, keys) {
  if (isNothing(keys)) return o;

  keys = asArray(keys);

  var ret = {};
  var _copied = jsonCopy(o);

  for (var i = 0; i < keys.length; i++) {
    var k = keys[i];
    ret[k] = _copied[k];
  }

  return ret;
};

/**
 * Detect at least one of the keys can be found in an object
 * @param  {Object}   o
 * @param  {String[]} keys
 * @return {Object}
 */
var includeAny = toolkit.includeAny = function includeAny(o, keys) {
  for (var i = 0; i < keys.length; i++) {
    var k = keys[i];

    if (Array.isArray(o)) {
      if (o.indexOf(k) > -1) {
        return true;
      }

    } else {
      if (o.hasOwnProperty(k)) {
        return true;
      }
    }
  }

  return false;
};

/**
 * Create a value array of element from an Array
 * @param  {Array}  arr
 * @param  {String} field
 * @return {Array}
 */
var arrayElementValues = toolkit.arrayElementValues = function arrayElementValues(arr, field) {
  if (!Array.isArray(arr)) return null;

  var picked = [];
  arr.forEach(function(element) {
    picked.push(element[field]);
  });

  return picked;
};

/**
 * Create a map in {"<field>": {JSON}} from an Array
 * @param  {Array}  arr
 * @param  {String} field
 * @return {Object}
 */
var arrayElementMap = toolkit.arrayElementMap = function arrayElementMap(arr, field) {
  if (!Array.isArray(arr)) return null;

  var mapped = {};
  arr.forEach(function(element) {
    var value = element[field];
    mapped[value] = element;
  });

  return mapped;
};

/**
 * Replace ${<Var Name>} by {<Var Name>: <Var Value>}
 *
 * @param  {string|object} target
 * @param  {object}        vars
 * @return {string|object}
 */
var replaceVar = toolkit.replaceVar = function replaceVar(target, vars) {
  var targetType = typeof target;

  for (var k in vars) if (vars.hasOwnProperty(k)) {
    var v = vars[k];

    var token  = toolkit.strf('${{0}}', k);
    var regExp = new RegExp('\\\$\\\{' + k + '\\\}', 'g');

    switch(targetType) {
      case 'string':
        target = target.replace(regExp, v.toString());
        break;

      case 'object':
        for (var _k in target) if (target.hasOwnProperty(_k)) {
          if ('object' === typeof target[_k]) {
            target[_k] = replaceVar(target[_k], vars);
          }

          // Replace hole value
          if ('string' === typeof target[_k]) {
            if (target[_k] === token) {
              target[_k] = v;

            } else if (target[_k].indexOf(token) >= 0) {
              target[_k] = target[_k].replace(regExp, v.toString());
            }
          }

          // replace hole key
          if (_k == token) {
            target[v.toString()] = target[_k];
            delete target[_k];

          } else if (_k.indexOf(token) >= 0) {
            target[_k.replace(regExp, v.toString())] = target[_k];
            delete target[_k];
          }
        }

      break;
    }
  }

  return target;
};

/**
 * Create a new array without duplicated values.
 *
 * @param  {*[]} arr - Target array
 * @return {*[]}     - Non-duplication array
 */
var noDuplication = toolkit.noDuplication = function noDuplication(arr) {
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

/**
 * Check if the string can be converted to Date Object.
 *
 * @param  {String}  str - Target string
 * @return {Boolean}
 */
var isValidDate = toolkit.isValidDate = function isValidDate(str) {
  try {
    var unixTimestamp = Math.round(new Date(str).getTime() / 1000);

    if (!unixTimestamp || unixTimestamp >= 2147483647) {
      return false;
    }

    return true;
  } catch (ex) {
    return false;
  }
};

/**
 * Check if the value is `null` or `undefined`.
 *
 * @param  {*}       o - Target value
 * @return {Boolean}
 */
var isNullOrUndefined = toolkit.isNullOrUndefined = function isNullOrUndefined(o) {
  if (o === null || o === undefined) {
    return true;
  }

  return false;
};

/**
 * Check if the value is `null` or `''`.
 *
 * @param  {*}       o - Target value
 * @return {Boolean}
 */
var isNullOrEmpty = toolkit.isNullOrEmpty = function isNullOrEmpty(o) {
  if (toolkit.isNullOrUndefined(o) === true) {
    return true;
  }

  if ('string' === typeof o && o.length === 0) {
    return true;
  }

  return false;
};

/**
 * Check if the value is `null` or `''` or `' '`.
 *
 * @param  {*}       o - Target value
 * @return {Boolean}
 */
var isNullOrWhiteSpace = toolkit.isNullOrWhiteSpace = function isNullOrWhiteSpace(o) {
  if (toolkit.isNullOrEmpty(o) === true) {
    return true;
  }

  if ('string' === typeof o && o.trim().length === 0) {
    return true;
  }

  return false;
};

/**
 * Return a Object without  `null` or `''` or `' '`.
 *
 * @param  {*}      o - Target Object
 * @return {Object}
 */
var noNullOrWhiteSpace = toolkit.noNullOrWhiteSpace = function noNullOrWhiteSpace(o) {
  var newObj = {};
  for (var k in o) {
    if (toolkit.isNullOrWhiteSpace(o[k])) continue;

    newObj[k] = o[k];
  }

  return newObj;
};

/**
 * JSON.stringify replacer to stringify pageData in ejs.
 */
var noFunctionReplacer = toolkit.noFunctionReplacer = function noFunctionReplacer(k, v) {
  return typeof v === 'function' ? '<FUNCTION>'
                                 : v;
};

/**
 * Check if the value is `null`, `''`, `'  '`,
 * empty Array or empty Object.
 *
 * @param  {*}       o - Target value
 * @return {Boolean}
 */
var isNothing = toolkit.isNothing = function isNothing(o) {
  if (toolkit.isNullOrWhiteSpace(o) === true) {
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

/**
 * Check if the value is an JSON object,
 *
 * @param  {*} o - Target value
 * @return {Boolean}
 */
var isJSON = toolkit.isJSON = function isJSON(o) {
  if (typeof(o) == 'object'
      && Object.prototype.toString.call(o).toLowerCase() == '[object object]'
      && !o.length) {
    return true;
  }

  return false;
}

/**
 * Get the date string.
 *
 * @param  {null|Number|String|Object} d                - Date Object, String or Number (Unix Timestamp)
 * @param  {String}                    [f='YYYY-MM-DD'] - Formatter
 * @return {String}                                     - Date String
 */
var getDateString = toolkit.getDateString = function getDateString(d, f) {
  if (isNothing(d)) {
    d = new Date();
  }

  if ('string' === typeof d || 'number' === typeof d) {
    d = new Date(d);
  }

  var YYYY = d.getFullYear();
  var YY   = YYYY.toString().slice(-2);

  var M  = d.getMonth() + 1;
  var MM = padZero(M, 2);

  var D  = d.getDate();
  var DD = padZero(D, 2);

  return (f || 'YYYY-MM-DD')
    .replace('YYYY', YYYY)
    .replace('YY', YY)
    .replace('MM', MM)
    .replace('M', M)
    .replace('DD', DD)
    .replace('D', D);
};

/**
 * Get the time string.
 *
 * @param  {null|Number|String|Object} d              - Date Object, String or Number (Unix Timestamp)
 * @param  {String}                    [f='hh:mm:ss'] - Formatter
 * @return {String}                                   - Time String
 */
var getTimeString = toolkit.getTimeString = function getTimeString(d, f) {
  if (isNothing(d)) {
    d = new Date();
  }

  if ('string' === typeof d || 'number' === typeof d) {
    d = new Date(d);
  }

  var h = d.getHours();
  var hh = padZero(h, 2);

  var m = d.getMinutes();
  var mm = padZero(m, 2);

  var s = d.getSeconds();
  var ss = padZero(s, 2);

  var fff = padZero(d.getMilliseconds(), 3);

  return (f || 'hh:mm:ss')
    .replace('hh', hh)
    .replace('h', h)
    .replace('mm', mm)
    .replace('m', m)
    .replace('ss', ss)
    .replace('s', s)
    .replace('fff', fff);
};

/**
 * Get the datetime string.
 *
 * @param  {null|Number|String|Object}        d - Date Object, String or Number (Unix Timestamp)
 * @param  {String} [f='YYYY-MM-DD hh:mm:ss'] f - Date formatter
 * @return {String} - Datetime String
 */
var getDateTimeString = toolkit.getDateTimeString = function getDateTimeString(d, f) {
  var tmp = (f || 'YYYY-MM-DD hh:mm:ss');
  tmp = getDateString(d, tmp);
  tmp = getTimeString(d, tmp);

  return tmp;
};

/**
 * Get the date string for CN (+08:00).
 */
var getDateStringCN = toolkit.getDateStringCN = function getDateStringCN(d, f) {
  f = f || 'YYYY-MM-DD';
  return getDateTimeStringCN(d, f);
};

/**
 * Get the time string for CN (+08:00).
 */
var getTimeStringCN = toolkit.getTimeStringCN = function getTimeStringCN(d, f) {
  f = f || 'HH:mm:ss';
  return getDateTimeStringCN(d, f);
};

/**
 * Get the date time string for CN (+08:00).
 */
var getDateTimeStringCN = toolkit.getDateTimeStringCN = function getDateTimeStringCN(d, f) {
  d = d || undefined;
  f = f || 'YYYY-MM-DD HH:mm:ss';
  return moment(d).locale('zh_CN').utcOffset("+08:00").format(f);
};

/**
 * Get the ISO 8601 time string.
 *
 * @param  {null|Number|String|Object} d - Date Object, String or Number (Unix Timestamp)
 * @return {String} - ISO 8601 time string
 */
var getISO8601 = toolkit.getISO8601 = function getISO8601(d) {
  if (isNothing(d)) {
    d = new Date();
  } else if ('string' === typeof d || 'number' === typeof d) {
    d = new Date(d);
  }

  return d.toISOString();
};

/**
 * Get a random string.
 *
 * @param  {Number} len   - Length of random string
 * @param  {String} chars - Characters appear in the random string
 * @return {String}       - Random string
 */
var genRandString = toolkit.genRandString = function genRandString(len, chars) {
  if (!len) len = 32;

  var samples = chars || '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

  var randString = '';
  for (var i = 0; i < len; i++) {
    var randIndex = Math.floor(Math.random() * samples.length);
    randString += samples[randIndex];
  }

  return randString;
};

/**
 * Pack Object into an array
 * @param  {Object}   o
 * @return {Object[]}
 */
var asArray = toolkit.asArray = function asArray(o) {
  if (toolkit.isNullOrUndefined(o)) {
    return o;

  } else if (Array.isArray(o)) {
    return o;

  } else {
    return [o];
  }
};

/**
 * Convert Object array to a comma string
 * @param  {Object} o
 * @return {String}
 */
var asArrayStr = toolkit.asArrayStr = function asArrayStr(o) {
  if ('string' === typeof o) {
    return o;
  }

  arr = asArray(o);
  if (toolkit.isNullOrUndefined(arr)) {
    return arr;

  } else {
    return arr.join(',');
  }
};

/**
 * Get value and avoid undefined.
 *
 * @param  {*} v
 * @param  {*} defaultValue
 * @return {*}
 */
var getSafeValue = toolkit.getSafeValue = function getSafeValue(v, defaultValue) {
  if ('undefined' === typeof v) {
    return defaultValue;
  } else {
    return v;
  }
};

/**
 * Get Date object and safe for MySQL timestamp type
 * @param  {*} v
 */
var getSafeDateTime = toolkit.getSafeDateTime = function getSafeDateTime(v) {
  var d = new Date(v);
  var ts = d.getTime();
  if (ts < MIN_UNIX_TIMESTAMP_MS) {
    throw Error(strf('Datetime should not be earlier than {0}', new Date(MIN_UNIX_TIMESTAMP_MS).toISOString()));
  } else if (ts > MAX_UNIX_TIMESTAMP_MS) {
    throw Error(strf('Datetime should not be later than {0}', new Date(MAX_UNIX_TIMESTAMP_MS).toISOString()));
  }
  return d;
};

/**
 * Encode a string by base64.
 *
 * @param  {String} str - Origin string
 * @return {String}     - Base64 code
 */
var getBase64 = toolkit.getBase64 = function getBase64(str, uriSafe) {
  if (uriSafe) {
    return Base64.encodeURI(str);
  } else {
    return Base64.encode(str);
  }
};
var getBase64_old = toolkit.getBase64_old = function getBase64_old(str) {
  return btoa(encodeURIComponent(str)).replace(/ /g, '+');
};

/**
 * Decode a string by base64.
 *
 * @param  {String} base64str - Base64 code
 * @return {String}           - Origin string
 */
var fromBase64 = toolkit.fromBase64 = function fromBase64(base64str, keepBuffer) {
  if (keepBuffer) {
    return Base64.atob(base64str);
  } else {
    return Base64.decode(base64str);
  }
};
var fromBase64_old = toolkit.fromBase64_old = function fromBase64_old(base64str) {
  return decodeURIComponent(atob(base64str.replace(/ /g, '+')));
};

/**
 * Convert the target value to Boolean type (true|false).
 * `true`, `'true'`, `'yes'`, `'ok'`, `'on'`
 * and Positive numbers will be converted to `true`.
 * `false`, `'false'`, `'no'`, `'ng'`, `'off'`
 * and Zero and negative numbers will be converted to `false`.
 *
 * @param  {*}       o - Target value
 * @return {Boolean}
 */
var toBoolean = toolkit.toBoolean = function toBoolean(o) {
  if ('boolean' === typeof o) {
    return o;
  }

  if ('number' === typeof o || !isNaN(parseInt(o))) {
    return (parseInt(o) > 0);
  }

  if ('string' === typeof o) {
    if (['true',  '1', 'o', 'y', 'yes', 'ok', 'on' ].indexOf(o.toLowerCase()) >= 0) return true;
    if (['false', '0', 'x', 'n', 'no',  'ng', 'off'].indexOf(o.toLowerCase()) >= 0) return false;
  }

  return null;
};

/**
 * Pad Zero.
 *
 * @param  {String|Number} num
 * @param  {Number}        length
 * @param  {String|Number} char
 * @return {String}
 */
var padZero = toolkit.padZero = function padZero(num, length, char) {
  var len = num.toString().length;
  while (len < length) {
    num = (char || '0') + num;
    len++;
  }

  return num;
};

/**
 * Pick Hex digit from a '0xAB' format.
 *
 * @param  {String} hex
 * @return {String}
 */
var pickHexDigit = toolkit.pickHexDigit = function pickHexDigit(hex) {
  hex = hex.toString();

  if (hex.toLowerCase().slice(0, 2) === '0x') {
    hex = hex.slice(2);
  }

  hex = hex.toUpperCase();
  hex = padZero(hex, Math.ceil(hex.length / 2) * 2);

  return hex;
};

/**
 * Create a URL by params and query.
 *
 * @param  {String} url    - URL
 * @param  {Object} params - Param for URL
 * @param  {Object} query  - Query for URL
 * @return {String}        - URL with params and query
 */
var createFullURL = toolkit.createFullURL = function createFullURL(url, params, query) {
  // Prepare URL
  if (!isNothing(params)) {
    url = url.split('?')[0];
    for (var k in params) if (params.hasOwnProperty(k)) {
      var v = params[k];

      if (isNothing(v)) continue;

      url = url.replace(':' + k, v);
    }
  }

  // Prepare Query
  var qs = '';
  if (!isNothing(query)) {
    var parts = [];
    for (var k in query) if (query.hasOwnProperty(k)) {
      var v = query[k];

      if (isNothing(v)) continue;

      parts.push(encodeURIComponent(k) + '=' + encodeURIComponent(v));
    }
    qs = '?' + parts.join('&');
  }

  return url + qs;
};

/**
 * Get query object form URL
 *
 * @param  {String} url - URL
 * @return {Object}     - Query object
 */
var getQuery = toolkit.getQuery = function getQuery(url) {
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

/**
 * Replace query to URL
 *
 * @param  {URL}           url
 * @param  {Object}        query
 * @param  {Boolean=false} skipBlank
 * @return {String}
 */
var replaceQuery = toolkit.replaceQuery = function replaceQuery(url, query, skipBlank) {
  var urlParts = null;

  urlParts = url.split('#');
  var hash = urlParts[1];

  urlParts = urlParts[0].split('?');
  var rawURL = urlParts[0];

  var queryParts = [];
  for (var k in query) if (query.hasOwnProperty(k)) {
    var v = query[k];
    if (skipBlank === true && isNothing(v)) continue;

    queryParts.push(k + '=' + v);
  }

  var nextURL = rawURL;

  if (queryParts.length > 0) {
    nextURL += '?' + queryParts.join('&');
  }

  if (hash) {
    nextURL += '#' + hash;
  }

  return nextURL;
};

/**
 * Update query to URL
 *
 * @param  {URL}           url
 * @param  {Object}        query
 * @param  {Boolean=false} skipBlank
 * @return {String}
 */
var updateQuery = toolkit.updateQuery = function updateQuery(url, query, skipBlank) {
  var nextQuery = getQuery(url);

  for (var k in query) if (query.hasOwnProperty(k)) {
    var v = query[k];
    if (toolkit.isNullOrUndefined(v)) {
      delete nextQuery[k];
    } else {
      nextQuery[k] = v;
    }
  }

  url = replaceQuery(url, nextQuery, skipBlank);

  return url;
};

/**
 * Get the extention from the file name.
 *
 * @param  {String} fileName - File name
 * @return {String}          - File extention
 */
var getExt = toolkit.getExt = function getExt(fileName) {
  if (fileName.indexOf('.') === -1) {
    return null;
  }

  return fileName.split('.').pop().toString().toLowerCase();
};

/**
 * Generate RexExp from wildcard.
 *
 * @param  {String} pattern
 * @return {String}
 */
var genRegExpByWildcard = toolkit.genRegExpByWildcard = function genRegExpByWildcard(pattern) {
  var regExp = pattern.replace(/\./g, '\\.')
                      .replace(/\|/g, '\\|')
                      .replace(/\*\*/g, '[^\\.\\|]+')
                      .replace(/\*/g, '[^\\.\\|]+');

  if (toolkit.endsWith(pattern, '**')) {
    regExp = toolkit.strf('^{0}', regExp);
  } else {
    regExp = toolkit.strf('^{0}$', regExp);
  }

  return regExp;
};

/**
 * Match key pattern.
 *
 * @param  {String}  key
 * @param  {String}  pattern
 * @return {Boolean}
 */
var matchWildcard = toolkit.matchWildcard = function matchWildcard(value, pattern) {
  var regExp = toolkit.genRegExpByWildcard(pattern);
  return !!value.match(regExp);
};

/**
 * Match value patterns.
 *
 * @param  {String}   value
 * @param  {String[]} patterns
 * @return {Boolean}
 */
var matchWildcards = toolkit.matchWildcards = function matchWildcards(value, patterns) {
  if (!value || !patterns) {
    return false;
  }

  patterns = asArray(patterns);

  for (var i = 0;  i < patterns.length; i++) {
    var p = patterns[i];

    if (toolkit.matchWildcard(value, p)) {
      return true;
    }
  }

  return false;
};

/**
 * Split array to groups
 * @param  {Array}   arr
 * @param  {Integer} size
 * @return {Array[]}
 */
var splitArray = toolkit.splitArray = function splitArray(arr, size) {
  size = size || 100;

  var groups = [];
  for (var i = 0; i < arr.length; i += size){
    var g = arr.slice(i, i + size);
    groups.push(g);
  }

  return groups;
};

var compareVersion = toolkit.compareVersion = function compareVersion(a, b) {
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

/**
 * Generate file upload progress
 *
 * @param  {Object} progressData - Progress data
 * @return {String}              - message
 */
function getUploadMessage(progressData) {
  return toolkit.strf('{0}% ({1}KB/s)',
      parseInt(progressData.loaded / progressData.total * 100, 10),
      parseInt(progressData.bitrate / 1000 / 8)
  );
};

/**
 * Call API
 *
 * @param {Object}   options                         - API calling options
 * @param {String}   options.method                  - HTTP method (e.g. 'get', 'post', 'put', 'delete')
 * @param {String}   options.url                     - API URL
 * @param {String}   [options.dataType=null]         - The type of data
 * @param {Object}   [options.headers=null]          - Headers
 * @param {Object}   [options.params=null]           - Params
 * @param {Object}   [options.query=null]            - Query
 * @param {Object}   [options.body=null]             - Body
 * @param {Object}   [options.files=null]            - File upload
 * @param {Object}   [options.$target=null]          - jQuery Object for button/alink
 * @param {Object}   [options.skipAuth=false]        - If send x-auth-token header.
 * @param {Object}   [options.autoRedirectAuth=true] - If send x-auth-token header.
 * @param {Object}   [hooks=null]                    - Hooks for operation after calling.
 * @param {Function} [hooks.ok]                      - Operation for succeed calling.
 * @param {Function} [hooks.ng]                      - Operation for failed calling.
 * @param {Function} [hooks.end]                     - Operation for calling completed.
 */
var callAPI = toolkit.callAPI = function callAPI(options, hooks) {
  options = options || {};
  hooks   = hooks   || options.hooks || {};

  options.method = options.method || 'get';

  // string -> object
  if (options.headers && 'string' === typeof options.headers) {
    options.headers = JSON.parse(options.headers);
  }

  if (options.params && 'string' === typeof options.params) {
    options.params = JSON.parse(options.params);
  }

  if (options.query && 'string' === typeof options.query) {
    options.query = JSON.parse(options.query);
  }

  if (options.body && 'string' === typeof options.body) {
    options.body = JSON.parse(options.body);
  }

  if ('undefined' === typeof options.autoRedirectAuth) {
    options.autoRedirectAuth = true;
  }

  toolkit.log(options.method.toUpperCase() + ' ' + options.url);
  toolkit.log('=> headers:', JSON.stringify(options.headers, null, 2));
  toolkit.log('=> params :', JSON.stringify(options.params, null, 2));
  toolkit.log('=> query  :', JSON.stringify(options.query, null, 2));
  if (options.body) {
    toolkit.log('=> body   :', JSON.stringify(options.body, null, 2));
  }
  if (options.files) {
    for (var i = 0; i < options.files.length; i++) {
      toolkit.log('=> files  :', options.files[i].name, options.files[i].size + 'Bytes');
    }
  }

  var fullURL = createFullURL(options.url, options.params, options.query);
  var headers = options.skipAuth ? {} : core.getAuthHeader();

  for (var k in options.headers) if (options.headers.hasOwnProperty(k)) {
    headers[k] = options.headers[k];
  }

  var ajaxOptions = {
    dataType: options.dataType || 'json',
    type    : options.method,
    url     : fullURL,
    headers : headers,
    success : function(data, textStatus, jqXHR) {
      var j = jqXHR.responseJSON;

      if (!j) {
        if ('function' === typeof hooks.ok) {
          hooks.ok(jqXHR.responseText, jqXHR.status);
        }
      } else {
        if ('function' === typeof hooks.ok) {
          toolkit.log(j);
          hooks.ok(j, jqXHR.status, jqXHR);
          return;
        }
      }
    },
    error: function(jqXHR, textStatus) {
      var j = jqXHR.responseJSON;

      if (!j) {
        if ('function' === typeof hooks.ng) {
          hooks.ng(jqXHR.responseText, jqXHR.status);
        }
      } else {
        toolkit.log(j);
        if (j.reason === 'EUserAuth') {
          // Stop user who is not signed in.
          // core.removeXAuthToken();

          // if (options.autoRedirectAuth) {
          //   location.href = '/sign-in';
          // }
          location.href = '/auth-error';
        }

        // Call custom hook function.
        if ('function' === typeof hooks.ng) {
          hooks.ng(j, jqXHR.status, jqXHR);
        }
      }
    },
    complete: function(jqXHR, textStatus) {
      toolkit.log('API END', jqXHR.status, jqXHR.statusText);
      if ('function' === typeof hooks.end) {
        hooks.end(null, jqXHR.status, jqXHR);
      }
    },
  };

  var $t = options.$target;

  if (options.body) {
    ajaxOptions.contentType = 'application/json';
    ajaxOptions.data        = JSON.stringify(options.body);
  }

  $.ajax(ajaxOptions);
};

/**
 * Check is from WeChat.
 *
 * @return {Boolean}
 */
var isWeChatBrowser = toolkit.isWeChatBrowser = function isWeChatBrowser() {
  var ua = window.navigator.userAgent;
  var m = ua.match(/MicroMessenger/i);
  if (m && m[0].toLowerCase() === 'micromessenger'){
    return true;
  } else {
    return false;
  }
};

/**
 * Run compare operation.
 *
 * @param  {*}       value
 * @param  {String}  operator
 * @param  {*}       operand
 * @return {Boolean}
 */
var runCompare = toolkit.runCompare = function runCompare(value, operator, operand) {
  operator = operator.toLowerCase();

  switch(operator) {
    case 'isnull':
      return toolkit.isNullOrUndefined(value);

    case 'isnotnull':
      return !toolkit.isNullOrUndefined(value);

    case 'isempty':
      return toolkit.isNullOrWhiteSpace(value);

    case 'isnotempty':
      return !toolkit.isNullOrWhiteSpace(value);

    case '=':
    case 'eq':
      return (value === operand);

    case '!=':
    case '<>':
    case 'ne':
      return (value !== operand);

    case '<':
    case 'lt':
      return (value < operand);

    case '>':
    case 'gt':
      return (value > operand);

    case '<=':
    case 'le':
      return (value <= operand);

    case '=>':
    case 'ge':
      return (value >= operand);

    case 'like':
      value = value || '';
      return (value.indexOf(operand) >= 0);

    case 'notlike':
      value = value || '';
      return (value.indexOf(operand) === -1);

    case 'prelike':
      value = value || '';
      return (value.indexOf(operand) === 0);

    case 'suflike':
      value = value || '';
      return (value.indexOf(operand) === value.length - operand.length);

    case 'pattern':
      return toolkit.matchWildcard(value, operand);

    case 'notpattern':
      return !toolkit.matchWildcard(value, operand);

    case 'in':
      return (operand.indexOf(value) >= 0)
      break;

    case 'notin':
      return (operand.indexOf(value) === -1)
      break;

    case 'contains':
      value = value || [];
      return (value.indexOf(operand) >= 0);

    case 'notcontains':
      value = value || [];
      return (value.indexOf(operand) === -1);
  }

  return false;
};

/**
 * Convert to a <Value>% string
 *
 * @param  {Number}    value
 * @param  {Integer=0} digits
 * @return {String}
 */
var toValuePercentString = toolkit.toValuePercentString = function toValuePercentString(value, digits) {
  if (!digits) digits = 0;

  value = parseFloat(value * 100);

  return value.toFixed(digits) + '%';
};

/**
 * Convert to a <Value><Unit> string
 *
 * @param  {[String]}    units
 * @param  {Number}      radix
 * @param  {Number}      value
 * @param  {String}      fromUnit
 * @param  {String=null} toUnit
 * @param  {Integer=0}   digits
 * @return {String}
 */
var toValueUnitString = toolkit.toValueUnitString = function toValueUnitString(units, radix, value, fromUnit, toUnit, digits) {
  if (!digits) digits = 0;
  if (units.indexOf(fromUnit) < 0) return value + fromUnit;
  if (units.indexOf(toUnit) < 0) toUnit = null;

  value = parseFloat(value);

  if (toUnit) {
    var scale = Math.pow(radix, units.indexOf(fromUnit) - units.indexOf(toUnit));
    return (value * scale).toFixed(digits) + toUnit;

  } else {
    var exponent = 0;
    while (value > radix) {
      value = value / radix;
      exponent++;
    }

    return value.toFixed(digits) + units[units.indexOf(fromUnit) + exponent];
  }
};

/**
 * Convert to a <Value><Unit> string for volumn (Bytes, KB, MB, GB, TB)
 *
 * @param  {Number}      value
 * @param  {String}      fromUnit
 * @param  {String=null} toUnit
 * @param  {Integer=0}   digits
 * @return {String}
 */
var toVolumnUnitString = toolkit.toVolumnUnitString = function toVolumnUnitString(value, fromUnit, toUnit, digits) {
  return toValueUnitString(VOLUMN_UNITS, VOLUMN_RADIX, value, fromUnit, toUnit, digits)
};

/**
 * Convert to a <Value><Unit> string for transmission rate (bps, Kbps, Mbps, Gbps)
 *
 * @param  {Number}      value
 * @param  {String}      fromUnit
 * @param  {String=null} toUnit
 * @param  {Integer=0}   digits
 * @return {String}
 */
var toTransmissionRateUnitString = toolkit.toTransmissionRateUnitString = function toTransmissionRateUnitString(value, fromUnit, toUnit, digits) {
  return toValueUnitString(TRANSMISSION_RATE_UNITS, TRANSMISSION_RATE_RADIX, value, fromUnit, toUnit, digits)
};

/**
 * Convert to a <Value><Unit> string for transmission rate (B/s, KB/s, MB/s, GB/s)
 *
 * @param  {Number}      value
 * @param  {String}      fromUnit
 * @param  {String=null} toUnit
 * @param  {Integer=0}   digits
 * @return {String}
 */
var toTransmissionRateUnitStringInByte = toolkit.toTransmissionRateUnitStringInByte = function toTransmissionRateUnitStringInByte(value, fromUnit, toUnit, digits) {
  return toValueUnitString(TRANSMISSION_RATE_UNITS_IN_BYTE, TRANSMISSION_RATE_RADIX_IN_BYTE, value, fromUnit, toUnit, digits)
};

});
