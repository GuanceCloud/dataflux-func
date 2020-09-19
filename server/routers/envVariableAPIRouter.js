'use strict';

/* Project Modules */
var ROUTE       = require('../utils/yamlResources').get('ROUTE');
var routeLoader = require('../utils/routeLoader');

var envVariableAPICtrl = require('../controllers/envVariableAPICtrl');

routeLoader.load(ROUTE.envVariableAPI.list, [
  envVariableAPICtrl.list,
]);

routeLoader.load(ROUTE.envVariableAPI.add, [
  envVariableAPICtrl.add,
]);

routeLoader.load(ROUTE.envVariableAPI.modify, [
  envVariableAPICtrl.modify,
]);

routeLoader.load(ROUTE.envVariableAPI.delete, [
  envVariableAPICtrl.delete,
]);
