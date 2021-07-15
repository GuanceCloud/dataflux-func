'use strict';

/* Project Modules */
var ROUTE       = require('../utils/yamlResources').get('ROUTE');
var CONFIG      = require('../utils/yamlResources').get('CONFIG');
var routeLoader = require('../utils/routeLoader');
var captcha     = require('../utils/captcha');

var operationRecordMid = require('../middlewares/operationRecordMid');
var mainAPICtrl        = require('../controllers/mainAPICtrl');

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

// 调用函数草稿
routeLoader.load(ROUTE.mainAPI.callFuncDraft, [
  mainAPICtrl.callFuncDraft,
]);

// 获取函数结果
routeLoader.load(ROUTE.mainAPI.getFuncResult, [
  mainAPICtrl.getFuncResult,
]);

// 获取函数文档（JSON文档）
routeLoader.load(ROUTE.mainAPI.getFuncList, [
  mainAPICtrl.getFuncList,
]);

// 获取函数Tag列表
routeLoader.load(ROUTE.mainAPI.getFuncTagList, [
  mainAPICtrl.getFuncTagList,
]);

// 获取授权链接函数文档（JSON文档）
routeLoader.load(ROUTE.mainAPI.getAuthLinkFuncList, [
  mainAPICtrl.getAuthLinkFuncList,
]);

// 获取系统配置
routeLoader.load(ROUTE.mainAPI.getSystemConfig, [
  mainAPICtrl.getSystemConfig,
]);

// 获取升级信息
routeLoader.load(ROUTE.mainAPI.getUpgradeInfo, [
  mainAPICtrl.getUpgradeInfo,
]);

// 集成登录
routeLoader.load(ROUTE.mainAPI.integratedSignIn, [
  mainAPICtrl.integratedSignIn,
]);

// 清空日志/缓存表
routeLoader.load(ROUTE.mainAPI.clearLogCacheTables, [
  mainAPICtrl.clearLogCacheTables,
]);

// Python包
routeLoader.load(ROUTE.mainAPI.listInstalledPythonPackages, [
  mainAPICtrl.listInstalledPythonPackages,
]);
routeLoader.load(ROUTE.mainAPI.getPythonPackageInstallStatus, [
  mainAPICtrl.getPythonPackageInstallStatus,
]);
routeLoader.load(ROUTE.mainAPI.installPythonPackage, [
  mainAPICtrl.installPythonPackage,
]);

// 资源文件
routeLoader.load(ROUTE.mainAPI.listResources, [
  mainAPICtrl.listResources,
]);
routeLoader.load(ROUTE.mainAPI.getResources, [
  mainAPICtrl.getResources,
]);
routeLoader.load(ROUTE.mainAPI.downloadResources, [
  mainAPICtrl.downloadResources,
]);
routeLoader.load(ROUTE.mainAPI.uploadResource, [
  operationRecordMid.prepare,
  mainAPICtrl.uploadResource,
]);
routeLoader.load(ROUTE.mainAPI.operateResource, [
  mainAPICtrl.operateResource,
]);

// 文件服务
routeLoader.load(ROUTE.mainAPI.fileService, [
  mainAPICtrl.fileService,
]);

// 官方脚本包
routeLoader.load(ROUTE.mainAPI.getPackageIndex, [
  mainAPICtrl.getPackageIndex,
]);
routeLoader.load(ROUTE.mainAPI.installPackage, [
  mainAPICtrl.installPackage,
]);
