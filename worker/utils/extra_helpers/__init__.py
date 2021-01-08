# -*- coding: utf-8 -*-

# Builtin Modules
import re
import json

# 3rd-party Modules
import six
import ujson
import MySQLdb
import xmltodict
from retry import retry
import requests

retry_for_requests = retry((requests.ConnectionError, requests.Timeout), tries=3, delay=1, backoff=2, jitter=(1, 2))

def ensure_str(s):
    if isinstance(s, six.string_types):
        return six.ensure_str(s)
    else:
        return six.ensure_str(str(s))

def parse_response(response):
    resp_content_type = response.headers.get('content-type') or ''
    resp_content_type = resp_content_type.lower().split(';')[0].strip()

    if resp_content_type == 'application/json':
        # return response.json()
        return ujson.loads(response.text)

    elif resp_content_type == 'text/xml':
        return xmltodict.parse(response.text)

    else:
        try:
            return ujson.loads(response.text)

        except ValueError:
            try:
                return xmltodict.parse(response.text)

            except xmltodict.expat.ExpatError:
                return response.content

            except:
                raise

        except:
            raise

def escape_string(s):
    if s is None:
        return 'NULL'

    elif s in (True, False):
        s = str(s)
        s = s.upper()
        return s

    elif isinstance(s, six.string_types):
        s = MySQLdb.escape_string(six.ensure_str(s))
        s = "'{}'".format(six.ensure_str(s))
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
                            expressions.append("{} = {}".format(k, escape_string(v)))

                    sql = sql.replace('?', placeholder_token, 1)
                    sql_format_data[placeholder] = ', '.join(expressions)

                elif isinstance(sql_param, (tuple, list, set)):
                    # Tuple, List -> 'value1', 'value2', ...
                    expressions = []
                    for x in sql_param:
                        if isinstance(x, (tuple, list, set)):
                            values = [escape_string(v) for v in x]
                            expressions.append('({})'.format(', '.join(values)))

                        else:
                            expressions.append(escape_string(x))

                    sql = sql.replace('?', placeholder_token, 1)
                    sql_format_data[placeholder] = ', '.join(expressions)

                else:
                    # Other -> 'value'
                    sql = sql.replace('?', placeholder_token, 1)
                    sql_format_data[placeholder] = escape_string(sql_param)

    sql = sql.format(**sql_format_data)

    return sql.strip()

def format_sql_v2(sql, sql_params=None):
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
                        expressions.append("{} = {}".format(k, escape_string(v)))

                escaped_sql_param = ', '.join(expressions)

            elif isinstance(sql_param, (tuple, list, set)):
                # Tuple, List -> 'value1', 'value2', ...
                expressions = []
                for x in sql_param:
                    if isinstance(x, (tuple, list, set)):
                        values = [escape_string(v) for v in x]
                        expressions.append('({})'.format(', '.join(values)))

                    else:
                        expressions.append(escape_string(x))

                escaped_sql_param = ', '.join(expressions)

            else:
                # Other -> 'value'
                escaped_sql_param = escape_string(sql_param)

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

from .ding_helper            import DingHelper
from .file_system_helper     import FileSystemHelper
from .http_helper            import HTTPHelper
from .mysql_helper           import MySQLHelper
from .shell_helper           import ShellHelper
from .redis_helper           import RedisHelper
from .memcached_helper       import MemcachedHelper
from .influxdb_helper        import InfluxDBHelper
from .clickhouse_helper      import ClickHouseHelper
from .df_dataway_helper      import DFDataWayHelper
from .oracle_database_helper import OracleDatabaseHelper
from .sqlserver_helper       import SQLServerHelper
from .postgresql_helper      import PostgreSQLHelper
from .mongodb_helper         import MongoDBHelper
from .elasticsearch_helper   import ElasticSearchHelper
from .nsqlookupd_helper      import NSQLookupHelper
from .mqtt_helper            import MQTTHelper
