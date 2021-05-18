'use strict';

/* Project Modules */
var ROUTE       = require('../utils/yamlResources').get('ROUTE');
var CONFIG      = require('../utils/yamlResources').get('CONFIG');
var routeLoader = require('../utils/routeLoader');
var captcha     = require('../utils/captcha');

var mainAPICtrl = require('../controllers/mainAPICtrl');

// 总览
routeLoader.load(ROUTE.datafluxFuncAPI.overview, [
  mainAPICtrl.overview,
]);

// 函数
routeLoader.load(ROUTE.datafluxFuncAPI.describeFunc, [
  mainAPICtrl.describeFunc,
]);

// 直接调用函数
routeLoader.load(ROUTE.datafluxFuncAPI.callFunc, [
  mainAPICtrl.callFunc,
]);

// 通过授权链接调用函数
routeLoader.load(ROUTE.datafluxFuncAPI.callAuthLinkByGet, [
  mainAPICtrl.callAuthLink,
]);
routeLoader.load(ROUTE.datafluxFuncAPI.callAuthLinkByGetWithFormat, [
  mainAPICtrl.callAuthLink,
]);
routeLoader.load(ROUTE.datafluxFuncAPI.callAuthLinkByPost, [
  mainAPICtrl.callAuthLink,
]);
routeLoader.load(ROUTE.datafluxFuncAPI.callAuthLinkByPostWithFormat, [
  mainAPICtrl.callAuthLink,
]);

// 通过批处理调用
routeLoader.load(ROUTE.datafluxFuncAPI.callBatchByGet, [
  mainAPICtrl.callBatch,
]);
routeLoader.load(ROUTE.datafluxFuncAPI.callBatchByGetWithFormat, [
  mainAPICtrl.callBatch,
]);
routeLoader.load(ROUTE.datafluxFuncAPI.callBatchByPost, [
  mainAPICtrl.callBatch,
]);

// 调用函数草稿
routeLoader.load(ROUTE.datafluxFuncAPI.callFuncDraft, [
  mainAPICtrl.callFuncDraft,
]);

// 获取函数结果
routeLoader.load(ROUTE.datafluxFuncAPI.getFuncResult, [
  mainAPICtrl.getFuncResult,
]);

// 获取函数文档（JSON文档）
routeLoader.load(ROUTE.datafluxFuncAPI.getFuncList, [
  mainAPICtrl.getFuncList,
]);

// 获取函数Tag列表
routeLoader.load(ROUTE.datafluxFuncAPI.getFuncTagList, [
  mainAPICtrl.getFuncTagList,
]);

// 获取授权链接函数文档（JSON文档）
routeLoader.load(ROUTE.datafluxFuncAPI.getAuthLinkFuncList, [
  mainAPICtrl.getAuthLinkFuncList,
]);

// 获取系统配置
routeLoader.load(ROUTE.datafluxFuncAPI.getSystemConfig, [
  mainAPICtrl.getSystemConfig,
]);

// 获取升级信息
routeLoader.load(ROUTE.datafluxFuncAPI.getUpgradeInfo, [
  mainAPICtrl.getUpgradeInfo,
]);

// 集成登录
routeLoader.load(ROUTE.datafluxFuncAPI.integratedSignIn, [
  mainAPICtrl.integratedSignIn,
]);

// 清空日志/缓存表
routeLoader.load(ROUTE.datafluxFuncAPI.clearLogCacheTables, [
  mainAPICtrl.clearLogCacheTables,
]);

// Python包
routeLoader.load(ROUTE.datafluxFuncAPI.queryPythonPackages, [
  mainAPICtrl.queryPythonPackages,
]);
routeLoader.load(ROUTE.datafluxFuncAPI.listInstalledPythonPackages, [
  mainAPICtrl.listInstalledPythonPackages,
]);
routeLoader.load(ROUTE.datafluxFuncAPI.getPythonPackageInstallStatus, [
  mainAPICtrl.getPythonPackageInstallStatus,
]);
routeLoader.load(ROUTE.datafluxFuncAPI.installPythonPackage, [
  mainAPICtrl.installPythonPackage,
]);

// 资源文件
routeLoader.load(ROUTE.datafluxFuncAPI.listResources, [
  mainAPICtrl.listResources,
]);
routeLoader.load(ROUTE.datafluxFuncAPI.getResources, [
  mainAPICtrl.getResources,
]);
routeLoader.load(ROUTE.datafluxFuncAPI.downloadResources, [
  mainAPICtrl.downloadResources,
]);
routeLoader.load(ROUTE.datafluxFuncAPI.uploadResource, [
  mainAPICtrl.uploadResource,
]);
routeLoader.load(ROUTE.datafluxFuncAPI.operateResource, [
  mainAPICtrl.operateResource,
]);

// 文件服务
routeLoader.load(ROUTE.datafluxFuncAPI.fileService, [
  mainAPICtrl.fileService,
]);
