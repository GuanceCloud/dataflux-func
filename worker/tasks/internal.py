# -*- coding: utf-8 -*-

'''
杂项任务
包含各类清理类任务、AutoCleanTask 各类数据定时同步任务、连接器检查/调试任务等
'''

# Built-in Modules
import os
import traceback
import pprint
import textwrap
import zipfile

# 3rd-party Modules
import arrow

# Project Modules
from worker.utils import toolkit, yaml_resources
from worker.utils.extra_helpers import HexStr, format_sql_v2 as format_sql
from worker.tasks import BaseTask
from worker.tasks.func import CONNECTOR_HELPER_CLASS_MAP, decipher_connector_config_fields

CONFIG     = yaml_resources.get('CONFIG')
IMAGE_INFO = yaml_resources.get('IMAGE_INFO')

class BaseInternalTask(BaseTask):
    def safe_call(self, func, *args, **kwargs):
        try:
            return func(*args, **kwargs)

        except Exception as e:
            for line in traceback.format_exc().splitlines():
                self.logger.error(line)

class SystemMetric(BaseInternalTask):
    '''
    系统指标
    '''
    name = 'Internal.SystemMetric'

    def get_metric_worker_queue(self):
        guance_data = []

        available_queues = list(range(CONFIG['_WORKER_QUEUE_COUNT']))
        for queue in available_queues:
            worker_queue        = toolkit.get_worker_queue(queue)
            worker_queue_length = int(self.cache_db.llen(worker_queue) or 0)

            # 内置监控
            cache_key = toolkit.get_monitor_cache_key('monitor', 'systemMetrics', ['metric', 'workerQueueLength', 'queue', worker_queue])
            self.cache_db.ts_add(cache_key, worker_queue_length, timestamp=self.trigger_time)

            # 观测云
            if self.guance_data_upload_url:
                guance_data.append({
                    'measurement': CONFIG['_MONITOR_GUANCE_MEASUREMENT_WORKER_QUEUE'],
                    'tags': {
                        'queue'    : str(queue),
                        'redis_key': worker_queue,
                    },
                    'fields': {
                        'length' : worker_queue_length,
                    },
                    'timestamp': self.trigger_time,
                })

        if self.guance_data_upload_url:
            self.upload_guance_data('metric', guance_data)

    def get_metric_cache_db(self):
        cache_res = self.cache_db.info()
        db_info   = cache_res.get(f"db{CONFIG['REDIS_DATABASE'] or 0}") or {}

        key_count   = db_info.get('keys')          or 0
        used_memory = cache_res.get('used_memory') or 0

        # 内置监控
        cache_key = toolkit.get_monitor_cache_key('monitor', 'systemMetrics', ['metric', 'cacheDBKeyUsed'])
        self.cache_db.ts_add(cache_key, key_count, timestamp=self.trigger_time)

        cache_key = toolkit.get_monitor_cache_key('monitor', 'systemMetrics', ['metric', 'cacheDBMemoryUsed'])
        self.cache_db.ts_add(cache_key, used_memory, timestamp=self.trigger_time)

        # 观测云
        if self.guance_data_upload_url:
            guance_data = {
                'measurement': CONFIG['_MONITOR_GUANCE_MEASUREMENT_CACHE_DB'],
                'tags': {
                    'target': f"{CONFIG['REDIS_HOST']}:{CONFIG['REDIS_PORT']}/{CONFIG['REDIS_DATABASE']}",
                },
                'fields': {
                    'keys'       : key_count,
                    'used_memory': used_memory,
                },
                'timestamp': self.trigger_time,
            }

            self.upload_guance_data('metric', guance_data)

    def get_metric_cache_db_key(self):
        key_prefix_count_map = {}

        keys = self.cache_db.keys()
        for k in keys:
            if k.startswith(CONFIG['APP_NAME']):
                prefix = k.split(':')[0] + ':TAGS'
            else:
                prefix = 'NON_DFF_KEY'

            if prefix not in key_prefix_count_map:
                key_prefix_count_map[prefix] = 0

            key_prefix_count_map[prefix] += 1

        guance_data = []
        for prefix, count in key_prefix_count_map.items():
            # 内置监控
            cache_key = toolkit.get_monitor_cache_key('monitor', 'systemMetrics', ['metric', 'cacheDBKeyCountByPrefix', 'prefix', toolkit.get_base64(prefix)])
            self.cache_db.ts_add(cache_key, count, timestamp=self.trigger_time)

            # 观测云
            if self.guance_data_upload_url:
                guance_data.append({
                    'measurement': CONFIG['_MONITOR_GUANCE_MEASUREMENT_CACHE_DB_KEY'],
                    'tags': {
                        'target': f"{CONFIG['REDIS_HOST']}: {CONFIG['REDIS_PORT']}/{CONFIG['REDIS_DATABASE']}",
                        'prefix': prefix,
                    },
                    'fields': {
                        'count': count,
                    },
                    'timestamp': self.trigger_time,
                })

        if self.guance_data_upload_url:
            self.upload_guance_data('metric', guance_data)

    def get_metric_db(self):
        guance_data = []

        db_res = self.db.query('SHOW TABLE STATUS')
        for d in db_res:
            total_length = d['Data_length'] + d['Index_length']

            # 内置监控
            cache_key = toolkit.get_monitor_cache_key('monitor', 'systemMetrics', ['metric', 'dbTableTotalUsed', 'table', d['Name']])
            self.cache_db.ts_add(cache_key, total_length, timestamp=self.trigger_time)

            cache_key = toolkit.get_monitor_cache_key('monitor', 'systemMetrics', ['metric', 'dbTableDataUsed', 'table', d['Name']])
            self.cache_db.ts_add(cache_key, d['Data_length'], timestamp=self.trigger_time)

            cache_key = toolkit.get_monitor_cache_key('monitor', 'systemMetrics', ['metric', 'dbTableIndexUsed', 'table', d['Name']])
            self.cache_db.ts_add(cache_key, d['Index_length'], timestamp=self.trigger_time)

            # 观测云
            if self.guance_data_upload_url:
                guance_data.append({
                    'measurement': CONFIG['_MONITOR_GUANCE_MEASUREMENT_DB_TABLE'],
                    'tags': {
                        'target' : f"{CONFIG['MYSQL_HOST']}: {CONFIG['MYSQL_PORT']}/{CONFIG['MYSQL_DATABASE']}",
                        'name'   : d['Name'],
                        'comment': d['Comment'],
                    },
                    'fields': {
                        'total_length'  : total_length,
                        'data_length'   : d['Data_length'],
                        'index_length'  : d['Index_length'],
                        'avg_row_length': d['Avg_row_length'],
                        'rows'          : d['Rows'],
                        'auto_increment': d['Auto_increment'],
                    },
                    'timestamp': self.trigger_time,
                })

        if self.guance_data_upload_url:
            self.upload_guance_data('metric', guance_data)

    def run(self, **kwargs):
        # 上锁
        self.lock()

        # 上报队列长度数据
        self.safe_call(self.get_metric_worker_queue)

        # 上报缓存数据库信息
        self.safe_call(self.get_metric_cache_db)

        # 上报缓存数据库 Key 信息
        self.safe_call(self.get_metric_cache_db_key)

        # 上报数据库信息
        self.safe_call(self.get_metric_db)

