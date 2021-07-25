# -*- coding: utf-8 -*-

import sys
import time
import types
import json
import re
import hmac
from hashlib import sha1, md5
import base64
from email.utils import formatdate

try:
    from urllib import urlencode
except ImportError:
    from urllib.parse import urlencode

try:
    from collections import OrderedDict
except ImportError:
    OrderedDict = dict # New in 2.7

# -----------------------------------------------
# Python2 ~ Python3 Compatibility Code From `six`
# -----------------------------------------------
#
# Copyright (c) 2010-2019 Benjamin Peterson
#
# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software and associated documentation files (the "Software"), to deal
# in the Software without restriction, including without limitation the rights
# to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
# copies of the Software, and to permit persons to whom the Software is
# furnished to do so, subject to the following conditions:
#
# The above copyright notice and this permission notice shall be included in all
# copies or substantial portions of the Software.
#
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
# AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
# SOFTWARE.

PY2 = sys.version_info[0] == 2
PY3 = sys.version_info[0] == 3
PY34 = sys.version_info[0:2] >= (3, 4)

if PY3:
    string_types = str,
    integer_types = int,
    class_types = type,
    text_type = str
    binary_type = bytes
else:
    string_types = basestring,
    integer_types = (int, long)
    class_types = (type, types.ClassType)
    text_type = unicode
    binary_type = str

def ensure_binary(s, encoding='utf-8', errors='strict'):
    if isinstance(s, text_type):
        return s.encode(encoding, errors)
    elif isinstance(s, binary_type):
        return s
    else:
        e = TypeError("not expecting type '%s'" % type(s))
        raise e

def ensure_str(s, encoding='utf-8', errors='strict'):
    if not isinstance(s, (text_type, binary_type)):
        e = TypeError("not expecting type '%s'" % type(s))
        raise e
    if PY2 and isinstance(s, text_type):
        s = s.encode(encoding, errors)
    elif PY3 and isinstance(s, binary_type):
        s = s.decode(encoding, errors)
    return s

if PY3:
    import http.client as httplib
    from urllib.parse import urlsplit, urlparse, urlencode, parse_qs
    long_type = int

else:
    import httplib
    from urllib import urlencode
    from urlparse import urlsplit, urlparse, parse_qs
    long_type = long

MIN_ALLOWED_NS_TIMESTAMP = 1000000000000000000

ESCAPE_REPLACER           = r'\\\1'
RE_ESCAPE_TAG_KEY         = re.compile('([,= ])')
RE_ESCAPE_TAG_VALUE       = RE_ESCAPE_TAG_KEY
RE_ESCAPE_FIELD_KEY       = RE_ESCAPE_TAG_KEY
RE_ESCAPE_MEASUREMENT     = re.compile('([, ])')
RE_ESCAPE_FIELD_STR_VALUE = re.compile('(["\\\\])')

KEYEVENT_STATUS = ('critical', 'error', 'warning', 'info', 'ok')

ASSERT_TYPE_MAPS = {
    'dict': {
        'type'   : (dict, OrderedDict),
        'message': 'should be a dict or OrderedDict',
    },
    'list': {
        'type'   : list,
        'message': 'should be a list',
    },
    'str': {
        'type'   : string_types,
        'message': 'should be a str or unicode',
    },
    'number': {
        'type'   : (integer_types, float),
        'message': 'should be an int or float',
    },
    'int': {
        'type'   : integer_types,
        'message': 'should be an int',
    },
}
def _assert_type(data, data_type, name):
    if not isinstance(data, ASSERT_TYPE_MAPS[data_type]['type']):
        e = Exception('`{0}` {1}, got {2}'.format(name, ASSERT_TYPE_MAPS[data_type]['message'], type(data).__name__))
        raise e
    return data

def assert_dict(data, name):
    return _assert_type(data, 'dict', name)
def assert_list(data, name):
    return _assert_type(data, 'list', name)
def assert_str(data, name):
    return _assert_type(data, 'str', name)
def assert_number(data, name):
    return _assert_type(data, 'number', name)
def assert_int(data, name):
    return _assert_type(data, 'int', name)

def assert_enum(data, name, options):
    if data not in options:
        e = Exception('`{0}` should be one of {1}, got {2}'.format(name, ','.join(options), data))
        raise e
    return data

