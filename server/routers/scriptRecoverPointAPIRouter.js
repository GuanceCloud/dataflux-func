'use strict';

/* Project Modules */
var ROUTE       = require('../utils/yamlResources').get('ROUTE');
var routeLoader = require('../utils/routeLoader');
var captcha     = require('../utils/captcha');

var scriptRecoverPointAPICtrl = require('../controllers/scriptRecoverPointAPICtrl');

routeLoader.load(ROUTE.scriptRecoverPointAPI.list, [
  scriptRecoverPointAPICtrl.list,
]);

routeLoader.load(ROUTE.scriptRecoverPointAPI.add, [
  scriptRecoverPointAPICtrl.add,
]);

routeLoader.load(ROUTE.scriptRecoverPointAPI.recover, [
  scriptRecoverPointAPICtrl.recover,
]);
