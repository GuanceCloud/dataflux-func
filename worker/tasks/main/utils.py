# -*- coding: utf-8 -*-

'''
杂项任务
包含各类清理类任务、AutoCleanTask各类数据定时同步任务、数据源检查/调试任务等
'''

# Builtin Modules
import time
import json
import random
import traceback
import pprint
import os
import subprocess
import shutil
import tempfile

# 3rd-party Modules
import six
import requests
import arrow

from six.moves.urllib_parse import urlsplit

# Project Modules
from worker import app
from worker.utils import toolkit, yaml_resources
from worker.tasks import gen_task_id, webhook
from worker.tasks.main import gen_script_failure_id, gen_script_log_id, gen_data_source_id, decipher_data_source_config_fields
from worker.utils.extra_helpers import InfluxDBHelper

# Current Module
from worker.tasks import BaseTask
from worker.tasks.main import func_runner, ScriptCacherMixin, DATA_SOURCE_HELPER_CLASS_MAP

CONFIG = yaml_resources.get('CONFIG')

# Main.ReloadScripts
class ReloadScriptsTask(BaseTask, ScriptCacherMixin):
    '''
    脚本重新载入Redis任务
    '''
    def cache_scripts_to_redis(self):
        # 获取脚本
        scripts      = self.get_scripts()
        scripts_dump = toolkit.json_dumps(scripts, sort_keys=True)
        scripts_md5  = toolkit.get_md5(scripts_dump)

        # 获取脚本缓存MD5
        cache_key = toolkit.get_cache_key('fixedCache', 'scriptsMD5')
        cached_scripts_md5 = self.cache_db.get(cache_key)
        if cached_scripts_md5:
            cached_scripts_md5 = six.ensure_str(cached_scripts_md5)

        # 缓存脚本至Redis
        if cached_scripts_md5 != scripts_md5:
            key_values = {
                toolkit.get_cache_key('fixedCache', 'scriptsDump'): scripts_dump,
                toolkit.get_cache_key('fixedCache', 'scriptsMD5') : scripts_md5,
            }
            self.cache_db.mset(key_values)

@app.task(name='Main.ReloadScripts', bind=True, base=ReloadScriptsTask)
def reload_scripts(self, *args, **kwargs):
    lock_time = kwargs.get('lockTime') or 0

    # 根据参数确定是否需要上锁
    if isinstance(lock_time, (int, float)) and lock_time > 0:
        self.lock(max_age=int(lock_time))

    # 将脚本缓存如Redis
    self.cache_scripts_to_redis()

