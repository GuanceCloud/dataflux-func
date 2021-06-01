#!/usr/bin/env python
# -*- coding: utf-8 -*-

import sys
import time
import uuid
import json
import hmac
from hashlib import sha1, md5
import types
import base64

try:
    import httplib
    from urllib import urlencode, quote
    from urlparse import urlparse
except ImportError:
    import http.client as httplib
    from urllib.parse import urlparse, urlencode, quote

UPLOAD_DISABLED = False
try:
    import requests
except ImportError:
    UPLOAD_DISABLED = True
    print('Cannot import `requests` module, the WATClient.upload() method is disabled.')

COLOR_MAP = {
    'grey'   : '\033[0;30m',
    'red'    : '\033[0;31m',
    'green'  : '\033[0;32m',
    'yellow' : '\033[0;33m',
    'blue'   : '\033[0;34m',
    'magenta': '\033[0;35m',
    'cyan'   : '\033[0;36m',
}

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
        raise TypeError("not expecting type '%s'" % type(s))

def ensure_str(s, encoding='utf-8', errors='strict'):
    if not isinstance(s, (text_type, binary_type)):
        raise TypeError("not expecting type '%s'" % type(s))
    if PY2 and isinstance(s, text_type):
        s = s.encode(encoding, errors)
    elif PY3 and isinstance(s, binary_type):
        s = s.decode(encoding, errors)
    return s

def colored(s, color=None):
    if not color:
        color = 'yellow'

    color = COLOR_MAP[color]

    return color + '{}\033[0m'.format(s)

