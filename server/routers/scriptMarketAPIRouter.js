'use strict';

/* Project Modules */
var ROUTE       = require('../utils/yamlResources').get('ROUTE');
var routeLoader = require('../utils/routeLoader');

var scriptMarketAPICtrl = require('../controllers/scriptMarketAPICtrl');

routeLoader.load(ROUTE.scriptMarketAPI.list, [
  scriptMarketAPICtrl.list,
]);

routeLoader.load(ROUTE.scriptMarketAPI.add, [
  scriptMarketAPICtrl.add,
]);

routeLoader.load(ROUTE.scriptMarketAPI.modify, [
  scriptMarketAPICtrl.modify,
]);

routeLoader.load(ROUTE.scriptMarketAPI.delete, [
  scriptMarketAPICtrl.delete,
]);

routeLoader.load(ROUTE.scriptMarketAPI.listScriptSets, [
  scriptMarketAPICtrl.listScriptSets,
]);

routeLoader.load(ROUTE.scriptMarketAPI.setOwner, [
  scriptMarketAPICtrl.setOwner,
]);

routeLoader.load(ROUTE.scriptMarketAPI.unsetOwner, [
  scriptMarketAPICtrl.unsetOwner,
]);

routeLoader.load(ROUTE.scriptMarketAPI.publish, [
  scriptMarketAPICtrl.publish,
]);

routeLoader.load(ROUTE.scriptMarketAPI.install, [
  scriptMarketAPICtrl.install,
]);