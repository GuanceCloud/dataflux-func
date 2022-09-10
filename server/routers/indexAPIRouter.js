'use strict';

/* Project Modules */
var ROUTE        = require('../utils/yamlResources').get('ROUTE');
var routeLoader  = require('../utils/routeLoader');
var captcha      = require('../utils/captcha');

var indexAPICtrl = require('../controllers/indexAPICtrl');

routeLoader.load(ROUTE.indexAPI.index, [
  indexAPICtrl.index,
]);

routeLoader.load(ROUTE.indexAPI.clientConfig, [
  indexAPICtrl.clientConfig,
]);

routeLoader.load(ROUTE.indexAPI.imageInfo, [
  indexAPICtrl.imageInfo,
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

routeLoader.load(ROUTE.indexAPI.testThrowError, [
  indexAPICtrl.testThrowError,
]);

routeLoader.load(ROUTE.indexAPI.testThrowErrorInAsync, [
  indexAPICtrl.testThrowErrorInAsync,
]);

routeLoader.load(ROUTE.indexAPI.testSlowAPI, [
  indexAPICtrl.testSlowAPI,
]);
