'use strict';

/* Project Modules */
var ROUTE       = require('../utils/yamlResources').get('ROUTE');
var routeLoader = require('../utils/routeLoader');

var slowAPICountAPICtrl = require('../controllers/slowAPICountAPICtrl');

routeLoader.load(ROUTE.slowAPICountAPI.list, [
  slowAPICountAPICtrl.list,
]);

routeLoader.load(ROUTE.slowAPICountAPI.delete, [
  slowAPICountAPICtrl.delete,
]);

routeLoader.load(ROUTE.slowAPICountAPI.clear, [
  slowAPICountAPICtrl.clear,
]);
