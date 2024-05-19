'use strict';

/* Project Modules */
var ROUTE       = require('../utils/yamlResources').get('ROUTE');
var routeLoader = require('../utils/routeLoader');

var cronJobAPICtrl = require('../controllers/cronJobAPICtrl');

routeLoader.load(ROUTE.cronJobAPI.list, [
  cronJobAPICtrl.list,
]);

routeLoader.load(ROUTE.cronJobAPI.listRecentTriggered, [
  cronJobAPICtrl.listRecentTriggered,
]);

routeLoader.load(ROUTE.cronJobAPI.add, [
  cronJobAPICtrl.add,
]);

routeLoader.load(ROUTE.cronJobAPI.modify, [
  cronJobAPICtrl.modify,
]);

routeLoader.load(ROUTE.cronJobAPI.delete, [
  cronJobAPICtrl.delete,
]);

routeLoader.load(ROUTE.cronJobAPI.addMany, [
  cronJobAPICtrl.addMany,
]);

routeLoader.load(ROUTE.cronJobAPI.modifyMany, [
  cronJobAPICtrl.modifyMany,
]);

routeLoader.load(ROUTE.cronJobAPI.deleteMany, [
  cronJobAPICtrl.deleteMany,
]);
