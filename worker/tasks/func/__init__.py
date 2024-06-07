# -*- coding: utf-8 -*-

# Built-in Modules
import os
import sys
import inspect
import traceback
import linecache
from types import ModuleType
import time
import importlib
import functools
import concurrent

# 3rd-party Modules
import six
import arrow
import funcsigs

# Project Modules
from worker.tasks import BaseTask
from worker.utils import yaml_resources, toolkit
from worker.utils.extra_helpers import format_sql
from worker.utils.extra_helpers import WhereSQLGenerator
from worker.utils.extra_helpers import GuanceHelper, DataKitHelper, DataWayHelper, SidecarHelper
from worker.utils.extra_helpers import InfluxDBHelper, MySQLHelper, RedisHelper, MemcachedHelper, ClickHouseHelper
from worker.utils.extra_helpers import PostgreSQLHelper, MongoDBHelper, ElasticSearchHelper, NSQLookupHelper, MQTTHelper, KafkaHelper
from worker.utils.extra_helpers import SQLServerHelper, OracleDatabaseHelper
from worker.utils.extra_helpers.guance_openapi import GuanceOpenAPI
from worker.utils.extra_helpers.datakit import DataKit
from worker.utils.extra_helpers.dataway import DataWay

CONFIG = yaml_resources.get('CONFIG')

# 集成处理
FIX_INTEGRATION_KEY_MAP = {
    # 额外用于登录DataFlux Func平台的函数
    # 集成为`POST /api/v1/func/integration/sign-in`
    # 集成为DataFlux Func登录界面
    #   函数必须为`def func(username, password)`形式
    #       返回`True`表示登录成功
    #       返回`False`或`Exception('<错误信息>')`表示登录失败
    #   无配置项
    'signin' : 'signIn',
    'sign_in': 'signIn',
    'login'  : 'signIn',
    'log_in' : 'signIn',

    # 自动运行函数
    # 集成为独立定时运行任务（即无需配置的定时任务）
    # 函数必须为`def func()`形式（即无参数形式）
    #   配置项：
    #       cronExpr: 自动运行周期（Cron 表达式）
    #       onSystemLaunch : True/False，是否系统启动后运行
    #       onScriptPublish: True/False，是否脚本发布后运行
    'autorun' : 'autoRun',
    'auto_run': 'autoRun',
}

FIX_INTEGRATION_CONFIG_KEY_MAP = {
    # Cron 表达式自动执行
    'cronexpr' : 'cronExpr',
    'cron_expr': 'cronExpr',
    'crontab'  : 'cronExpr',

    # 启动启动时运行
    'onsystemlaunch'  : 'onSystemLaunch',
    'on_system_launch': 'onSystemLaunch',
    'onlaunch'        : 'onSystemLaunch',
    'on_launch'       : 'onSystemLaunch',

    # 脚本发布后运行
    'onscriptpublish'  : 'onScriptPublish',
    'on_script_publish': 'onScriptPublish',
    'onpublish'        : 'onScriptPublish',
    'on_publish'       : 'onScriptPublish',
}

# 连接器对应 Helper 类
CONNECTOR_HELPER_CLASS_MAP = {
    'guance'       : GuanceHelper,
    'df_dataway'   : DataWayHelper,
    'df_datakit'   : DataKitHelper,
    'dff_sidecar'  : SidecarHelper,
    'influxdb'     : InfluxDBHelper,
    'mysql'        : MySQLHelper,
    'redis'        : RedisHelper,
    'memcached'    : MemcachedHelper,
    'clickhouse'   : ClickHouseHelper,
    'oracle'       : OracleDatabaseHelper,
    'sqlserver'    : SQLServerHelper,
    'postgresql'   : PostgreSQLHelper,
    'mongodb'      : MongoDBHelper,
    'elasticsearch': ElasticSearchHelper,
    'nsq'          : NSQLookupHelper,
    'mqtt'         : MQTTHelper,
    'kafka'        : KafkaHelper,
}

# 连接器加密字段
CONNECTOR_CIPHER_FIELDS = [
    'guanceAPIKey',
    'password',
    'secretKey',
]

# 环境变量自动类型转换函数
ENV_VARIABLE_AUTO_TYPE_CASTING_FUNC_MAP = {
    'integer'   : int,
    'float'     : float,
    'boolean'   : toolkit.to_boolean,
    'json'      : toolkit.json_loads,
    'commaArray': lambda x: x.split(','),
}

# 函数线程池
FUNC_THREAD_POOL       = None
FUNC_THREAD_POOL_SIZE  = None
FUNC_THREAD_RESULT_MAP = {}

# 脚本本地缓存
SCRIPT_LOCAL_CACHE = toolkit.LocalCache(expires=30)
USER_SCRIPT_ID_BLACK_LIST = [
    '__future__'
]

# 环境变量本地缓存
ENV_VARIABLE_LOCAL_CACHE = toolkit.LocalCache(expires=30)

# 添加额外import路径
extra_import_paths = [
    CONFIG.get('RESOURCE_ROOT_PATH'),
    os.path.join(CONFIG.get('RESOURCE_ROOT_PATH'), CONFIG.get('_EXTRA_PYTHON_PACKAGE_INSTALL_DIR')),
]
for p in extra_import_paths:
    os.makedirs(p, exist_ok=True)
    sys.path.append(p)

# 确保临时文件目录
download_temp_folder = os.path.join(CONFIG.get('RESOURCE_ROOT_PATH'), CONFIG.get('DOWNLOAD_TEMP_ROOT_FOLDER'))
os.makedirs(download_temp_folder, exist_ok=True)

class DataFluxFuncBaseException(Exception):
    pass

class EntityNotFound(DataFluxFuncBaseException):
    pass

class BadEntityCall(DataFluxFuncBaseException):
    pass

class FuncCircularCall(DataFluxFuncBaseException):
    pass

class FuncCallChainTooLong(DataFluxFuncBaseException):
    pass

class DuplicatedFuncName(DataFluxFuncBaseException):
    pass

class DuplicatedThreadResultKey(DataFluxFuncBaseException):
    pass

class ConnectorNotSupport(DataFluxFuncBaseException):
    pass

class InvalidConnectorConfig(DataFluxFuncBaseException):
    pass

class InvalidAPIOption(DataFluxFuncBaseException):
    pass

class DFFWraper(object):
    def __init__(self, inject_funcs=None):
        self.api_func_set    = set()
        self.api_funcs       = []
        self.print_log_lines = []

        self.inject_funcs = inject_funcs or {}

        # 增加小写别名
        for func_name in list(self.inject_funcs.keys()):
            func_name_lower = func_name.lower()
            self.inject_funcs[func_name_lower] = self.inject_funcs[func_name]

    def __getattr__(self, name):
        if not self.inject_funcs:
            return None
        else:
            return self.inject_funcs.get(name)

def decipher_connector_config(connector_id, config):
    '''
    解密字段
    '''
    config = toolkit.json_copy(config)

    for f in CONNECTOR_CIPHER_FIELDS:
        f_cipher = f'{f}Cipher'

        if config.get(f_cipher):
            try:
                salt = connector_id
                config[f] = toolkit.decipher_by_aes(config[f_cipher], CONFIG['SECRET'], salt)

            except UnicodeDecodeError as e:
                raise Exception('Decipher by AES failed. SECRET maybe wrong or changed')

            config.pop(f_cipher, None)

    return config

def get_resource_path(file_path):
    abs_path = os.path.join(CONFIG['RESOURCE_ROOT_PATH'], file_path.lstrip('/'))
    return abs_path

def get_sign(*args):
    str_to_sign = CONFIG['SECRET'] + '\n' + '\n'.join(map(str, args))
    return toolkit.get_md5(str_to_sign)

class FuncContextHelper(object):
    def __init__(self, task):
        self._task = task

        self.__data = {}

    def __call__(self, *args, **kwargs):
        return self.get(*args, **kwargs)

    def has(self, key):
        return key in self.__data

    def get(self, key):
        return toolkit.json_copy(self.__data.get(key))

    def get_all(self):
        return toolkit.json_copy(self.__data)

    def set(self, key, value):
        self.__data[key] = value

    def delete(self, key):
        return self.__data.pop(key, None)

    def clear(self):
        return self.__data.clear()

