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
    clientId       : c.clientId || `${CONFIG.APP_NAME}@${toolkit.genTimeSerialSeq()}`,
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

  // PUB-SUB 消息处理
  self.topicHandlerMap = {};
  self.subBuffer = toolkit.createLimitedBuffer(CONFIG._SUB_BUFFER_LIMIT);

  self.client.on('message', function(_topic, _message, _packet) {
    var handler = null;
    for (var matchTopic in self.topicHandlerMap) {
      if (!mqttWildcard(_topic, matchTopic)) continue;

      handler = self.topicHandlerMap[matchTopic];
      break;
    }

    if (!handler) return;

    if (!self.skipLog) {
      self.logger.debug('[MQTT] Receive <- Topic: `{0}`, Length: {1}', _topic, _message.length);
    }

    // 进入缓冲区
    var task = {
      handlerKey: matchTopic,
      topic     : _topic,
      message   : _message,
    }
    self.subBuffer.put(task);
  });

  self.client.on('error', function(err) {
    self.logger.error('[MQTT] Error: `{0}`', err.toString());
  });

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

  this.logger.debug('[MQTT] Pub -> `{0}`', topic);

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
  if (!this.skipLog) {
    this.logger.debug('[MQTT] Sub `{0}`', topic);
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

  this.topicHandlerMap[matchTopic] = handler;

  return this.client.subscribe(topic, callback);
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
    this.logger.debug('[MQTT] Unsub `{0}`', topic);
  }

  delete this.topicHandlerMap[topic];

  this.client.unsubscribe(topic, callback);
};

/**
 * Consume message from buffer
 *
 * @param  {Function}  callback
 * @return {undefined}
 */
MQTTHelper.prototype.consume = function(callback) {
  for (var i = 0; i < this.subBuffer.length; i++) {
    var task = this.subBuffer.get();
    if (!task) return callback();

    var handler = this.topicHandlerMap[task.handlerKey];
    if (!handler) continue;

    return handler(task.topic, task.message, null, function(err, funcResult) {
      var handleInfo = {
        message   : task.message,
        funcResult: funcResult,
        error     : err,
      }
      return callback(null, handleInfo);
    });
  }

  return callback();
};

/**
 * End client
 * @param  {Function} callback
 * @return {Undefined}
 */
MQTTHelper.prototype.end = function() {
  this.logger.info(`[MQTT] End`);

  if (this.client) {
    this.client.end(true);
  }
  this.client = null;
};

exports.MQTTHelper = MQTTHelper;
exports.createHelper = function(logger, config, topics) {
  return new MQTTHelper(logger, config, topics);
};
