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

class Workspace(object):
    def __init__(self, url=None, host=None, port=None, protocol=None, token=None, timeout=None, debug=False, dry_run=False):
        self.host     = host or 'localhost'
        self.port     = int(port or 9528)
        self.protocol = protocol or 'http'
        self.token    = token
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

            if splited_url.path:
                self.path = splited_url.path

            if splited_url.query:
                parsed_query = parse_qs(splited_url.query)
                if 'token' in parsed_query:
                    self.token = parsed_query['token'][0]

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

        return resp_status_code, resp_data

    def _do_get(self, path, query=None, headers=None):
        method = 'GET'
        path   = path or self.path

        query = query or {}
        if self.token:
            query['token'] = self.token

        return self._do_request(method=method, path=path, query=query, headers=headers)

    def _do_post(self, path, body, content_type, query=None, headers=None, with_rp=False):
        method = 'POST'
        path   = path or self.path

        query = query or {}
        if self.token:
            query['token'] = self.token

        headers = headers or {}
        headers['Content-Type'] = content_type

        return self._do_request(method=method, path=path, query=query, body=body, headers=headers)

    # Low-Level API
    def get(self, path, query=None, headers=None):
        return self._do_get(path=path, query=query, headers=headers)

    def post_line_protocol(self, points, path=None, query=None, headers=None, with_rp=False):
        content_type = 'text/plain'

        # break obj reference
        points = json_copy(points)
        if query:
            query = json_copy(query)
        if headers:
            headers = json_copy(headers)

        body = self.prepare_line_protocol(points)

        return self._do_post(path=path, body=body, content_type=content_type, query=query, headers=headers, with_rp=with_rp)

    def post_json(self, json_obj, path, query=None, headers=None, with_rp=False):
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

        return self._do_post(path=path, body=body, content_type=content_type, query=query, headers=headers, with_rp=with_rp)
