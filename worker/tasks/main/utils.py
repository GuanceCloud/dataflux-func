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
import simplejson
import ujson
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

SCRIPT_MAP = {}

# Main.ReloadScripts
class ReloadScriptsTask(BaseTask, ScriptCacherMixin):
    '''
    脚本重新载入任务
    与 RunnerTask.update_script_dict_cache 配合完成高速脚本加载处理
    具体如下：
        1. 由于只有当用户「发布」脚本后，才需要重新加载，
           因此以 biz_main_func 表的所有`id`+`scriptMD5`作为是否需要重新读取数据库的标准
        2. 内存中维护 SCRIPT_MAP 作为缓存，结构如下：
           { "<脚本ID>": {完整脚本数据JSON} }
        3. 由于代码内容可能比较多，
           因此每次重新加载代码时，先只读取所有脚本的ID和MD5值，
           和内存中维护的 SCRIPT_MAP 对比获取需要更新的脚本ID列表
        4.1. 如果没有需要更新的脚本，则结束
        4.2. 如果存在需要更新的脚本，则从数据库中读取需要更新的脚本信息，并合并到 SCRIPT_MAP 中，
             最后更新整个脚本库和脚本库MD5缓存
        X.1. 附带强制重新加载功能
    '''

    def get_latest_script_data_hash(self):
        sql = '''
                SELECT
                    `id`,
                    `publishVersion`,
                    `codeMD5`
                FROM biz_main_script
            '''
        db_res = self.db.query(sql)

        str_to_hash_parts = []
        for d in db_res:
            _id              = d.get('id')             or '<NO_ID>'
            _publish_version = d.get('publishVersion') or '<NO_PUBLISH_VERSION>'
            _code_md5        = d.get('codeMD5')        or '<NO_CODE_MD5>'
            str_to_hash_parts.append(','.join([str(_id), str(_publish_version), str(_code_md5)]))

        str_to_hash = ';'.join(str_to_hash_parts)
        script_data_hash = toolkit.get_sha1(str_to_hash)

        return script_data_hash

    def _cache_scripts(self):
        scripts = sorted(SCRIPT_MAP.values(), key=lambda x: x['seq'])
        scripts_dump = toolkit.json_safe_dumps(scripts, sort_keys=True)

        cache_key = toolkit.get_cache_key('fixedCache', 'scriptsMD5')
        self.cache_db.set(cache_key, toolkit.get_md5(scripts_dump))

        cache_key = toolkit.get_cache_key('fixedCache', 'scriptsDump')
        self.cache_db.set(cache_key, scripts_dump)

    def force_reload_script(self):
        global SCRIPT_MAP

        # 获取所有脚本
        scripts = self.get_scripts()
        for s in scripts:
            self.logger.debug('[SCRIPT CACHE] Load {}'.format(s['id']))

        # 字典化
        SCRIPT_MAP = dict([(s['id'], s) for s in scripts])

        # 3. Dump和MD5值写入缓存
        self._cache_scripts()

    def reload_script(self):
        global SCRIPT_MAP

        # 1. 获取当前所有脚本ID和MD5
        sql = '''
            SELECT
                 `scpt`.`id`
                ,`scpt`.`codeMD5`
                ,`scpt`.`publishVersion`
                ,`sset`.`id` AS `scriptSetId`
            FROM biz_main_script AS scpt

            JOIN biz_main_script_set as sset
            '''
        db_res = self.db.query(sql)

        current_script_ids = set()
        reload_script_ids  = set()
        for d in db_res:
            script_id  = d['id']

            current_script_ids.add(script_id)
            cached_script = SCRIPT_MAP.get(script_id)

            if not cached_script:
                # 新脚本
                reload_script_ids.add(script_id)

            elif cached_script['codeMD5'] != d['codeMD5'] or cached_script['publishVersion'] != d['publishVersion']:
                # 更新脚本
                reload_script_ids.add(script_id)

        # 去除已经不存在的脚本
        script_ids_to_pop = []
        for script_id in SCRIPT_MAP.keys():
            if script_id not in current_script_ids:
                self.logger.debug('[SCRIPT CACHE] Remove {}'.format(script_id))
                script_ids_to_pop.append(script_id)

        for script_id in script_ids_to_pop:
            SCRIPT_MAP.pop(script_id, None)

        if reload_script_ids:
            # 2. 从数据库获取更新后的脚本
            scripts = self.get_scripts(script_ids=reload_script_ids)
            for s in scripts:
                self.logger.debug('[SCRIPT CACHE] Load {}'.format(s['id']))

            # 合并加载的脚本
            reloaded_script_map = dict([(s['id'], s) for s in scripts])
            SCRIPT_MAP.update(reloaded_script_map)

            # 3. Dump和MD5值写入缓存
            self._cache_scripts()

            # 4. 删除函数结果缓存
            for script_id in reload_script_ids:
                func_id_pattern = '{0}.*'.format(script_id)
                cache_key = toolkit.get_cache_key('cache', 'funcResult', tags=[
                    'funcId', func_id_pattern,
                    'scriptCodeMD5', '*',
                    'funcKwargsMD5', '*'])
                for k in self.cache_db.client.scan_iter(cache_key):
                    self.cache_db.delete(six.ensure_str(k))

