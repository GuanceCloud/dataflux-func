'use strict';

/* Project Modules */
var ROUTE       = require('../utils/yamlResources').get('ROUTE');
var routeLoader = require('../utils/routeLoader');

var connectorAPICtrl = require('../controllers/connectorAPICtrl');

routeLoader.load(ROUTE.connectorAPI.list, [
  connectorAPICtrl.list,
]);

routeLoader.load(ROUTE.connectorAPI.add, [
  connectorAPICtrl.add,
]);

routeLoader.load(ROUTE.connectorAPI.modify, [
  connectorAPICtrl.modify,
]);

routeLoader.load(ROUTE.connectorAPI.delete, [
  connectorAPICtrl.delete,
]);

routeLoader.load(ROUTE.connectorAPI.query, [
  connectorAPICtrl.query,
]);

routeLoader.load(ROUTE.connectorAPI.test, [
  connectorAPICtrl.test,
]);
