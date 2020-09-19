'use strict';

/* Project Modules */
var ROUTE        = require('../utils/yamlResources').get('ROUTE');
var routeLoader  = require('../utils/routeLoader');
var authPageCtrl = require('../controllers/authPageCtrl');

routeLoader.load(ROUTE.authPage.signIn, [
  authPageCtrl.signIn,
]);

routeLoader.load(ROUTE.authPage.signOut, [
  authPageCtrl.signOut,
]);

routeLoader.load(ROUTE.authPage.changePassword, [
  authPageCtrl.changePassword,
]);

routeLoader.load(ROUTE.authPage.profile, [
  authPageCtrl.profile,
]);
