'use strict';

/* Project Modules */
var ROUTE       = require('../utils/yamlResources').get('ROUTE');
var routeLoader = require('../utils/routeLoader');

var funcAPICtrl = require('../controllers/funcAPICtrl');

routeLoader.load(ROUTE.funcAPI.list, [
  funcAPICtrl.list,
]);
