'use strict';

/* Project Modules */
var ROUTE       = require('../utils/yamlResources').get('ROUTE');
var routeLoader = require('../utils/routeLoader');

var scriptLogAPICtrl = require('../controllers/scriptLogAPICtrl');

routeLoader.load(ROUTE.scriptLogAPI.list, [
  scriptLogAPICtrl.list,
]);
