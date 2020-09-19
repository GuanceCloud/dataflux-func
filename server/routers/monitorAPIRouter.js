'use strict';

/* Project Modules */
var ROUTE       = require('../utils/yamlResources').get('ROUTE');
var routeLoader = require('../utils/routeLoader');

var monitorAPICtrl = require('../controllers/monitorAPICtrl');

routeLoader.load(ROUTE.monitorAPI.getSysStats, [
  monitorAPICtrl.getSysStats,
]);

routeLoader.load(ROUTE.monitorAPI.getServerEnvironment, [
  monitorAPICtrl.getServerEnvironment,
]);

routeLoader.load(ROUTE.monitorAPI.clearSysStats, [
  monitorAPICtrl.clearSysStats,
]);

routeLoader.load(ROUTE.monitorAPI.listQueuedTasks, [
  monitorAPICtrl.listQueuedTasks,
]);

routeLoader.load(ROUTE.monitorAPI.listScheduledTasks, [
  monitorAPICtrl.listScheduledTasks,
]);

routeLoader.load(ROUTE.monitorAPI.listRecentTasks, [
  monitorAPICtrl.listRecentTasks,
]);

routeLoader.load(ROUTE.monitorAPI.pingNodes, [
  monitorAPICtrl.pingNodes,
]);

routeLoader.load(ROUTE.monitorAPI.getNodesStats, [
  monitorAPICtrl.getNodesStats,
]);

routeLoader.load(ROUTE.monitorAPI.getNodesActiveQueues, [
  monitorAPICtrl.getNodesActiveQueues,
]);

routeLoader.load(ROUTE.monitorAPI.getNodesReport, [
  monitorAPICtrl.getNodesReport,
]);

routeLoader.load(ROUTE.monitorAPI.clearWorkerQueues, [
  monitorAPICtrl.clearWorkerQueues,
]);
