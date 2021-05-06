'use strict';

/* 3rd-party Modules */
var redis  = require('redis');
var celery = require('celery-client');

/* Project Modules */
var CONFIG    = require('../yamlResources').get('CONFIG');
var toolkit   = require('../toolkit');
var logHelper = require('../logHelper');

function getConfig(c) {
  return {
    host    : c.host,
    port    : c.port,
    db      : c.db || c.database || 0,
    password: c.password || undefined,
  };
};

/* Singleton Client */
var CLIENT_CONFIG = null;
var CLIENT        = null;

/**
 * @constructor
 * @param  {Object} [logger=null]
 * @param  {Object} [config=CONFIG.celery]
 * @return {Object} - Celery Helper
 */
var CeleryHelper = function(logger, config) {
  this.logger = logger || logHelper.createHelper();

  if (config) {
    this.config = toolkit.noNullOrWhiteSpace(config);
    this.client = new celery.Client(
      new celery.RedisHandler(getConfig(this.config)),
      new celery.RedisHandler(getConfig(this.config))
    );
    this.defaultQueue = config.defaultQueue || CONFIG._WORKER_DEFAULT_QUEUE;

  } else {
    if (!CLIENT) {
      CLIENT_CONFIG = toolkit.noNullOrWhiteSpace({
        host    : CONFIG.REDIS_HOST,
        port    : CONFIG.REDIS_PORT,
        db      : CONFIG.REDIS_DATABASE,
        password: CONFIG.REDIS_PASSWORD,
      });
      CLIENT = new celery.Client(
        new celery.RedisHandler(getConfig(CLIENT_CONFIG)),
        new celery.RedisHandler(getConfig(CLIENT_CONFIG))
      );
    }

    this.config = CLIENT_CONFIG;
    this.client = CLIENT;
    this.defaultQueue = CONFIG._WORKER_DEFAULT_QUEUE;
  }

  this.broker  = this.client.broker;
  this.backend = this.client.backend;
};

/**
 * Put task.
 *
 * @param  {String} name        - Celery task name
 * @param  {*[]}    args        - List args for task
 * @param  {Object} kwargs      - Dict args for task
 * @param  {Object} taskOptions - Task options
 * @return {undefined}
 */
CeleryHelper.prototype.putTask = function(name, args, kwargs, taskOptions, callback, onResultCallback) {
  taskOptions = taskOptions || {};

  taskOptions.id = taskOptions.id || toolkit.genDataId('task');

  if (toolkit.isNullOrUndefined(taskOptions.queue)) {
    taskOptions.queue = toolkit.getWorkerQueue(this.defaultQueue);

  } else {
    taskOptions.queue = '' + taskOptions.queue;
    if (taskOptions.queue.indexOf('#') < 0) {
      taskOptions.queue = toolkit.getWorkerQueue(taskOptions.queue);
    }
  }

  this.logger.debug('[CELERY] Put task `{0}` <- `{1}({2}, {3})` options: `{4}`',
    taskOptions.queue,
    name,
    JSON.stringify(args),
    JSON.stringify(kwargs),
    JSON.stringify(taskOptions)
  );

  // Use <Trace ID> for origin.
  taskOptions.origin = this.logger.locals.traceId;

  taskOptions.extra = taskOptions.extra || {};
  if (!taskOptions.extra.userId && this.logger.locals.user) {
    taskOptions.extra.userId = this.logger.locals.user.id;
  }

  if (!taskOptions.extra.username && this.logger.locals.user) {
    taskOptions.extra.username = this.logger.locals.user.username;
  }

  taskOptions.extra.clientId = taskOptions.extra.clientId || this.logger.locals.clientId;
  taskOptions.extra.clientIP = taskOptions.extra.clientIP || this.logger.req.ip;

  return this.client.putTask(name, args, kwargs, taskOptions, callback, onResultCallback);
};

/**
 * Get Result
 * @param  {String} taskId
 * @return {undefined}
 */
CeleryHelper.prototype.getResult = function(taskId, callback) {
  this.logger.debug('[CELERY] Get result: `{0}`', taskId);

  return this.client.getResult(taskId, callback);
};

/**
 * Set callback when result ready
 * @param  {String} taskId
 * @return {undefined}
 */
CeleryHelper.prototype.onResult = function(taskId, callback) {
  return this.client.onResult(taskId, callback);
};

/**
 * List queues
 * @return {undefined}
 */
CeleryHelper.prototype.listQueues = function(callback) {
  var queuePattern = toolkit.getWorkerQueue('*');

  this.logger.debug('[CELERY] List queues');
  return this.client.broker.keys(queuePattern, callback);
};

/**
 * List queued tasks
 * @param  {String} queue
 * @return {undefined}
 */
CeleryHelper.prototype.listQueued = function(queue, callback) {
  if (!queue) {
    queue = toolkit.getWorkerQueue(this.defaultQueue);
  } else {
    if (queue.indexOf('#') < 0) {
      queue = toolkit.getWorkerQueue(queue);
    }
  }

  this.logger.debug('[CELERY] List queued `{0}`', queue);
  return this.client.listQueued(queue, callback);
};

/**
 * List scheduled tasks
 * @return {undefined}
 */
CeleryHelper.prototype.listScheduled = function(callback) {
  this.logger.debug('[CELERY] List scheduled');
  return this.client.listScheduled(callback);
};

/**
 * List recent executed tasks
 * @return {undefined}
 */
CeleryHelper.prototype.listRecent = function(callback) {
  this.logger.debug('[CELERY] List recent');
  return this.client.listRecent(callback);
};

exports.CeleryHelper = CeleryHelper;
exports.createHelper = function(logger, config) {
  return new CeleryHelper(logger, config);
};
