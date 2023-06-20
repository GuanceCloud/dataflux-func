'use strict';

/* Project Modules */
var ROUTE       = require('../utils/yamlResources').get('ROUTE');
var routeLoader = require('../utils/routeLoader');

var debugAPICtrl = require('../controllers/debugAPICtrl');

routeLoader.load(ROUTE.debugAPI.pullSystemLogs, [
  debugAPICtrl.pullSystemLogs,
]);

routeLoader.load(ROUTE.debugAPI.putTask, [
  debugAPICtrl.putTask,
]);

routeLoader.load(ROUTE.debugAPI.testAPIBehavior, [
  debugAPICtrl.testAPIBehavior,
]);

routeLoader.load(ROUTE.debugAPI.clearWorkerQueues, [
  debugAPICtrl.clearWorkerQueues,
]);

routeLoader.load(ROUTE.debugAPI.clearLogCacheTables, [
  debugAPICtrl.clearLogCacheTables,
]);
