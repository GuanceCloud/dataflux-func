# 1. 保证最新数据库结构
# 2. 导入官方脚本包（从测试环境导出）
# 3. 运行以下代码SQL，清空无用数据
# 4. 导出所有数据库表，保存为`db/dataflux-func_YYYY-MM-DD.sql`和`db/dataflux-func_latest.sql`

# 清空无用数据
TRUNCATE biz_main_auth_link;
TRUNCATE biz_main_batch;
TRUNCATE biz_main_batch_task_info;
TRUNCATE biz_main_crontab_config;
TRUNCATE biz_main_crontab_task_info;
TRUNCATE biz_main_data_source;
TRUNCATE biz_main_env_variable;
TRUNCATE biz_main_file_service;
# biz_main_func
TRUNCATE biz_main_func_store;
TRUNCATE biz_main_operation_record;
# biz_main_script
TRUNCATE biz_main_script_failure;
TRUNCATE biz_main_script_log;
TRUNCATE biz_main_script_publish_history;
TRUNCATE biz_main_script_recover_point;
# biz_main_script_set
TRUNCATE biz_main_script_set_export_history;
TRUNCATE biz_main_script_set_import_history;
TRUNCATE biz_main_task_result_dataflux_func;
TRUNCATE biz_rel_func_running_info;
TRUNCATE wat_main_access_key;
TRUNCATE wat_main_system_config;
TRUNCATE wat_main_task_result_example;
# wat_main_user

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
INSERT INTO `biz_main_auth_link` (`id`, `funcId`, `funcCallKwargsJSON`, `expireTime`, `throttlingJSON`, `origin`, `showInDoc`, `isDisabled`, `note`)
VALUES
    (X'61756C6E2D68656C6C6F2D776F726C64', X'64656D6F5F5F62617369632E68656C6C6F5F776F726C64', '{\"name\": \"INPUT_BY_CALLER\"}', NULL, '{}', X'5549', 1, 0, NULL);

INSERT INTO `biz_main_crontab_config` (`id`, `funcId`, `funcCallKwargsJSON`, `crontab`, `tagsJSON`, `saveResult`, `scope`, `configMD5`, `expireTime`, `origin`, `isDisabled`, `note`)
VALUES
    (X'63726F6E2D6E344B41665258656975765754796D686A6E53757644', X'64656D6F5F5F62617369632E68656C6C6F5F776F726C64', '{\"name\": \"Jerry\"}', X'2A2F35202A202A202A202A', NULL, 0, X'474C4F42414C', X'6137376334313436626638333332616339323565383735373564613036383131', NULL, X'5549', 0, NULL);
