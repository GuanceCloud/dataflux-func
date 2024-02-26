# -*- coding: utf-8 -*-

# Built-in Modules
import re

# 3rd-party Modules
import six
import xmltodict
import requests

# Project Modules
from worker.utils import toolkit

SQL_PARAM_ESCAPE_MAP = {
    '\0'  : '\\0',
    '\b'  : '\\b',
    '\t'  : '\\t',
    '\n'  : '\\n',
    '\r'  : '\\r',
    '\x1a': '\\Z',
    '"'   : '\\"',
    '\''  : '\\\'',
    '\\'  : '\\\\',
}

class HexStr(str):
    pass

def parse_response(response):
    resp_content_type = response.headers.get('content-type') or ''
    resp_content_type = resp_content_type.lower().split(';')[0].strip()

    if resp_content_type == 'application/json':
        # return response.json()
        return toolkit.json_loads(response.text)

    elif resp_content_type == 'text/xml':
        return xmltodict.parse(response.text)

    else:
        try:
            return toolkit.json_loads(response.text)

        except ValueError:
            try:
                return xmltodict.parse(response.text)

            except xmltodict.expat.ExpatError:
                return response.content

            except:
                raise

        except:
            raise

def escape_sql_param(s):
    if s is None:
        return 'NULL'

    elif s in (True, False):
        s = str(s)
        s = s.upper()
        return s

    elif isinstance(s, six.string_types):
        is_hex_str = isinstance(s, HexStr)

        s = six.ensure_str(s)
        s = ''.join(SQL_PARAM_ESCAPE_MAP.get(c, c) for c in list(s))
        s = "'{}'".format(six.ensure_str(s))
        if is_hex_str:
            s = 'X' + s
        return s

    elif isinstance(s, (six.integer_types, float)):
        return str(s)

    else:
        s = str(s)
        s = "'{}'".format(s)
        return s

def format_sql(sql, sql_params=None):
    if not sql_params:
        return sql

    sql_format_data = {}

    for sql_params_index in range(len(sql_params)):
        sql_param = sql_params[sql_params_index]

        placeholder_position = sql.find('?')

        if placeholder_position >= 0:
            placeholder       = '__sql_placeholder_{}'.format(sql_params_index)
            placeholder_token = '{' + placeholder + '}'

            if (placeholder_position != len(sql) - 1) and (sql[placeholder_position + 1] == '?'):
                # Found placeholder without escaping
                sql = sql.replace('??', placeholder_token, 1)
                sql_format_data[placeholder] = str(sql_param)

            else:
                if isinstance(sql_param, dict):
                    # Dict -> field = 'Value', ...
                    expressions = []
                    for k, v in sql_param.items():
                        if v is None:
                            expressions.append('{} = NULL'.format(k))

                        else:
                            expressions.append("{} = {}".format(k, escape_sql_param(v)))

                    sql = sql.replace('?', placeholder_token, 1)
                    sql_format_data[placeholder] = ', '.join(expressions)

                elif isinstance(sql_param, (tuple, list, set)):
                    # Tuple, List -> 'value1', 'value2', ...
                    expressions = []
                    for x in sql_param:
                        if isinstance(x, (tuple, list, set)):
                            values = [escape_sql_param(v) for v in x]
                            expressions.append('({})'.format(', '.join(values)))

                        else:
                            expressions.append(escape_sql_param(x))

                    sql = sql.replace('?', placeholder_token, 1)
                    sql_format_data[placeholder] = ', '.join(expressions)

                else:
                    # Other -> 'value'
                    sql = sql.replace('?', placeholder_token, 1)
                    sql_format_data[placeholder] = escape_sql_param(sql_param)

    sql = sql.format(**sql_format_data)

    return sql.strip()

def format_sql_v2(sql, sql_params=None, pretty=False):
    # Inspired by https://github.com/mysqljs/sqlstring/blob/master/lib/SqlString.js
    if not sql_params:
        return sql

    if not isinstance(sql_params, (list, tuple)):
        sql_params = [sql_params]

    result          = ''
    placeholder_re  = re.compile('\?+', re.M)
    chunk_index     = 0
    sql_param_index = 0

    for m in re.finditer(placeholder_re, sql):
        if sql_param_index >= len(sql_params):
            break

        placeholder = m.group()
        if len(placeholder) > 2:
            continue

        sql_param = sql_params[sql_param_index]

        escaped_sql_param = str(sql_param)
        if placeholder == '?':
            if isinstance(sql_param, dict):
                # Dict -> field = 'Value', ...
                expressions = []
                for k, v in sql_param.items():
                    if v is None:
                        expressions.append('{} = NULL'.format(k))

                    else:
                        expressions.append("{} = {}".format(k, escape_sql_param(v)))

                escaped_sql_param = (',\n  ' if pretty else ', ').join(expressions)

            elif isinstance(sql_param, (tuple, list, set)):
                # Tuple, List -> 'value1', 'value2', ...
                expressions = []
                for x in sql_param:
                    if isinstance(x, (tuple, list, set)):
                        values = [escape_sql_param(v) for v in x]
                        expressions.append('({})'.format(', '.join(values)))

                    else:
                        expressions.append(escape_sql_param(x))

                escaped_sql_param = (',\n  ' if pretty else ', ').join(expressions)

            else:
                # Other -> 'value'
                escaped_sql_param = escape_sql_param(sql_param)

        start_index, end_index = m.span()
        result += sql[chunk_index:start_index] + escaped_sql_param
        chunk_index = end_index
        sql_param_index += 1

    if chunk_index == 0:
        return sql

    if chunk_index < len(sql):
        return result + sql[chunk_index:]

    return result.strip()

