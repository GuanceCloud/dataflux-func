'use strict';

/* Project Modules */
var ROUTE       = require('../utils/yamlResources').get('ROUTE');
var routeLoader = require('../utils/routeLoader');

var systemSettingAPICtrl = require('../controllers/systemSettingAPICtrl');

routeLoader.load(ROUTE.systemSettingAPI.get, [
  systemSettingAPICtrl.get,
]);

routeLoader.load(ROUTE.systemSettingAPI.set, [
  systemSettingAPICtrl.set,
]);

routeLoader.load(ROUTE.systemSettingAPI.delete, [
  systemSettingAPICtrl.delete,
]);
