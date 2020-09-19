'use strict';

/* Project Modules */
var ROUTE       = require('../utils/yamlResources').get('ROUTE');
var routeLoader = require('../utils/routeLoader');

var indexPageCtrl = require('../controllers/indexPageCtrl');

routeLoader.load(ROUTE.indexPage.index, [
  indexPageCtrl.index,
]);

routeLoader.load(ROUTE.indexPage.dashboard, [
  indexPageCtrl.dashboard,
]);

routeLoader.load(ROUTE.indexPage.authError, [
  indexPageCtrl.authError,
]);
