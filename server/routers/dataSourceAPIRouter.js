'use strict';

/* Project Modules */
var ROUTE       = require('../utils/yamlResources').get('ROUTE');
var routeLoader = require('../utils/routeLoader');

var dataSourceAPICtrl = require('../controllers/dataSourceAPICtrl');

routeLoader.load(ROUTE.dataSourceAPI.list, [
  dataSourceAPICtrl.list,
]);

routeLoader.load(ROUTE.dataSourceAPI.add, [
  dataSourceAPICtrl.add,
]);

routeLoader.load(ROUTE.dataSourceAPI.modify, [
  dataSourceAPICtrl.modify,
]);

routeLoader.load(ROUTE.dataSourceAPI.delete, [
  dataSourceAPICtrl.delete,
]);

routeLoader.load(ROUTE.dataSourceAPI.query, [
  dataSourceAPICtrl.query,
]);

routeLoader.load(ROUTE.dataSourceAPI.test, [
  dataSourceAPICtrl.test,
]);
