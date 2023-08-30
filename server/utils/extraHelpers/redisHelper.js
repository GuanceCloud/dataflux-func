'use strict';

/* 3rd-party Modules */
var redis  = require('redis');
var async  = require('async');
var moment = require('moment');

/* Project Modules */
var CONFIG    = require('../yamlResources').get('CONFIG');
var toolkit   = require('../toolkit');
var logHelper = require('../logHelper');

/* Lua */
var LUA_UNLOCK_SCRIPT_KEY_COUNT = 1;
var LUA_UNLOCK_SCRIPT = 'if redis.call("get", KEYS[1]) == ARGV[1] then return redis.call("del", KEYS[1]) else return 0 end ';

/* Init */

function getConfig(c, retryStrategy) {
  var config = {
    host: c.host,
    port: c.port,
    db  : c.db || c.database || 0,
    tls : c.useTLS ? { rejectUnauthorized: false } : null,
  };

  if (retryStrategy) {
    config.retry_strategy = retryStrategy;
  }

  if (c.password) {
    if (!c.user) {
      // Only password
      config.password = c.password;

    } else {
      // user and password
      if (c.authType === 'aliyun') {
        // Aliyun special auth type
        config.password = `${c.user}:${c.password}`;

      } else {
        // Default auth type
        config.user     = c.user;
        config.password = c.password;
      }
    }
  }

  return config;
};

/* Singleton Client */
var CLIENT_CONFIG  = null;
var CLIENT         = null;
var DEFAULT_LOGGER = logHelper.createHelper(null, null, 'DEFAULT_REDIS_CLIENT');

var SUB_CLIENT           = null;
var TASK_ON_RESPONSE_MAP = {};

/**
 * @constructor
 * @param  {Object} [logger=null]
 * @param  {Object} [config=null]
 * @return {Object} - Redis Helper
 */
var RedisHelper = function(logger, config) {
  var self = this;

  self.logger = logger || logHelper.createHelper();

  self.isDryRun = false;
  self.skipLog  = false;
  self.checkedKeyMap = {};

  self.retryStrategy = function(options) {
    if (options.error && options.error.code === "ECONNREFUSED") {
      self.logger.error('[REDIS] Connection Refused. Shutting down...');
      process.exit(1);
    }

    self.logger.warning('[REDIS] Reconnect...');
    return Math.min(options.attempt * 100, 3000);
  };

  if (config) {
    var _retryStrategy = config.disableRetry ? null : self.retryStrategy;

    self.config = toolkit.noNullOrWhiteSpace(config);

    self.config.tsMaxAge      = config.tsMaxAge      || 3600 * 24;
    self.config.tsMaxPeriod   = config.tsMaxPeriod   || 3600 * 24 * 3;
    self.config.tsMinInterval = config.tsMinInterval || 60;

    self.client = redis.createClient(getConfig(self.config, _retryStrategy));

    // Error handling
    self.client.on('error', function(err) {
      self.logger.error('[REDIS] Error: `{0}`', err.toString());

      if ('function' === typeof config.errorCallback) {
        config.errorCallback(err);
      }
    });

  } else {
    if (!CLIENT) {
      CLIENT_CONFIG = toolkit.noNullOrWhiteSpace({
        host    : CONFIG.REDIS_HOST,
        port    : CONFIG.REDIS_PORT,
        db      : CONFIG.REDIS_DATABASE,
        user    : CONFIG.REDIS_USER,
        password: CONFIG.REDIS_PASSWORD,
        useTLS  : CONFIG.REDIS_USE_TLS,
        authType: CONFIG.REDIS_AUTH_TYPE,
      });

      CLIENT_CONFIG.tsMaxAge      = CONFIG.REDIS_TS_MAX_AGE;
      CLIENT_CONFIG.tsMaxPeriod   = CONFIG.REDIS_TS_MAX_PERIOD;
      CLIENT_CONFIG.tsMinInterval = CONFIG.REDIS_TS_MIN_INTERVAL;

      CLIENT = redis.createClient(getConfig(CLIENT_CONFIG, self.retryStrategy));

      // Error handling
      CLIENT.on('error', function(err) {
        DEFAULT_LOGGER.error('[REDIS] Error: `{0}`', err.toString());
      });
    }

    self.config = CLIENT_CONFIG;
    self.client = CLIENT;
  }

  // PUB-SUB 消息处理
  self.topicHandlerMap = {};
};

