'use strict';

/* Project Modules */
var ROUTE       = require('../utils/yamlResources').get('ROUTE');
var routeLoader = require('../utils/routeLoader');

var taskInfoAPICtrl = require('../controllers/taskInfoAPICtrl');

routeLoader.load(ROUTE.taskInfoAPI.list, [
  taskInfoAPICtrl.list,
]);
