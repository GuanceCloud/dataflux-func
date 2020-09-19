'use strict';

/* Project Modules */
var ROUTE       = require('../utils/yamlResources').get('ROUTE');
var routeLoader = require('../utils/routeLoader');

var scriptSetExportHistoryAPICtrl = require('../controllers/scriptSetExportHistoryAPICtrl');

routeLoader.load(ROUTE.scriptSetExportHistoryAPI.list, [
  scriptSetExportHistoryAPICtrl.list,
]);
