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

// 通过同步 API 调用函数
routeLoader.load(ROUTE.mainAPI.callSyncAPIByGet, [
  mainAPICtrl.callSyncAPI,
]);
routeLoader.load(ROUTE.mainAPI.callSyncAPIByGetWithFormat, [
  mainAPICtrl.callSyncAPI,
]);
routeLoader.load(ROUTE.mainAPI.callSyncAPIByPost, [
  mainAPICtrl.callSyncAPI,
]);
routeLoader.load(ROUTE.mainAPI.callSyncAPIByPostWithFormat, [
  mainAPICtrl.callSyncAPI,
]);

// 通过异步 API 调用
routeLoader.load(ROUTE.mainAPI.callAsyncAPIByGet, [
  mainAPICtrl.callAsyncAPI,
]);
routeLoader.load(ROUTE.mainAPI.callAsyncAPIByGetWithFormat, [
  mainAPICtrl.callAsyncAPI,
]);
routeLoader.load(ROUTE.mainAPI.callAsyncAPIByPost, [
  mainAPICtrl.callAsyncAPI,
]);
routeLoader.load(ROUTE.mainAPI.callAsyncAPIByPostWithFormat, [
  mainAPICtrl.callAsyncAPI,
]);

// 手动触发一次定时任务
routeLoader.load(ROUTE.mainAPI.runCronJobManually, [
  mainAPICtrl.runCronJobManually,
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

// 获取 API 文档（JSON文档）
routeLoader.load(ROUTE.mainAPI.getFuncAPIList, [
  mainAPICtrl.getFuncAPIList,
]);

// 集成登录
routeLoader.load(ROUTE.mainAPI.integratedSignIn, [
  mainAPICtrl.integratedSignIn,
]);

// 文件服务
routeLoader.load(ROUTE.mainAPI.fileService, [
  mainAPICtrl.fileService,
]);

// 兼容处理
// 通过授权链接调用函数
routeLoader.load(ROUTE.mainAPI.callAuthLinkByGet, [
  mainAPICtrl.callSyncAPI,
]);
routeLoader.load(ROUTE.mainAPI.callAuthLinkByGetWithFormat, [
  mainAPICtrl.callSyncAPI,
]);
routeLoader.load(ROUTE.mainAPI.callAuthLinkByPost, [
  mainAPICtrl.callSyncAPI,
]);
routeLoader.load(ROUTE.mainAPI.callAuthLinkByPostWithFormat, [
  mainAPICtrl.callSyncAPI,
]);

// 手动执行一次自动触发配置
routeLoader.load(ROUTE.mainAPI.runCrontabConfigManually, [
  mainAPICtrl.runCronJobManually,
]);

// 通过批处理调用
routeLoader.load(ROUTE.mainAPI.callBatchByGet, [
  mainAPICtrl.callAsyncAPI,
]);
routeLoader.load(ROUTE.mainAPI.callBatchByGetWithFormat, [
  mainAPICtrl.callAsyncAPI,
]);
routeLoader.load(ROUTE.mainAPI.callBatchByPost, [
  mainAPICtrl.callAsyncAPI,
]);
routeLoader.load(ROUTE.mainAPI.callBatchByPostWithFormat, [
  mainAPICtrl.callAsyncAPI,
]);

// 获取授权链接文档（JSON文档）
routeLoader.load(ROUTE.mainAPI.getAuthLinkFuncList, [
  function(req, res, next) {
    req.query.apiType = 'syncAPI';
    return next();
  },
  mainAPICtrl.getFuncAPIList,
]);
