'use strict';

/* Project Modules */
var ROUTE       = require('../utils/yamlResources').get('ROUTE');
var routeLoader = require('../utils/routeLoader');

var taskRecordAPICtrl = require('../controllers/taskRecordAPICtrl');

routeLoader.load(ROUTE.taskRecordAPI.list, [
  taskRecordAPICtrl.list,
]);
