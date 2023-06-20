'use strict';

/* Built-in Modules */
var os           = require('os');
var crypto       = require('crypto');
var zlib         = require('zlib');
var urlparse     = require('url').parse;
var querystring  = require('querystring');
var childProcess = require('child_process');

/* 3rd-party Modules */
var fs        = require('fs-extra');
var yaml      = require('js-yaml');
var uuid      = require('uuid');
var iconv     = require('iconv-lite');
var babyparse = require('babyparse');
var async     = require('async');
var nanoid    = require('nanoid').customAlphabet('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ', 12);
var moment    = require('moment');
var Base64    = require('js-base64').Base64;
var byteSize  = require('byte-size');
var simpleGit = require('simple-git');

var toolkit = exports;

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

var RE_HTTP_BASIC_AUTH_MASK         = /:\/\/.+:.+@/g;
var RE_HTTP_BASIC_AUTH_MASK_REPLACE = '://***:***@';
var CONFIG_AUTH_FIELD_KEYWORDS = [
  'secret',
  'password',
]

var ensureFn = toolkit.ensureFn = function ensureFn(fn) {
  if ('function' === typeof fn) {
    return fn;
  } else {
    return function() {};
  }
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
 * Get IPv4
 * @param  {String} ifaceName
 * @return {String}
 */
var getMyIPv4 = toolkit.getMyIPv4 = function getMyIPv4(ifaceName) {
  var ifaces = os.networkInterfaces();

  if (ifaceName) {
    var iface = ifaces[ifaceName];

    if (!iface) throw new Error('WAT: No such interface: ' + ifaceName);

    for (var i = 0; i < iface.length; i++) {
      if (iface[i].family !== 'IPv4' || iface[i].internal) continue;

      return iface[i].address;
    }
  } else {
    for (var name in ifaces) if (ifaces.hasOwnProperty(name)) {
      var iface = ifaces[name];

      for (var i = 0; i < iface.length; i++) {
        if (iface[i].family !== 'IPv4' || iface[i].internal) continue;

        return iface[i].address;
      }
    }
  }

  return '127.0.0.1';
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
 * @param  {String}  text
 * @param  {Integer} maxLength
 * @param  {Object}  options
 * @param  {Any}     options.showLength
 * @return {String}
 */
var limitText = toolkit.limitText = function(text, maxLength, options) {
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
 * Initialize the return JSON for API.
 *
 * @param  {Object} data      - Data.
 * @param  {Object} pageInfo  - Page information.
 * @param  {Object} extraData- Extra data.
 * @return {Object}           - Blank response JSON Object.
 */
var initRet = toolkit.initRet = function initRet(data, pageInfo, extraData) {
  return {
    ok       : true,
    error    : 200,
    message  : '',
    data     : toolkit.isNullOrUndefined(data) ? null : data,
    extraData: extraData,
    pageInfo : pageInfo || undefined,
  };
};

/**
 * Generate a UUID
 * @return {String}
 */
var genUUID = toolkit.genUUID = function genUUID(opt) {
  opt = opt || {}
  opt.noHyphen = opt.noHyphen || false;

  var v = uuid.v4();
  if (opt.noHyphen) {
    v = v.replaceAll('-', '');
  }

  return v;
};

/**
 * Generate a new data ID with prefix.
 *
 * @param  {String} prefix - Data ID prefix
 * @return {String}        - New data ID
 */
var genDataId = toolkit.genDataId = function genDataId(prefix) {
  prefix = prefix || 'data';
  return prefix + '-' + nanoid();
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
var jsonFindSafe = toolkit.jsonFindSafe = function jsonFindSafe(j, path) {
  return jsonFind(j, path, true);
}

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
var jsonKeys = toolkit.jsonKeys = function jsonKeys(j) {
  if ('object' !== typeof j) return null;

  var keys = [];
  for (var k in j) if (j.hasOwnProperty(k)) {
    keys.push(k);
  }

  return keys;
};

/**
 * Get all values form an object
 * @param  {object} o
 * @return {array}
 */
var jsonValues = toolkit.jsonValues = function jsonValues(j) {
  if ('object' !== typeof j) return null;

  var values = [];
  for (var k in j) if (j.hasOwnProperty(k)) {
    values.push(j[k]);
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
var jsonPick = toolkit.jsonPick = function jsonPick(j, keys) {
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

/**
 * Kick fields from a plain JSON object
 * @param  {Object}   o
 * @param  {String[]} keys
 * @return {Object}
 */
var jsonKick = toolkit.jsonKick = function jsonKick(j, keys) {
  if (isNothing(keys)) return j;

  keys = asArray(keys);

  var ret = jsonCopy(j);

  for (var i = 0; i < keys.length; i++) {
    var k = keys[i];
    delete ret[k];
  }

  return ret;
};

/**
 * Dump JSON as string
 * @param  {Object} j
 * @return string
 */
var jsonDumps = toolkit.jsonDumps = function jsonDumps(j, indent) {
  function replacer(k, v) {
    if ('function' === typeof v) {
      return toolkit.strf('<function {0}(...)>', v.name);

    } else if (Buffer.isBuffer(v)) {
      return toolkit.strf('<Buffer size:{0}>', byteSize(v.length));

    } else {
      return v;
    }
  }

  if (Buffer.isBuffer(j)) {
    return JSON.stringify(replacer(null, j));
  } else {
    return JSON.stringify(j, replacer, indent);
  }
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
var arrayElementValues = toolkit.arrayElementValues = function arrayElementValues(arr, field, distinct) {
  if (!Array.isArray(arr)) return null;

  var picked = [];
  arr.forEach(function(element) {
    picked.push(element[field]);
  });

  if (distinct) {
    picked = noDuplication(picked);
  }

  return picked;
};

/**
 * Create a map in {"<keyField>": {JSON}} from an Array
 * @param  {Array}  arr
 * @param  {String} keyField
 * @return {Object}
 */
var arrayElementMap = toolkit.arrayElementMap = function arrayElementMap(arr, keyField, valueField) {
  if (!Array.isArray(arr)) return null;

  var mapped = {};
  arr.forEach(function(element) {
    var key = element[keyField];

    if (valueField) {
      mapped[key] = element[valueField];
    } else {
      mapped[key] = element;
    }
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
  return typeof v === 'function' ? '<FUNCTION>' : v;
};

/**
 * Check if the value is `null`, `''`, `'  '`,
 * empty Array or empty Object.
 *
 * @param  {*}       o - Target value
 * @return {Boolean}
 */
var isNothing = toolkit.isNothing = function isNothing(o) {
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
var notNothing = toolkit.notNothing = function notNothing(o) {
  return !isNothing(o);
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
 * Get current timestamp in ms.
 *
 * @return {Integer}
 */
var getTimestampMs = toolkit.getTimestampMs = function getTimestampMs() {
  return Date.now();
};

/**
 * Get current timestamp in s.
 *
 * @return {Integer}
 */
var getTimestamp = toolkit.getTimestamp = function getTimestamp() {
  return parseInt(Date.now() / 1000);
};

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
 * Get Hash.
 *
 * @param  {String} str                  - Target string
 * @param  {String} [algorithm="sha256"] - Hash algorithm
 * @return {String}                      - Hash result
 */
var getHash = toolkit.getHash = function getHash(str, algorithm) {
  algorithm = algorithm || 'sha256';

  var c = crypto.createHash(algorithm);
  c.update(str);

  var hash = c.digest('hex');
  return hash;
};

/**
 * Get MD5.
 *
 * @param  {String} str - Target string
 * @return {String}     - MD5 result
 */
var getMD5 = toolkit.getMD5 = function getMD5(str) { return getHash(str, 'md5'); };

/**
 * Get SHA1.
 *
 * @param  {String} str - Target string
 * @return {String}     - SHA1 result
 */
var getSha1 = toolkit.getSha1 = function getSha1(str) { return getHash(str, 'sha1'); };

/**
 * Get SHA256.
 *
 * @param  {String} str - Target string
 * @return {String}     - SHA256 result
 */
var getSha256 = toolkit.getSha256 = function getSha256(str) { return getHash(str, 'sha256'); };

/**
 * Get SHA512.
 *
 * @param  {String} str - Target string
 * @return {String}     - SHA512 result
 */
var getSha512 = toolkit.getSha512 = function getSha512(str) { return getHash(str, 'sha512'); };

/**
 * Get HMAC-SHA1.
 *
 * @param  {String} str - Target string
 * @param  {String} key - Secret
 * @return {String}     - HMAC-SHA1 result
 */
var getHmacSha1 = toolkit.getHmacSha1 = function getHmacSha1(str, key) {
  var c = crypto.createHmac('sha1', key);
  c.update(str);

  var hmacSha1 = c.digest('hex');
  return hmacSha1;
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

function _padLength(text, length) {
  var count = text.length;
  var addCount = length - (count % length);
  text += ' '.repeat(addCount);
  return text;
};

/**
 * Cipher by AES.
 *
 * @param  {String} input - String to cipher
 * @param  {String} key   - Secret
 * @return {String}       - Ciphered string
 */
var cipherByAES = toolkit.cipherByAES = function cipherByAES(text, key) {
  text = _padLength(text, 16);
  key = _padLength(key, 32).slice(0, 32);

  var c = crypto.createCipheriv('aes-256-cbc', key, '\0'.repeat(16));
  c.setAutoPadding(false);
  var data = [
    c.update(text, 'utf8', 'base64'),
    c.final('base64'),
  ].join('');

  return data;
};

/**
 * Decipher by AES.
 *
 * @param  {String} input - String to decipher
 * @param  {String} key   - Secret
 * @return {String}       - Deciphered string
 */
var decipherByAES = toolkit.decipherByAES = function decipherByAES(data, key) {
  key = _padLength(key, 32).slice(0, 32);

  var c = crypto.createDecipheriv('aes-256-cbc', key, '\0'.repeat(16));
  c.setAutoPadding(false);
  var text = [
    c.update(data, 'base64', 'utf8'),
    c.final('utf8'),
  ].join('');

  return text.trim();
};

/**
 * Encode string by Base64.
 *
 * @param  {String} str - Origin string
 * @return {String}     - base64 value
 */
var getBase64 = toolkit.getBase64 = function getBase64(str, uriSafe) {
  if (uriSafe) {
    return Base64.encodeURI(str);
  } else {
    return Base64.encode(str);
  }
};

/**
 * Decode string from Base64 value.
 *
 * @param  {String} base64str  - base64 string
 * @return {String}            - Origin string
 */
var fromBase64 = toolkit.fromBase64 = function fromBase64(base64str) {
  return Base64.decode(base64str);
};

/**
 * Gzip string and return Base64 value.
 *
 * @param  {String} str - Origin string
 * @return {String}     - base64 value
 */
var getGzipBase64 = toolkit.getGzipBase64 = function getGzipBase64(str) {
  var stringToZip = JSON.stringify(str);
  return zlib.gzipSync(stringToZip).toString('base64');
};

/**
 * Gunzip string from Base64 value.
 *
 * @param  {String} base64str  - base64 string
 * @return {String}            - Origin string
 */
var fromGzipBase64 = toolkit.fromGzipBase64 = function fromGzipBase64(base64str) {
  var unzippedString = zlib.gunzipSync(Buffer.from(base64str, 'base64')).toString();
  return JSON.parse(unzippedString);
};

/**
 * Add SALT to password and get SHA1 result.
 *
 * @param  {String} salt
 * @param  {String} password
 * @param  {String} secret
 * @return {String} Password hash
 */
var getSaltedPasswordHash = toolkit.getSaltedPasswordHash = function getSaltedPasswordHash(salt, password, secret) {
  var strToHash = strf('~{0}~{1}~{2}~', salt, password, secret);
  var hash = getSha512(strToHash);
  return hash;
};

/**
 * Get string sign
 *
 * @param  {String} s
 * @param  {String} secret
 * @return {String} string hash
 */
var getStringSign = toolkit.getStringSign = function getStringSign(s, secret) {
  var strToHash = strf('~{0}~{1}~', s, secret);
  var hash = getSha512(strToHash);
  return hash;
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
 * Get cache key as pattern `<topic>@<name>:<tagName1>:<tagValue1>:<tagName2>:<tagValue2>:...:`
 *
 * @param  {String}   topic
 * @param  {String}   name
 * @param  {String[]} tags
 * @return {String} - Cache key
 */
var _getCacheKey = toolkit._getCacheKey = function _getCacheKey(topic, name, tags) {
  if (isNothing(topic) === true) {
    throw new Error(strf('WAT: Can not use a topic with `{0}`', topic));
  }

  if (isNothing(name) === true) {
    throw new Error(strf('WAT: Can not use a name with `{0}`', name));
  }

  if (toolkit.isNothing(tags)) {
    var cacheKey = strf('{0}@{1}', topic, name);
    return cacheKey;

  } else {
    var cacheKey = strf('{0}@{1}:{2}:', topic, name, tags.join(':'));
    return cacheKey;
  }
};

/**
 * Parse cache key like pattern `<topic>@<name>:<tagName1>:<tagValue1>:<tagName2>:<tagValue2>:...:`
 *
 * @param  {String}   cacheKey
 * @return {Object} - parsed cache key
 */
var _parseCacheKey = toolkit._parseCacheKey = function _parseCacheKey(cacheKey) {
  var topicRestParts = cacheKey.split('@');
  var topic = topicRestParts[0];
  var rest  = topicRestParts.slice(1).join('@')

  var nameRestParts = rest.replace(/:$/, '').split(':');
  var name   = nameRestParts[0];
  var tagKVs = nameRestParts.slice(1);

  var cacheKeyInfo = {
    topic: topic,
    name : name,
    tags : {},
  };
  for (var i = 0; i < tagKVs.length; i += 2) {
    cacheKeyInfo.tags[tagKVs[i]] = tagKVs[i + 1] || null;
  }

  return cacheKeyInfo;
};

var _getWorkerQueue = toolkit._getWorkerQueue = function _getWorkerQueue(name) {
  if ('number' !== typeof name && !name) {
    throw new Error('WAT: Queue name not specified.')
  }
  return strf('workerQueue@{0}', name);
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
 * Detect if the string starts with the prefix
 *
 * @param  {String} s
 * @param  {String} prefix
 * @return {Boolean}
 */
var startsWith = toolkit.startsWith = function startsWith(s, prefix) {
  return s.indexOf(prefix) === 0;
};

/**
 * Detect if the string ends with the suffix
 *
 * @param  {String} s
 * @param  {String} suffix
 * @return {Boolean}
 */
var endsWith = toolkit.endsWith = function endsWith(s, suffix) {
  return (s.slice(-1 * suffix.length) === suffix);
};

/**
 * Spilt camel style string
 * @param  {String} s
 * @return {String}
 */
var splitCamel = toolkit.splitCamel = function splitCamel(s) {
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

      parts.push(k + '=' + v);
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
 * Replace the path end
 *
 * @param  {String} originPath - Origin path
 * @param  {String} newName    - new name
 * @return {String}
 */
var replacePathEnd = toolkit.replacePathEnd = function replacePathEnd(originPath, newName) {
  originPath = originPath.trim();

  if (toolkit.endsWith(originPath, '/')) {
    originPath = originPath.slice(0, -1);
  }

  var pathParts = originPath.split('/').slice(0, -1);
  if (newName) {
    pathParts.push(newName);
  }

  var newPath = pathParts.join('/');
  return newPath;
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

/**
 * Parse Version to array
 * @param  {String} ver
 * @return {Integer|false}
 */
 var parseVersion = toolkit.parseVersion = function parseVersion(ver) {
  let m = ('' + ver).trim().match(/^\d+(\.\d+)+$/g);
  if (!m) {
    return false;
  } else {
    return m[0].split('.').map(x => parseInt(x));
  }
};

/**
 * Compare Version
 * @param  {String} a
 * @param  {String} b
 * @return {Integer}
 */
var compareVersion = toolkit.compareVersion = function compareVersion(a, b) {
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

/**
 * Get expire time string for OSS download URL
 * @param  {String} ossDownloadURL
 * @return {String}
 */
var getOSSExpireTimeString = toolkit.getOSSExpireTimeString = function getOSSExpireTimeString(ossDownloadURL) {
  if (!ossDownloadURL) return null;

  var query = querystring.parse(urlparse(ossDownloadURL).query);

  var expireTimeString = null;
  if (query.Expires) {
    expireTimeString = toolkit.getISO8601(parseInt(query.Expires) * 1000);
  }

  return expireTimeString;
};

/**
 * @constructor
 */
var StringBuilder = function() {
  this._parts = [];
};

/**
 * Format and append a string into StringBuilder Object.
 *
 * @param  {String} formatter - String formatter
 * @param  {...*}   [values]  - Values
 * @return {Object}           - StringBuilder Object itself.
 */
StringBuilder.prototype.append = function() {
  var args = Array.prototype.slice.call(arguments);
  var s = strf.apply(null, args);
  this._parts.push(s);

  return this;
};

/**
 * Join all string parts and return.
 *
 * @param  {String} [sep=' '] - Separator
 * @return {String}
 */
StringBuilder.prototype.toString = function(sep) {
  if (toolkit.isNullOrUndefined(sep)) {
    sep = ' ';
  }
  sep += '';

  return this._parts.join(sep);
};

toolkit.StringBuilder = StringBuilder;
toolkit.createStringBuilder = function() {
  return new StringBuilder();
};

/**
 * Ensure string/object to be a pretty json string.
 * @param  {String|Object} j
 * @return {String}
 */
var ensureJSONString = toolkit.ensureJSONString = function ensureJSONString(j) {
  if (j &&'string' !== typeof j) {
    return JSON.stringify(j);
  }
  return j;
};

/**
 * Convert JSON string/object to be a pretty formatted string.
 * @param  {String|Object} j
 * @param  {String}        indent
 * @return {String}
 */
var prettyJSONString = toolkit.prettyJSONString = function prettyJSONString(j, indent) {
  if ('string' === typeof j) j = JSON.parse(j);
  return JSON.stringify(j, null, indent || '  ');
};

/**
 * Convert JSON data to object.
 *
 * @param  {Object|Object[]} data         - JSON data
 * @param  {Object}          [options={}] - Convert options
 *    {
 *      <key>: <'bool'|'boolean'|'gzip'|'json'|'jsonGzip'|'commaArray'|'spaceArray'|'date'>
 *    }
 * @return {Object|Object[]} - Converted JSON data
 */
var convertObject = toolkit.convertObject = function convertObject(data, options) {
  if (!data) return data;

  options = options || {};

  var isArray = true;
  if (!Array.isArray(data)) {
    isArray = false;
    data = [data];
  }

  for (var i = 0; i < data.length; i++) {
    var row = data[i];

    for (var field in options) if (options.hasOwnProperty(field)) {
      var convertType = options[field];
      var value = row[field];

      if (toolkit.isNullOrUndefined(value)) continue;
      if (!convertType)                     continue;

      try {
        switch(convertType) {
          case 'int':
          case 'integer':
            row[field] = parseInt(value);
            break;

          case 'float':
            row[field] = parseFloat(value);
            break;

          case 'bool':
          case 'boolean':
            row[field] = toBoolean(value);
            break;

          case 'gzip':
            row[field] = zlib.gunzipSync(value).toString();
            break;

          case 'json':
            if ('string' === typeof value) {
              row[field] = JSON.parse(value);
            }
            break;

          case 'jsonGzip':
            var jsonString = zlib.gunzipSync(value).toString();
            row[field] = JSON.parse(jsonString);
            break;

          case 'commaArray':
            if ('string' === typeof value) {
              row[field] = value.replace(/\s*\,\s*/g, ',').split(',');
            }
            break;

          case 'spaceArray':
            if ('string' === typeof value) {
              row[field] = value.replace(/\s+/g, ' ').split(' ');
            }
            break;

          case 'date':
            row[field] = new Date(value);
            break;
        }

      } catch(err) {
        // Nope
      }
    }
  }

  if (!isArray) {
    data = data[0];
  }

  return data;
};

/**
 * JSON convertor
 *
 * @param  {Object[]} j                - JSON arrays
 * @param  {String}   type             - Target type (e.g. "json|csv")
 * @param  {String}   [charset="utf8"] - Charset
 * @return {String}                    - CSV string
 */
var convertJSON = toolkit.convertJSON = function convertJSON(j, type, charset) {
  var converted = null;

  // Convert data type
  switch (type) {
    case 'json':
      converted = JSON.stringify(j, null, 2);
      break;

    case 'csv':
      j = asArray(j);

      converted = babyparse.unparse(j);
      break;

    default:
      // Unexcepted target type
      return null;
  }

  // Convert charset
  if (converted) {
    var CHARSETS = ['utf8', 'gbk'];
    if (CHARSETS.indexOf(charset) < 0) {
      charset = CHARSETS[0];
    }

    if (charset != CHARSETS[0]) {
      converted = iconv.encode(converted, charset);
    }
  }

  return converted;
};

/**
 * Convert a DB result to Select Option data.
 *
 * @param  {Object[]}                 data
 * @param  {String}                   valueField
 * @param  {String|String[]|Function} nameField
 * @return {Object}
 */
var dbResToSelectOptions = toolkit.dbResToSelectOptions = function dbResToSelectOptions(data, valueField, nameField) {
  var selectOptions = [];

  for (var i = 0; i < data.length; i++) {
    var d = data[i];

    var value = d[valueField];
    var name  = null;

    if ('string' === typeof nameField) {
      name = d[nameField];
    } else if ('function' === typeof nameField) {
      name = nameField(d);
    } else {
      name = value;
    }

    selectOptions.push({
      value: value,
      name : name,
    });
  }

  return selectOptions;
};

/**
 * Create a fake Express.js req.locals/app.locals object for testing or other usage.
 * @return {Object}
 */
var createFakeLocals = toolkit.createFakeLocals = function createFakeLocals(fakeTraceId) {
  var fakeTraceId = fakeTraceId || 'TRACE-' + toolkit.genRandString(4).toUpperCase();

  return {
    traceId     : fakeTraceId,
    traceIdShort: fakeTraceId,
    clientId    : '00000000',
    requestType : 'api',
  };
};

/**
 * Create a fake Express.js Request object for testing or other usage.
 * @return {Object}
 */
var createFakeReq = toolkit.createFakeReq = function createFakeReq() {
  return {ip: '<NON REQ>'};
};

/**
 * Check is from WeChat
 * @return {Boolean}
 */
var isWeChatBrowser = toolkit.isWeChatBrowser = function isWeChatBrowser(req) {
  var ua = req.get('User-Agent');
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
      if (toBoolean(operand)) {
        return toolkit.isNullOrUndefined(value);
      } else {
        return !toolkit.isNullOrUndefined(value);
      }

    case 'isnotnull':
      if (toBoolean(operand)) {
        return !toolkit.isNullOrUndefined(value);
      } else {
        return toolkit.isNullOrUndefined(value);
      }

    case 'isempty':
      if (toBoolean(operand)) {
        return toolkit.isNullOrWhiteSpace(value);
      } else {
        return !toolkit.isNullOrWhiteSpace(value);
      }

    case 'isnotempty':
      if (toBoolean(operand)) {
        return !toolkit.isNullOrWhiteSpace(value);
      } else {
        return toolkit.isNullOrWhiteSpace(value);
      }

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

/**
 * Convert volumn string to byte size
 * @param  {String} s
 * @return {Integer}
 */
var toBytes = toolkit.toBytes = function toBytes(s) {
  var byteSize = parseInt(s);

  var m = `${s}`.match(/(k|kb|m|mb|g|gb)$/gi);
  if (m) {
    var unit = m[0].toLowerCase();
    switch(unit) {
      case 'k':
      case 'kb':
        byteSize *= 1024;
        break;

      case 'm':
      case 'mb':
        byteSize *= 1024 * 1024;
        break;

      case 'g':
      case 'gb':
        byteSize *= 1024 * 1024 * 1024;
        break;
    }
  }

  return byteSize;
};

/**
 * Convert text to Markdown text block with trailing space for line breaking
 * @param  {String} s
 * @return {String}
 */

var toMarkdownTextBlock = toolkit.toMarkdownTextBlock = function toMarkdownTextBlock(s) {
  if (toolkit.isNothing(s)) return '';
  return s.split('\n').join('  \n');
}

/**
 * Convert text to HTML text block with <br> for line breaking
 * @param  {String} s
 * @return {String}
 */

var toHTMLTextBlock = toolkit.toHTMLTextBlock = function toHTMLTextBlock(s) {
  if (toolkit.isNothing(s)) return '';
  return s.split('\n').join('<br>');
}

var asNumberArr = toolkit.asNumberArr = function asNumberArr(arr) {
  return arr.map(function(x) {
    return parseFloat(x);
  });
};

var mathMin = toolkit.mathMin = function mathMin(arr) {
  return Math.min.apply(null, asNumberArr(arr));
};
var mathMax = toolkit.mathMax = function mathMax(arr) {
  return Math.max.apply(null, asNumberArr(arr));
};
var mathAvg = toolkit.mathAvg = function mathAvg(arr) {
  return asNumberArr(arr).reduce(function(acc, x) {
    return acc + x;
  }) / arr.length;
};
var mathMedian = toolkit.mathMedian = function mathMedian(arr) {
  arr = asNumberArr(arr).sort(function(a, b) {
    return a - b;
  });
  if (arr.length % 2 == 0) {
    return (arr[arr.length / 2 - 1] + arr[arr.length / 2]) / 2;
  } else {
    return arr[Math.floor(arr.length / 2)];
  }
};
var mathPercentile = toolkit.mathPercentile = function mathPercentile(arr, p) {
  arr = asNumberArr(arr).sort(function(a, b) {
    return a - b;
  });

  var L = arr.length * p / 100;
  var pos = Math.floor(L);
  var extra = L - pos;
  var n1 = arr[pos - 1];
  var n2 = arr[pos];

  return n1 + (n2 - n1) * extra;
};

var toShortUnixTimestamp = toolkit.toShortUnixTimestamp = function toShortUnixTimestamp(t) {
  return t - SHORT_UNIX_TIMESTAMP_OFFSET;
};
var fromShortUnixTimestamp = toolkit.fromShortUnixTimestamp = function fromShortUnixTimestamp(t) {
  return t + SHORT_UNIX_TIMESTAMP_OFFSET;
};

var stringSimilar = toolkit.stringSimilar = function stringSimilar(s, t, f) {
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
};

var parseKVString = toolkit.parseKVString = function parseKVString(s) {
  let parsed = {};

  let tokens = s.split(/,(?=(?:[^"]|"[^"]*")*$)/);

  let i = 0;
  while (i < tokens.length) {
    let param = /(\w+)=["]?([^"]*)["]?$/.exec(tokens[i]);
    if (param) {
      parsed[param[1]] = param[2];
    }

    i++;
  }

  return parsed;
};

var waitFor = toolkit.waitFor = function waitFor(test, callback) {
  async.until(test, function(asyncCallback) {
    setTimeout(function() {
      asyncCallback();
    }, 500);
  },
  function() {
    return callback();
  });
};

/**
 * @constructor
 */
var LimitedBuffer = function(limit) {
  this._data = [];
  this.limit = limit || 0;
};

/**
 * Get something from buffer
 *
 * @return {Any}
 */
LimitedBuffer.prototype.get = function() {
  return this._data.shift();
};

/**
 * Put something into buffer
 *
 * @param  {Any} things
 * @return {Any}
 */
LimitedBuffer.prototype.put = function() {
  var self = this;

  var args = Array.prototype.slice.call(arguments);
  args.forEach(function(arg) {
    if (self.limit > 0 && self._data.length >= self.limit) return;

    self._data.push(arg);
  });

  return self;
};

/**
 * List all things in buffer
 *
 * @return {Any}
 */
LimitedBuffer.prototype.list = function() {
  return this._data;
};

Object.defineProperty(LimitedBuffer.prototype, 'length', {
  get: function() {
    return this._data.length;
  }
});

toolkit.LimitedBuffer = LimitedBuffer;
toolkit.createLimitedBuffer = function(limit) {
  return new LimitedBuffer(limit);
};

var createGitHandler = toolkit.createGitHandler = function(baseDir, timeout) {
  fs.ensureDirSync(baseDir);

  var git = simpleGit({
    baseDir: baseDir,
    timeout: { block: 15 * 1000 },
  });

  return git;
};

var safeReadFileSync = toolkit.safeReadFileSync = function(filePath, type) {
  if (!filePath) {
    console.log(`No filePath specified`);
    return null;
  }

  var data = '';
  try {
    data = fs.readFileSync(filePath).toString();
  } catch(err) {
    console.log(`Reading ${filePath} failed. Origin error:\n${err.toString()}`);
    return null;
  }

  try {
    switch(type) {
      case 'json':
        data = JSON.parse(data);
        break;

      case 'yaml':
        data = yaml.load(data);
        break;

      default:
        if ('string' === typeof data) {
          data = data.trim();
        }
        break;
    }

  } catch(err) {
    console.log(`Parsing ${filePath} as ${type} failed. Origin error:\n${err.toString()}`);
    return null;
  }

  return data;
};

var maskAuthURL = toolkit.maskAuthURL = function(s) {
  try {
    return s.replace(RE_HTTP_BASIC_AUTH_MASK, RE_HTTP_BASIC_AUTH_MASK_REPLACE);
  } catch(err) {
    return s;
  }
};

var maskConfig = toolkit.maskConfig = function(j) {
  var masked = {};
  for (var k in j) {
    masked[k] = j[k];

    for (var i = 0; i < CONFIG_AUTH_FIELD_KEYWORDS.length; i++) {
      var kw = CONFIG_AUTH_FIELD_KEYWORDS[i].toLowerCase();
      if (k.toLowerCase().indexOf(kw) >= 0) {
        masked[k] = '*****';
        break;
      }
    }
  }

  return masked;
};

var childProcessSpawn = toolkit.childProcessSpawn = function(cmd, cmdArgs, cmdOpt, callback) {
  cmdOpt = cmdOpt || {};

  var _p = childProcess.spawn(cmd, cmdArgs, cmdOpt);

  var cmdOut = '';
  if (_p.stdout) {
    _p.stdout.setEncoding('utf8');
    _p.stdout.on('data', function(chunk) {
      cmdOut += chunk;
    });
  }

  var cmdErr = '';
  if (_p.stderr) {
    _p.stderr.setEncoding('utf8');
    _p.stderr.on('data', function(chunk) {
      cmdErr += chunk;
    });
  }

  _p.on('error', function(err) {
    return callback(err);
  });
  _p.on('exit', function(code) {
    if (code > 0) {
      return callback(new Error(cmdErr || cmdOut || `Command [${cmd}] exited with code [${code}]`));
    }

    return callback(null, cmdOut);
  });
};
