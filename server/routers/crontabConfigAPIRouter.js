'use strict';

/* Project Modules */
var ROUTE       = require('../utils/yamlResources').get('ROUTE');
var routeLoader = require('../utils/routeLoader');

var cronJobAPICtrl = require('../controllers/cronJobAPICtrl');

// 兼容处理
routeLoader.load(ROUTE.crontabConfigAPI.list, [
  cronJobAPICtrl.list,
]);

routeLoader.load(ROUTE.crontabConfigAPI.listRecentTriggered, [
  cronJobAPICtrl.listRecentTriggered,
]);

routeLoader.load(ROUTE.crontabConfigAPI.add, [
  cronJobAPICtrl.add,
]);

routeLoader.load(ROUTE.crontabConfigAPI.modify, [
  cronJobAPICtrl.modify,
]);

routeLoader.load(ROUTE.crontabConfigAPI.delete, [
  cronJobAPICtrl.delete,
]);

routeLoader.load(ROUTE.crontabConfigAPI.addMany, [
  cronJobAPICtrl.addMany,
]);

routeLoader.load(ROUTE.crontabConfigAPI.modifyMany, [
  cronJobAPICtrl.modifyMany,
]);

routeLoader.load(ROUTE.crontabConfigAPI.deleteMany, [
  cronJobAPICtrl.deleteMany,
]);
