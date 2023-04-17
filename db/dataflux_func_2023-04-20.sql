-- MySQL dump 10.13  Distrib 8.0.28, for Linux (x86_64)
--
-- Host: 127.0.0.1    Database: dataflux_func
-- ------------------------------------------------------
-- Server version	5.7.26

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `biz_main_api_auth`
--

DROP TABLE IF EXISTS `biz_main_api_auth`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `biz_main_api_auth` (
  `seq` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `name` varchar(256) DEFAULT NULL COMMENT '名称',
  `type` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '类型 fixedField|httpBasic|httpDigest|func',
  `configJSON` json NOT NULL COMMENT '配置JSON',
  `note` text COMMENT '备注',
  `createTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updateTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`seq`),
  UNIQUE KEY `ID` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='API认证';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `biz_main_api_auth`
--

LOCK TABLES `biz_main_api_auth` WRITE;
/*!40000 ALTER TABLE `biz_main_api_auth` DISABLE KEYS */;
/*!40000 ALTER TABLE `biz_main_api_auth` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `biz_main_auth_link`
--

DROP TABLE IF EXISTS `biz_main_auth_link`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `biz_main_auth_link` (
  `seq` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '兼任Token',
  `funcId` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '函数ID',
  `funcCallKwargsJSON` json DEFAULT NULL COMMENT '函数调用参数JSON (kwargs)',
  `tagsJSON` json DEFAULT NULL COMMENT '授权链接标签JSON',
  `apiAuthId` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'API认证ID',
  `expireTime` datetime DEFAULT NULL COMMENT '过期时间（NULL表示永不过期）',
  `throttlingJSON` json DEFAULT NULL COMMENT '限流JSON（value="<From Parameter>"表示从参数获取）',
  `origin` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT 'UNKNOW' COMMENT '来源',
  `originId` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT 'UNKNOW' COMMENT '来源ID',
  `showInDoc` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否在文档中显示',
  `taskInfoLimit` int(11) DEFAULT NULL COMMENT '任务记录数量',
  `isDisabled` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否禁用',
  `note` text COMMENT '备注',
  `createTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updateTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`seq`),
  UNIQUE KEY `ID` (`id`),
  KEY `ORIGIN` (`origin`),
  KEY `ORIGIN_ID` (`originId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='授权链接';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `biz_main_auth_link`
--

LOCK TABLES `biz_main_auth_link` WRITE;
/*!40000 ALTER TABLE `biz_main_auth_link` DISABLE KEYS */;
/*!40000 ALTER TABLE `biz_main_auth_link` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `biz_main_batch`
--

DROP TABLE IF EXISTS `biz_main_batch`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `biz_main_batch` (
  `seq` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '兼任Token',
  `funcId` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '函数ID',
  `funcCallKwargsJSON` json DEFAULT NULL COMMENT '函数调用参数JSON (kwargs)',
  `tagsJSON` json DEFAULT NULL COMMENT '批处理标签JSON',
  `apiAuthId` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'API认证ID',
  `origin` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT 'UNKNOW' COMMENT '来源',
  `originId` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT 'UNKNOW' COMMENT '来源ID',
  `showInDoc` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否在文档中显示',
  `taskInfoLimit` int(11) DEFAULT NULL COMMENT '任务记录数量',
  `isDisabled` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否禁用',
  `note` text COMMENT '备注',
  `createTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updateTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`seq`),
  UNIQUE KEY `ID` (`id`),
  KEY `ORIGIN` (`origin`),
  KEY `ORIGIN_ID` (`originId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='批处理';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `biz_main_batch`
--

LOCK TABLES `biz_main_batch` WRITE;
/*!40000 ALTER TABLE `biz_main_batch` DISABLE KEYS */;
/*!40000 ALTER TABLE `biz_main_batch` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `biz_main_batch_task_info`
--

DROP TABLE IF EXISTS `biz_main_batch_task_info`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `biz_main_batch_task_info` (
  `seq` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `batchId` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '批处理ID',
  `rootTaskId` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT 'ROOT' COMMENT '主任务ID',
  `funcId` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '函数ID',
  `scriptPublishVersion` bigint(20) DEFAULT NULL COMMENT '脚本发布版本',
  `queueTime` timestamp NULL DEFAULT NULL COMMENT '入队时间',
  `startTime` timestamp NULL DEFAULT NULL COMMENT '启动时间',
  `endTime` timestamp NULL DEFAULT NULL COMMENT '结束时间',
  `status` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT 'queued' COMMENT '状态 queued|pending|success|failure',
  `logMessageTEXT` longtext COMMENT '日志信息TEXT',
  `einfoTEXT` longtext COMMENT '错误信息TEXT',
  `createTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updateTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`seq`),
  UNIQUE KEY `ID` (`id`),
  KEY `BATCH_ID` (`batchId`),
  KEY `ROOT_TASK_ID` (`rootTaskId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='批处理任务信息';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `biz_main_batch_task_info`
--

LOCK TABLES `biz_main_batch_task_info` WRITE;
/*!40000 ALTER TABLE `biz_main_batch_task_info` DISABLE KEYS */;
/*!40000 ALTER TABLE `biz_main_batch_task_info` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `biz_main_blueprint`
--

DROP TABLE IF EXISTS `biz_main_blueprint`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `biz_main_blueprint` (
  `seq` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `title` varchar(256) DEFAULT NULL COMMENT '标题',
  `canvasJSON` json NOT NULL COMMENT '画布JSON',
  `isDeployed` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否已部署',
  `createTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updateTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`seq`),
  UNIQUE KEY `ID` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='蓝图';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `biz_main_blueprint`
