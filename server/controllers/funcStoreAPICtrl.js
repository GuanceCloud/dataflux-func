'use strict';

/* Built-in Modules */

/* 3rd-party Modules */
var async = require('async');

/* Project Modules */
var E            = require('../utils/serverError');
var CONFIG       = require('../utils/yamlResources').get('CONFIG');
var toolkit      = require('../utils/toolkit');
var modelHelper  = require('../utils/modelHelper');

var funcStoreMod = require('../models/funcStoreMod');

/* Configure */

/* Handlers */
var crudHandler = exports.crudHandler = funcStoreMod.createCRUDHandler();

exports.list   = crudHandler.createListHandler();
exports.get    = crudHandler.createGetHandler();
exports.delete = crudHandler.createDeleteHandler();
