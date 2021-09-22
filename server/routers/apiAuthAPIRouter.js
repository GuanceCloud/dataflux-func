'use strict';

/* Project Modules */
var ROUTE       = require('../utils/yamlResources').get('ROUTE');
var routeLoader = require('../utils/routeLoader');

var apiAuthAPICtrl = require('../controllers/apiAuthAPICtrl');

routeLoader.load(ROUTE.apiAuthAPI.list, [
  apiAuthAPICtrl.list,
]);

routeLoader.load(ROUTE.apiAuthAPI.add, [
  apiAuthAPICtrl.add,
]);

routeLoader.load(ROUTE.apiAuthAPI.modify, [
  apiAuthAPICtrl.modify,
]);

routeLoader.load(ROUTE.apiAuthAPI.delete, [
  apiAuthAPICtrl.delete,
]);
