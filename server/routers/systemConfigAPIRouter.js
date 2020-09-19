'use strict';

/* Project Modules */
var ROUTE       = require('../utils/yamlResources').get('ROUTE');
var routeLoader = require('../utils/routeLoader');

var systemConfigAPICtrl = require('../controllers/systemConfigAPICtrl');

routeLoader.load(ROUTE.systemConfigAPI.list, [
  systemConfigAPICtrl.list,
]);

routeLoader.load(ROUTE.systemConfigAPI.get, [
  systemConfigAPICtrl.get,
]);

routeLoader.load(ROUTE.systemConfigAPI.set, [
  systemConfigAPICtrl.set,
]);

routeLoader.load(ROUTE.systemConfigAPI.delete, [
  systemConfigAPICtrl.delete,
]);
