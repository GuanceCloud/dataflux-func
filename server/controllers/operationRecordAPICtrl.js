'use strict';

/* Built-in Modules */

/* 3rd-party Modules */
var async = require('async');

/* Project Modules */
var E       = require('../utils/serverError');
var CONFIG  = require('../utils/yamlResources').get('CONFIG');
var toolkit = require('../utils/toolkit');

var operationRecordMod = require('../models/operationRecordMod');

/* Configure */

/* Handlers */
var crudHandler = exports.crudHandler = operationRecordMod.createCRUDHandler();

exports.list = crudHandler.createListHandler();
exports.get  = crudHandler.createGetHandler();
