'use strict';

/* Project Modules */
var ROUTE        = require('../utils/yamlResources').get('ROUTE');
var routeLoader  = require('../utils/routeLoader');
var captcha      = require('../utils/captcha');

var indexAPICtrl = require('../controllers/indexAPICtrl');

routeLoader.load(ROUTE.indexAPI.api, [
  indexAPICtrl.api,
]);

routeLoader.load(ROUTE.indexAPI.imageInfo, [
  indexAPICtrl.imageInfo,
]);

routeLoader.load(ROUTE.indexAPI.systemInfo, [
  indexAPICtrl.systemInfo,
]);

routeLoader.load(ROUTE.indexAPI.metrics, [
  indexAPICtrl.metrics,
]);

routeLoader.load(ROUTE.indexAPI.captcha, [
  captcha.createGetCaptchaHandler(),
]);

routeLoader.load(ROUTE.indexAPI.ping, [
  indexAPICtrl.ping,
]);

routeLoader.load(ROUTE.indexAPI.echo, [
  indexAPICtrl.echo,
]);

routeLoader.load(ROUTE.indexAPI.proxy, [
  indexAPICtrl.proxy,
]);

routeLoader.load(ROUTE.indexAPI.systemReport, [
  indexAPICtrl.systemReport,
]);

routeLoader.load(ROUTE.indexAPI.detailedRedisReport, [
  indexAPICtrl.detailedRedisReport,
]);
