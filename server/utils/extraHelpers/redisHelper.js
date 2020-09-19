'use strict';

/* 3rd-party Modules */
var redis = require('redis');
var async = require('async');

/* Project Modules */
var CONFIG    = require('../yamlResources').get('CONFIG');
var toolkit   = require('../toolkit');
var logHelper = require('../logHelper');

/* Lua */
var LUA_UNLOCK_KEY_KEY_NUMBER = 1;
var LUA_UNLOCK_KEY = 'if redis.call("get", KEYS[1]) == ARGV[1] then return redis.call("del", KEYS[1]) else return 0 end ';

function retryStrategy(options) {
  if (options.error) {
    console.error(options.error.toString());

    if (options.error.code === 'ECONNREFUSED') {
        return new Error('The Redis refused the connection');
    }
  }

  return Math.min(options.attempt * 100, 3000);
}

var getConfig = function(c) {
  return {
    host    : c.host,
    port    : c.port,
    db      : c.db || c.database || 0,
    password: c.password || undefined,
  };
};

/* Singleton Client */
var CLIENT_CONFIG        = null;
var CLIENT               = null;
var DEFAULT_REDIS_LOGGER = logHelper.createHelper(null, null, 'DEFAULT_REDIS_CLIENT');

/**
 * @constructor
 * @param  {Object} [logger=null]
 * @param  {Object} [config=null]
 * @return {Object} - Redis Helper
 */
var RedisHelper = function(logger, config) {
  this.logger = logger || logHelper.createHelper();

  this.isDryRun = false;
  this.skipLog  = false;

  if (config) {
    this.config = toolkit.noNullOrWhiteSpace(config);
    this.config.retry_strategy = retryStrategy;

    this.client = redis.createClient(getConfig(this.config));

  } else {
    if (!CLIENT) {
      CLIENT_CONFIG = toolkit.noNullOrWhiteSpace({
        host    : CONFIG.REDIS_HOST,
        port    : CONFIG.REDIS_PORT,
        db      : CONFIG.REDIS_DATABASE,
        password: CONFIG.REDIS_PASSWORD,
      });
      CLIENT_CONFIG.retry_strategy = retryStrategy;

      CLIENT = redis.createClient(getConfig(CLIENT_CONFIG));

      // Error handling
      CLIENT.on('error', function (err) {
        DEFAULT_REDIS_LOGGER.error(err);
      });
    }

    this.config = CLIENT_CONFIG;
    this.client = CLIENT;
  }

  this.subClient = null;
};

/**
 * Run a Redis command.
 *
 * @param  {String} command - Redis command
 * @param  {...*} arguments - Redis command arguments
 * @return {undefined}
 */
RedisHelper.prototype._run = function() {
  var args = Array.prototype.slice.call(arguments);
  var command = args.shift();

  if (!this.skipLog) {
    this.logger.debug('{0} {1} {2}',
      '[REDIS]',
      command.toUpperCase(),
      (typeof args[args.length  - 1] === 'function' ? args.slice(0, -1) : args).join(' ')
    );
  }

  return this.client[command].apply(this.client, args);
};

RedisHelper.prototype.keys = function(pattern, callback) {
  var self = this;

  var foundKeys = [];

  var COUNT_LIMIT = 1000;
  var nextCursor  = 0;
  async.doUntil(function(untilCallback) {
    self._run('scan', nextCursor, 'MATCH', pattern, 'COUNT', COUNT_LIMIT, function(err, dbRes) {
      if (err) return untilCallback(err);

      nextCursor = dbRes[0];

      var keys = dbRes[1];
      if (Array.isArray(keys) && keys.length > 0) {
        foundKeys = foundKeys.concat(keys);
      }

      return untilCallback();
    });

  }, function() {
    return parseInt(nextCursor) === 0;

  }, function(err) {
    if (err) return callback(err);

    foundKeys = toolkit.noDuplication(foundKeys);

    return callback(null, foundKeys);
  });
};

RedisHelper.prototype.exists = function(key, callback) {
  return this._run('exists', key, callback);
};

RedisHelper.prototype.get = function(key, callback) {
  return this._run('get', key, callback);
};