@app.task(name='Main.ReloadScripts', bind=True, base=ReloadScriptsTask)
def reload_scripts(self, *args, **kwargs):
    is_startup = kwargs.get('isOnLaunch')  or False
    is_crontab = kwargs.get('isOnCrontab') or False
    force      = kwargs.get('force')       or False

    # 启动时执行/Crontab执行的，需要上锁
    if is_startup or is_crontab:
        self.lock(max_age=10)
    else:
        self.launch_log()

    cache_key = toolkit.get_cache_key('fixedCache', 'prevScriptDataHash')

    # 上次脚本更新时间
    prev_script_data_hash = self.cache_db.get(cache_key) or '<NO_SCRIPT_DATA_HASH>'
    if not prev_script_data_hash:
        force = True

    # 最新脚本数据Hash
    latest_script_data_hash = self.get_latest_script_data_hash()

    is_script_reloaded = False
    if force:
        self.force_reload_script()
        is_script_reloaded = True

    elif latest_script_data_hash != prev_script_data_hash:
        self.reload_script()
        is_script_reloaded = True

    if is_script_reloaded:
        self.logger.info('[SCRIPT CACHE] Reload script {} -> {} {}'.format(
            prev_script_data_hash, latest_script_data_hash, '[FORCE]' if force else ''))

        self.cache_db.set(cache_key, str(latest_script_data_hash))

