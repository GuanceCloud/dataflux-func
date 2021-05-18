'use strict';

/* Project Modules */
var ROUTE       = require('../utils/yamlResources').get('ROUTE');
var CONFIG      = require('../utils/yamlResources').get('CONFIG');
var routeLoader = require('../utils/routeLoader');
var captcha     = require('../utils/captcha');

var mainFuncAPICtrl = require('../controllers/mainFuncAPICtrl');

// 总览
routeLoader.load(ROUTE.datafluxFuncAPI.overview, [
  mainFuncAPICtrl.overview,
]);

// 函数
routeLoader.load(ROUTE.datafluxFuncAPI.describeFunc, [
  mainFuncAPICtrl.describeFunc,
]);

// 直接调用函数
routeLoader.load(ROUTE.datafluxFuncAPI.callFunc, [
  mainFuncAPICtrl.callFunc,
]);

// 通过授权链接调用函数
routeLoader.load(ROUTE.datafluxFuncAPI.callAuthLinkByGet, [
  mainFuncAPICtrl.callAuthLink,
]);
routeLoader.load(ROUTE.datafluxFuncAPI.callAuthLinkByGetWithFormat, [
  mainFuncAPICtrl.callAuthLink,
]);
routeLoader.load(ROUTE.datafluxFuncAPI.callAuthLinkByPost, [
  mainFuncAPICtrl.callAuthLink,
]);
routeLoader.load(ROUTE.datafluxFuncAPI.callAuthLinkByPostWithFormat, [
  mainFuncAPICtrl.callAuthLink,
]);

// 通过批处理调用
routeLoader.load(ROUTE.datafluxFuncAPI.callBatchByGet, [
  mainFuncAPICtrl.callBatch,
]);
routeLoader.load(ROUTE.datafluxFuncAPI.callBatchByGetWithFormat, [
  mainFuncAPICtrl.callBatch,
]);
routeLoader.load(ROUTE.datafluxFuncAPI.callBatchByPost, [
  mainFuncAPICtrl.callBatch,
]);

// 调用函数草稿
routeLoader.load(ROUTE.datafluxFuncAPI.callFuncDraft, [
  mainFuncAPICtrl.callFuncDraft,
]);

// 获取函数结果
routeLoader.load(ROUTE.datafluxFuncAPI.getFuncResult, [
  mainFuncAPICtrl.getFuncResult,
]);

// 获取函数文档（JSON文档）
routeLoader.load(ROUTE.datafluxFuncAPI.getFuncList, [
  mainFuncAPICtrl.getFuncList,
]);

// 获取函数Tag列表
routeLoader.load(ROUTE.datafluxFuncAPI.getFuncTagList, [
  mainFuncAPICtrl.getFuncTagList,
]);

// 获取授权链接函数文档（JSON文档）
routeLoader.load(ROUTE.datafluxFuncAPI.getAuthLinkFuncList, [
  mainFuncAPICtrl.getAuthLinkFuncList,
]);

// 获取系统配置
routeLoader.load(ROUTE.datafluxFuncAPI.getSystemConfig, [
  mainFuncAPICtrl.getSystemConfig,
]);

// 获取升级信息
routeLoader.load(ROUTE.datafluxFuncAPI.getUpgradeInfo, [
  mainFuncAPICtrl.getUpgradeInfo,
]);

// 集成登录
routeLoader.load(ROUTE.datafluxFuncAPI.integratedSignIn, [
  mainFuncAPICtrl.integratedSignIn,
]);

// 清空日志/缓存表
routeLoader.load(ROUTE.datafluxFuncAPI.clearLogCacheTables, [
  mainFuncAPICtrl.clearLogCacheTables,
]);

// Python包
routeLoader.load(ROUTE.datafluxFuncAPI.queryPythonPackages, [
  mainFuncAPICtrl.queryPythonPackages,
]);
routeLoader.load(ROUTE.datafluxFuncAPI.listInstalledPythonPackages, [
  mainFuncAPICtrl.listInstalledPythonPackages,
]);
routeLoader.load(ROUTE.datafluxFuncAPI.getPythonPackageInstallStatus, [
  mainFuncAPICtrl.getPythonPackageInstallStatus,
]);
routeLoader.load(ROUTE.datafluxFuncAPI.installPythonPackage, [
  mainFuncAPICtrl.installPythonPackage,
]);

// 资源文件
routeLoader.load(ROUTE.datafluxFuncAPI.listResources, [
  mainFuncAPICtrl.listResources,
]);
routeLoader.load(ROUTE.datafluxFuncAPI.getResources, [
  mainFuncAPICtrl.getResources,
]);
routeLoader.load(ROUTE.datafluxFuncAPI.downloadResources, [
  mainFuncAPICtrl.downloadResources,
]);
routeLoader.load(ROUTE.datafluxFuncAPI.uploadResource, [
  mainFuncAPICtrl.uploadResource,
]);
routeLoader.load(ROUTE.datafluxFuncAPI.operateResource, [
  mainFuncAPICtrl.operateResource,
]);

// 文件服务
routeLoader.load(ROUTE.datafluxFuncAPI.fileService, [
  mainFuncAPICtrl.fileService,
]);
