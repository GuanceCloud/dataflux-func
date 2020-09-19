'use strict';

/* Project Modules */
var ROUTE       = require('../utils/yamlResources').get('ROUTE');
var routeLoader = require('../utils/routeLoader');

var userAPICtrl = require('../controllers/userAPICtrl');

routeLoader.load(ROUTE.userAPI.list, [
  userAPICtrl.list,
]);

routeLoader.load(ROUTE.userAPI.get, [
  userAPICtrl.get,
]);

routeLoader.load(ROUTE.userAPI.add, [
  userAPICtrl.add,
]);

routeLoader.load(ROUTE.userAPI.modify, [
  userAPICtrl.modify,
]);
