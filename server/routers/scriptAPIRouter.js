'use strict';

/* Project Modules */
var ROUTE       = require('../utils/yamlResources').get('ROUTE');
var routeLoader = require('../utils/routeLoader');

var scriptAPICtrl = require('../controllers/scriptAPICtrl');

routeLoader.load(ROUTE.scriptAPI.list, [
  scriptAPICtrl.list,
]);

routeLoader.load(ROUTE.scriptAPI.get, [
  scriptAPICtrl.get,
]);

routeLoader.load(ROUTE.scriptAPI.add, [
  scriptAPICtrl.add,
]);

routeLoader.load(ROUTE.scriptAPI.modify, [
  scriptAPICtrl.modify,
]);

routeLoader.load(ROUTE.scriptAPI.delete, [
  scriptAPICtrl.delete,
]);

routeLoader.load(ROUTE.scriptAPI.publish, [
  scriptAPICtrl.publish,
]);