# Main.SyncCache
class SyncCache(BaseTask):
    def sync_func_call_count(self):
        data = []

        # 搜集数据
        cache_key = toolkit.get_cache_key('syncCache', 'funcCallInfo')
        for i in range(CONFIG['_SYNC_CACHE_BULK_COUNT']):
            cache_res = self.cache_db.run('rpop', cache_key)
            if not cache_res:
                break

            try:
                cache_res = toolkit.json_loads(cache_res)
            except Exception as e:
                for line in traceback.format_exc().splitlines():
                    self.logger.error(line)
            else:
                data.append(cache_res)

        # 归类计算
        count_map = {}
        for d in data:
            func_id   = d['funcId']
            timestamp = d.get('timestamp')

            # 时间戳按照分钟对齐（减少内部时序数据存储压力）
            timestamp = int(int(timestamp) / 60) * 60

            pk = '~'.join([func_id, str(timestamp)])
            if pk not in count_map:
                count_map[pk] = {
                    'funcId'   : func_id,
                    'timestamp': timestamp,
                    'count'    : 0
                }

            count_map[pk]['count'] += 1

        # 写入时序数据
        for pk, c in count_map.items():
            cache_key = toolkit.get_server_cache_key('monitor', 'sysStats', ['metric', 'funcCallCount', 'funcId', c['funcId']]);

            self.cache_db.ts_add(cache_key, c['count'], timestamp=c['timestamp'], mode='addUp')

    def sync_script_running_info(self):
        data = []

        # 搜集数据
        cache_key = toolkit.get_cache_key('syncCache', 'scriptRunningInfo')
        for i in range(CONFIG['_SYNC_CACHE_BULK_COUNT']):
            cache_res = self.cache_db.run('rpop', cache_key)
            if not cache_res:
                break

            try:
                cache_res = toolkit.json_loads(cache_res)
            except Exception as e:
                for line in traceback.format_exc().splitlines():
                    self.logger.error(line)
            else:
                data.append(cache_res)

        # 计算最新版本号
        func_latest_version_map = {}
        for d in data:
            func_id                = d['funcId']
            script_publish_version = d['scriptPublishVersion']

            if func_id not in func_latest_version_map:
                func_latest_version_map[func_id] = script_publish_version
            else:
                func_latest_version_map[func_id] = max(script_publish_version, func_latest_version_map[func_id])

        # 分类计算
        data_map = {}
        for d in data:
            func_id                = d['funcId']
            script_publish_version = d['scriptPublishVersion']
            exec_mode              = d['execMode']
            is_failed              = d['isFailed']
            cost                   = d['cost']
            timestamp              = d.get('timestamp')

            if not timestamp:
                continue

            latest_version = func_latest_version_map.get(func_id)
            if latest_version and script_publish_version < latest_version:
                continue

            if exec_mode is None:
                exec_mode = 'sync'

            pk = '~'.join([func_id, str(script_publish_version), exec_mode])
            if pk not in data_map:
                data_map[pk] = {
                    'funcId'              : func_id,
                    'scriptPublishVersion': script_publish_version,
                    'execMode'            : exec_mode,
                }

            if 'succeedCount' not in data_map[pk]:
                data_map[pk]['succeedCount'] = 0

            if 'failCount' not in data_map[pk]:
                data_map[pk]['failCount'] = 0

            data_map[pk]['latestFailTimestamp']    = None
            data_map[pk]['latestSucceedTimestamp'] = None

            if is_failed:
                data_map[pk]['failCount']           += 1
                data_map[pk]['latestFailTimestamp'] = timestamp
                data_map[pk]['status']              = 'failed'
            else:
                data_map[pk]['succeedCount']           += 1
                data_map[pk]['latestSucceedTimestamp'] = timestamp
                data_map[pk]['status']                 = 'succeeded'

            if 'minCost' not in data_map[pk]:
                data_map[pk]['minCost'] = cost
            else:
                data_map[pk]['minCost'] = min(data_map[pk]['minCost'], cost)

            if 'maxCost' not in data_map[pk]:
                data_map[pk]['maxCost'] = cost
            else:
                data_map[pk]['maxCost'] = max(data_map[pk]['maxCost'], cost)

            if 'totalCost' not in data_map[pk]:
                data_map[pk]['totalCost'] = cost
            else:
                data_map[pk]['totalCost'] += cost

            data_map[pk]['latestCost'] = cost

        # 分类入库
        for pk, d in data_map.items():
            func_id                = d['funcId']
            script_publish_version = d['scriptPublishVersion']
            exec_mode              = d['execMode']

            sql = '''
                SELECT
                     `succeedCount`
                    ,`failCount`
                    ,`minCost`
                    ,`maxCost`
                    ,`totalCost`
                    ,`latestCost`
                    ,UNIX_TIMESTAMP(`latestSucceedTime`) AS `latestSucceedTimestamp`
                    ,UNIX_TIMESTAMP(`latestFailTime`)    AS `latestFailTimestamp`
                    ,`status`
                FROM biz_rel_func_running_info
                WHERE
                        `funcId`               = ?
                    AND `scriptPublishVersion` = ?
                    AND `execMode`             = ?
                LIMIT 1
                '''
            sql_params = [
                func_id,
                script_publish_version,
                exec_mode,
            ]
            prev_info = self.db.query(sql, sql_params)

            # 删除已过时记录

            if not prev_info:
                # 无记录，则补全记录
                sql = '''
                    INSERT IGNORE INTO biz_rel_func_running_info
                    SET
                       `funcId`               = ?
                      ,`scriptPublishVersion` = ?
                      ,`execMode`             = ?

                      ,`succeedCount`      = ?
                      ,`failCount`         = ?
                      ,`minCost`           = ?
                      ,`maxCost`           = ?
                      ,`totalCost`         = ?
                      ,`latestCost`        = ?
                      ,`latestSucceedTime` = FROM_UNIXTIME(?)
                      ,`latestFailTime`    = FROM_UNIXTIME(?)
                      ,`status`            = ?
                '''
                sql_params = [
                    func_id,
                    script_publish_version,
                    exec_mode,

                    d['succeedCount'],
                    d['failCount'],
                    d['minCost'],
                    d['maxCost'],
                    d['totalCost'],
                    d['latestCost'],
                    d['latestSucceedTimestamp'],
                    d['latestFailTimestamp'],
                    d['status'],
                ]
                self.db.query(sql, sql_params)

            else:
                prev_info = prev_info[0]

                # 有记录，合并
                sql = '''
                    UPDATE biz_rel_func_running_info
                    SET
                         `succeedCount`      = ?
                        ,`failCount`         = ?
                        ,`minCost`           = ?
                        ,`maxCost`           = ?
                        ,`totalCost`         = ?
                        ,`latestCost`        = ?
                        ,`latestSucceedTime` = FROM_UNIXTIME(?)
                        ,`latestFailTime`    = FROM_UNIXTIME(?)
                        ,`status`            = ?

                    WHERE
                            `funcId`               = ?
                        AND `scriptPublishVersion` = ?
                        AND `execMode`             = ?
                    LIMIT 1
                '''
                sql_params = [
                    d['succeedCount'] + (prev_info['succeedCount'] or 0),
                    d['failCount']    + (prev_info['failCount']    or 0),
                    min(filter(lambda x: x is not None, (d['minCost'], prev_info['minCost']))),
                    max(filter(lambda x: x is not None, (d['maxCost'], prev_info['maxCost']))),
                    d['totalCost'] + (prev_info['totalCost'] or 0),
                    d['latestCost'],
                    d['latestSucceedTimestamp'] or prev_info['latestSucceedTimestamp'],
                    d['latestFailTimestamp']    or prev_info['latestFailTimestamp'],
                    d['status'],

                    func_id,
                    script_publish_version,
                    exec_mode,
                ]
                self.db.query(sql, sql_params)

        # 删除过时数据
        for func_id, latest_version in func_latest_version_map.items():
            sql = '''
                DELETE FROM biz_rel_func_running_info
                WHERE
                        `funcId`                                      =  ?
                    AND `scriptPublishVersion`                        != ?
                    OR  UNIX_TIMESTAMP() - UNIX_TIMESTAMP(updateTime) >  ?
                '''
            sql_params = [
                func_id,
                latest_version,
                3600 * 24 * 30,
            ]
            self.db.query(sql, sql_params)

    def sync_task_info(self):
        data = []

        # 搜集数据
        cache_key = toolkit.get_cache_key('syncCache', 'taskInfoBuffer')
        for i in range(CONFIG['_SYNC_CACHE_BULK_COUNT']):
            cache_res = self.cache_db.run('rpop', cache_key)
            if not cache_res:
                break

            try:
                cache_res = toolkit.json_loads(cache_res)
            except Exception as e:
                for line in traceback.format_exc().splitlines():
                    self.logger.error(line)
            else:
                data.append(cache_res)

        # 搜集任务记录限额
        task_info_limit_map = {}
        for d in data:
            origin_id       = d['originId']
            task_info_limit = d.pop('taskInfoLimit') or CONFIG['_TASK_INFO_DEFAULT_LIMIT']
            task_info_limit_map[origin_id] = task_info_limit

            # 写入数据库
            sql = '''
                INSERT IGNORE INTO biz_main_task_info
                SET ?
            '''
            sql_params = [ d ]
            self.db.query(sql, sql_params)

        # 数据回卷
        for origin_id, task_info_limit in task_info_limit_map.items():
            sql = '''
                SELECT
                    seq AS expiredMaxSeq
                FROM biz_main_task_info
                WHERE
                    originId = ?
                ORDER BY
                    seq DESC
                LIMIT ?, 1
            '''
            sql_params = [ origin_id, task_info_limit ]
            db_res = self.db.query(sql, sql_params)

            if db_res:
                expired_max_seq = db_res[0]['expiredMaxSeq']
                sql = '''
                    DELETE FROM biz_main_task_info
                    WHERE
                            seq      <= ?
                        AND originId =  ?
                '''
                sql_params = [ expired_max_seq, origin_id ]
                self.db.query(sql, sql_params)

