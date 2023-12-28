'use strict';

/* Project Modules */
var ROUTE       = require('../utils/yamlResources').get('ROUTE');
var routeLoader = require('../utils/routeLoader');

var temporaryFlagAPICtrl = require('../controllers/temporaryFlagAPICtrl');

routeLoader.load(ROUTE.temporaryFlagAPI.get, [
  temporaryFlagAPICtrl.get,
]);

routeLoader.load(ROUTE.temporaryFlagAPI.set, [
  temporaryFlagAPICtrl.set,
]);

routeLoader.load(ROUTE.temporaryFlagAPI.clear, [
  temporaryFlagAPICtrl.clear,
]);