class FuncConnectorHelper(object):
    def __init__(self, task):
        self._task = task

    def __call__(self, *args, **kwargs):
        return self.get(*args, **kwargs)

    def get(self, connector_id, **helper_kwargs):
        # 同一个连接器可能有不同的配置（如指定的数据库不同）
        helper_kwargs = toolkit.no_none_or_whitespace(helper_kwargs)

        global CONNECTOR_HELPER_CLASS_MAP

        # 从 DB 获取连接器
        self._task.logger.debug(f"[LOAD connector] load `{connector_id}` from DB")

        sql = '''
            SELECT
                `id`
                ,`type`
                ,`configJSON`
            FROM `biz_main_connector`
            WHERE
                `id` = ?
            '''
        sql_params = [ connector_id ]
        connector = self._task.db.query(sql, sql_params)
        if not connector:
            e = EntityNotFound(f'Connector not found: `{connector_id}`')
            raise e

        connector = connector[0]

        # 确定连接器类型
        helper_type  = connector['type']
        helper_class = CONNECTOR_HELPER_CLASS_MAP.get(helper_type)
        if not helper_class:
            e = ConnectorNotSupport(f'Connector type not support: `{helper_type}`')
            raise e

        # 创建连接器 Helper
        config = toolkit.json_loads(connector['configJSON'])
        config = decipher_connector_config(connector['id'], config)

        helper = helper_class(self._task.logger, config, pool_size=CONFIG['_FUNC_TASK_CONNECTOR_POOL_SIZE'], **helper_kwargs)
        return helper

    def reload_config_md5(self, connector_id):
        cache_key = toolkit.get_cache_key('cache', 'dataMD5Cache', ['dataType', 'connector'])

        sql = '''
            SELECT
                `id`
                ,MD5(`configJSON`) AS `configMD5`
            FROM biz_main_connector
            WHERE
                `id` = ?
            '''
        sql_params = [ connector_id ]
        connector = self._task.db.query(sql, sql_params)
        if not connector:
            return

        connector = connector[0]
        self._task.cache_db.hset(cache_key, connector_id, connector['configMD5'])

    def save(self, connector_id, connector_type, config, title=None, description=None):
        if connector_type not in CONNECTOR_HELPER_CLASS_MAP:
            e = ConnectorNotSupport(f'Connector type `{connector_type}` not supported')
            raise e

        if not config:
            config = {}

        if not isinstance(config, dict):
            raise InvalidConnectorConfig('Connector config should be a dict')

        # 加密字段
        for k in CONNECTOR_CIPHER_FIELDS:
            v = config.get(k)
            if v is not None:
                salt = connector_id
                config[f'{k}Cipher'] = toolkit.cipher_by_aes(v, CONFIG['SECRET'], salt)

            config.pop(k, None)

        config_json = toolkit.json_dumps(config)

        sql = '''
            SELECT `id` FROM biz_main_connector WHERE `id` = ?
            '''
        sql_params = [connector_id]
        db_res = self._task.db.query(sql, sql_params)

        if len(db_res) > 0:
            # 已存在，更新
            sql = '''
                UPDATE biz_main_connector
                SET
                     `title`       = ?
                    ,`description` = ?
                    ,`type`        = ?
                    ,`configJSON`  = ?
                WHERE
                    `id` = ?
                '''
            sql_params = [
                title,
                description,
                connector_type,
                config_json,
                connector_id,
            ]
            self._task.db.query(sql, sql_params)

        else:
            # 不存在，插入
            sql = '''
                INSERT INTO biz_main_connector
                SET
                     `id`          = ?
                    ,`title`       = ?
                    ,`description` = ?
                    ,`type`        = ?
                    ,`configJSON`  = ?
                '''
            sql_params = [
                connector_id,
                title,
                description,
                connector_type,
                config_json,
            ]
            self._task.db.query(sql, sql_params)

        self.reload_config_md5(connector_id)

    def delete(self, connector_id):
        sql = '''
            DELETE FROM biz_main_connector
            WHERE
                `id` = ?
            '''
        sql_params = [connector_id]
        self._task.db.query(sql, sql_params)

        self.reload_config_md5(connector_id)

    def query(self, connector_type=None):
        sql = '''
            SELECT
                id,
                title,
                type
            FROM biz_main_connector
            '''
        sql_params = []

        if connector_type:
            sql += 'WHERE type IN (?)'
            sql_params.append(toolkit.as_array(connector_type))

        db_res = self._task.db.query(sql, sql_params)
        return db_res

class FuncEnvVariableHelper(object):
    '''
    加载环境变量
    1. 检查本地缓存（60 秒强制失效）的 MD5 与 Redis 缓存的 MD5 是否一致
        a. 一致则直接使用本地缓存
        b. 不一致则从数据库中读取脚本，并更新 Redis 缓存的 MD5
    2. 单次任务中，一旦加载则保持到任务结束
    '''
    def __init__(self, task):
        self._task = task

        self.__loaded_env_variable_cache = toolkit.LocalCache()

    def __call__(self, *args, **kwargs):
        return self.get(*args, **kwargs)

    def keys(self):
        sql = '''
            SELECT
                `id`
            FROM `biz_main_env_variable`
            '''
        db_res = self._task.db.query(sql)

        return [ d['id'] for d in db_res]

    def get(self, env_variable_id):
        env_variable = self.__loaded_env_variable_cache[env_variable_id]
        if env_variable:
            return toolkit.json_copy(env_variable['castedValue'])

        global ENV_VARIABLE_AUTO_TYPE_CASTING_FUNC_MAP
        global ENV_VARIABLE_LOCAL_CACHE

        remote_md5_cache_key = toolkit.get_cache_key('cache', 'dataMD5Cache', ['dataType', 'envVariable'])
        remote_md5           = None

        env_variable = ENV_VARIABLE_LOCAL_CACHE[env_variable_id]
        if env_variable:
            # 检查 Redis 缓存的环境变量 MD5
            remote_md5 = self._task.cache_db.hget(remote_md5_cache_key, env_variable_id)
            if remote_md5:
                remote_md5 = six.ensure_str(remote_md5)

            # 环境变量 MD5 未变化时，延长本地缓存，并返回缓存值
            if env_variable['valueMD5'] == remote_md5:
                self._task.logger.debug(f'[LOAD ENV VARIABLE] load `{env_variable_id}` from Cache')

                # 延长本地缓存
                ENV_VARIABLE_LOCAL_CACHE.refresh(env_variable_id)

                # 缓存环境变量
                self.__loaded_env_variable_cache[env_variable_id] = env_variable
                return toolkit.json_copy(env_variable['castedValue'])

        sql = '''
            SELECT
                `id`
                ,`autoTypeCasting`
                ,`valueTEXT`
                ,MD5(IFNULL(`valueTEXT`, '')) AS valueMD5
            FROM `biz_main_env_variable`
            WHERE
                `id` = ?
            '''
        sql_params = [ env_variable_id ]
        env_variable = self._task.db.query(sql, sql_params)
        if not env_variable:
            self._task.logger.debug(f"[LOAD ENV VARIABLE] `{env_variable_id}` not found")
            return None

        # 从 DB 获取环境变量
        self._task.logger.debug(f"[LOAD ENV VARIABLE] load `{env_variable_id}` from DB")

        env_variable = env_variable[0]

        # 解密
        if env_variable['autoTypeCasting'] == 'password':
            salt = env_variable['id']
            env_variable['valueTEXT'] = toolkit.decipher_by_aes(env_variable['valueTEXT'], CONFIG['SECRET'], salt)

        # 类型转换
        auto_type_casting = env_variable['autoTypeCasting']
        if auto_type_casting in ENV_VARIABLE_AUTO_TYPE_CASTING_FUNC_MAP:
            env_variable['castedValue'] = ENV_VARIABLE_AUTO_TYPE_CASTING_FUNC_MAP[auto_type_casting](env_variable['valueTEXT'])
        else:
            env_variable['castedValue'] = env_variable['valueTEXT']

        # 缓存环境变量 MD5
        self._task.cache_db.hset(remote_md5_cache_key, env_variable_id, env_variable['valueMD5'])
        ENV_VARIABLE_LOCAL_CACHE[env_variable_id] = env_variable

        # 缓存环境变量
        self.__loaded_env_variable_cache[env_variable_id] = env_variable

        return toolkit.json_copy(env_variable['castedValue'])

class FuncStoreHelper(object):
    def __init__(self, task, default_scope):
        self._task = task

        self.default_scope = default_scope

    def __call__(self, *args, **kwargs):
        return self.get(*args, **kwargs)

    def _get_id(self, key, scope):
        '''
        计算函数存储 ID
        '''
        str_to_md5 = '-'.join([key, scope])

        store_id = 'fnst-' + toolkit.get_md5(str_to_md5)
        return store_id

    def set(self, key, value, scope=None, expire=None, not_exists=False):
        if scope is None:
            scope = self.default_scope

        if len(key) > 256:
            e = Exception('`key` is too long. Length of `key` should be less then 256')
            raise e
        if len(scope) > 256:
            e = Exception('`scope` is too long. Length of `scope` should be less then 256')
            raise e

        value_json = toolkit.json_dumps(value)
        store_id   = self._get_id(key, scope)

        sql = '''
            SELECT
                `seq`
            FROM biz_main_func_store
            WHERE
                `id` = ?
            '''
        sql_params = [store_id]
        db_res = self._task.db.query(sql, sql_params)

        # 仅在不存在时插入
        if db_res and not_exists:
            return

        if db_res:
            # 已存在，更新
            sql = '''
                UPDATE biz_main_func_store
                SET
                     `valueJSON` = ?
                    ,`expireAt`  = UNIX_TIMESTAMP() + ?
                WHERE
                    `id` = ?
                '''
            sql_params = [value_json, expire, store_id]
            self._task.db.query(sql, sql_params)

        else:
            # 不存在，插入
            sql = '''
                INSERT IGNORE INTO biz_main_func_store
                SET
                     `id`        = ?
                    ,`key`       = ?
                    ,`valueJSON` = ?
                    ,`scope`     = ?
                    ,`expireAt`  = UNIX_TIMESTAMP() + ?
                '''
            sql_params = [store_id, key, value_json, scope, expire]
            self._task.db.query(sql, sql_params)

    def keys(self, pattern='*', scope=None):
        if scope is None:
            scope = self.default_scope

        pattern = pattern.replace('%', '\%').replace('_', '\_').replace('*', '%').replace('?', '_')

        sql = '''
            SELECT
                 `key`
            FROM biz_main_func_store
            WHERE
                    `key` LIKE ?
                AND (
                           `expireAt` IS NULL
                        OR `expireAt` >= UNIX_TIMESTAMP()
                    )
            '''
        sql_params = [pattern]
        db_res = self._task.db.query(sql, sql_params)

        ret = [ d['key'] for d in db_res ]
        return ret

    def get(self, key, scope=None):
        if scope is None:
            scope = self.default_scope

        if len(key) > 256:
            e = Exception('`key` is too long. Length of `key` should be less then 256')
            raise e
        if len(scope) > 256:
            e = Exception('`scope` is too long. Length of `scope` should be less then 256')
            raise e

        store_id = self._get_id(key, scope)

        sql = '''
            SELECT
                `valueJSON`
            FROM biz_main_func_store
            WHERE
                    `id` = ?
                AND (
                           `expireAt` IS NULL
                        OR `expireAt` >= UNIX_TIMESTAMP()
                    )
            '''
        sql_params = [store_id]
        db_res = self._task.db.query(sql, sql_params)
        if not db_res:
            return None

        value = db_res[0]['valueJSON']
        try:
            value = toolkit.json_loads(value)
        except Exception as e:
            pass
        finally:
            return value

    def delete(self, key, scope=None):
        if scope is None:
            scope = self.default_scope

        if len(key) > 256:
            e = Exception('`key` is too long. Length of `key` should be less then 256')
            raise e
        if len(scope) > 256:
            e = Exception('`scope` is too long. Length of `scope` should be less then 256')
            raise e

        store_id = self._get_id(key, scope)

        sql = '''
            DELETE FROM biz_main_func_store
            WHERE
                `id` = ?
            '''
        sql_params = [store_id]
        self._task.db.query(sql, sql_params)

