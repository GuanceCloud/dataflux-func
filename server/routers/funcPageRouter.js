'use strict';

/* Project Modules */
var ROUTE       = require('../utils/yamlResources').get('ROUTE');
var routeLoader = require('../utils/routeLoader');

var funcPageCtrl = require('../controllers/funcPageCtrl');

routeLoader.load(ROUTE.funcPage.list, [
  funcPageCtrl.list,
]);