RedisHelper.prototype.getset = function(key, value, callback) {
  if (this.isDryRun) {
    return this._run('get', key, callback);
  } else {
    return this._run('getset', key, value, callback);
  }
};

RedisHelper.prototype.set = function(key, value, callback) {
  if (this.isDryRun) return callback(null, 'OK');
  return this._run('set', key, value, callback);
};

RedisHelper.prototype.setnx = function(key, value, callback) {
  if (this.isDryRun) return callback(null, 'OK');
  return this._run('setnx', key, value, callback);
};

RedisHelper.prototype.setex = function(key, maxAge, value, callback) {
  if (this.isDryRun) return callback(null, 'OK');
  return this._run('setex', key, maxAge, value, callback);
};

RedisHelper.prototype.setexnx = function(key, maxAge, value, callback) {
  if (this.isDryRun) return callback(null, 'OK');
  return this._run('set', key, value, 'EX', maxAge, 'NX', callback);
};

RedisHelper.prototype.incr = function(key, callback) {
  if (this.isDryRun) return callback(null, 'OK');
  return this._run('incr', key, callback);
};

RedisHelper.prototype.incrby = function(key, increment, callback) {
  if (this.isDryRun) return callback(null, 'OK');
  return this._run('incrby', key, increment, callback);
};

RedisHelper.prototype.del = function(keys, callback) {
  if (this.isDryRun) return callback(null, 'OK');
  return this._run('del', keys, callback);
};

RedisHelper.prototype.expire = function(key, expires, callback) {
  if (this.isDryRun) return callback(null, 'OK');
  return this._run('expire', key, expires, callback);
};

RedisHelper.prototype.expireat = function(key, timestamp, callback) {
  if (this.isDryRun) return callback(null, 'OK');
  return this._run('expireat', key, timestamp, callback);
};

RedisHelper.prototype.hkeys = function(key, pattern, callback) {
  var self = this;

  var foundKeys = [];

  var COUNT_LIMIT = 1000;
  var nextCursor  = 0;
  async.doUntil(function(untilCallback) {
    self._run('hscan', key, nextCursor, 'MATCH', pattern, 'COUNT', COUNT_LIMIT, function(err, dbRes) {
      if (err) return untilCallback(err);

      nextCursor = dbRes[0];

      var keys = dbRes[1];
      if (Array.isArray(keys) && keys.length > 0) {
        foundKeys = foundKeys.concat(keys);
      }

      return untilCallback();
    });

  }, function() {
    return parseInt(nextCursor) === 0;

  }, function(err) {
    if (err) return callback(err);

    foundKeys = toolkit.noDuplication(foundKeys);

    return callback(null, foundKeys);
  });
};

RedisHelper.prototype.hget = function(key, field, callback) {
  return this._run('hget', key, field, callback);
};

RedisHelper.prototype.hmget = function(key, fields, callback) {
  return this._run('hmget', key, fields, callback);
};

RedisHelper.prototype.hgetall = function(key, callback) {
  return this._run('hgetall', key, callback);
};

RedisHelper.prototype.hset = function(key, feild, value, callback) {
  if (this.isDryRun) return callback(null, 'OK');
  return this._run('hset', key, feild, value, callback);
};

RedisHelper.prototype.hsetnx = function(key, feild, value, callback) {
  if (this.isDryRun) return callback(null, 'OK');
  return this._run('hsetnx', key, feild, value, callback);
};

RedisHelper.prototype.hmset = function(key, obj, callback) {
  if (this.isDryRun) return callback(null, 'OK');
  return this._run('hmset', key, obj, callback);
};

RedisHelper.prototype.hincr = function(key, field, callback) {
  if (this.isDryRun) return callback(null, 'OK');
  return this._run('hincrby', key, field, 1, callback);
};

RedisHelper.prototype.hincrby = function(key, field, increment, callback) {
  if (this.isDryRun) return callback(null, 'OK');
  return this._run('hincrby', key, field, increment, callback);
};

RedisHelper.prototype.hdel = function(key, fields, callback) {
  if (this.isDryRun) return callback(null, 'OK');
  return this._run('hdel', key, fields, callback);
};

RedisHelper.prototype.lpush = function(key, value, callback) {
  if (this.isDryRun) return callback(null, 'OK');
  return this._run('lpush', key, value, callback);
};

