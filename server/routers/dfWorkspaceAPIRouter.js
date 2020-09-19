'use strict';

/* Project Modules */
var ROUTE       = require('../utils/yamlResources').get('ROUTE');
var routeLoader = require('../utils/routeLoader');
var captcha     = require('../utils/captcha');

var dfWorkspaceAPICtrl = require('../controllers/dfWorkspaceAPICtrl');

routeLoader.load(ROUTE.dfWorkspaceAPI.list, [
  dfWorkspaceAPICtrl.list,
]);
