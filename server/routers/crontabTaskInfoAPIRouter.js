'use strict';

/* Project Modules */
var ROUTE       = require('../utils/yamlResources').get('ROUTE');
var routeLoader = require('../utils/routeLoader');

var crontabTaskInfoAPICtrl = require('../controllers/crontabTaskInfoAPICtrl');

routeLoader.load(ROUTE.crontabTaskInfoAPI.list, [
  crontabTaskInfoAPICtrl.list,
]);
