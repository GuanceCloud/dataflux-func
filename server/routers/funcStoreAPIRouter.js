'use strict';

/* Project Modules */
var ROUTE       = require('../utils/yamlResources').get('ROUTE');
var routeLoader = require('../utils/routeLoader');

var funcStoreAPICtrl = require('../controllers/funcStoreAPICtrl');

routeLoader.load(ROUTE.funcStoreAPI.list, [
  funcStoreAPICtrl.list,
]);

routeLoader.load(ROUTE.funcStoreAPI.get, [
  funcStoreAPICtrl.get,
]);

routeLoader.load(ROUTE.funcStoreAPI.delete, [
  funcStoreAPICtrl.delete,
]);