def assert_tags(data, name):
    assert_dict(data, name)
    for k, v in data.items():
        assert_str(k, 'Key of `{0}`: {1}'.format(name, k))
        assert_str(v, 'Value of `{0}["{1}"]`: {2}'.format(name, k, v))

    return data

def assert_json_str(data, name):
    if isinstance(data, string_types):
        try:
            data = json.dumps(json.loads(data), ensure_ascii=False, sort_keys=True, separators=(',', ':'))
        except Exception as e:
            e = Exception('`{0}` should be a JSON or JSON string, got {1}'.format(name, data))
            raise e

    elif isinstance(data, (dict, OrderedDict, list, tuple)):
        try:
            data = json.dumps(data, ensure_ascii=False, sort_keys=True, separators=(',', ':'))
        except Exception as e:
            e = Exception('`{0}` should be a JSON or JSON string. Error occured during serialization: {1}'.format(name, e))
            raise e

    else:
        e = Exception('`check_value` should be a JSON or JSON string')
        raise e

    return data

def json_copy(j):
    return json.loads(json.dumps(j))

COLORS = {
    'black'  : [30, 39],
    'red'    : [31, 39],
    'green'  : [32, 39],
    'yellow' : [33, 39],
    'blue'   : [34, 39],
    'magenta': [35, 39],
    'cyan'   : [36, 39],
    'white'  : [37, 39],
    'gray'   : [90, 39],
    'grey'   : [90, 39],
}

def colored(s, name):
    if name in COLORS:
        left  = '\033[' + str(COLORS[name][0]) + 'm'
        right = '\033[' + str(COLORS[name][1]) + 'm'

        return left + str(s) + right

    else:
        raise AttributeError("Color '{}' not supported.".format(name))

