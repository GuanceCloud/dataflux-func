'use strict';

/* Builtin Modules */
var fs   = require('fs-extra');
var path = require('path');

/* 3rd-party Modules */
var yaml    = require('js-yaml');
var request = require('request');

/* Project Modules */
var toolkit = require('./toolkit');

var FILE_CACHE = {};
var CONFIG_KEY = 'CONFIG';

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
  var configObj = loadFile(CONFIG_KEY, configFilePath);

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

      case 'string':
        if (toolkit.endsWith(k, '_LIST')) {
          configTypeMap[k] = 'list';

        } else if (toolkit.endsWith(k, '_MAP')) {
          configTypeMap[k] = 'map';

        } else {
          configTypeMap[k] = 'string';
        }
        break;

      case 'boolean':
        configTypeMap[k] = 'boolean';
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
      var userConfigObj     = yaml.load(userConfigContent);

      Object.assign(configObj, userConfigObj)

      console.log(toolkit.strf('[YAML Resource] Config Overrided by: `{0}`', userConfigPath));
    }
  }

  // User config from env
  for (var k in process.env) {
    if (k in configObj) {
      configObj[k] = process.env[k];
      console.log(toolkit.strf('[YAML Resource] Config item `{0}` Overrided by env.', k));

    } else if (toolkit.startsWith(k, 'CUSTOM_')) {
      console.log(toolkit.strf('[YAML Resource] Custom config item `{0}` added by env.', k));
    }
  }

  // Convert config value type
  for (var k in configObj) {
    var type = configTypeMap[k];

    if (!type) continue;
    if (configObj[k] === null) continue;

    switch(type) {
      case 'integer':
        configObj[k] = parseInt(configObj[k]);
        break;

      case 'float':
        configObj[k] = parseFloat(configObj[k]);
        break;

      case 'list':
        configObj[k] = configObj[k].toString();
        if (configObj[k].length > 0) {
          configObj[k] = configObj[k].split(',');
        } else {
          configObj[k] = [];
        }
        break;

      case 'map':
        var itemMap = {};
        configObj[k].split(',').forEach(function(item) {
          var itemParts = item.split('=');
          var itemK = itemParts[0];
          var itemV = itemParts[1] || '';
          itemMap[itemK] = itemV;
        });
        configObj[k] = itemMap;
        break;

      case 'string':
        configObj[k] = configObj[k].toString();
        break;

      case 'boolean':
        configObj[k] = toolkit.toBoolean(configObj[k]);
        break;
    }
  }

  if (CONFIG_KEY in FILE_CACHE) {
    Object.assign(FILE_CACHE[CONFIG_KEY], configObj);
  } else {
    FILE_CACHE[CONFIG_KEY] = configObj;
  }

  return callback(null, configObj);
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
}
