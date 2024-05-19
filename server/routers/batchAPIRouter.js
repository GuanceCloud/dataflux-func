'use strict';

/* Project Modules */
var ROUTE       = require('../utils/yamlResources').get('ROUTE');
var routeLoader = require('../utils/routeLoader');

var asyncAPICtrl = require('../controllers/asyncAPICtrl');

// 兼容处理
routeLoader.load(ROUTE.batchAPI.list, [
  asyncAPICtrl.list,
]);

routeLoader.load(ROUTE.batchAPI.add, [
  asyncAPICtrl.add,
]);

routeLoader.load(ROUTE.batchAPI.modify, [
  asyncAPICtrl.modify,
]);

routeLoader.load(ROUTE.batchAPI.delete, [
  asyncAPICtrl.delete,
]);

routeLoader.load(ROUTE.batchAPI.addMany, [
  asyncAPICtrl.addMany,
]);

routeLoader.load(ROUTE.batchAPI.modifyMany, [
  asyncAPICtrl.modifyMany,
]);

routeLoader.load(ROUTE.batchAPI.deleteMany, [
  asyncAPICtrl.deleteMany,
]);
