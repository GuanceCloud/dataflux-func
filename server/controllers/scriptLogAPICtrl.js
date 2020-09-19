'use strict';

/* Builtin Modules */

/* 3rd-party Modules */
var async = require('async');

/* Project Modules */
var E       = require('../utils/serverError');
var CONFIG  = require('../utils/yamlResources').get('CONFIG');
var toolkit = require('../utils/toolkit');

var scriptLogMod = require('../models/scriptLogMod');

/* Configure */

/* Handlers */
var crudHandler = exports.crudHandler = scriptLogMod.createCRUDHandler();

exports.list = crudHandler.createListHandler();
