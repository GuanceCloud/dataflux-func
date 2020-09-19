'use strict';

/* Project Modules */
var ROUTE       = require('../utils/yamlResources').get('ROUTE');
var routeLoader = require('../utils/routeLoader');

var userPageCtrl = require('../controllers/userPageCtrl');

routeLoader.load(ROUTE.userPage.list, [
  userPageCtrl.list,
]);

routeLoader.load(ROUTE.userPage.add, [
  userPageCtrl.add,
]);

routeLoader.load(ROUTE.userPage.modify, [
  userPageCtrl.modify,
]);
