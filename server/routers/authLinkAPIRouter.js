'use strict';

/* Project Modules */
var ROUTE       = require('../utils/yamlResources').get('ROUTE');
var routeLoader = require('../utils/routeLoader');

var syncAPICtrl = require('../controllers/syncAPICtrl');

// 兼容处理
routeLoader.load(ROUTE.authLinkAPI.list, [
  syncAPICtrl.list,
]);

routeLoader.load(ROUTE.authLinkAPI.add, [
  syncAPICtrl.add,
]);

routeLoader.load(ROUTE.authLinkAPI.modify, [
  syncAPICtrl.modify,
]);

routeLoader.load(ROUTE.authLinkAPI.delete, [
  syncAPICtrl.delete,
]);

routeLoader.load(ROUTE.authLinkAPI.addMany, [
  syncAPICtrl.addMany,
]);

routeLoader.load(ROUTE.authLinkAPI.modifyMany, [
  syncAPICtrl.modifyMany,
]);

routeLoader.load(ROUTE.authLinkAPI.deleteMany, [
  syncAPICtrl.deleteMany,
]);
