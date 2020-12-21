'use strict';

/* 3rd-party Modules */
var socketIO     = require('socket.io');
var redis        = require('redis');
var redisAdapter = require('socket.io-redis');

/* Project Modules */
var CONFIG    = require('../yamlResources').get('CONFIG');
var toolkit   = require('../toolkit');
var logHelper = require('../logHelper');

function retryStrategy(options) {
    if (options.error) {
      console.error(options.error.toString());

      if (options.error.code === 'ECONNREFUSED') {
          return new Error('The Redis refused the connection');
      }
    }

    return Math.min(options.attempt * 100, 3000);
}

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
  this.logger = logger || logHelper.createHelper();

  if (config) {
    this.config = toolkit.noNullOrWhiteSpace(config);
    this.config.retry_strategy = retryStrategy;

    this.subClient = redis.createClient(this.config);
    this.pubClient = redis.createClient(this.config);

  } else {
    if (!SUB_CLIENT || !PUB_CLIENT) {
      CLIENT_CONFIG = toolkit.noNullOrWhiteSpace({
        host    : CONFIG.REDIS_HOST,
        port    : CONFIG.REDIS_PORT,
        db      : CONFIG.REDIS_DATABASE,
        password: CONFIG.REDIS_PASSWORD,
      });
      CLIENT_CONFIG.retry_strategy = retryStrategy;

      SUB_CLIENT = redis.createClient(CLIENT_CONFIG);
      PUB_CLIENT = redis.createClient(CLIENT_CONFIG);
    }

    this.config = CLIENT_CONFIG;
    this.subClient = SUB_CLIENT;
    this.pubClient = PUB_CLIENT;
  }

  this.server = socketIO(server);
  this.adapter = redisAdapter({
    pubClient: this.pubClient,
    subClient: this.subClient,
  });
  this.server.adapter(this.adapter);
};

exports.SocketIOServerHelper = SocketIOServerHelper;
exports.createHelper = function(server, logger, config) {
  return new SocketIOServerHelper(server, logger, config);
};
