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

  this.config = toolkit.noNullOrWhiteSpace(config);
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

  self.logger && self.logger.debug('[DINGTALK ROBOT] Call <{0}> <- `{1}`',
    message.msgtype || 'UNKNOW',
    JSON.stringify(message)
  );

  request(requestOptions, function(err, _res, _body) {
    // Request Fails
    if (err) {
      self.logger && self.logger.error('[DINGTALK ROBOT] Error: `{0}`', err.toString());
      return callback && callback(err);
    }

    // Error response
    if (_res.statusCode !== 200 || _body.error) {
      return callback && callback(new E('EClientBadRequest', 'Bad DingTalk Robot call', _body, err));
    }

    return callback && callback();
  });
};

exports.dingTalkHelper = dingTalkHelper;
exports.createHelper = function(logger, config) {
  return new dingTalkHelper(logger, config);
};
