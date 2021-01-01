'use strict';

/* Builtin Modules */
var os = require('os');

/* 3rd-party Modules */
var colors  = require('colors/safe');
var winston = require('winston');

/* Project Modules */
var CONFIG  = require('./yamlResources').get('CONFIG');
var toolkit = require('./toolkit');
var g       = require('./g');

/* Configure */
var LOG_LEVELS = exports.LOG_LEVELS = {
  levels: {
    'ALL'    : 4,
    'DEBUG'  : 3,
    'INFO'   : 2,
    'WARNING': 1,
    'ERROR'  : 0,
    'NONE'   : -1,
  },
  colors: {
    'ALL'    : 'blue',
    'DEBUG'  : 'cyan',
    'INFO'   : 'green',
    'WARNING': 'yellow',
    'ERROR'  : 'red',
  }
};
var LOG_TEXT_FIELDS = [
  // 'appName',
  // 'upTime',
  // 'level',
  'levelShort',
  // 'timestamp',
  // 'timestampMs',
  'timestampHumanized',
  // 'traceId',
  // 'requestType',
  'traceIdShort',
  'userId',
  'username',
  // 'clientId',
  // 'clientIP',
  'diffTime',
  'costTime',
];
var LOG_TEXT_COLOR_MAP = {
  appName           : true,
  upTime            : true,
  level             : true,
  levelShort        : true,
  timestamp         : true,
  timestampMs       : true,
  timestampHumanized: true,
  traceId           : 'yellow',
  traceIdShort      : 'yellow',
  requestType       : 'green',
  userId            : 'cyan',
  userIdShort       : 'cyan',
  username          : 'cyan',
  clientId          : 'green',
  clientIP          : 'green',
  diffTime          : 'cyan',
  costTime          : 'cyan',
};
var LOG_JSON_FIELD_MAP = {
  appName           : 'app',
  upTime            : 'up_time',
  level             : 'level',
  // levelShort        : 'levelShort',
  // timestamp         : 'timestamp',
  timestampMs       : 'cc_timestamp',
  timestampHumanized: 'timestamp_humanized',
  traceId           : 'trace_id',
  requestType       : 'request_type',
  // traceIdShort      : 'trace_id_short',
  userId            : 'user_id',
  // userIdShort       : 'user_id_short',
  username          : 'username',
  clientId          : 'client_id',
  clientIP          : 'client_ip',
  diffTime          : 'diff_time',
  costTime          : 'cost_time',
};

var createWinstonFormatter = function(opt) {
  opt = opt || {};

  return function(options) {
    var message = options.message
    var meta    = options.meta;

    var outputContent = null;
    if (opt.json) {
      var logContentJSON = {};
      for (var field in LOG_JSON_FIELD_MAP) if (LOG_JSON_FIELD_MAP.hasOwnProperty(field)) {
        var k = LOG_JSON_FIELD_MAP[field];

        logContentJSON[k] = meta[field];
      }

      logContentJSON.message = message;

      outputContent = JSON.stringify(logContentJSON);

    } else {
      var logContentArr = [];
      for (var i = 0; i < LOG_TEXT_FIELDS.length; i++) {
        var field = LOG_TEXT_FIELDS[i];

        // Detect field color
        var fieldColor = LOG_TEXT_COLOR_MAP[field];
        if (fieldColor === true) {
          fieldColor = LOG_LEVELS.colors[meta.level];
        }

        // Pretty field
        var fieldValue = meta[field] || '';
        switch (field) {
          case 'traceId':
          case 'traceIdShort':
            fieldValue = fieldValue || 'NONE';
            break;

          case 'upTime':
            fieldValue = 'UP ' + (fieldValue || '0') + 's';
            break;

          case 'costTime':
            fieldValue = (fieldValue || '0') + 'ms';
            break;

          case 'diffTime':
            fieldValue = '+' + (fieldValue || '0')  + 'ms';
            break;

          case 'userId':
          case 'userIdShort':
            fieldValue = fieldValue || 'NON_USER_ID';
            break;

          case 'username':
            fieldValue = '@' + (fieldValue || 'NON_USERNAME');
            break;
        }

        fieldValue = '[' + fieldValue + ']';

        // Add color
        if (opt.color && colors[fieldColor]) {
          fieldValue = colors[fieldColor](fieldValue);
        }

        logContentArr.push(fieldValue);
      }

      logContentArr.push(message)

      outputContent = logContentArr.join(' ');
    }

    return outputContent;
  };
};

var winstonOpt = {
  levels    : LOG_LEVELS.levels,
  level     : 'ALL',
  transports: [],
};

// Add console logger
var consoleFormatterOpt = {
  color: CONFIG.LOG_CONSOLE_COLOR,
};
var consoleOpt = {
  formatter: createWinstonFormatter(consoleFormatterOpt),
  colorize : false,
  json     : false,
  stringify: false,
  showLevel: false,
};
winstonOpt.transports.push(new winston.transports.Console(consoleOpt));

// Add file logger
if (CONFIG.LOG_FILE_PATH) {
  var fileFormatterOpt = {
    path: CONFIG.LOG_FILE_PATH,
    json: CONFIG.LOG_FILE_FORMAT === 'json',
  };
  var fileOpt = {
    formatter: createWinstonFormatter(fileFormatterOpt),
    filename : CONFIG.LOG_FILE_PATH,
    colorize : false,
    json     : false,
    timestamp: false,
    showLevel: false,
  }
  winstonOpt.transports.push(new winston.transports.File(fileOpt));
}