# Main.SyncCache
class SyncCache(BaseTask):
    def sync_script_running_info(self):
        data = []

        # 搜集数据
        cache_key = toolkit.get_cache_key('syncCache', 'scriptRunningInfo')
        for i in range(CONFIG['_BUILTIN_TASK_SYNC_CACHE_BATCH_COUNT']):
            cache_res = self.cache_db.run('rpop', cache_key)
            if not cache_res:
                break

            try:
                cache_res = ujson.loads(cache_res)
            except Exception as e:
                for line in traceback.format_exc().splitlines():
                    self.logger.error(line)
            else:
                data.append(cache_res)

        # 分类计算
        data_map = {}
        for d in data:
            func_id                = d['funcId']
            script_publish_version = d['scriptPublishVersion']
            exec_mode              = d['execMode']
            is_failed              = d['isFailed']
            cost                   = int(d['cost'] * 1000)
            timestamp              = d.get('timestamp')

            if not timestamp:
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
            func_id   = d['funcId']
            exec_mode = d['execMode']

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

    def sync_script_failure(self):
        if not CONFIG['_INTERNAL_KEEP_SCRIPT_FAILURE']:
            return

        cache_key = toolkit.get_cache_key('syncCache', 'scriptFailure')

        for i in range(CONFIG['_BUILTIN_TASK_SYNC_CACHE_BATCH_COUNT']):
            cache_res = self.cache_db.run('rpop', cache_key)
            if not cache_res:
                break

            try:
                cache_res = ujson.loads(cache_res)
            except Exception as e:
                for line in traceback.format_exc().splitlines():
                    self.logger.error(line)

                continue

            func_id                = cache_res['funcId']
            script_publish_version = cache_res['scriptPublishVersion']
            exec_mode              = cache_res['execMode']
            einfo_text             = cache_res.get('einfoTEXT')
            trace_info             = cache_res.get('traceInfo')
            timestamp              = cache_res.get('timestamp')

            if not all([einfo_text, timestamp]):
                continue

            if exec_mode is None:
                exec_mode = 'sync'

            # 记录脚本故障
            failure_id = gen_script_failure_id()

            exception = None
            if trace_info:
                exception = trace_info.get('exceptionDump') or ''
                if isinstance(exception, six.string_types):
                    exception = exception.split(':')[0]
                else:
                    exception = None

                trace_info = simplejson.dumps(trace_info, default=toolkit.json_dump_default)

            sql = '''
                INSERT INTO biz_main_script_failure
                SET
                   `id`                   = ?
                  ,`funcId`               = ?
                  ,`scriptPublishVersion` = ?
                  ,`execMode`             = ?
                  ,`einfoTEXT`            = ?
                  ,`exception`            = ?
                  ,`traceInfoJSON`        = ?
                  ,`createTime`           = FROM_UNIXTIME(?)
                  ,`updateTime`           = FROM_UNIXTIME(?)
            '''
            sql_params = [
                failure_id,
                func_id,
                script_publish_version,
                exec_mode,
                einfo_text,
                exception,
                trace_info,
                timestamp, timestamp,
            ]
            self.db.query(sql, sql_params)

    def sync_script_log(self):
        if not CONFIG['_INTERNAL_KEEP_SCRIPT_LOG']:
            return

        cache_key = toolkit.get_cache_key('syncCache', 'scriptLog')

        # 当队列数量过大时，一些内容不再记录
        queue_length = 0
        cache_res = self.cache_db.run('llen', cache_key)
        if cache_res:
            queue_length = int(cache_res)

        is_service_degraded = queue_length > CONFIG['_BUILTIN_TASK_SYNC_CACHE_SERVICE_DEGRADE_QUEUE_LENGTH']

        for i in range(CONFIG['_BUILTIN_TASK_SYNC_CACHE_BATCH_COUNT']):
            cache_res = self.cache_db.run('rpop', cache_key)
            if not cache_res:
                break

            # 发生服务降级时，随机丢弃
            if is_service_degraded:
                if random.randint(0, queue_length) * 2 > CONFIG['_BUILTIN_TASK_SYNC_CACHE_SERVICE_DEGRADE_QUEUE_LENGTH']:
                    continue

            try:
                cache_res = ujson.loads(cache_res)
            except Exception as e:
                for line in traceback.format_exc().splitlines():
                    self.logger.error(line)

                continue

            func_id                = cache_res['funcId']
            script_publish_version = cache_res['scriptPublishVersion']
            exec_mode              = cache_res['execMode']
            log_messages           = cache_res.get('logMessages')
            timestamp              = cache_res.get('timestamp')

            if not all([log_messages, timestamp]):
                continue

            if exec_mode is None:
                exec_mode = 'sync'

            # 记录脚本日志
            log_id = gen_script_log_id()

            message_text = '\n'.join(log_messages).strip()

            sql = '''
                INSERT INTO biz_main_script_log
                SET
                   `id`                   = ?
                  ,`funcId`               = ?
                  ,`scriptPublishVersion` = ?
                  ,`execMode`             = ?
                  ,`messageTEXT`          = ?
                  ,`createTime`           = FROM_UNIXTIME(?)
                  ,`updateTime`           = FROM_UNIXTIME(?)
            '''
            sql_params = [
                log_id,
                func_id,
                script_publish_version,
                exec_mode,
                message_text,
                timestamp, timestamp,
            ]
            self.db.query(sql, sql_params)

    def sync_task_info(self):
        cache_key = toolkit.get_cache_key('syncCache', 'taskInfo')

        # 当队列数量过大时，一些内容不再记录
        queue_length = 0
        cache_res = self.cache_db.run('llen', cache_key)
        if cache_res:
            queue_length = int(cache_res)

        is_service_degraded = queue_length > CONFIG['_BUILTIN_TASK_SYNC_CACHE_SERVICE_DEGRADE_QUEUE_LENGTH']

        for i in range(CONFIG['_BUILTIN_TASK_SYNC_CACHE_BATCH_COUNT']):
            cache_res = self.cache_db.run('rpop', cache_key)
            if not cache_res:
                break

            try:
                cache_res = ujson.loads(cache_res)
            except Exception as e:
                for line in traceback.format_exc().splitlines():
                    self.logger.error(line)
                continue

            task_id                = cache_res['taskId']
            origin                 = cache_res['origin']
            origin_id              = cache_res['originId']
            func_id                = cache_res.get('funcId')
            script_publish_version = cache_res.get('scriptPublishVersion')
            exec_mode              = cache_res.get('execMode')
            status                 = cache_res['status']
            log_messages           = cache_res.get('logMessages') or []
            einfo_text             = cache_res.get('einfoTEXT')   or ''
            timestamp              = cache_res.get('timestamp')

            if not all([origin, exec_mode, origin_id, timestamp]):
                continue

            # 记录任务信息
            table_name      = None
            origin_id_field = None
            if origin == 'crontab' or exec_mode == 'crontab':
                table_name      = 'biz_main_crontab_task_info'
                origin_id_field = 'crontabConfigId'

            elif origin == 'batch':
                table_name      = 'biz_main_batch_task_info'
                origin_id_field = 'batchId'

            else:
                return

            sql        = None
            sql_params = None

            message_text = '\n'.join(log_messages).strip()

            # 根据是否服务降级区分处理
            if not is_service_degraded:
                # 未发生服务降级，正常处理
                if status == 'queued':
                    sql = '''
                        INSERT INTO ??
                        SET
                             `id`                   = ?
                            ,`??`                   = ?
                            ,`funcId`               = ?
                            ,`scriptPublishVersion` = ?
                            ,`queueTime`            = FROM_UNIXTIME(?)
                            ,`createTime`           = FROM_UNIXTIME(?)
                            ,`updateTime`           = FROM_UNIXTIME(?)
                        '''
                    sql_params = [
                        table_name,
                        task_id,
                        origin_id_field, origin_id,
                        func_id,
                        script_publish_version,
                        timestamp, timestamp, timestamp,
                    ]

                elif status == 'pending':
                    sql = '''
                        UPDATE ??
                        SET
                             `funcId`               = IFNULL(?, `funcId`)
                            ,`scriptPublishVersion` = IFNULL(?, `scriptPublishVersion`)
                            ,`startTime`  = FROM_UNIXTIME(?)
                            ,`status`     = ?
                            ,`updateTime` = FROM_UNIXTIME(?)
                        WHERE
                            `id` = ?
                        '''
                    sql_params = [
                        table_name,

                        func_id,
                        script_publish_version,
                        timestamp,
                        status,
                        timestamp,
                        task_id
                    ]

                else:
                    sql = '''
                        UPDATE ??
                        SET
                             `funcId`               = IFNULL(?, `funcId`)
                            ,`scriptPublishVersion` = IFNULL(?, `scriptPublishVersion`)
                            ,`endTime`              = FROM_UNIXTIME(?)
                            ,`status`               = ?
                            ,`logMessageTEXT`       = ?
                            ,`einfoTEXT`            = ?
                            ,`updateTime`           = FROM_UNIXTIME(?)
                        WHERE
                            `id` = ?
                        '''
                    sql_params = [
                        table_name,

                        func_id,
                        script_publish_version,
                        timestamp,
                        status,
                        message_text,
                        einfo_text,
                        timestamp,
                        task_id,
                    ]

            else:
                # 发生服务降级，处理最终结果
                if status in ('success', 'failure'):
                    sql = '''
                        REPLACE INTO ??
                        SET
                             `id`                   = ?
                            ,`??`                   = ?
                            ,`funcId`               = ?
                            ,`scriptPublishVersion` = ?
                            ,`endTime`              = FROM_UNIXTIME(?)
                            ,`status`               = ?
                            ,`logMessageTEXT`       = ?
                            ,`einfoTEXT`            = ?
                            ,`createTime`           = FROM_UNIXTIME(?)
                            ,`updateTime`           = FROM_UNIXTIME(?)
                        '''
                    sql_params = [
                        table_name,
                        task_id,
                        origin_id_field, origin_id,
                        func_id,
                        script_publish_version,
                        timestamp,
                        status,
                        message_text,
                        einfo_text,
                        timestamp, timestamp,
                    ]

                else:
                    continue

            self.db.query(sql, sql_params)

