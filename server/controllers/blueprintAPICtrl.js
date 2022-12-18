'use strict';

/* Built-in Modules */

/* 3rd-party Modules */
var async     = require('async');
var splitargs = require('splitargs');

/* Project Modules */
var E       = require('../utils/serverError');
var CONFIG  = require('../utils/yamlResources').get('CONFIG');
var toolkit = require('../utils/toolkit');

var blueprintMod = require('../models/blueprintMod');

/* Configure */

/* Handlers */
var crudHandler = exports.crudHandler = blueprintMod.createCRUDHandler();

exports.list   = crudHandler.createListHandler();
exports.add    = crudHandler.createAddHandler();
exports.modify = crudHandler.createModifyHandler();
exports.delete = crudHandler.createDeleteHandler();
