'use strict';

/* Builtin Modules */

/* 3rd-party Modules */
var async = require('async');

/* Project Modules */
var E       = require('../utils/serverError');
var CONFIG  = require('../utils/yamlResources').get('CONFIG');
var toolkit = require('../utils/toolkit');

var datafluxFuncTaskResultMod = require('../models/datafluxFuncTaskResultMod');

/* Configure */

/* Handlers */
var crudHandler = exports.crudHandler = datafluxFuncTaskResultMod.createCRUDHandler();

exports.list = crudHandler.createListHandler();
exports.get  = crudHandler.createGetHandler();
