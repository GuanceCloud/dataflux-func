'use strict';

/* Built-in Modules */

/* 3rd-party Modules */
var async = require('async');

/* Project Modules */
var E       = require('../utils/serverError');
var CONFIG  = require('../utils/yamlResources').get('CONFIG');
var toolkit = require('../utils/toolkit');
var webhook = require('../utils/webhook');

var accessKeyMod = require('../models/accessKeyMod');

/* Configure */

/* Handlers */
var crudHandler = exports.crudHandler = accessKeyMod.createCRUDHandler();

exports.list   = crudHandler.createListHandler();
exports.get    = crudHandler.createGetHandler();
exports.add    = crudHandler.createAddHandler();
exports.modify = crudHandler.createModifyHandler();
exports.delete = crudHandler.createDeleteHandler();

exports.testWebhook = function(req, res, next) {
  var payload  = {
    event: 'test',
    data: {
      'testString'     : 'Hello World',
      'testEmptyString': '',
      'testInt'        : 42,
      'testFloat'      : 1.23,
      'testTrue'       : true,
      'testFalse'      : false,
      'testNull'       : null,
      'testStringArray': ['hello', 'world'],
      'testIntArray'   : [1, 2, 3, 4, 5],
      'testFloatArray' : [1.1, 2.2, 3.3, 4.4, 5.5],
      'testMixedArray' : ['Hello World', '', 42, 1.23, true, false, null],
      'testEmptyJSON'  : {},
      'unicode'        : '你好！',
    }
  };
  var options = {
    kafkaPartition: 0,
    kafkaTopic    : 'basis',
  };
  webhook.send(res.locals, payload, options);

  return res.locals.sendJSON();
};
