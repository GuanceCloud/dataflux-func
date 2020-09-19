'use strict';

/* Project Modules */
var ROUTE       = require('../utils/yamlResources').get('ROUTE');
var routeLoader = require('../utils/routeLoader');

var accessKeyPageCtrl = require('../controllers/accessKeyPageCtrl');

routeLoader.load(ROUTE.accessKeyPage.list, [
  accessKeyPageCtrl.list,
]);

routeLoader.load(ROUTE.accessKeyPage.add, [
  accessKeyPageCtrl.add,
]);

routeLoader.load(ROUTE.accessKeyPage.modify, [
  accessKeyPageCtrl.modify,
]);
