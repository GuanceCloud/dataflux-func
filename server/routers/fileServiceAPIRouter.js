'use strict';

/* Project Modules */
var ROUTE       = require('../utils/yamlResources').get('ROUTE');
var routeLoader = require('../utils/routeLoader');

var fileServiceAPICtrl = require('../controllers/fileServiceAPICtrl');

routeLoader.load(ROUTE.fileServiceAPI.list, [
  fileServiceAPICtrl.list,
]);

routeLoader.load(ROUTE.fileServiceAPI.add, [
  fileServiceAPICtrl.add,
]);

routeLoader.load(ROUTE.fileServiceAPI.modify, [
  fileServiceAPICtrl.modify,
]);

routeLoader.load(ROUTE.fileServiceAPI.delete, [
  fileServiceAPICtrl.delete,
]);
