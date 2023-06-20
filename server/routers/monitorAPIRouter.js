'use strict';

/* Project Modules */
var ROUTE       = require('../utils/yamlResources').get('ROUTE');
var routeLoader = require('../utils/routeLoader');

var monitorAPICtrl = require('../controllers/monitorAPICtrl');

routeLoader.load(ROUTE.monitorAPI.getSystemMetrics, [
  monitorAPICtrl.getSystemMetrics,
]);

routeLoader.load(ROUTE.monitorAPI.listAbnormalRequests, [
  monitorAPICtrl.listAbnormalRequests,
]);
