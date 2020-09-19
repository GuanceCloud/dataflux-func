'use strict';

/* Project Modules */
var ROUTE       = require('../utils/yamlResources').get('ROUTE');
var routeLoader = require('../utils/routeLoader');

var accessKeyAPICtrl = require('../controllers/accessKeyAPICtrl');

routeLoader.load(ROUTE.accessKeyAPI.list, [
  accessKeyAPICtrl.list,
]);

routeLoader.load(ROUTE.accessKeyAPI.get, [
  accessKeyAPICtrl.get,
]);

routeLoader.load(ROUTE.accessKeyAPI.add, [
  accessKeyAPICtrl.add,
]);

routeLoader.load(ROUTE.accessKeyAPI.modify, [
  accessKeyAPICtrl.modify,
]);

routeLoader.load(ROUTE.accessKeyAPI.delete, [
  accessKeyAPICtrl.delete,
]);

routeLoader.load(ROUTE.accessKeyAPI.testWebhook, [
  accessKeyAPICtrl.testWebhook,
]);