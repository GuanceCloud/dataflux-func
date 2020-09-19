'use strict';

/* Project Modules */
var ROUTE       = require('../utils/yamlResources').get('ROUTE');
var routeLoader = require('../utils/routeLoader');

var operationRecordMid = require('../middlewares/operationRecordMid');
var scriptSetAPICtrl   = require('../controllers/scriptSetAPICtrl');

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

routeLoader.load(ROUTE.scriptSetAPI.export, [
  scriptSetAPICtrl.export,
]);

routeLoader.load(ROUTE.scriptSetAPI.import, [
  operationRecordMid.prepare,
  scriptSetAPICtrl.import,
]);

routeLoader.load(ROUTE.scriptSetAPI.confirmImport, [
  scriptSetAPICtrl.confirmImport,
]);
