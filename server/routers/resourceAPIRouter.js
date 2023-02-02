'use strict';

/* Project Modules */
var ROUTE       = require('../utils/yamlResources').get('ROUTE');
var CONFIG      = require('../utils/yamlResources').get('CONFIG');
var routeLoader = require('../utils/routeLoader');

var operationRecordMid = require('../middlewares/operationRecordMid');
var resourceAPICtrl    = require('../controllers/resourceAPICtrl');

routeLoader.load(ROUTE.resourceAPI.list, [
  resourceAPICtrl.list,
]);

routeLoader.load(ROUTE.resourceAPI.get, [
  resourceAPICtrl.get,
]);

routeLoader.load(ROUTE.resourceAPI.download, [
  resourceAPICtrl.download,
]);

routeLoader.load(ROUTE.resourceAPI.upload, [
  operationRecordMid.prepare,
  resourceAPICtrl.upload,
]);

routeLoader.load(ROUTE.resourceAPI.operate, [
  resourceAPICtrl.operate,
]);
