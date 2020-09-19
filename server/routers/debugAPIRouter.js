'use strict';

/* Project Modules */
var ROUTE       = require('../utils/yamlResources').get('ROUTE');
var routeLoader = require('../utils/routeLoader');

var debugAPICtrl = require('../controllers/debugAPICtrl');

routeLoader.load(ROUTE.debugAPI.putTask, [
  debugAPICtrl.putTask,
]);
