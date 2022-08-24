'use strict';

/* Project Modules */
var CONST = require('./yamlResources').get('CONST');

/**
 * @param {String} respCodeName
 * @param {String} [message]
 * @param {*}      [detail]
 * @param {Object} [originError] - Origin error
 */
var ServerError = function(respCodeName, message, detail, originError) {
  var mainRespCodeName = respCodeName.split('.')[0];

  this.info = {
    error  : CONST.respCodeMap[mainRespCodeName],
    reason : respCodeName,
    message: message,
  };

  this.detail      = detail;
  this.originError = originError;
  this.status      = parseInt(CONST.respCodeMap[mainRespCodeName]);
};

ServerError.prototype = new Error();

ServerError.prototype.toJSON = function() {
  return {
    ok     : this.status < 400 ? true : false,
    error  : this.info.error,
    message: this.info.message,
    reason : this.info.reason,
    detail : this.detail,
  };
};

ServerError.prototype.toString = function() {
  return 'Error: ' + JSON.stringify(this);
};

ServerError.prototype.toHTML = function() {
  return `<h1>Error (${this.info.error} - ${this.info.reason})</h1><hr>
  <strong>Message:</strong><p>${this.info.message}<p>
  <strong>Info:</strong><pre>${JSON.stringify(this, null, 2)}<pre>`
};

ServerError.prototype.forSocketIO = function(ackId) {
  var errorJSON = this.toJSON();
  if (ackId) errorJSON.ackId = ackId || undefined;

  return new Error(JSON.stringify(errorJSON));
};

module.exports = ServerError;
