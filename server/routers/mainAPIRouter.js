'use strict';

/* Project Modules */
var ROUTE       = require('../utils/yamlResources').get('ROUTE');
var CONFIG      = require('../utils/yamlResources').get('CONFIG');
var routeLoader = require('../utils/routeLoader');

var mainAPICtrl = require('../controllers/mainAPICtrl');

// 总览
routeLoader.load(ROUTE.mainAPI.overview, [
  mainAPICtrl.overview,
]);

// 函数
routeLoader.load(ROUTE.mainAPI.describeFunc, [
  mainAPICtrl.describeFunc,
]);

// 直接调用函数
routeLoader.load(ROUTE.mainAPI.callFunc, [
  mainAPICtrl.callFunc,
]);

// 通过授权链接调用函数
routeLoader.load(ROUTE.mainAPI.callAuthLinkByGet, [
  mainAPICtrl.callAuthLink,
]);
routeLoader.load(ROUTE.mainAPI.callAuthLinkByGetWithFormat, [
  mainAPICtrl.callAuthLink,
]);
routeLoader.load(ROUTE.mainAPI.callAuthLinkByPost, [
  mainAPICtrl.callAuthLink,
]);
routeLoader.load(ROUTE.mainAPI.callAuthLinkByPostWithFormat, [
  mainAPICtrl.callAuthLink,
]);

// 通过自动触发配置调用（手动执行）
routeLoader.load(ROUTE.mainAPI.runCrontabConfigManually, [
  mainAPICtrl.runCrontabConfigManually,
]);

// 通过批处理调用
routeLoader.load(ROUTE.mainAPI.callBatchByGet, [
  mainAPICtrl.callBatch,
]);
routeLoader.load(ROUTE.mainAPI.callBatchByGetWithFormat, [
  mainAPICtrl.callBatch,
]);
routeLoader.load(ROUTE.mainAPI.callBatchByPost, [
  mainAPICtrl.callBatch,
]);
routeLoader.load(ROUTE.mainAPI.callBatchByPostWithFormat, [
  mainAPICtrl.callBatch,
]);

// 调用函数草稿
routeLoader.load(ROUTE.mainAPI.callFuncDraft, [
  mainAPICtrl.callFuncDraft,
]);

// 获取函数文档（JSON文档）
routeLoader.load(ROUTE.mainAPI.getFuncList, [
  mainAPICtrl.getFuncList,
]);

// 获取函数标签列表
routeLoader.load(ROUTE.mainAPI.getFuncTagList, [
  mainAPICtrl.getFuncTagList,
]);

// 获取授权链接函数文档（JSON文档）
routeLoader.load(ROUTE.mainAPI.getAuthLinkFuncList, [
  mainAPICtrl.getAuthLinkFuncList,
]);

// 集成登录
routeLoader.load(ROUTE.mainAPI.integratedSignIn, [
  mainAPICtrl.integratedSignIn,
]);

// 文件服务
routeLoader.load(ROUTE.mainAPI.fileService, [
  mainAPICtrl.fileService,
]);
