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

  this.error       = CONST.respCodeMap[mainRespCodeName],
  this.reason      = respCodeName,
  this.message     = message,
  this.detail      = detail;
  this.originError = originError;
  this.status      = parseInt(CONST.respCodeMap[mainRespCodeName]);
};

ServerError.prototype = new Error();

ServerError.prototype.toJSON = function() {
  return {
    ok     : this.status < 400 ? true : false,
    error  : this.error,
    reason : this.reason,
    message: this.message,
    detail : this.detail,
    status : this.status,
  };
};

ServerError.prototype.toString = function() {
  return 'Error: ' + JSON.stringify(this);
};

ServerError.prototype.toHTML = function() {
  return `<h1>Error (${this.error} - ${this.reason})</h1><hr>
  <strong>Message:</strong><p>${this.message}<p>
  <strong>Info:</strong><pre>${JSON.stringify(this, null, 2)}<pre>`
};

ServerError.prototype.forSocketIO = function(reqId) {
  var errorJSON = this.toJSON();
  if (reqId) errorJSON.reqId = reqId || undefined;

  return new Error(JSON.stringify(errorJSON));
};

module.exports = ServerError;
