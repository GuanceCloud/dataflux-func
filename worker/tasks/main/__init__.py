# -*- coding: utf-8 -*-

# Builtin Modules
import os
import sys
import inspect
import traceback
import linecache
from types import ModuleType
import time
import uuid
import pprint
import importlib
import functools
from concurrent.futures import ThreadPoolExecutor
from collections import OrderedDict

# 3rd-party Modules
import six
import arrow
import requests
from croniter import croniter
import funcsigs

# Project Modules
from worker import app
from worker.tasks import BaseTask, BaseResultSavingTask, gen_task_id
from worker.utils import yaml_resources, toolkit
from worker.utils.extra_helpers import DataWayHelper, DataKitHelper, SidecarHelper
from worker.utils.extra_helpers import InfluxDBHelper, MySQLHelper, RedisHelper, MemcachedHelper, ClickHouseHelper
from worker.utils.extra_helpers import PostgreSQLHelper, MongoDBHelper, ElasticSearchHelper, NSQLookupHelper, MQTTHelper, SQLServerHelper, OracleDatabaseHelper
from worker.utils.extra_helpers import format_sql_v2 as format_sql

CONFIG = yaml_resources.get('CONFIG')
ROUTE  = yaml_resources.get('ROUTE')

# 集成处理
FIX_INTEGRATION_KEY_MAP = {
    # 额外用于登录DataFlux Func平台的函数
    # 集成为`POST /api/v1/func/integration/sign-in`
    # 集成为DataFlux Func登录界面
    #   函数必须为`def func(username, password)`形式
    #       返回`True`表示登录成功
    #       返回`False`或`Exception('<错误信息>')`表示登录失败
    #   无配置项
    'signIn': 'signIn',
    'login' : 'signIn',

    # 自动运行函数
    # 集成为独立定时运行任务（即无需配置的自动触发配置）
    # 函数必须为`def func()`形式（即无参数形式）
    #   配置项：
    #       crontab  : Crontab语法自动运行周期
    #       onLaunch : True/False，是否启动后运行
    #       onPublish: True/False，是否发布后运行
    'autoRun': 'autoRun',
}

# 连接器对应 Helper 类
CONNECTOR_HELPER_CLASS_MAP = {
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
}

