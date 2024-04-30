'use strict';

/* Project Modules */
var ROUTE       = require('../utils/yamlResources').get('ROUTE');
var routeLoader = require('../utils/routeLoader');

var crontabScheduleAPICtrl = require('../controllers/crontabScheduleAPICtrl');

// 兼容处理
routeLoader.load(ROUTE.crontabConfigAPI.list, [
  crontabScheduleAPICtrl.list,
]);

routeLoader.load(ROUTE.crontabConfigAPI.listRecentTriggered, [
  crontabScheduleAPICtrl.listRecentTriggered,
]);

routeLoader.load(ROUTE.crontabConfigAPI.add, [
  crontabScheduleAPICtrl.add,
]);

routeLoader.load(ROUTE.crontabConfigAPI.modify, [
  crontabScheduleAPICtrl.modify,
]);

routeLoader.load(ROUTE.crontabConfigAPI.delete, [
  crontabScheduleAPICtrl.delete,
]);

routeLoader.load(ROUTE.crontabConfigAPI.addMany, [
  crontabScheduleAPICtrl.addMany,
]);

routeLoader.load(ROUTE.crontabConfigAPI.modifyMany, [
  crontabScheduleAPICtrl.modifyMany,
]);

routeLoader.load(ROUTE.crontabConfigAPI.deleteMany, [
  crontabScheduleAPICtrl.deleteMany,
]);
