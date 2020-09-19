'use strict';

/* Project Modules */
var ROUTE       = require('../utils/yamlResources').get('ROUTE');
var routeLoader = require('../utils/routeLoader');

var systemConfigPageCtrl = require('../controllers/systemConfigPageCtrl');

routeLoader.load(ROUTE.systemConfigPage.list, [
  systemConfigPageCtrl.list,
]);
