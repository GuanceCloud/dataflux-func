'use strict';

/* Project Modules */
var ROUTE       = require('../utils/yamlResources').get('ROUTE');
var routeLoader = require('../utils/routeLoader');

var mainPageCtrl = require('../controllers/mainPageCtrl');

routeLoader.load(ROUTE.mainPage.clientApp, [
  mainPageCtrl.clientApp,
]);