@app.task(name='Main.SyncCache', bind=True, base=SyncCache)
def sync_cache(self, *args, **kwargs):
    # 上锁
    self.lock(max_age=30)

    # 函数调用计数刷入数据库
    try:
        self.sync_func_call_count()
    except Exception as e:
        for line in traceback.format_exc().splitlines():
            self.logger.error(line)

    # 脚本运行信息刷入数据库
    try:
        self.sync_script_running_info()
    except Exception as e:
        for line in traceback.format_exc().splitlines():
            self.logger.error(line)

    # 自动触发配置/批处理任务记录刷入数据库
    try:
        self.sync_task_info()
    except Exception as e:
        for line in traceback.format_exc().splitlines():
            self.logger.error(line)

# Main.AutoClean
class AutoCleanTask(BaseTask):
    def _delete_by_seq(self, table, seq):
        sql = '''
            DELETE FROM ??
            WHERE
                `seq` <= ?;
            '''
        sql_params = [table, seq]
        self.db.query(sql, sql_params)

    def clear_table_by_limit(self, table, limit):
        sql = '''
            SELECT
                `seq`
            FROM ??
            ORDER BY
                `seq` DESC
            LIMIT ?, 1;
            '''
        sql_params = [table, limit]
        db_res = self.db.query(sql, sql_params)
        if db_res:
            self._delete_by_seq(table, db_res[0]['seq'])

    def clear_table_by_expires(self, table, expires):
        sql = '''
            SELECT
                `seq`
            FROM ??
            WHERE
                UNIX_TIMESTAMP(`createTime`) < UNIX_TIMESTAMP() - ?
            ORDER BY
                `seq` DESC
            LIMIT 1;
            '''
        sql_params = [table, expires]
        db_res = self.db.query(sql, sql_params)
        if db_res:
            self._delete_by_seq(table, db_res[0]['seq'])

    def clear_table(self, table):
        sql = '''TRUNCATE ??'''
        sql_params = [table]
        self.db.query(sql, sql_params)

    def clear_cache_key(self, cache_key):
        self.cache_db.delete(cache_key)

    def clear_cache_key_pattern(self, pattern):
        self.cache_db.del_by_pattern(pattern)

    def clear_temp_file(self, folder):
        limit_timestamp = f"{arrow.get().format('YYYYMMDDHHmmss')}_"

        temp_dir = os.path.join(CONFIG['RESOURCE_ROOT_PATH'], folder)
        if not os.path.exists(temp_dir):
            return

        for folder_path, _, file_names in os.walk(temp_dir):
            for file_name in file_names:
                if file_name < limit_timestamp:
                    file_path = os.path.join(folder_path, file_name)
                    os.remove(file_path)

    def clear_outdated_cache_key(self):
        origin_ids = set()

        # 集成函数自动触发配置永不过期
        origin_ids.add(CONFIG['_INTEGRATION_CRONTAB_CONFIG_ID'])

        # 自动触发配置ID
        sql = '''
            SELECT id FROM biz_main_crontab_config
            '''
        db_res = self.db.query(sql)
        for d in db_res:
            origin_ids.add(d['id'])

        # 批处理ID
        sql = '''
            SELECT id FROM biz_main_batch
            '''
        db_res = self.db.query(sql)
        for d in db_res:
            origin_ids.add(d['id'])

        # 获取所有任务信息Key
        cache_pattern = toolkit.get_cache_key('syncCache', 'taskInfo', tags=[ 'originId', '*' ])
        cache_res = self.cache_db.keys(cache_pattern)
        for cache_key in cache_res:
            cache_key_info = toolkit.parse_cache_key(cache_key)

            if cache_key_info['tags']['originId'] not in origin_ids:
                self.cache_db.delete(cache_key)

    def clear_deprecated_data(self):
        self.clear_table('biz_main_script_log')
        self.clear_table('biz_main_script_failure')
        self.clear_table('biz_main_batch_task_info')
        self.clear_table('biz_main_crontab_task_info')
        self.clear_cache_key(toolkit.get_cache_key('syncCache', 'scriptFailure'))
        self.clear_cache_key(toolkit.get_cache_key('syncCache', 'scriptLog'))
        self.clear_cache_key(toolkit.get_cache_key('syncCache', 'taskInfo'))
        self.clear_cache_key_pattern(toolkit.get_cache_key('syncCache', 'taskInfo', tags=[ 'originId', '*' ]))

