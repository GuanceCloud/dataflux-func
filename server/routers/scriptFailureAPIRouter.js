'use strict';

/* Project Modules */
var ROUTE       = require('../utils/yamlResources').get('ROUTE');
var routeLoader = require('../utils/routeLoader');

var scriptFailureAPICtrl = require('../controllers/scriptFailureAPICtrl');

routeLoader.load(ROUTE.scriptFailureAPI.list, [
  scriptFailureAPICtrl.list,
]);