class DataKit(object):
    def __init__(self, url=None, host=None, port=None, protocol=None, source=None, timeout=None, debug=False, dry_run=False):
        self.host     = host or 'localhost'
        self.port     = int(port or 9529)
        self.protocol = protocol or 'http'
        self.source   = source or 'datakit_python_sdk'
        self.timeout  = timeout or 3
        self.debug    = debug or False
        self.dry_run  = dry_run or False

        if self.debug:
            print('[Python Version]\n{0}'.format(sys.version))
            if self.dry_run:
                print('[DRY RUN MODE]')

        if url:
            splited_url = urlsplit(url)

            if splited_url.scheme:
                self.protocol = splited_url.scheme

            if splited_url.netloc:
                host_port_parts = splited_url.netloc.split(':')
                if len(host_port_parts) >= 1:
                    self.host = host_port_parts[0]
                    if self.protocol == 'https':
                        self.port = 443
                    else:
                        self.port = 80

                if len(host_port_parts) >= 2:
                    self.port = int(host_port_parts[1])

    @classmethod
    def convert_to_ns(self, timestamp=None):
        timestamp = timestamp or time.time()
        timestamp = long_type(timestamp)

        for i in range(3):
            if timestamp < MIN_ALLOWED_NS_TIMESTAMP:
                timestamp *= 1000
            else:
                break

        return timestamp

    @classmethod
    def prepare_line_protocol(cls, points):
        if not isinstance(points, (list, tuple)):
            points = [points]

        lines = []

        for p in points:
            # Influx DB line protocol
            # https://docs.influxdata.com/influxdb/v1.7/write_protocols/line_protocol_tutorial/
            measurement = p.get('measurement')
            measurement = re.sub(RE_ESCAPE_MEASUREMENT, ESCAPE_REPLACER, measurement)

            tag_set_list = []
            tags = p.get('tags') or None
            if tags:
                key_list = sorted(tags.keys())
                for k in key_list:
                    v = tags[k]
                    if not v:
                        continue

                    if isinstance(v, bool):
                        v = '{0}'.format(v).lower()
                    else:
                        v = '{0}'.format(v)

                    k = re.sub(RE_ESCAPE_TAG_KEY, ESCAPE_REPLACER, k)
                    v = re.sub(RE_ESCAPE_TAG_VALUE, ESCAPE_REPLACER, v)

                    tag_set_list.append('{0}={1}'.format(ensure_str(k), ensure_str(v)))

            tag_set = ''
            if len(tag_set_list) > 0:
                tag_set = ',{0}'.format(','.join(tag_set_list))

            field_set_list = []
            fields = p.get('fields') or None
            if fields:
                key_list = sorted(fields.keys())
                for k in key_list:
                    v = fields[k]
                    if v is None:
                        continue

                    k = re.sub(RE_ESCAPE_FIELD_KEY, ESCAPE_REPLACER, k)
                    if isinstance(v, string_types):
                        # 字符串
                        v = re.sub(RE_ESCAPE_FIELD_STR_VALUE, ESCAPE_REPLACER, v)
                        v = '"{0}"'.format(ensure_str(v))

                    elif isinstance(v, bool):
                        # 布尔值
                        v = '{0}'.format(v).lower()

                    elif isinstance(v, integer_types):
                        # 整数
                        v = '{0}i'.format(v)

                    elif isinstance(v, float):
                        # 小数
                        v = '{0}'.format(v)

                    else:
                        # 不支持的类型
                        e = TypeError('Field `{0}` got an invalid data type. type(v)=`{1}`, repr(v)=`{2}`'.format(k, type(v), repr(v)))
                        raise e

                    field_set_list.append('{0}={1}'.format(ensure_str(k), ensure_str(v)))

            field_set = ' {0}'.format(','.join(field_set_list))

            timestamp = p.get('timestamp')
            timestamp = cls.convert_to_ns(timestamp)
            timestamp = ' {0}'.format(timestamp)

            lines.append('{0}{1}{2}{3}'.format(ensure_str(measurement), ensure_str(tag_set), ensure_str(field_set), ensure_str(timestamp)))

        body = '\n'.join(lines)

        return body

    def _do_request(self, method=None, path=None, query=None, body=None, headers=None):
        method = method or 'GET'

        if query:
            path = path + '?' + urlencode(query)
        if body:
            body = ensure_binary(body)

        if self.debug:
            print('[Request] {0} {1}://{2}:{3}{4}'.format(method, ensure_str(self.protocol), ensure_str(self.host), str(self.port), ensure_str(path)))
            print('[Request Headers]\n{0}'.format('\n'.join(['{0}: {1}'.format(k, v) for k, v in (headers or {}).items()]) or '<EMPTY>'))
            if method.upper() != 'GET':
                print('[Request Body]\n{0}'.format(ensure_str(body or '') or '<EMPTY>'))

        resp_status_code = 0
        resp_raw_data    = None
        resp_data        = None
        if not self.dry_run:
            conn = None
            if self.protocol == 'https':
                conn = httplib.HTTPSConnection(self.host, port=self.port, timeout=self.timeout)
            else:
                conn = httplib.HTTPConnection(self.host, port=self.port, timeout=self.timeout)

            conn.request(method, path, body=body, headers=headers)
            resp = conn.getresponse()

            resp_status_code = resp.status
            resp_raw_data    = resp.read()

            resp_content_type = resp.getheader('Content-Type')
            if isinstance(resp_content_type, string_types):
                resp_content_type = resp_content_type.split(';')[0].strip()

            resp_data = resp_raw_data
            if resp_content_type == 'application/json':
                resp_data = json.loads(ensure_str(resp_raw_data))

            if self.debug:
                output = '\n[Response Status Code] {0}\n[Response Body] {1}'.format(resp_status_code, ensure_str(resp_raw_data or '') or '<EMPTY>')

                color = 'green'
                if resp_status_code >= 400:
                    color = 'red'

                print(colored(output, color))

        if resp_status_code >= 400:
            e = Exception(resp_status_code, resp_data)
            raise e

        return resp_status_code, resp_data

    def _do_get(self, path, query=None, headers=None):
        method = 'GET'

        return self._do_request(method=method, path=path, query=query, headers=headers)

    def _do_post(self, path, body, content_type, query=None, headers=None):
        method = 'POST'

        headers = headers or {}
        headers['Content-Type'] = content_type

        return self._do_request(method=method, path=path, query=query, body=body, headers=headers)

    # Low-Level API
    def get(self, path, query=None, headers=None):
        return self._do_get(path=path, query=query, headers=headers)

    def post_line_protocol(self, points, path=None, query=None, headers=None):
        content_type = 'text/plain'

        # break obj reference
        points = json_copy(points)
        if query:
            query = json_copy(query)
        if headers:
            headers = json_copy(headers)

        body = self.prepare_line_protocol(points)

        return self._do_post(path=path, body=body, content_type=content_type, query=query, headers=headers)

    def post_json(self, json_obj, path, query=None, headers=None):
        content_type = 'application/json'

        # break obj reference
        json_obj = json_copy(json_obj)
        if query:
            query = json_copy(query)
        if headers:
            headers = json_copy(headers)

        body = json_obj
        if isinstance(body, (dict, list, tuple)):
            body = json.dumps(body, ensure_ascii=False, separators=(',', ':'))

        return self._do_post(path=path, body=body, content_type=content_type, query=query, headers=headers)

    # High-Level API
    def _prepare_data(self, data):
        assert_dict(data, name='data')

        measurement = assert_str(data.get('measurement'), name='measurement')

        tags = data.get('tags')
        if tags:
            assert_dict(tags, name='tags')
            assert_tags(tags, name='tags')

        fields = assert_dict(data.get('fields'), name='fields')

        timestamp = data.get('timestamp')
        if timestamp:
            assert_number(timestamp, name='timestamp')

        prepared_data = {
            'measurement': measurement,
            'tags'       : tags   or None,
            'fields'     : fields or None,
            'timestamp'  : timestamp,
        }
        return prepared_data

    def _write(self, path, measurement, tags=None, fields=None, timestamp=None):
        data = {
            'measurement': measurement,
            'tags'       : tags,
            'fields'     : fields,
            'timestamp'  : timestamp,
        }

        # break obj reference
        data = json_copy(data)

        prepared_data = self._prepare_data(data)

        query = { 'input': self.source }
        return self.post_line_protocol(points=prepared_data, path=path, query=query)

    def _write_many(self, path, data):
        # break obj reference
        data = json_copy(data)

        prepared_data = []
        for d in data:
            prepared_data.append(self._prepare_data(d))

        query = { 'input': self.source }
        return self.post_line_protocol(points=prepared_data, path=path, query=query)

    def write_by_category(self, category, measurement, tags=None, fields=None, timestamp=None):
        path = '/v1/write/{0}'.format(category)
        return self._write(path, measurement, tags, fields, timestamp)

    def write_by_category_many(self, category, data):
        path = '/v1/write/{0}'.format(category)
        return self._write_many(path, data)

    def write_metric(self, measurement, tags=None, fields=None, timestamp=None):
        return self._write('/v1/write/metric', measurement, tags, fields, timestamp)

    def write_metric_many(self, data):
        return self._write_many('/v1/write/metric', data)

    def write_logging(self, measurement, tags=None, fields=None, timestamp=None):
        return self._write('/v1/write/logging', measurement, tags, fields, timestamp)

    def write_logging_many(self, data):
        return self._write_many('/v1/write/logging', data)

    # 暂不提供
    # def write_rum(self, measurement, tags=None, fields=None, timestamp=None):
    #     return self._write('/v1/write/rum', measurement, tags, fields, timestamp)

    # def write_rum_many(self, data):
    #     return self._write_many('/v1/write/rum', data)

    def query(self, dql, raw=False, dict_output=False, **kwargs):
        q = { 'query': dql }

        for k, v in kwargs.items():
            if v is not None:
                q[k] = v

        json_obj = {
            'queries': [ q ],
        }
        status_code, dql_res = self.post_json(json_obj, '/v1/query/raw')

        # 返回原始返回值
        if raw:
            return status_code, dql_res

        # 解开包装
        dql_series = dql_res['content'][0]['series'] or []
        unpacked_dql_res = {
            'statement_id': 0,
            'series'      : dql_series,
        }

        # 转换为字典格式
        if dict_output:
            dicted_series_list = []
            for series in dql_series:
                dicted_series = []

                values  = series['values']
                columns = series['columns']
                tags    = series.get('tags') or {}
                for row in values:
                    d = dict(zip(columns, row))

                    # 转换为字典后，可能某个字段名就叫`tags`，为避免冲突，属性`tags`自动加下划线
                    tags_field = 'tags'
                    while tags_field in d:
                        tags_field = '_' + tags_field
                    d[tags_field] = tags

                    dicted_series.append(d)

                dicted_series_list.append(dicted_series)

            unpacked_dql_res['series'] = dicted_series_list

        return status_code, unpacked_dql_res

# Alias
Datakit = DataKit