/**
 * Init Redis sub client.
 */
RedisHelper.prototype.initSubClient = function() {
  var self = this;

  if (self.subClient) return;

  self.subClient = self.client.duplicate();
  self.subBuffer = toolkit.createLimitedBuffer(CONFIG._SUB_BUFFER_LIMIT);

  self.subClient.on('pmessage', function(_pattern, _channel, _message) {
    if (!self.topicHandlerMap[_pattern]) return;

    if (!self.skipLog) {
      self.logger.debug('[REDIS] Receive <- Topic: `{0}`, Length: {1}', _channel, _message.length);
    }

    // 进入缓冲区
    var task = {
      handlerKey: _pattern,
      topic     : _channel,
      message   : _message,
    }
    self.subBuffer.put(task);
  });

  self.subClient.on('error', function(err) {
    self.logger.error('[REDIS] Error: `{0}`', err.toString());
  });
};

/**
 * Run a Redis command.
 *
 * @param  {String} command - Redis command
 * @param  {...*} arguments - Redis command arguments
 * @return {undefined}
 */
RedisHelper.prototype.run = function() {
  var args = Array.prototype.slice.call(arguments);
  var command = args.shift();

  if (!this.skipLog) {
    if ('string' === typeof args[0]) {
      this.logger.debug('[REDIS] Run `{0} {1} ...`', command.toUpperCase(), args[0]);
    } else {
      this.logger.debug('[REDIS] Run `{0}`', command.toUpperCase());
    }
  }

  return this.client[command].apply(this.client, args);
};

RedisHelper.prototype.keys = function(pattern, limitKeys, callback) {
  var self = this;
  if ('function' === typeof limitKeys && !callback) {
    callback  = limitKeys;
    limitKeys = null;
  }

  var COUNT_LIMIT = 1000;

  var foundKeys  = [];
  var nextCursor = 0;
  async.doUntil(function(untilCallback) {
    self.run('scan', nextCursor, 'MATCH', pattern, 'COUNT', COUNT_LIMIT, function(err, dbRes) {
      if (err) return untilCallback(err);

      nextCursor = dbRes[0];

      var keys = dbRes[1];
      if (Array.isArray(keys) && keys.length > 0) {
        foundKeys = foundKeys.concat(keys);
      }

      return untilCallback();
    });

  }, function() {
    return parseInt(nextCursor) === 0 || (limitKeys && foundKeys.length >= limitKeys);

  }, function(err) {
    if (err) return callback(err);

    foundKeys = toolkit.noDuplication(foundKeys);

    if (limitKeys) {
      foundKeys = foundKeys.slice(0, limitKeys);
    }

    return callback(null, foundKeys);
  });
};

RedisHelper.prototype.exists = function(key, callback) {
  return this.run('exists', key, callback);
};

RedisHelper.prototype.get = function(key, callback) {
  return this.run('get', key, callback);
};

RedisHelper.prototype.getset = function(key, value, callback) {
  if (this.isDryRun) {
    return this.run('get', key, callback);
  } else {
    return this.run('getset', key, value, callback);
  }
};

RedisHelper.prototype.set = function(key, value, callback) {
  if (this.isDryRun) return callback(null, 'OK');
  return this.run('set', key, value, callback);
};

RedisHelper.prototype.setnx = function(key, value, callback) {
  if (this.isDryRun) return callback(null, 'OK');
  return this.run('setnx', key, value, callback);
};

RedisHelper.prototype.setex = function(key, maxAge, value, callback) {
  if (this.isDryRun) return callback(null, 'OK');
  if (maxAge <= 0) maxAge = 1;
  return this.run('setex', key, maxAge, value, callback);
};

RedisHelper.prototype.setexnx = function(key, maxAge, value, callback) {
  if (this.isDryRun) return callback(null, 'OK');
  if (maxAge <= 0) maxAge = 1;
  return this.run('set', key, value, 'EX', maxAge, 'NX', callback);
};

RedisHelper.prototype.mget = function(keys, callback) {
  return this.run('mget', keys, callback);
};

RedisHelper.prototype.mset = function(keyValues, callback) {
  if (!Array.isArray(keyValues)) {
    var tmp = []
    for (var k in keyValues) {
      tmp.push(k, keyValues[k]);
    }
    keyValues = tmp;
  }
  return this.run('mset', keyValues, callback);
};

