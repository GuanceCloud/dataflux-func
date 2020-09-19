'use strict';

/* 3rd-party Modules */
var request = require('request');

/* Project Modules */
var E         = require('../serverError');
var CONFIG    = require('../yamlResources').get('CONFIG');
var toolkit   = require('../toolkit');
var logHelper = require('../logHelper');

/**
 * @constructor
 * @param  {Object} logger
 * @param  {Object} config - DingTalk Helper config
 * @return {Object}        - DingTalk Helper
 */
var dingTalkHelper = function(logger, config) {
  this.logger = logger || logHelper.createHelper();

  if (config) {
    this.config = toolkit.noNullOrWhiteSpace(config);
  } else {
    this.config = toolkit.noNullOrWhiteSpace({
      webhookURL: CONFIG.DING_TALK_ROBOT_URL,
    });
  }
};

/**
 * Call Webhook
 *
 * @param  {Object}    message
 * @param  {Function}  callback
 * @return {undefined}
 */
dingTalkHelper.prototype.call = function(message, callback) {
  var self = this;

  var requestOptions = {
    forever: true,
    timeout: (self.config.timeout || 3) * 1000,
    method : 'post',
    url    : self.config.webhookURL,
    json   : true,
    body   : message,
  };

  self.logger && self.logger.debug('{0} <{1}> <- {2}',
    '[DINGTALKROBOT]',
    message.msgtype || 'UNKNOW',
    JSON.stringify(message)
  );

  request(requestOptions, function(err, res, body) {
    // Request Fails
    if (err) {
      self.logger && self.logger.error('{0} {1}',
        '[DINGTALKROBOT ERR]',
        err
      );
      return callback && callback(err);
    }

    // Error response
    if (res.statusCode !== 200 || body.error) {
      return callback && callback(new E('EClientBadRequest', 'Bad DingTalk Robot call', body, body));
    }

    return callback && callback();
  });
};

exports.dingTalkHelper = dingTalkHelper;
exports.createHelper = function(logger, config) {
  return new dingTalkHelper(logger, config);
};
