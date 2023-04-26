'use strict';

/* Built-in Modules */

/* 3rd-party Modules */
var async = require('async');

/* Project Modules */
var E       = require('../utils/serverError');
var CONFIG  = require('../utils/yamlResources').get('CONFIG');
var toolkit = require('../utils/toolkit');

var taskInfoMod = require('../models/taskInfoMod');

/* Configure */

/* Handlers */
var crudHandler = exports.crudHandler = taskInfoMod.createCRUDHandler();

exports.list = crudHandler.createListHandler();