'use strict';

/* Project Modules */
var ROUTE       = require('../utils/yamlResources').get('ROUTE');
var routeLoader = require('../utils/routeLoader');

var taskRecordFuncAPICtrl = require('../controllers/taskRecordFuncAPICtrl');

routeLoader.load(ROUTE.taskRecordFuncAPI.list, [
  taskRecordFuncAPICtrl.list,
]);
