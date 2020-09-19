'use strict';

/* Project Modules */
var ROUTE       = require('../utils/yamlResources').get('ROUTE');
var routeLoader = require('../utils/routeLoader');

var scriptPublishHistoryAPICtrl = require('../controllers/scriptPublishHistoryAPICtrl');

routeLoader.load(ROUTE.scriptPublishHistoryAPI.list, [
  scriptPublishHistoryAPICtrl.list,
]);