def to_db_res_dict(cur, db_res):
    fields = [desc[0] for desc in cur.description]
    db_res_dict = None
    if db_res:
        db_res_dict = [dict(zip(fields, row)) for row in db_res]

    return db_res_dict or db_res

class WhereSQLGenerator(object):
    OP_MAP = {
        '=' : 'eq',
        '==': 'eq',
        '!=': 'ne',
        '<>': 'ne',
        '<' : 'lt',
        '>' : 'gt',
        '<=': 'ge',
        '>=': 'le',

        'contains'      : 'like',
        'contains_ci'   : 'like_ci',
        'notcontains'   : 'notlike',
        'notcontains_ci': 'notlike_ci',

        'in': 'in_',

        'jsonarrayhas'   : 'json_array_has',
        'jsonarrayhasany': 'json_array_has_any',
        'jsonarrayhasany': 'json_array_has_all',
        'jsonsearchone'  : 'json_search_one',
        'jsonsearchnone' : 'json_search_none',
        'jsonsearchany'  : 'json_search_any',
        'jsonsearchall'  : 'json_search_all',
    }

    @classmethod
    def run(cls, op, f, v):
        op = op.lower()
        op = cls.OP_MAP.get(op, op)
        op_func = getattr(cls, op)
        return op_func(f, v)

    @classmethod
    def raw(cls, f, v):
        sql = v
        return v

    @classmethod
    def isnull(cls, f, v):
        if toolkit.to_boolean(v):
            return f"{f} IS NULL"
        else:
            return f"{f} IS NOT NULL"

    @classmethod
    def isnotnull(cls, f, v):
        if toolkit.to_boolean(v):
            return f"{f} IS NOT NULL"
        else:
            return f"{f} IS NULL"

    @classmethod
    def isempty(cls, f, v):
        if toolkit.to_boolean(v):
            return f"{f} IS NULL OR TRIM({f}) = ''"
        else:
            return f"{f} IS NOT NULL AND TRIM({f}) != ''"

    @classmethod
    def isnotempty(cls, f, v):
        if toolkit.to_boolean(v):
            return f"{f} IS NOT NULL AND TRIM({f}) != ''"
        else:
            return f"{f} IS NULL OR TRIM({f}) = ''"

    @classmethod
    def boolean(cls, f, v):
        return f"{f} = {toolkit.to_boolean(v)}"

    @classmethod
    def eq(cls, f, v):
        return f"{f} = {escape_sql_param(v)}"

    @classmethod
    def eqwithnull(cls, f, v):
        if v == '_NULL':
            return f"{f} IS NULL"
        else:
            return f"{f} = {escape_sql_param(v)}"

    @classmethod
    def eqornull(cls, f, v):
        return f"{f} = {escape_sql_param(v)} OR {f} IS NULL"

    @classmethod
    def ne(cls, f, v):
        return f"{f} != {escape_sql_param(v)}"

    @classmethod
    def neornull(cls, f, v):
        return f"{f} != {escape_sql_param(v)} OR {f} IS NULL"

    @classmethod
    def gt(cls, f, v):
        return f"{f} > {escape_sql_param(v)}"

    @classmethod
    def lt(cls, f, v):
        return f"{f} < {escape_sql_param(v)}"

    @classmethod
    def ge(cls, f, v):
        return f"{f} >= {escape_sql_param(v)}"

    @classmethod
    def le(cls, f, v):
        return f"{f} <= {escape_sql_param(v)}"

    @classmethod
    def like(cls, f, v):
        return f"{f} LIKE {escape_sql_param('%' + v + '%')}"

    @classmethod
    def like_ci(cls, f, v):
        return f"LOWER({f}) LIKE LOWER({escape_sql_param('%' + v + '%')})"

    @classmethod
    def notlike(cls, f, v):
        return f"{f} NOT LIKE {escape_sql_param('%' + v + '%')}"

    @classmethod
    def notlike_ci(cls, f, v):
        return f"LOWER({f}) NOT LIKE LOWER({escape_sql_param('%' + v + '%')})"

    @classmethod
    def prelike(cls, f, v):
        return f"{f} LIKE {escape_sql_param(v + '%')}"

    @classmethod
    def prelike_ci(cls, f, v):
        return f"LOWER({f}) LIKE LOWER({escape_sql_param(v + '%')})"

    @classmethod
    def suflike(cls, f, v):
        return f"{f} LIKE {escape_sql_param('%' + v)}"

    @classmethod
    def suflike_ci(cls, f, v):
        return f"LOWER({f}) LIKE LOWER({escape_sql_param('%' + v)})"

    @classmethod
    def pattern(cls, f, v):
        if '*' in v:
            return f"{f} REGEXP {escape_sql_param(toolkit.gen_reg_exp_by_wildcard(v))}"
        else:
            return f"{f} = {escape_sql_param(v)}"

    @classmethod
    def notpattern(cls, f, v):
        if '*' in v:
            return f"{f} NOT REGEXP {escape_sql_param(toolkit.gen_reg_exp_by_wildcard(v))}"
        else:
            return f"{f} != {escape_sql_param(v)}"

    @classmethod
    def in_(cls, f, v):
        v = toolkit.as_array(v)
        values = [escape_sql_param(x) for x in v]
        return f"{f} IN ({', '.join(values)})"

    @classmethod
    def notin(cls, f, v):
        v = toolkit.as_array(v)
        values = [escape_sql_param(x) for x in v]
        return f"{f} NOT IN ({', '.join(values)})"

    @classmethod
    def json_array_has(cls, f, v):
        return f"JSON_CONTAINS({f}, {escape_sql_param(v)})"

    @classmethod
    def json_array_has_any(cls, f, v):
        v = toolkit.as_array(v)
        sql_parts = []
        for vv in v:
            sql_parts.append(f"JSON_CONTAINS({f}, {escape_sql_param(vv)})")

        return ' OR '.join(sql_parts)

    @classmethod
    def json_array_has_any(cls, f, v):
        v = toolkit.as_array(v)
        sql_parts = []
        for vv in v:
            sql_parts.append(f"JSON_CONTAINS({f}, {escape_sql_param(vv)})")

        return ' AND '.join(sql_parts)

    @classmethod
    def json_search_one(cls, f, v):
        _field, _path = f.split('->')
        return f"JSON_SEARCH({_field}, 'one', {escape_sql_param(v)}, NULL, {escape_sql_param(_path)}) IS NOT NULL"

    @classmethod
    def json_search_none(cls, f, v):
        _field, _path = f.split('->')
        return f"JSON_SEARCH({_field}, 'one', {escape_sql_param(v)}, NULL, {escape_sql_param(_path)}) IS NULL"

    @classmethod
    def json_search_any(cls, f, v):
        v = toolkit.as_array(v)

        _field, _path = f.split('->')
        sql_parts = []
        for vv in v:
            sql_parts.append(f"JSON_SEARCH({_field}, 'one', {escape_sql_param(vv)}, NULL, {escape_sql_param(_path)}) IS NOT NULL")

        return ' OR '.join(sql_parts)

    @classmethod
    def json_search_all(cls, f, v):
        v = toolkit.as_array(v)

        _field, _path = f.split('->')
        sql_parts = []
        for vv in v:
            sql_parts.append(f"JSON_SEARCH({_field}, 'one', {escape_sql_param(vv)}, NULL, {escape_sql_param(_path)}) IS NOT NULL")

        return ' ALL '.join(sql_parts)

from .guance_helper          import GuanceHelper
from .datakit_helper         import DataKitHelper
from .dataway_helper         import DataWayHelper
from .sidecar_helper         import SidecarHelper
from .influxdb_helper        import InfluxDBHelper
from .mysql_helper           import MySQLHelper
from .redis_helper           import RedisHelper
from .memcached_helper       import MemcachedHelper
from .clickhouse_helper      import ClickHouseHelper
from .postgresql_helper      import PostgreSQLHelper
from .mongodb_helper         import MongoDBHelper
from .elasticsearch_helper   import ElasticSearchHelper
from .nsqlookupd_helper      import NSQLookupHelper
from .mqtt_helper            import MQTTHelper
from .kafka_helper           import KafkaHelper

from .oracle_database_helper import OracleDatabaseHelper
from .sqlserver_helper       import SQLServerHelper

from .ding_helper        import DingHelper
from .file_system_helper import FileSystemHelper
from .http_helper        import HTTPHelper
from .shell_helper       import ShellHelper