RedisHelper.prototype.incr = function(key, callback) {
  if (this.isDryRun) return callback(null, 'OK');
  return this.run('incr', key, callback);
};

RedisHelper.prototype.incrby = function(key, increment, callback) {
  if (this.isDryRun) return callback(null, 'OK');
  return this.run('incrby', key, increment, callback);
};

RedisHelper.prototype.delete = RedisHelper.prototype.del = function(keys, callback) {
  if (this.isDryRun) return callback(null, 'OK');
  return this.run('del', keys, callback);
};

RedisHelper.prototype.expire = function(key, expires, callback) {
  if (this.isDryRun) return callback(null, 'OK');
  if (expires <= 0) expires = 1;
  return this.run('expire', key, expires, callback);
};

RedisHelper.prototype.expireat = function(key, timestamp, callback) {
  if (this.isDryRun) return callback(null, 'OK');
  return this.run('expireat', key, timestamp, callback);
};

RedisHelper.prototype.hkeys = function(key, pattern, callback) {
  var self = this;

  var foundKeys = [];

  var COUNT_LIMIT = 1000;
  var nextCursor  = 0;
  async.doUntil(function(untilCallback) {
    self.run('hscan', key, nextCursor, 'MATCH', pattern, 'COUNT', COUNT_LIMIT, function(err, dbRes) {
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
  return this.run('hget', key, field, callback);
};

RedisHelper.prototype.hmget = function(key, fields, callback) {
  return this.run('hmget', key, fields, callback);
};

RedisHelper.prototype.hgetall = function(key, callback) {
  return this.run('hgetall', key, callback);
};

RedisHelper.prototype.hset = function(key, field, value, callback) {
  if (this.isDryRun) return callback(null, 'OK');
  return this.run('hset', key, field, value, callback);
};

RedisHelper.prototype.hsetnx = function(key, field, value, callback) {
  if (this.isDryRun) return callback(null, 'OK');
  return this.run('hsetnx', key, field, value, callback);
};

RedisHelper.prototype.hmset = function(key, obj, callback) {
  if (this.isDryRun) return callback(null, 'OK');
  return this.run('hmset', key, obj, callback);
};

RedisHelper.prototype.hincr = function(key, field, callback) {
  if (this.isDryRun) return callback(null, 'OK');
  return this.run('hincrby', key, field, 1, callback);
};

RedisHelper.prototype.hincrby = function(key, field, increment, callback) {
  if (this.isDryRun) return callback(null, 'OK');
  return this.run('hincrby', key, field, increment, callback);
};

RedisHelper.prototype.hdel = function(key, fields, callback) {
  if (this.isDryRun) return callback(null, 'OK');
  return this.run('hdel', key, fields, callback);
};

RedisHelper.prototype.lpush = function(key, value, callback) {
  if (this.isDryRun) return callback(null, 'OK');
  return this.run('lpush', key, value, callback);
};

RedisHelper.prototype.rpush = function(key, value, callback) {
  if (this.isDryRun) return callback(null, 'OK');
  return this.run('rpush', key, value, callback);
};

RedisHelper.prototype.lpop = function(key, callback) {
  if (this.isDryRun) return callback(null, 'OK');
  return this.run('lpop', key, callback);
};

RedisHelper.prototype.rpop = function(key, callback) {
  if (this.isDryRun) return callback(null, 'OK');
  return this.run('rpop', key, callback);
};

RedisHelper.prototype.llen = function(key, callback) {
  return this.run('llen', key, callback);
};

RedisHelper.prototype.lrange = function(key, start, stop, callback) {
  return this.run('lrange', key, start, stop, callback);
};

RedisHelper.prototype.lset = function(key, index, value, callback) {
  if (this.isDryRun) return callback(null, 'OK');
  return this.run('lset', key, index, value, callback);
};

RedisHelper.prototype.ltrim = function(key, start, stop, callback) {
  if (this.isDryRun) return callback(null, 'OK');
  return this.run('ltrim', key, start, stop, callback);
};

RedisHelper.prototype.ttl = function(key, callback) {
  return this.run('ttl', key, callback);
};

RedisHelper.prototype.pttl = function(key, callback) {
  return this.run('pttl', key, callback);
};

RedisHelper.prototype.type = function(key, callback) {
  return this.run('type', key, callback);
};

RedisHelper.prototype.dbsize = function(callback) {
  return this.run('dbsize', callback);
};

RedisHelper.prototype.info = function(callback) {
  return this.run('info', callback);
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
    this.logger.debug('[REDIS] GET by pattern `{0}`', pattern);
  }

  self.keys(pattern, function(err, keys) {
    if (err) return callback && callback(err);

    if (keys.length <= 0) {
      return callback && callback();
    } else {
      return self.run('MGET', keys, function(err, cacheRes) {
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
    this.logger.debug('[REDIS] DEL by pattern `{0}`', pattern);
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
    this.logger.debug('[REDIS] HGET by pattern `{0}`.`{1}`', key, pattern);
  }

  self.hkeys(key, pattern, function(err, fields) {
    if (err) return callback && callback(err);

    if (fields.length <= 0) {
      return callback && callback();
    } else {
      return self.run('HMGET', key, fields, callback);
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
    this.logger.debug('[REDIS] HDEL by pattern `{0}`.`{1}`', key, pattern);
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
    this.logger.debug('[REDIS] Pub -> `{0}`', topic);
  }

  return this.client.publish(topic, message, callback);
};

/**
 * Subscribe from topic
 *
 * @param  {String}    topic
 * @param  {Function}  handler
 * @param  {Function}  callback
 * @return {undefined}
 */
RedisHelper.prototype.sub = function(topic, handler, callback) {
  if (!this.skipLog) {
    this.logger.debug('[REDIS] Sub `{0}`', topic);
  }

  this.initSubClient();
  this.topicHandlerMap[topic] = handler;

  return this.subClient.psubscribe(topic, callback);
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
    this.logger && this.logger.debug('[REDIS] Unsub `{0}`', topic);
  }

  this.initSubClient();
  delete this.topicHandlerMap[topic];

  return this.subClient.punsubscribe(topic, callback);
};

/**
 * Consume message from buffer
 *
 * @param  {Function}  callback
 * @return {undefined}
 */
RedisHelper.prototype.consume = function(callback) {
  for (var i = 0; i < this.subBuffer.length; i++) {
    var task = this.subBuffer.get();
    if (!task) return callback();

    var handler = this.topicHandlerMap[task.handlerKey];
    if (!handler) continue;

    return handler(task.topic, task.message, null, function() {
      return callback(null, true);
    });
  }

  return callback();
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
  if (maxLockTime <= 0) maxLockTime = 1;
  return this.run('SET', lockKey, lockValue, 'EX', maxLockTime, 'NX', callback);
};

/**
 * Lock by key (blocking)
 *
 * @param  {String}    lockKey
 * @param  {String}    lockValue
 * @param  {Integer}   maxLockTime
 * @param  {Function}  callback
 * @return {undefined}
 */
RedisHelper.prototype.lockWait = function(lockKey, lockValue, maxLockTime, maxWaitTime, callback) {
  var self = this;

  if (maxLockTime <= 0) maxLockTime = 1;
  if (maxWaitTime <= 0) maxWaitTime = 1;

  var interval = 300;
  var times    = Math.ceil(maxWaitTime * 1000 / interval);

  async.retry({ times: times, interval: interval }, function(asyncCallback) {
    self.run('SET', lockKey, lockValue, 'EX', maxLockTime, 'NX', function(err, cacheRes) {
      if (err) return asyncCallback(err);

      if (!cacheRes) {
        return asyncCallback(new Error('Lock holded by other'));
      } else {
        return asyncCallback(null, 'OK');
      }
    });
  }, function(err) {
    if (err) return callback(new Error('Wait Lock timeout.'));
    return callback();
  });
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

  if (maxLockTime <= 0) maxLockTime = 1;
  self.run('GET', lockKey, function(err, cacheRes) {
    if (err) return callback && callback(err);

    if (cacheRes !== lockValue) {
      return callback && callback(new Error('Not lock owner'));
    }

    return self.run('EXPIRE', lockKey, maxLockTime, callback);
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
  return this.run('EVAL', LUA_UNLOCK_SCRIPT, LUA_UNLOCK_SCRIPT_KEY_COUNT, lockKey, lockValue, callback);
};

/**
 * Add time-series point
 *
 * @param  {String}   key
 * @param  {Object}   options
 * @param  {Integer}  options.timestamp
 * @param  {*}        options.value
 * @param  {String}   options.mode
 * @param  {Function} callback
 * @return {undefined}
 */
RedisHelper.prototype.tsAdd = function(key, options, callback) {
  if (!this.skipLog) {
    this.logger.debug('[REDIS] TS Add `{0}`', key);
  }

  var self = this;

  if (arguments.length === 2) {
    callback = options;
    options  = null;
  }

  options = options || {};
  var timestamp = options.timestamp || toolkit.getTimestamp();
  var value     = options.value     || 0;
  var mode      = options.mode      || 'update';

  // 时间戳自动根据最小间隔对齐
  timestamp = parseInt(timestamp / this.config.tsMinInterval) * this.config.tsMinInterval;

  if (self.isDryRun) return callback(null, 'OK');

  async.series([
    function(asyncCallback) {
      if (self.checkedKeyMap[key]) return asyncCallback();

      self.client.type(key, function(err, cacheRes) {
        if (err) return asyncCallback(err);

        self.checkedKeyMap[key] = true;

        if (cacheRes !== 'zset') {
          return self.client.del(key, asyncCallback);
        }

        return asyncCallback();
      });
    },
    function(asyncCallback) {
      if (mode.toLowerCase() !== 'addup') return asyncCallback();

      self.client.zrangebyscore(key, timestamp, timestamp, function(err, cacheRes) {
        if (err) return asyncCallback(err);

        if (toolkit.isNothing(cacheRes)) return asyncCallback();

        var p = cacheRes[0];
        var sepIndex  = p.indexOf(',');
        var prevValue = JSON.parse(p.slice(sepIndex + 1));

        value += parseFloat(prevValue);

        return asyncCallback();
      });
    },
    function(asyncCallback) {
      return self.client.zremrangebyscore(key, timestamp, timestamp, asyncCallback);
    },
    function(asyncCallback) {
      value = JSON.stringify(value);
      var data = [timestamp, value].join(',');
      self.client.zadd(key, timestamp, data, asyncCallback);
    },
    function(asyncCallback) {
      self.client.expire(key, self.config.tsMaxAge, asyncCallback);
    },
    function(asyncCallback) {
      if (!self.config.tsMaxPeriod) return asyncCallback();

      var minTimestamp = toolkit.getTimestamp() - self.config.tsMaxPeriod;
      self.client.zremrangebyscore(key, '-inf', minTimestamp, asyncCallback);
    },
  ], function(err) {
    if (err) return callback(err);
    return callback();
  });
};

/**
 * Get time-series points
 *
 * @param  {String}   key
 * @param  {Object}   options
 * @param  {Integer}  options.start
 * @param  {Integer}  options.stop
 * @param  {Integer}  options.groupTime   Group by seconds
 * @param  {String}   options.agg         count, avg, sum, min, max
 * @param  {Integer}  options.scale
 * @param  {Integer}  options.ndigits
 * @param  {Integer}  options.timeUnit        ms, s
 * @param  {Boolean}  options.dictOutput
 * @param  {Integer}  options.limit
 * @param  {Function} callback
 * @return {undefined}
 */
RedisHelper.prototype.tsGet = function(key, options, callback) {
  if (!this.skipLog) {
    this.logger.debug('[REDIS] TS Get `{0}`', key);
  }

  var self = this;

  if (arguments.length === 2) {
    callback = options;
    options  = null;
  }

  options = options || {};
  options.start      = options.start      || '-inf';
  options.stop       = options.stop       || '+inf';
  options.groupTime  = options.groupTime  || 1;
  options.agg        = options.agg        || 'avg';
  options.scale      = options.scale      || 1;
  options.ndigits    = options.ndigits    || 2;
  options.timeUnit   = options.timeUnit   || 's';
  options.dictOutput = options.dictOutput || false;
  options.limit      = options.limit      || null;
  options.fillZero   = options.fillZero   || false;

  var tsData = [];
  async.series([
    function(asyncCallback) {
      self.client.type(key, function(err, cacheRes) {
        if (err) return asyncCallback(err);

        if (cacheRes !== 'zset') {
          return self.client.del(key, asyncCallback);
        }

        return asyncCallback();
      });
    },
    function(asyncCallback) {
      self.client.zrangebyscore(key, options.start, options.stop, function(err, cacheRes) {
        if (err) return asyncCallback(err);

        tsData = cacheRes.map(function(p) {
          var sepIndex  = p.indexOf(',');
          var timestamp = parseInt(p.slice(0, sepIndex));
          var value     = JSON.parse(p.slice(sepIndex + 1));
          return [timestamp, value];
        });

        if (tsData.length > 0 && options.groupTime && options.groupTime >= 1) {
          var temp = [];

          // var latestTimestamp = tsData[tsData.length - 1][0];
          tsData.forEach(function(d) {
            var groupedTimestamp = parseInt(d[0] / options.groupTime) * options.groupTime;
            // var groupedTimestamp = latestTimestamp - parseInt((latestTimestamp - d[0]) / options.groupTime) * options.groupTime

            if (temp.length <= 0 || temp[temp.length - 1][0] !== groupedTimestamp) {
              temp.push([groupedTimestamp, [d[1]]]);
            } else {
              temp[temp.length - 1][1].push(d[1]);
            }
          });

          temp.forEach(function(d) {
            switch(options.agg) {
              case 'count':
                d[1] = d[1].length;
                break;

              case 'avg':
                var count = d[1].length;
                d[1] = d[1].reduce(function(acc, x) {
                  return acc + x;
                }, 0) / count;
                break;

              case 'sum':
                d[1] = d[1].reduce(function(acc, x) {
                  return acc + x;
                }, 0);
                break;

              case 'min':
                d[1] = Math.min.apply(null, d[1]);

                break;
              case 'max':
                d[1] = Math.max.apply(null, d[1]);
                break;
            }
          });

          if (options.fillZero) {
            var zeroFillMap = temp.reduce(function(acc, d) {
              acc[d[0]] = d[1];
              return acc;
            }, {});

            var _nextTemp = []
            for (var ts = temp[0][0]; ts <= temp[temp.length - 1][0]; ts += options.groupTime) {
              _nextTemp.push([ts, zeroFillMap[ts] || 0]);
            }
            temp = _nextTemp;
          }

          tsData = temp;
        }

        if (options.limit) {
          tsData = tsData.slice(-1 * options.limit);
        }

        tsData.forEach(function(d) {
          if ('number' === typeof d[1]) {
            if (options.scale && options.scale != 1) {
              d[1] = d[1] / options.scale;
            }

            if (options.ndigits > 0) {
              d[1] = parseFloat(d[1].toFixed(options.ndigits));
            } else {
              d[1] = parseInt(d[1]);
            }
          }

          if (options.timeUnit === 'ms') {
            d[0] = d[0] * 1000;
          }
        });

        if (options.dictOutput) {
          tsData = tsData.map(function(d) {
            return { t: d[0], v: d[1] };
          });
        }

        return asyncCallback();
      });
    },
  ], function(err) {
    if (err) return callback(err);
    return callback(null, tsData);
  });
};

RedisHelper.prototype.tsGetByPattern = function(pattern, options, callback) {
  var self = this;

  var tsDataMap = {};
  var keys = null;
  async.series([
    function(asyncCallback) {
      self.keys(pattern, function(err, cacheRes) {
        if (err) return asyncCallback(err);

        keys = cacheRes;
        return asyncCallback();
      });
    },
    function(asyncCallback) {
      async.eachSeries(keys, function(key, eachCallback) {
        self.tsGet(key, options, function(err, tsData) {
          if (err) return eachCallback(err);

          tsDataMap[key] = tsData;

          return eachCallback();
        });
      }, asyncCallback);
    },
  ], function(err) {
    if (err) return asyncCallback(err);
    return callback(err, tsDataMap);
  });
};

RedisHelper.prototype.end = function() {
  this.logger.info(`[REDIS] End`);

  if (this.client) {
    this.client.end(true);
  }
  this.client = null;

  if (this.subClient) {
    this.subClient.end(true);
  }
  this.subClient = null;
};

RedisHelper.prototype.pagedList = function(key, paging, callback) {
  var self = this;

  paging = paging || { pageSize: 20, pageNumber: 1 };

  var data = null;
  var pageInfo = {
    pagingStyle: 'normal',
    pageSize   : paging.pageSize,
    count      : null,
    totalCount : null,
    pageNumber : paging.pageNumber,
    pageCount  : null,
    isFirstPage: paging.pageNumber <= 1,
  }

  async.series([
    // 获取总长度
    function(asyncCallback) {
      self.llen(key, function(err, cacheRes) {
        if (err) return asyncCallback(err);

        var listLength = parseInt(cacheRes);
        pageInfo.totalCount = listLength;
        pageInfo.pageCount  = Math.ceil(listLength / paging.pageSize);

        return asyncCallback();
      });
    },
    // 获取数据
    function(asyncCallback) {
      var start = (paging.pageNumber - 1) * paging.pageSize;
      var stop  = start + paging.pageSize - 1;
      self.lrange(key, start, stop, function(err, cacheRes) {
        if (err) return asyncCallback(err);

        data = cacheRes;
        for (let i = 0; i < data.length; i++) {
          try { data[i] = JSON.parse(data[i]); } catch(_) {}
        }

        pageInfo.count = data.length;

        return asyncCallback();
      });
    },
  ], function(err) {
    if (err) return callback(err);
    return callback(null, data, pageInfo);
  });
};

RedisHelper.prototype.putTask = function(taskReq, callback) {
  var self = this;

  taskReq  = taskReq || {};
  callback = toolkit.ensureFn(callback);

  if (!taskReq.name) {
    return callback(new Error('taskReq.name is required.'));
  }

  // Init task response sub client
  if (!SUB_CLIENT) {
    SUB_CLIENT = self.client.duplicate();
    TASK_ON_RESPONSE_MAP = {};

    var taskRespCacheKey = toolkit.getWorkerCacheKey('task', 'response', [ 'name', '*', 'id', '*' ]);
    SUB_CLIENT.psubscribe(taskRespCacheKey);

    SUB_CLIENT.on('pmessage', function(pattern, channel, message) {
      var taskId = toolkit.parseCacheKey(channel).tags.id;

      var onResponse = TASK_ON_RESPONSE_MAP[taskId];
      delete TASK_ON_RESPONSE_MAP[taskId];

      if ('function' !== typeof onResponse) return;

      var taskResp = message;
      if (taskResp) {
        try {
          taskResp = JSON.parse(taskResp);
        } catch(ex) {
          // Nope
        }
      }

      onResponse(taskResp);
    });
  }

  // Prepare
  if (taskReq.ignoreResult === true) {
    delete taskReq.onResponse;
  } else {
    taskReq.ignoreResult = !!!taskReq.onResponse;
  }

  // Push task
  taskReq.id          = taskReq.id          || toolkit.genTaskId();
  taskReq.triggerTime = taskReq.triggerTime || toolkit.getTimestamp(3);

  if (toolkit.isNothing(taskReq.queue)) {
    taskReq.queue = CONFIG._TASK_QUEUE_DEFAULT;
  }

  if (taskReq.onResponse) {
    TASK_ON_RESPONSE_MAP[taskReq.id] = taskReq.onResponse;
    delete taskReq.onResponse;

    // Waiting for response
    var _timeout = taskReq.timeout || CONFIG._TASK_TIMEOUT_DEFAULT;
    _timeout = Math.min(_timeout, CONFIG._TASK_RESULT_WAIT_TIMEOUT_MAX);

    // 留出响应时间
    _timeout += 10;

    setTimeout(function() {
      var onResponse = TASK_ON_RESPONSE_MAP[taskReq.id];
      delete TASK_ON_RESPONSE_MAP[taskReq.id];

      if (onResponse) {
        var taskResp = {
          name  : taskReq.name,
          id    : taskReq.id,
          kwargs: taskReq.kwargs,

          triggerTime: taskReq.triggerTime,

          status: 'noResponse',
        }
        onResponse(taskResp);
      }
    }, _timeout * 1000);
  }

  var taskReqDumps = JSON.stringify(taskReq);

  // 计算执行时间
  var runTime = 0;
  if (taskReq.eta || taskReq.delay) {
    if (taskReq.eta) {
      // 优先使用 eta
      runTime = moment(taskReq.eta).unix();
      delete taskReq.delay;

    } else if (taskReq.delay) {
      runTime = taskReq.triggerTime + taskReq.delay;
      delete taskReq.eta;
    }
  }

  // 发送任务
  if (runTime <= moment().unix()) {
    var workerQueue = toolkit.getWorkerQueue(taskReq.queue);
    return self.client.lpush(workerQueue, taskReqDumps, function(err) {
      if (err) return callback(err);
      return callback(null, taskReq.id);
    });

  } else {
    var delayQueue = toolkit.getDelayQueue(taskReq.queue);
    return self.client.zadd(delayQueue, runTime, taskReqDumps, function(err) {
      if (err) return callback(err);
      return callback(null, taskReq.id);
    });
  }
};

exports.RedisHelper = RedisHelper;
exports.createHelper = function(logger, config) {
  return new RedisHelper(logger, config);
};

exports.getConfig = getConfig;