# 连接器加密字段
CONNECTOR_CIPHER_FIELDS = [
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
FUNC_THREAD_POOL = None

# 脚本本地缓存
SCRIPT_LOCAL_CACHE = toolkit.LocalCache(expires=30)
USER_SCRIPT_ID_BLACK_LIST = [
    '__future__'
]

# 环境变量本地缓存
ENV_VARIABLE_LOCAL_CACHE = toolkit.LocalCache(expires=30)

# 连接器 Helper 对象本地缓存
CONNECTOR_HELPER_LOCAL_CACHE = toolkit.LocalCache()

# 添加额外import路径
extra_import_paths = [
    CONFIG.get('RESOURCE_ROOT_PATH'),
    os.path.join(CONFIG.get('RESOURCE_ROOT_PATH'), CONFIG.get('EXTRA_PYTHON_PACKAGE_INSTALL_DIR')),
]
for p in extra_import_paths:
    os.makedirs(p, exist_ok=True)
    sys.path.append(p)

# 确保临时文件目录
download_temp_folder = os.path.join(CONFIG.get('RESOURCE_ROOT_PATH'), CONFIG.get('DOWNLOAD_TEMP_ROOT_FOLDER'))
os.makedirs(download_temp_folder, exist_ok=True)

class DataFluxFuncBaseException(Exception):
    pass
class NotFoundException(DataFluxFuncBaseException):
    pass
class FuncRecursiveCallException(DataFluxFuncBaseException):
    pass
class FuncChainTooLongException(DataFluxFuncBaseException):
    pass
class ThreadResultKeyDuplicatedException(DataFluxFuncBaseException):
    pass
class ConnectorNotSupportException(DataFluxFuncBaseException):
    pass
class InvalidConnectorOptionException(DataFluxFuncBaseException):
    pass
class InvalidAPIOptionException(DataFluxFuncBaseException):
    pass
class ConfigUnaccessableException(DataFluxFuncBaseException):
    pass

class DFFWraper(object):
    def __init__(self, inject_funcs=None):
        self.exported_api_funcs = []
        self.log_messages       = []

        self.inject_funcs = inject_funcs

        # 增加小写别名
        for func_name in list(self.inject_funcs.keys()):
            func_name_lower = func_name.lower()
            self.inject_funcs[func_name_lower] = self.inject_funcs[func_name]

    def __getattr__(self, name):
        if not self.inject_funcs:
            return None

        else:
            return self.inject_funcs.get(name)

def gen_script_failure_id():
    '''
    生成脚本故障ID
    '''
    return toolkit.gen_data_id('sfal')

def gen_script_log_id():
    '''
    生成脚本日志ID
    '''
    return toolkit.gen_data_id('slog')

def gen_connector_id():
    '''
    生成连接器ID
    '''
    return toolkit.gen_data_id('cnct')

def compute_func_store_id(key, scope):
    '''
    计算函数存储ID
    '''
    str_to_md5 = '-'.join([key, scope])

    store_id = 'fnst-' + toolkit.get_md5(str_to_md5)
    return store_id

def decipher_connector_config_fields(config):
    '''
    解密字段
    '''
    config = toolkit.json_copy(config)

    for f in CONNECTOR_CIPHER_FIELDS:
        f_cipher = '{}Cipher'.format(f)

        if config.get(f_cipher):
            try:
                config[f] = toolkit.decipher_by_aes(config[f_cipher], CONFIG['SECRET'])
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

class FuncThreadHelper(object):
    def __init__(self, task):
        self.__task = task
        self.result_map = {}

    def start(self, fn, args=None, kwargs=None, key=None):
        global FUNC_THREAD_POOL

        if not FUNC_THREAD_POOL:
            self.__task.logger.debug('[THREAD POOL] Create Pool')

            pool_size = CONFIG['_FUNC_TASK_THREAD_POOL_SIZE']
            FUNC_THREAD_POOL = ThreadPoolExecutor(pool_size)

        key = key or toolkit.gen_data_id('async')
        self.__task.logger.debug('[THREAD POOL] Submit Key=`{0}`'.format(key))

        if key in self.result_map:
            e = ThreadResultKeyDuplicatedException('Thread result key already existed: `{0}`'.format(key))
            raise e

        args   = args   or []
        kwargs = kwargs or {}
        self.result_map[key] = FUNC_THREAD_POOL.submit(fn, *args, **kwargs)

    def get_result(self, wait=True, key=None):
        global FUNC_THREAD_POOL

        if not self.result_map:
            return None

        if wait is None:
            wait = True

        collected_res = {}

        keys = key or list(self.result_map.keys())
        for k in toolkit.as_array(keys):
            collected_res[k] = None

            future_res = self.result_map.get(k)
            if future_res is None:
                continue

            if not future_res.done() and not wait:
                continue

            retval = None
            error  = None
            try:
                retval = future_res.result()
            except Exception as e:
                error = e
            finally:
                collected_res[k] = (retval, error)

        if key:
            return collected_res.get(key)
        else:
            return collected_res

class FuncContextHelper(object):
    def __init__(self, task):
        self.__task = task

        self.__data = {}

    def __call__(self, *args, **kwargs):
        return self.get(*args, **kwargs)

    def has(self, key):
        return key in self.__data

    def get(self, key):
        return self.__data.get(key)

    def get_all(self):
        return self.__data

    def set(self, key, value):
        self.__data[key] = value

    def delete(self, key):
        return self.__data.pop(key, None)

    def clear(self):
        return self.__data.clear()

class FuncStoreHelper(object):
    def __init__(self, task, default_scope):
        self.__task = task

        self.default_scope = default_scope

    def __call__(self, *args, **kwargs):
        return self.get(*args, **kwargs)

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
        store_id   = compute_func_store_id(key, scope)

        sql = '''
            SELECT
                `seq`
            FROM biz_main_func_store
            WHERE
                `id` = ?
            '''
        sql_params = [store_id]
        db_res = self.__task.db.query(sql, sql_params)

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
            self.__task.db.query(sql, sql_params)

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
            self.__task.db.query(sql, sql_params)

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
        db_res = self.__task.db.query(sql, sql_params)

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

        store_id = compute_func_store_id(key, scope)

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
        db_res = self.__task.db.query(sql, sql_params)
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

        store_id = compute_func_store_id(key, scope)

        sql = '''
            DELETE FROM biz_main_func_store
            WHERE
                `id` = ?
            '''
        sql_params = [store_id]
        self.__task.db.query(sql, sql_params)

class FuncCacheHelper(object):
    def __init__(self, task, default_scope):
        self.__task = task

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
        return self.__task.cache_db.run(cmd, key, *args, **kwargs)

    def set(self, key, value, scope=None, expire=None, not_exists=False):
        key = self._get_cache_key(key, scope)
        return self.__task.cache_db.run('set', key, value, ex=expire, nx=not_exists)

    def keys(self, pattern='*', scope=None):
        pattern = self._get_cache_key(pattern, scope)
        res = self.__task.cache_db.keys(pattern)
        res = list(map(lambda x: self._get_user_cache_key(x, scope), res))
        return res

    def get(self, key, scope=None):
        key = self._get_cache_key(key, scope)
        res = self.__task.cache_db.run('get', key)
        return self._convert_result(res)

    def getset(self, key, value, scope=None):
        key = self._get_cache_key(key, scope)
        res = self.__task.cache_db.run('getset', key, value)
        return self._convert_result(res)

    def expire(self, key, expires, scope=None):
        key = self._get_cache_key(key, scope)
        return self.__task.cache_db.run('expire', key, expires)

    def delete(self, key, scope=None):
        key = self._get_cache_key(key, scope)
        return self.__task.cache_db.run('delete', key)

    def incr(self, key, step=1, scope=None):
        key = self._get_cache_key(key, scope)
        res = self.__task.cache_db.run('incr', key, amount=step)
        return self._convert_result(res)

    def hkeys(self, key, pattern='*', scope=None):
        key = self._get_cache_key(key, scope)
        res = self.__task.cache_db.hkeys(key, pattern)
        return res

    def hget(self, key, field=None, scope=None):
        key = self._get_cache_key(key, scope)
        if field is None:
            res = self.__task.cache_db.run('hgetall', key)
            res = dict([(six.ensure_str(k), v) for k, v in res.items()])
            return res

        elif isinstance(field, (list, tuple)):
            res = self.__task.cache_db.run('hmget', key)
            res = dict(zip(field, [six.ensure_str(x) for x in res]))
            return res

        else:
            res = self.__task.cache_db.run('hget', key, field)
            return self._convert_result(res)

    def hset(self, key, field, value, scope=None, not_exists=False):
        key = self._get_cache_key(key, scope)
        if not_exists:
            return self.__task.cache_db.run('hsetnx', key, field, value)
        else:
            return self.__task.cache_db.run('hset', key, field, value)

    def hmset(self, key, obj, scope=None):
        key = self._get_cache_key(key, scope)
        return self.__task.cache_db.run('hmset', key, obj)

    def hincr(self, key, field, step=1, scope=None):
        key = self._get_cache_key(key, scope)
        return self.__task.cache_db.run('hincrby', key, field, amount=step)

    def hdel(self, key, field, scope=None):
        key = self._get_cache_key(key, scope)
        return self.__task.cache_db.run('hdel', key, field)

    def lpush(self, key, value, scope=None):
        key = self._get_cache_key(key, scope)
        return self.__task.cache_db.run('lpush', key, value)

    def rpush(self, key, value, scope=None):
        key = self._get_cache_key(key, scope)
        return self.__task.cache_db.run('rpush', key, value)

    def lpop(self, key, scope=None):
        key = self._get_cache_key(key, scope)
        res = self.__task.cache_db.run('lpop', key)
        return self._convert_result(res)

    def rpop(self, key, scope=None):
        key = self._get_cache_key(key, scope)
        res = self.__task.cache_db.run('rpop', key)
        return self._convert_result(res)

    def llen(self, key, scope=None):
        key = self._get_cache_key(key, scope)
        return self.__task.cache_db.run('llen', key)

    def lrange(self, key, start=0, stop=-1, scope=None):
        key = self._get_cache_key(key, scope)
        res = self.__task.cache_db.run('lrange', key, start, stop);
        return [self._convert_result(x) for x in res]

    def ltrim(self, key, start, stop, scope=None):
        key = self._get_cache_key(key, scope)
        return self.__task.cache_db.run('ltrim', key, start, stop);

    def rpoplpush(self, key, dest_key=None, scope=None, dest_scope=None):
        if dest_key is None:
            dest_key = key
        if dest_scope is None:
            dest_scope = scope

        key      = self._get_cache_key(key, scope)
        dest_key = self._get_cache_key(dest_key, dest_scope)
        res = self.__task.cache_db.run('rpoplpush', key, dest_key)
        return self._convert_result(res)

class FuncConnectorHelper(object):
    # 自动从路由配置中获取连接器可用的配置项目
    AVAILABLE_CONFIG_KEYS = tuple(filter(
        lambda x: not x.startswith('$'),
        toolkit.json_smart_find(ROUTE, 'configJSON').keys()))

    def __init__(self, task):
        self.__task = task

    def __call__(self, *args, **kwargs):
        return self.get(*args, **kwargs)

    def get(self, connector_id, **helper_kwargs):
        # 同一个连接器可能有不同的配置（如指定的数据库不同）
        helper_kwargs = toolkit.no_none_or_white_space(helper_kwargs)
        connector_key = f'{connector_id}~{toolkit.json_dumps(helper_kwargs, sort_keys=True)}'

        global CONNECTOR_HELPER_CLASS_MAP
        global CONNECTOR_HELPER_LOCAL_CACHE

        remote_md5_cache_key = toolkit.get_cache_key('cache', 'dataMD5Cache', ['dataType', 'connector'])
        remote_md5           = None

        connector = CONNECTOR_HELPER_LOCAL_CACHE[connector_key]
        if connector:
            # 检查 Redis 缓存的连接器 MD5
            remote_md5 = self.__task.cache_db.hget(remote_md5_cache_key, connector_id)
            if remote_md5:
                remote_md5 = six.ensure_str(remote_md5)

            # 连接器 MD5 未变化时直接返回
            if connector['configMD5'] == remote_md5:
                self.__task.logger.debug(f'[LOAD connector] load `{connector_id}` from Cache')

                return connector['helper']

        # 从 DB 获取连接器
        self.__task.logger.debug(f"[LOAD connector] load `{connector_id}` from DB")

        sql = '''
            SELECT
                `id`
                ,`type`
                ,`configJSON`
                ,MD5(IFNULL(`configJSON`, '')) AS configMD5
            FROM `biz_main_connector`
            WHERE
                `id` = ?
            '''
        sql_params = [ connector_id ]
        connector = self.__task.db.query(sql, sql_params)
        if not connector:
            e = NotFoundException(f'Connector not found: `{connector_id}`')
            raise e

        connector = connector[0]

        # 确定连接器类型
        helper_type  = connector['type']
        helper_class = CONNECTOR_HELPER_CLASS_MAP.get(helper_type)
        if not helper_class:
            e = ConnectorNotSupportException(f'Connector type not support: `{helper_type}`')
            raise e

        # 创建连接器 Helper
        config = toolkit.json_loads(connector['configJSON'])
        config = decipher_connector_config_fields(config)

        connector['helper'] = helper_class(self.__task.logger, config, pool_size=CONFIG['_FUNC_TASK_THREAD_POOL_SIZE'], **helper_kwargs)

        # 缓存连接器 MD5
        self.__task.cache_db.hset(remote_md5_cache_key, connector_id, connector['configMD5'])
        del CONNECTOR_HELPER_LOCAL_CACHE[connector_key]
        CONNECTOR_HELPER_LOCAL_CACHE[connector_key] = connector

        return connector['helper']

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
        connector = self.__task.db.query(sql, sql_params)
        if not connector:
            return

        connector = connector[0]
        self.__task.cache_db.hset(cache_key, connector_id, connector['configMD5'])

    def save(self, connector_id, connector_type, config, title=None, description=None):
        if connector_type not in CONNECTOR_HELPER_CLASS_MAP:
            e = ConnectorNotSupportException(f'Connector type `{connector_type}` not supported')
            raise e

        if not config:
            config = {}

        if not isinstance(config, dict):
            raise InvalidConnectorOptionException('Connector config should be a dict')

        for k in config.keys():
            if k not in self.AVAILABLE_CONFIG_KEYS:
                raise InvalidConnectorOptionException(f'Connector config item `{k}` not available')

        # 加密字段
        for k in CONNECTOR_CIPHER_FIELDS:
            v = config.get(k)
            if v is not None:
                config['{}Cipher'.format(k)] = toolkit.cipher_by_aes(v, CONFIG['SECRET'])
            config.pop(k, None)

        config_json = toolkit.json_dumps(config)

        sql = '''
            SELECT `id` FROM biz_main_connector WHERE `id` = ?
            '''
        sql_params = [connector_id]
        db_res = self.__task.db.query(sql, sql_params)

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
            self.__task.db.query(sql, sql_params)

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
            self.__task.db.query(sql, sql_params)

        self.reload_config_md5(connector_id)

    def delete(self, connector_id):
        sql = '''
            DELETE FROM biz_main_connector
            WHERE
                `id` = ?
            '''
        sql_params = [connector_id]
        self.__task.db.query(sql, sql_params)

        self.reload_config_md5(connector_id)

class FuncEnvVariableHelper(object):
    '''
    加载环境变量
    1. 检查本地缓存（60秒强制失效）的MD5与Redis缓存的MD5是否一致
        a. 一致则直接使用本地缓存
        b. 不一致则从数据库中读取脚本，并更新Redis缓存的MD5
    2. 单次任务中，一旦加载则保持到任务结束
    '''
    def __init__(self, task):
        self.__task = task

        self.__loaded_env_variable_cache = toolkit.LocalCache()

    def __call__(self, *args, **kwargs):
        return self.get(*args, **kwargs)

    def keys(self):
        sql = '''
            SELECT
                `id`
            FROM `biz_main_env_variable`
            '''
        db_res = self.__task.db.query(sql)

        return [ d['id'] for d in db_res]

    def get(self, env_variable_id):
        env_variable = self.__loaded_env_variable_cache[env_variable_id]
        if env_variable:
            return env_variable['castedValue']

        global ENV_VARIABLE_AUTO_TYPE_CASTING_FUNC_MAP
        global ENV_VARIABLE_LOCAL_CACHE

        remote_md5_cache_key = toolkit.get_cache_key('cache', 'dataMD5Cache', ['dataType', 'envVariable'])
        remote_md5           = None

        env_variable = ENV_VARIABLE_LOCAL_CACHE[env_variable_id]
        if env_variable:
            # 检查 Redis 缓存的环境变量 MD5
            remote_md5 = self.__task.cache_db.hget(remote_md5_cache_key, env_variable_id)
            if remote_md5:
                remote_md5 = six.ensure_str(remote_md5)

            # 环境变量 MD5 未变化时，延长本地缓存，并返回缓存值
            if env_variable['valueMD5'] == remote_md5:
                self.__task.logger.debug(f'[LOAD ENV VARIABLE] load `{env_variable_id}` from Cache')

                # 延长本地缓存
                ENV_VARIABLE_LOCAL_CACHE.refresh(env_variable_id)

                # 缓存环境变量
                self.__loaded_env_variable_cache[env_variable_id] = env_variable
                return env_variable['castedValue']

        sql = '''
            SELECT
                `id`
                ,`valueTEXT`
                ,MD5(IFNULL(`valueTEXT`, '')) AS valueMD5
                ,`autoTypeCasting`
            FROM `biz_main_env_variable`
            WHERE
                `id` = ?
            '''
        sql_params = [ env_variable_id ]
        env_variable = self.__task.db.query(sql, sql_params)
        if not env_variable:
            self.__task.logger.debug(f"[LOAD ENV VARIABLE] `{env_variable_id}` not found")
            return None

        # 从 DB 获取环境变量
        self.__task.logger.debug(f"[LOAD ENV VARIABLE] load `{env_variable_id}` from DB")

        env_variable = env_variable[0]

        # 类型转换
        auto_type_casting = env_variable['autoTypeCasting']
        if auto_type_casting in ENV_VARIABLE_AUTO_TYPE_CASTING_FUNC_MAP:
            env_variable['castedValue'] = ENV_VARIABLE_AUTO_TYPE_CASTING_FUNC_MAP[auto_type_casting](env_variable['valueTEXT'])
        else:
            env_variable['castedValue'] = env_variable['valueTEXT']

        # 缓存环境变量 MD5
        self.__task.cache_db.hset(remote_md5_cache_key, env_variable_id, env_variable['valueMD5'])
        ENV_VARIABLE_LOCAL_CACHE[env_variable_id] = env_variable

        # 缓存环境变量
        self.__loaded_env_variable_cache[env_variable_id] = env_variable

        return env_variable['castedValue']

class FuncConfigHelper(object):
    def __init__(self, task):
        self.__task = task

    def __call__(self, *args, **kwargs):
        return self.get(*args, **kwargs)

    def get(self, config_id, default=None):
        if not config_id.startswith('CUSTOM_'):
            e = ConfigUnaccessableException('Config `{}` is not accessible'.format(config_id))
            raise e

        if config_id in CONFIG:
            return CONFIG[config_id]
        else:
            return default

    def list(self):
        return [{ 'key': k, 'value': v } for k, v in CONFIG.items() if k.startswith('CUSTOM_')]

    def dict(self):
        return dict([(k, v) for k, v in CONFIG.items() if k.startswith('CUSTOM_')])

class BaseFuncResponse(object):
    def __init__(self, data=None, data_dumps=None, file_path=None, status_code=None, content_type=None, headers=None, allow_304=False, auto_delete_file=False, download_file=True):
        self.data             = data             # 返回数据
        self.data_dumps       = data_dumps       # 序列化后的数据
        self.file_path        = file_path        # 返回文件（资源目录下相对路径）
        self.status_code      = status_code      # HTTP响应码
        self.content_type     = content_type     # HTTP响应体类型
        self.headers          = headers or {}    # HTTP响应头
        self.allow_304        = allow_304        # 是否允许304缓存
        self.auto_delete_file = auto_delete_file # 是否响应后自动删除文件文件
        self.download_file    = download_file    # 是否下载文件

        # 检查待下载的文件是否存在
        if self.file_path:
            if not os.path.isfile(get_resource_path(self.file_path)):
                e = Exception('No such file in Resource folder: {}'.format(self.file_path))
                raise e

    def make_response_control(self):
        response_control = {
            'statusCode'  : self.status_code,
            'contentType' : self.content_type,
            'headers'     : self.headers,
            'allow304'    : self.allow_304,
            'downloadFile': self.download_file,
        }

        if self.file_path:
            response_control['filePath']       = self.file_path
            response_control['autoDeleteFile'] = self.auto_delete_file

        return response_control

class FuncResponse(BaseFuncResponse):
    def __init__(self, data, status_code=None, content_type=None, headers=None, allow_304=False, download=False):
        # 尝试序列化返回值
        data_dumps = None
        try:
            data_dumps = toolkit.json_dumps(data, indent=None)
        except Exception as e:
            data = Exception('Func Response cannot been serialized: {0}'.format(str(e)))

        kwargs = {
            'data'         : data,
            'data_dumps'   : data_dumps,
            'status_code'  : status_code,
            'content_type' : content_type,
            'headers'      : headers,
            'allow_304'    : allow_304,
            'download_file': download,
        }
        super(FuncResponse, self).__init__(**kwargs)

class FuncResponseFile(BaseFuncResponse):
    def __init__(self, file_path, status_code=None, headers=None, allow_304=False, auto_delete=False, download=True):
        kwargs = {
            'file_path'       : file_path,
            'status_code'     : status_code,
            'headers'         : headers,
            'allow_304'       : allow_304,
            'auto_delete_file': auto_delete,
            'download_file'   : download,
        }
        super(FuncResponseFile, self).__init__(**kwargs)

class FuncResponseLargeData(BaseFuncResponse):
    def __init__(self, data, content_type=None):
        if not content_type:
            if isinstance(data, (dict, list, tuple)):
                content_type = 'json'
            else:
                content_type = 'txt'

        if not isinstance(data, str):
            data = toolkit.json_dumps(data)

        self._content_type = content_type
        self._data         = data

        kwargs = {
            'auto_delete_file': True,
            'download_file'   : False,
        }
        super(FuncResponseLargeData, self).__init__(**kwargs)

    def cache_to_file(self, auto_delete=True, cache_expires=0):
        cache_expires = cache_expires or 0

        # 保证至少60秒缓存事件
        now = time.time() + max([cache_expires, 60])

        file_name = f"{arrow.get(now).format('YYYYMMDDHHmmss')}_{toolkit.gen_rand_string(16)}_api-resp.{self._content_type}"
        file_path = os.path.join(CONFIG.get('DOWNLOAD_TEMP_ROOT_FOLDER'), file_name)
        with open(get_resource_path(file_path), 'w') as _f:
            _f.write(self._data)

        self.file_path        = file_path
        self.auto_delete_file = auto_delete

class ScriptBaseTask(BaseTask):
    def __call__(self, *args, **kwargs):
        self.__context_helper = FuncContextHelper(self)

        self.__loaded_script_cache   = toolkit.LocalCache()
        self.__imported_module_cache = toolkit.LocalCache()

        self.__prev_log_time = 0

        return super().__call__(*args, **kwargs)

    def _get_func_defination(self, F):
        f_co   = six.get_function_code(F)
        f_name = f_co.co_name
        if f_name:
            f_name = f_name.strip()

        f_doc  = F.__doc__
        if f_doc:
            f_doc = inspect.cleandoc(f_doc)

        f_sig = funcsigs.signature(F)
        f_def = '{}{}'.format(f_name, str(f_sig)).strip()

        f_argspec = None
        f_args    = None
        f_kwargs  = OrderedDict()
        if six.PY3:
            f_argspec = inspect.getfullargspec(F)
        else:
            f_argspec = inspect.getargspec(F)

        f_args = f_argspec.args
        if f_argspec.varargs:
            f_args.append('*{}'.format(f_argspec.varargs))
        if f_argspec.varkw:
            f_args.append('**{}'.format(f_argspec.varkw))

        for arg_name, args_info in f_sig.parameters.items():
            if str(args_info.kind) == 'VAR_POSITIONAL':
                f_kwargs['*{}'.format(arg_name)] = {}

            elif str(args_info.kind) == 'VAR_KEYWORD':
                f_kwargs['**{}'.format(arg_name)] = {}

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
                e = Exception('CustomImport: Cannot import name `{}`'.format(import_name))
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
                self.logger.debug(f'[CUSTOM IMPORT] user script `{import_script_id}` already imported')

            else:
                self.logger.debug(f'[CUSTOM IMPORT] import user script `{import_script_id}`')

                try:
                    _module = ModuleType(import_script_id)
                    _module.__dict__.clear()

                    module_scope = self.create_safe_scope(import_script_id)
                    if parent_scope:
                        module_scope['DFF'].log_messages = parent_scope['DFF'].log_messages

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
            self.logger.debug(f'[CUSTOM IMPORT] import non-user module `{import_script_id}`')

            return importlib.__import__(name, globals=globals, locals=locals, fromlist=fromlist, level=level)

    def _export_as_api(self, safe_scope, title,
        # 控制类参数
        fixed_crontab=None, delayed_crontab=None, timeout=None, api_timeout=None, cache_result=None, queue=None, fixed_task_info_limit=None,
        # 标记类参数
        category=None, tags=None,
        # 集成处理参数
        integration=None, integration_config=None,
        # 文档控制类参数
        is_hidden=False):
        ### 参数检查/预处理 ###
        extra_config = {}

        # 函数标题
        if title is not None and not isinstance(title, (six.string_types, six.text_type)):
            e = InvalidAPIOptionException('`title` should be a string or unicode')
            raise e

        ##############
        # 控制类参数 #
        ##############

        # 固定Crontab
        if fixed_crontab is not None:
            if not croniter.is_valid(fixed_crontab):
                e = InvalidAPIOptionException('`fixed_crontab` is not a valid crontab expression')
                raise e

            if len(fixed_crontab.split(' ')) > 5:
                e = InvalidAPIOptionException('`fixed_crontab` does not support second part')
                raise e

            extra_config['fixedCrontab'] = fixed_crontab

        # 延迟Crontab（单位秒，可多个）
        if delayed_crontab is not None:
            delayed_crontab = toolkit.as_array(delayed_crontab)
            delayed_crontab = list(set(delayed_crontab))
            delayed_crontab.sort()

            for d in delayed_crontab:
                if not isinstance(d, int):
                    e = InvalidAPIOptionException('Elements of `delayed_crontab` should be int')
                    raise e

            extra_config['delayedCrontab'] = delayed_crontab

        # 执行时限
        if timeout is not None:
            if not isinstance(timeout, six.integer_types):
                e = InvalidAPIOptionException('`timeout` should be an integer or long')
                raise e

            _min_timeout = CONFIG['_FUNC_TASK_MIN_TIMEOUT']
            _max_timeout = CONFIG['_FUNC_TASK_MAX_TIMEOUT']
            if not (_min_timeout <= timeout <= _max_timeout):
                e = InvalidAPIOptionException('`timeout` should be between `{}` and `{}` (seconds)'.format(_min_timeout, _max_timeout))
                raise e

            extra_config['timeout'] = timeout

        # API返回时限
        if api_timeout is not None:
            if not isinstance(api_timeout, six.integer_types):
                e = InvalidAPIOptionException('`api_timeout` should be an integer or long')
                raise e

            _min_api_timeout = CONFIG['_FUNC_TASK_MIN_API_TIMEOUT']
            _max_api_timeout = CONFIG['_FUNC_TASK_MAX_API_TIMEOUT']
            if not (_min_api_timeout <= api_timeout <= _max_api_timeout):
                e = InvalidAPIOptionException('`api_timeout` should be between `{}` and `{}` (seconds)'.format(_min_api_timeout, _max_api_timeout))
                raise e

            extra_config['apiTimeout'] = api_timeout

        # 结果缓存
        if cache_result is not None:
            if not isinstance(cache_result, (int, float)):
                e = InvalidAPIOptionException('`cache_result` should be an int or a float')
                raise e

            extra_config['cacheResult'] = cache_result

        # 指定队列
        if queue is not None:
            available_queues = list(range(CONFIG['_WORKER_QUEUE_COUNT'])) + list(CONFIG['WORKER_QUEUE_ALIAS_MAP'].keys())
            if queue not in available_queues:
                e = InvalidAPIOptionException('`queue` should be one of {}'.format(toolkit.json_dumps(available_queues)))
                raise e

            extra_config['queue'] = queue

        # 固定任务记录数量
        if fixed_task_info_limit is not None:
            if not isinstance(fixed_task_info_limit, int):
                e = InvalidAPIOptionException('`fixed_task_info_limit` should be an int')
                raise e

            _min_task_info_limit = CONFIG['_TASK_INFO_MIN_LIMIT']
            _max_task_info_limit = CONFIG['_TASK_INFO_MAX_LIMIT']
            if not (_min_task_info_limit <= fixed_task_info_limit <= _max_task_info_limit):
                e = InvalidAPIOptionException('`fixed_task_info_limit` should be between `{}` and `{}` (tasks)'.format(_min_task_info_limit, _max_task_info_limit))
                raise e

            extra_config['fixedTaskInfoLimit'] = fixed_task_info_limit

        ##############
        # 标记类参数 #
        ##############

        # 函数分类
        if category is not None and not isinstance(category, (six.string_types, six.text_type)):
            e = InvalidAPIOptionException('`category` should be a string or unicode')
            raise e

        if category is None:
            category = 'general'

        # 函数标签
        if tags is not None:
            if not isinstance(tags, (tuple, list)):
                e = InvalidAPIOptionException('`tags` should be a tuple or a list')
                raise e

            for tag in tags:
                if not isinstance(tag, (six.string_types, six.text_type)):
                    e = InvalidAPIOptionException('Element of `tags` should be a string or unicode')
                    raise e

            tags = list(set(tags))
            tags.sort()

        ################
        # 集成处理参数 #
        ################

        # 功能集成
        if integration is not None:
            if not isinstance(integration, (six.string_types, six.text_type)):
                e = InvalidAPIOptionException('`integration` should be a string or unicode')
                raise e

            integration = FIX_INTEGRATION_KEY_MAP.get(integration.lower()) or integration

        # 功能集成配置
        if integration is not None:
            extra_config['integrationConfig'] = integration_config

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
            safe_scope['DFF'].exported_api_funcs.append({
                'name'       : f_name,
                'title'      : title,
                'description': f_doc,
                'definition' : f_def,
                'extraConfig': extra_config or None,
                'category'   : category,
                'tags'       : tags,
                'args'       : f_args,
                'kwargs'     : f_kwargs,
                'integration': integration,
                'defOrder'   : len(safe_scope['DFF'].exported_api_funcs),
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
        message_time = arrow.get(now).to('Asia/Shanghai').format('YYYY-MM-DD HH:mm:ss.SSS')

        # 计算时间差
        delta = 0
        if self.__prev_log_time:
            delta = int((now - self.__prev_log_time) * 1000)
        self.__prev_log_time = now

        line = '[{}] [+{}ms] {}'.format(message_time, delta, message)
        safe_scope['DFF'].log_messages.append(line)

    def _print(self, safe_scope, *args, **kwargs):
        if safe_scope.get('_DFF_DEBUG'):
            print(*args, **kwargs)

        try:
            value_list = []
            for arg in args:
                value_list.append('{}'.format(arg))

            sep = kwargs.get('sep') or ' '
            message = sep.join(value_list)

            self._log(safe_scope, message)

        except Exception as e:
            for line in traceback.format_exc().splitlines():
                self.logger.error(line)

    def _call_func(self, safe_scope, func_id, kwargs=None, save_result=False):
        func_chain = safe_scope.get('_DFF_FUNC_CHAIN') or []
        func_chain_info = ' -> '.join(map(lambda x: '`{}`'.format(x), func_chain))

        # 检查函数链长度
        if len(func_chain) >= CONFIG['_FUNC_TASK_MAX_CHAIN_LENGTH']:
            e = FuncChainTooLongException(func_chain_info)
            raise e

        # 检查重复调用
        if func_id in func_chain:
            e = FuncRecursiveCallException('{} -> [{}]'.format(func_chain_info, func_id))
            raise e

        # 检查并获取函数信息
        sql = '''
            SELECT
                *
            FROM biz_main_func AS func

            WHERE
                `id` = ?
            LIMIT 1
            '''
        sql_params = [func_id]
        db_res = self.db.query(sql, sql_params)
        if len(db_res) <= 0:
            e = NotFoundException()
            raise e

        func = db_res[0]
        func_extra_config = None
        if func.get('extraConfigJSON'):
            func_extra_config = toolkit.json_loads(func['extraConfigJSON'])

        # 组装函数配置
        soft_time_limit = CONFIG['_FUNC_TASK_DEFAULT_TIMEOUT']
        time_limit      = CONFIG['_FUNC_TASK_DEFAULT_TIMEOUT'] + CONFIG['_FUNC_TASK_EXTRA_TIMEOUT_TO_KILL']

        func_timeout = None
        if func_extra_config and isinstance(func_extra_config.get('timeout'), (six.integer_types, float)):
            func_timeout = func_extra_config['timeout']

            soft_time_limit = func_timeout
            time_limit      = func_timeout + CONFIG['_FUNC_TASK_EXTRA_TIMEOUT_TO_KILL']

        _shift_seconds = int(soft_time_limit * CONFIG['_FUNC_TASK_TIMEOUT_TO_EXPIRE_SCALE'])
        expires = arrow.get().shift(seconds=_shift_seconds).datetime

        task_headers = {
            'origin': self.request.id,
        }
        # 注意：
        # 保证一次主任务调用后的所有子任务数据都能保留
        task_kwargs = {
            'rootTaskId'    : self.request.id,
            'funcId'        : func_id,
            'funcCallKwargs': kwargs,
            'origin'        : safe_scope.get('_DFF_ORIGIN'),
            'originId'      : safe_scope.get('_DFF_ORIGIN_ID'),
            'saveResult'    : save_result,
            'execMode'      : safe_scope.get('_DFF_EXEC_MODE'),
            'triggerTime'   : safe_scope.get('_DFF_TRIGGER_TIME'),
            'triggerTimeMs' : safe_scope.get('_DFF_TRIGGER_TIME_MS'),
            'crontab'       : safe_scope.get('_DFF_CRONTAB'),
            'queue'         : safe_scope.get('_DFF_QUEUE'),
            'funcChain'     : func_chain,
        }

        # 调用执行（在原队列执行）
        sub_task_id = gen_task_id()
        queue       = safe_scope.get('_DFF_QUEUE')

        func_runner.apply_async(
            task_id=sub_task_id,
            kwargs=task_kwargs,
            headers=task_headers,
            queue=toolkit.get_worker_queue(queue),
            soft_time_limit=soft_time_limit,
            time_limit=time_limit,
            expires=expires)

    def load_script(self, script_id, draft=False):
        '''
        加载脚本
        1. 草稿脚本始终直接从数据库中读取
        2. 正式脚本检查本地缓存（60秒强制失效）的MD5与Redis缓存的MD5是否一致
            a. 一致则直接使用本地缓存
            b. 不一致则从数据库中读取脚本，并更新Redis缓存的MD5
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
                    self.logger.debug(f'[LOAD SCRIPT] load `{script_id}` from Cache')

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
        self.logger.debug(f"[LOAD SCRIPT] load `{script_id}`{ '(DRAFT)' if draft else '' } from DB")

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

        # 编译脚本
        if script.get('code'):
            script_code = script['code']
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

    def create_safe_scope(self, script_name=None, extra_vars=None):
        '''
        创建安全脚本作用域
        '''
        safe_scope = {
            '__name__'    : script_name or '<script>',
            '__file__'    : script_name or '<script>',
            '__builtins__': {},
        }

        # 填充DataFlux Func 内置变量
        if extra_vars:
            for k, v in extra_vars.items():
                if k not in safe_scope:
                    safe_scope[k] = v

        # 填充DataFlux Func 内置方法/对象
        __connector_helper    = FuncConnectorHelper(self)
        __env_variable_helper = FuncEnvVariableHelper(self)
        __store_helper        = FuncStoreHelper(self, default_scope=script_name)
        __cache_helper        = FuncCacheHelper(self, default_scope=script_name)
        __config_helper       = FuncConfigHelper(self)
        __thread_helper       = FuncThreadHelper(self)

        def __log(message):
            return self._log(safe_scope, message)

        def __eval(*args, **kwargs):
            # 不再限制此类函数，直接调用原生函数
            return eval(*args, **kwargs)

        def __exec(*args, **kwargs):
            # 不再限制此类函数，直接调用原生函数
            return exec(*args, **kwargs)

        def __export_as_api(title=None, **extra_config):
            return self._export_as_api(safe_scope, title, **extra_config)

        def __call_func(func_id, kwargs=None):
            return self._call_func(safe_scope, func_id, kwargs)

        inject_funcs = {
            'LOG' : __log,  # 输出日志
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

            'FUNC'  : __call_func,     # 调用函数（产生新Task）
            'THREAD': __thread_helper, # 多线程处理模块

            'TASK': self, # 任务本身
        }
        safe_scope['DFF'] = DFFWraper(inject_funcs=inject_funcs)

        # 填充内置对象/函数
        for name in dir(six.moves.builtins):
            # 跳过内置 import 函数，后续替换为 custom_import 函数
            if name == 'import':
                continue

            safe_scope['__builtins__'][name] = six.moves.builtins.__getattribute__(name)

        # 替换内置对象/函数
        def __custom_import(name, globals=None, locals=None, fromlist=None, level=0):
            return self._custom_import(name, globals, locals, fromlist, level, safe_scope)

        def __print(*args, **kwargs):
            return self._print(safe_scope, *args, **kwargs)

        safe_scope['__builtins__']['__import__'] = __custom_import
        safe_scope['__builtins__']['print']      = __print

        return safe_scope

    def safe_exec(self, script_code_obj, globals=None, locals=None):
        safe_scope = globals or self.create_safe_scope()
        exec(script_code_obj, safe_scope)

        return safe_scope

    def clean_up(self):
        pass

    def get_trace_info(self):
        '''
        Data sample:
            {
                "header"       : "Traceback (most recent call last):",
                "exceptionDump": "ZeroDivisionError: integer division or modulo by zero",
                "stack": [
                    {
                    "localsInfo": [
                        { "type": "<type 'int'>",  "name": "a", "repr": "1" },
                        { "type": "<type 'dict'>", "name": "d", "dump": "{\"a\": 1, \"b\": 2}" }
                    ],
                    "funcname"         : "f1",
                    "lineCode"         : "a = a / 0",
                    "lineNumber"       : 12,
                    "formattedLocation": "File \"/Users/pastgift/Documents/01-try/try_traceback_2.py\", line 12, in f1",
                    "filename"         : "/Users/pastgift/Documents/01-try/try_traceback_2.py",
                    "isInScript"       : true,
                    }
                ]
            }
        '''
        try:
            sample_scope = self.create_safe_scope()

            exc_type, exc_obj, tb = sys.exc_info()

            trace_info = {
                'header'       : 'Traceback (most recent call last):',
                'exceptionDump': ''.join(traceback.format_exception_only(exc_type, exc_obj)).strip(),
                'stack'        : [],
            }

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

                compacted_filename = filename.replace(os.getcwd(), '<{}>'.format(CONFIG['APP_NAME']))
                formatted_location = 'File "{}", line {}, in {}'.format(compacted_filename, line_number, funcname)

                stack_item = {
                    'filename'         : filename,
                    'funcname'         : funcname,
                    'lineNumber'       : line_number,
                    'lineCode'         : line_code,
                    'formattedLocation': formatted_location,
                    'isInScript'       : is_in_script,
                }
                trace_info['stack'].append(stack_item)

                tb = tb.tb_next

            return trace_info

        except Exception as e:
            for line in traceback.format_exc().splitlines():
                self.logger.error(line)

        finally:
            exc_type = exc_obj = tb = None

    def get_formated_einfo(self, trace_info, only_in_script=False):
        lines = []
        lines.append(trace_info['header'])

        for s in trace_info['stack']:
            if only_in_script and not s['isInScript']:
                continue

            lines.append('  ' + s['formattedLocation'])
            lines.append('    ' + s['lineCode'].strip())

        lines.append(trace_info['exceptionDump'])

        return '\n'.join(lines)

from worker.tasks.main.func_debugger   import func_debugger
from worker.tasks.main.func_runner     import func_runner
from worker.tasks.main.crontab_starter import crontab_starter

from worker.tasks.main.utils import reload_data_md5_cache
from worker.tasks.main.utils import sync_cache
from worker.tasks.main.utils import auto_clean
from worker.tasks.main.utils import auto_run
from worker.tasks.main.utils import check_connector
from worker.tasks.main.utils import query_connector
from worker.tasks.main.utils import reset_worker_queue_pressure
from worker.tasks.main.utils import auto_backup_db