var LOGGER = new winston.Logger(winstonOpt);

/**
 * Logger Helper.
 *
 * @param {Object} locals - `Express.js` req.locals/app.locals
 * @param {Object} req - `Express.js` request object
 */
var LoggerHelper = function(locals, req) {
  this.locals = locals;
  this.req = req;

  this.level = CONFIG.LOG_LEVEL.toUpperCase();

  this._prevLogTime = null;
  this._stagedLogs  = [];
};

/**
 * Clear staged logs
 */
LoggerHelper.prototype.clearStagedLogs = function() {
  this._stagedLogs.splice(0, this._stagedLogs.length);
};

/**
 * @param {null|String|Object} level     - Log level
 * @param {String}             formatter - String formatter
 * @param {...*}               [values]  - Values
 */
LoggerHelper.prototype.log = function() {
  var args = Array.prototype.slice.call(arguments);
  var level = args[0];

  if (level !== 'ERROR'
    && this.locals.requestType === 'page') return;

  this._log.apply(this, args);
};

/**
 * @param {null|String|Object} level     - Log level
 * @param {String}             formatter - String formatter
 * @param {...*}               [values]  - Values
 */
LoggerHelper.prototype._log = function() {
  var args = Array.prototype.slice.call(arguments);
  var level = args.shift();

  if ('string' !== typeof level || !(level.toUpperCase() in LOG_LEVELS.levels)) {
    if (level) {
      level = 'ERROR';
    } else {
      level = 'INFO';
    }
  } else {
    level = level.toUpperCase();
  }

  var nowMs = Date.now();
  var now   = parseInt(nowMs / 1000);

  var message      = toolkit.strf.apply(null, args);
  var fixedMessage = message.replace(/%([sdj%])/g, '%%$1'); // Fix winston 2.4.2
  var logLine = {
    message     : fixedMessage,
    isFixWinston: fixedMessage !== message,
    meta: {
      appName           : CONFIG.APP_NAME,
      upTime            : now - g.runUpTime,
      level             : level,
      levelShort        : level[0],
      timestamp         : now,
      timestampMs       : nowMs,
      timestampHumanized: toolkit.getDateTimeString(),
      requestType       : this.locals.requestType,
      clientIP          : this.req.ip,
      clientId          : this.locals.clientId,
      traceId           : this.locals.traceId,
      traceIdShort      : this.locals.traceIdShort,
      diffTime          : nowMs - (this._prevLogTime || this.locals._requestStartTime),
      costTime          : nowMs - this.locals._requestStartTime,
      userId            : (this.locals.user && this.locals.user.id)           || null,
      username          : (this.locals.user && this.locals.user.username)     || null,
    }
  };

  this._prevLogTime = nowMs;

  if (this.level === 'ALL') {
    this._output(logLine);
    this._stage(logLine);

  } else {
    if (LOG_LEVELS.levels[level] > LOG_LEVELS.levels[this.level]) {
      this._stage(logLine);

    } else if (level !== 'ERROR') {
      this._output(logLine);
      this._stage(logLine);

    } else {
      this._recur();
      this._output(logLine);

      this.level = 'ALL';
    }
  }
};

/**
 * @param {Object} err
 */
LoggerHelper.prototype.logError = function(err) {
  var strErr = err.toString();
  this.error(strErr);

  var stack = err.originError
            ? err.originError.stack
            : err.stack;

  if (stack) {
    var stackLines = stack.split('\n');
    for (var i = 0; i < stackLines.length; i++) {
      this.error(stackLines[i]);
    }
  }
};

LoggerHelper.prototype._stage = function(logLine) {
  this._stagedLogs.push(logLine);
  if (this._stagedLogs.length > 1000) {
    this._stagedLogs = this._stagedLogs.slice(-1000);
  }
};

LoggerHelper.prototype._recur = function() {
  var self = this;

  self._stagedLogs.forEach(function(logLine) {
    logLine.message = '[RECUR] ' + (logLine.message || '');
    self._output(logLine);
  });

  self._stagedLogs = [];
};

LoggerHelper.prototype._output = function(logLine) {
  if (logLine.isFixWinston) {
    LOGGER.log(logLine.meta.level, logLine.message, '', logLine.meta);
  } else {
    LOGGER.log(logLine.meta.level, logLine.message, logLine.meta);
  }
};

for (var level in LOG_LEVELS.levels) if (LOG_LEVELS.levels.hasOwnProperty(level)) {
  /**
   * @param {String} formatter - String formatter
   * @param {...*}   [values]  - Values
   */
  LoggerHelper.prototype[level.toLowerCase()] = function(level) {
    return function() {
      var args = Array.prototype.slice.call(arguments);
      args.unshift(level);

      this.log.apply(this, args);
    };
  }(level);
}

exports.LoggerHelper = LoggerHelper;
exports.createHelper = function(locals, req, fakeTraceId) {
  locals = locals || toolkit.createFakeLocals(fakeTraceId);
  req    = req    || toolkit.createFakeReq();
  return new LoggerHelper(locals, req);
};

exports.requestLoggerInitialize = function(req, res, next) {
  res.locals.logger = new LoggerHelper(res.locals, req);
  return next();
};