class FlushDataBuffer(BaseInternalTask):
    '''
    释放缓存数据
    '''
    name = 'Internal.FlushDataBuffer'

    default_timeout = CONFIG['_TASK_FLUSH_DATA_TIMEOUT']

    TASK_RECORD_LIMIT_BY_ORIGIN_MAP = {
        'direct'     : CONFIG['_TASK_RECORD_FUNC_LIMIT_BY_ORIGIN_DIRECT'],
        'integration': CONFIG['_TASK_RECORD_FUNC_LIMIT_BY_ORIGIN_INTEGRATION'],
        'connector'  : CONFIG['_TASK_RECORD_FUNC_LIMIT_BY_ORIGIN_CONNECTOR'],
        'authLink'   : CONFIG['_TASK_RECORD_FUNC_LIMIT_BY_ORIGIN_AUTH_LINK'],
        'crontab'    : CONFIG['_TASK_RECORD_FUNC_LIMIT_BY_ORIGIN_CRONTAB'],
        'batch'      : CONFIG['_TASK_RECORD_FUNC_LIMIT_BY_ORIGIN_BATCH'],
    }

    def _flush_data_buffer(self, cache_key):
        data = []
        for i in range(CONFIG['_TASK_FLUSH_DATA_BUFFER_BULK_COUNT']):
            cache_res = self.cache_db.pop(cache_key)
            if not cache_res:
                break

            data.append(cache_res)

        data = list(map(lambda x: toolkit.json_loads(x), data))
        return data

    def flush_task_record(self):
        cache_key = toolkit.get_cache_key('dataBuffer', 'taskRecord')

        # 搜集数据
        cache_res = self._flush_data_buffer(cache_key)
        if not cache_res:
            return 0

        # 写入本地 DB 数据
        for d in cache_res:
            sql = '''
                INSERT IGNORE INTO biz_main_task_record
                SET ?
            '''
            sql_params = [ d ]
            self.db.query(sql, sql_params)

        # 本地 DB 数据回卷
        sql = '''
            SELECT
                seq AS expiredMaxSeq
            FROM biz_main_task_record
            ORDER BY
                seq DESC
            LIMIT ?, 1
        '''
        sql_params = [ CONFIG['_TASK_RECORD_LIMIT_DEFAULT'] ]
        db_res = self.db.query(sql, sql_params)

        if db_res:
            expired_max_seq = db_res[0]['expiredMaxSeq']
            sql = '''
                DELETE FROM biz_main_task_record
                WHERE
                    seq <= ?
            '''
            sql_params = [ expired_max_seq ]
            self.db.query(sql, sql_params)\

        return len(cache_res)

    def flush_task_record_func(self):
        cache_key = toolkit.get_cache_key('dataBuffer', 'taskRecordFunc')

        # 未启用时，自动清空
        if not self.is_local_func_task_record_enabled:
            self.cache_db.delete(cache_key)

            sql = '''TRUNCATE biz_main_task_record_func'''
            self.db.query(sql)
            return 0

        # 搜集数据
        cache_res = self._flush_data_buffer(cache_key)
        if not cache_res:
            return 0

        # 写入本地 DB 数据
        origin_limit_map = {}
        for d in cache_res:
            origin    = d.get('origin')
            origin_id = d.get('originId')

            # 统计回卷范围
            limit = d.pop('_taskRecordLimit', None) or self.TASK_RECORD_LIMIT_BY_ORIGIN_MAP.get(origin) or 0
            origin_limit_map[origin_id] = limit

            # 写入数据库
            if limit > 0:
                sql = '''
                    INSERT IGNORE INTO biz_main_task_record_func
                    SET ?
                '''
                sql_params = [ d ]
                self.db.query(sql, sql_params)

        # 本地 DB 数据回卷
        for origin_id, limit in origin_limit_map.items():
            sql = '''
                SELECT
                    seq AS expiredMaxSeq
                FROM biz_main_task_record_func
                WHERE
                    originId = ?
                ORDER BY
                    seq DESC
                LIMIT ?, 1
            '''
            sql_params = [ origin_id, limit ]
            db_res = self.db.query(sql, sql_params)

            if db_res:
                expired_max_seq = db_res[0]['expiredMaxSeq']
                sql = '''
                    DELETE FROM biz_main_task_record_func
                    WHERE
                            seq      <= ?
                        AND originId =  ?
                '''
                sql_params = [ expired_max_seq, origin_id ]
                self.db.query(sql, sql_params)

        return len(cache_res)

    def flush_task_record_guance(self):
        cache_key = toolkit.get_cache_key('dataBuffer', 'taskRecordGuance')

        # 未启用时，自动清空
        if not self.guance_data_upload_url:
            self.cache_db.delete(cache_key)
            return 0

        # 搜集数据
        cache_res = self._flush_data_buffer(cache_key)
        if not cache_res:
            return 0

        try:
            self.upload_guance_data('logging', cache_res)
        except Exception as e:
            pass

        return len(cache_res)

    def flush_func_call_count(self):
        cache_key = toolkit.get_cache_key('dataBuffer', 'funcCallCount')

        # 搜集数据
        cache_res = self._flush_data_buffer(cache_key)
        if not cache_res:
            return 0

        # 计数表
        count_map   = {}
        guance_data = []
        for d in cache_res:
            func_id   = d['funcId']
            timestamp = d['timestamp']

            # 时间戳按照分钟对齐（减少内部时序数据存储压力）
            aligned_timestamp = int(int(timestamp) / 60) * 60

            pk = f'{func_id}~{aligned_timestamp}'
            if pk not in count_map:
                count_map[pk] = {
                    'funcId'   : func_id,
                    'count'    : 0,
                    'timestamp': aligned_timestamp,
                }

            count_map[pk]['count'] += 1

            # 生成观测云数据
            if self.guance_data_upload_url:
                guance_data.append({
                    'measurement': CONFIG['_MONITOR_GUANCE_MEASUREMENT_FUNC_CALL'],
                    'tags': {
                        'script_set_id' : d['scriptSetId'],
                        'script_id'     : d['scriptId'],
                        'func_id'       : func_id,
                        'origin'        : d['origin'],
                        'queue'         : d['queue'],
                        'task_status'   : d['status'],
                    },
                    'fields': {
                        'wait_cost' : d['waitCost'],
                        'run_cost'  : d['runCost'],
                        'total_cost': d['totalCost'],
                    },
                    'timestamp': d['timestamp'],
                })

        # 写入内置时序数据
        if count_map:
            for pk, c in count_map.items():
                cache_key = toolkit.get_monitor_cache_key('monitor', 'systemMetrics', ['metric', 'funcCallCount', 'funcId', c['funcId']])
                self.cache_db.ts_add(cache_key, c['count'], timestamp=c['timestamp'], mode='addUp')

        # 写入观测云
        if guance_data:
            try:
                self.upload_guance_data('metric', guance_data)
            except Exception as e:
                pass

        return len(cache_res)

    def run(self, **kwargs):
        # 上锁
        self.lock()

        flush_finish_map = {
            'flush_task_record'       : False,
            'flush_task_record_func'  : False,
            'flush_task_record_guance': False,
            'flush_func_call_count'   : False,
        }

        for i in range(CONFIG['_TASK_FLUSH_DATA_BUFFER_TIMES']):
            finish_set = []

            for flush_func_name, is_finished in flush_finish_map.items():
                if is_finished:
                    continue

                flush_func = getattr(self, flush_func_name)
                flushed_count = self.safe_call(flush_func) or 0
                if flushed_count < CONFIG['_TASK_FLUSH_DATA_BUFFER_BULK_COUNT']:
                    flush_finish_map[flush_func_name] = True

            if all(flush_finish_map.values()):
                break

