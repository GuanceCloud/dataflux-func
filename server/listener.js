'use strict';

/* Builtin Modules */

/* 3rd-party Modules */
var async = require('async');
var mqtt  = require('mqtt');
var redis = require('redis');

/* Project Modules */
var toolkit = require('./utils/toolkit');

/* Load YAML resources */
var yamlResources = require('./utils/yamlResources');

var CONFIG = null;

var CLIENT_RECREAT_INTERVAL = 3 * 1000;
var CLIENT_MAP = {};

DATA_SOURCE_CREATE_CLIENT_FUNC_MAP = {
  mqtt: function(id, config, callback) {

  },
  redis: function(id, config, callback) {

  },
};

// Load extra YAML resources
yamlResources.loadConfig(path.join(__dirname, '../config.yaml'), function(err, _config, _userConfig) {
  if (err) throw err;

  CONFIG = _config;

  console.log('Start listener...')
  runListener();
});

function runListener() {
  // 定期检查
  function clientCreater() {

  };
  var clientCreater = setInterval(clientCreater, CLIENT_RECREAT_INTERVAL);
};

