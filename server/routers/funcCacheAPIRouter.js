'use strict';

/* Project Modules */
var ROUTE       = require('../utils/yamlResources').get('ROUTE');
var routeLoader = require('../utils/routeLoader');

var funcCacheAPICtrl = require('../controllers/funcCacheAPICtrl');

routeLoader.load(ROUTE.funcCacheAPI.list, [
  funcCacheAPICtrl.list,
]);

routeLoader.load(ROUTE.funcCacheAPI.get, [
  funcCacheAPICtrl.get,
]);

routeLoader.load(ROUTE.funcCacheAPI.delete, [
  funcCacheAPICtrl.delete,
]);
