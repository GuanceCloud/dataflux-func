'use strict';

/* Builtin Modules */

/* 3rd-party Modules */
var async = require('async');

/* Project Modules */
var E       = require('../utils/serverError');
var CONFIG  = require('../utils/yamlResources').get('CONFIG');
var toolkit = require('../utils/toolkit');

var dataProcessorTaskResultMod = require('../models/dataProcessorTaskResultMod');

/* Configure */

/* Handlers */
var crudHandler = exports.crudHandler = dataProcessorTaskResultMod.createCRUDHandler();

exports.list = crudHandler.createListHandler();
exports.get  = crudHandler.createGetHandler();
