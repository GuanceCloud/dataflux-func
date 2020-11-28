# -*- coding: utf-8 -*-

# Builtin Modules
import os
import sys
import inspect
import traceback
import linecache
from types import ModuleType
import time
import json
import pprint
import importlib
import functools
from concurrent.futures import ThreadPoolExecutor

# 3rd-party Modules
import six
import simplejson, ujson
import arrow
import pylru
import requests
import crontab as crontab_parser
import funcsigs

# Project Modules
from worker import app
from worker.tasks import BaseTask, BaseResultSavingTask, gen_task_id
from worker.utils import yaml_resources, toolkit
from worker.utils.log_helper import LogHelper
from worker.utils.extra_helpers import InfluxDBHelper, MySQLHelper, RedisHelper, MemcachedHelper, ClickHouseHelper
from worker.utils.extra_helpers import OracleDatabaseHelper, SQLServerHelper, PostgreSQLHelper, MongoDBHelper, ElasticSearchHelper, NSQLookupHelper
from worker.utils.extra_helpers import DFDataWayHelper
from worker.utils.extra_helpers import format_sql_v2 as format_sql

CONFIG = yaml_resources.get('CONFIG')

COMPILED_CODE_LRU = pylru.lrucache(CONFIG['_FUNC_TASK_COMPILE_CACHE_MAX_SIZE'])

FIXED_INTEGRATION_KEY_MAP = {
    # 登录用函数
    #   函数必须为`def func(username, password)`形式
    #   无配置项
    'signIn': 'signIn',
    'login' : 'signIn',

    # 自动运行函数
    #   函数必须为`def func()`形式
    #   配置项：
    #       crontab  : Crontab语法自动运行周期
    #       onLaunch : True/False，是否启动时运行
    #       onPublish: True/False，是否发布后运行
    'autoRun': 'autoRun',
}

DATA_SOURCE_HELPER_CLASS_MAP = {
    'df_dataway'   : DFDataWayHelper,
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
}
DATA_SOURCE_LOCAL_TIMESTAMP_MAP = {}
DATA_SOURCE_HELPERS_CACHE       = {}

ENV_VARIABLE_LOCAL_TIMESTAMP_MAP = {}
ENV_VARIABLES_CACHE              = {}
ENV_VARIABLE_AUTO_TYPE_CASTING_FUNC_MAP = {
    'integer'   : int,
    'float'     : float,
    'boolean'   : toolkit.to_boolean,
    'json'      : simplejson.loads,
    'commaArray': lambda x: x.split(','),
}

DECIPHER_FIELDS = [
    'password',
    'secretKey',
]

UNSAFE_BUILTIN_NAMES = ('import', 'open', 'exec', 'eval', 'compile')
UNSAFE_CONTENTS = (
    '__import__',
    '__bases__',
)

CONCURRENT_POOL       = None
CONCURRENT_RESULT_MAP = {}

# 添加额外import路径
extra_import_path = CONFIG.get('EXTRA_PYTHON_IMPORT_PATH')
if extra_import_path:
    sys.path.append(extra_import_path)

def _kwargs_hint_type_converter_str(x):
    if isinstance(x, str):
        return x
    return str(x)

def _kwargs_hint_type_converter_int(x):
    if isinstance(x, int):
        return x
    return int(x)

def _kwargs_hint_type_converter_float(x):
    if isinstance(x, float):
        return x
    return float(x)

def _kwargs_hint_type_converter_list(x):
    if isinstance(x, list):
        return x
    elif isinstance(x, str):
        x = ujson.loads(x)
        if not isinstance(x, list):
            e = TypeError('Parse result of value is not a `list`, but `{}`'.format(type(x).__name__))
            raise e

        return x

    else:
        e = TypeError('Cannot parse the value to a `list`')
        raise e

def _kwargs_hint_type_converter_dict(x):
    if isinstance(x, dict):
        return x
    elif isinstance(x, str):
        x = ujson.loads(x)
        if not isinstance(x, dict):
            raise TypeError('Parse result of value is not a `dict`, but `{}`'.format(type(x).__name__))

        return x

    else:
        raise TypeError('Cannot parse the value to a `dict`')

def _kwargs_hint_type_converter_json(x):
    if isinstance(x, (list, dict)):
        return x
    elif isinstance(x, str):
        x = ujson.loads(x)
        if not isinstance(x, (list, dict)):
            raise TypeError('Parse result of value is not a `list` or `dict`, but `{}`'.format(type(x).__name__))

        return x

    else:
        raise TypeError('Cannot parse the value to a `list` or `dict`')

def _kwargs_hint_type_converter_comma_array(x):
    if isinstance(x, str):
        return list(map(lambda x: x.strip(), x.split(',')))
    else:
        raise TypeError('Cannot parse the value as a comma-array')

def _kwargs_hint_type_converter_bool(x):
    if isinstance(x, bool):
        return x
    return bool(x)

def _kwargs_hint_type_converter_enum(x):
    return x

KWARGS_HINT_TYPE_CONVERTER = {
    'str'       : _kwargs_hint_type_converter_str,
    'int'       : _kwargs_hint_type_converter_int,
    'float'     : _kwargs_hint_type_converter_float,
    'list'      : _kwargs_hint_type_converter_list,
    'dict'      : _kwargs_hint_type_converter_dict,
    'json'      : _kwargs_hint_type_converter_json,
    'commaArray': _kwargs_hint_type_converter_comma_array,
    'bool'      : _kwargs_hint_type_converter_bool,
    'enum'      : _kwargs_hint_type_converter_enum,
}

