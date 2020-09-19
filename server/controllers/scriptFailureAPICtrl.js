'use strict';

/* Builtin Modules */

/* 3rd-party Modules */
var async = require('async');

/* Project Modules */
var E       = require('../utils/serverError');
var CONFIG  = require('../utils/yamlResources').get('CONFIG');
var toolkit = require('../utils/toolkit');

var scriptFailureMod = require('../models/scriptFailureMod');

/* Configure */

/* Handlers */
var crudHandler = exports.crudHandler = scriptFailureMod.createCRUDHandler();

exports.list = crudHandler.createListHandler();