class FuncCacheHelper(object):
    def __init__(self, task, default_scope):
        self._task = task

        self.default_scope = default_scope

    def __call__(self, *args, **kwargs):
        return self.get(*args, **kwargs)

    def _get_cache_key(self, key, scope):
        if scope is None:
            scope = self.default_scope

        key = toolkit.get_cache_key('funcCache', scope, tags=['key', key])
        return key

    def _get_user_cache_key(self, key, scope):
        if scope is None:
            scope = self.default_scope

        key_template = self._get_cache_key('\n', scope)
        a, b = map(len, key_template.splitlines())
        return key[a:-b]

    def _convert_result(self, result):
        if result is None:
            return None
        elif isinstance(result, (bool, int, float)):
            return result
        else:
            return six.ensure_str(result)

    def run(self, cmd, key, *args, **kwargs):
        scope = kwargs.pop('scope', None)
        key = self._get_cache_key(key, scope)
        return self._task.cache_db.run(cmd, key, *args, **kwargs)

    def type(self, key, scope=None):
        key = self._get_cache_key(key, scope)
        data_type = self._convert_result(self._task.cache_db.run('type', key))
        if data_type == 'none':
            data_type = None

        return data_type

    def set(self, key, value, scope=None, expire=None, not_exists=False):
        key = self._get_cache_key(key, scope)
        return self._task.cache_db.run('set', key, value, ex=expire, nx=not_exists)

    def keys(self, pattern='*', scope=None):
        pattern = self._get_cache_key(pattern, scope)
        res = self._task.cache_db.keys(pattern)
        res = list(map(lambda x: self._get_user_cache_key(x, scope), res))
        return res

    def get(self, key, scope=None):
        key = self._get_cache_key(key, scope)
        res = self._task.cache_db.run('get', key)
        return self._convert_result(res)

    def getset(self, key, value, scope=None):
        key = self._get_cache_key(key, scope)
        res = self._task.cache_db.run('getset', key, value)
        return self._convert_result(res)

    def expire(self, key, expires, scope=None):
        key = self._get_cache_key(key, scope)
        return self._task.cache_db.run('expire', key, expires)

    def delete(self, key, scope=None):
        key = self._get_cache_key(key, scope)
        return self._task.cache_db.run('delete', key)

    def incr(self, key, step=1, scope=None):
        key = self._get_cache_key(key, scope)
        res = self._task.cache_db.run('incr', key, amount=step)
        return self._convert_result(res)

    def hkeys(self, key, pattern='*', scope=None):
        key = self._get_cache_key(key, scope)
        res = self._task.cache_db.hkeys(key, pattern)
        return res

    def hget(self, key, field=None, scope=None):
        key = self._get_cache_key(key, scope)
        if field is None:
            res = self._task.cache_db.run('hgetall', key)
            res = dict([(six.ensure_str(k), six.ensure_str(v)) for k, v in res.items()])
            return res

        elif isinstance(field, (list, tuple)):
            if not field:
                return {}

            res = self._task.cache_db.run('hmget', key, field)
            res = dict(zip(field, [None if not x else six.ensure_str(x) for x in res]))
            return res

        else:
            res = self._task.cache_db.run('hget', key, field)
            return self._convert_result(res)

    def hmget(self, key, fields, scope=None):
        return self.hget(key, fields, scope)

    def hgetall(self, key, scope=None):
        return self.hget(key, scope=scope)

    def hset(self, key, field, value, scope=None, not_exists=False):
        key = self._get_cache_key(key, scope)
        if not_exists:
            return self._task.cache_db.run('hsetnx', key, field, value)
        else:
            return self._task.cache_db.run('hset', key, field, value)

    def hmset(self, key, obj, scope=None):
        key = self._get_cache_key(key, scope)
        return self._task.cache_db.run('hmset', key, obj)

    def hincr(self, key, field, step=1, scope=None):
        key = self._get_cache_key(key, scope)
        return self._task.cache_db.run('hincrby', key, field, amount=step)

    def hdel(self, key, field, scope=None):
        key = self._get_cache_key(key, scope)
        field = toolkit.as_array(field)
        return self._task.cache_db.run('hdel', key, *field)

    def lpush(self, key, value, scope=None):
        key = self._get_cache_key(key, scope)
        return self._task.cache_db.run('lpush', key, value)

    def rpush(self, key, value, scope=None):
        key = self._get_cache_key(key, scope)
        return self._task.cache_db.run('rpush', key, value)

    def lpop(self, key, scope=None):
        key = self._get_cache_key(key, scope)
        res = self._task.cache_db.run('lpop', key)
        return self._convert_result(res)

    def rpop(self, key, scope=None):
        key = self._get_cache_key(key, scope)
        res = self._task.cache_db.run('rpop', key)
        return self._convert_result(res)

    def push(self, key, value, scope=None):
        '''
        lpush 别名
        '''
        return self.lpush(key, value, scope)

    def pop(self, key, scope=None):
        '''
        rpop 别名
        '''
        return self.rpop(key, scope)

    def llen(self, key, scope=None):
        key = self._get_cache_key(key, scope)
        return self._task.cache_db.run('llen', key)

    def lrange(self, key, start=0, stop=-1, scope=None):
        key = self._get_cache_key(key, scope)
        res = self._task.cache_db.run('lrange', key, start, stop);
        return [self._convert_result(x) for x in res]

    def ltrim(self, key, start, stop, scope=None):
        key = self._get_cache_key(key, scope)
        return self._task.cache_db.run('ltrim', key, start, stop);

    def rpoplpush(self, key, dest_key=None, scope=None, dest_scope=None):
        if dest_key is None:
            dest_key = key
        if dest_scope is None:
            dest_scope = scope

        key      = self._get_cache_key(key, scope)
        dest_key = self._get_cache_key(dest_key, dest_scope)
        res = self._task.cache_db.run('rpoplpush', key, dest_key)
        return self._convert_result(res)

class FuncConfigHelper(object):
    MASKED_CONFIG = toolkit.json_mask(CONFIG)

    def __init__(self, task):
        self._task = task

    def __call__(self, *args, **kwargs):
        return self.get(*args, **kwargs)

    def get(self, config_id, default=None, unmask=False):
        if config_id in self.MASKED_CONFIG:
            if unmask and config_id.startswith('CUSTOM_'):
                return toolkit.json_copy(CONFIG[config_id])
            else:
                return toolkit.json_copy(self.MASKED_CONFIG[config_id])
        else:
            return toolkit.json_copy(default)

    def query(self, all_configs=False, list_output=False):
        res = {}
        for k, v in self.MASKED_CONFIG.items():
            if not all_configs and not k.startswith('CUSTOM_'):
                continue

            res[k] = v

        if list_output:
            res = list([ { 'key': k, 'value': v } for k, v in res.items() ])

        return res

class BaseFuncResponse(object):
    def __init__(self,
                 data=None,
                 file_path=None,
                 status_code=None,
                 content_type=None,
                 headers=None,
                 allow_304=False,
                 auto_delete=False,
                 download=True):
        self.data         = data          # 返回数据
        self.file_path    = file_path     # 返回文件（资源目录下相对路径）
        self.status_code  = status_code   # HTTP响应码
        self.content_type = content_type  # HTTP响应体类型
        self.headers      = headers or {} # HTTP响应头
        self.allow_304    = allow_304     # 是否允许304缓存
        self.auto_delete  = auto_delete   # 是否响应后自动删除文件文件
        self.download     = download      # 是否响应为文件下载

        # 检查待下载的文件是否存在
        if self.file_path:
            if not os.path.isfile(get_resource_path(self.file_path)):
                e = Exception(f'No such file in Resource folder: {self.file_path}')
                raise e

    def make_response_control(self):
        response_control = {
            'statusCode' : self.status_code,
            'contentType': self.content_type,
            'headers'    : self.headers,
            'allow304'   : self.allow_304,
            'download'   : self.download,
        }

        if self.file_path:
            response_control['filePath']   = self.file_path
            response_control['autoDelete'] = self.auto_delete

        response_control = toolkit.no_none_or_whitespace(response_control)

        return response_control

class FuncResponse(BaseFuncResponse):
    def __init__(self,
                 data,
                 status_code=None,
                 content_type=None,
                 headers=None,
                 allow_304=False,
                 download=False):
        try:
            # 尝试序列化返回值
            toolkit.json_dumps(data, indent=None)
        except Exception as e:
            data = Exception(f'Func Response cannot been serialized: {e}')

        super().__init__(data=data,
                         status_code=status_code,
                         content_type=content_type,
                         headers=headers,
                         allow_304=allow_304,
                         download=download)

class FuncResponseFile(BaseFuncResponse):
    def __init__(self,
                 file_path,
                 status_code=None,
                 headers=None,
                 allow_304=False,
                 auto_delete=False,
                 download=True):
        super().__init__(file_path=file_path,
                         status_code=status_code,
                         headers=headers,
                         allow_304=allow_304,
                         auto_delete=auto_delete,
                         download=download)

class FuncResponseLargeData(BaseFuncResponse):
    def __init__(self, data, content_type=None):
        if not content_type:
            if isinstance(data, (dict, list, tuple)):
                content_type = 'json'
            else:
                content_type = 'txt'

        if not isinstance(data, str):
            data = toolkit.json_dumps(data)

        self.tmp_file_ext  = content_type
        self.tmp_file_data = data

        super().__init__(auto_delete=True, download=False)

    def cache_to_file(self, cache_expires=0):
        # 保证至少 60 秒缓存缓存
        if not isinstance(cache_expires, (int, float)) or cache_expires < 60:
            cache_expires = 60

        tmp_dir    = CONFIG['DOWNLOAD_TEMP_ROOT_FOLDER']
        expire_tag = arrow.get(time.time() + cache_expires).format('YYYYMMDDHHmmss')
        rand_tag   = toolkit.gen_rand_string(16)

        tmp_file_path = f"{tmp_dir}/{expire_tag}_{rand_tag}_api-resp.{self.tmp_file_ext}"
        with open(get_resource_path(tmp_file_path), 'w') as _f:
            _f.write(self.tmp_file_data)

        self.file_path = tmp_file_path

class FuncRedirect(FuncResponse):
    def __init__(self, url):
        data    = f'<a href   = "{url}">Redirect</a>'
        headers = { 'Location': url }

        super().__init__(data=data,
                         status_code=302,
                         content_type='html',
                         headers=headers)

class FuncThreadResult(object):
    def __init__(self, key, value, error=None):
        self.key   = key
        self.value = value
        self.error = error

