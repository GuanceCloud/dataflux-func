'use strict';

/* Project Modules */
var ROUTE       = require('../utils/yamlResources').get('ROUTE');
var routeLoader = require('../utils/routeLoader');
var captcha     = require('../utils/captcha');

var datafluxFuncAPICtrl = require('../controllers/datafluxFuncAPICtrl');

// 集成登录
routeLoader.load(ROUTE.datafluxFuncAPI.integratedSignIn, [
  datafluxFuncAPICtrl.integratedSignIn,
]);

// 总览
routeLoader.load(ROUTE.datafluxFuncAPI.overview, [
  datafluxFuncAPICtrl.overview,
]);

// 函数
routeLoader.load(ROUTE.datafluxFuncAPI.describeFunc, [
  datafluxFuncAPICtrl.describeFunc,
]);

// 直接调用函数
routeLoader.load(ROUTE.datafluxFuncAPI.callFunc, [
  datafluxFuncAPICtrl.callFunc,
]);

// 通过授权链接调用函数
routeLoader.load(ROUTE.datafluxFuncAPI.callAuthLinkByGet, [
  datafluxFuncAPICtrl.callAuthLink,
]);

routeLoader.load(ROUTE.datafluxFuncAPI.callAuthLinkByGetWithFormat, [
  datafluxFuncAPICtrl.callAuthLink,
]);

routeLoader.load(ROUTE.datafluxFuncAPI.callAuthLinkByPost, [
  datafluxFuncAPICtrl.callAuthLink,
]);

// 通过批处理调用
routeLoader.load(ROUTE.datafluxFuncAPI.callBatchByGet, [
  datafluxFuncAPICtrl.callBatch,
]);

routeLoader.load(ROUTE.datafluxFuncAPI.callBatchByGetWithFormat, [
  datafluxFuncAPICtrl.callBatch,
]);

routeLoader.load(ROUTE.datafluxFuncAPI.callBatchByPost, [
  datafluxFuncAPICtrl.callBatch,
]);

// 调用函数草稿
routeLoader.load(ROUTE.datafluxFuncAPI.callFuncDraft, [
  datafluxFuncAPICtrl.callFuncDraft,
]);

// 获取函数结果
routeLoader.load(ROUTE.datafluxFuncAPI.getFuncResult, [
  datafluxFuncAPICtrl.getFuncResult,
]);

// 获取函数文档（JSON文档）
routeLoader.load(ROUTE.datafluxFuncAPI.getFuncList, [
  datafluxFuncAPICtrl.getFuncList,
]);

// 获取函数Tag列表
routeLoader.load(ROUTE.datafluxFuncAPI.getFuncTagList, [
  datafluxFuncAPICtrl.getFuncTagList,
]);

// 获取授权链接函数文档（JSON文档）
routeLoader.load(ROUTE.datafluxFuncAPI.getAuthLinkFuncList, [
  datafluxFuncAPICtrl.getAuthLinkFuncList,
]);

// 获取系统配置
routeLoader.load(ROUTE.datafluxFuncAPI.getSystemConfig, [
  datafluxFuncAPICtrl.getSystemConfig,
]);

// 获取升级信息
routeLoader.load(ROUTE.datafluxFuncAPI.getUpgradeInfo, [
  datafluxFuncAPICtrl.getUpgradeInfo,
]);
