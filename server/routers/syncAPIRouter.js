'use strict';

/* Project Modules */
var ROUTE       = require('../utils/yamlResources').get('ROUTE');
var routeLoader = require('../utils/routeLoader');

var syncAPICtrl = require('../controllers/syncAPICtrl');

routeLoader.load(ROUTE.syncAPI.list, [
  syncAPICtrl.list,
]);

routeLoader.load(ROUTE.syncAPI.add, [
  syncAPICtrl.add,
]);

routeLoader.load(ROUTE.syncAPI.modify, [
  syncAPICtrl.modify,
]);

routeLoader.load(ROUTE.syncAPI.delete, [
  syncAPICtrl.delete,
]);

routeLoader.load(ROUTE.syncAPI.addMany, [
  syncAPICtrl.addMany,
]);

routeLoader.load(ROUTE.syncAPI.modifyMany, [
  syncAPICtrl.modifyMany,
]);

routeLoader.load(ROUTE.syncAPI.deleteMany, [
  syncAPICtrl.deleteMany,
]);
