'use strict';

/* Project Modules */
var ROUTE       = require('../utils/yamlResources').get('ROUTE');
var routeLoader = require('../utils/routeLoader');

var mainFuncPageCtrl = require('../controllers/mainFuncPageCtrl');

routeLoader.load(ROUTE.datafluxFuncPage.clientApp, [
  mainFuncPageCtrl.clientApp,
]);
