'use strict';

/* Project Modules */
var ROUTE       = require('../utils/yamlResources').get('ROUTE');
var routeLoader = require('../utils/routeLoader');

var blueprintAPICtrl = require('../controllers/blueprintAPICtrl');

routeLoader.load(ROUTE.blueprintAPI.list, [
  blueprintAPICtrl.list,
]);

routeLoader.load(ROUTE.blueprintAPI.add, [
  blueprintAPICtrl.add,
]);

routeLoader.load(ROUTE.blueprintAPI.modify, [
  blueprintAPICtrl.modify,
]);

routeLoader.load(ROUTE.blueprintAPI.delete, [
  blueprintAPICtrl.delete,
]);
