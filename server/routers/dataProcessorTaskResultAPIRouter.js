'use strict';

/* Project Modules */
var ROUTE       = require('../utils/yamlResources').get('ROUTE');
var routeLoader = require('../utils/routeLoader');

var dataProcessorTaskResultAPICtrl = require('../controllers/dataProcessorTaskResultAPICtrl');

routeLoader.load(ROUTE.dataProcessorTaskResultAPI.list, [
  dataProcessorTaskResultAPICtrl.list,
]);

routeLoader.load(ROUTE.dataProcessorTaskResultAPI.get, [
  dataProcessorTaskResultAPICtrl.get,
]);
