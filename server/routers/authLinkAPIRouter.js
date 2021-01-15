'use strict';

/* Project Modules */
var ROUTE       = require('../utils/yamlResources').get('ROUTE');
var routeLoader = require('../utils/routeLoader');

var authLinkAPICtrl = require('../controllers/authLinkAPICtrl');

routeLoader.load(ROUTE.authLinkAPI.list, [
  authLinkAPICtrl.list,
]);

routeLoader.load(ROUTE.authLinkAPI.add, [
  authLinkAPICtrl.add,
]);

routeLoader.load(ROUTE.authLinkAPI.modify, [
  authLinkAPICtrl.modify,
]);

routeLoader.load(ROUTE.authLinkAPI.delete, [
  authLinkAPICtrl.delete,
]);

routeLoader.load(ROUTE.authLinkAPI.addMany, [
  authLinkAPICtrl.addMany,
]);

routeLoader.load(ROUTE.authLinkAPI.deleteMany, [
  authLinkAPICtrl.deleteMany,
]);