@app.task(name='Main.AutoClean', bind=True, base=AutoCleanTask)
def auto_clean(self, *args, **kwargs):
    # 上锁
    self.lock(max_age=30)

    # 回卷数据库数据
    table_limit_map = CONFIG['_DBDATA_TABLE_LIMIT_MAP']
    for table, limit in table_limit_map.items():
        try:
            self.clear_table_by_limit(table=table, limit=int(limit))
        except Exception as e:
            for line in traceback.format_exc().splitlines():
                self.logger.error(line)

    # 清理临时目录
    try:
        self.clear_temp_file(CONFIG['UPLOAD_TEMP_ROOT_FOLDER'])
    except Exception as e:
        for line in traceback.format_exc().splitlines():
            self.logger.error(line)

    try:
        self.clear_temp_file(CONFIG['DOWNLOAD_TEMP_ROOT_FOLDER'])
    except Exception as e:
        for line in traceback.format_exc().splitlines():
            self.logger.error(line)

    # 清理过时的缓存
    try:
        self.clear_outdated_cache_key()
    except Exception as e:
        for line in traceback.format_exc().splitlines():
            self.logger.error(line)

    # 清楚已启用功能的数据
    try:
        self.clear_deprecated_data()
    except Exception as e:
        for line in traceback.format_exc().splitlines():
            self.logger.error(line)

