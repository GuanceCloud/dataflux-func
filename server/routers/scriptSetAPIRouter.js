'use strict';

/* Project Modules */
var ROUTE       = require('../utils/yamlResources').get('ROUTE');
var routeLoader = require('../utils/routeLoader');

var scriptSetAPICtrl = require('../controllers/scriptSetAPICtrl');

routeLoader.load(ROUTE.scriptSetAPI.list, [
  scriptSetAPICtrl.list,
]);

routeLoader.load(ROUTE.scriptSetAPI.add, [
  scriptSetAPICtrl.add,
]);

routeLoader.load(ROUTE.scriptSetAPI.modify, [
  scriptSetAPICtrl.modify,
]);

routeLoader.load(ROUTE.scriptSetAPI.delete, [
  scriptSetAPICtrl.delete,
]);

routeLoader.load(ROUTE.scriptSetAPI.clone, [
  scriptSetAPICtrl.clone,
]);

routeLoader.load(ROUTE.scriptSetAPI.export, [
  scriptSetAPICtrl.export,
]);

routeLoader.load(ROUTE.scriptSetAPI.import, [
  scriptSetAPICtrl.import,
]);

routeLoader.load(ROUTE.scriptSetAPI.confirmImport, [
  scriptSetAPICtrl.confirmImport,
]);
