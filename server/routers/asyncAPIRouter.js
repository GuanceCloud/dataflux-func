'use strict';

/* Project Modules */
var ROUTE       = require('../utils/yamlResources').get('ROUTE');
var routeLoader = require('../utils/routeLoader');

var asyncAPICtrl = require('../controllers/asyncAPICtrl');

routeLoader.load(ROUTE.asyncAPI.list, [
  asyncAPICtrl.list,
]);

routeLoader.load(ROUTE.asyncAPI.add, [
  asyncAPICtrl.add,
]);

routeLoader.load(ROUTE.asyncAPI.modify, [
  asyncAPICtrl.modify,
]);

routeLoader.load(ROUTE.asyncAPI.delete, [
  asyncAPICtrl.delete,
]);

routeLoader.load(ROUTE.asyncAPI.addMany, [
  asyncAPICtrl.addMany,
]);

routeLoader.load(ROUTE.asyncAPI.modifyMany, [
  asyncAPICtrl.modifyMany,
]);

routeLoader.load(ROUTE.asyncAPI.deleteMany, [
  asyncAPICtrl.deleteMany,
]);
