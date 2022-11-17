'use strict';

/* Builtin Modules */
var fs   = require('fs-extra');
var path = require('path');

/* 3rd-party Modules */
var yaml = require('js-yaml');

/* Project Modules */
var toolkit = require('./toolkit');

var FILE_CACHE = {};

/* Configure */
var CONFIG_KEY           = 'CONFIG';
var ENV_CONFIG_PREFIX    = 'DFF_';
var CUSTOM_CONFIG_PREFIX = 'CUSTOM_';

/**
 * Load a YAML file.
 *
 * @param  {String} key - Key of file data to load
 * @param  {String} filePath - Path of YAML file to load
 * @return {Object} Loaded file data
 */
var loadFile = exports.loadFile = function loadFile(key, filePath) {
  var fileContent = fs.readFileSync(filePath);
  var obj         = yaml.load(fileContent);

  if (key in FILE_CACHE) {
    Object.assign(FILE_CACHE[key], obj);
  } else {
    FILE_CACHE[key] = obj;
  }

  return obj;
};

/**
 * Load a YAML file as config file.
 *
 * @param {String}   configFilePath - Path of config file
 * @param {Function} calback
 */
var loadConfig = exports.loadConfig = function loadConfig(configFilePath, callback) {
  var configObj     = loadFile(CONFIG_KEY, configFilePath);
  var userConfigObj = {};

  // Collect config field type map
  var configTypeMap = {};
  for (var k in configObj) {
    switch(typeof configObj[k]) {
      case 'number':
        if (configObj[k].toString().match(/^\d+$/)) {
          configTypeMap[k] = 'integer';

        } else {
          configTypeMap[k] = 'float';
        }
        break;

      case 'boolean':
        configTypeMap[k] = 'boolean';
        break;

      default:
        if (toolkit.endsWith(k, '_LIST')) {
          configTypeMap[k] = 'list';

        } else if (toolkit.endsWith(k, '_MAP')) {
          configTypeMap[k] = 'map';

        } else {
          configTypeMap[k] = 'string';
        }
        break;
    }
  }

  var userConfigPath = process.env['CONFIG_FILE_PATH'] || configObj.CONFIG_FILE_PATH;
  if (!userConfigPath) {
    // User config path NOT SET
    console.log('[YAML Resource] ENV `CONFIG_FILE_PATH` not set. Use default config.');

  } else {
    // User config from FILE
    if (!fs.existsSync(userConfigPath)) {
      console.log(toolkit.strf('[YAML Resource] Config file `{0}` not found. Use default config.', userConfigPath));

    } else {
      var userConfigContent = fs.readFileSync(userConfigPath);
      userConfigObj = yaml.load(userConfigContent);

      Object.assign(configObj, userConfigObj)

      console.log(toolkit.strf('[YAML Resource] Config Overrided by: `{0}`', userConfigPath));
    }
  }

  // User config from env
  for (var envK in process.env) {
    if (!toolkit.startsWith(envK, ENV_CONFIG_PREFIX)) continue;

    var k = envK.slice(ENV_CONFIG_PREFIX.length);
    var v = process.env[envK];

    if ('string' === typeof v && v.trim() === '') {
      continue;
    }

    if (k in configObj) {
      configObj[k] = v;
      console.log(toolkit.strf('[YAML Resource] Config item `{0}` Overrided by env.', k));

    } else if (toolkit.startsWith(k, CUSTOM_CONFIG_PREFIX)) {
      configObj[k] = v;
      console.log(toolkit.strf('[YAML Resource] Custom config item `{0}` added by env.', k));
    }
  }

  // Convert config value type
  for (var k in configObj) {
    var v = configObj[k];
    var type = configTypeMap[k];

    if (!type) continue;

    // Set
    if (v === null) {
      switch(type) {
        case 'integer':
        case 'float':
          configObj[k] = 0;
          break;

        case 'list':
          configObj[k] = [];
          break;

        case 'map':
          configObj[k] = {};
          break;

        case 'string':
          configObj[k] = '';
          break;

        case 'boolean':
          configObj[k] = false;
          break;
      }
      continue;
    }

    switch(type) {
      case 'integer':
        configObj[k] = parseInt(v);
        break;

      case 'float':
        configObj[k] = parseFloat(v);
        break;

      case 'list':
        if (Array.isArray(v)) break;

        configObj[k] = v.toString();
        if (configObj[k].length > 0) {
          configObj[k] = v.trim().split(/[, \n]+/g).map(function(x) {
            return x.trim();
          });

        } else {
          configObj[k] = [];
        }
        break;

      case 'map':
        if ('object' === typeof v) break;

        var itemMap = {};
        v.split(',').forEach(function(item) {
          var itemParts = item.split('=');
          var itemK = itemParts[0].trim();
          var itemV = (itemParts[1] || '').trim();
          itemMap[itemK] = itemV;
        });
        configObj[k] = itemMap;
        break;

      case 'string':
        configObj[k] = v.toString();
        break;

      case 'boolean':
        configObj[k] = toolkit.toBoolean(v);
        break;
    }
  }

  if (CONFIG_KEY in FILE_CACHE) {
    Object.assign(FILE_CACHE[CONFIG_KEY], configObj);
  } else {
    FILE_CACHE[CONFIG_KEY] = configObj;
  }

  return callback(null, configObj, userConfigObj);
};

/**
 * Get the loaded YAML file data.
 *
 * @param  {String} key - Key of loaded data
 * @return {Object} Loaded file data
 */
exports.get = function get(key) {
  key = key.replace('.yaml', '');
  var resource = FILE_CACHE[key] || null;

  return resource;
};

/**
 * Set the value of loaded YAML file data.
 * @param {String} key
 * @param {String} path
 * @param {Any}    value
 */
exports.set = function set(key, path, value) {
  eval(toolkit.strf('FILE_CACHE["{0}"].{1} = {2}', key, path, JSON.stringify(value)));
};

/**
 * Get all the loaded YAML file data.
 *
 * @return {Object} All loaded file data
 */
exports.getAll = function getAll() {
  return FILE_CACHE;
};
