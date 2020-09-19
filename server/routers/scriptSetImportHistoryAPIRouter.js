'use strict';

/* Project Modules */
var ROUTE       = require('../utils/yamlResources').get('ROUTE');
var routeLoader = require('../utils/routeLoader');

var scriptSetImportHistoryAPICtrl = require('../controllers/scriptSetImportHistoryAPICtrl');

routeLoader.load(ROUTE.scriptSetImportHistoryAPI.list, [
  scriptSetImportHistoryAPICtrl.list,
]);
