# -*- coding: utf-8 -*-

# Builtin Modules
import re
import traceback

# 3rd-party Modules
import six
import arrow

# Project Modules
from worker.utils import toolkit
from worker.utils.extra_helpers import format_sql_v2 as format_sql

def get_config(c):
    ssl = False
    if c.get('protocol') == 'https':
        ssl = True

    config = {
        'host'    : c.get('host'),
        'port'    : c.get('port'),
        'username': c.get('user') or c.get('username'),
        'password': c.get('password'),
        'database': c.get('database'),
        'ssl'     : ssl,
    }
    return config

RESULT_SERIES_FIELD = 'series'

class InfluxDBHelper(object):
    def __init__(self, logger, config, database=None, *args, **kwargs):
        import influxdb

        self.logger = logger

        if database:
            config['database'] = database

        self.config = config
        self.client = influxdb.InfluxDBClient(**get_config(config))

    def __del__(self):
        if not self.client:
            return

        try:
            self.client.close()

        except Exception as e:
            for line in traceback.format_exc().splitlines():
                self.logger.error(line)

        finally:
            self.client = None

    def check(self):
        try:
            self.query('SHOW databases')

        except Exception as e:
            for line in traceback.format_exc().splitlines():
                self.logger.error(line)

            raise Exception(str(e))

    def switch_database(self, database):
        self.logger.debug('[INFLUXDB] Switch DB `{}`'.format(database))
        self.client.switch_database(database)

    def write_point(self, measurement, fields, tags=None, timestamp=None, database=None):
        self.logger.debug('[INFLUXDB] Write `{}`'.format(measurement))

        point = {
            'measurement': measurement,
            'fields'     : fields,
        }
        if isinstance(tags, dict):
            point['tags'] = tags

        if timestamp:
            point['time'] = arrow.get(timestamp).isoformat()

        try:
            db_res = self.client.write_points([point], database=database)

        except Exception as e:
            for line in traceback.format_exc().splitlines():
                self.logger.error(line)

            raise

        else:
            return db_res

    def write_points(self, points, database=None):
        points = toolkit.as_array(points)
        if not points:
            return

        self.logger.debug('[INFLUXDB] Write many ({} points)'.format(len(points)))

        try:
            db_res = self.client.write_points(points, database=database)

        except Exception as e:
            for line in traceback.format_exc().splitlines():
                self.logger.error(line)

            raise

        else:
            return db_res

    def query(self, sql, bind_params=None, database=None, dict_output=False):
        formatted_query = sql + ' '
        if bind_params:
            for k, v in bind_params.items():
                _placeholder  = u'\${}([^a-zA-Z0-9_-])'.format(k)
                _value = u'{}\\1'.format(v)

                if isinstance(v, (six.string_types, six.text_type)):
                    _value = u"'{}'".format(_value)

                formatted_query = re.sub(_placeholder, _value, formatted_query)

        formatted_query = formatted_query.strip()

        self.logger.debug('[INFLUXDB] Query {}'.format(re.sub('\s+', ' ', formatted_query, flags=re.M)))

        try:
            db_res = self.client.query(sql, bind_params=bind_params, database=database)

        except Exception as e:
            for line in traceback.format_exc().splitlines():
                self.logger.error(line)

            raise

        else:
            is_list = isinstance(db_res, (list, tuple))
            db_res = toolkit.as_array(db_res)
            db_res_list = None
            if dict_output is False:
                db_res_list = [x.raw for x in db_res]
            else:
                db_res_list = [self.convert_to_dict(x) for x in db_res]

            if is_list:
                return db_res_list
            else:
                return db_res_list[0]

    def query2(self, sql, sql_params=None, database=None, dict_output=False):
        formatted_sql = format_sql(sql, sql_params)

        self.logger.debug('[INFLUXDB] Query2 {}'.format(re.sub('\s+', ' ', formatted_sql, flags=re.M)))

        try:
            db_res = self.client.query(formatted_sql,database=database)

        except Exception as e:
            for line in traceback.format_exc().splitlines():
                self.logger.error(line)

            raise

        else:
            is_list = isinstance(db_res, (list, tuple))
            db_res = toolkit.as_array(db_res)
            db_res_list = None
            if dict_output is False:
                db_res_list = [x.raw for x in db_res]
            else:
                db_res_list = [self.convert_to_dict(x) for x in db_res]

            if is_list:
                return db_res_list
            else:
                return db_res_list[0]

    def convert_to_dict(self, db_res):
        dict_db_res = {
            RESULT_SERIES_FIELD: []
        }
        for k, v in db_res.raw.items():
            if k == RESULT_SERIES_FIELD:
                continue

            dict_db_res[k] = v

        if RESULT_SERIES_FIELD in db_res.raw:
            for series in db_res.raw[RESULT_SERIES_FIELD]:
                dict_series = []

                columns = series['columns']
                values  = series['values']
                tags    = series.get('tags') or {}
                for row in values:
                    d = {}
                    for index, value in enumerate(row):
                        column = columns[index]
                        d[column] = value

                    tags_field = 'tags'
                    while tags_field in d:
                        tags_field = '_' + tags_field
                    d[tags_field] = tags

                    dict_series.append(d)

                dict_db_res[RESULT_SERIES_FIELD].append(dict_series)

        return dict_db_res

    def get_ts_tags(self, point):
        possible_tags_fields = [k for k in point.keys() if k.endswith('tags')]
        possible_tags_fields.sort()
        tags_field = 'tags'
        if len(possible_tags_fields) > 0:
            tags_field = possible_tags_fields[0]

        tags = point.get(tags_field) or {}
        return tags
