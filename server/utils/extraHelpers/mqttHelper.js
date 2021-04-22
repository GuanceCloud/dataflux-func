'use strict';

/* 3rd-part Modules */
var mqtt         = require('mqtt');
var mqttWildcard = require('mqtt-wildcard');

/* Project Modules */
var CONFIG    = require('../yamlResources').get('CONFIG');
var toolkit   = require('../toolkit');
var logHelper = require('../logHelper');

function getConfig(c) {
  return {
    host           : c.host,
    port           : c.port,
    username       : c.user || c.username,
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
 * @param  {Object} [logger=null]
 * @param  {Object} [config=null]
 * @return {Object} - MQTT Helper
 */
var MQTTHelper = function(logger, config) {
  var self = this;

  self.logger = logger || logHelper.createHelper();

  self.config = toolkit.noNullOrWhiteSpace(config);
  self.client = mqtt.connect(getConfig(self.config));

  self.client.on('offline', function() {
    self.client.reconnect();
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
 * @param  {String}   topic
 * @param  {Object}   options
 * @param  {Integer}  [options.qos=0]
 * @param  {Function} callback
 * @return {undefined}
 */
MQTTHelper.prototype.sub = function(topic, handler, callback) {
  var self = this;

  if (!this.skipLog) {
    self.logger && self.logger.debug('{0} {1} [{2}]',
      '[MQTT]',
      'SUB',
      topic
    );
  }

  var matchTopic = topic.trim();

  // MQTTv5 共享订阅
  if (toolkit.startsWith(matchTopic, '$share/')) {
    matchTopic = matchTopic.replace(/^\$share\/\w+\//, '');
  }
  // EMQX 共享订阅
  if (toolkit.startsWith(matchTopic, '$queue/')) {
    matchTopic = matchTopic.replace(/^\$queue\//, '');
  }

  self.client.subscribe(topic, function(err) {
    if (err) return callback && callback(err);

    self.client.on('message', function(_topic, _message, _packet) {
      if (!mqttWildcard(_topic, matchTopic)) return;

      if (!self.skipLog) {
        self.logger && self.logger.debug('{0} [{1}] -> `{2}`',
          '[MQTT]',
          _topic,
          _message
        );
      }

      return handler(_topic, _message, _packet);
    });
  });
};

/**
 * Unsubscribe from topic
 *
 * @param  {String}   topic
 * @param  {Function} callback
 * @return {undefined}
 */
MQTTHelper.prototype.unsub = function(topic, callback) {
  if (!this.skipLog) {
    this.logger && this.logger.debug('{0} {1} `{2}` -> <MESSAGE>',
      '[MQTT]',
      'UNSUB',
      topic
    );
  }

  this.client.unsubscribe(topic, callback);
};

/**
 * End client
 * @param  {Function} callback
 * @return {Undefined}
 */
MQTTHelper.prototype.end = function(callback) {
  this.logger.info(`[MQTT] End`);

  this.client.end(true, callback);
};

exports.MQTTHelper = MQTTHelper;
exports.createHelper = function(logger, config, topics) {
  return new MQTTHelper(logger, config, topics);
};
