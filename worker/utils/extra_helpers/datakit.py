# -*- coding: utf-8 -*-

import sys
import time
import types
import json
import re
import math
import ssl
import gzip

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
    from urllib.parse import urlsplit, urlencode, quote
    long_type = int

else:
    import httplib
    from urllib import urlencode
    from urlparse import urlsplit
    long_type = long

MIN_ALLOWED_NS_TIMESTAMP = 1000000000000000000

ESCAPE_REPLACER           = r'\\\1'
RE_NORMALIZE_KEY          = re.compile('\s')
RE_ESCAPE_TAG_KEY         = re.compile('([,= ])')
RE_ESCAPE_TAG_VALUE       = RE_ESCAPE_TAG_KEY
RE_ESCAPE_FIELD_KEY       = RE_ESCAPE_TAG_KEY
RE_ESCAPE_MEASUREMENT     = re.compile('([, ])')
RE_ESCAPE_FIELD_STR_VALUE = re.compile('(["\\\\])')

RE_PATH_QUERY_TOKEN          = re.compile('(tkn_[a-zA-Z0-9_-]{5})[a-zA-Z0-9_-]+([a-zA-Z0-9_-]{5})')
RE_PATH_QUERY_TOKEN_REPLACER = r'\1*****\2'

ASSERT_TYPE_MAPS = {
    'dict': {
        'type'   : dict,
        'message': 'should be a dict',
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
        e = Exception('`{0}` {1}, got {2} (repr: `{3}`)'.format(name, ASSERT_TYPE_MAPS[data_type]['message'], type(data).__name__, repr(data)))
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

    elif isinstance(data, (list, tuple, dict)):
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

def normalize_key(key):
    key = re.sub(RE_NORMALIZE_KEY, ' ', key)
    key = key.rstrip('\\')
    return key

def as_array(d):
    if not isinstance(d, (list, tuple)):
        d = [d]

    return d

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

class BaseDataKit(object):
    def __init__(self, url=None, host=None, port=None, protocol=None, timeout=None, debug=False, dry_run=False, write_size=None, min_gzip_bytes=False, raise_for_status=True, verify_https=True):
        self.url        = url        or None
        self.host       = host       or 'localhost'
        self.port       = port       or None
        self.protocol   = protocol   or 'http'
        self.timeout    = timeout    or 10
        self.debug      = debug      or False
        self.dry_run    = dry_run    or False
        self.write_size = write_size or 100

        self.raise_for_status = raise_for_status or False
        self.verify_https     = verify_https     or False

        if isinstance(min_gzip_bytes, (int, float, str)):
            self.min_gzip_bytes = int(min_gzip_bytes)
        elif isinstance(min_gzip_bytes, bool):
            self.min_gzip_bytes = min_gzip_bytes
        else:
            self.min_gzip_bytes = False

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
        points = as_array(points)

        lines = []

        for p in points:
            # Influx DB line protocol
            # https://docs.influxdata.com/influxdb/v1.7/write_protocols/line_protocol_tutorial/
            measurement = p.get('measurement')
            measurement = normalize_key(measurement)
            measurement = re.sub(RE_ESCAPE_MEASUREMENT, ESCAPE_REPLACER, measurement)

            tag_set_list = []
            tags = p.get('tags') or None
            if tags:
                key_list = sorted(tags.keys())
                for k in key_list:
                    v = tags[k]
                    if v is None:
                        continue

                    if isinstance(v, bool):
                        v = '{0}'.format(v).lower()
                    else:
                        v = '{0}'.format(v)

                    k = normalize_key(k)
                    k = re.sub(RE_ESCAPE_TAG_KEY, ESCAPE_REPLACER, k)

                    v = normalize_key(v)
                    v = re.sub(RE_ESCAPE_TAG_VALUE, ESCAPE_REPLACER, v)

                    k = ensure_str(k)
                    v = ensure_str(v)
                    if k == '' or v == '':
                        continue

                    tag_set_list.append('{0}={1}'.format(k, v))

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

                    k = normalize_key(k)
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

                    elif isinstance(v, list):
                        # 数组
                        elem_list = []

                        if len(v) > 0:
                            for elem in v:
                                if type(v[0]) is not type(elem):
                                    e = TypeError('Field `{0}` got a type-mixed array. repr(v)=`{1}`'.format(k, repr(v)))
                                    raise e

                                if not isinstance(elem, (string_types, bool, integer_types, float)):
                                    e = TypeError('Field `{0}` contains a non-basic type element. repr(v)=`{1}`'.format(k, repr(v)))
                                    raise e

                                if isinstance(elem, string_types):
                                    elem = re.sub(RE_ESCAPE_FIELD_STR_VALUE, ESCAPE_REPLACER, elem)
                                    elem = '"{0}"'.format(ensure_str(elem))
                                elif isinstance(elem, bool):
                                    elem = '{0}'.format(elem).lower()
                                elif isinstance(elem, integer_types):
                                    elem = '{0}i'.format(elem)
                                elif isinstance(elem, float):
                                    elem = '{0}'.format(elem)

                                elem_list.append(elem)

                        v = f"[{','.join(elem_list)}]"

                    else:
                        # 不支持的类型
                        e = TypeError('Field `{0}` got an invalid data type. type(v)=`{1}`, repr(v)=`{2}`'.format(k, type(v), repr(v)))
                        raise e

                    k = ensure_str(k)
                    v = ensure_str(v)
                    if k == '' or v == '':
                        continue

                    field_set_list.append('{0}={1}'.format(k, v))

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

        masked_path = re.sub(RE_PATH_QUERY_TOKEN, RE_PATH_QUERY_TOKEN_REPLACER, path)

        if self.debug:
            print('[Request] {0} {1}://{2}:{3}{4}'.format(method, ensure_str(self.protocol), ensure_str(self.host), str(self.port), ensure_str(masked_path)))
            print('[Request Headers]\n{0}'.format('\n'.join(['{0}: {1}'.format(k, v) for k, v in (headers or {}).items()]) or '<EMPTY>'))
            if method.upper() != 'GET':
                print('[Request Body]\n{0}'.format(ensure_str(body or '') or '<EMPTY>'))

        resp_status_code = 0
        resp_raw_data    = None
        resp_data        = None
        if not self.dry_run:
            conn = None
            if self.protocol == 'https':
                ctx = None if self.verify_https else ssl._create_unverified_context()
                conn = httplib.HTTPSConnection(self.host, port=self.port, timeout=self.timeout, context=ctx)
            else:
                conn = httplib.HTTPConnection(self.host, port=self.port, timeout=self.timeout)

            try:
                headers = headers or {}

                #  gzip 压缩
                use_gzip = False
                if isinstance(self.min_gzip_bytes, bool):
                    use_gzip = self.min_gzip_bytes
                elif len(body) > self.min_gzip_bytes:
                    use_gzip = True

                if use_gzip:
                    body = gzip.compress(body)
                    headers['Content-Encoding'] = 'gzip'

                conn.request(method, path, body=body, headers=headers)

            except Exception as e:
                raise Exception(f'{method} {self.protocol}://{self.host}:{self.port}{masked_path} failed. Error: {str(e)}')

            resp = conn.getresponse()

            resp_status_code = resp.status
            resp_raw_data    = resp.read()

            conn.close()

            resp_data = resp_raw_data
            try:
                resp_data = json.loads(ensure_str(resp_raw_data))
            except Exception as e:
                pass

            if self.debug:
                output = '\n[Response Status Code] {0}\n[Response Body] {1}'.format(resp_status_code, ensure_str(resp_raw_data or '') or '<EMPTY>')

                color = 'green'
                if resp_status_code >= 400:
                    color = 'red'

                print(colored(output, color))

        if resp_status_code >= 400 and self.raise_for_status:
            e = Exception(f'{method} {self.protocol}://{self.host}:{self.port}{masked_path} failed. Status Code: {resp_status_code}, Response: {ensure_str(resp_raw_data)}')
            raise e

        return resp_status_code, resp_data

    def _do_get(self, path, query=None, headers=None):
        return self._do_request(method='GET', path=path, query=query, headers=headers)

    def _do_post(self, path, body, content_type, query=None, headers=None):
        headers = headers or {}
        headers['Content-Type'] = content_type

        return self._do_request(method='POST', path=path, query=query, body=body, headers=headers)

    # Low-Level API
    def get(self, path, query=None, headers=None):
        return self._do_get(path=path, query=query, headers=headers)

    def _get_debug_headers(self, path, points):
        points = as_array(points)

        headers = {}

        x_measurement        = set()
        x_func_id            = set()
        x_func_id            = set()
        x_origin_id          = set()
        x_monitor_checker_id = set()
        for p in points:
            # 指标集
            measurement = p.get('measurement')
            if measurement:
                x_measurement.add(quote(measurement))

            # 函数 ID
            func_id = p['tags'].get('func_id')
            if func_id:
                x_func_id.add(quote(func_id))

            # 来源 ID
            origin_id = p['tags'].get('origin_id')
            if origin_id:
                x_origin_id.add(quote(origin_id))

            # 监控器 ID（观测云特别处理）
            df_monitor_checker_id = p['tags'].get('df_monitor_checker_id')
            if df_monitor_checker_id:
                x_monitor_checker_id.add(quote(df_monitor_checker_id))

        headers['X-DFF-Line-Protocol-Category']    = path.rstrip('/').split('/').pop()
        headers['X-DFF-Line-Protocol-Measurement'] = ','.join(sorted(x_measurement))

        if x_func_id:
            headers['X-DFF-Func-ID'] = ','.join(sorted(x_func_id))

        if x_origin_id:
            headers['X-DFF-Origin-ID'] = ','.join(sorted(x_origin_id))

        if x_monitor_checker_id:
            headers['X-DFF-Monitor-Checker-ID'] = ','.join(sorted(x_monitor_checker_id))

        return headers

    def post_line_protocol(self, path, points, query=None, headers=None):
        content_type = 'text/plain'

        points = as_array(points)

        # break obj reference
        points = json_copy(points)
        if query:
            query = json_copy(query)

        if headers:
            headers = json_copy(headers)
        else:
            headers = {}

        headers.update(self._get_debug_headers(path, points))

        # Group send
        group_count = int(math.ceil(float(len(points)) / float(self.write_size)))

        resp = None
        for group_index in range(group_count):
            _start = self.write_size * group_index
            _end   = self.write_size * group_index + self.write_size
            group = points[_start:_end]

            body = self.prepare_line_protocol(group)
            resp = self._do_post(path=path, body=body, content_type=content_type, query=query, headers=headers)

            if resp[0] >= 400:
                break

        return resp

    def post_json(self, path, json_obj, query=None, headers=None):
        content_type = 'application/json'

        # break obj reference
        json_obj = json_copy(json_obj)
        if query:
            query = json_copy(query)
        if headers:
            headers = json_copy(headers)

        body = json_obj
        if isinstance(body, (list, tuple, dict)):
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

    def _write(self, path, measurement, tags=None, fields=None, timestamp=None, query=None, headers=None):
        data = {
            'measurement': measurement,
            'tags'       : tags,
            'fields'     : fields,
            'timestamp'  : timestamp,
        }

        # break obj reference
        data = json_copy(data)

        prepared_data = self._prepare_data(data)

        return self.post_line_protocol(path=path, points=prepared_data, query=query, headers=headers)

    def _write_many(self, path, data, query=None, headers=None):
        data = as_array(data)

        # break obj reference
        data = json_copy(data)

        prepared_data = []
        for d in data:
            prepared_data.append(self._prepare_data(d))

        return self.post_line_protocol(path=path, points=prepared_data, query=query, headers=headers)

    def write_by_category(self, category, measurement, tags=None, fields=None, timestamp=None, headers=None):
        path = '/v1/write/{0}'.format(category)
        return self._write(path, measurement, tags, fields, timestamp, headers=headers)

    def write_by_category_many(self, category, data, headers=None):
        path = '/v1/write/{0}'.format(category)
        return self._write_many(path, data, headers=headers)

    def write_metric(self, measurement, tags=None, fields=None, timestamp=None, headers=None):
        return self._write('/v1/write/metric', measurement, tags, fields, timestamp, headers=headers)

    def write_metric_many(self, data, headers=None):
        return self._write_many('/v1/write/metric', data, headers=headers)

    def write_logging(self, measurement, tags=None, fields=None, timestamp=None, headers=None):
        return self._write('/v1/write/logging', measurement, tags, fields, timestamp, headers=headers)

    def write_logging_many(self, data, headers=None):
        return self._write_many('/v1/write/logging', data, headers=headers)

    def query(self, dql, all_series=False, dict_output=False, raw=False, token=None, **kwargs):
        q = {
            'query' : dql,
        }
        for k, v in kwargs.items():
            if v is not None:
                q[k] = v

        # 原始结果集
        status_code = None
        dql_res     = {}

        # 翻页限制
        max_page_count = 1
        if all_series:
            if dql.strip().startswith('M::'):
                # 指标类查询最多翻20页
                max_page_count = 20
            else:
                # 非指标类查询最多翻5页
                max_page_count = 5

        for i in range(max_page_count):
            if all_series:
                q['slimit']  = 500
                q['soffset'] = q['slimit'] * i

            path = '/v1/query/raw'
            json_obj = {
                'queries'     : [ q ],
                'mask_visible': True, # 禁用敏感字段屏蔽
            }

            if token:
                json_obj['token'] = token

            status_code, _dql_res = self.post_json(path=path, json_obj=json_obj)
            if not isinstance(_dql_res, dict):
                # 接收到非 JSON 响应，无法翻页，直接返回
                return status_code, _dql_res

            # 确保`series`为数组
            _dql_res['content'][0]['series'] = _dql_res['content'][0].get('series') or []

            # 合并结果集
            if 'content' not in dql_res:
                dql_res.update(_dql_res)
            else:
                dql_res['content'][0]['series'].extend(_dql_res['content'][0]['series'])

            if not all_series:
                # 非自动翻页直接退出
                break

            else:
                # 自动翻页时，获取全部时间线时，翻页结束时退出
                if len(_dql_res['content'][0]['series']) < q['slimit']:
                    break

        # 返回原始返回值
        if raw:
            return status_code, dql_res

        # 解开包装
        dql_series = dql_res['content'][0]['series'] or []
        unpacked_dql_res = {
            'series': dql_series,
        }

        # 结果集转换为字典格式
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

    # 别名
    def write_point(self, *args, **kwargs):
        return self.write_metric(*args, **kwargs)

    def write_points(self, *args, **kwargs):
        return self.write_metric_many(*args, **kwargs)

    def write_metrics(self, *args, **kwargs):
        return self.write_metric_many(*args, **kwargs)

class DataKit(BaseDataKit):
    def __init__(self, *args, source=None, **kwargs):
        super().__init__(*args, **kwargs)

        if not self.port:
            self.port = 9529

        self.source = source or 'datakit-python-sdk'

    # High-Level API
    def _write(self, *args, **kwargs):
        query = {
            'input': self.source,
        }
        return super()._write(query=query, *args, **kwargs)

    def _write_many(self, *args, **kwargs):
        query = {
            'input': self.source,
        }
        return super()._write_many(query=query, *args, **kwargs)