KWARGS_HINT_FIELD_MAP = {
    # 类型（Python类型，调用时自动转换）
    'type': {
        'type': str,
        'in'  : [
            'str',        # 字符串类型，使用 str(x) 自动转换
            'int',        # 整数类型，使用 int(x) 自动转换
            'float',      # 浮点数类型，使用 float(x) 自动转换
            'list',       # list类型，使用 json.loads(x) 自动转换并检查是否为list（已经是list的不会重复转换）
            'dict',       # dict类型，使用 json.loads(x) 自动转换并检查是否为dict（已经是dict的不会重复转换）
            'json',       # JSON类型，使用 json.loads(x) 自动转换（已经是dict/list的不会重复转换）
            'commaArray', # 逗号分隔数组，使用 x.split(',') 自动切割（暂不支持转义）
            'bool',       # 布尔值类型，使用 bool(x) 自动转换（1 => True, 0 => False）
            'enum',       # 枚举类型，需要与'in'限制条件连用
        ],
    },

    # 类型转换错误时报错
    # （启用且指定了type后，转换失败直接报错）
    'raiseTypeError': {
        'type': bool,
        'in'  : [True, False],
    },

    ### 以下输入值检查只有在指定了type，且转换成功后才进行检查 ###
    # 输入值必须为指定值之一（支持type=str,commaArray,enum）
    'in': {
        'type'    : list,
        'forTypes': ['str', 'commaArray', 'enum'],
    },

    # 输入值不能为指定值之一（支持type=str,commaArray,enum）
    'notIn': {
        'type'    : list,
        'forTypes': ['str', 'commaArray', 'enum'],
    },

    # 最小长度（支持type=str,list,dict,json,commaArray）
    'minLength': {
        'type'    : int,
        'forTypes': ['str', 'list', 'dict', 'json', 'commaArray'],
    },

    # 最大长度（支持type=str,list,dict,json,commaArray）
    'maxLength': {
        'type'    : int,
        'forTypes': ['str', 'list', 'dict', 'json', 'commaArray'],
    },

    # 最小值（支持type=int,float）
    'minValue': {
        'type'    : (int, float),
        'forTypes': ['int', 'float'],
    },

    # 最大值（支持type=int,float）
    'maxValue': {
        'type'    : (int, float),
        'forTypes': ['int', 'float'],
    },
}

class DataFluxFuncBaseException(Exception):
    pass
class JailBreakException(DataFluxFuncBaseException):
    pass
class NotFoundException(DataFluxFuncBaseException):
    pass
class DuplicationException(DataFluxFuncBaseException):
    pass
class NotSupportException(DataFluxFuncBaseException):
    pass
class InvalidOptionException(DataFluxFuncBaseException):
    pass
class AccessDenyException(DataFluxFuncBaseException):
    pass
class FuncChainTooLongException(DataFluxFuncBaseException):
    pass

def jailbreak_check(script_code):
    if not isinstance(script_code, six.string_types):
        return

    for line_no, line_code in enumerate(script_code.splitlines(), start=1):
        for unsafe_content in UNSAFE_CONTENTS:
            line_code = line_code.strip()
            if line_code.startswith('#'):
                break

            if unsafe_content in line_code:
                raise JailBreakException('Are you trying to jailbreak? line: {}, `{}`'.format(line_no, line_code))

class DFFWraper(object):
    def __init__(self, inject_funcs=None):
        self.exported_api_funcs = []
        self.log_messages       = []
        self.plot_charts        = []

        self.inject_funcs = inject_funcs

    def __getattr__(self, name):
        if not self.inject_funcs:
            return None

        else:
            return self.inject_funcs.get(name)

def gen_script_failure_id():
    '''
    生成脚本故障ID
    '''
    return toolkit.gen_short_data_id('sfal')

def gen_script_log_id():
    '''
    生成脚本日志ID
    '''
    return toolkit.gen_short_data_id('slog')

def gen_data_source_id():
    '''
    生成数据源ID
    '''
    return toolkit.gen_short_data_id('dsrc')

def compute_func_store_id(key, scope):
    '''
    计算函数存储ID
    '''
    str_to_md5 = '-'.join([key, scope])

    long_id = 'fnst-' + toolkit.get_md5(str_to_md5)
    short_id = toolkit.to_short_data_id(long_id)

    return short_id

def decipher_data_source_config_fields(config):
    '''
    解密字段
    '''
    config = toolkit.json_copy(config)

    for f in DECIPHER_FIELDS:
        f_cipher = '{}Cipher'.format(f)

        if config.get(f_cipher):
            config[f] = toolkit.decipher_by_aes(config[f_cipher], CONFIG['SECRET'])
            config.pop(f_cipher, None)

    return config

class ScriptCacherMixin(object):
    def get_scripts(self, script_ids=None):
        # 【注意】
        # 加载脚本处理存在两处
        #   1. DataFluxFuncReloadScriptsTask.force_reload_script()
        #       强制加载所有脚本，并缓存到Redis
        #   2. DataFluxFuncReloadScriptsTask.reload_script()
        #       按需加载已变更的脚本，并缓存到Redis
        #   3. DataFluxFuncRunnerTask.update_script_dict_cache()
        #       缓存击穿时加载所需脚本，并缓存到内存

        # 获取脚本数据
        sql = '''
            SELECT
                 `scpt`.`seq`
                ,`scpt`.`id`
                ,`scpt`.`publishVersion`
                ,`scpt`.`code`
                ,`scpt`.`codeMD5`

                ,`sset`.`id` AS `scriptSetId`

            FROM biz_main_script_set AS sset

            JOIN biz_main_script AS scpt
                ON `sset`.`id` = `scpt`.`scriptSetId`
            '''
        sql_params = None

        if script_ids:
            sql += '''WHERE `scpt`.`id` IN (?) '''
            sql_params = [script_ids]

        scripts = self.db.query(sql, sql_params)

        # 获取函数额外配置
        sql = '''
            SELECT
                 `func`.`id`
                ,`func`.`scriptId`
                ,`func`.`extraConfigJSON`
            FROM biz_main_func AS func
            '''
        sql_params = None

        if script_ids:
            sql += '''WHERE `func`.`scriptId` IN (?) '''
            sql_params = [script_ids]

        funcs = self.db.query(sql, sql_params)

        # 整理函数额外配置表
        # 结构如下：{ "<脚本ID>": { "<函数ID>": <额外配置JSON> }}
        script_func_extra_config_map = {}
        for f in funcs:
            func_id           = f['id']
            script_id         = f['scriptId']
            func_extra_config = f['extraConfigJSON']
            if isinstance(func_extra_config, (six.string_types, six.text_type)):
                func_extra_config = ujson.loads(func_extra_config)

            if f['scriptId'] not in script_func_extra_config_map:
                script_func_extra_config_map[f['scriptId']] = {}

            script_func_extra_config_map[f['scriptId']][func_id] = func_extra_config

        # 函数额外配置表插入脚本信息
        for s in scripts:
            s['funcExtraConfig'] = script_func_extra_config_map.get(s['id']) or {}

        return scripts

