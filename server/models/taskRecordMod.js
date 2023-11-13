'use strict';

/* Built-in Modules */

/* 3rd-party Modules */
var async  = require('async');
var moment = require('moment-timezone');

/* Project Modules */
var E           = require('../utils/serverError');
var CONFIG      = require('../utils/yamlResources').get('CONFIG');
var toolkit     = require('../utils/toolkit');
var modelHelper = require('../utils/modelHelper');

/* Init */
var TABLE_OPTIONS = exports.TABLE_OPTIONS = {
  displayName: 'task record',
  entityName : 'taskRecord',
  tableName  : 'biz_main_task_record',
  alias      : 'task',

  objectFields: {
  },

  defaultOrders: [
    {field: 'task.triggerTimeMs', method: 'DESC'},
  ],
};

exports.createCRUDHandler = function() {
  return modelHelper.createCRUDHandler(EntityModel);
};

exports.createModel = function(locals) {
  return new EntityModel(locals);
};

var EntityModel = exports.EntityModel = modelHelper.createSubModel(TABLE_OPTIONS);
