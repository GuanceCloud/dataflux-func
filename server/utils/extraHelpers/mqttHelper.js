'use strict';

/* 3rd-part Modules */
var mqtt = require('mqtt');

/* Project Modules */
var CONFIG    = require('../yamlResources').get('CONFIG');
var toolkit   = require('../toolkit');
var logHelper = require('../logHelper');

var getConfig = function(c) {
  return {
    host           : c.host,
    port           : c.port,
    username       : c.username,
    password       : c.password,
    clientId       : c.clientId || (CONFIG.APP_NAME + '@' + toolkit.genTimeSerialSeq()),
    protocolId     : 'MQTT',
    protocolVersion: 5,
    clean          : false,
    resubscribe    : true,
  };
};

/**
 * @constructor
 * @param  {Object}          [logger=null]
 * @param  {Object}          [config=null]
 * @param  {String|String[]} [subTopics=null]
 * @return {Object} - MQTT Helper
 */
var MQTTHelper = function(logger, config, subTopics) {
  var self = this;

  self.logger = logger || logHelper.createHelper();

  self.config = toolkit.noNullOrWhiteSpace(config);
  self.client = mqtt.connect(getConfig(self.config));

  self.subTopics = [];
  self.handlers  = [];

  self.client.on('connect', function() {
    self.logger.debug('[MQTT] Connected');

    self.sub(subTopics);
  });
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

  this.logger.debug(`[MQTT] Publish message to ${topic}`);

  return this.client.publish(topic, message, options, callback);
};

/**
 * Subscribe from topic
 *
 * @param  {String|String[]} topic
 * @param  {Object}          options
 * @param  {Integer}         [options.qos=0]
 * @param  {Function}        callback
 * @return {undefined}
 */
MQTTHelper.prototype.sub = function(topic, options, callback) {
  callback = toolkit.ensureFn(callback);

  var self = this;

  var subTopics = toolkit.asArray(topic);
  subTopics = subTopics.map(function(t) {
    return t.trim();
  });
  subTopics = subTopics.filter(function(t) {
    return !toolkit.isNothing(t) && self.subTopics.indexOf(t) < 0;
  });

  if (toolkit.isNothing(subTopics)) return callback();

  self.subTopics = self.subTopics.concat(subTopics);

  options = options || {};
  options.qos = options.qos || 0;

  self.logger.debug(`[MQTT] Subscribe topic ${subTopics.join(', ')} on Qos=${options.qos}`);

  self.client.subscribe(subTopics, options, function(err, granted) {
    if (err) {
      self.logger.logError(err);
      return callback(err);
    }

    granted.forEach(function(g) {
      self.logger.info(`[MQTT] Subscribed topic ${g.topic} on Qos=${g.qos}`);
    });

    return callback();
  });
};

/**
 * Handle message
 * @param  {Function} handler
 * @return {undefined}
 */
MQTTHelper.prototype.handle = function(handler) {
  var self = this;

  if ('function' !== typeof handler) {
    return self.logger.error(`[MQTT] Handler is not a function, got ${typeof handler}`);
  }
  if (self.handlers.indexOf(handler) >= 0) {
    return self.logger.debug(`[MQTT] Already added handler, skip...`);
  }

  self.logger.debug(`[MQTT] Add handler`);

  self.handlers.push(handler);

  self.client.on('message', function(topic, message, packet) {
    self.logger.debug(`[MQTT] Received message from ${topic}`);

    return handler(topic, message, packet);
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
  callback = toolkit.ensureFn(callback);

  if (toolkit.isNothing(topic)) return callback();

  var topicStr = Array.isArray(topic) ? topic.join(',') : topic;
  this.logger.info(`[MQTT] Unsubscribe topic ${topicStr}`);

  this.client.unsubscribe(topic, callback);
};

/**
 * Unsubscribe all topics
 *
 * @param  {Function}  callback
 * @return {undefined}
 */
MQTTHelper.prototype.unsubAll = function(callback) {
  callback = toolkit.ensureFn(callback);

  if (toolkit.isNothing(this.subTopics)) return callback();

  var topicStr = this.subTopics.join(',');
  this.logger.info(`[MQTT] Unsubscribe ALL topic ${topicStr}`);

  this.client.unsubscribe(this.subTopics, callback);
};

/**
 * End client
 * @param  {Function} callback
 * @return {Undefined}
 */
MQTTHelper.prototype.end = function(callback) {
  var self = this;

  self.logger.info(`[MQTT] End`);

  self.client.unsubscribe(self.subTopics, function() {
    self.client.end(false, callback);
  });
};

exports.MQTTHelper = MQTTHelper;
exports.createHelper = function(logger, config, subTopics) {
  return new MQTTHelper(logger, config, subTopics);
};