class FuncAsyncHelper(object):
    def __init__(self, task):
        self.__task = task

    def start(self, fn, args=None, kwargs=None, key=None):
        global CONCURRENT_POOL
        global CONCURRENT_RESULT_MAP

        if not CONCURRENT_POOL:
            self.__task.logger.debug('[ASYNC POOL] Create Pool')

            pool_size = CONFIG['_FUNC_TASK_ASYNC_POOL_SIZE']
            CONCURRENT_POOL = ThreadPoolExecutor(pool_size)
            CONCURRENT_RESULT_MAP.clear()

        key = key or toolkit.gen_short_data_id('async')
        self.__task.logger.debug('[ASYNC POOL] Submit Key=`{0}`'.format(key))

        if key in CONCURRENT_RESULT_MAP:
            e = DuplicationException('Async result key already existed: `{0}`'.format(key))
            raise e

        args   = args   or []
        kwargs = kwargs or {}
        CONCURRENT_RESULT_MAP[key] = CONCURRENT_POOL.submit(fn, *args, **kwargs)

    def get_result(self, wait=True, key=None):
        global CONCURRENT_POOL
        global CONCURRENT_RESULT_MAP

        if not CONCURRENT_RESULT_MAP:
            return None

        if wait is None:
            wait = True

        collected_res = {}

        keys = key or list(CONCURRENT_RESULT_MAP.keys())
        for k in toolkit.as_array(keys):
            collected_res[k] = None

            future_res = CONCURRENT_RESULT_MAP.get(k)
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

        value_json = toolkit.json_safe_dumps(value)
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
            value = ujson.loads(value)
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

    def set(self, key, value, scope=None, expire=None, not_exists=False):
        key = self._get_cache_key(key, scope)
        return self.__task.cache_db.run('set', key, value, ex=expire, nx=not_exists)

    def get(self, key, scope=None):
        key = self._get_cache_key(key, scope)
        return self.__task.cache_db.run('get', key)

    def getset(self, key, value, scope=None):
        key = self._get_cache_key(key, scope)
        return self.__task.cache_db.run('getset', key, value)

    def expire(self, key, expires, scope=None):
        key = self._get_cache_key(key, scope)
        return self.__task.cache_db.run('expire', key, expires)

    def delete(self, key, scope=None):
        key = self._get_cache_key(key, scope)
        return self.__task.cache_db.run('delete', key)

    def incr(self, key, step=1, scope=None):
        key = self._get_cache_key(key, scope)
        return self.__task.cache_db.run('incr', key, amount=step)

    def lpush(self, key, value, scope=None):
        key = self._get_cache_key(key, scope)
        return self.__task.cache_db.run('lpush', key, value)

    def rpush(self, key, value, scope=None):
        key = self._get_cache_key(key, scope)
        return self.__task.cache_db.run('rpush', key, value)

    def lpop(self, key, scope=None):
        key = self._get_cache_key(key, scope)
        return self.__task.cache_db.run('lpop', key)

    def rpop(self, key, scope=None):
        key = self._get_cache_key(key, scope)
        return self.__task.cache_db.run('rpop', key)

    def rpoplpush(self, key, dest_key=None, scope=None, dest_scope=None):
        if dest_key is None:
            dest_key = key
        if dest_scope is None:
            dest_scope = scope

        key      = self._get_cache_key(key, scope)
        dest_key = self._get_cache_key(dest_key, dest_scope)
        return self.__task.cache_db.run('rpoplpush', key, dest_key)

