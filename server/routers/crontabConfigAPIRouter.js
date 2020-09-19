'use strict';

/* Project Modules */
var ROUTE       = require('../utils/yamlResources').get('ROUTE');
var routeLoader = require('../utils/routeLoader');

var crontabConfigAPICtrl = require('../controllers/crontabConfigAPICtrl');

routeLoader.load(ROUTE.crontabConfigAPI.list, [
  crontabConfigAPICtrl.list,
]);

routeLoader.load(ROUTE.crontabConfigAPI.add, [
  crontabConfigAPICtrl.add,
]);

routeLoader.load(ROUTE.crontabConfigAPI.modify, [
  crontabConfigAPICtrl.modify,
]);

routeLoader.load(ROUTE.crontabConfigAPI.delete, [
  crontabConfigAPICtrl.delete,
]);
