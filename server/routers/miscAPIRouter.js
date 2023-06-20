'use strict';

/* Project Modules */
var ROUTE        = require('../utils/yamlResources').get('ROUTE');
var routeLoader  = require('../utils/routeLoader');
var captcha      = require('../utils/captcha');

var miscAPICtrl = require('../controllers/miscAPICtrl');

routeLoader.load(ROUTE.miscAPI.api, [
  miscAPICtrl.api,
]);

routeLoader.load(ROUTE.miscAPI.imageInfo, [
  miscAPICtrl.imageInfo,
]);

routeLoader.load(ROUTE.miscAPI.systemInfo, [
  miscAPICtrl.systemInfo,
]);

routeLoader.load(ROUTE.miscAPI.metrics, [
  miscAPICtrl.metrics,
]);

routeLoader.load(ROUTE.miscAPI.captcha, [
  captcha.createGetCaptchaHandler(),
]);

routeLoader.load(ROUTE.miscAPI.ping, [
  miscAPICtrl.ping,
]);

routeLoader.load(ROUTE.miscAPI.echo, [
  miscAPICtrl.echo,
]);

routeLoader.load(ROUTE.miscAPI.proxy, [
  miscAPICtrl.proxy,
]);

routeLoader.load(ROUTE.miscAPI.systemReport, [
  miscAPICtrl.systemReport,
]);