class FuncThreadHelper(object):
    def __init__(self, task):
        self._task = task

    @property
    def is_all_finished(self):
        global FUNC_THREAD_RESULT_MAP

        if not FUNC_THREAD_RESULT_MAP:
            return True

        return all([ future_res.done() for key, future_res in FUNC_THREAD_RESULT_MAP.items() ])

    @property
    def pool_size(self):
        global FUNC_THREAD_POOL_SIZE
        return FUNC_THREAD_POOL_SIZE

    def set_pool_size(self, pool_size):
        global FUNC_THREAD_POOL
        global FUNC_THREAD_POOL_SIZE

        if FUNC_THREAD_POOL:
            _msg = f"[THREAD POOL] Cannot set thread pool size after task submitted, skip"
            self._task.logger.info(_msg)
            self._task._log(self._task.script_scope, _msg)
            return

        # 检查参数
        try:
            pool_size = int(pool_size)
            if pool_size <= 0:
                raise ValueError()

        except Exception as e:
            e = Exception('Invalid pool size, should be an integer which is greater than 0')
            raise e

        FUNC_THREAD_POOL_SIZE = pool_size

    def create_pool(self):
        global FUNC_THREAD_POOL
        global FUNC_THREAD_POOL_SIZE

        if FUNC_THREAD_POOL:
            _msg = f"[THREAD POOL] Thread pool is already created, skip"
            self._task.logger.info(_msg)
            self._task._log(self._task.script_scope, _msg)
            return

        pool_size = FUNC_THREAD_POOL_SIZE or CONFIG['_FUNC_TASK_THREAD_POOL_SIZE_DEFAULT']
        FUNC_THREAD_POOL = concurrent.futures.ThreadPoolExecutor(max_workers=pool_size)

        _msg = f"[THREAD POOL] Pool created (size={pool_size})"
        self._task.logger.debug(_msg)
        self._task._log(self._task.script_scope, _msg)

    def submit(self, fn, *args, **kwargs):
        global FUNC_THREAD_POOL
        global FUNC_THREAD_RESULT_MAP

        if not FUNC_THREAD_POOL:
            self.create_pool()

        key = toolkit.gen_data_id('thread-result')
        self._task.logger.debug(f'[THREAD POOL] Submit Key=`{key}`')

        if key in FUNC_THREAD_RESULT_MAP:
            e = DuplicatedThreadResultKey(f'Thread result key already existed: `{key}`')
            raise e

        args   = args   or []
        kwargs = kwargs or {}
        FUNC_THREAD_RESULT_MAP[key] = FUNC_THREAD_POOL.submit(fn, *args, **kwargs)

        return key

    def _get_result(self, key=None, wait=True):
        global FUNC_THREAD_RESULT_MAP

        if not FUNC_THREAD_RESULT_MAP:
            return None

        collected_res = {}

        keys = key or list(FUNC_THREAD_RESULT_MAP.keys())
        for k in toolkit.as_array(keys):
            k = str(k)

            collected_res[k] = None

            future_res = FUNC_THREAD_RESULT_MAP.get(k)
            if future_res is None:
                continue

            if not future_res.done() and not wait:
                continue

            value = None
            error = None
            try:
                value = future_res.result()
            except Exception as e:
                error = e
            finally:
                collected_res[k] = FuncThreadResult(key=k, value=value, error=error)

        if key:
            return collected_res.get(key)
        else:
            return collected_res

    def get_result(self, key, wait=True):
        return self._get_result(key=key, wait=wait)

    def get_all_results(self, wait=True):
        return self._get_result(wait=wait).values()

    def pop_result(self, wait=True):
        global FUNC_THREAD_RESULT_MAP

        if not FUNC_THREAD_RESULT_MAP:
            return None

        finished_key = None
        while True:
            # 查找已经结束的结果
            for key, future_res in FUNC_THREAD_RESULT_MAP.items():
                if future_res.done():
                    finished_key = key
                    break

            # 未找到，且需要等待
            if not finished_key and wait:
                for _ in concurrent.futures.wait(FUNC_THREAD_RESULT_MAP.values(), return_when=concurrent.futures.FIRST_COMPLETED):
                    break
                continue

            break

        if finished_key is None:
            return None

        future_res = FUNC_THREAD_RESULT_MAP.pop(finished_key)

        value = None
        error = None
        try:
            value = future_res.result()
        except Exception as e:
            error = e
        finally:
            return FuncThreadResult(key=finished_key, value=value, error=error)

    def wait_all_finished(self):
        self._get_result(wait=True)

class BaseFuncEntityHelper(object):
    _table         = None
    _entity_origin = None

    _entity_queue_default   = CONFIG['_FUNC_TASK_QUEUE_DEFAULT']
    _entity_timeout_default = CONFIG['_FUNC_TASK_TIMEOUT_DEFAULT']
    _entity_expires_default = CONFIG['_FUNC_TASK_EXPIRES_DEFAULT']

    def __init__(self, task):
        self._task = task

    def __call__(self, *args, **kwargs):
        return self.call(*args, **kwargs)

    def resolve_entity_id(self, entity_id=None):
        if not entity_id:
            if self._task.origin == self._entity_origin:
                return self._task.origin_id
            else:
                return None

        return entity_id

    def get(self, entity_id=None):
        sql = '''
            SELECT
                entity.*
                ,sset.title AS scriptSetTitle
                ,scpt.title AS scriptTitle
                ,func.title AS funcTitle

                ,func.extraConfigJSON AS funcExtraConfigJSON

            FROM ?? AS entity

            LEFT JOIN biz_main_func AS func
              ON func.id = entity.funcId

            LEFT JOIN biz_main_script AS scpt
              ON scpt.id = func.scriptId

            LEFT JOIN biz_main_script_set AS sset
              ON sset.id = func.scriptSetId

            WHERE
                entity.id = ?

            LIMIT 1
            '''
        sql_params = [ self._table, self.resolve_entity_id(entity_id) ]
        db_res = self._task.db.query(sql, sql_params)
        if db_res:
            return db_res[0]

        return None

    def query(self, fields=None, filters=None):
        fields = toolkit.as_array_str(fields) or '*'

        sql = '''
            SELECT ?? FROM ??
            '''
        sql_params = [ fields, self._table ]

        if filters:
            where_clause_list = []
            for field, conditions in filters.items():
                for op, value in conditions.items():
                    where_clause_list.append(f"({WhereSQLGenerator.run(op, field, value)})")

            if where_clause_list:
                sql += f" WHERE {' AND '.join(where_clause_list)}"

        db_res = self._task.db.query(sql, sql_params)
        return db_res

    def call(self, entity_id, kwargs=None, trigger_time=None, queue=None, timeout=None, expires=None):
        entity = self.get(entity_id)

        func_extra_config = {}
        if entity.get('funcExtraConfigJSON'):
            func_extra_config = toolkit.json_loads(entity['funcExtraConfigJSON'])

        # 任务请求
        task_req = {
            'name': 'Func.Runner',
            'kwargs': {
                'funcId'         : entity['funcId'],
                'funcCallKwargs' : kwargs,
                'origin'         : self._entity_origin,
                'originId'       : entity_id,

                'scriptSetTitle': entity.get('scriptSetTitle'),
                'scriptTitle'   : entity.get('scriptTitle'),
                'funcTitle'     : entity.get('funcTitle'),
            },

            'triggerTime'    : trigger_time,
            'queue'          : None,
            'timeout'        : None,
            'expires'        : None,
            'taskRecordLimit': entity['taskRecordLimit'],
        }

        # 进一步配置
        # NOTE: 此处参考 mainAPICtrl.js#createFuncRunnerTaskReq(...)

        # 队列 taskReq.queue
        #    优先级：直接指定 > 函数配置 > 默认值
        if queue is not None:
            # 直接指定
            queue_number = int(queue)
            if queue_number < 1 or queue_number > 9:
                e = BadEntityCall('Invalid options, queue should be an integer between 1 and 9')
                raise e

            task_req['queue'] = queue_number

        elif func_extra_config.get('queue') is not None:
            # 函数配置
            task_req['queue'] = int(func_extra_config['queue'])

        else:
            # 默认值
            task_req['queue'] = self._entity_queue_default

        # 任务执行超时 taskReq.timeout
        #    优先级：调用时指定 > 函数配置 > 默认值
        if timeout is not None:
            # 调用时指定
            timeout = int(timeout)

            if timeout < CONFIG['_FUNC_TASK_TIMEOUT_MIN']:
                e = BadEntityCall('Invalid options, timeout is too small')
                raise e

            elif timeout > CONFIG['_FUNC_TASK_TIMEOUT_MAX']:
                e = BadEntityCall('Invalid options, timeout is too large')
                raise e

            task_req['timeout'] = timeout

        elif func_extra_config.get('timeout') is not None:
            # 函数配置
            task_req['timeout'] = int(func_extra_config['timeout'])

        else:
            # 默认值
            task_req['timeout'] = self._entity_timeout_default

        # 任务执行超时 taskReq.expires
        #    优先级：调用时指定 > 函数配置 > 默认值
        if expires is not None:
            # 调用时指定
            expires = int(expires)

            if expires < CONFIG['_FUNC_TASK_EXPIRES_MIN']:
                e = BadEntityCall('Invalid options, expires is too small')
                raise e

            elif expires > CONFIG['_FUNC_TASK_EXPIRES_MAX']:
                e = BadEntityCall('Invalid options, expires is too large')
                raise e

            task_req['expires'] = expires

        elif func_extra_config.get('expires') is not None:
            # 函数配置
            task_req['expires'] = int(func_extra_config['expires'])

        else:
            # 默认值
            if self._entity_origin in ('syncAPI', 'asyncAPI'):
                # 同步/异步 API 过期与超时相同
                task_req['expires'] = task_req.get('timeout') or self._entity_expires_default
            else:
                task_req['expires'] = self._entity_expires_default

        # 返回类型 taskReq.returnType
        # NOTE: 函数内调用业务实体都是异步，不存在返回值问题

        self._task.cache_db.put_tasks(task_req)

class FuncSyncAPIHelper(BaseFuncEntityHelper):
    _table         = 'biz_main_sync_api'
    _entity_origin = 'syncAPI'

class FuncAsyncAPIHelper(BaseFuncEntityHelper):
    _table         = 'biz_main_async_api'
    _entity_origin = 'asyncAPI'

    _entity_queue_default   = CONFIG['_FUNC_TASK_QUEUE_ASYNC_API']
    _entity_timeout_default = CONFIG['_FUNC_TASK_TIMEOUT_ASYNC_API']

