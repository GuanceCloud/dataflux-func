# 1. 保证最新数据库结构
# 2. 导入官方脚本包（从测试环境导出）
# 3. 运行以下代码SQL，清空无用数据
# 4. 导出所有数据库表，保存为`db/ft_data_processor_YYYY-MM-DD.sql`和`db/ft_data_processor_latest.sql`

# 清空无用数据
TRUNCATE biz_main_auth_link;
TRUNCATE biz_main_batch;
TRUNCATE biz_main_batch_task_info;
TRUNCATE biz_main_crontab_config;
TRUNCATE biz_main_crontab_task_info;
TRUNCATE biz_main_data_source;
TRUNCATE biz_main_env_variable;
TRUNCATE biz_main_func_store;
TRUNCATE biz_main_operation_record;
TRUNCATE biz_main_script_failure;
TRUNCATE biz_main_script_log;
TRUNCATE biz_main_script_publish_history;
TRUNCATE biz_main_script_recover_point;
TRUNCATE biz_main_script_set_export_history;
TRUNCATE biz_main_script_set_import_history;
TRUNCATE biz_main_task_result_dataflux_func;
TRUNCATE biz_rel_func_running_info;
TRUNCATE wat_main_access_key;
TRUNCATE wat_main_system_config;
TRUNCATE wat_main_task_result_example;

# 内置脚本集/脚本/函数数据初始化
UPDATE biz_main_script SET publishVersion = 1;

UPDATE biz_main_script AS t0
JOIN (
    SELECT t1.id, COUNT(t1.seq) AS count FROM biz_main_script AS t1
    JOIN biz_main_script AS t2
        ON t2.seq <= t1.seq
    GROUP BY t1.seq) AS t3 ON t0.id = t3.id
SET
    t0.seq = t3.count;
ALTER TABLE biz_main_script MODIFY COLUMN `seq` bigint(20) unsigned NOT NULL;
ALTER TABLE biz_main_script MODIFY COLUMN `seq` bigint(20) unsigned NOT NULL AUTO_INCREMENT;

UPDATE biz_main_script_set AS t0
JOIN (
    SELECT t1.id, COUNT(t1.seq) AS count FROM biz_main_script_set AS t1
    JOIN biz_main_script_set AS t2
        ON t2.seq <= t1.seq
    GROUP BY t1.seq) AS t3 ON t0.id = t3.id
SET
    t0.seq = t3.count;
ALTER TABLE biz_main_script_set MODIFY COLUMN `seq` bigint(20) unsigned NOT NULL;
ALTER TABLE biz_main_script_set MODIFY COLUMN `seq` bigint(20) unsigned NOT NULL AUTO_INCREMENT;

UPDATE biz_main_func AS t0
JOIN (
    SELECT t1.id, COUNT(t1.seq) AS count FROM biz_main_func AS t1
    JOIN biz_main_func AS t2
        ON t2.seq <= t1.seq
    GROUP BY t1.seq) AS t3 ON t0.id = t3.id
SET
    t0.seq = t3.count;
ALTER TABLE biz_main_func MODIFY COLUMN `seq` bigint(20) unsigned NOT NULL;
ALTER TABLE biz_main_func MODIFY COLUMN `seq` bigint(20) unsigned NOT NULL AUTO_INCREMENT;

# 示例数据
INSERT INTO `biz_main_auth_link` (`seq`, `id`, `funcId`, `funcCallKwargsJSON`, `expireTime`, `throttlingJSON`, `origin`, `showInDoc`, `isDisabled`, `note`, `createTime`, `updateTime`)
VALUES
    (1,X'61756C6E2D4657726B3974326777',X'64656D6F5F5F62617369632E706C7573','{\"x\": \"FROM_PARAMETER\", \"y\": \"FROM_PARAMETER\"}',NULL,'{\"bySecond\": 1}',X'5549',1,0,NULL,'2020-09-19 10:01:29','2020-09-19 10:05:58');

INSERT INTO `biz_main_crontab_config` (`seq`, `id`, `funcId`, `funcCallKwargsJSON`, `crontab`, `tagsJSON`, `saveResult`, `scope`, `configMD5`, `expireTime`, `origin`, `isDisabled`, `note`, `createTime`, `updateTime`)
VALUES
    (1,X'63726F6E2D543646437861636A6A344C78474D4D325459346F6165',X'64656D6F5F5F62617369632E706C7573','{\"x\": 1, \"y\": 2}',X'2A202A202A202A202A',NULL,0,X'474C4F42414C',X'6233653665663761316432663135373037313063373937636565346565613833',NULL,X'5549',0,NULL,'2020-09-19 10:01:47','2020-09-19 10:01:47');

