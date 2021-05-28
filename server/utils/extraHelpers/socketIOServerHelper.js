'use strict';

/* 3rd-party Modules */
var socketIO     = require('socket.io');
var redis        = require('redis');
var redisAdapter = require('socket.io-redis');

/* Project Modules */
var CONFIG    = require('../yamlResources').get('CONFIG');
var toolkit   = require('../toolkit');
var logHelper = require('../logHelper');

function getConfig(c, retryStrategy) {
  var c = {
    host    : c.host,
    port    : c.port,
    db      : c.db || c.database || 0,
    password: c.password || undefined,
  };

  if (retryStrategy) {
    c.retry_strategy = retryStrategy;
  }

  return c;
};

/* Singleton Client */
var CLIENT_CONFIG = null;
var SUB_CLIENT    = null;
var PUB_CLIENT    = null;

/**
 * @constructor
 * @param  {Object} server
 * @param  {Object} [logger=null]
 * @param  {Object} [config=null]
 * @return {Object} - SocketIO Helper
 */
var SocketIOServerHelper = function(server, logger, config) {
  var self = this;

  self.logger = logger || logHelper.createHelper();

  self.retryStrategy = function(options) {
    self.logger.warning('[SOCKET IO] Reconnect...');
    return Math.min(options.attempt * 100, 3000);
  };

  if (config) {
    var _retryStrategy = config.disableRetry
                       ? null
                       : self.retryStrategy;

    self.config = toolkit.noNullOrWhiteSpace(config);

    self.subClient = redis.createClient(getConfig(self.config, _retryStrategy));
    self.pubClient = redis.createClient(getConfig(self.config, _retryStrategy));

    self.subClient.on('error', function(err) {
      self.logger.error('[SOCKET IO] Error: `{0}` (in SubClient)', err.toString());

      if ('function' === typeof config.errorCallback) {
        config.errorCallback(err);
      }
    });
    self.pubClient.on('error', function(err) {
      self.logger.error('[SOCKET IO] Error: `{0}` (in PubClient)', err.toString());

      if ('function' === typeof config.errorCallback) {
        config.errorCallback(err);
      }
    });

  } else {
    if (!SUB_CLIENT || !PUB_CLIENT) {
      CLIENT_CONFIG = toolkit.noNullOrWhiteSpace({
        host    : CONFIG.REDIS_HOST,
        port    : CONFIG.REDIS_PORT,
        db      : CONFIG.REDIS_DATABASE,
        password: CONFIG.REDIS_PASSWORD,
      });

      SUB_CLIENT = redis.createClient(getConfig(CLIENT_CONFIG, self.retryStrategy));
      PUB_CLIENT = redis.createClient(getConfig(CLIENT_CONFIG, self.retryStrategy));

      // Error handling
      SUB_CLIENT.on('error', function(err) {
        DEFAULT_LOGGER.error('[SOCKET IO] Error: `{0}` (in SubClient)', err.toString());
      });
      PUB_CLIENT.on('error', function(err) {
        DEFAULT_LOGGER.error('[SOCKET IO] Error: `{0}` (in PubClient)', err.toString());
      });
    }

    self.config = CLIENT_CONFIG;
    self.subClient = SUB_CLIENT;
    self.pubClient = PUB_CLIENT;
  }

  self.server = socketIO(server);
  self.adapter = redisAdapter({
    pubClient: self.pubClient,
    subClient: self.subClient,
  });
  self.server.adapter(self.adapter);
};

exports.SocketIOServerHelper = SocketIOServerHelper;
exports.createHelper = function(server, logger, config) {
  return new SocketIOServerHelper(server, logger, config);
};
