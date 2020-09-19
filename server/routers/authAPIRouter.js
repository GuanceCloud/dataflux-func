'use strict';

/* Project Modules */
var ROUTE       = require('../utils/yamlResources').get('ROUTE');
var routeLoader = require('../utils/routeLoader');
var captcha     = require('../utils/captcha');

var authAPICtrl = require('../controllers/authAPICtrl');

routeLoader.load(ROUTE.authAPI.signIn, [
  captcha.createVerifyCaptchaHandler('signIn'),
  authAPICtrl.signIn,
]);

routeLoader.load(ROUTE.authAPI.signOut, [
  authAPICtrl.signOut,
]);

routeLoader.load(ROUTE.authAPI.changePassword, [
  captcha.createVerifyCaptchaHandler('changePassword'),
  authAPICtrl.changePassword,
]);

routeLoader.load(ROUTE.authAPI.profile, [
  authAPICtrl.profile,
]);

routeLoader.load(ROUTE.authAPI.modifyProfile, [
  authAPICtrl.modifyProfile,
]);
