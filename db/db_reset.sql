# 1. 导入`db/dataflux_func_latest.sql`
# 2. 更新数据库结构
# 3. 运行以下代码SQL，清空无用数据
# 4. 导出所有数据库表，保存为`db/dataflux-func_YYYY-MM-DD.sql`和`db/dataflux-func_latest.sql`

# 清空无用数据
TRUNCATE biz_main_api_auth;
TRUNCATE biz_main_auth_link;
TRUNCATE biz_main_batch;
TRUNCATE biz_main_batch_task_info;
TRUNCATE biz_main_blueprint;
TRUNCATE biz_main_crontab_config;
TRUNCATE biz_main_crontab_task_info;
TRUNCATE biz_main_data_source;
TRUNCATE biz_main_env_variable;
TRUNCATE biz_main_file_service;
# TRUNCATE biz_main_func
TRUNCATE biz_main_func_store;
TRUNCATE biz_main_operation_record;
# TRUNCATE biz_main_script
TRUNCATE biz_main_script_failure;
TRUNCATE biz_main_script_log;
TRUNCATE biz_main_script_publish_history;
TRUNCATE biz_main_script_recover_point;
# TRUNCATE biz_main_script_set
TRUNCATE biz_main_script_set_export_history;
TRUNCATE biz_main_script_set_import_history;
TRUNCATE biz_main_task_info;
TRUNCATE biz_main_task_result_dataflux_func;
TRUNCATE biz_rel_func_running_info;
TRUNCATE wat_main_access_key;
TRUNCATE wat_main_system_config;
TRUNCATE wat_main_task_result_example;

# admin用户密码清空
TRUNCATE wat_main_user;
INSERT INTO `wat_main_user`
  (`id`, `username`, `passwordHash`, `name`, `mobile`, `markers`, `roles`, `customPrivileges`, `isDisabled`)
VALUES
  ('u-admin','admin', NULL,'Administrator',NULL,NULL,'sa','*',0);

# 示例脚本集/脚本/函数数据初始化
UPDATE biz_main_script SET publishVersion = 1;

UPDATE biz_main_script AS t0
JOIN (
    SELECT t1.id, COUNT(t1.seq) AS count FROM biz_main_script AS t1
    JOIN biz_main_script AS t2
        ON t2.seq <= t1.seq
    GROUP BY t1.seq) AS t3 ON t0.id = t3.id
SET
    t0.seq = t3.count;
ALTER TABLE biz_main_script MODIFY COLUMN `seq` BIGINT(20) UNSIGNED NOT NULL;
ALTER TABLE biz_main_script MODIFY COLUMN `seq` BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT;

UPDATE biz_main_script_set AS t0
JOIN (
    SELECT t1.id, COUNT(t1.seq) AS count FROM biz_main_script_set AS t1
    JOIN biz_main_script_set AS t2
        ON t2.seq <= t1.seq
    GROUP BY t1.seq) AS t3 ON t0.id = t3.id
SET
    t0.seq = t3.count;
ALTER TABLE biz_main_script_set MODIFY COLUMN `seq` BIGINT(20) UNSIGNED NOT NULL;
ALTER TABLE biz_main_script_set MODIFY COLUMN `seq` BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT;

UPDATE biz_main_func AS t0
JOIN (
    SELECT t1.id, COUNT(t1.seq) AS count FROM biz_main_func AS t1
    JOIN biz_main_func AS t2
        ON t2.seq <= t1.seq
    GROUP BY t1.seq) AS t3 ON t0.id = t3.id
SET
    t0.seq = t3.count;
ALTER TABLE biz_main_func MODIFY COLUMN `seq` BIGINT(20) UNSIGNED NOT NULL;
ALTER TABLE biz_main_func MODIFY COLUMN `seq` BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT;

# 示例数据
INSERT INTO `biz_main_auth_link` (`id`, `funcId`, `funcCallKwargsJSON`, `tagsJSON`, `expireTime`, `throttlingJSON`, `origin`, `showInDoc`, `isDisabled`, `note`, `createTime`, `updateTime`)
VALUES
    (X'61756C6E2D706C7573', X'64656D6F5F5F62617369632E706C7573', '{\"x\":\"INPUT_BY_CALLER\",\"y\":\"INPUT_BY_CALLER\"}', NULL, NULL, '{}', X'5549', 0, 0, NULL, '2021-07-19 18:13:18', '2021-07-19 18:13:18');

INSERT INTO `biz_main_crontab_config` (`id`, `funcId`, `funcCallKwargsJSON`, `crontab`, `tagsJSON`, `saveResult`, `scope`, `configMD5`, `expireTime`, `origin`, `isDisabled`, `note`, `createTime`, `updateTime`)
VALUES
    (X'63726F6E2D694C445546434D6C4D445254', X'64656D6F5F5F62617369632E706C7573', '{\"x\":1,\"y\":2}', X'2A2F35202A202A202A202A', '[]', 0, X'474C4F42414C', NULL, NULL, X'5549', 0, NULL, '2021-07-19 18:29:09', '2021-07-19 18:29:09');
