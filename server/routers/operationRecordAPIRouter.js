'use strict';

/* Project Modules */
var ROUTE       = require('../utils/yamlResources').get('ROUTE');
var routeLoader = require('../utils/routeLoader');

var operationRecordAPICtrl = require('../controllers/operationRecordAPICtrl');

routeLoader.load(ROUTE.operationRecordAPI.list, [
  operationRecordAPICtrl.list,
]);
