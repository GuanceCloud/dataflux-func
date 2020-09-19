'use strict';

/* Project Modules */
var ROUTE       = require('../utils/yamlResources').get('ROUTE');
var routeLoader = require('../utils/routeLoader');

var monitorPageCtrl = require('../controllers/monitorPageCtrl');

routeLoader.load(ROUTE.monitorPage.sysStats, [
  monitorPageCtrl.sysStats,
]);

routeLoader.load(ROUTE.monitorPage.serverEnvironment, [
  monitorPageCtrl.serverEnvironment,
]);

routeLoader.load(ROUTE.monitorPage.tasks, [
  monitorPageCtrl.tasks,
]);

routeLoader.load(ROUTE.monitorPage.nodesStats, [
  monitorPageCtrl.nodesStats,
]);

routeLoader.load(ROUTE.monitorPage.nodesReport, [
  monitorPageCtrl.nodesReport,
]);