# Main.AutoRun
class AutoRunTask(BaseTask):
    def get_integrated_auto_run_funcs(self):
        sql = '''
            SELECT
               `func`.`id`
            FROM biz_main_func AS `func`
            WHERE
                   `func`.`integration` = 'autoRun'
                AND JSON_EXTRACT(`func`.`extraConfigJSON`, '$.integrationConfig.onLaunch') = TRUE;
            '''
        return self.db.query(sql)

@app.task(name='Main.AutoRun', bind=True, base=AutoRunTask)
def auto_run(self, *args, **kwargs):
    # 上锁
    self.lock(max_age=30)

    # 获取函数功能集成自动运行函数
    integrated_auto_run_funcs = self.get_integrated_auto_run_funcs()
    for f in integrated_auto_run_funcs:
        # 任务ID
        task_id = gen_task_id()

        # 任务参数
        task_kwargs = {
            'funcId'  : f['id'],
            'origin'  : 'integration',
            'execMode': 'async',
            'queue'   : CONFIG['_FUNC_TASK_DEFAULT_QUEUE'],
        }

        # 自动运行总是使用默认队列
        queue = toolkit.get_worker_queue(CONFIG['_FUNC_TASK_DEFAULT_QUEUE'])

        func_runner.apply_async(task_id=task_id, kwargs=task_kwargs, queue=queue)

# Main.AutoBackupDB
class AutoBackupDBTask(BaseTask):
    def run_sqldump(self, tables, with_data, file_name):
        dump_file_dir = CONFIG['DB_AUTO_BACKUP_PATH']
        os.makedirs(dump_file_dir, exist_ok=True)

        with_data_flag = ''
        if with_data is False:
            with_data_flag = '--no-data'

        dump_file_path = os.path.join(dump_file_dir, file_name)

        sqldump_args = [
            'mysqldump',
            f"--host={CONFIG['MYSQL_HOST'] or '127.0.0.1'}",
            f"--port={CONFIG['MYSQL_PORT'] or 3306}",
            f"--user={CONFIG['MYSQL_USER']}",
            f"--password={CONFIG['MYSQL_PASSWORD']}",
            '--databases', CONFIG['MYSQL_DATABASE'],
            '--hex-blob',
            '--default-character-set=utf8mb4',
            '--skip-extended-insert',
            '--column-statistics=0',
        ]

        if with_data_flag:
            sqldump_args.append(with_data_flag)

        sqldump_args.append('--tables')
        sqldump_args.extend(tables)

        sqldump = subprocess.check_output(sqldump_args)
        sqldump = sqldump.decode()
        sqldump = sqldump.replace(' COLLATE=utf8mb4_0900_ai_ci', '') # 兼容5.7, 8.0

        with open(dump_file_path, 'a') as _f:
            _f.write(sqldump)

    def limit_sqldump(self):
        dump_file_dir = CONFIG['DB_AUTO_BACKUP_PATH']
        if not os.path.exists(dump_file_dir):
            return

        backup_file_names = []
        with os.scandir(dump_file_dir) as _dir:
            for _f in _dir:
                if _f.is_file() and _f.name.startswith(CONFIG['_DB_AUTO_BACKUP_PREFIX']) and _f.name.endswith(CONFIG['_DB_AUTO_BACKUP_EXT']):
                    backup_file_names.append(_f.name)

        backup_file_names.sort()
        if len(backup_file_names) > CONFIG['DB_AUTO_BACKUP_LIMIT']:
            for file_name in backup_file_names[0:-1 * CONFIG['DB_AUTO_BACKUP_LIMIT']]:
                file_path = os.path.join(dump_file_dir, file_name)
                os.remove(file_path)

