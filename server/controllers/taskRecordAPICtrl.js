'use strict';

/* Built-in Modules */

/* 3rd-party Modules */
var async = require('async');

/* Project Modules */
var E       = require('../utils/serverError');
var CONFIG  = require('../utils/yamlResources').get('CONFIG');
var toolkit = require('../utils/toolkit');

var taskRecordMod = require('../models/taskRecordMod');

/* Init */

/* Handlers */
var crudHandler = exports.crudHandler = taskRecordMod.createCRUDHandler();

exports.list = crudHandler.createListHandler();
