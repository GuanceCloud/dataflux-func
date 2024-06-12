DROP TABLE IF EXISTS `biz_main_task_record`;
CREATE TABLE `biz_main_task_record` (
  `seq` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `name` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '任务名',
  `kwargsJSON` json COMMENT '调用参数JSON',
  `triggerTimeMs` bigint(20) unsigned NOT NULL COMMENT '触发时间（UNIX毫秒时间戳）',
  `startTimeMs` bigint(20) unsigned NOT NULL COMMENT '启动时间（UNIX毫秒时间戳）',
  `endTimeMs` bigint(20) unsigned NOT NULL COMMENT '结束时间（UNIX毫秒时间戳）',
  `eta` text COMMENT 'ETA',
  `delay` bigint(20) unsigned NOT NULL COMMENT '延迟时间',
  `queue` bigint(20) unsigned NOT NULL COMMENT '执行队列',
  `timeout` bigint(20) unsigned NOT NULL COMMENT '超时时间',
  `expires` bigint(20) unsigned NOT NULL COMMENT '过期时间',
  `ignoreResult` tinyint(1) NOT NULL COMMENT '是否忽略结果',
  `resultJSON` json COMMENT '结果JSON',
  `status` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '状态 success|failure|timeout|skip',
  `exceptionType` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '错误类型',
  `exceptionTEXT` longtext COMMENT '错误TEXT',
  `tracebackTEXT` longtext COMMENT '调用堆栈TEXT',
  `nonCriticalErrorsTEXT` longtext COMMENT '非关键错误TEXT',
  `createTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updateTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`seq`),
  UNIQUE KEY `ID` (`id`),
  KEY `NAME` (`name`),
  KEY `TRIGGER_TIME_MS` (`triggerTimeMs`),
  KEY `QUEUE` (`queue`),
  KEY `STATUS` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='任务记录';

LOCK TABLES `biz_main_task_record` WRITE;
UNLOCK TABLES;

DROP TABLE IF EXISTS `biz_main_task_record_func`;
CREATE TABLE `biz_main_task_record_func` (
  `seq` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `rootTaskId` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT 'ROOT' COMMENT '主任务ID',
  `scriptSetId` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '脚本集ID',
  `scriptId` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '脚本ID',
  `funcId` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '函数ID',
  `funcCallKwargsJSON` json COMMENT '调用参数JSON',
  `origin` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT 'UNKNOWN' COMMENT '任务来源',
  `originId` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT 'UNKNOWN' COMMENT '任务来源 ID',
  `cronExpr` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Cron 表达式',
  `callChainJSON` json COMMENT '函数调用链JSON',
  `triggerTimeMs` bigint(20) unsigned NOT NULL COMMENT '触发时间（UNIX毫秒时间戳）',
  `startTimeMs` bigint(20) unsigned NOT NULL COMMENT '启动时间（UNIX毫秒时间戳）',
  `endTimeMs` bigint(20) unsigned NOT NULL COMMENT '结束时间（UNIX毫秒时间戳）',
  `eta` text COMMENT 'ETA',
  `delay` bigint(20) unsigned NOT NULL COMMENT '延迟时间',
  `queue` bigint(20) unsigned NOT NULL COMMENT '执行队列',
  `timeout` bigint(20) unsigned NOT NULL COMMENT '超时时间',
  `expires` bigint(20) unsigned NOT NULL COMMENT '过期时间',
  `ignoreResult` tinyint(1) NOT NULL COMMENT '是否忽略结果',
  `status` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '状态 success|failure',
  `exceptionType` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '错误类型',
  `exceptionTEXT` longtext COMMENT '错误TEXT',
  `tracebackTEXT` longtext COMMENT '调用堆栈TEXT',
  `nonCriticalErrorsTEXT` longtext COMMENT '非关键错误TEXT',
  `printLogsTEXT` longtext COMMENT 'print日志TEXT',
  `returnValueJSON` json COMMENT '返回值JSON',
  `responseControlJSON` json COMMENT '响应控制JSON',
  `createTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updateTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`seq`),
  UNIQUE KEY `ID` (`id`),
  KEY `ROOT_TASK_ID` (`rootTaskId`),
  KEY `SCRIPT_TASK_ID` (`scriptSetId`),
  KEY `SCRIPT_ID` (`scriptId`),
  KEY `FUNC_ID` (`funcId`),
  KEY `ORIGIN` (`origin`),
  KEY `ORIGIN_ID` (`originId`),
  KEY `TRIGGER_TIME_MS` (`triggerTimeMs`),
  KEY `QUEUE` (`queue`),
  KEY `STATUS` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='任务记录（函数）';

LOCK TABLES `biz_main_task_record_func` WRITE;
UNLOCK TABLES;