--

LOCK TABLES `biz_main_blueprint` WRITE;
/*!40000 ALTER TABLE `biz_main_blueprint` DISABLE KEYS */;
/*!40000 ALTER TABLE `biz_main_blueprint` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `biz_main_connector`
--

DROP TABLE IF EXISTS `biz_main_connector`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `biz_main_connector` (
  `seq` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `title` varchar(256) DEFAULT NULL COMMENT '标题',
  `description` text COMMENT '描述',
  `type` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '类型 influxdb|mysql|redis|..',
  `configJSON` json NOT NULL COMMENT '配置JSON',
  `isBuiltin` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否为内建连接器',
  `pinTime` datetime DEFAULT NULL COMMENT '置顶时间',
  `createTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updateTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`seq`),
  UNIQUE KEY `ID` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='连接器';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `biz_main_connector`
--

LOCK TABLES `biz_main_connector` WRITE;
/*!40000 ALTER TABLE `biz_main_connector` DISABLE KEYS */;
/*!40000 ALTER TABLE `biz_main_connector` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `biz_main_crontab_config`
--

DROP TABLE IF EXISTS `biz_main_crontab_config`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `biz_main_crontab_config` (
  `seq` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `funcId` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '函数ID',
  `funcCallKwargsJSON` json DEFAULT NULL COMMENT '函数调用参数JSON (kwargs)',
  `crontab` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT '执行频率（Crontab语法）',
  `tagsJSON` json DEFAULT NULL COMMENT '自动触发配置标签JSON',
  `saveResult` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否需要保存结果',
  `scope` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT 'GLOBAL' COMMENT '范围',
  `configMD5` char(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT '配置MD5',
  `expireTime` timestamp NULL DEFAULT NULL COMMENT '过期时间',
  `origin` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT 'UNKNOW' COMMENT '来源',
  `originId` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT 'UNKNOW' COMMENT '来源ID',
  `taskInfoLimit` int(11) DEFAULT NULL COMMENT '任务记录数量',
  `isDisabled` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否已禁用',
  `note` text COMMENT '备注',
  `createTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updateTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`seq`),
  UNIQUE KEY `ID` (`id`),
  UNIQUE KEY `SCOPE_CONFIG` (`scope`,`configMD5`),
  KEY `ORIGIN` (`origin`),
  KEY `ORIGIN_ID` (`originId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='自动触发配置';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `biz_main_crontab_config`
--

LOCK TABLES `biz_main_crontab_config` WRITE;
/*!40000 ALTER TABLE `biz_main_crontab_config` DISABLE KEYS */;
/*!40000 ALTER TABLE `biz_main_crontab_config` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `biz_main_crontab_task_info`
--

DROP TABLE IF EXISTS `biz_main_crontab_task_info`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `biz_main_crontab_task_info` (
  `seq` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `crontabConfigId` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '自动触发配置ID',
  `rootTaskId` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT 'ROOT' COMMENT '主任务ID',
  `funcId` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '函数ID',
  `scriptPublishVersion` bigint(20) DEFAULT NULL COMMENT '脚本发布版本',
  `queueTime` timestamp NULL DEFAULT NULL COMMENT '入队时间',
  `startTime` timestamp NULL DEFAULT NULL COMMENT '启动时间',
  `endTime` timestamp NULL DEFAULT NULL COMMENT '结束时间',
  `status` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT 'queued' COMMENT '状态 queued|pending|success|failure',
  `logMessageTEXT` longtext COMMENT '日志信息TEXT',
  `einfoTEXT` longtext COMMENT '错误信息TEXT',
  `createTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updateTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`seq`),
  UNIQUE KEY `ID` (`id`),
  KEY `CRONTAB_CONFIG_ID` (`crontabConfigId`),
  KEY `ROOT_TASK_ID` (`rootTaskId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='自动触发任务信息';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `biz_main_crontab_task_info`
--

LOCK TABLES `biz_main_crontab_task_info` WRITE;
/*!40000 ALTER TABLE `biz_main_crontab_task_info` DISABLE KEYS */;
/*!40000 ALTER TABLE `biz_main_crontab_task_info` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `biz_main_env_variable`
--

DROP TABLE IF EXISTS `biz_main_env_variable`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `biz_main_env_variable` (
  `seq` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `title` varchar(256) DEFAULT NULL COMMENT '标题',
  `description` text COMMENT '描述',
  `valueTEXT` longtext NOT NULL COMMENT '值',
  `autoTypeCasting` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT 'string' COMMENT '自动类型转换 string|integer|float|boolean|json|commaArray',
  `pinTime` datetime DEFAULT NULL COMMENT '置顶时间',
  `createTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updateTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`seq`),
  UNIQUE KEY `ID` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='环境变量';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `biz_main_env_variable`
--

LOCK TABLES `biz_main_env_variable` WRITE;
/*!40000 ALTER TABLE `biz_main_env_variable` DISABLE KEYS */;
/*!40000 ALTER TABLE `biz_main_env_variable` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `biz_main_file_service`
--

DROP TABLE IF EXISTS `biz_main_file_service`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `biz_main_file_service` (
  `seq` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `root` text COMMENT '根目录',
  `isDisabled` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否禁用',
  `note` text COMMENT '备注',
  `createTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updateTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`seq`),
  UNIQUE KEY `ID` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='文件服务';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `biz_main_file_service`
--

LOCK TABLES `biz_main_file_service` WRITE;
/*!40000 ALTER TABLE `biz_main_file_service` DISABLE KEYS */;
/*!40000 ALTER TABLE `biz_main_file_service` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `biz_main_func`
--

DROP TABLE IF EXISTS `biz_main_func`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `biz_main_func` (
  `seq` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `id` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `scriptSetId` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '脚本集ID',
  `scriptId` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '脚本ID',
  `name` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '函数名',
  `title` varchar(256) DEFAULT NULL COMMENT '标题',
  `description` text COMMENT '描述（函数文档）',
  `definition` text CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '定义（函数签名）',
  `argsJSON` json DEFAULT NULL COMMENT '位置参数JSON',
  `kwargsJSON` json DEFAULT NULL COMMENT '命名参数JSON',
  `extraConfigJSON` json DEFAULT NULL COMMENT '函数额外配置JSON',
  `category` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT 'general' COMMENT '类别 general|prediction|transformation|action|command|query|check',
  `integration` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT '集成',
  `tagsJSON` json DEFAULT NULL COMMENT '函数标签JSON',
  `defOrder` int(11) NOT NULL DEFAULT '0' COMMENT '定义顺序',
  `createTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updateTime` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`seq`),
  UNIQUE KEY `ID` (`id`),
  KEY `SCRIPT_SET_ID` (`scriptSetId`),
  KEY `SCRIPT_ID` (`scriptId`),
  KEY `NAME` (`name`),
  KEY `CATEGORY` (`category`),
  KEY `INTEGRATION` (`integration`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COMMENT='函数';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `biz_main_func`
--

LOCK TABLES `biz_main_func` WRITE;
/*!40000 ALTER TABLE `biz_main_func` DISABLE KEYS */;
INSERT INTO `biz_main_func` (`seq`, `id`, `scriptSetId`, `scriptId`, `name`, `title`, `description`, `definition`, `argsJSON`, `kwargsJSON`, `extraConfigJSON`, `category`, `integration`, `tagsJSON`, `defOrder`, `createTime`, `updateTime`) VALUES (1,'demo__basic.plus','demo','demo__basic','plus','两数相加','两数相加\n输入参数 x, y 均为数字类型，返回结果为两者之和','plus(x, y)','[\"x\", \"y\"]','{\"x\": {}, \"y\": {}}','{\"timeout\": 10, \"cacheResult\": 300}','math',NULL,'[\"math\", \"simple\"]',0,'2021-07-19 18:13:01','2021-07-19 18:16:10.043246');
/*!40000 ALTER TABLE `biz_main_func` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `biz_main_func_store`
--

DROP TABLE IF EXISTS `biz_main_func_store`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `biz_main_func_store` (
  `seq` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `scope` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT 'GLOBAL' COMMENT '范围',
  `key` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '键名',
  `valueJSON` json NOT NULL COMMENT '值JSON',
  `expireAt` int(11) DEFAULT NULL COMMENT '过期时间（秒级UNIX时间戳）',
  `createTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updateTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`seq`),
  UNIQUE KEY `ID` (`id`),
  UNIQUE KEY `BIZ` (`scope`,`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='函数存储';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `biz_main_func_store`
--

LOCK TABLES `biz_main_func_store` WRITE;
/*!40000 ALTER TABLE `biz_main_func_store` DISABLE KEYS */;
/*!40000 ALTER TABLE `biz_main_func_store` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `biz_main_operation_record`
--

DROP TABLE IF EXISTS `biz_main_operation_record`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `biz_main_operation_record` (
  `seq` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `userId` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT '用户ID',
  `username` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT '用户名',
  `clientId` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT '客户端ID',
  `clientIPsJSON` json DEFAULT NULL COMMENT '客户端IP JSON',
  `traceId` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT '跟踪ID',
  `reqMethod` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT '请求方法',
  `reqRoute` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT '请求路由',
  `reqQueryJSON` json DEFAULT NULL COMMENT '请求Query JSON',
  `reqParamsJSON` json DEFAULT NULL COMMENT '请求Params JSON',
  `reqBodyJSON` json DEFAULT NULL COMMENT '请求体JSON',
  `reqFileInfoJSON` json DEFAULT NULL COMMENT '上传文件信息JSON',
  `reqCost` int(11) DEFAULT NULL COMMENT '请求时长（毫秒）',
  `respStatusCode` int(3) unsigned DEFAULT NULL COMMENT '响应状态码',
  `respBodyJSON` json DEFAULT NULL COMMENT '响应体JSON',
  `createTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updateTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`seq`),
  KEY `USER_ID` (`userId`),
  KEY `USERNAME` (`username`),
  KEY `CLIENT_ID` (`clientId`),
  KEY `TRACE_ID` (`traceId`),
  KEY `REQ_METHOD` (`reqMethod`),
  KEY `REQ_ROUTE` (`reqRoute`),
  KEY `CREATE_TIME` (`createTime`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='操作记录';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `biz_main_operation_record`
--

LOCK TABLES `biz_main_operation_record` WRITE;
/*!40000 ALTER TABLE `biz_main_operation_record` DISABLE KEYS */;
/*!40000 ALTER TABLE `biz_main_operation_record` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `biz_main_script`
--

DROP TABLE IF EXISTS `biz_main_script`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `biz_main_script` (
  `seq` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `scriptSetId` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '脚本集ID',
  `title` varchar(256) DEFAULT NULL COMMENT '标题',
  `description` text COMMENT '描述',
  `publishVersion` bigint(20) NOT NULL DEFAULT '0' COMMENT '发布版本',
  `type` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT 'python' COMMENT '类型 python',
  `code` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin COMMENT '代码',
  `codeMD5` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT '代码MD5',
  `codeDraft` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin COMMENT '代码（编辑中草稿）',
  `codeDraftMD5` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT '代码（编辑中草稿）MD5',
  `lockedByUserId` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT '锁定者用户ID',
  `createTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updateTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`seq`),
  UNIQUE KEY `ID` (`id`),
  KEY `SCRIPT_SET_ID` (`scriptSetId`),
  FULLTEXT KEY `FT` (`code`,`codeDraft`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COMMENT='脚本';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `biz_main_script`
--

LOCK TABLES `biz_main_script` WRITE;
/*!40000 ALTER TABLE `biz_main_script` DISABLE KEYS */;
INSERT INTO `biz_main_script` (`seq`, `id`, `scriptSetId`, `title`, `description`, `publishVersion`, `type`, `code`, `codeMD5`, `codeDraft`, `codeDraftMD5`, `lockedByUserId`, `createTime`, `updateTime`) VALUES (1,'demo__basic','demo','基础演示',NULL,1,'python','# 基础演示\n\n# 使用装饰器为函数命名为\'两数相加\'，并允许外部调用本函数\n# 额外的配置包括：\n# category=\'math\'\n#     指定分类为\"math\"\n# tags=[\'basic\', \'simple\']\n#     指定2个标签：\'basic\', \'simple\'\n# cache_result=300\n#     指定处理结果缓存300秒，后续使用完全相同的参数进行API调用时，可以直接返回而不需要重新运行\n# timeout=10\n#     指定函数执行超时时间为10秒，执行超过10秒时，将强制中断\n@DFF.API(\'两数相加\', category=\'math\', tags=[\'math\', \'simple\'], cache_result=300, timeout=10)\ndef plus(x, y):\n    \'\'\'\n    两数相加\n    输入参数 x, y 均为数字类型，返回结果为两者之和\n    \'\'\'\n    print(\'INPUT: x = {}, y = {}\'.format(x, y))\n\n    _x = float(x)\n    _y = float(y)\n    result = _x + _y\n    if isinstance(x, int) and isinstance(y, int):\n        result = int(result)\n\n    print(\'\\tRESULT: {}\'.format(result))\n    return result\n\n# 测试函数不需要装饰器\ndef test_plus():\n    assert plus(1, 1) == 2\n    assert plus(1, 1.1) == 2.1\n    assert plus(1.1, 1.2) == 2.3\n    return \'OK\'','c2f4e8111172889bce3118a6ad896fc9','# 基础演示\n\n# 使用装饰器为函数命名为\'两数相加\'，并允许外部调用本函数\n# 额外的配置包括：\n# category=\'math\'\n#     指定分类为\"math\"\n# tags=[\'basic\', \'simple\']\n#     指定2个标签：\'basic\', \'simple\'\n# cache_result=300\n#     指定处理结果缓存300秒，后续使用完全相同的参数进行API调用时，可以直接返回而不需要重新运行\n# timeout=10\n#     指定函数执行超时时间为10秒，执行超过10秒时，将强制中断\n@DFF.API(\'两数相加\', category=\'math\', tags=[\'math\', \'simple\'], cache_result=300, timeout=10)\ndef plus(x, y):\n    \'\'\'\n    两数相加\n    输入参数 x, y 均为数字类型，返回结果为两者之和\n    \'\'\'\n    print(\'INPUT: x = {}, y = {}\'.format(x, y))\n\n    _x = float(x)\n    _y = float(y)\n    result = _x + _y\n    if isinstance(x, int) and isinstance(y, int):\n        result = int(result)\n\n    print(\'\\tRESULT: {}\'.format(result))\n    return result\n\n# 测试函数不需要装饰器\ndef test_plus():\n    assert plus(1, 1) == 2\n    assert plus(1, 1.1) == 2.1\n    assert plus(1.1, 1.2) == 2.3\n    return \'OK\'','c2f4e8111172889bce3118a6ad896fc9',NULL,'2020-09-19 09:37:30','2021-07-19 18:16:09');
/*!40000 ALTER TABLE `biz_main_script` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `biz_main_script_failure`
--

DROP TABLE IF EXISTS `biz_main_script_failure`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `biz_main_script_failure` (
  `seq` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `funcId` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '函数ID',
  `scriptPublishVersion` bigint(20) NOT NULL COMMENT '脚本发布版本',
  `execMode` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '执行模式 sync|async|crontab',
  `einfoTEXT` longtext COMMENT '错误信息',
  `exception` varchar(64) DEFAULT NULL COMMENT '异常',
  `traceInfoJSON` json DEFAULT NULL COMMENT '跟踪信息JSON',
  `note` text COMMENT '备注',
  `createTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updateTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`seq`),
  UNIQUE KEY `ID` (`id`),
  KEY `ENTRY` (`funcId`,`scriptPublishVersion`),
  KEY `CREATE_TIME` (`createTime`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='脚本故障信息';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `biz_main_script_failure`
--

LOCK TABLES `biz_main_script_failure` WRITE;
/*!40000 ALTER TABLE `biz_main_script_failure` DISABLE KEYS */;
/*!40000 ALTER TABLE `biz_main_script_failure` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `biz_main_script_log`
--

DROP TABLE IF EXISTS `biz_main_script_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `biz_main_script_log` (
  `seq` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `funcId` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '函数ID',
  `scriptPublishVersion` bigint(20) NOT NULL COMMENT '脚本发布版本',
  `execMode` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '执行模式 sync|async|crontab',
  `messageTEXT` longtext COMMENT '日志信息TEXT',
  `createTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updateTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`seq`),
  UNIQUE KEY `ID` (`id`),
  KEY `ENTRY` (`funcId`,`scriptPublishVersion`),
  KEY `CREATE_TIME` (`createTime`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='脚本日志信息';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `biz_main_script_log`
--

LOCK TABLES `biz_main_script_log` WRITE;
/*!40000 ALTER TABLE `biz_main_script_log` DISABLE KEYS */;
/*!40000 ALTER TABLE `biz_main_script_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `biz_main_script_market`
--

DROP TABLE IF EXISTS `biz_main_script_market`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `biz_main_script_market` (
  `seq` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '脚本市场ID',
  `name` varchar(256) DEFAULT NULL COMMENT '名称',
  `description` text COMMENT '描述',
  `type` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '类型 git|aliyunOSS|httpService',
  `configJSON` json DEFAULT NULL COMMENT '配置信息JSON',
  `extraJSON` json DEFAULT NULL COMMENT '额外信息JSON',
  `lockedByUserId` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT '锁定者用户ID',
  `pinTime` datetime DEFAULT NULL COMMENT '置顶时间',
  `createTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updateTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`seq`),
  UNIQUE KEY `ID` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='脚本市场';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `biz_main_script_market`
--

LOCK TABLES `biz_main_script_market` WRITE;
/*!40000 ALTER TABLE `biz_main_script_market` DISABLE KEYS */;
/*!40000 ALTER TABLE `biz_main_script_market` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `biz_main_script_publish_history`
--

DROP TABLE IF EXISTS `biz_main_script_publish_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `biz_main_script_publish_history` (
  `seq` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `scriptId` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '脚本ID',
  `scriptPublishVersion` bigint(20) NOT NULL COMMENT '脚本发布版本',
  `scriptCode_cache` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '脚本代码（缓存字段）',
  `note` text COMMENT '发布备注',
  `createTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updateTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`seq`),
  UNIQUE KEY `ID` (`id`),
  FULLTEXT KEY `FT` (`scriptCode_cache`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='脚本发布历史';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `biz_main_script_publish_history`
--

LOCK TABLES `biz_main_script_publish_history` WRITE;
/*!40000 ALTER TABLE `biz_main_script_publish_history` DISABLE KEYS */;
/*!40000 ALTER TABLE `biz_main_script_publish_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `biz_main_script_recover_point`
--

DROP TABLE IF EXISTS `biz_main_script_recover_point`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `biz_main_script_recover_point` (
  `seq` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `type` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT 'manual' COMMENT '类型 import|manual',
  `tableDumpJSON` json DEFAULT NULL COMMENT '表备份数据JSON',
  `exportData` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin COMMENT '脚本库导出数据',
  `note` text COMMENT '备注',
  `createTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updateTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`seq`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='脚本还原点';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `biz_main_script_recover_point`
--

LOCK TABLES `biz_main_script_recover_point` WRITE;
/*!40000 ALTER TABLE `biz_main_script_recover_point` DISABLE KEYS */;
/*!40000 ALTER TABLE `biz_main_script_recover_point` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `biz_main_script_set`
--

DROP TABLE IF EXISTS `biz_main_script_set`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `biz_main_script_set` (
  `seq` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `title` varchar(256) DEFAULT NULL COMMENT '标题',
  `description` text COMMENT '描述',
  `requirements` text COMMENT '依赖包',
  `origin` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT 'UNKNOW' COMMENT '来源',
  `originId` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT 'UNKNOW' COMMENT '来源ID',
  `originMD5` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT '来源MD5',
  `lockedByUserId` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT '锁定者用户ID',
  `pinTime` datetime DEFAULT NULL COMMENT '置顶时间',
  `createTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updateTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`seq`),
  UNIQUE KEY `ID` (`id`),
  KEY `ORIGIN_ID` (`originId`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COMMENT='脚本集';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `biz_main_script_set`
--

LOCK TABLES `biz_main_script_set` WRITE;
/*!40000 ALTER TABLE `biz_main_script_set` DISABLE KEYS */;
INSERT INTO `biz_main_script_set` (`seq`, `id`, `title`, `description`, `requirements`, `origin`, `originId`, `originMD5`, `lockedByUserId`, `pinTime`, `createTime`, `updateTime`) VALUES (1,'demo','示例',NULL,NULL,'UNKNOW','UNKNOW',NULL, NULL,NULL,'2020-09-19 09:36:57','2020-09-29 13:40:21');
/*!40000 ALTER TABLE `biz_main_script_set` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `biz_main_script_set_export_history`
--

DROP TABLE IF EXISTS `biz_main_script_set_export_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `biz_main_script_set_export_history` (
  `seq` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `note` text COMMENT '操作备注',
  `summaryJSON` json NOT NULL COMMENT '导出摘要JSON',
  `createTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updateTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`seq`),
  UNIQUE KEY `ID` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='导出历史';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `biz_main_script_set_export_history`
--

LOCK TABLES `biz_main_script_set_export_history` WRITE;
/*!40000 ALTER TABLE `biz_main_script_set_export_history` DISABLE KEYS */;
/*!40000 ALTER TABLE `biz_main_script_set_export_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `biz_main_script_set_import_history`
--

DROP TABLE IF EXISTS `biz_main_script_set_import_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `biz_main_script_set_import_history` (
  `seq` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `note` text COMMENT '操作备注',
  `summaryJSON` json NOT NULL COMMENT '导出摘要JSON',
  `createTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updateTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`seq`),
  UNIQUE KEY `ID` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='导出历史';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `biz_main_script_set_import_history`
--

LOCK TABLES `biz_main_script_set_import_history` WRITE;
/*!40000 ALTER TABLE `biz_main_script_set_import_history` DISABLE KEYS */;
/*!40000 ALTER TABLE `biz_main_script_set_import_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `biz_main_task_info`
--

DROP TABLE IF EXISTS `biz_main_task_info`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `biz_main_task_info` (
  `seq` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `originId` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT 'UNKNOW' COMMENT '任务来源ID',
  `rootTaskId` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT 'ROOT' COMMENT '主任务ID',
  `funcId` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '函数ID',
  `execMode` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '执行模式 sync|async|crontab',
  `status` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '状态 success|failure',
  `triggerTimeMs` bigint(20) unsigned NOT NULL,
  `startTimeMs` bigint(20) unsigned NOT NULL,
  `endTimeMs` bigint(20) unsigned NOT NULL,
  `logMessageTEXT` longtext COMMENT '日志信息TEXT',
  `einfoTEXT` longtext COMMENT '错误信息TEXT',
  `edumpTEXT` longtext COMMENT '错误DUMPTEXT',
  `createTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updateTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`seq`),
  UNIQUE KEY `ID` (`id`),
  KEY `ORIGIN_ID` (`originId`),
  KEY `ROOT_TASK_ID` (`rootTaskId`),
  KEY `FUNC_ID` (`funcId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='任务信息';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `biz_main_task_info`
--

LOCK TABLES `biz_main_task_info` WRITE;
/*!40000 ALTER TABLE `biz_main_task_info` DISABLE KEYS */;
/*!40000 ALTER TABLE `biz_main_task_info` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `biz_main_task_result_dataflux_func`
--

DROP TABLE IF EXISTS `biz_main_task_result_dataflux_func`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `biz_main_task_result_dataflux_func` (
  `seq` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `task` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `origin` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `startTime` int(11) DEFAULT NULL COMMENT '任务开始时间(秒级UNIX时间戳)',
  `endTime` int(11) DEFAULT NULL COMMENT '任务结束时间(秒级UNIX时间戳)',
  `argsJSON` json DEFAULT NULL COMMENT '列表参数JSON',
  `kwargsJSON` json DEFAULT NULL COMMENT '字典参数JSON',
  `retvalJSON` json DEFAULT NULL COMMENT '执行结果JSON',
  `status` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '任务状态: SUCCESS|FAILURE',
  `einfoTEXT` longtext COMMENT '错误信息TEXT',
  `createTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updateTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`seq`),
  UNIQUE KEY `ID` (`id`),
  KEY `TASK` (`task`),
  KEY `ORIGIN` (`origin`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='DataFluxFunc 任务结果';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `biz_main_task_result_dataflux_func`
--

LOCK TABLES `biz_main_task_result_dataflux_func` WRITE;
/*!40000 ALTER TABLE `biz_main_task_result_dataflux_func` DISABLE KEYS */;
/*!40000 ALTER TABLE `biz_main_task_result_dataflux_func` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `biz_rel_func_running_info`
--

DROP TABLE IF EXISTS `biz_rel_func_running_info`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `biz_rel_func_running_info` (
  `seq` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `funcId` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '函数ID',
  `scriptPublishVersion` bigint(20) NOT NULL COMMENT '脚本发布版本',
  `execMode` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '执行模式 sync|async|crontab',
  `succeedCount` int(11) NOT NULL DEFAULT '0' COMMENT '成功次数',
  `failCount` int(11) NOT NULL DEFAULT '0' COMMENT '失败次数',
  `minCost` int(11) DEFAULT NULL COMMENT '最小耗时（毫秒）',
  `maxCost` int(11) DEFAULT NULL COMMENT '最大耗时（毫秒）',
  `totalCost` bigint(11) DEFAULT NULL COMMENT '累积耗时（毫秒）',
  `latestCost` int(11) DEFAULT NULL COMMENT '最近消耗（毫秒）',
  `latestSucceedTime` timestamp NULL DEFAULT NULL COMMENT '最近成功时间',
  `latestFailTime` timestamp NULL DEFAULT NULL COMMENT '最近失败时间',
  `status` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT 'neverStarted' COMMENT '状态 neverStarted|succeed|fail|timeout',
  `createTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updateTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`seq`),
  UNIQUE KEY `BIZ` (`funcId`,`scriptPublishVersion`,`execMode`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='函数执行信息';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `biz_rel_func_running_info`
--

LOCK TABLES `biz_rel_func_running_info` WRITE;
/*!40000 ALTER TABLE `biz_rel_func_running_info` DISABLE KEYS */;
/*!40000 ALTER TABLE `biz_rel_func_running_info` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wat_main_access_key`
--

DROP TABLE IF EXISTS `wat_main_access_key`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wat_main_access_key` (
  `seq` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `userId` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `name` varchar(256) NOT NULL,
  `secret` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `webhookURL` text,
  `webhookEvents` text,
  `allowWebhookEcho` tinyint(1) NOT NULL DEFAULT '0',
  `createTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updateTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`seq`),
  UNIQUE KEY `ID` (`id`),
  KEY `USER_ID` (`userId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wat_main_access_key`
--

LOCK TABLES `wat_main_access_key` WRITE;
/*!40000 ALTER TABLE `wat_main_access_key` DISABLE KEYS */;
/*!40000 ALTER TABLE `wat_main_access_key` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wat_main_system_config`
--

DROP TABLE IF EXISTS `wat_main_system_config`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wat_main_system_config` (
  `seq` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `value` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '值',
  `createTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updateTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`seq`),
  UNIQUE KEY `ID` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wat_main_system_config`
--

LOCK TABLES `wat_main_system_config` WRITE;
/*!40000 ALTER TABLE `wat_main_system_config` DISABLE KEYS */;
/*!40000 ALTER TABLE `wat_main_system_config` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wat_main_task_result_example`
--

DROP TABLE IF EXISTS `wat_main_task_result_example`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wat_main_task_result_example` (
  `seq` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `task` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `origin` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `startTime` int(11) DEFAULT NULL,
  `endTime` int(11) DEFAULT NULL,
  `argsJSON` json DEFAULT NULL,
  `kwargsJSON` json DEFAULT NULL,
  `retvalJSON` json DEFAULT NULL,
  `status` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `einfoTEXT` text,
  `createTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updateTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`seq`),
  UNIQUE KEY `ID` (`id`),
  KEY `TASK` (`task`),
  KEY `ORIGIN` (`origin`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wat_main_task_result_example`
--

LOCK TABLES `wat_main_task_result_example` WRITE;
/*!40000 ALTER TABLE `wat_main_task_result_example` DISABLE KEYS */;
/*!40000 ALTER TABLE `wat_main_task_result_example` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wat_main_user`
--

DROP TABLE IF EXISTS `wat_main_user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wat_main_user` (
  `seq` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `username` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `passwordHash` text CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `name` varchar(256) DEFAULT NULL,
  `email` varchar(256) DEFAULT NULL COMMENT '邮箱',
  `mobile` varchar(32) DEFAULT NULL,
  `markers` text,
  `roles` text,
  `customPrivileges` text,
  `isDisabled` tinyint(1) NOT NULL DEFAULT '0',
  `createTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updateTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`seq`),
  UNIQUE KEY `ID` (`id`),
  UNIQUE KEY `USERNAME` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wat_main_user`
--

LOCK TABLES `wat_main_user` WRITE;
/*!40000 ALTER TABLE `wat_main_user` DISABLE KEYS */;
INSERT INTO `wat_main_user` (`seq`, `id`, `username`, `passwordHash`, `name`, `email`, `mobile`, `markers`, `roles`, `customPrivileges`, `isDisabled`, `createTime`, `updateTime`) VALUES (1,'u-admin','admin',NULL,'Administrator',NULL,NULL,NULL,'sa','*',0,'2022-12-06 12:04:12','2022-12-06 12:04:12');
/*!40000 ALTER TABLE `wat_main_user` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2022-12-06 20:06:16
