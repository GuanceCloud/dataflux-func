'use strict';

/* Project Modules */
var ROUTE       = require('../utils/yamlResources').get('ROUTE');
var CONFIG      = require('../utils/yamlResources').get('CONFIG');
var routeLoader = require('../utils/routeLoader');

var indexAPICtrl = require('../controllers/indexAPICtrl');

// 总览
routeLoader.load(ROUTE.indexAPI.overview, [
  indexAPICtrl.overview,
]);

// 函数
routeLoader.load(ROUTE.indexAPI.describeFunc, [
  indexAPICtrl.describeFunc,
]);

// 直接调用函数
routeLoader.load(ROUTE.indexAPI.callFunc, [
  indexAPICtrl.callFunc,
]);

// 通过授权链接调用函数
routeLoader.load(ROUTE.indexAPI.callAuthLinkByGet, [
  indexAPICtrl.callAuthLink,
]);
routeLoader.load(ROUTE.indexAPI.callAuthLinkByGetWithFormat, [
  indexAPICtrl.callAuthLink,
]);
routeLoader.load(ROUTE.indexAPI.callAuthLinkByPost, [
  indexAPICtrl.callAuthLink,
]);
routeLoader.load(ROUTE.indexAPI.callAuthLinkByPostWithFormat, [
  indexAPICtrl.callAuthLink,
]);

// 通过自动触发配置调用（手动执行）
routeLoader.load(ROUTE.indexAPI.runCrontabConfigManually, [
  indexAPICtrl.runCrontabConfigManually,
]);

// 通过批处理调用
routeLoader.load(ROUTE.indexAPI.callBatchByGet, [
  indexAPICtrl.callBatch,
]);
routeLoader.load(ROUTE.indexAPI.callBatchByGetWithFormat, [
  indexAPICtrl.callBatch,
]);
routeLoader.load(ROUTE.indexAPI.callBatchByPost, [
  indexAPICtrl.callBatch,
]);
routeLoader.load(ROUTE.indexAPI.callBatchByPostWithFormat, [
  indexAPICtrl.callBatch,
]);

// 调用函数草稿
routeLoader.load(ROUTE.indexAPI.callFuncDraft, [
  indexAPICtrl.callFuncDraft,
]);

// 获取函数结果
routeLoader.load(ROUTE.indexAPI.getFuncResult, [
  indexAPICtrl.getFuncResult,
]);

// 获取函数文档（JSON文档）
routeLoader.load(ROUTE.indexAPI.getFuncList, [
  indexAPICtrl.getFuncList,
]);

// 获取函数标签列表
routeLoader.load(ROUTE.indexAPI.getFuncTagList, [
  indexAPICtrl.getFuncTagList,
]);

// 获取授权链接函数文档（JSON文档）
routeLoader.load(ROUTE.indexAPI.getAuthLinkFuncList, [
  indexAPICtrl.getAuthLinkFuncList,
]);

// 集成登录
routeLoader.load(ROUTE.indexAPI.integratedSignIn, [
  indexAPICtrl.integratedSignIn,
]);

// 文件服务
routeLoader.load(ROUTE.indexAPI.fileService, [
  indexAPICtrl.fileService,
]);