RedisHelper.prototype.rpush = function(key, value, callback) {
  if (this.isDryRun) return callback(null, 'OK');
  return this._run('rpush', key, value, callback);
};

RedisHelper.prototype.lpop = function(key, callback) {
  if (this.isDryRun) return callback(null, 'OK');
  return this._run('lpop', key, callback);
};

RedisHelper.prototype.rpop = function(key, callback) {
  if (this.isDryRun) return callback(null, 'OK');
  return this._run('rpop', key, callback);
};

RedisHelper.prototype.llen = function(key, callback) {
  return this._run('llen', key, callback);
};

RedisHelper.prototype.lrange = function(key, start, stop, callback) {
  return this._run('lrange', key, start, stop, callback);
};

RedisHelper.prototype.ltrim = function(key, start, stop, callback) {
  if (this.isDryRun) return callback(null, 'OK');
  return this._run('ltrim', key, start, stop, callback);
};

RedisHelper.prototype.ttl = function(key, callback) {
  return this._run('ttl', key, callback);
};

RedisHelper.prototype.type = function(key, callback) {
  return this._run('type', key, callback);
};

RedisHelper.prototype.dbsize = function(callback) {
  return this._run('dbsize', callback);
};

RedisHelper.prototype.info = function(callback) {
  return this._run('info', callback);
};

/**
 * Get keys by pattern.
 *
 * @param  {String} pattern - Key pattern
 * @param  {Function} callback
 * @return {undefined}
 */
RedisHelper.prototype.getByPattern = function(pattern, callback) {
  var self = this;

  if (self.isDryRun) return callback();

  if (!this.skipLog) {
    this.logger.debug('{0} {1} <- {2}',
      '[REDIS]',
      '<GET BY PATTEN>',
      pattern
    );
  }

  self.keys(pattern, function(err, keys) {
    if (err) return callback && callback(err);

    if (keys.length <= 0) {
      return callback && callback();
    } else {
      return self._run('MGET', keys, function(err, cacheRes) {
        if (Array.isArray(cacheRes)) {
          var ret = {};
          for (var i = 0; i < keys.length; i++) {
            ret[keys[i]] = cacheRes[i];
          }
          return callback(null, ret);

        } else {
          return callback(null, cacheRes);
        }
      });
    }
  });
};

/**
 * Delete keys by pattern.
 *
 * @param  {String} pattern - Key pattern
 * @param  {Function} callback
 * @return {undefined}
 */
RedisHelper.prototype.delByPattern = function(pattern, callback) {
  var self = this;

  if (self.isDryRun) return callback();

  if (!this.skipLog) {
    this.logger.debug('{0} {1} <- {2}',
      '[REDIS]',
      '<DEL BY PATTEN>',
      pattern
    );
  }

  self.keys(pattern, function(err, keys) {
    if (err) return callback && callback(err);

    if (keys.length <= 0) {
      return callback && callback();
    } else {
      self.del(keys, function(err, count) {
        return callback && callback(err, count, keys);
      });
    }
  });
};

/**
 * Get hash fields by pattern.
 *
 * @param  {String} key
 * @param  {String} pattern - field pattern
 * @param  {Function} callback
 * @return {undefined}
 */
RedisHelper.prototype.hgetByPattern = function(key, pattern, callback) {
  var self = this;

  if (self.isDryRun) return callback();

  if (!this.skipLog) {
    this.logger.debug('{0} {1} <- {2}',
      '[REDIS]',
      '<HGET BY PATTEN>',
      key,
      pattern
    );
  }

  self.hkeys(key, pattern, function(err, fields) {
    if (err) return callback && callback(err);

    if (fields.length <= 0) {
      return callback && callback();
    } else {
      return self._run('HMGET', key, fields, callback);
    }
  });
};

/**
 * Delete hash fields by pattern.
 * @param  {String} key
 * @param  {String} pattern - field pattern
 * @param  {Function} callback
 * @return {undefined}
 */