DROP TABLE IF EXISTS `biz_main_api_auth`;
CREATE TABLE `biz_main_api_auth` (
  `seq` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `title` varchar(256) DEFAULT NULL COMMENT '标题',
  `type` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '类型 fixedField|httpBasic|httpDigest|func',
  `configJSON` json NOT NULL COMMENT '配置JSON',
  `note` text COMMENT '备注',
  `createTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updateTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`seq`),
  UNIQUE KEY `ID` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='API认证';

LOCK TABLES `biz_main_api_auth` WRITE;
UNLOCK TABLES;

DROP TABLE IF EXISTS `biz_main_sync_api`;
CREATE TABLE `biz_main_sync_api` (
  `seq` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '兼任Token',
  `funcId` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '函数ID',
  `funcCallKwargsJSON` json DEFAULT NULL COMMENT '函数调用参数JSON (kwargs)',
  `tagsJSON` json DEFAULT NULL COMMENT '标签JSON',
  `apiAuthId` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'API认证ID',
  `expireTime` datetime DEFAULT NULL COMMENT '过期时间（NULL表示永不过期）',
  `throttlingJSON` json DEFAULT NULL COMMENT '限流JSON',
  `origin` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT 'UNKNOWN' COMMENT '来源',
  `originId` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT 'UNKNOWN' COMMENT '来源ID',
  `showInDoc` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否在文档中显示',
  `taskRecordLimit` int(11) DEFAULT NULL COMMENT '任务记录数量',
  `isDisabled` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否禁用',
  `note` text COMMENT '备注',
  `createTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updateTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`seq`),
  UNIQUE KEY `ID` (`id`),
  KEY `ORIGIN` (`origin`),
  KEY `ORIGIN_ID` (`originId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='同步 API';

LOCK TABLES `biz_main_sync_api` WRITE;
UNLOCK TABLES;

DROP TABLE IF EXISTS `biz_main_async_api`;
CREATE TABLE `biz_main_async_api` (
  `seq` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '兼任Token',
  `funcId` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '函数ID',
  `funcCallKwargsJSON` json DEFAULT NULL COMMENT '函数调用参数JSON (kwargs)',
  `tagsJSON` json DEFAULT NULL COMMENT '标签JSON',
  `apiAuthId` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'API认证ID',
  `origin` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT 'UNKNOWN' COMMENT '来源',
  `originId` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT 'UNKNOWN' COMMENT '来源ID',
  `showInDoc` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否在文档中显示',
  `taskRecordLimit` int(11) DEFAULT NULL COMMENT '任务记录数量',
  `isDisabled` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否禁用',
  `note` text COMMENT '备注',
  `createTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updateTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`seq`),
  UNIQUE KEY `ID` (`id`),
  KEY `ORIGIN` (`origin`),
  KEY `ORIGIN_ID` (`originId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='异步 API';

LOCK TABLES `biz_main_async_api` WRITE;
UNLOCK TABLES;

DROP TABLE IF EXISTS `biz_main_blueprint`;
CREATE TABLE `biz_main_blueprint` (
  `seq` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `title` varchar(256) DEFAULT NULL COMMENT '标题',
  `description` text COMMENT '描述',
  `canvasJSON` json NOT NULL COMMENT '画布JSON',
  `viewJSON` json NOT NULL COMMENT '视图JSON',
  `createTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updateTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`seq`),
  UNIQUE KEY `ID` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='蓝图';

LOCK TABLES `biz_main_blueprint` WRITE;
UNLOCK TABLES;

DROP TABLE IF EXISTS `biz_main_connector`;
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

LOCK TABLES `biz_main_connector` WRITE;
UNLOCK TABLES;