class AutoClean(BaseInternalTask):
    name = 'Internal.AutoClean'

    def _delete_by_seq(self, table, seq, include=True):
        if seq <= 0:
            return

        if not include:
            seq = seq - 1

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
                MAX(`seq`) AS maxSeq
            FROM ??
            '''
        sql_params = [ table ]
        db_res = self.db.query(sql, sql_params)
        if not db_res:
            return

        max_seq = db_res[0]['maxSeq'] or 0
        if not max_seq:
            return

        delete_from_seq = max(max_seq - limit, 0)
        self._delete_by_seq(table, delete_from_seq, include=True)

    def clear_table_by_expires(self, table, expires):
        delete_from_seq = 0

        # 开始SEQ
        sql = '''
            SELECT
                MIN(seq) AS seq
            FROM ??
            '''
        sql_params = [ table ]
        res = self.db.query(sql, sql_params)
        if not res:
            return

        start_seq = res[0]['seq'] or 0
        if not start_seq:
            return

        # 结束SEQ
        sql = '''
            SELECT
                MAX(seq) AS seq
            FROM ??
            '''
        sql_params = [ table ]
        res = self.db.query(sql, sql_params)
        if not res:
            return

        end_seq = res[0]['seq'] or 0
        if not end_seq:
            return

        # 分组查询
        MAX_TRY = 30
        GROUPS  = 20

        check_seq_list = None
        for i in range(MAX_TRY):
            # 分组采样
            next_check_seq_list = list(range(start_seq, end_seq, int((end_seq - start_seq) / GROUPS) or 1))
            next_check_seq_list.extend([start_seq, end_seq])     # 添加端点
            next_check_seq_list = list(set(next_check_seq_list)) # 去重
            next_check_seq_list = sorted(next_check_seq_list)    # 排序

            if check_seq_list == next_check_seq_list:
                delete_from_seq = check_seq_list[0]
                break

            check_seq_list = next_check_seq_list

            sql = '''
                    SELECT
                        seq,
                        createTime,
                        UNIX_TIMESTAMP() - UNIX_TIMESTAMP(createTime) AS elapse
                    FROM ??
                    WHERE
                        seq IN (?)
                    ORDER BY
                        seq ASC
                '''
            sql_params = [ table, check_seq_list ]
            res = self.db.query(sql, sql_params)
            for d in res:
                if d['elapse'] > expires:
                    if d['seq'] > start_seq:
                        start_seq = d['seq']
                else:
                    if d['seq'] < end_seq:
                        end_seq = d['seq']

        if not delete_from_seq and check_seq_list:
            delete_from_seq = check_seq_list[0]

        if delete_from_seq:
            self._delete_by_seq(table, delete_from_seq, include=False)

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

    def clear_outdated_task_info(self):
        # 搜集实际存活的 Origin ID 列表
        sql = '''
            SELECT id FROM biz_main_auth_link
            UNION
            SELECT id FROM biz_main_crontab_config
            UNION
            SELECT id FROM biz_main_batch
            UNION
            SELECT id FROM biz_main_connector
            UNION
            SELECT 'direct' AS id
            UNION
            SELECT 'integration' AS id
            '''
        db_res = self.db.query(sql)
        current_origin_ids = set()
        for d in db_res:
            current_origin_ids.add(d['id'])

        # 搜集任务记录里的 Origin ID 列表
        sql = '''
            SELECT DISTINCT originId FROM biz_main_task_info
            '''
        db_res = self.db.query(sql)
        task_info_origin_ids = set()
        for d in db_res:
            task_info_origin_ids.add(d['originId'])

        # 无效的 Origin ID
        outdated_origin_ids = task_info_origin_ids - current_origin_ids
        if outdated_origin_ids:
            sql = '''
                DELETE FROM biz_main_task_info WHERE originId IN (?)
                '''
            sql_params = [ outdated_origin_ids ]
            self.db.non_query(sql, sql_params)

    def clear_deprecated_data(self):
        for table in CONFIG['_DEPRECATED_TABLE_LIST']:
            self.clear_table(table)

        for cache in CONFIG['_DEPRECATED_CACHE_KEY_LIST']:
            self.clear_cache_key(toolkit.get_cache_key(**cache))

        for cache in CONFIG['_DEPRECATED_CACHE_KEY_PATTERN_LIST']:
            self.clear_cache_key_pattern(toolkit.get_cache_key(**cache))

    def clear_expired_func_store(self):
        sql = '''
            DELETE FROM biz_main_func_store
            WHERE
                `expireAt` < UNIX_TIMESTAMP()
            '''
        self.db.query(sql)

    def run(self, **kwargs):
        # 上锁
        self.lock()

        # 回卷数据库数据
        table_limit_map = CONFIG['_DBDATA_TABLE_LIMIT_MAP']
        if table_limit_map:
            for table, limit in table_limit_map.items():
                self.safe_call(self.clear_table_by_limit, table=table, limit=int(limit))

        table_expire_map = CONFIG['_DBDATA_TABLE_EXPIRE_MAP']
        if table_expire_map:
            for table, expires in table_expire_map.items():
                self.safe_call(self.clear_table_by_expires, table=table, expires=int(expires))

        # 清理临时目录
        self.safe_call(self.clear_temp_file, CONFIG['UPLOAD_TEMP_ROOT_FOLDER'])
        self.safe_call(self.clear_temp_file, CONFIG['DOWNLOAD_TEMP_ROOT_FOLDER'])

        # 清理已弃用功能的数据
        self.safe_call(self.clear_deprecated_data)

        # 清理已过期的函数存储
        self.safe_call(self.clear_expired_func_store)

class AutoBackupDB(BaseInternalTask):
    name = 'Internal.AutoBackupDB'

    SQL_STR_TYPE_KEYWORDS = { 'char', 'text', 'blob' }

    def get_tables(self):
        # 查询需要导出的表
        tables = []

        sql = '''SHOW TABLES'''
        db_res = self.db.query(sql)
        for d in db_res:
            t = list(d.values())[0]

            # 避免备份到迁移数据
            t_lower = t.lower()
            if not t_lower.startswith('biz_') and not t_lower.startswith('wat_'):
                continue

            tables.append(t)

        return tables

    def get_table_dump_parts(self, table):
        table_dumps_parts = []

        # 删除表
        sql = '''DROP TABLE IF EXISTS `??`'''
        sql_params = [ table ]
        table_dumps_parts.append(format_sql(sql, sql_params) + ';')

        # 获取表创建语句
        sql = '''SHOW CREATE TABLE `??`'''
        sql_params = [ table ]
        db_res = self.db.query(sql, sql_params);
        if not db_res:
            return

        table_dumps_parts.append(db_res[0]['Create Table'] + ';')

        # 限制数据量的表不备份数据
        if table in CONFIG['_DBDATA_TABLE_LIMIT_MAP'] \
            or table in CONFIG['_DBDATA_TABLE_EXPIRE_MAP']:
            return table_dumps_parts

        # 无数据的表不备份数据
        sql = '''SELECT * FROM `??` LIMIT 1'''
        sql_params = [ table ]
        db_res = self.db.query(sql, sql_params)
        if not db_res:
            return table_dumps_parts

        # 获取表结构
        field_type_map = {}

        sql = '''DESCRIBE `??`'''
        sql_params = [ table ]
        db_res = self.db.query(sql, sql_params)
        for d in db_res:
            field      = d['Field']
            field_type = d['Type'].lower()
            if field_type == 'json':
                field_type_map[field] = 'json'
            else:
                for type_keyword in self.SQL_STR_TYPE_KEYWORDS:
                    if type_keyword in field_type:
                        field_type_map[field] = 'hexStr'
                        break
                else:
                    field_type_map[field] = 'normal'

        # 备份数据
        table_dumps_parts.append('');

        sql = '''LOCK TABLES `??` WRITE'''
        sql_params = [ table ]
        table_dumps_parts.append(format_sql(sql, sql_params) + ';')

        select_fields = []
        for f, t in field_type_map.items():
            if t == 'hexStr':
                select_fields.append('HEX(`{0}`) AS `{0}`'.format(f))
            else:
                select_fields.append(f)

        select_fields_sql = ', '.join(select_fields)

        seq = 0
        while True:
            sql = '''
                SELECT ??
                FROM `??`
                WHERE
                    `seq` > ?
                ORDER BY
                    `seq` ASC
                LIMIT 20
            '''
            sql_params = [ select_fields_sql, table, seq ]
            db_res = self.db.query(sql, sql_params)
            if not db_res:
                table_dumps_parts.append('''UNLOCK TABLES;''')
                break

            values = []
            for d in db_res:
                _d = []
                for f in field_type_map.keys():
                    v = d[f]
                    t = field_type_map[f]
                    if v is None:
                        _d.append(None)

                    elif isinstance(v, arrow.Arrow):
                        _d.append(v.format('YYYY-MM-DD HH:mm:ss'))

                    else:
                        if t == 'hexStr':
                            _d.append(HexStr(v))
                        else:
                            _d.append(v)

                values.append(_d)

            insert_fields = []
            for f in field_type_map.keys():
                insert_fields.append('`{0}`'.format(f))

            insert_fields_sql = ', '.join(insert_fields)

            sql = '''INSERT INTO `??` (??)\nVALUES\n  ?'''
            sql_params = [ table, insert_fields_sql, values ]
            table_dumps_parts.append(format_sql(sql, sql_params, pretty=True) + ';')

            seq = db_res[-1]['seq']

        return table_dumps_parts

    def run_backup(self, tables):
        # 保证目录
        backup_dir = CONFIG['DB_AUTO_BACKUP_DIR']
        os.makedirs(backup_dir, exist_ok=True)

        # 准备备份
        now      = arrow.get().to(CONFIG['TIMEZONE'])
        date_str = now.format('YYYYMMDD-HHmmss')

        # 生成待压缩文件
        sql_file_name = f"{CONFIG['_DB_AUTO_BACKUP_PREFIX']}{date_str}.sql"
        sql_file_path = os.path.join(backup_dir, sql_file_name)

        with open(sql_file_path, 'a') as _f:
            _f.write(textwrap.dedent(f'''
                    -- {'-' * 50}
                    -- DataFlux Func DB Backup
                    -- Date: {now.format('YYYY-MM-DD HH:mm:ss')}
                    -- Version: {IMAGE_INFO['VERSION']}
                    -- {'-' * 50}
                ''').lstrip())

            for t in tables:
                table_dump_parts = self.get_table_dump_parts(t)
                if table_dump_parts:
                    table_dumps = '\n'.join(table_dump_parts) + '\n\n'
                    _f.write(table_dumps)

        # 生成压缩文件
        zip_file_name = f"{CONFIG['_DB_AUTO_BACKUP_PREFIX']}{date_str}.zip"
        zip_file_path = os.path.join(backup_dir, zip_file_name)

        with zipfile.ZipFile(zip_file_path, 'w', compression=zipfile.ZIP_DEFLATED) as _z:
            _z.write(sql_file_path, arcname=sql_file_name)

        # 删除待压缩文件
        os.remove(sql_file_path)

    def limit_backups(self):
        backup_dir = CONFIG['DB_AUTO_BACKUP_DIR']
        if not os.path.exists(backup_dir):
            return

        # 获取备份文件名
        backup_file_names = []
        with os.scandir(backup_dir) as _dir:
            for _f in _dir:
                if _f.is_file() and _f.name.startswith(CONFIG['_DB_AUTO_BACKUP_PREFIX']) \
                    and (_f.name.endswith('.sql') or _f.name.endswith('.zip')):
                    backup_file_names.append(_f.name)

        # 删除多余备份
        backup_file_names.sort()
        if len(backup_file_names) > CONFIG['DB_AUTO_BACKUP_LIMIT']:
            for file_name in backup_file_names[0:-1 * CONFIG['DB_AUTO_BACKUP_LIMIT']]:
                file_path = os.path.join(backup_dir, file_name)
                os.remove(file_path)

    def run(self, **kwargs):
        # 上锁
        self.lock(max_age=60)

        # 需要导出的表
        tables = self.get_tables()

        # 导出
        self.run_backup(tables)

        # 自动删除旧备份
        self.limit_backups()

class ReloadDataMD5Cache(BaseInternalTask):
    '''
    数据 MD5 缓存任务
    '''
    name = 'Internal.ReloadDataMD5Cache'

    META = {
        'script': {
            'table'   : 'biz_main_script',
            'md5Field': "IFNULL(`codeMD5`, 'x')",
        },
        'connector': {
            'table'   : 'biz_main_connector',
            'md5Field': "MD5(`configJSON`)",
        },
        'envVariable': {
            'table'   : 'biz_main_env_variable',
            'md5Field': "MD5(CONCAT(valueTEXT, '|', autoTypeCasting))"
        },
    }

    def cache_data_md5(self, data_type, data_id=None):
        meta = self.META.get(data_type)

        sql = '''
            SELECT `id`, ?? AS `md5` FROM ??
            '''
        sql_params = [ meta['md5Field'], meta['table'] ]

        if data_id:
            data_id = toolkit.as_array(data_id)

            sql += '''
                WHERE `id` IN (?)
                '''
            sql_params.append(data_id)

        db_res = self.db.query(sql, sql_params)

        data_md5_map = dict([ ( d['id'], d['md5'] ) for d in db_res ])

        data_md5_cache_key = toolkit.get_cache_key('cache', 'dataMD5Cache', ['dataType', data_type])

        # 不指定 ID 表示全部重建
        if not data_id:
            self.cache_db.delete(data_md5_cache_key)

        if data_md5_map:
            # 有数据 -> 建立缓存
            self.cache_db.hmset(data_md5_cache_key, data_md5_map)

        elif data_id:
            # 无数据 + 指定 ID -> 清除缓存
            self.cache_db.hdel(data_md5_cache_key, data_id)

    def run(self, **kwargs):
        lock_time  = kwargs.get('lockTime') or 0
        reload_all = kwargs.get('all')      or False
        data_type  = kwargs.get('type')
        data_id    = kwargs.get('id')

        # 根据参数确定是否需要上锁
        if isinstance(lock_time, (int, float)) and lock_time > 0:
            self.lock(max_age=lock_time)

        # 将数据 MD5 缓存入 Redis
        if reload_all:
            for data_type in self.META.keys():
                self.cache_data_md5(data_type)

        else:
            self.cache_data_md5(data_type, data_id)

class CheckConnector(BaseInternalTask):
    name = 'Internal.CheckConnector'

    default_timeout = CONFIG['_CONNECTOR_CHECK_TASK_TIMEOUT']

    def run(self, **kwargs):
        connector_type   = kwargs.get('type')
        connector_config = kwargs.get('config')

        # 检查连接器
        if connector_type not in CONNECTOR_HELPER_CLASS_MAP:
            e = Exception('Unsupported Connector type: `{}`'.format(connector_type))
            raise e

        connector_helper_class = CONNECTOR_HELPER_CLASS_MAP[connector_type]
        if connector_helper_class:
            connector_helper = connector_helper_class(self.logger, config=connector_config)
            connector_helper.check()

class QueryConnector(BaseInternalTask):
    name = 'Internal.QueryConnector'

    default_timeout = CONFIG['_CONNECTOR_QUERY_TASK_TIMEOUT']

    def run(self, **kwargs):
        connector_id   = kwargs.get('id')
        command        = kwargs.get('command')
        command_args   = kwargs.get('commandArgs')   or []
        command_kwargs = kwargs.get('commandKwargs') or {}
        return_type    = kwargs.get('returnType')    or 'json'

        connector = None

        # 查询连接器
        sql = '''
            SELECT
                `type`,
                `configJSON`
            FROM biz_main_connector
            WHERE
                `id` = ?
            '''
        sql_params = [connector_id]
        db_res = self.db.query(sql, sql_params)
        if len(db_res) > 0:
            connector = db_res[0]
            connector['config'] = toolkit.json_loads(connector['configJSON'])

        if not connector:
            e = Exception('No such Connector')
            raise e

        # 执行连接器命令
        connector_type   = connector.get('type')
        connector_config = connector.get('config')
        connector_config = decipher_connector_config_fields(connector_config)

        connector_helper_class = CONNECTOR_HELPER_CLASS_MAP.get(connector_type)
        if not connector_helper_class:
            e = Exception('Unsupported Connector type: `{}`'.format(connector_type))
            raise e

        # 解密字段
        connector_helper = connector_helper_class(self.logger, config=connector_config)

        db_res = getattr(connector_helper, command)(*command_args, **command_kwargs)

        ret = None
        if return_type == 'repr':
            ret = pprint.pformat(db_res, width=100)
        else:
            ret = db_res
        return ret

class AutoRun(BaseInternalTask):
    name = 'Internal.AutoRun'

    def get_integrated_on_system_launch_funcs(self):
        sql = '''
            SELECT
               `func`.`id`
            FROM biz_main_func AS `func`
            WHERE
                   `func`.`integration` = 'autoRun'
                AND JSON_EXTRACT(
                    `func`.`extraConfigJSON`,
                    '$.integrationConfig.onScriptPublish'
                ) = TRUE;
            '''
        return self.db.query(sql)

    def run(self, **kwargs):
        # 上锁
        self.lock()

        sql = '''
            SELECT
                 `func`.`id`
                ,JSON_EXTRACT(
                    `func`.`extraConfigJSON`,
                    '$.timeout'
                ) AS `timeout`
            FROM biz_main_func AS `func`
            WHERE
                    `func`.`integration` = 'autoRun'
                AND (
                    JSON_EXTRACT(
                        `func`.`extraConfigJSON`,
                        '$.integrationConfig.onSystemLaunch') = TRUE
                    OR
                    JSON_EXTRACT(
                        `func`.`extraConfigJSON`,
                        '$.integrationConfig.onLaunch') = TRUE
                    );
            '''
        funcs = self.db.query(sql)

        for f in funcs:
            timeout = CONFIG['_FUNC_TASK_TIMEOUT_DEFAULT']
            if f['timeout']:
                timeout = int(f['timeout'])

            expires = timeout

            task_req = {
                'name': 'Func.Runner',
                'kwargs': {
                    'funcId'  : f['id'],
                    'origin'  : 'integration',
                    'originId': f"autoRun.onSystemLaunch-{f['id']}",
                },
                'queue'  : CONFIG['_FUNC_TASK_QUEUE_DEFAULT'],
                'timeout': timeout,
                'expires': expires,
            }
            self.cache_db.put_tasks(task_req)