RedisHelper.prototype.hdelByPattern = function(key, pattern, callback) {
  var self = this;

  if (self.isDryRun) return callback();

  if (!this.skipLog) {
    this.logger.debug('{0} {1} <- {2}',
      '[REDIS]',
      '<HDEL BY PATTEN>',
      key,
      pattern
    );
  }

  self.hkeys(key, pattern, function(err, fields) {
    if (err) return callback && callback(err);

    if (fields.length <= 0) {
      return callback && callback();
    } else {
      self.hdel(key, fields, function(err, count) {
        return callback && callback(err, count, fields);
      });
    }
  });
};

/**
 * Publish to topic
 *
 * @param  {String}        topic
 * @param  {String|buffer} message
 * @param  {Object}        options *No options for Redis.pub*
 * @param  {Function}      callback
 * @return {undefined}
 */
RedisHelper.prototype.pub = function(topic, message, options, callback) {
  var self = this;

  options = options || {};

  if (!this.skipLog) {
    this.logger.debug('{0} {1} [{2}] <- `{3}`',
      '[REDIS]',
      'PUB',
      topic,
      message.toString()
    );
  }

  return this.client.publish(topic, message, callback);
};

/**
 * Subscribe from topic
 *
 * @param  {String}    topic
 * @param  {Object}    options *No options for Redis.pub*
 * @param  {Function}  handler
 * @param  {Function}  callback
 * @return {undefined}
 */
RedisHelper.prototype.sub = function(topic, options, handler, callback) {
  var self = this;

  options = options || {};

  options.qos = options.qos || self.defaultQoS || 0;

  if (!this.skipLog) {
    self.logger && self.logger.debug('{0} {1} [{2}]',
      '[REDIS]',
      'SUB',
      topic
    );
  }

  if (!self.subClient) {
    self.subClient = self.client.duplicate();
  }

  self.subClient.psubscribe(topic, function(err) {
    if (err) return callback && callback(err);

    self.subClient.on('pmessage', function(_pattern, _topic, _message) {
      if (_pattern !== topic) return;

      if (!self.skipLog) {
        self.logger && self.logger.debug('{0} [{1}] -> `{2}`',
          '[REDIS]',
          _topic,
          _message
        );
      }

      handler(_topic, _message);

      return callback && callback();
    });
  });
};

/**
 * Unsubscribe from topic
 *
 * @param  {String}    topic
 * @param  {Function}  callback
 * @return {undefined}
 */
RedisHelper.prototype.unsub = function(topic, callback) {
  if (!this.skipLog) {
    this.logger && this.logger.debug('{0} {1} `{2}` -> <MESSAGE>',
      '[REDIS]',
      'UNSUB',
      topic
    );
  }

  return this.subClient.punsubscribe(topic, callback);
};

/**
 * Lock by key
 *
 * @param  {String}    lockKey
 * @param  {String}    lockValue
 * @param  {Integer}   maxLockTime
 * @param  {Function}  callback
 * @return {undefined}
 */
RedisHelper.prototype.lock = function(lockKey, lockValue, maxLockTime, callback) {
  return this._run('SET', lockKey, lockValue, 'EX', maxLockTime, 'NX', callback);
};

/**
 * Extend lock time
 *
 * @param  {String}    lockKey
 * @param  {String}    lockValue
 * @param  {Integer}   maxLockTime
 * @param  {Function}  callback
 * @return {undefined}
 */
RedisHelper.prototype.extendLockTime = function(lockKey, lockValue, maxLockTime, callback) {
  var self = this;

  self._run('GET', lockKey, function(err, cacheRes) {
    if (err) return callback && callback(err);

    if (cacheRes !== lockValue) {
      return callback && callback(new Error('Not lock owner'));
    }

    return self._run('EXPIRE', lockKey, maxLockTime, callback);
  });
};

/**
 * Unlock by key
 *
 * @param  {String}    lockKey
 * @param  {String}    lockValue
 * @param  {Function}  callback
 * @return {undefined}
 */
RedisHelper.prototype.unlock = function(lockKey, lockValue, callback) {
  return this._run('EVAL', LUA_UNLOCK_KEY, LUA_UNLOCK_KEY_KEY_NUMBER, lockKey, lockValue, callback);
};

exports.RedisHelper = RedisHelper;
exports.createHelper = function(logger, config) {
  return new RedisHelper(logger, config);
};
