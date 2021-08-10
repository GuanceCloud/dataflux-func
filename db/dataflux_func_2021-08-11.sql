# ************************************************************
# Sequel Ace SQL dump
# 版本号： 3034
#
# https://sequel-ace.com/
# https://github.com/Sequel-Ace/Sequel-Ace
#
# 主机: ubuntu20-dev.vm (MySQL 5.7.34)
# 数据库: dataflux_func
# 生成时间: 2021-08-10 16:12:32 +0000
# ************************************************************


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
SET NAMES utf8mb4;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE='NO_AUTO_VALUE_ON_ZERO', SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


# 转储表 biz_main_auth_link
# ------------------------------------------------------------

DROP TABLE IF EXISTS `biz_main_auth_link`;

CREATE TABLE `biz_main_auth_link` (
  `seq` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '兼任Token',
  `funcId` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '函数ID',
  `funcCallKwargsJSON` text NOT NULL COMMENT '函数调用参数JSON (kwargs)',
  `tagsJSON` json DEFAULT NULL COMMENT '授权链接标签JSON',
  `expireTime` datetime DEFAULT NULL COMMENT '过期时间（NULL表示永不过期）',
  `throttlingJSON` json DEFAULT NULL COMMENT '限流JSON（value="<From Parameter>"表示从参数获取）',
  `origin` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT 'API' COMMENT '来源 API|UI',
  `showInDoc` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否在文档中显示',
  `isDisabled` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否禁用',
  `note` text COMMENT '备注',
  `createTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updateTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`seq`),
  UNIQUE KEY `ID` (`id`),
  KEY `ORIGIN` (`origin`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='授权链接';

LOCK TABLES `biz_main_auth_link` WRITE;
/*!40000 ALTER TABLE `biz_main_auth_link` DISABLE KEYS */;

INSERT INTO `biz_main_auth_link` (`seq`, `id`, `funcId`, `funcCallKwargsJSON`, `tagsJSON`, `expireTime`, `throttlingJSON`, `origin`, `showInDoc`, `isDisabled`, `note`, `createTime`, `updateTime`)
VALUES
	(1,X'61756C6E2D706C7573',X'64656D6F5F5F62617369632E706C7573','{\"x\":\"INPUT_BY_CALLER\",\"y\":\"INPUT_BY_CALLER\"}',NULL,NULL,'{}',X'5549',0,0,NULL,'2021-07-19 18:13:18','2021-07-19 18:13:18');

/*!40000 ALTER TABLE `biz_main_auth_link` ENABLE KEYS */;
UNLOCK TABLES;


# 转储表 biz_main_batch
# ------------------------------------------------------------

DROP TABLE IF EXISTS `biz_main_batch`;

CREATE TABLE `biz_main_batch` (
  `seq` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '兼任Token',
  `funcId` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '函数ID',
  `funcCallKwargsJSON` text NOT NULL COMMENT '函数调用参数JSON (kwargs)',
  `tagsJSON` json DEFAULT NULL COMMENT '批处理标签JSON',
  `origin` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT 'API' COMMENT '来源 API|UI',
  `showInDoc` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否在文档中显示',
  `isDisabled` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否禁用',
  `note` text COMMENT '备注',
  `createTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updateTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`seq`),
  UNIQUE KEY `ID` (`id`),
  KEY `ORIGIN` (`origin`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='批处理';



# 转储表 biz_main_batch_task_info
# ------------------------------------------------------------

DROP TABLE IF EXISTS `biz_main_batch_task_info`;

CREATE TABLE `biz_main_batch_task_info` (
  `seq` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `batchId` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '批处理ID',
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
  KEY `BATCH_ID` (`batchId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='批处理任务信息';



# 转储表 biz_main_crontab_config
# ------------------------------------------------------------

DROP TABLE IF EXISTS `biz_main_crontab_config`;

CREATE TABLE `biz_main_crontab_config` (
  `seq` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `funcId` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '函数ID',
  `funcCallKwargsJSON` text NOT NULL COMMENT '函数调用参数JSON (kwargs)',
  `crontab` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT '执行频率（Crontab语法）',
  `tagsJSON` json DEFAULT NULL COMMENT '自动触发配置标签JSON',
  `saveResult` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否需要保存结果',
  `scope` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT 'GLOBAL' COMMENT '范围',
  `configMD5` char(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT '配置MD5',
  `expireTime` timestamp NULL DEFAULT NULL COMMENT '过期时间',
  `origin` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT 'API' COMMENT '来源 API|UI',
  `isDisabled` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否已禁用',
  `note` text COMMENT '备注',
  `createTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updateTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`seq`),
  UNIQUE KEY `ID` (`id`),
  UNIQUE KEY `SCOPE_CONFIG` (`scope`,`configMD5`),
  KEY `ORIGIN` (`origin`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='自动触发配置';

LOCK TABLES `biz_main_crontab_config` WRITE;
/*!40000 ALTER TABLE `biz_main_crontab_config` DISABLE KEYS */;

INSERT INTO `biz_main_crontab_config` (`seq`, `id`, `funcId`, `funcCallKwargsJSON`, `crontab`, `tagsJSON`, `saveResult`, `scope`, `configMD5`, `expireTime`, `origin`, `isDisabled`, `note`, `createTime`, `updateTime`)
VALUES
	(1,X'63726F6E2D694C445546434D6C4D445254',X'64656D6F5F5F62617369632E706C7573','{\"x\":1,\"y\":2}',X'2A2F35202A202A202A202A','[]',0,X'474C4F42414C',NULL,NULL,X'5549',0,NULL,'2021-07-19 18:29:09','2021-07-19 18:29:09');

/*!40000 ALTER TABLE `biz_main_crontab_config` ENABLE KEYS */;
UNLOCK TABLES;


# 转储表 biz_main_crontab_task_info
# ------------------------------------------------------------

DROP TABLE IF EXISTS `biz_main_crontab_task_info`;

CREATE TABLE `biz_main_crontab_task_info` (
  `seq` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `crontabConfigId` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '自动触发配置ID',
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
  KEY `CRONTAB_CONFIG_ID` (`crontabConfigId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='自动触发任务信息';



# 转储表 biz_main_data_source
# ------------------------------------------------------------

DROP TABLE IF EXISTS `biz_main_data_source`;

CREATE TABLE `biz_main_data_source` (
  `seq` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `title` varchar(256) DEFAULT NULL COMMENT '标题',
  `description` text COMMENT '描述',
  `type` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '类型 influxdb|mysql|redis|..',
  `configJSON` json NOT NULL COMMENT '配置JSON',
  `isBuiltin` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否为内建数据源',
  `createTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updateTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`seq`),
  UNIQUE KEY `ID` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='数据源';



# 转储表 biz_main_env_variable
# ------------------------------------------------------------

DROP TABLE IF EXISTS `biz_main_env_variable`;

CREATE TABLE `biz_main_env_variable` (
  `seq` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `title` varchar(256) DEFAULT NULL COMMENT '标题',
  `description` text COMMENT '描述',
  `valueTEXT` longtext NOT NULL COMMENT '值',
  `autoTypeCasting` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT 'string' COMMENT '自动类型转换 string|integer|float|boolean|json|commaArray',
  `createTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updateTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`seq`),
  UNIQUE KEY `ID` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='环境变量';



# 转储表 biz_main_file_service
# ------------------------------------------------------------

DROP TABLE IF EXISTS `biz_main_file_service`;

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



# 转储表 biz_main_func
# ------------------------------------------------------------

DROP TABLE IF EXISTS `biz_main_func`;

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
  `kwargsJSON` text COMMENT '命名参数JSON',
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='函数';

LOCK TABLES `biz_main_func` WRITE;
/*!40000 ALTER TABLE `biz_main_func` DISABLE KEYS */;

INSERT INTO `biz_main_func` (`seq`, `id`, `scriptSetId`, `scriptId`, `name`, `title`, `description`, `definition`, `argsJSON`, `kwargsJSON`, `extraConfigJSON`, `category`, `integration`, `tagsJSON`, `defOrder`, `createTime`, `updateTime`)
VALUES
	(1,X'64656D6F5F5F62617369632E706C7573',X'64656D6F',X'64656D6F5F5F6261736963',X'706C7573','两数相加','两数相加\n输入参数 x, y 均为数字类型，返回结果为两者之和',X'706C757328782C207929','[\"x\", \"y\"]','{\"x\":{},\"y\":{}}','{\"timeout\": 10, \"cacheResult\": 300}',X'6D617468',NULL,'[\"math\", \"simple\"]',0,'2021-07-19 18:13:01','2021-07-19 18:16:10.043246');

/*!40000 ALTER TABLE `biz_main_func` ENABLE KEYS */;
UNLOCK TABLES;


# 转储表 biz_main_func_store
# ------------------------------------------------------------

DROP TABLE IF EXISTS `biz_main_func_store`;

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



# 转储表 biz_main_operation_record
# ------------------------------------------------------------

DROP TABLE IF EXISTS `biz_main_operation_record`;

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



# 转储表 biz_main_script
# ------------------------------------------------------------

DROP TABLE IF EXISTS `biz_main_script`;

CREATE TABLE `biz_main_script` (
  `seq` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `scriptSetId` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '脚本集ID',
  `title` varchar(256) DEFAULT NULL COMMENT '标题',
  `description` text COMMENT '描述',
  `publishVersion` bigint(20) NOT NULL DEFAULT '0' COMMENT '发布版本',
  `type` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT 'python' COMMENT '类型 python',
  `code` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin COMMENT '代码',
  `codeMD5` char(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT '代码MD5',
  `codeDraft` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin COMMENT '代码（编辑中草稿）',
  `codeDraftMD5` char(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT '代码（编辑中草稿）MD5',
  `lockedByUserId` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT '锁定者用户ID',
  `createTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updateTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`seq`),
  UNIQUE KEY `ID` (`id`),
  KEY `SCRIPT_SET_ID` (`scriptSetId`),
  FULLTEXT KEY `FT` (`code`,`codeDraft`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='脚本';

LOCK TABLES `biz_main_script` WRITE;
/*!40000 ALTER TABLE `biz_main_script` DISABLE KEYS */;

INSERT INTO `biz_main_script` (`seq`, `id`, `scriptSetId`, `title`, `description`, `publishVersion`, `type`, `code`, `codeMD5`, `codeDraft`, `codeDraftMD5`, `lockedByUserId`, `createTime`, `updateTime`)
VALUES
	(1,X'64656D6F5F5F6261736963',X'64656D6F','基础演示',NULL,1,X'707974686F6E',X'2320E59FBAE7A180E6BC94E7A4BA0A0A2320E4BDBFE794A8E8A385E9A5B0E599A8E4B8BAE587BDE695B0E591BDE5908DE4B8BA27E4B8A4E695B0E79BB8E58AA027EFBC8CE5B9B6E58581E8AEB8E5A496E983A8E8B083E794A8E69CACE587BDE695B00A2320E9A29DE5A496E79A84E9858DE7BDAEE58C85E68BACEFBC9A0A232063617465676F72793D276D617468270A232020202020E68C87E5AE9AE58886E7B1BBE4B8BA226D617468220A2320746167733D5B276261736963272C202773696D706C65275D0A232020202020E68C87E5AE9A32E4B8AAE6A087E7ADBEEFBC9A276261736963272C202773696D706C65270A232063616368655F726573756C743D3330300A232020202020E68C87E5AE9AE5A484E79086E7BB93E69E9CE7BC93E5AD98333030E7A792EFBC8CE5908EE7BBADE4BDBFE794A8E5AE8CE585A8E79BB8E5908CE79A84E58F82E695B0E8BF9BE8A18C415049E8B083E794A8E697B6EFBC8CE58FAFE4BBA5E79BB4E68EA5E8BF94E59B9EE8808CE4B88DE99C80E8A681E9878DE696B0E8BF90E8A18C0A232074696D656F75743D31300A232020202020E68C87E5AE9AE587BDE695B0E689A7E8A18CE8B685E697B6E697B6E997B4E4B8BA3130E7A792EFBC8CE689A7E8A18CE8B685E8BF873130E7A792E697B6EFBC8CE5B086E5BCBAE588B6E4B8ADE696AD0A404446462E4150492827E4B8A4E695B0E79BB8E58AA0272C2063617465676F72793D276D617468272C20746167733D5B276D617468272C202773696D706C65275D2C2063616368655F726573756C743D3330302C2074696D656F75743D3130290A64656620706C757328782C2079293A0A202020202727270A20202020E4B8A4E695B0E79BB8E58AA00A20202020E8BE93E585A5E58F82E695B020782C207920E59D87E4B8BAE695B0E5AD97E7B1BBE59E8BEFBC8CE8BF94E59B9EE7BB93E69E9CE4B8BAE4B8A4E88085E4B98BE5928C0A202020202727270A202020207072696E742827494E5055543A2078203D207B7D2C2079203D207B7D272E666F726D617428782C207929290A0A202020205F78203D20666C6F61742878290A202020205F79203D20666C6F61742879290A20202020726573756C74203D205F78202B205F790A202020206966206973696E7374616E636528782C20696E742920616E64206973696E7374616E636528792C20696E74293A0A2020202020202020726573756C74203D20696E7428726573756C74290A0A202020207072696E7428275C74524553554C543A207B7D272E666F726D617428726573756C7429290A2020202072657475726E20726573756C740A0A2320E6B58BE8AF95E587BDE695B0E4B88DE99C80E8A681E8A385E9A5B0E599A80A64656620746573745F706C757328293A0A2020202061737365727420706C757328312C203129203D3D20320A2020202061737365727420706C757328312C20312E3129203D3D20322E310A2020202061737365727420706C757328312E312C20312E3229203D3D20322E330A2020202072657475726E20274F4B27',X'6332663465383131313137323838396263653331313861366164383936666339',X'2320E59FBAE7A180E6BC94E7A4BA0A0A2320E4BDBFE794A8E8A385E9A5B0E599A8E4B8BAE587BDE695B0E591BDE5908DE4B8BA27E4B8A4E695B0E79BB8E58AA027EFBC8CE5B9B6E58581E8AEB8E5A496E983A8E8B083E794A8E69CACE587BDE695B00A2320E9A29DE5A496E79A84E9858DE7BDAEE58C85E68BACEFBC9A0A232063617465676F72793D276D617468270A232020202020E68C87E5AE9AE58886E7B1BBE4B8BA226D617468220A2320746167733D5B276261736963272C202773696D706C65275D0A232020202020E68C87E5AE9A32E4B8AAE6A087E7ADBEEFBC9A276261736963272C202773696D706C65270A232063616368655F726573756C743D3330300A232020202020E68C87E5AE9AE5A484E79086E7BB93E69E9CE7BC93E5AD98333030E7A792EFBC8CE5908EE7BBADE4BDBFE794A8E5AE8CE585A8E79BB8E5908CE79A84E58F82E695B0E8BF9BE8A18C415049E8B083E794A8E697B6EFBC8CE58FAFE4BBA5E79BB4E68EA5E8BF94E59B9EE8808CE4B88DE99C80E8A681E9878DE696B0E8BF90E8A18C0A232074696D656F75743D31300A232020202020E68C87E5AE9AE587BDE695B0E689A7E8A18CE8B685E697B6E697B6E997B4E4B8BA3130E7A792EFBC8CE689A7E8A18CE8B685E8BF873130E7A792E697B6EFBC8CE5B086E5BCBAE588B6E4B8ADE696AD0A404446462E4150492827E4B8A4E695B0E79BB8E58AA0272C2063617465676F72793D276D617468272C20746167733D5B276D617468272C202773696D706C65275D2C2063616368655F726573756C743D3330302C2074696D656F75743D3130290A64656620706C757328782C2079293A0A202020202727270A20202020E4B8A4E695B0E79BB8E58AA00A20202020E8BE93E585A5E58F82E695B020782C207920E59D87E4B8BAE695B0E5AD97E7B1BBE59E8BEFBC8CE8BF94E59B9EE7BB93E69E9CE4B8BAE4B8A4E88085E4B98BE5928C0A202020202727270A202020207072696E742827494E5055543A2078203D207B7D2C2079203D207B7D272E666F726D617428782C207929290A0A202020205F78203D20666C6F61742878290A202020205F79203D20666C6F61742879290A20202020726573756C74203D205F78202B205F790A202020206966206973696E7374616E636528782C20696E742920616E64206973696E7374616E636528792C20696E74293A0A2020202020202020726573756C74203D20696E7428726573756C74290A0A202020207072696E7428275C74524553554C543A207B7D272E666F726D617428726573756C7429290A2020202072657475726E20726573756C740A0A2320E6B58BE8AF95E587BDE695B0E4B88DE99C80E8A681E8A385E9A5B0E599A80A64656620746573745F706C757328293A0A2020202061737365727420706C757328312C203129203D3D20320A2020202061737365727420706C757328312C20312E3129203D3D20322E310A2020202061737365727420706C757328312E312C20312E3229203D3D20322E330A2020202072657475726E20274F4B27',X'6332663465383131313137323838396263653331313861366164383936666339',NULL,'2020-09-19 09:37:30','2021-07-19 18:16:09');

/*!40000 ALTER TABLE `biz_main_script` ENABLE KEYS */;
UNLOCK TABLES;


# 转储表 biz_main_script_failure
# ------------------------------------------------------------

DROP TABLE IF EXISTS `biz_main_script_failure`;

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



# 转储表 biz_main_script_log
# ------------------------------------------------------------

DROP TABLE IF EXISTS `biz_main_script_log`;

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



# 转储表 biz_main_script_publish_history
# ------------------------------------------------------------

DROP TABLE IF EXISTS `biz_main_script_publish_history`;

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



# 转储表 biz_main_script_recover_point
# ------------------------------------------------------------

DROP TABLE IF EXISTS `biz_main_script_recover_point`;

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



# 转储表 biz_main_script_set
# ------------------------------------------------------------

DROP TABLE IF EXISTS `biz_main_script_set`;

CREATE TABLE `biz_main_script_set` (
  `seq` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `title` varchar(256) DEFAULT NULL COMMENT '标题',
  `description` text COMMENT '描述',
  `requirements` text COMMENT '依赖包',
  `lockedByUserId` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT '锁定者用户ID',
  `createTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updateTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`seq`),
  UNIQUE KEY `ID` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='脚本集';

LOCK TABLES `biz_main_script_set` WRITE;
/*!40000 ALTER TABLE `biz_main_script_set` DISABLE KEYS */;

INSERT INTO `biz_main_script_set` (`seq`, `id`, `title`, `description`, `requirements`, `lockedByUserId`, `createTime`, `updateTime`)
VALUES
	(1,X'64656D6F','示例',NULL,NULL,NULL,'2020-09-19 09:36:57','2020-09-29 13:40:21');

/*!40000 ALTER TABLE `biz_main_script_set` ENABLE KEYS */;
UNLOCK TABLES;


# 转储表 biz_main_script_set_export_history
# ------------------------------------------------------------

DROP TABLE IF EXISTS `biz_main_script_set_export_history`;

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



# 转储表 biz_main_script_set_import_history
# ------------------------------------------------------------

DROP TABLE IF EXISTS `biz_main_script_set_import_history`;

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



# 转储表 biz_main_task_result_dataflux_func
# ------------------------------------------------------------

DROP TABLE IF EXISTS `biz_main_task_result_dataflux_func`;

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



# 转储表 biz_rel_func_running_info
# ------------------------------------------------------------

DROP TABLE IF EXISTS `biz_rel_func_running_info`;

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



# 转储表 wat_main_access_key
# ------------------------------------------------------------

DROP TABLE IF EXISTS `wat_main_access_key`;

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



# 转储表 wat_main_system_config
# ------------------------------------------------------------

DROP TABLE IF EXISTS `wat_main_system_config`;

CREATE TABLE `wat_main_system_config` (
  `seq` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `value` text CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '值',
  `createTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updateTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`seq`),
  UNIQUE KEY `ID` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;



# 转储表 wat_main_task_result_example
# ------------------------------------------------------------

DROP TABLE IF EXISTS `wat_main_task_result_example`;

CREATE TABLE `wat_main_task_result_example` (
  `seq` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `task` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `origin` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `startTime` int(11) DEFAULT NULL,
  `endTime` int(11) DEFAULT NULL,
  `argsJSON` text,
  `kwargsJSON` text,
  `retvalJSON` text,
  `status` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `einfoTEXT` text,
  `createTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updateTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`seq`),
  UNIQUE KEY `ID` (`id`),
  KEY `TASK` (`task`),
  KEY `ORIGIN` (`origin`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;



# 转储表 wat_main_user
# ------------------------------------------------------------

DROP TABLE IF EXISTS `wat_main_user`;

CREATE TABLE `wat_main_user` (
  `seq` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `username` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `passwordHash` text CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `name` varchar(256) DEFAULT NULL,
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

LOCK TABLES `wat_main_user` WRITE;
/*!40000 ALTER TABLE `wat_main_user` DISABLE KEYS */;

INSERT INTO `wat_main_user` (`seq`, `id`, `username`, `passwordHash`, `name`, `mobile`, `markers`, `roles`, `customPrivileges`, `isDisabled`, `createTime`, `updateTime`)
VALUES
	(1,X'752D61646D696E',X'61646D696E',X'3033343439636639336562643866363766363532663961383262323134383338306232353937656564643737373936333234353437326265333331316537356633616535313632343462366437363438623962303434653235323363323834306264663836613835323033376462376535386539623231363533396232643231','系统管理员',NULL,NULL,'sa','*',0,'2017-07-28 18:08:03','2020-07-24 08:16:51');

/*!40000 ALTER TABLE `wat_main_user` ENABLE KEYS */;
UNLOCK TABLES;



/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