@app.task(name='Main.SyncCache', bind=True, base=SyncCache)
def sync_cache(self, *args, **kwargs):
    # 上锁
    self.lock(max_age=30)

    # 脚本运行信息刷入数据库
    try:
        self.sync_script_running_info()
    except Exception as e:
        for line in traceback.format_exc().splitlines():
            self.logger.error(line)

    # 脚本失败信息刷入数据库
    try:
        self.sync_script_failure()
    except Exception as e:
        for line in traceback.format_exc().splitlines():
            self.logger.error(line)

    # 脚本日志刷入数据库
    try:
        self.sync_script_log()
    except Exception as e:
        for line in traceback.format_exc().splitlines():
            self.logger.error(line)

    # 任务信息刷入数据库
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
        sql = '''
            TRUNCATE ??
            '''
        sql_params = [table]
        self.db.query(sql, sql_params)

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

@app.task(name='Main.AutoClean', bind=True, base=AutoCleanTask)
def auto_clean(self, *args, **kwargs):
    # 上锁
    self.lock(max_age=30)

    # 清空数据库数据
    if not CONFIG['_INTERNAL_KEEP_SCRIPT_LOG']:
        self.clear_table('biz_main_script_log')

    if not CONFIG['_INTERNAL_KEEP_SCRIPT_FAILURE']:
        self.clear_table('biz_main_script_failure')

    # 回卷数据库数据
    table_limit_map = CONFIG['_DBDATA_TABLE_LIMIT_MAP']
    for table, limit in table_limit_map.items():
        try:
            self.clear_table_by_limit(table=table, limit=int(limit))
        except Exception as e:
            for line in traceback.format_exc().splitlines():
                self.logger.error(line)

    # 清理临时目录
    self.clear_temp_file(CONFIG['UPLOAD_TEMP_ROOT_FOLDER'])
    self.clear_temp_file(CONFIG['DOWNLOAD_TEMP_ROOT_FOLDER'])

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
        data_source['config'] = ujson.loads(data_source['configJSON'])

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
            cache_key = toolkit.get_cache_key('cache', 'workerQueuePressure', tags=['workerQueue', i])
            self.cache_db.run('set', cache_key, 0)
