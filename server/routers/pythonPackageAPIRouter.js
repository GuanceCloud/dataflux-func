'use strict';

/* Project Modules */
var ROUTE       = require('../utils/yamlResources').get('ROUTE');
var CONFIG      = require('../utils/yamlResources').get('CONFIG');
var routeLoader = require('../utils/routeLoader');

var pythonPackageAPICtrl = require('../controllers/pythonPackageAPICtrl');

routeLoader.load(ROUTE.pythonPackageAPI.listInstalled, [
  pythonPackageAPICtrl.listInstalled,
]);

routeLoader.load(ROUTE.pythonPackageAPI.getInstallStatus, [
  pythonPackageAPICtrl.getInstallStatus,
]);

routeLoader.load(ROUTE.pythonPackageAPI.clearInstallStatus, [
  pythonPackageAPICtrl.clearInstallStatus,
]);

routeLoader.load(ROUTE.pythonPackageAPI.install, [
  pythonPackageAPICtrl.install,
]);

