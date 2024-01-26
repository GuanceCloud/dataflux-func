'use strict';

/* Project Modules */
var ROUTE       = require('../utils/yamlResources').get('ROUTE');
var routeLoader = require('../utils/routeLoader');

var tempFlagAPICtrl = require('../controllers/tempFlagAPICtrl');

routeLoader.load(ROUTE.tempFlagAPI.get, [
  tempFlagAPICtrl.get,
]);

routeLoader.load(ROUTE.tempFlagAPI.set, [
  tempFlagAPICtrl.set,
]);

routeLoader.load(ROUTE.tempFlagAPI.clear, [
  tempFlagAPICtrl.clear,
]);
