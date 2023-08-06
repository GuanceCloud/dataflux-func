'use strict';

/* 3rd-party Modules */
var socketIO     = require('socket.io');
var redis        = require('redis');
var redisAdapter = require('@socket.io/redis-adapter');

/* Project Modules */
var CONFIG      = require('../yamlResources').get('CONFIG');
var toolkit     = require('../toolkit');
var logHelper   = require('../logHelper');
var redisHelper = require('./redisHelper');

/* Singleton Client */
var CLIENT_CONFIG  = null;
var SUB_CLIENT     = null;
var PUB_CLIENT     = null;
var DEFAULT_LOGGER = logHelper.createHelper(null, null, 'DEFAULT_SOCKETIO_CLIENT');

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
    var _retryStrategy = config.disableRetry ? null : self.retryStrategy;

    self.config = toolkit.noNullOrWhiteSpace(config);

    self.subClient = redis.createClient(redisHelper.getConfig(self.config, _retryStrategy));
    self.pubClient = redis.createClient(redisHelper.getConfig(self.config, _retryStrategy));

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
        user    : CONFIG.REDIS_USER,
        password: CONFIG.REDIS_PASSWORD,
        useTLS  : CONFIG.REDIS_USE_TLS,
        authType: CONFIG.REDIS_AUTH_TYPE,
      });

      SUB_CLIENT = redis.createClient(redisHelper.getConfig(CLIENT_CONFIG, self.retryStrategy));
      PUB_CLIENT = redis.createClient(redisHelper.getConfig(CLIENT_CONFIG, self.retryStrategy));

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

  var options = {};
  if (CONFIG.MODE === 'dev') {
    options.cors = {};
  }
  self.server = new socketIO.Server(server, options);
  self.server.adapter(redisAdapter.createAdapter(self.pubClient, self.subClient));
};

exports.SocketIOServerHelper = SocketIOServerHelper;
exports.createHelper = function(server, logger, config) {
  return new SocketIOServerHelper(server, logger, config);
};