DROP TABLE IF EXISTS `biz_main_cron_job`;
CREATE TABLE `biz_main_cron_job` (
  `seq` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `funcId` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '函数ID',
  `funcCallKwargsJSON` json DEFAULT NULL COMMENT '函数调用参数JSON (kwargs)',
  `cronExpr` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT '执行频率（Cron表达式）',
  `timezone` varchar(256) DEFAULT NULL COMMENT '时区',
  `tagsJSON` json DEFAULT NULL COMMENT '标签JSON',
  `scope` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT 'GLOBAL' COMMENT '范围',
  `configMD5` char(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT '配置MD5',
  `expireTime` timestamp NULL DEFAULT NULL COMMENT '过期时间',
  `origin` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT 'UNKNOWN' COMMENT '来源',
  `originId` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT 'UNKNOWN' COMMENT '来源ID',
  `taskRecordLimit` int(11) DEFAULT NULL COMMENT '任务记录数量',
  `isDisabled` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否已禁用',
  `note` text COMMENT '备注',
  `createTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updateTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`seq`),
  UNIQUE KEY `ID` (`id`),
  UNIQUE KEY `SCOPE_CONFIG` (`scope`,`configMD5`),
  KEY `ORIGIN` (`origin`),
  KEY `ORIGIN_ID` (`originId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='定时任务';

LOCK TABLES `biz_main_cron_job` WRITE;
UNLOCK TABLES;

DROP TABLE IF EXISTS `biz_main_env_variable`;
CREATE TABLE `biz_main_env_variable` (
  `seq` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `title` varchar(256) DEFAULT NULL COMMENT '标题',
  `description` text COMMENT '描述',
  `autoTypeCasting` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT 'string' COMMENT '自动类型转换 string|password|integer|float|boolean|json|commaArray',
  `valueTEXT` longtext NOT NULL COMMENT '值',
  `pinTime` datetime DEFAULT NULL COMMENT '置顶时间',
  `createTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updateTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`seq`),
  UNIQUE KEY `ID` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='环境变量';

LOCK TABLES `biz_main_env_variable` WRITE;
UNLOCK TABLES;

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

LOCK TABLES `biz_main_file_service` WRITE;
UNLOCK TABLES;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='函数';

LOCK TABLES `biz_main_func` WRITE;
INSERT INTO `biz_main_func` (`seq`, `id`, `scriptSetId`, `scriptId`, `name`, `title`, `description`, `definition`, `argsJSON`, `kwargsJSON`, `extraConfigJSON`, `category`, `integration`, `tagsJSON`, `defOrder`, `createTime`, `updateTime`) VALUES (1,'demo__basic.plus','demo','demo__basic','plus','两数相加','两数相加\n输入参数 x, y 均为数字类型，返回结果为两者之和','plus(x, y)','[\"x\", \"y\"]','{\"x\": {}, \"y\": {}}','{\"timeout\": 10, \"cacheResult\": 300}','math',NULL,'[\"math\", \"simple\"]',0,'2021-07-19 18:13:01','2021-07-19 18:16:10.043246');
UNLOCK TABLES;

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

LOCK TABLES `biz_main_func_store` WRITE;
UNLOCK TABLES;

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

LOCK TABLES `biz_main_operation_record` WRITE;
UNLOCK TABLES;

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
  `codeMD5` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT '代码MD5',
  `codeDraft` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin COMMENT '代码（编辑中草稿）',
  `codeDraftMD5` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT '代码（编辑中草稿）MD5',
  `lockedByUserId` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT '锁定者用户ID',
  `createTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updateTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`seq`),
  UNIQUE KEY `ID` (`id`),
  KEY `SCRIPT_SET_ID` (`scriptSetId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='脚本';

LOCK TABLES `biz_main_script` WRITE;
INSERT INTO `biz_main_script` (`seq`, `id`, `scriptSetId`, `title`, `description`, `publishVersion`, `type`, `code`, `codeMD5`, `codeDraft`, `codeDraftMD5`, `lockedByUserId`, `createTime`, `updateTime`) VALUES (1,'demo__basic','demo','基础演示',NULL,1,'python','# 基础演示\n\n# 使用装饰器为函数命名为\'两数相加\'，并允许外部调用本函数\n# 额外的配置包括：\n# category=\'math\'\n#     指定分类为\"math\"\n# tags=[\'basic\', \'simple\']\n#     指定2个标签：\'basic\', \'simple\'\n# cache_result=300\n#     指定处理结果缓存300秒，后续使用完全相同的参数进行API调用时，可以直接返回而不需要重新运行\n# timeout=10\n#     指定函数执行超时时间为10秒，执行超过10秒时，将强制中断\n@DFF.API(\'两数相加\', category=\'math\', tags=[\'math\', \'simple\'], cache_result=300, timeout=10)\ndef plus(x, y):\n    \'\'\'\n    两数相加\n    输入参数 x, y 均为数字类型，返回结果为两者之和\n    \'\'\'\n    print(\'INPUT: x = {}, y = {}\'.format(x, y))\n\n    _x = float(x)\n    _y = float(y)\n    result = _x + _y\n    if isinstance(x, int) and isinstance(y, int):\n        result = int(result)\n\n    print(\'\\tRESULT: {}\'.format(result))\n    return result\n\n# 测试函数不需要装饰器\ndef test_plus():\n    assert plus(1, 1) == 2\n    assert plus(1, 1.1) == 2.1\n    assert plus(1.1, 1.2) == 2.3\n    return \'OK\'','c2f4e8111172889bce3118a6ad896fc9','# 基础演示\n\n# 使用装饰器为函数命名为\'两数相加\'，并允许外部调用本函数\n# 额外的配置包括：\n# category=\'math\'\n#     指定分类为\"math\"\n# tags=[\'basic\', \'simple\']\n#     指定2个标签：\'basic\', \'simple\'\n# cache_result=300\n#     指定处理结果缓存300秒，后续使用完全相同的参数进行API调用时，可以直接返回而不需要重新运行\n# timeout=10\n#     指定函数执行超时时间为10秒，执行超过10秒时，将强制中断\n@DFF.API(\'两数相加\', category=\'math\', tags=[\'math\', \'simple\'], cache_result=300, timeout=10)\ndef plus(x, y):\n    \'\'\'\n    两数相加\n    输入参数 x, y 均为数字类型，返回结果为两者之和\n    \'\'\'\n    print(\'INPUT: x = {}, y = {}\'.format(x, y))\n\n    _x = float(x)\n    _y = float(y)\n    result = _x + _y\n    if isinstance(x, int) and isinstance(y, int):\n        result = int(result)\n\n    print(\'\\tRESULT: {}\'.format(result))\n    return result\n\n# 测试函数不需要装饰器\ndef test_plus():\n    assert plus(1, 1) == 2\n    assert plus(1, 1.1) == 2.1\n    assert plus(1.1, 1.2) == 2.3\n    return \'OK\'','c2f4e8111172889bce3118a6ad896fc9',NULL,'2020-09-19 09:37:30','2021-07-19 18:16:09');
UNLOCK TABLES;

DROP TABLE IF EXISTS `biz_main_script_market`;
CREATE TABLE `biz_main_script_market` (
  `seq` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '脚本市场ID',
  `title` varchar(256) DEFAULT NULL COMMENT '标题',
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

LOCK TABLES `biz_main_script_market` WRITE;
UNLOCK TABLES;

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
  UNIQUE KEY `ID` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='脚本发布历史';

LOCK TABLES `biz_main_script_publish_history` WRITE;
UNLOCK TABLES;

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

LOCK TABLES `biz_main_script_recover_point` WRITE;
UNLOCK TABLES;

DROP TABLE IF EXISTS `biz_main_script_set`;
CREATE TABLE `biz_main_script_set` (
  `seq` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `title` varchar(256) DEFAULT NULL COMMENT '标题',
  `description` text COMMENT '描述',
  `requirements` text COMMENT '依赖包',
  `origin` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT 'UNKNOWN' COMMENT '来源',
  `originId` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT 'UNKNOWN' COMMENT '来源ID',
  `originMD5` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT '来源MD5',
  `lockedByUserId` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT '锁定者用户ID',
  `pinTime` datetime DEFAULT NULL COMMENT '置顶时间',
  `createTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updateTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`seq`),
  UNIQUE KEY `ID` (`id`),
  KEY `ORIGIN_ID` (`originId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='脚本集';

LOCK TABLES `biz_main_script_set` WRITE;
INSERT INTO `biz_main_script_set` (`seq`, `id`, `title`, `description`, `requirements`, `origin`, `originId`, `originMD5`, `lockedByUserId`, `pinTime`, `createTime`, `updateTime`) VALUES (1,'demo','示例',NULL,NULL,'UNKNOWN','UNKNOWN',NULL, NULL,NULL,'2020-09-19 09:36:57','2020-09-29 13:40:21');
UNLOCK TABLES;

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

LOCK TABLES `biz_main_script_set_export_history` WRITE;
UNLOCK TABLES;

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

LOCK TABLES `biz_main_script_set_import_history` WRITE;
UNLOCK TABLES;

DROP TABLE IF EXISTS `wat_main_access_key`;
CREATE TABLE `wat_main_access_key` (
  `seq` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `userId` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `title` varchar(256) NOT NULL,
  `secretCipher` longtext,
  `webhookURL` text,
  `webhookEvents` text,
  `allowWebhookEcho` tinyint(1) NOT NULL DEFAULT '0',
  `createTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updateTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`seq`),
  UNIQUE KEY `ID` (`id`),
  KEY `USER_ID` (`userId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

LOCK TABLES `wat_main_access_key` WRITE;
UNLOCK TABLES;

DROP TABLE IF EXISTS `wat_main_system_setting`;
CREATE TABLE `wat_main_system_setting` (
  `seq` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `value` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '值',
  `createTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updateTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`seq`),
  UNIQUE KEY `ID` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

LOCK TABLES `wat_main_system_setting` WRITE;
UNLOCK TABLES;

DROP TABLE IF EXISTS `wat_main_user`;
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

LOCK TABLES `wat_main_user` WRITE;
INSERT INTO `wat_main_user` (`seq`, `id`, `username`, `passwordHash`, `name`, `email`, `mobile`, `markers`, `roles`, `customPrivileges`, `isDisabled`, `createTime`, `updateTime`) VALUES (1,'u-admin','admin',NULL,'Administrator',NULL,NULL,NULL,'sa','*',0,'2022-12-06 12:04:12','2022-12-06 12:04:12');
UNLOCK TABLES;