class FuncCronJobHelper(BaseFuncEntityHelper):
    _table         = 'biz_main_cron_job'
    _entity_origin = 'cronJob'

    _entity_queue_default = CONFIG['_FUNC_TASK_QUEUE_CRON_JOB']

    # 兼容处理
    _field_remap = {
        'crontab': 'cronExpr',
    }

    def query(self, fields=None, filters=None):
        # 兼容处理
        if fields:
            next_fields = []
            for f in fields:
                next_fields.append(self._field_remap.get(f, f))

            fields = next_fields

        if filters:
            next_filters = {}
            for f, v in filters.items():
                next_filters[self._field_remap.get(f, f)] = v

            filters = next_filters

        return super().query(fields, filters)

    def set_cron_expr(self, cron_expr, expires=None, entity_id=None):
        entity_id = self.resolve_entity_id(entity_id)
        if not entity_id:
            return

        cache_key = toolkit.get_global_cache_key('cronJob', 'dynamicCronExpr')
        cache_value = {
            'expireTime': None if not expires else int(time.time()) + expires,
            'value'     : cron_expr,
        }
        self._task.cache_db.hset(cache_key, entity_id, toolkit.json_dumps(cache_value))

    def get_cron_expr(self, entity_id=None):
        entity_id = self.resolve_entity_id(entity_id)
        if not entity_id:
            return

        cache_key = toolkit.get_global_cache_key('cronJob', 'dynamicCronExpr')
        dynamic_cron_expr = self._task.cache_db.hget(cache_key, entity_id)
        if not dynamic_cron_expr:
            return None

        dynamic_cron_expr = toolkit.json_loads(dynamic_cron_expr)
        if dynamic_cron_expr['expireTime'] and dynamic_cron_expr['expireTime'] < int(time.time()):
            return None

        return dynamic_cron_expr['value']

    def get_all_cron_expr(self):
        cache_key = toolkit.get_global_cache_key('cronJob', 'dynamicCronExpr')
        dynamic_cron_expr_map = self._task.cache_db.hgetall(cache_key)
        if not dynamic_cron_expr_map:
            return {}

        for entity_id in list(dynamic_cron_expr_map.keys()):
            dynamic_cron_expr = toolkit.json_loads(dynamic_cron_expr_map[entity_id])
            if dynamic_cron_expr['expireTime'] and dynamic_cron_expr['expireTime'] < int(time.time()):
                dynamic_cron_expr_map.pop(entity_id, None)
            else:
                dynamic_cron_expr_map[entity_id] = dynamic_cron_expr['value']

        return dynamic_cron_expr_map

    def clear_cron_expr(self, entity_id=None):
        entity_id = self.resolve_entity_id(entity_id)
        if not entity_id:
            return

        cache_key = toolkit.get_global_cache_key('cronJob', 'dynamicCronExpr')
        self._task.cache_db.hdel(cache_key, entity_id)

    def pause(self, expires, entity_id=None):
        # 暂定必须有过期时间，不得永久暂停
        entity_id = self.resolve_entity_id(entity_id)
        if not entity_id:
            return

        cache_key = toolkit.get_global_cache_key('cronJob', 'pause')
        cache_value = int(time.time()) + expires
        self._task.cache_db.hset(cache_key, entity_id, cache_value)

    # 兼容处理
    def set_crontab(self, *args, **kwargs):
        return self.set_cron_expr(*args, **kwargs)
    def get_crontab(self, *args, **kwargs):
        return self.get_cron_expr(*args, **kwargs)
    def get_all_crontab(self, *args, **kwargs):
        return self.get_all_cron_expr(*args, **kwargs)
    def clear_crontab(self, *args, **kwargs):
        return self.clear_cron_expr(*args, **kwargs)

    def set_temp_crontab(self, *args, **kwargs):
        return self.set_cron_expr(*args, **kwargs)
    def get_temp_crontab(self, *args, **kwargs):
        return self.get_cron_expr(*args, **kwargs)
    def get_all_temp_crontab(self, *args, **kwargs):
        return self.get_all_cron_expr(*args, **kwargs)
    def clear_temp_crontab(self, *args, **kwargs):
        return self.clear_cron_expr(*args, **kwargs)

class FuncExtraForGuanceHelper(object):
    def __init__(self, task):
        self._task = task

        self._tags   = {}
        self._fields = {}

    @property
    def tags(self):
        return toolkit.json_copy(self._tags) or {}

    @property
    def fields(self):
        return toolkit.json_copy(self._fields) or {}

    def set_tags(self, **data):
        for k, v in data.items():
            if v is None:
                continue

            self._tags[k] = str(v)

    def delete_tags(self, *keys):
        for k in keys:
            self._tags.pop(k, None)

    def set_fields(self, **data):
        for k, v in data.items():
            if v is None:
                continue

            self._fields[k] = v

    def delete_fields(self, *keys):
        for k in keys:
            self._fields.pop(k, None)

class ToolkitWrap(object):
    gen_uuid               = toolkit.gen_uuid
    json_find              = toolkit.json_find
    json_find_safe         = toolkit.json_find_safe
    json_smart_find        = toolkit.json_smart_find
    json_override          = toolkit.json_override
    json_pick              = toolkit.json_pick
    json_dumps             = toolkit.json_dumps
    json_loads             = toolkit.json_loads
    json_copy              = toolkit.json_copy
    get_arrow              = toolkit.get_arrow
    get_date_string        = toolkit.get_date_string
    get_time_string        = toolkit.get_time_string
    get_datetime_string    = toolkit.get_datetime_string
    get_datetime_string_cn = toolkit.get_datetime_string_cn
    to_unix_timestamp      = toolkit.to_unix_timestamp
    to_unix_timestamp_ms   = toolkit.to_unix_timestamp_ms
    to_iso_datetime        = toolkit.to_iso_datetime
    to_boolean             = toolkit.to_boolean
    get_days_from_now      = toolkit.get_days_from_now
    get_md5                = toolkit.get_md5
    get_sha1               = toolkit.get_sha1
    get_sha256             = toolkit.get_sha256
    get_sha512             = toolkit.get_sha512
    cipher_by_aes          = toolkit.cipher_by_aes
    decipher_by_aes        = toolkit.decipher_by_aes
    get_base64             = toolkit.get_base64
    from_base64            = toolkit.from_base64
    gen_rand_string        = toolkit.gen_rand_string
    as_array               = toolkit.as_array
    as_array_str           = toolkit.as_array_str
    match_wildcard         = toolkit.match_wildcard
    match_wildcards        = toolkit.match_wildcards

