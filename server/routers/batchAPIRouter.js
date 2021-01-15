'use strict';

/* Project Modules */
var ROUTE       = require('../utils/yamlResources').get('ROUTE');
var routeLoader = require('../utils/routeLoader');

var batchAPICtrl = require('../controllers/batchAPICtrl');

routeLoader.load(ROUTE.batchAPI.list, [
  batchAPICtrl.list,
]);

routeLoader.load(ROUTE.batchAPI.add, [
  batchAPICtrl.add,
]);

routeLoader.load(ROUTE.batchAPI.modify, [
  batchAPICtrl.modify,
]);

routeLoader.load(ROUTE.batchAPI.delete, [
  batchAPICtrl.delete,
]);

routeLoader.load(ROUTE.batchAPI.addMany, [
  batchAPICtrl.addMany,
]);

routeLoader.load(ROUTE.batchAPI.deleteMany, [
  batchAPICtrl.deleteMany,
]);
