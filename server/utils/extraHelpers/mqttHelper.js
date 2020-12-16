'use strict';

/* 3rd-part Modules */
var mqtt = require('mqtt');

/* Project Modules */
var CONFIG    = require('../yamlResources').get('CONFIG');
var toolkit   = require('../toolkit');
var logHelper = require('../logHelper');

var getConfig = function(c) {
  return {
    clientId       : CONFIG.APP_NAME,
    protocolId     : 'MQTT',
    protocolVersion: 4,
    clean          : false,
    resubscribe    : true,
    username       : c.username,
    password       : c.password,
  };
};

/* Singleton Client */
var CLIENT_CONFIG = null;
var CLIENT        = null;

/**
 * @constructor
 * @param  {Object} [logger=null]
 * @param  {Object} [config=null]
 * @return {Object} - MQTT Helper
 */
var MQTTHelper = function(logger, config) {
  this.logger = logger || logHelper.createHelper();

  if (config) {
    this.config = toolkit.noNullOrWhiteSpace(config);
    this.client = mqtt.connect(getConfig(this.config));

  } else {
    if (!CLIENT) {
      CLIENT_CONFIG = toolkit.noNullOrWhiteSpace({
        username: CONFIG.EMQX_FUNC_USERNAME,
        password: CONFIG.EMQX_FUNC_PASSWORD,
      });
      CLIENT = mqtt.connect(getConfig(CLIENT_CONFIG));
    }

    this.config = CLIENT_CONFIG;
    this.client = CLIENT;
  }
};

/**
 * Publish to topic
 *
 * @param  {String|String[]} topic
 * @param  {String|buffer}   message  [description]
 * @param  {Object}          options
 * @param  {Integer}         [options.qos=0]
 * @param  {Function}        callback
 * @return {undefined}
 */
MQTTHelper.prototype.pub = function(topic, message, options, callback) {
  options = options || {};
  options.qos = options.qos || 0;

  return this.client.publish(topic, message, options, callback);
};

/**
 * Subscribe from topic
 *
 * @param  {String|String[]} topic
 * @param  {Object}          options
 * @param  {Integer}         [options.qos=0]
 * @param  {Function}        handler
 * @param  {Function}        callback
 * @return {undefined}
 */
MQTTHelper.prototype.sub = function(topic, options, handler, callback) {
  var self = this;

  options = options || {};
  options.qos = options.qos || 0;

  self.client.subscribe(topic, options, function(err, granted) {
    if (err) return callback && callback(err, granted);

    self.client.on('message', function(_topic, _message, _packet) {
      return handler(_topic, _message, _packet);
    });
  });
};

/**
 * Unsubscribe from topic
 *
 * @param  {String|String[]} topic
 * @param  {Function}        callback
 * @return {undefined}
 */
MQTTHelper.prototype.unsub = function(topic, callback) {
  self.client.unsubscribe(topic, callback);
};

exports.MQTTHelper = MQTTHelper;
exports.createHelper = function(logger, config) {
  return new MQTTHelper(logger, config);
};