class FuncBaseTask(BaseTask):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        self.__context_helper = FuncContextHelper(self)

        self.__loaded_script_cache   = toolkit.LocalCache()
        self.__imported_module_cache = toolkit.LocalCache()

        self.__prev_log_time = 0

        # 函数 ID
        self.func_id = self.kwargs.get('funcId')

        # 函数调用参数
        self.func_call_kwargs = self.kwargs.get('funcCallKwargs') or {}

        # 脚本集 ID，脚本 ID，脚本名，函数名
        if '.' in self.func_id:
            self.script_id, self.func_name = self.func_id.split('.', maxsplit=1)
        else:
            self.script_id, self.func_name = self.func_id, None

        self.script_set_id, self.script_name = self.script_id.split('__', maxsplit=1)

        # 脚本集、脚本、函数标题
        self.script_set_title = self.kwargs.get('scriptSetTitle')
        self.script_title     = self.kwargs.get('scriptTitle')
        self.func_title       = self.kwargs.get('funcTitle')

        # 任务来源
        self.origin    = self.kwargs.get('origin')
        self.origin_id = self.kwargs.get('originId')

        # 主任务 ID
        self.root_task_id = self.kwargs.get('rootTaskId') or 'ROOT'

        # 调用链
        self.call_chain = self.kwargs.get('callChain') or []
        self.call_chain.append(self.func_id)

        # HTTP 请求
        self.http_request = self.kwargs.get('httpRequest') or {}
        if 'headers' in self.http_request:
            self.http_request['headers'] = toolkit.IgnoreCaseDict(self.http_request['headers'])

        # 缓存函数调用结果
        self.cache_result     = self.kwargs.get('cacheResult') or False
        self.cache_result_key = self.kwargs.get('cacheResultKey')

        # 脚本 / 脚本环境
        self.script       = None
        self.script_scope = None

        # print 日志行
        self.__print_log_lines = None

        # 用于观测云的额外信息
        self.extra_for_guance = FuncExtraForGuanceHelper(self)

        log_attrs = [
            'func_id',
            'script_id',
            'func_name',
            'script_set_id',
            'script_name',
            'origin',
            'origin_id',
            'root_task_id',
            'call_chain',
            'cache_result',
            'cache_result_key',
        ]
        self.logger.debug(f"[INIT FUNC TASK] {', '.join([f'{a}: `{getattr(self, a)}`' for a in log_attrs])}")

    @property
    def api_funcs(self):
        if not self.script_scope:
            return []

        return self.script_scope['DFF'].api_funcs or []

    def __make_print_log_lines(self):
        lines = self.script_scope['DFF'].print_log_lines or []

        mask_strings = []

        env_helper = self.script_scope['DFF'].inject_funcs.get('ENV')
        if env_helper:
            all_envs = env_helper._FuncEnvVariableHelper__loaded_env_variable_cache.get_all()
            mask_strings = [ env['valueTEXT'] for env in all_envs if env['autoTypeCasting'] == 'password' ]
            mask_strings.sort(key=len, reverse=True)

        formated_lines = []
        for l in lines:
            if mask_strings:
                for ms in mask_strings:
                    l['message'] = l['message'].replace(ms, '*****')

            formated_lines.append(f"[{l['time']}] [+{l['delta']}ms] [{l['total']}ms] {l['message']}")

        self.__print_log_lines = formated_lines

    @property
    def print_log_lines(self):
        if not self.script_scope:
            return []

        if not self.__print_log_lines:
            self.__make_print_log_lines()

        return self.__print_log_lines

    def _get_func_defination(self, F):
        f_co   = six.get_function_code(F)
        f_name = f_co.co_name
        if f_name:
            f_name = f_name.strip()

        f_doc  = F.__doc__
        if f_doc:
            f_doc = inspect.cleandoc(f_doc)

        f_sig = funcsigs.signature(F)
        f_def = f'{f_name}{f_sig}'.strip()

        f_argspec = None
        f_args    = None
        f_kwargs  = {}
        if six.PY3:
            f_argspec = inspect.getfullargspec(F)
        else:
            f_argspec = inspect.getargspec(F)

        f_args = f_argspec.args
        if f_argspec.varargs:
            f_args.append(f'*{f_argspec.varargs}')
        if f_argspec.varkw:
            f_args.append(f'**{f_argspec.varkw}')

        for arg_name, args_info in f_sig.parameters.items():
            if str(args_info.kind) == 'VAR_POSITIONAL':
                f_kwargs[f'*{arg_name}'] = {}

            elif str(args_info.kind) == 'VAR_KEYWORD':
                f_kwargs[f'**{arg_name}'] = {}

            elif str(args_info.kind) == 'POSITIONAL_OR_KEYWORD':
                f_kwargs[arg_name] = {}

                if args_info.default is not funcsigs._empty:
                    arg_default = '<Complex Object>'
                    try:
                        arg_default = toolkit.json_copy(args_info.default)
                    except Exception as e:
                        pass
                    finally:
                        f_kwargs[arg_name]['default'] = arg_default

        return (f_name, f_def, f_args, f_kwargs, f_doc)

    def _resolve_fromlist(self, module, fromlist, globals):
        if not all([module, fromlist, globals]):
            return

        for import_name in fromlist:
            o = module.__dict__.get(import_name)
            if o:
                globals[import_name] = o
            else:
                e = Exception(f'CustomImport: Cannot import name `{import_name}`')
                raise e

    def _custom_import(self, name, globals=None, locals=None, fromlist=None, level=0, parent_scope=None):
        '''
        导入用户脚本处理完全依赖 `scriptset__script` 的命名方式
        一般第三方包
        '''
        entry_script_id = globals.get('__name__')

        import_script_id = name
        import_script    = None

        # 只有用户脚本支持相对路径引入用户脚本
        # 支持使用"__scriptname"代替"scriptsetname__scriptname"导入
        if name.startswith('__') and name not in USER_SCRIPT_ID_BLACK_LIST:
            import_script_id = entry_script_id.split('__')[0] + name

        # 执行导入
        import_script = self.load_script(import_script_id)
        if import_script:
            # 用户脚本导入
            _module = self.__imported_module_cache[import_script_id]
            if _module:
                # self.logger.debug(f'[CUSTOM IMPORT] user script `{import_script_id}` already imported')
                pass

            else:
                # self.logger.debug(f'[CUSTOM IMPORT] import user script `{import_script_id}`')

                try:
                    _module = ModuleType(import_script_id)
                    _module.__dict__.clear()

                    module_scope = self.create_safe_scope(import_script_id)
                    if parent_scope:
                        module_scope['DFF'].print_log_lines = parent_scope['DFF'].print_log_lines

                        for k, v in parent_scope.items():
                            if k.startswith('_DFF_'):
                                module_scope[k] = v

                    _module.__dict__.update(module_scope)

                    script_code_obj = import_script['codeObj']
                    exec(script_code_obj, _module.__dict__)

                    self.__imported_module_cache[import_script_id] = _module

                except Exception as e:
                    raise

            # 模块本身不需要直接加入上下文
            self._resolve_fromlist(_module, fromlist, globals)

            return _module

        else:
            # 普通导入
            # self.logger.debug(f'[CUSTOM IMPORT] import non-user module `{import_script_id}`')

            return importlib.__import__(name, globals=globals, locals=locals, fromlist=fromlist, level=level)

    def _export_as_api(self, safe_scope, title,
                    # 控制类参数
                    fixed_cron_expr=None, delayed_cron_job=None, timeout=None, api_timeout=None, expires=None, cache_result=None, queue=None,
                    # 标记类参数
                    category=None, tags=None,
                    # 集成处理参数
                    integration=None, integration_config=None,
                    # 文档控制类参数
                    is_hidden=False,
                    # 兼容处理
                    fixed_crontab=None, delayed_crontab=None):
        # 兼容处理
        fixed_cron_expr  = fixed_cron_expr  or fixed_crontab
        delayed_cron_job = delayed_cron_job or delayed_crontab

        ### 参数检查/预处理 ###
        extra_config = {}

        # 函数标题
        if title is not None and not isinstance(title, (six.string_types, six.text_type)):
            e = InvalidAPIOption('`title` should be a string or unicode')
            raise e

        ##############
        # 控制类参数 #
        ##############

        # 固定 Cron 表达式
        # 兼容处理
        if fixed_crontab is not None:
            if not toolkit.is_valid_cron_expr(fixed_crontab):
                e = InvalidAPIOption('`fixed_crontab` is not a valid cron expression')
                raise e

            if len(fixed_crontab.split(' ')) > 5:
                e = InvalidAPIOption('`fixed_crontab` does not support second part')
                raise e

        if fixed_cron_expr is not None:
            if not toolkit.is_valid_cron_expr(fixed_cron_expr):
                e = InvalidAPIOption('`fixed_cron_expr` is not a valid cron expression')
                raise e

            if len(fixed_cron_expr.split(' ')) > 5:
                e = InvalidAPIOption('`fixed_cron_expr` does not support second part')
                raise e

            extra_config['fixedCronExpr'] = fixed_cron_expr

        # 延迟 Cron 任务（单位秒，可多个）
        # 兼容处理
        if delayed_crontab is not None:
            delayed_crontab = toolkit.as_array(delayed_crontab)

            for d in delayed_crontab:
                if not isinstance(d, int):
                    e = InvalidAPIOption('All elements of `delayed_crontab` should be int')
                    raise e

        if delayed_cron_job is not None:
            delayed_cron_job = toolkit.as_array(delayed_cron_job)
            delayed_cron_job = list(set(delayed_cron_job))
            delayed_cron_job.sort()

            for d in delayed_cron_job:
                if not isinstance(d, int):
                    e = InvalidAPIOption('All elements of `delayed_cron_job` should be int')
                    raise e

            extra_config['delayedCronJob'] = delayed_cron_job

        # 执行时限
        timeout = timeout or api_timeout # 兼容 api_timeout
        if timeout is not None:
            if not isinstance(timeout, six.integer_types):
                e = InvalidAPIOption('`timeout` should be an integer or long')
                raise e

            _min_timeout = CONFIG['_FUNC_TASK_TIMEOUT_MIN']
            _max_timeout = CONFIG['_FUNC_TASK_TIMEOUT_MAX']
            if not (_min_timeout <= timeout <= _max_timeout):
                e = InvalidAPIOption(f'`timeout` should be between `{_min_timeout}` and `{_max_timeout}` (seconds)')
                raise e

            extra_config['timeout'] = timeout

        # 任务过期
        if expires is not None:
            if not isinstance(expires, six.integer_types):
                e = InvalidAPIOption('`expires` should be an integer or long')
                raise e

            _min_expires = CONFIG['_FUNC_TASK_EXPIRES_MIN']
            _max_expires = CONFIG['_FUNC_TASK_EXPIRES_MAX']
            if not (_min_expires <= expires <= _max_expires):
                e = InvalidAPIOption(f'`expires` should be between `{_min_expires}` and `{_max_expires}` (seconds)')
                raise e

            extra_config['expires'] = expires

        # 结果缓存
        if cache_result is not None:
            if not isinstance(cache_result, (int, float)):
                e = InvalidAPIOption('`cache_result` should be an int or a float')
                raise e

            extra_config['cacheResult'] = cache_result

        # 指定队列
        if queue is not None:
            if queue == 0:
                e = InvalidAPIOption("`queue` can't be 0 because the #0 queue is a system queue")
                raise e

            available_queues = list(range(CONFIG['_WORKER_QUEUE_COUNT']))
            if queue not in available_queues:
                e = InvalidAPIOption(f'`queue` should be one of {toolkit.json_dumps(available_queues)}')
                raise e

            extra_config['queue'] = queue

        ##############
        # 标记类参数 #
        ##############

        # 函数分类
        if category is not None and not isinstance(category, (six.string_types, six.text_type)):
            e = InvalidAPIOption('`category` should be a string or unicode')
            raise e

        if category is None:
            category = 'general'

        # 函数标签
        if tags is not None:
            if not isinstance(tags, (tuple, list)):
                e = InvalidAPIOption('`tags` should be a tuple or a list')
                raise e

            for tag in tags:
                if not isinstance(tag, (six.string_types, six.text_type)):
                    e = InvalidAPIOption('Element of `tags` should be a string or unicode')
                    raise e

            tags = list(set(tags))
            tags.sort()

        ################
        # 集成处理参数 #
        ################

        # 功能集成
        if integration is not None:
            if not isinstance(integration, (six.string_types, six.text_type)):
                e = InvalidAPIOption('`integration` should be a string or unicode')
                raise e

            integration_lower = integration.lower()
            if integration_lower not in FIX_INTEGRATION_KEY_MAP:
                e = InvalidAPIOption(f'Unsupported `integration` value: {integration}')
                raise e

            integration = FIX_INTEGRATION_KEY_MAP[integration_lower]

        # 功能集成配置
        if integration is not None:
            fixed_integration_config = {}

            integration_config = integration_config or {}
            for k, v in integration_config.items():
                k_lower = k.lower()
                if k_lower not in FIX_INTEGRATION_CONFIG_KEY_MAP:
                    e = InvalidAPIOption(f'Unsupported `integration_config` name: {k}')
                    raise e

                fixed_k = FIX_INTEGRATION_CONFIG_KEY_MAP[k_lower]
                fixed_integration_config[fixed_k] = v

            extra_config['integrationConfig'] = fixed_integration_config

        ##################
        # 文档控制类参数 #
        ##################

        # 隐藏函数（不在文档中出现）
        if is_hidden is True:
            extra_config['isHidden'] = True

        # 装饰器函数
        def decorater(F):
            f_name, f_def, f_args, f_kwargs, f_doc = self._get_func_defination(F)

            # 记录至已导出函数列表
            if f_name in safe_scope['DFF'].api_func_set:
                e = DuplicatedFuncName(f'Two or more functions named `{f_name}`')
                raise e

            safe_scope['DFF'].api_func_set.add(f_name)
            safe_scope['DFF'].api_funcs.append({
                'name'       : f_name,
                'title'      : title,
                'description': f_doc,
                'definition' : f_def,
                'extraConfig': extra_config,
                'category'   : category,
                'tags'       : tags,
                'args'       : f_args,
                'kwargs'     : f_kwargs,
                'integration': integration,
                'defOrder'   : len(safe_scope['DFF'].api_funcs),
            })

            @functools.wraps(F)
            def dff_api_F(*args, **kwargs):
                return F(*args, **kwargs)

            # 相关配置记录至函数对象
            for _f in (F, dff_api_F):
                _f.__setattr__('_DFF_FUNC_ID'         , f'{_f.__module__}.{f_name}')
                _f.__setattr__('_DFF_FUNC_NAME'       , f_name)
                _f.__setattr__('_DFF_FUNC_TITLE'      , title)
                _f.__setattr__('_DFF_FUNC_DESCRIPTION', f_doc)
                _f.__setattr__('_DFF_FUNC_DEFINITION' , f_def)
                _f.__setattr__('_DFF_FUNC_CATEGORY'   , category)
                _f.__setattr__('_DFF_FUNC_TAGS'       , tags)
                _f.__setattr__('_DFF_FUNC_ARGS'       , f_args)
                _f.__setattr__('_DFF_FUNC_KWARGS'     , f_kwargs)

            return dff_api_F
        return decorater

    def _log(self, safe_scope, message):
        now = time.time()

        # 输出当前时间
        message_time = arrow.get(now).to(CONFIG['TIMEZONE']).format('MM-DD HH:mm:ss')

        # 计算时间差 / 累计耗时
        if not self.__prev_log_time:
            self.__prev_log_time = self.start_time

        delta = int((now - self.__prev_log_time) * 1000)
        total = int((now - self.start_time) * 1000)

        self.__prev_log_time = now

        safe_scope['DFF'].print_log_lines.append({
            'time'   : message_time,
            'delta'  : delta,
            'total'  : total,
            'message': message,
        })

    def _print(self, safe_scope, *args, **kwargs):
        try:
            value_list = []
            for arg in args:
                value_list.append(f'{arg}')

            sep = kwargs.get('sep') or ' '
            message = sep.join(value_list)

            self._log(safe_scope, message)

        except Exception as e:
            for line in traceback.format_exc().splitlines():
                self.logger.error(line)

    def _call_func(self, safe_scope, func_id, kwargs=None, save_result=False):
        call_chain = safe_scope.get('_DFF_FUNC_CHAIN') or []
        call_chain_info = ' -> '.join(map(lambda x: f'`{x}`', call_chain))

        # 检查函数链长度
        if len(call_chain) >= CONFIG['_FUNC_TASK_CALL_CHAIN_LIMIT']:
            e = FuncCallChainTooLong(call_chain_info)
            raise e

        # 检查重复调用
        if func_id in call_chain:
            e = FuncCircularCall(f'{call_chain_info} -> [{func_id}]')
            raise e

        # 检查并获取函数信息
        sql = '''
            SELECT
                 *

                ,`sset`.`title` AS `scriptSetTitle`
                ,`scpt`.`title` AS `scriptTitle`
                ,`func`.`title` AS `funcTitle`

            FROM `biz_main_func` AS `func`

            JOIN `biz_main_script` AS `scpt`
                ON `scpt`.`id` = `func`.`scriptId`

            JOIN `biz_main_script_set` AS `sset`
                ON `sset`.`id` = `func`.`scriptSetId`

            WHERE
                `func`.`id` = ?

            LIMIT 1
            '''
        sql_params = [func_id]
        db_res = self.db.query(sql, sql_params)
        if len(db_res) <= 0:
            e = EntityNotFound(f'Function not found: `{func_id}`')
            raise e

        func = db_res[0]
        func_extra_config = func.get('extraConfigJSON') or {}
        if isinstance(func_extra_config, str):
            func_extra_config = toolkit.json_loads(func_extra_config) or {}

        timeout = CONFIG['_FUNC_TASK_TIMEOUT_DEFAULT']
        if func_extra_config.get('timeout'):
            timeout = func_extra_config['timeout']

        expires = CONFIG['_FUNC_TASK_EXPIRES_DEFAULT']
        if func_extra_config.get('expires'):
            expires = func_extra_config['expires']

        # 任务请求
        task_req = {
            'name': 'Func.Runner',
            'kwargs': {
                'rootTaskId'    : self.task_id,
                'funcId'        : func_id,
                'funcCallKwargs': kwargs,
                'origin'        : safe_scope.get('_DFF_ORIGIN'),
                'originId'      : safe_scope.get('_DFF_ORIGIN_ID'),
                'cronExpr'      : safe_scope.get('_DFF_CRON_EXPR'),
                'callChain'     : call_chain,

                'scriptSetTitle': func.get('scriptSetTitle'),
                'scriptTitle'   : func.get('scriptTitle'),
                'funcTitle'     : func.get('funcTitle'),
            },
            'triggerTime'    : safe_scope.get('_DFF_TRIGGER_TIME'),
            'queue'          : safe_scope.get('_DFF_QUEUE'),
            'timeout'        : timeout,
            'expires'        : expires,
            'taskRecordLimit': self.task_record_limit,
        }
        self.cache_db.put_tasks(task_req)

    def run(self, **kwargs):
        self.logger.info(f'[RUN] Func ID: `{self.func_id}`')

    def load_script(self, script_id, draft=False):
        '''
        加载脚本
        1. 草稿脚本始终直接从数据库中读取
        2. 正式脚本检查本地缓存（60秒强制失效）的 MD5 与 Redis 缓存的 MD5 是否一致
            a. 一致则直接使用本地缓存
            b. 不一致则从数据库中读取脚本，并更新 Redis 缓存的 MD5
        '''
        # 只有导入名称中包含`__`的才有可能是用户脚本
        if '__' not in script_id:
            return None

        script = self.__loaded_script_cache[script_id]
        if script:
            return script

        global SCRIPT_LOCAL_CACHE

        remote_md5_cache_key = toolkit.get_cache_key('cache', 'dataMD5Cache', ['dataType', 'script'])
        remote_md5           = None

        if not draft:
            script = SCRIPT_LOCAL_CACHE[script_id]
            if script:
                # 检查 Redis 缓存的脚本 MD5
                remote_md5 = self.cache_db.hget(remote_md5_cache_key, script_id)
                if remote_md5:
                    remote_md5 = six.ensure_str(remote_md5)

                # MD5 未变化时，延长本地缓存，并返回缓存值
                if script['codeMD5'] == remote_md5:
                    self.logger.debug(f'[LOAD SCRIPT] loaded `{script_id}` from Cache')

                    # 延长本地缓存
                    SCRIPT_LOCAL_CACHE.refresh(script_id)

                    # 缓存脚本
                    self.__loaded_script_cache[script_id] = script
                    return script

        code_field     = '`scpt`.`code`'
        code_md5_field = '`scpt`.`codeMD5`'
        if draft == True:
            code_field     = '`scpt`.`codeDraft`'
            code_md5_field = '`scpt`.`codeDraftMD5`'

        sql = '''
            SELECT
                 `scpt`.`seq`
                ,`scpt`.`id`
                ,`scpt`.`publishVersion`
                ,IFNULL(??, '') AS `code`
                ,IFNULL(??, '') AS `codeMD5`

                ,`sset`.`id` AS `scriptSetId`

            FROM biz_main_script_set AS sset

            JOIN biz_main_script AS scpt
                ON `sset`.`id` = `scpt`.`scriptSetId`

            WHERE
                `scpt`.`id` = ?

            ORDER BY
                `scpt`.`seq` ASC
            '''
        sql_params = [ code_field, code_md5_field, script_id ]
        script = self.db.query(sql, sql_params)
        if not script:
            self.logger.debug(f"[LOAD SCRIPT] `{script_id}` not found")
            return None

        script = script[0]

        # 从 DB 获取脚本
        self.logger.debug(f"[LOAD SCRIPT] loaded `{script_id}`{ ' (DRAFT)' if draft else '' } from DB")

        # 获取函数额外配置
        sql = '''
            SELECT
                 `func`.`id`
                ,`func`.`scriptId`
                ,`func`.`extraConfigJSON`
            FROM biz_main_func AS func
            WHERE
                `func`.`scriptId` = ?
            '''
        sql_params = [ script_id ]
        funcs = self.db.query(sql, sql_params)

        self.logger.debug(f"[LOAD FUNC EXTRA CONFIG] loaded `{script_id}`{ ' (DRAFT)' if draft else '' } from DB")

        # 编译脚本
        script_code = script.get('code') or ''
        script_code_obj = compile(script_code, script_id, 'exec')
        script['codeObj'] = script_code_obj

        # 函数配置表
        script['funcExtraConfig'] = {}
        for f in funcs:
            func_id           = f['id']
            func_extra_config = f['extraConfigJSON']
            if isinstance(func_extra_config, (six.string_types, six.text_type)):
                func_extra_config = toolkit.json_loads(func_extra_config)

            script['funcExtraConfig'][func_id] = func_extra_config

        # 仅缓存正式脚本
        if not draft:
            # 缓存脚本 MD5
            self.cache_db.hset(remote_md5_cache_key, script_id, script['codeMD5'])
            SCRIPT_LOCAL_CACHE[script_id] = script

        # 缓存脚本
        self.__loaded_script_cache[script_id] = script

        return script

    def create_safe_scope(self, script_name=None, debug=False):
        '''
        创建安全脚本作用域
        '''
        safe_scope = {
            '__name__' : script_name or '<script>',
            '__file__' : script_name or '<script>',

            # DataFlux Func 内置变量
            '_DFF_DEBUG'            : debug,
            '_DFF_TASK_ID'          : self.task_id,
            '_DFF_ROOT_TASK_ID'     : self.root_task_id,
            '_DFF_SCRIPT_SET_ID'    : self.script_set_id,
            '_DFF_SCRIPT_ID'        : self.script_id,
            '_DFF_FUNC_ID'          : self.func_id,
            '_DFF_FUNC_NAME'        : self.func_name,
            '_DFF_FUNC_CHAIN'       : self.call_chain,
            '_DFF_ORIGIN'           : self.origin,
            '_DFF_ORIGIN_ID'        : self.origin_id,
            '_DFF_TRIGGER_TIME'     : int(self.trigger_time),
            '_DFF_TRIGGER_TIME_MS'  : int(self.trigger_time_ms),
            '_DFF_START_TIME'       : int(self.start_time),
            '_DFF_START_TIME_MS'    : int(self.start_time_ms),
            '_DFF_ETA'              : self.eta,
            '_DFF_DELAY'            : self.delay,
            '_DFF_CRON_EXPR'        : self.kwargs.get('cronExpr'),
            '_DFF_CRON_JOB_DELAY'    : self.kwargs.get('cronJobDelay') or 0,
            '_DFF_CRON_JOB_EXEC_MODE': self.kwargs.get('cronJobExecMode'),
            '_DFF_QUEUE'            : self.queue,
            '_DFF_HTTP_REQUEST'     : self.http_request,

            # 兼容处理
            '_DFF_CRONTAB'          : self.kwargs.get('cronExpr'),
            '_DFF_CRONTAB_DELAY'    : self.kwargs.get('cronJobDelay') or 0,
            '_DFF_CRONTAB_EXEC_MODE': self.kwargs.get('cronJobExecMode'),
        }

        # 添加 DataFlux Func 内置方法/对象
        __connector_helper    = FuncConnectorHelper(self)
        __env_variable_helper = FuncEnvVariableHelper(self)
        __store_helper        = FuncStoreHelper(self, default_scope = script_name)
        __cache_helper        = FuncCacheHelper(self, default_scope = script_name)
        __config_helper       = FuncConfigHelper(self)
        __thread_helper       = FuncThreadHelper(self)
        __sync_api_helper     = FuncSyncAPIHelper(self)
        __async_api_helper    = FuncAsyncAPIHelper(self)
        __cron_job_helper     = FuncCronJobHelper(self)

        def __print(*args, **kwargs):
            return self._print(safe_scope, *args, **kwargs)

        def __print_var(*args, **kwargs):
            for v in args:
                __print(f"[VAR] type=`{type(v)}`, value=`{str(v)}`, obj_size=`{toolkit.get_obj_size(v)}`")

            for name, v in kwargs.items():
                __print(f"[VAR] {name}: type=`{type(v)}`, value=`{str(v)}`, obj_size=`{toolkit.get_obj_size(v)}`")

        def __eval(*args, **kwargs):
            return eval(*args, **kwargs)

        def __exec(*args, **kwargs):
            return exec(*args, **kwargs)

        def __export_as_api(title=None, **extra_config):
            return self._export_as_api(safe_scope, title, **extra_config)

        def __call_func(func_id, kwargs=None):
            return self._call_func(safe_scope, func_id, kwargs)

        def __call_blueprint(blueprint_id, kwargs=None):
            return self._call_func(safe_scope, f'_bp_{blueprint_id}__main.run', kwargs)

        def __custom_import(name, globals=None, locals=None, fromlist=None, level=0):
            return self._custom_import(name, globals, locals, fromlist, level, safe_scope)

        inject_funcs = {
            'LOG': __print,     # 输出日志
            'VAR': __print_var, # 输出变量

            'EVAL': __eval, # 执行Python表达式
            'EXEC': __exec, # 执行Python代码

            'API'   : __export_as_api,       # 导出为API
            'CONN'  : __connector_helper,    # 连接器处理模块
            'SRC'   : __connector_helper,    # 连接器处理模块（兼容旧版）
            'ENV'   : __env_variable_helper, # 环境变量处理模块
            'CTX'   : self.__context_helper, # 上下文处理模块
            'STORE' : __store_helper,        # 存储处理模块
            'CACHE' : __cache_helper,        # 缓存处理模块
            'CONFIG': __config_helper,       # 配置处理模块

            'SQL' : format_sql,        # 格式化SQL语句
            'RSRC': get_resource_path, # 获取资源路径
            'SIGN': get_sign,          # 数据签名

            'RESP'           : FuncResponse,          # 函数响应体
            'RESP_FILE'      : FuncResponseFile,      # 函数响应体（返回文件）
            'RESP_LARGE_DATA': FuncResponseLargeData, # 函数响应题（大量数据）
            'REDIRECT'       : FuncRedirect,          # 重定向响应体

            'FUNC'     : __call_func,      # 调用函数（产生新 Task）
            'BLUEPRINT': __call_blueprint, # 调用蓝图（产生新 Task）
            'THREAD'   : __thread_helper,  # 多线程处理模块（不产生新 Task）

            'TASK'        : self,          # 当前任务
            'SYS_DB'      : self.db,       # 当前 DataFlux Func 数据库
            'SYS_CACHE_DB': self.cache_db, # 当前 DataFlux Func 缓存

            'SYNC_API' : __sync_api_helper,  # 同步 API 处理模块
            'ASYNC_API': __async_api_helper, # 异步 API 处理模块
            'CRON_JOB' : __cron_job_helper,  # 定时任务处理模块

            # 直接连接器
            'GUANCE_OPENAPI': GuanceOpenAPI,
            'DATAKIT'       : DataKit,
            'DATAWAY'       : DataWay,

            # 方便函数
            'TOOLKIT': ToolkitWrap,

            # 用于观测云的额外信息
            'EXTRA_FOR_GUANCE': self.extra_for_guance,

            # 兼容处理
            'AUTH_LINK'     : __sync_api_helper,  # 授权链接处理模块
            'BATCH'         : __async_api_helper, # 批处理处理模块
            'CRONTAB_CONFIG': __cron_job_helper,  # 自动触发处理模块
        }
        safe_scope['DFF'] = DFFWraper(inject_funcs=inject_funcs)

        # 注入内置对象 / 函数
        safe_scope['__builtins__'] = {}
        for name in dir(six.moves.builtins):
            # 跳过：
            # 内置 import 函数，后续替换为 custom_import 函数
            # BaseException 类，避免用户代码越过系统限制
            if name in ('import', 'BaseException'):
                continue

            safe_scope['__builtins__'][name] = six.moves.builtins.__getattribute__(name)

        # 替换内置对象 / 函数
        safe_scope['__builtins__']['__import__'] = __custom_import
        safe_scope['__builtins__']['print']      = __print
        safe_scope['__builtins__']['print_var']  = __print_var

        # self.logger.debug('[SAFE SCOPE] Created')

        return safe_scope

    def safe_exec(self, script_code_obj, globals=None, locals=None):
        safe_scope = globals or self.create_safe_scope()
        exec(script_code_obj, safe_scope)

        # self.logger.debug('[SAFE EXEC] Finished')

        return safe_scope

    def apply(self, use_code_draft=False):
        self.logger.debug(f"[APPLY SCRIPT] `{self.script_id}`{ ' (DRAFT)' if use_code_draft else '' }")

        # 目标脚本
        self.script = self.load_script(self.script_id, draft=use_code_draft)
        if not self.script:
            e = EntityNotFound(f'Script not found: `{self.script_id}`')
            raise e

        # 执行脚本
        debug = use_code_draft
        _safe_scope = self.create_safe_scope(self.script_id, debug=debug)
        self.script_scope = self.safe_exec(self.script['codeObj'], globals=_safe_scope)

        # 执行函数
        func_return = None
        if self.func_name:
            entry_func = self.script_scope.get(self.func_name)
            if not entry_func:
                e = EntityNotFound(f'Function not found: `{self.script_id}.{self.func_name}`')
                raise e

            # 执行函数
            self.logger.info(f'[CALL ENTRY FUNC] `{self.func_id}`')
            func_return = entry_func(**self.func_call_kwargs)

            if not isinstance(func_return, BaseFuncResponse):
                func_return = FuncResponse(func_return)

            if isinstance(func_return.data, Exception):
                raise func_return.data

        # self.logger.debug(f'[FUNC RETURN] `{func_return}`')
        return func_return

    def get_traceback(self, only_in_script=True):
        try:
            exc_type, exc_obj, tb = sys.exc_info()

            header         = 'Traceback (most recent call last *in User Script*):'
            exception_info = ''.join(traceback.format_exception_only(exc_type, exc_obj)).strip()
            stack = []

            # 搜集堆栈
            while tb is not None:
                frame  = tb.tb_frame
                line_number = tb.tb_lineno

                filename = frame.f_code.co_filename
                funcname = frame.f_code.co_name

                is_in_script = not filename.endswith('.py') and '__' in filename

                line_code = ''
                if is_in_script:
                    # 脚本内从缓存中获取
                    script_code = (self.load_script(filename) or {}).get('code')
                    script_code_lines = []

                    if script_code:
                        script_code_lines = script_code.splitlines()

                    if script_code_lines and len(script_code_lines) >= line_number:
                        line_code = script_code_lines[line_number - 1]

                else:
                    # 非脚本内直接获取
                    linecache.checkcache(filename)
                    line_code = linecache.getline(filename, line_number, frame.f_globals)

                if line_code:
                    line_code = line_code.strip()

                compacted_filename = filename.replace(os.getcwd(), f'<{CONFIG["APP_NAME"]}>')
                formatted_location = f'File "{compacted_filename}", line {line_number}, in {funcname}'

                stack_item = {
                    'filename'         : filename,
                    'funcname'         : funcname,
                    'lineNumber'       : line_number,
                    'lineCode'         : line_code,
                    'formattedLocation': formatted_location,
                    'isInScript'       : is_in_script,
                }
                stack.append(stack_item)

                tb = tb.tb_next

            # 格式化输出
            lines = []
            lines.append(header)

            for s in stack:
                if only_in_script and not s['isInScript']:
                    continue

                lines.append('  ' + s['formattedLocation'])
                lines.append('    ' + s['lineCode'].strip())

            lines.append(exception_info)

            return '\n'.join(lines)

        except Exception as e:
            for line in traceback.format_exc().splitlines():
                self.logger.error(line)

        finally:
            exc_type = exc_obj = tb = None

    def clean_up(self):
        global FUNC_THREAD_POOL
        global FUNC_THREAD_POOL_SIZE
        global FUNC_THREAD_RESULT_MAP

        if FUNC_THREAD_POOL:
            FUNC_THREAD_POOL.shutdown(wait=True)
            self.logger.debug(f"[THREAD POOL] Pool Shutdown")

        FUNC_THREAD_POOL       = None
        FUNC_THREAD_POOL_SIZE  = None
        FUNC_THREAD_RESULT_MAP = {}

    def buff_task_record(self, *args, **kwargs):
        # 函数任务不进行一般任务记录
        pass
