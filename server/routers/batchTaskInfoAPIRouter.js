'use strict';

/* Project Modules */
var ROUTE       = require('../utils/yamlResources').get('ROUTE');
var routeLoader = require('../utils/routeLoader');

var batchTaskInfoAPICtrl = require('../controllers/batchTaskInfoAPICtrl');

routeLoader.load(ROUTE.batchTaskInfoAPI.list, [
  batchTaskInfoAPICtrl.list,
]);