class FuncDataSourceHelper(object):
    AVAILABLE_CONFIG_KEYS = (
        'host',
        'port',
        'servers',
        'protocol',
        'database',
        'user',
        'password',
        'charset',
        'token',
        'accessKey',
        'secretKey',
        'meta',
    )

    def __init__(self, task):
        self.__task = task

    def __call__(self, *args, **kwargs):
        return self.get(*args, **kwargs)

    def get(self, data_source_id, **helper_kwargs):
        global DATA_SOURCE_LOCAL_TIMESTAMP_MAP
        global DATA_SOURCE_HELPERS_CACHE
        global DATA_SOURCE_HELPER_CLASS_MAP

        helper_target_key = simplejson.dumps(helper_kwargs, sort_keys=True, separators=(',', ':'))

        # 判断是否需要刷新数据源
        local_time = DATA_SOURCE_LOCAL_TIMESTAMP_MAP.get(data_source_id) or 0

        cache_key = toolkit.get_cache_key('cache', 'dataSourceRefreshTimestamp', tags=['id', data_source_id])
        refresh_time = int(self.__task.cache_db.get(cache_key) or 0)

        if refresh_time > local_time:
            self.__task.logger.debug('DATA_SOURCE_HELPERS_CACHE refreshed. remote=`{}`, local=`{}`, diff=`{}`'.format(
                    refresh_time, local_time, refresh_time - local_time))

            DATA_SOURCE_LOCAL_TIMESTAMP_MAP[data_source_id] = refresh_time
            DATA_SOURCE_HELPERS_CACHE[data_source_id]       = {}

        # 已缓存的直接返回
        helper = DATA_SOURCE_HELPERS_CACHE.get(data_source_id, {}).get(helper_target_key)
        if helper:
            self.__task.logger.debug('Get DataSource Helper from cache: `{}:{}`'.format(data_source_id, helper_target_key))
            return helper

        # 从数据库创建
        sql = '''
            SELECT
                 `type`
                ,`configJSON`
            FROM `biz_main_data_source`
            WHERE
                `id` = ?
            '''
        sql_params = [data_source_id]
        db_res = self.__task.db.query(sql, sql_params)
        if not db_res:
            e = NotFoundException('Data source `{}` not found'.format(data_source_id))
            raise e

        helper_type = db_res[0]['type']
        config_json = db_res[0]['configJSON']
        config      = ujson.loads(config_json)

        # 解密字段
        config = decipher_data_source_config_fields(config)

        helper_class = DATA_SOURCE_HELPER_CLASS_MAP.get(helper_type)
        if helper_class:
            helper_kwargs['pool_size'] = CONFIG['_FUNC_TASK_ASYNC_POOL_SIZE']
            helper = helper_class(self.__task.logger, config, **helper_kwargs);

        else:
            e = NotSupportException('Data source type not support: `{}`'.format(helper_type))
            raise e

        if not DATA_SOURCE_HELPERS_CACHE.get(data_source_id):
            DATA_SOURCE_HELPERS_CACHE[data_source_id] = {}

        DATA_SOURCE_HELPERS_CACHE[data_source_id][helper_target_key] = helper

        self.__task.logger.debug('Create DataSource Helper: `{}:{}`'.format(data_source_id, helper_target_key))
        return helper

    def update_refresh_timestamp(self, data_source_id):
        # 更新缓存刷新时间
        cache_key = toolkit.get_cache_key('cache', 'dataSourceRefreshTimestamp', tags=['id', data_source_id])
        self.__task.cache_db.set(cache_key, int(time.time() * 1000))

    def list(self):
        sql = '''
            SELECT
                 `id`
                ,`title`
                ,`description`
                ,`type`
                ,`isBuiltin`
                ,`createTime`
                ,`updateTime`
            FROM biz_main_data_source AS dsrc
            '''
        data = self.__task.db.query(sql)

        for d in data:
            d['isBuiltin'] = bool(d['isBuiltin'])

        return data

    def save(self, data_source_id, type_, config, title=None, description=None):
        if type_ not in DATA_SOURCE_HELPER_CLASS_MAP:
            raise NotSupportException('Data source type `{}` not supported'.format(type_))

        if not config:
            config = {}
        if not isinstance(config, dict):
            raise InvalidOptionException('Data source config should be a dict')

        for k in config.keys():
            if k not in self.AVAILABLE_CONFIG_KEYS:
                raise NotSupportException('Data source config item `{}` not supported'.format(k))

        # 加密字段
        password = config.get('password')
        if password:
            config['passwordCipher'] = toolkit.cipher_by_aes(password, CONFIG['SECRET'])
        config.pop('password', None)

        config_json = toolkit.json_safe_dumps(config)

        sql = '''
            SELECT `id` FROM biz_main_data_source WHERE `id` = ?
            '''
        sql_params = [data_source_id]
        db_res = self.__task.db.query(sql, sql_params)

        if len(db_res) > 0:
            # 已存在，更新
            sql = '''
                UPDATE biz_main_data_source
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
                type_,
                config_json,
                data_source_id,
            ]
            self.__task.db.query(sql, sql_params)

        else:
            # 不存在，插入
            sql = '''
                INSERT INTO biz_main_data_source
                SET
                     `id`          = ?
                    ,`title`       = ?
                    ,`description` = ?
                    ,`type`        = ?
                    ,`configJSON`  = ?
                '''
            sql_params = [
                data_source_id,
                title,
                description,
                type_,
                config_json,
            ]
            self.__task.db.query(sql, sql_params)

        self.update_refresh_timestamp(data_source_id)

    def delete(self, data_source_id):
        sql = '''
            DELETE FROM biz_main_data_source
            WHERE
                `id` = ?
            '''
        sql_params = [data_source_id]
        self.__task.db.query(sql, sql_params)

        self.update_refresh_timestamp(data_source_id)

class FuncEnvVariableHelper(object):
    def __init__(self, task):
        self.__task = task

    def __call__(self, *args, **kwargs):
        return self.get(*args, **kwargs)

    def get(self, env_variable_id):
        # 用户自定义Helper
        global ENV_VARIABLE_LOCAL_TIMESTAMP_MAP
        global ENV_VARIABLES_CACHE

        # 判断是否需要刷新数据源
        local_time = ENV_VARIABLE_LOCAL_TIMESTAMP_MAP.get(env_variable_id) or 0

        cache_key = toolkit.get_cache_key('cache', 'envVariableRefreshTimestamp', tags=['id', env_variable_id])
        refresh_time = int(self.__task.cache_db.get(cache_key) or 0)

        if refresh_time > local_time:
            self.__task.logger.debug('ENV_VARIABLES_CACHE refreshed. remote=`{}`, local=`{}`, diff=`{}`'.format(
                    refresh_time, local_time, refresh_time - local_time))

            ENV_VARIABLE_LOCAL_TIMESTAMP_MAP[env_variable_id] = refresh_time
            ENV_VARIABLES_CACHE[env_variable_id]              = None

        # 已缓存的直接返回
        env_value = ENV_VARIABLES_CACHE.get(env_variable_id)
        if env_value:
            return env_value

        # 从数据库创建
        sql = '''
            SELECT
                `valueTEXT`
               ,`autoTypeCasting`
            FROM `biz_main_env_variable`
            WHERE
                `id` = ?
            '''
        sql_params = [env_variable_id]
        db_res = self.__task.db.query(sql, sql_params)
        if not db_res:
            return None

        env_value         = db_res[0]['valueTEXT']
        auto_type_casting = db_res[0]['autoTypeCasting']
        casted_env_value  = env_value

        if auto_type_casting in ENV_VARIABLE_AUTO_TYPE_CASTING_FUNC_MAP:
            casted_env_value = ENV_VARIABLE_AUTO_TYPE_CASTING_FUNC_MAP[auto_type_casting](env_value)

            # 防止boolean类型转换失败时返回`None`
            if auto_type_casting == 'boolean' and not isinstance(casted_env_value, bool):
                raise TypeError('Cannot convert ENV value "{}" to boolean.'.format(env_value))

        ENV_VARIABLES_CACHE[env_variable_id] = casted_env_value
        return casted_env_value

    def update_refresh_timestamp(self, env_variable_id):
        # 更新缓存刷新时间
        cache_key = toolkit.get_cache_key('cache', 'envVariableRefreshTimestamp', tags=['id', env_variable_id])
        self.__task.cache_db.set(cache_key, int(time.time() * 1000))

    def list(self):
        sql = '''
            SELECT
                 `id`
                ,`title`
                ,`description`
                ,`valueTEXT`
                ,`autoTypeCasting`
                ,`createTime`
                ,`updateTime`
            FROM biz_main_env_variable
            '''
        data = self.__task.db.query(sql)

        return data

    def save(self, env_variable_id, value, title=None, description=None):
        if value is None:
            value = ''

        auto_type_casting = 'string'
        if isinstance(value, bool):
            # Python中`isinstance(True, int)`返回`True`，布尔值要优先判断
            auto_type_casting = 'boolean'
        elif isinstance(value, int):
            auto_type_casting = 'integer'
        elif isinstance(value, float):
            auto_type_casting = 'float'
        elif isinstance(value, dict):
            auto_type_casting = 'json'
        elif isinstance(value, list):
            if all(map(lambda x: isinstance(x, str) and ',' not in x, value)):
                auto_type_casting = 'commaArray'
            else:
                auto_type_casting = 'json'

        value_text = value
        if auto_type_casting in ('string', 'int', 'float'):
            value_text = str(value)
        elif auto_type_casting == 'boolean':
            value_text = str(value).lower()
        elif auto_type_casting == 'json':
            value_text = toolkit.json_safe_dumps(value)
        elif auto_type_casting == 'commaArray':
            value_text = ','.join(value)

        sql = '''
            SELECT `id` FROM biz_main_env_variable WHERE `id` = ?
            '''
        sql_params = [env_variable_id]
        db_res = self.__task.db.query(sql, sql_params)

        if len(db_res) > 0:
            # 已存在，更新
            sql = '''
                UPDATE biz_main_env_variable
                SET
                     `title`           = ?
                    ,`description`     = ?
                    ,`valueTEXT`       = ?
                    ,`autoTypeCasting` = ?
                WHERE
                    `id` = ?
                '''
            sql_params = [
                title,
                description,
                value_text,
                auto_type_casting,
                env_variable_id,
            ]
            self.__task.db.query(sql, sql_params)

        else:
            # 不存在，插入
            sql = '''
                INSERT INTO biz_main_env_variable
                SET
                     `id`              = ?
                    ,`title`           = ?
                    ,`description`     = ?
                    ,`valueTEXT`       = ?
                    ,`autoTypeCasting` = ?
                '''
            sql_params = [
                env_variable_id,
                title,
                description,
                value_text,
                auto_type_casting,
            ]
            self.__task.db.query(sql, sql_params)

        self.update_refresh_timestamp(env_variable_id)

    def delete(self, env_variable_id):
        sql = '''
            DELETE FROM biz_main_env_variable
            WHERE
                `id` = ?
            '''
        sql_params = [env_variable_id]
        self.__task.db.query(sql, sql_params)

        self.update_refresh_timestamp(env_variable_id)

class FuncConfigHelper(object):
    def __init__(self, task):
        self.__task = task

    def __call__(self, *args, **kwargs):
        return self.get(*args, **kwargs)

    def get(self, config_id):
        if not config_id.startswith('CUSTOM_'):
            e = AccessDenyException('Config `{}` is not accessible'.format(config_id))
            raise e

        if config_id not in CONFIG:
            return None

        return CONFIG.get(config_id)

    def list(self):
        return [{ 'key': k, 'value': v } for k, v in CONFIG.items() if k.startswith('CUSTOM_')]

    def dict(self):
        return dict([(k, v) for k, v in CONFIG.items() if k.startswith('CUSTOM_')])

class ScriptBaseTask(BaseTask, ScriptCacherMixin):
    def __call__(self, *args, **kwargs):
        self.logger = LogHelper(self)

        return super(ScriptBaseTask, self).__call__(*args, **kwargs)

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
        f_kwargs  = {}
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

    def _custom_import(self, script_dict, imported_script_dict,
        name, globals=None, locals=None, fromlist=None, level=0,
        parent_scope=None):
        if name in script_dict:
            _module = None

            try:
                if name in imported_script_dict:
                    _module = imported_script_dict[name]

                else:
                    _module = ModuleType(name)

                    imported_script_dict[name] = _module

                    _module.__dict__.clear()

                    module_scope = self.create_safe_scope(
                            script_name=name,
                            script_dict=script_dict,
                            imported_script_dict=imported_script_dict)

                    if parent_scope:
                        module_scope['DFF'].log_messages = parent_scope['DFF'].log_messages
                        module_scope['DFF'].plot_charts  = parent_scope['DFF'].plot_charts

                        for k, v in parent_scope.items():
                            if k.startswith('_DFF_'):
                                module_scope[k] = v

                    _module.__dict__.update(module_scope)

                    script_code_obj = script_dict[name]['codeObj']
                    if script_code_obj:
                        exec(script_code_obj, _module.__dict__)

            except Exception as e:
                raise

            globals[name] = _module
            self._resolve_fromlist(_module, fromlist, globals)

            return _module

        else:
            return importlib.__import__(name, globals=globals, locals=locals, fromlist=fromlist, level=level)

    def _export_as_api(self, safe_scope, title=None, category=None, tags=None, kwargs_hint=None,
        fixed_crontab=None, timeout=None, api_timeout=None, cache_result=None, queue=None,
        integration=None, integration_config=None,
        is_hidden=False, is_disabled=False):
        ### 核心配置 ###
        # 函数标题
        if title is not None and not isinstance(title, (six.string_types, six.text_type)):
            e = InvalidOptionException('`title` should be a string or unicode')
            raise e

        # 函数标签
        if tags is not None:
            if not isinstance(tags, (tuple, list)):
                e = InvalidOptionException('`tags` should be a tuple or a list')
                raise e

            for tag in tags:
                if not isinstance(tag, (six.string_types, six.text_type)):
                    e = InvalidOptionException('Element of `tags` should be a string or unicode')
                    raise e

            tags = list(set(tags))
            tags.sort()

        # 参数提示
        if kwargs_hint is not None:
            if not isinstance(kwargs_hint, dict):
                e = InvalidOptionException('`kwargs_hint` should be a dict')
                raise e

            for arg_key, arg_hint in kwargs_hint.items():
                if not isinstance(arg_hint, dict):
                    e = InvalidOptionException('Value of `kwargs_hint` item should be a dict')
                    raise e

                for hint_key, hint_value in arg_hint.items():
                    hint_spec = KWARGS_HINT_FIELD_MAP.get(hint_key)
                    if not hint_spec:
                        e = InvalidOptionException('Unsupported kwargs hint key: `{}`'.format(hint_key))
                        raise e

                    # 检查 hint 配置值类型
                    if 'type' in hint_spec:
                        if not isinstance(hint_value, hint_spec['type']):
                            hint_spec_types = ', '.join(['`{}`'.format(x.__name__) for x in toolkit.as_array(hint_spec['type'])])
                            e = InvalidOptionException('Invalid type of hint value: `{}` should be {}'.format(hint_key, hint_spec_types))
                            raise e

                    # 检查 hint 配置值内容
                    if 'in' in hint_spec:
                        if hint_value not in hint_spec['in']:
                            hint_spec_in = ', '.join(['`{}`'.format(repr(x)) for x in toolkit.as_array(hint_spec['in'])])
                            e = InvalidOptionException('Invalid value of hint value: `{}` should be one of {}'.format(hint_key, hint_spec_in))
                            raise e

                    # 检查配置与类型是否匹配
                    if 'forTypes' in hint_spec and 'type' in arg_hint:
                        if arg_hint['type'] not in hint_spec['forTypes']:
                            hint_spec_for_types = ', '.join(['`{}`'.format(x) for x in hint_spec['forTypes']])
                            e = InvalidOptionException('Invalid hint key: `{}` can only be used for arguments of type {}'.format(hint_key, hint_spec_for_types))
                            raise e

        # 函数分类
        if category is not None and not isinstance(category, (six.string_types, six.text_type)):
            e = InvalidOptionException('`category` should be a string or unicode')
            raise e

        # 功能集成
        if integration is not None:
            if not isinstance(integration, (six.string_types, six.text_type)):
                e = InvalidOptionException('`integration` should be a string or unicode')
                raise e

            integration = FIXED_INTEGRATION_KEY_MAP.get(integration.lower()) or integration

        ### 额外配置 ###
        extra_config = {}

        # 隐藏函数（不在文档中出现）
        if is_hidden is True:
            extra_config['isHidden'] = True

        # 固定Crontab
        if fixed_crontab is not None:
            try:
                parsed_crontab = crontab_parser.CronTab(fixed_crontab)
            except Exception as e:
                e = InvalidOptionException('`fixed_crontab` is not a valid crontab expression')
                raise e

            if len(fixed_crontab.split(' ')) > 5:
                e = InvalidOptionException('`fixed_crontab` does not support second part')
                raise e

            extra_config['fixedCrontab'] = fixed_crontab

        # 执行时限
        if timeout is not None:
            if not isinstance(timeout, six.integer_types):
                e = InvalidOptionException('`timeout` should be an integer or long')
                raise e

            _min_timeout = CONFIG['_FUNC_TASK_MIN_TIMEOUT']
            _max_timeout = CONFIG['_FUNC_TASK_MAX_TIMEOUT']
            if not (_min_timeout <= timeout <= _max_timeout):
                e = InvalidOptionException('`timeout` should be between `{}` and `{}` (seconds)'.format(_min_timeout, _max_timeout))
                raise e

            extra_config['timeout'] = timeout

        # API返回时限
        if api_timeout is not None:
            if not isinstance(api_timeout, six.integer_types):
                e = InvalidOptionException('`api_timeout` should be an integer or long')
                raise e

            _min_api_timeout = CONFIG['_FUNC_TASK_MIN_API_TIMEOUT']
            _max_api_timeout = CONFIG['_FUNC_TASK_MAX_API_TIMEOUT']
            if not (_min_api_timeout <= api_timeout <= _max_api_timeout):
                e = InvalidOptionException('`api_timeout` should be between `{}` and `{}` (seconds)'.format(_min_api_timeout, _max_api_timeout))
                raise e

            extra_config['apiTimeout'] = api_timeout

        # 结果缓存
        if cache_result is not None:
            if not isinstance(cache_result, (int, float)):
                e = InvalidOptionException('`cache_result` should be an int or a float')
                raise e

            extra_config['cacheResult'] = cache_result

        # 指定队列
        if queue is not None:
            available_queues = list(range(CONFIG['_WORKER_QUEUE_COUNT'])) + list(CONFIG['WORKER_QUEUE_ALIAS_MAP'].keys())
            if queue not in available_queues:
                e = InvalidOptionException('`queue` should be one of {}'.format(json.dumps(available_queues)))
                raise e

            extra_config['queue'] = queue

        # 功能集成配置
        if integration:
            extra_config['integrationConfig'] = integration_config

        def decorater(F):
            f_name, f_def, f_args, f_kwargs, f_doc = self._get_func_defination(F)

            # 添加 kwargs 附带信息
            if kwargs_hint is not None:
                for arg_key, arg_hint in kwargs_hint.items():
                    if arg_key not in f_kwargs:
                        e = InvalidOptionException('Kwargs hint for `{}` is not a argument of the function'.format(arg_key))
                        raise e

                    for hint_field in KWARGS_HINT_FIELD_MAP.keys():
                        if hint_field in arg_hint:
                            f_kwargs[arg_key][hint_field] = arg_hint[hint_field]

            if not is_disabled:
                safe_scope['DFF'].exported_api_funcs.append({
                    'name'       : f_name,
                    'title'      : title,
                    'description': f_doc,
                    'definition' : f_def,
                    'extraConfig': extra_config or None,
                    'category'   : category or 'general',
                    'tags'       : tags,
                    'args'       : f_args,
                    'kwargs'     : f_kwargs,
                    'integration': integration,
                    'defOrder'   : len(safe_scope['DFF'].exported_api_funcs),
                })

            @functools.wraps(F)
            def dff_api_F(*args, **kwargs):
                # 处理前参数检查检查
                if kwargs_hint:
                    for arg_key, arg_value in kwargs.items():
                        arg_hint = kwargs_hint.get(arg_key) or {}
                        arg_hint_raise_type_error = arg_hint.get('raiseTypeError') or False

                        is_type_convert_succeed = False

                        # 类型检查
                        arg_type = arg_hint.get('type')
                        if arg_type:
                            arg_type_converter = KWARGS_HINT_TYPE_CONVERTER.get(arg_type)
                            try:
                                arg_value = arg_type_converter(arg_value)
                                kwargs[arg_key] = arg_value
                            except Exception as e:
                                if arg_hint_raise_type_error:
                                    exception_message = ''.join(traceback.format_exception_only(type(e), e))
                                    e = TypeError('Invalid type of argument `{}`. {}'.format(arg_key, exception_message))
                                    raise e
                            else:
                                is_type_convert_succeed = True

                        # 值检查
                        if is_type_convert_succeed is True:
                            arg_in = arg_hint.get('in')
                            if arg_in:
                                if arg_value not in arg_in:
                                    arg_in_list = ', '.join([repr(x) for x in arg_in])
                                    e = ValueError('Invalid value of argument `{}`. Value should be one of `{}`, got `{}`'.format(arg_key, arg_in_list, repr(arg_value)))
                                    raise e

                            arg_not_in = arg_hint.get('notIn')
                            if arg_not_in:
                                if arg_value in arg_not_in:
                                    arg_not_in_list = ', '.join([repr(x) for x in arg_not_in])
                                    e = ValueError('Invalid value of argument `{}`. Value should NOT be one of `{}`, got `{}`'.format(arg_key, arg_not_in_list, repr(arg_value)))
                                    raise e

                            arg_min_length = arg_hint.get('minLength')
                            if arg_min_length:
                                if len(arg_value) < arg_min_length:
                                    e = ValueError('Invalid length of argument `{}`. Min length is `{}`'.format(arg_key, arg_min_length))
                                    raise e

                            arg_max_length = arg_hint.get('maxLength')
                            if arg_max_length:
                                if len(arg_value) > arg_max_length:
                                    e = ValueError('Invalid length of argument `{}`. Max length is `{}`'.format(arg_key, arg_max_length))
                                    raise e

                            arg_min_value = arg_hint.get('minValue')
                            if arg_min_value:
                                if arg_value < arg_min_value:
                                    e = ValueError('Invalid value of argument `{}`. Min value is `{}`'.format(arg_key, arg_min_value))
                                    raise e

                            arg_max_value = arg_hint.get('maxValue')
                            if arg_max_value:
                                if arg_value < arg_max_value:
                                    e = ValueError('Invalid value of argument `{}`. Max value is `{}`'.format(arg_key, arg_max_value))
                                    raise e

                return F(*args, **kwargs)

            return dff_api_F
        return decorater

    def _log(self, safe_scope, message):
        message_time = arrow.get().to('Asia/Shanghai').format('YYYY-MM-DD HH:mm:ss')
        line = '[{}] {}'.format(message_time, message)
        safe_scope['DFF'].log_messages.append(line)

    def _plot(self, safe_scope, ts_data):
        # TODO
        pass

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
            e = DuplicationException('{} -> [{}]'.format(func_chain_info, func_id))
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
            func_extra_config = ujson.loads(func['extraConfigJSON'])

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

        queue = toolkit.get_worker_queue(safe_scope.get('_DFF_QUEUE') or CONFIG['_WORKER_DEFAULT_QUEUE'])
        if safe_scope.get('_DFF_DEBUG'):
            queue = toolkit.get_worker_queue(CONFIG['_WORKER_DEFAULT_QUEUE'])

        task_headers = {
            'origin': self.request.id,
        }
        task_kwargs = {
            'funcId'         : func_id,
            'funcKwargs'     : kwargs,
            'saveResult'     : save_result,
            'rootTaskId'     : safe_scope.get('_DFF_ROOT_TASK_ID'),
            'funcChain'      : func_chain,
            'execMode'       : 'async',
            'triggerTime'    : safe_scope.get('_DFF_TRIGGER_TIME'),
            'crontab'        : safe_scope.get('_DFF_CRONTAB'),
            'crontabConfigId': safe_scope.get('_DFF_CRONTAB_CONFIG_ID'),
        }

        from worker.tasks.dataflux_func.runner import dataflux_func_runner
        dataflux_func_runner.apply_async(
            task_id=gen_task_id(),
            kwargs=task_kwargs,
            headers=task_headers,
            queue=queue,
            soft_time_limit=soft_time_limit,
            time_limit=time_limit,
            expires=expires)

    def create_safe_scope(self, script_name=None, script_dict=None, imported_script_dict=None, extra_vars=None):
        '''
        创建安全脚本作用域
        '''
        script_dict          = script_dict          or {}
        imported_script_dict = imported_script_dict or {}

        safe_scope = {
            '__name__'    : script_name or '<script>',
            '__file__'    : script_name or '<script>',
            '__builtins__': {},
        }

        if extra_vars:
            for k, v in extra_vars.items():
                if k not in safe_scope:
                    safe_scope[k] = v

        for name in dir(six.moves.builtins):
            if name in UNSAFE_BUILTIN_NAMES:
                continue

            safe_scope['__builtins__'][name] = six.moves.builtins.__getattribute__(name)

        # 自定义import实现
        def __custom_import(name, globals=None, locals=None, fromlist=None, level=0):
            return self._custom_import(script_dict, imported_script_dict,
                name, globals, locals, fromlist, level, safe_scope)

        # 注入方便函数
        def __export_as_api(title=None, category=None, tags=None, **extra_config):
            return self._export_as_api(safe_scope, title, category, tags, **extra_config)

        def __get_data_source_helper(data_source_id, **helper_kwargs):
            return self._get_data_source_helper(data_source_id, **helper_kwargs)

        def __get_env_variable(env_variable_id):
            return self._get_env_variable(env_variable_id)

        def __log(message):
            return self._log(safe_scope, message)

        def __plot(ts_data):
            return self._log(safe_scope, ts_data)

        def __print(*args, **kwargs):
            return self._print(safe_scope, *args, **kwargs)

        def __call_func(func_id, kwargs=None):
            return self._call_func(safe_scope, func_id, kwargs)

        def __eval(expression, *args, **kwargs):
            jailbreak_check(expression)

            return eval(expression, *args, **kwargs)

        safe_scope['__builtins__']['__import__'] = __custom_import
        safe_scope['__builtins__']['print']      = __print

        __async_helper        = FuncAsyncHelper(self)
        __store_helper        = FuncStoreHelper(self, default_scope=script_name)
        __cache_helper        = FuncCacheHelper(self, default_scope=script_name)
        __data_source_helper  = FuncDataSourceHelper(self)
        __env_variable_helper = FuncEnvVariableHelper(self)
        __config_helper       = FuncConfigHelper(self)

        def __list_data_sources():
            return __data_source_helper.list()

        safe_scope['DFF'] = DFFWraper(inject_funcs={
            'export_as_api': __export_as_api,  # 导出为API
            'log'          : __log,            # 输出日志
            'plot'         : __plot,           # 输出图表
            'call_func'    : __call_func,      # 调用函数（新Task）
            'eval'         : __eval,           # 执行Python表达式
            'format_sql'   : format_sql,       # 格式化SQL语句

            '__data_source_helper' : __data_source_helper,  # 数据源处理模块
            '__env_variable_helper': __env_variable_helper, # 环境变量处理模块
            '__async_helper'       : __async_helper,        # 异步处理模块
            '__store_helper'       : __store_helper,        # 存储处理模块
            '__cache_helper'       : __cache_helper,        # 缓存处理模块
            '__config_helper'      : __config_helper,       # 配置处理模块

            # 别名
            'API'   : __export_as_api,
            'SRC'   : __data_source_helper,
            'ENV'   : __env_variable_helper,
            'STORE' : __store_helper,
            'CACHE' : __cache_helper,
            'CONFIG': __config_helper,

            'FUNC' : __call_func,
            'EVAL' : __eval,
            'ASYNC': __async_helper,

            # 历史遗留
            'list_data_sources': __list_data_sources, # 列出数据源
        })

        return safe_scope

    def create_script_dict(self, scripts):
        script_dict = {}
        for s in scripts:
            if not s.get('code'):
                continue

            jailbreak_check(s['code'])

            lru_key = '{0}-{1}'.format(s['id'], s['codeMD5'])

            # 优先从内存缓存中获取编译后的代码对象
            script_code_obj = None
            try:
                script_code_obj = COMPILED_CODE_LRU[lru_key]
            except KeyError as e:
                pass

            if not script_code_obj:
                script_code_obj = compile(s['code'], s['id'], 'exec')
                COMPILED_CODE_LRU[lru_key] = script_code_obj
                self.logger.info('[COMPILE SCRIPT] {}'.format(s['id']))

            script_dict[s['id']] = {
                'id'             : s['id'],
                'publishVersion' : s['publishVersion'],
                'code'           : s['code'],
                'codeMD5'        : s['codeMD5'],
                'codeObj'        : script_code_obj,
                'funcExtraConfig': s.get('funcExtraConfig') or {},
                'scriptSetId'    : s['scriptSetId'],
            }

        self.script_dict = script_dict

        return script_dict

    def safe_exec(self, script_code_obj, globals=None, locals=None, script_dict=None):
        safe_scope = globals or self.create_safe_scope(script_dict=script_dict)
        exec(script_code_obj, safe_scope)

        for obj_name, obj in safe_scope.items():
            if isinstance(obj, ModuleType) and obj_name in sys.modules:
                six.moves.reload_module(obj)

        return safe_scope

    def clean_up(self):
        global CONCURRENT_POOL
        global CONCURRENT_RESULT_MAP

        # 关闭线程池
        if CONCURRENT_POOL:
            self.logger.debug('[ASYNC POOL] Clear')

            CONCURRENT_RESULT_MAP.clear()

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
                    script_code = (self.script_dict.get(filename) or {}).get('code')
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

                # 仅记录脚本的本地变量
                locals_info = []
                if is_in_script:
                    for var_name, var_value in frame.f_locals.items():
                        # 忽略引擎内置变量
                        if var_name in sample_scope or var_name in sample_scope['__builtins__']:
                            continue

                        # 忽略函数/类
                        if str(type(var_value)) in ["<type 'function'>", "<type 'classobj'>"]:
                            continue

                        var_type = type(var_value)
                        var_repr = None
                        var_dump = None
                        if isinstance(var_value, (tuple, list, dict)):
                            # `sort_keys`参数可能导致报UnicodeDecodeError
                            # var_dump = json.dumps(var_value, sort_keys=True, indent=2, default=toolkit.json_dump_default)
                            var_dump = simplejson.dumps(var_value, indent=2, default=toolkit.json_dump_default)
                        else:
                            var_repr = pprint.saferepr(var_value)

                        locals_info_item = {
                            'name': var_name,
                            'type': var_type,
                        }
                        if var_repr:
                            locals_info_item['repr'] = var_repr
                        if var_dump:
                            locals_info_item['dump'] = var_dump

                        locals_info.append(locals_info_item)

                stack_item = {
                    'filename'         : filename,
                    'funcname'         : funcname,
                    'lineNumber'       : line_number,
                    'lineCode'         : line_code,
                    'localsInfo'       : locals_info,
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

from worker.tasks.dataflux_func.debugger        import dataflux_func_debugger
from worker.tasks.dataflux_func.runner          import dataflux_func_runner
from worker.tasks.dataflux_func.starter_crontab import dataflux_func_starter_crontab

from worker.tasks.dataflux_func.utils import dataflux_func_reload_scripts
from worker.tasks.dataflux_func.utils import dataflux_func_sync_cache
from worker.tasks.dataflux_func.utils import dataflux_func_auto_cleaner
from worker.tasks.dataflux_func.utils import dataflux_func_auto_run
from worker.tasks.dataflux_func.utils import dataflux_func_data_source_checker
from worker.tasks.dataflux_func.utils import dataflux_func_data_source_debugger
from worker.tasks.dataflux_func.utils import dataflux_func_worker_queue_pressure_recover
from worker.tasks.dataflux_func.utils import dataflux_func_db_auto_backup