@app.task(name='Main.AutoBackupDB', bind=True, base=AutoBackupDBTask)
def auto_backup_db(self, *args, **kwargs):
    # 上锁
    self.lock(max_age=1800)

    # 准备备份
    date_str = arrow.get().to('Asia/Shanghai').format('YYYYMMDD-HHmmss')
    dump_file_name = f"{CONFIG['_DB_AUTO_BACKUP_PREFIX']}{date_str}{CONFIG['_DB_AUTO_BACKUP_EXT']}"

    table_with_data    = []
    table_without_data = []

    # 查询需要导出的表
    sql = '''
        SHOW TABLES
        '''
    db_res = self.db.query(sql)
    for d in db_res:
        t = list(d.values())[0]

        # 避免备份到迁移数据
        t_lower = t.lower()
        if not t_lower.startswith('biz_') and not t_lower.startswith('wat_'):
            continue

        if t in CONFIG['_DBDATA_TABLE_LIMIT_MAP']:
            table_without_data.append(t)
        else:
            table_with_data.append(t)

    # 导出表+数据
    self.run_sqldump(tables=table_with_data, with_data=True, file_name=dump_file_name)

    # 导出表
    self.run_sqldump(tables=table_without_data, with_data=False, file_name=dump_file_name)

    # 自动删除旧备份
    self.limit_sqldump()

# Main.CheckDataSource
@app.task(name='Main.CheckDataSource', bind=True, base=BaseTask)
def check_data_source(self, *args, **kwargs):
    self.logger.info('Main.CheckDataSource Task launched.')

    data_source_type   = kwargs.get('type')
    data_source_config = kwargs.get('config')

    # 检查数据源
    data_source_helper_class = DATA_SOURCE_HELPER_CLASS_MAP.get(data_source_type)
    if not data_source_helper_class:
        e = Exception('Unsupported DataSource type: `{}`'.format(data_source_type))
        raise e

    data_source_helper = data_source_helper_class(self.logger, config=data_source_config)

    data_source_helper.check()

# Main.QueryDataSource
@app.task(name='Main.QueryDataSource', bind=True, base=BaseTask)
def query_data_source(self, *args, **kwargs):
    self.logger.info('Main.QueryDataSource Task launched.')

    data_source_id = kwargs.get('id')
    command        = kwargs.get('command')
    command_args   = kwargs.get('commandArgs')   or []
    command_kwargs = kwargs.get('commandKwargs') or {}
    return_type    = kwargs.get('returnType')    or 'json'

    data_source = None

    # 查询数据源
    sql = '''
        SELECT
            `type`,
            `configJSON`
        FROM biz_main_data_source
        WHERE
            `id` = ?
        '''
    sql_params = [data_source_id]
    db_res = self.db.query(sql, sql_params)
    if len(db_res) > 0:
        data_source = db_res[0]
        data_source['config'] = toolkit.json_loads(data_source['configJSON'])

    if not data_source:
        e = Exception('No such DataSource')
        raise e

    # 执行数据源命令
    data_source_type   = data_source.get('type')
    data_source_config = data_source.get('config')
    data_source_config = decipher_data_source_config_fields(data_source_config)

    data_source_helper_class = DATA_SOURCE_HELPER_CLASS_MAP.get(data_source_type)
    if not data_source_helper_class:
        e = Exception('Unsupported DataSource type: `{}`'.format(da))
        raise e

    # 解密字段
    data_source_helper = data_source_helper_class(self.logger, config=data_source_config)

    db_res = getattr(data_source_helper, command)(*command_args, **command_kwargs)

    ret = None
    if return_type == 'repr':
        ret = pprint.pformat(db_res, width=100)
    else:
        ret = db_res
    return ret

# Main.ResetWorkerQueuePressure
@app.task(name='Main.ResetWorkerQueuePressure', bind=True, base=BaseTask)
def reset_worker_queue_pressure(self, *args, **kwargs):
    # 上锁
    self.lock(max_age=30)

    for i in range(CONFIG['_WORKER_QUEUE_COUNT']):
        queue_key = toolkit.get_worker_queue(i)
        queue_length = self.cache_db.run('llen', queue_key)

        if not queue_length or int(queue_length) <= 0:
            cache_key = toolkit.get_server_cache_key('cache', 'workerQueuePressure', tags=['workerQueue', i])
            self.cache_db.run('set', cache_key, 0)
