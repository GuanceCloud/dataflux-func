'use strict';

/* Project Modules */
var ROUTE       = require('../utils/yamlResources').get('ROUTE');
var routeLoader = require('../utils/routeLoader');

var datafluxFuncPageCtrl = require('../controllers/datafluxFuncPageCtrl');

routeLoader.load(ROUTE.datafluxFuncPage.clientApp, [
  datafluxFuncPageCtrl.clientApp,
]);
