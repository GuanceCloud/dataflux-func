'use strict';

/* Project Modules */
var ROUTE       = require('../utils/yamlResources').get('ROUTE');
var routeLoader = require('../utils/routeLoader');

var datafluxFuncTaskResultAPICtrl = require('../controllers/datafluxFuncTaskResultAPICtrl');

routeLoader.load(ROUTE.datafluxFuncTaskResultAPI.list, [
  datafluxFuncTaskResultAPICtrl.list,
]);

routeLoader.load(ROUTE.datafluxFuncTaskResultAPI.get, [
  datafluxFuncTaskResultAPICtrl.get,
]);
