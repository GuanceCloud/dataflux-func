-- -------------------------------------------------------------
-- TablePlus 3.7.0(330)
--
-- https://tableplus.com/
--
-- Database: dataflux_func
-- Generation Time: 2020-08-11 12:45:31.5950
-- -------------------------------------------------------------


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


DROP TABLE IF EXISTS `biz_main_auth_link`;
CREATE TABLE `biz_main_auth_link` (
  `seq` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `id` varchar(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL COMMENT '兼任Token',
  `funcId` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '函数ID',
  `funcCallKwargsJSON` json NOT NULL COMMENT '函数调用参数JSON (kwargs)',
  `expireTime` datetime DEFAULT NULL COMMENT '过期时间（NULL表示永不过期）',
  `throttlingJSON` json DEFAULT NULL COMMENT '限流JSON（value="<From Parameter>"表示从参数获取）',
  `origin` varchar(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL DEFAULT 'API' COMMENT '来源 API|UI',
  `showInDoc` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否在文档中显示',
  `isDisabled` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否禁用',
  `note` text COMMENT '备注',
  `createTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updateTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`seq`),
  UNIQUE KEY `ID` (`id`),
  KEY `ORIGIN` (`origin`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='授权链接';

DROP TABLE IF EXISTS `biz_main_batch`;
CREATE TABLE `biz_main_batch` (
  `seq` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `id` varchar(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL COMMENT '兼任Token',
  `funcId` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '函数ID',
  `funcCallKwargsJSON` json NOT NULL COMMENT '函数调用参数JSON (kwargs)',
  `tagsJSON` json DEFAULT NULL COMMENT '批处理标签JSON',
  `origin` varchar(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL DEFAULT 'API' COMMENT '来源 API|UI',
  `showInDoc` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否在文档中显示',
  `isDisabled` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否禁用',
  `note` text COMMENT '备注',
  `createTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updateTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`seq`),
  UNIQUE KEY `ID` (`id`),
  KEY `ORIGIN` (`origin`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='批处理';

DROP TABLE IF EXISTS `biz_main_batch_task_info`;
CREATE TABLE `biz_main_batch_task_info` (
  `seq` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `id` varchar(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `batchId` varchar(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL COMMENT '批处理ID',
  `funcId` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '函数ID',
  `scriptPublishVersion` bigint(20) DEFAULT NULL COMMENT '脚本发布版本',
  `queueTime` timestamp NULL DEFAULT NULL COMMENT '入队时间',
  `startTime` timestamp NULL DEFAULT NULL COMMENT '启动时间',
  `endTime` timestamp NULL DEFAULT NULL COMMENT '结束时间',
  `status` varchar(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL DEFAULT 'queued' COMMENT '状态 queued|pending|success|failure',
  `logMessageTEXT` longtext COMMENT '日志信息TEXT',
  `einfoTEXT` longtext COMMENT '错误信息TEXT',
  `createTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updateTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`seq`),
  UNIQUE KEY `ID` (`id`),
  KEY `BATCH_ID` (`batchId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='批处理任务信息';

DROP TABLE IF EXISTS `biz_main_crontab_config`;
CREATE TABLE `biz_main_crontab_config` (
  `seq` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `id` varchar(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `funcId` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '函数ID',
  `funcCallKwargsJSON` json NOT NULL COMMENT '函数调用参数JSON (kwargs)',
  `crontab` varchar(64) CHARACTER SET ascii COLLATE ascii_bin DEFAULT NULL COMMENT '执行频率（Crontab语法）',
  `tagsJSON` json DEFAULT NULL COMMENT '自动触发配置标签JSON',
  `saveResult` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否需要保存结果',
  `scope` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT 'GLOBAL' COMMENT '范围',
  `configMD5` char(32) CHARACTER SET ascii COLLATE ascii_bin DEFAULT NULL COMMENT '配置MD5',
  `expireTime` timestamp NULL DEFAULT NULL COMMENT '过期时间',
  `origin` varchar(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL DEFAULT 'API' COMMENT '来源 API|UI',
  `isDisabled` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否已禁用',
  `note` text COMMENT '备注',
  `createTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updateTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`seq`),
  UNIQUE KEY `ID` (`id`),
  UNIQUE KEY `SCOPE_CONFIG` (`scope`,`configMD5`),
  KEY `ORIGIN` (`origin`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='自动触发配置';

DROP TABLE IF EXISTS `biz_main_crontab_task_info`;
CREATE TABLE `biz_main_crontab_task_info` (
  `seq` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `id` varchar(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `crontabConfigId` varchar(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL COMMENT '自动触发配置ID',
  `funcId` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '函数ID',
  `scriptPublishVersion` bigint(20) DEFAULT NULL COMMENT '脚本发布版本',
  `queueTime` timestamp NULL DEFAULT NULL COMMENT '入队时间',
  `startTime` timestamp NULL DEFAULT NULL COMMENT '启动时间',
  `endTime` timestamp NULL DEFAULT NULL COMMENT '结束时间',
  `status` varchar(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL DEFAULT 'queued' COMMENT '状态 queued|pending|success|failure',
  `logMessageTEXT` longtext COMMENT '日志信息TEXT',
  `einfoTEXT` longtext COMMENT '错误信息TEXT',
  `createTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updateTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`seq`),
  UNIQUE KEY `ID` (`id`),
  KEY `CRONTAB_CONFIG_ID` (`crontabConfigId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='自动触发任务信息';

DROP TABLE IF EXISTS `biz_main_data_source`;
CREATE TABLE `biz_main_data_source` (
  `seq` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `id` varchar(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `title` varchar(256) DEFAULT NULL COMMENT '标题',
  `description` text COMMENT '描述',
  `type` varchar(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL COMMENT '类型 influxdb|mysql|redis|..',
  `configJSON` json NOT NULL COMMENT '配置JSON',
  `isBuiltin` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否为内建数据源',
  `createTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updateTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`seq`),
  UNIQUE KEY `ID` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='数据源';

DROP TABLE IF EXISTS `biz_main_env_variable`;
CREATE TABLE `biz_main_env_variable` (
  `seq` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `id` varchar(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `title` varchar(256) DEFAULT NULL COMMENT '标题',
  `description` text COMMENT '描述',
  `valueTEXT` longtext NOT NULL COMMENT '值',
  `autoTypeCasting` varchar(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL DEFAULT 'string' COMMENT '自动类型转换 string|integer|float|boolean|json|commaArray',
  `createTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updateTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`seq`),
  UNIQUE KEY `ID` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='环境变量';

DROP TABLE IF EXISTS `biz_main_func`;
CREATE TABLE `biz_main_func` (
  `seq` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `id` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `scriptSetId` varchar(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL COMMENT '脚本集ID',
  `scriptId` varchar(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL COMMENT '脚本ID',
  `name` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '函数名',
  `title` varchar(256) DEFAULT NULL COMMENT '标题',
  `description` text COMMENT '描述（函数文档）',
  `definition` text CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '定义（函数签名）',
  `argsJSON` json DEFAULT NULL COMMENT '位置参数JSON',
  `kwargsJSON` json DEFAULT NULL COMMENT '命名参数JSON',
  `extraConfigJSON` json DEFAULT NULL COMMENT '函数额外配置JSON',
  `category` varchar(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL DEFAULT 'general' COMMENT '类别 general|prediction|transformation|action|command|query|check',
  `integration` varchar(64) CHARACTER SET ascii COLLATE ascii_bin DEFAULT NULL COMMENT '集成',
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

DROP TABLE IF EXISTS `biz_main_func_store`;
CREATE TABLE `biz_main_func_store` (
  `seq` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `id` varchar(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
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

DROP TABLE IF EXISTS `biz_main_operation_record`;
CREATE TABLE `biz_main_operation_record` (
  `seq` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `id` varchar(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `userId` varchar(64) CHARACTER SET ascii COLLATE ascii_bin DEFAULT NULL COMMENT '用户ID',
  `username` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT '用户名',
  `clientId` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT '客户端ID',
  `traceId` varchar(128) CHARACTER SET ascii COLLATE ascii_bin DEFAULT NULL COMMENT '跟踪ID',
  `reqMethod` varchar(64) CHARACTER SET ascii COLLATE ascii_bin DEFAULT NULL COMMENT '请求方法',
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

DROP TABLE IF EXISTS `biz_main_script`;
CREATE TABLE `biz_main_script` (
  `seq` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `id` varchar(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `scriptSetId` varchar(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL COMMENT '脚本集ID',
  `title` varchar(256) DEFAULT NULL COMMENT '标题',
  `description` text COMMENT '描述',
  `publishVersion` bigint(20) NOT NULL DEFAULT '0' COMMENT '发布版本',
  `type` varchar(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL DEFAULT 'python' COMMENT '类型 python',
  `code` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin COMMENT '代码',
  `codeMD5` char(32) CHARACTER SET ascii COLLATE ascii_bin DEFAULT NULL COMMENT '代码MD5',
  `codeDraft` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin COMMENT '代码（编辑中草稿）',
  `codeDraftMD5` char(32) CHARACTER SET ascii COLLATE ascii_bin DEFAULT NULL COMMENT '代码（编辑中草稿）MD5',
  `lockedByUserId` varchar(64) CHARACTER SET ascii COLLATE ascii_bin DEFAULT NULL COMMENT '锁定者用户ID',
  `createTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updateTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`seq`),
  UNIQUE KEY `ID` (`id`),
  KEY `SCRIPT_SET_ID` (`scriptSetId`),
  FULLTEXT KEY `FT` (`code`,`codeDraft`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='脚本';

DROP TABLE IF EXISTS `biz_main_script_failure`;
CREATE TABLE `biz_main_script_failure` (
  `seq` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `id` varchar(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `funcId` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '函数ID',
  `scriptPublishVersion` bigint(20) NOT NULL COMMENT '脚本发布版本',
  `execMode` varchar(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL COMMENT '执行模式 sync|async|crontab',
  `einfoTEXT` longtext COMMENT '错误信息',
  `exception` varchar(64) DEFAULT NULL COMMENT '异常',
  `traceInfoJSON` json DEFAULT NULL COMMENT '跟踪信息JSON',
  `note` text COMMENT '备注',
  `createTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updateTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`seq`),
  UNIQUE KEY `ID` (`id`),
  KEY `ENTRY` (`funcId`, `scriptPublishVersion`),
  KEY `CREATE_TIME` (`createTime`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='脚本故障信息';

DROP TABLE IF EXISTS `biz_main_script_log`;
CREATE TABLE `biz_main_script_log` (
  `seq` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `id` varchar(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `funcId` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '函数ID',
  `scriptPublishVersion` bigint(20) NOT NULL COMMENT '脚本发布版本',
  `execMode` varchar(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL COMMENT '执行模式 sync|async|crontab',
  `messageTEXT` longtext COMMENT '日志信息TEXT',
  `createTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updateTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`seq`),
  UNIQUE KEY `ID` (`id`),
  KEY `ENTRY` (`funcId`,`scriptPublishVersion`),
  KEY `CREATE_TIME` (`createTime`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='脚本日志信息';

DROP TABLE IF EXISTS `biz_main_script_publish_history`;
CREATE TABLE `biz_main_script_publish_history` (
  `seq` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `id` varchar(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `scriptId` varchar(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL COMMENT '脚本ID',
  `scriptPublishVersion` bigint(20) NOT NULL COMMENT '脚本发布版本',
  `scriptCode_cache` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '脚本代码（缓存字段）',
  `note` text COMMENT '发布备注',
  `createTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updateTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`seq`),
  UNIQUE KEY `ID` (`id`),
  FULLTEXT KEY `FT` (`scriptCode_cache`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='脚本发布历史';

DROP TABLE IF EXISTS `biz_main_script_recover_point`;
CREATE TABLE `biz_main_script_recover_point` (
  `seq` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `id` varchar(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `type` varchar(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL DEFAULT 'manual' COMMENT '类型 import|manual',
  `tableDumpJSON` json NOT NULL COMMENT '表备份数据JSON',
  `note` text COMMENT '备注',
  `createTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updateTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`seq`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='脚本还原点';

DROP TABLE IF EXISTS `biz_main_script_set`;
CREATE TABLE `biz_main_script_set` (
  `seq` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `id` varchar(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `title` varchar(256) DEFAULT NULL COMMENT '标题',
  `description` text COMMENT '描述',
  `lockedByUserId` varchar(64) CHARACTER SET ascii COLLATE ascii_bin DEFAULT NULL COMMENT '锁定者用户ID',
  `createTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updateTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`seq`),
  UNIQUE KEY `ID` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='脚本集';

DROP TABLE IF EXISTS `biz_main_script_set_export_history`;
CREATE TABLE `biz_main_script_set_export_history` (
  `seq` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `id` varchar(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `note` text COMMENT '操作备注',
  `summaryJSON` json NOT NULL COMMENT '导出摘要JSON',
  `createTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updateTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`seq`),
  UNIQUE KEY `ID` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='导出历史';

DROP TABLE IF EXISTS `biz_main_script_set_import_history`;
CREATE TABLE `biz_main_script_set_import_history` (
  `seq` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `id` varchar(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `note` text COMMENT '操作备注',
  `summaryJSON` json NOT NULL COMMENT '导出摘要JSON',
  `createTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updateTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`seq`),
  UNIQUE KEY `ID` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='导出历史';

DROP TABLE IF EXISTS `biz_main_task_result_dataflux_func`;
CREATE TABLE `biz_main_task_result_dataflux_func` (
  `seq` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `id` varchar(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `task` varchar(128) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `origin` varchar(128) CHARACTER SET ascii COLLATE ascii_bin DEFAULT NULL,
  `startTime` int(11) DEFAULT NULL COMMENT '任务开始时间(秒级UNIX时间戳)',
  `endTime` int(11) DEFAULT NULL COMMENT '任务结束时间(秒级UNIX时间戳)',
  `argsJSON` json DEFAULT NULL COMMENT '列表参数JSON',
  `kwargsJSON` json DEFAULT NULL COMMENT '字典参数JSON',
  `retvalJSON` json DEFAULT NULL COMMENT '执行结果JSON',
  `status` varchar(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL COMMENT '任务状态: SUCCESS|FAILURE',
  `einfoTEXT` longtext COMMENT '错误信息TEXT',
  `createTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updateTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`seq`),
  UNIQUE KEY `ID` (`id`),
  KEY `TASK` (`task`),
  KEY `ORIGIN` (`origin`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='DataFluxFunc 任务结果';

DROP TABLE IF EXISTS `biz_rel_func_running_info`;
CREATE TABLE `biz_rel_func_running_info` (
  `seq` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `funcId` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '函数ID',
  `scriptPublishVersion` bigint(20) NOT NULL COMMENT '脚本发布版本',
  `execMode` varchar(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL COMMENT '执行模式 sync|async|crontab',
  `succeedCount` int(11) NOT NULL DEFAULT '0' COMMENT '成功次数',
  `failCount` int(11) NOT NULL DEFAULT '0' COMMENT '失败次数',
  `minCost` int(11) DEFAULT NULL COMMENT '最小耗时（毫秒）',
  `maxCost` int(11) DEFAULT NULL COMMENT '最大耗时（毫秒）',
  `totalCost` bigint(11) DEFAULT NULL COMMENT '累积耗时（毫秒）',
  `latestCost` int(11) DEFAULT NULL COMMENT '最近消耗（毫秒）',
  `latestSucceedTime` timestamp NULL DEFAULT NULL COMMENT '最近成功时间',
  `latestFailTime` timestamp NULL DEFAULT NULL COMMENT '最近失败时间',
  `status` varchar(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL DEFAULT 'neverStarted' COMMENT '状态 neverStarted|succeed|fail|timeout',
  `createTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updateTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`seq`),
  UNIQUE KEY `BIZ` (`funcId`,`scriptPublishVersion`,`execMode`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='函数执行信息';

DROP TABLE IF EXISTS `wat_main_access_key`;
CREATE TABLE `wat_main_access_key` (
  `seq` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `id` varchar(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `userId` varchar(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `name` varchar(256) NOT NULL,
  `secret` varchar(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `webhookURL` text,
  `webhookEvents` text,
  `allowWebhookEcho` tinyint(1) NOT NULL DEFAULT '0',
  `createTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updateTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`seq`),
  UNIQUE KEY `ID` (`id`),
  KEY `USER_ID` (`userId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

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

DROP TABLE IF EXISTS `wat_main_task_result_example`;
CREATE TABLE `wat_main_task_result_example` (
  `seq` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `id` varchar(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `task` varchar(128) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `origin` varchar(128) CHARACTER SET ascii COLLATE ascii_bin DEFAULT NULL,
  `startTime` int(11) DEFAULT NULL,
  `endTime` int(11) DEFAULT NULL,
  `argsJSON` text,
  `kwargsJSON` text,
  `retvalJSON` text,
  `status` varchar(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `einfoTEXT` text,
  `createTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updateTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`seq`),
  UNIQUE KEY `ID` (`id`),
  KEY `TASK` (`task`),
  KEY `ORIGIN` (`origin`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

DROP TABLE IF EXISTS `wat_main_user`;
CREATE TABLE `wat_main_user` (
  `seq` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `id` varchar(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `username` varchar(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `passwordHash` text CHARACTER SET ascii COLLATE ascii_bin,
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

INSERT INTO `wat_main_user` (`seq`, `id`, `username`, `passwordHash`, `name`, `mobile`, `markers`, `roles`, `customPrivileges`, `isDisabled`, `createTime`, `updateTime`) VALUES
('1', 'u-admin', 'admin', '03449cf93ebd8f67f652f9a82b2148380b2597eedd777963245472be3311e75f3ae516244b6d7648b9b044e2523c2840bdf86a852037db7e58e9b216539b2d21', '系统管理员', NULL, NULL, 'sa', '*', '0', '2017-07-28 18:08:03', '2020-07-24 08:16:51');



/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
