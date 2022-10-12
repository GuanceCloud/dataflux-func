'use strict';

/* 3rd-part Modules */
var kafka = require('node-rdkafka');

/* Project Modules */
var CONFIG    = require('../yamlResources').get('CONFIG');
var toolkit   = require('../toolkit');
var logHelper = require('../logHelper');

function getConfig(c, groupId) {
  var config = {
    'client.id'           : c.clientId || `${CONFIG.APP_NAME}@${toolkit.genTimeSerialSeq()}`,
    'metadata.broker.list': c.servers,
  };

  if (groupId) {
    config['group.id'] = groupId || `${CONFIG.APP_NAME}@${toolkit.genTimeSerialSeq()}`;
  }

  if (c.password) {
    config['sasl.mechanisms'] = 'PLAIN';
    config['sasl.username']   = c.user || c.username;
    config['sasl.password']   = c.password;
  }

  return config;
};

/**
 * @constructor
 * @param  {Object} [logger=null]
 * @param  {Object} [config=null]
 * @return {Object} - Kafka Helper
 */
var KafkaHelper = function(logger, config) {
  var self = this;

  self.logger = logger || logHelper.createHelper();

  self.config = toolkit.noNullOrWhiteSpace(config);

  if (!config.disablePub) {
    self.producer = new kafka.HighLevelProducer(getConfig(self.config))
    self.producer.connect();
  }

  if (!config.disableSub) {
    self.consumer = new kafka.KafkaConsumer(getConfig(self.config, true))
    self.consumer.connect();

    // PUB-SUB 消息处理
    self.topicHandlerMap = {};
    self.isReady = false;

    self.consumer.on('ready', function() {
      self.isReady = true;

      if (self.consumerT) {
        clearInterval(self.consumerT);
      }

      if (CONFIG._SUB_KAFKA_COMSUME_RATE_PER_SECOND > 0) {
        self.consumerT = setInterval(function() {
          var consumeCount = Math.ceil(CONFIG._SUB_KAFKA_COMSUME_INTERVAL * CONFIG._SUB_KAFKA_COMSUME_RATE_PER_SECOND);
          self.consumer.consume(consumeCount);
        }, CONFIG._SUB_KAFKA_COMSUME_INTERVAL * 1000);
      }
    }).on('data', function(_packet) {
      var _topic   = _packet.topic;
      var _message = _packet.value.toString();

      var handler = self.topicHandlerMap[_topic];
      if (!handler) return;

      if (!self.skipLog) {
        self.logger.debug('[KAFKA] Receive <- `{0}`, Length: {1}', _topic, _message.length);
      }

      return handler(_topic, _message);
    })
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
KafkaHelper.prototype.pub = function(topic, message, options, callback) {
  var self = this;

  self.logger.debug('[KAFKA] Pub -> `{0}`', topic);

  options = options || {};

  var partition = options.partition || null;
  var key       = options.key || null;
  var timestamp = options.timestamp || Date.now();

  message = Buffer.from(message);

  toolkit.waitFor(function() { return self.isReady }, function() {
    self.producer.produce(topic, partition, message, key, timestamp, callback);
  });
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
KafkaHelper.prototype.sub = function(topic, handler, callback) {
  var self = this;

  toolkit.waitFor(function() { return self.isReady }, function() {
    if (!self.skipLog) {
      self.logger.debug('[KAFKA] Sub `{0}`', topic);
    }

    if (Object.keys(self.topicHandlerMap).length > 0) {
      self.consumer.unsubscribe();
    }

    self.topicHandlerMap[topic] = handler;
    self.consumer.subscribe(Object.keys(self.topicHandlerMap));

    return callback && callback();
  });
};

/**
 * Unsubscribe from topic
 *
 * @param  {String}   topic
 * @param  {Function} callback
 * @return {undefined}
 */
KafkaHelper.prototype.unsub = function(topic, callback) {
  var self = this;

  toolkit.waitFor(function() { return self.isReady }, function() {
    if (!self.skipLog) {
      self.logger.debug('[KAFKA] Unsub `{0}`', topic);
    }

    delete self.topicHandlerMap[topic];
    self.consumer.unsubscribe();
    self.consumer.subscribe(Object.keys(self.topicHandlerMap));

    return callback && callback();
  });
};

/**
 * End client
 * @param  {Function} callback
 * @return {Undefined}
 */
KafkaHelper.prototype.end = function() {
  this.logger.info(`[KAFKA] End`);

  if (self.consumerT) {
    clearInterval(self.consumerT);
  }

  if (this.producer) {
    this.producer.disconnect();
  }
  this.producer = null;

  if (this.consumer) {
    this.consumer.disconnect()
  }
  this.consumer = null;
  this.topicHandlerMap = {};
};

exports.KafkaHelper = KafkaHelper;
exports.createHelper = function(logger, config, topics) {
  return new KafkaHelper(logger, config, topics);
};