class WATClient(object):
    def __init__(self, ak_id=None, ak_secret=None, host=None, port=None, timeout=3, use_https=False, header_fields=None, debug=False):
        self.debug = debug

        self.ak_id     = ak_id
        self.ak_secret = ak_secret

        self.host = host
        self.port = port

        if self.host and ':' in self.host:
            host_port = self.host.split(':')
            self.host = host_port[0]
            self.port = int(host_port[1])

        self.timeout   = timeout
        self.use_https = use_https

        if not self.port:
            if self.use_https:
                self.port = 443
            else:
                self.port = 80

        self.header_fields = {
            'akId'       : 'X-Wat-Ak-Id',
            'akTimestamp': 'X-Wat-Ak-Timestamp',
            'akNonce'    : 'X-Wat-Ak-Nonce',
            'akSign'     : 'X-Wat-Ak-Sign',
            'traceId'    : 'X-Trace-Id',
        }
        if header_fields:
            self.header_fields.update(header_fields)

    def get_sign(self, method, path, timestamp, nonce):
        if timestamp is None:
            timestamp = str(int(time.time()))

        if nonce is None:
            nonce = str(uuid.uuid4().hex)

        string_to_sign = '&'.join([ timestamp, nonce, method.upper(), path])

        if self.debug:
            print('{} {} {}'.format(
                colored('[String to Sign]'),
                colored(self.ak_sign_version, 'cyan'),
                ensure_str(string_to_sign)))

        ak_secret      = ensure_binary(self.ak_secret)
        string_to_sign = ensure_binary(string_to_sign)

        h = hmac.new(ak_secret, string_to_sign, sha1)

        sign = h.hexdigest()
        sign = ensure_str(sign)

        return sign

    def verify_sign(self, sign, method, path, timestamp, nonce):
        expected_sign = self.get_sign(method, path, timestamp, nonce)

        return (sign == expected_sign)

    def get_auth_header(self, method, path):
        timestamp = str(int(time.time()))
        nonce     = uuid.uuid4().hex

        sign = self.get_sign(method, path, timestamp, nonce)

        auth_headers = {
            self.header_fields['akId']       : self.ak_id,
            self.header_fields['akTimestamp']: timestamp,
            self.header_fields['akNonce']    : nonce,
            self.header_fields['akSign']     : sign,
        }
        return auth_headers

    def verify_auth_header(self, headers, method, path):
        timestamp = headers.get(self.header_fields['akTimestamp'], '')
        nonce     = headers.get(self.header_fields['akNonce'], '')
        sign      = headers.get(self.header_fields['akSign'], '')

        return self.verify_sign(sign, method, path, timestamp, nonce)

    def run(self, method, path, query=None, body=None, headers=None, trace_id=None):
        # Prepare method/query/body
        method = method.upper()

        if query:
            path = path + '?' + urlencode(query)

        if body:
            if isinstance(body, (tuple, list, dict)):
                body = json.dumps(body, sort_keys=True, separators=(',', ':'))

            body = ensure_binary(body)

        if self.debug == True:
            print('=' * 50)
            print('{} {} {}'.format(colored('[Request]'), colored(method, 'cyan'), colored(ensure_str(path), 'cyan')))
            if body:
                print('{} {}'.format(colored('[Payload]'), ensure_str(body)))

        # Prepare headers with auth info
        headers = headers or {}
        headers['Content-Type'] = 'application/json'
        if trace_id:
            headers[self.header_fields['traceId']] = trace_id

        if self.ak_id and self.ak_secret:
            auth_headers = self.get_auth_header(method, path)
            headers.update(auth_headers)

        # Do HTTP/HTTPS
        conn = None
        if self.use_https:
            conn = httplib.HTTPSConnection(self.host, port=self.port, timeout=self.timeout)
        else:
            conn = httplib.HTTPConnection(self.host, port=self.port, timeout=self.timeout)

        conn.request(method, path, body=body, headers=headers)

        # Get response
        resp = conn.getresponse()

        resp_status_code = resp.status
        resp_raw_data    = resp.read()

        resp_content_type = resp.getheader('Content-Type')
        if isinstance(resp_content_type, string_types):
            resp_content_type = resp_content_type.split(';')[0].strip()

        if resp_content_type == 'application/json':
            resp_data = json.loads(ensure_str(resp_raw_data))
        else:
            resp_data = resp_raw_data

        if self.debug == True:
            _color = 'green'
            if resp_status_code >= 400:
                _color = 'red'

            print(colored('{} {}'.format('[Response]', resp_status_code), _color))
            print(colored('{} {}'.format('[Payload]', ensure_str(resp_raw_data)), _color))

        return resp_status_code, resp_data

    def upload(self, path, file_buffer, filename=None, query=None, fields=None, headers=None, trace_id=None):
        if UPLOAD_DISABLED:
            raise Exception('`WATClient.upload()` method need `requests` module.')

        # Prepare method/query/fields/file
        method = 'POST'

        if not filename:
            filename = 'uploadfile'

        filename = quote(filename)

        if query:
            path = path + '?' + urlencode(query)

        if fields and not isinstance(fields, dict):
            raise Exception('`fields` should be a plain JSON')

        files = {'files': (filename, file_buffer)}

        if self.debug == True:
            print('=' * 50)
            print('{} {} {}'.format(colored('[Request]'), colored(method, 'cyan'), colored(ensure_str(path), 'cyan')))
            if fields:
                print('{} {}'.format(colored('[Fields]'), ensure_str(json.dumps(fields))))
            if files:
                print('{} {}'.format(colored('[File]'), filename))

        # Preapre HTTP
        url = 'http://{}:{}{}'.format(self.host, self.port, path)
        req = requests.Request('POST', url, data=fields, files=files)
        prepared_req = req.prepare()

        # Prepare headers with auth info
        headers = headers or {}
        if trace_id:
            headers[self.header_fields['traceId']] = trace_id

        if self.ak_id and self.ak_secret:
            auth_headers = self.get_auth_header(method, path)
            headers.update(auth_headers)

        prepared_req.headers.update(headers)

        with requests.Session() as s:
            resp = s.send(prepared_req)

        # Get response
        resp_status_code = resp.status_code
        resp_raw_data    = resp.text

        resp_content_type = resp.headers.get('Content-Type', '').split(';')[0].strip()
        if resp_content_type == 'application/json':
            resp_data = json.loads(resp_raw_data)

        if self.debug == True:
            _color = 'green'
            if resp_status_code >= 400:
                _color = 'red'

            print(colored('{} {}'.format('[Response]', resp_status_code), _color))
            print(colored('{} {}'.format('[Payload]', ensure_str(resp_raw_data)), _color))

        return resp_status_code, resp_data

    def get(self, path, query=None, headers=None, trace_id=None):
        return self.run('GET', path, query, None, headers, trace_id=trace_id)

    def post(self, path, query=None, body=None, headers=None, trace_id=None):
        return self.run('POST', path, query, body, headers, trace_id=trace_id)

    def put(self, path, query=None, body=None, headers=None, trace_id=None):
        return self.run('PUT', path, query, body, headers, trace_id=trace_id)

    def delete(self, path, query=None, headers=None, trace_id=None):
        return self.run('DELETE', path, query, None, headers, trace_id=trace_id)

if __name__ == '__main__':
    c = WATClient('ak-7Qf3KXH8QZOrW8Tf', 'WaYGi4cBsievlfZsNhE3fY40ZB9dI9L3', host='ubuntu18-dev.vm:80')
    c.debug = True

    # 1. GET Request Test
    status_code, resp = c.get('/api/v1/do/ping',
            trace_id='TEST-PY{}-001'.format(sys.version_info[0]))

    # 2. POST Request Test
    body = {
        'echo': {
            'int'    : 1,
            'str'    : 'Hello World',
            'unicode': u'你好，世界！',
            'none'   : None,
            'boolean': True,
        }
    }

    status_code, resp = c.post('/api/v1/do/echo',
            body=body,
            trace_id='TEST-PY{}-002'.format(sys.version_info[0]))

    # 3. UPLOAD Request Test
    if not UPLOAD_DISABLED:
        with open('使用说明_SDK.md', 'rb') as _f:
            file_buffer = _f.read()

        fields = {
            'note': 'This is a Chinese README. 这是一份中文使用说明。'
        }

        status_code, resp = c.upload('/api/v1/files/do/upload',
            file_buffer=file_buffer, filename='使用说明_SDK.md', fields=fields,
            trace_id='TEST-PY{}-003'.format(sys.version_info[0]))
