'use strict';

/* Project Modules */
var ROUTE       = require('../utils/yamlResources').get('ROUTE');
var routeLoader = require('../utils/routeLoader');

var crontabScheduleAPICtrl = require('../controllers/crontabScheduleAPICtrl');

routeLoader.load(ROUTE.crontabScheduleAPI.list, [
  crontabScheduleAPICtrl.list,
]);

routeLoader.load(ROUTE.crontabScheduleAPI.listRecentTriggered, [
  crontabScheduleAPICtrl.listRecentTriggered,
]);

routeLoader.load(ROUTE.crontabScheduleAPI.add, [
  crontabScheduleAPICtrl.add,
]);

routeLoader.load(ROUTE.crontabScheduleAPI.modify, [
  crontabScheduleAPICtrl.modify,
]);

routeLoader.load(ROUTE.crontabScheduleAPI.delete, [
  crontabScheduleAPICtrl.delete,
]);

routeLoader.load(ROUTE.crontabScheduleAPI.addMany, [
  crontabScheduleAPICtrl.addMany,
]);

routeLoader.load(ROUTE.crontabScheduleAPI.modifyMany, [
  crontabScheduleAPICtrl.modifyMany,
]);

routeLoader.load(ROUTE.crontabScheduleAPI.deleteMany, [
  crontabScheduleAPICtrl.deleteMany,
]);
