# -*- coding: utf-8 -*-

from worker.utils.extra_helpers.datakit import BaseDataKit, PY3, text_type, binary_type, ensure_binary

import sys
import hmac
from hashlib import sha1, md5
import base64
from email.utils import formatdate

if PY3:
    from urllib.parse import urlsplit, urlencode, parse_qs

else:
    from urllib import urlencode
    from urlparse import urlsplit, parse_qs

DEFAULT_MIN_GZIP_BYTES = 20 * 1024

class DataWay(BaseDataKit):
    def __init__(self, *args, token=None, access_key=None, secret_key=None, min_gzip_bytes=DEFAULT_MIN_GZIP_BYTES, **kwargs):
        super().__init__(*args, min_gzip_bytes=min_gzip_bytes, **kwargs)

        if not self.port:
            self.port = 9528

        self.token      = token      or None
        self.access_key = access_key or None
        self.secret_key = secret_key or None

        if self.url:
            splited_url = urlsplit(self.url)

            if splited_url.query:
                parsed_query = parse_qs(splited_url.query)
                if 'token' in parsed_query:
                    self.token = parsed_query['token'][0]

    def _get_body_md5(self, body=None):
        h = md5()
        h.update(ensure_binary(body or ''))

        md5_res = h.digest()
        md5_res = base64.standard_b64encode(md5_res).decode()

        return md5_res

    def _get_sign(self, str_to_sign):
        h = hmac.new(ensure_binary(self.secret_key), ensure_binary(str_to_sign), sha1)

        sign = h.digest()
        sign = base64.standard_b64encode(sign).decode()

        return sign

    def _prepare_auth_headers(self, method, content_type=None, body=None):
        body         = body         or ''
        content_type = content_type or ''

        headers = {}
        if not self.access_key or not self.secret_key:
            return headers

        body_md5 = self._get_body_md5(body)
        date_str = formatdate(timeval=None, localtime=False, usegmt=True)
        str_to_sign = '\n'.join([method, body_md5, content_type, date_str])

        sign = self._get_sign(str_to_sign)

        if self.debug:
            print('\n[String to sign] {0}'.format(json.dumps(str_to_sign)))
            print('[Signature] {0}'.format(json.dumps(sign)))

        headers['Date']          = date_str
        headers['Authorization'] = 'DWAY {0}:{1}'.format(self.access_key, sign)

        return headers

    def _do_get(self, path, query=None, headers=None):
        query = query or {}
        if self.token:
            query['token'] = self.token

        headers = headers or {}
        headers.update(self._prepare_auth_headers(method='GET'))

        return super()._do_get(path=path, query=query, headers=headers)

    def _do_post(self, path, body, content_type, query=None, headers=None):
        query = query or {}
        if self.token:
            query['token'] = self.token

        headers = headers or {}
        headers.update(self._prepare_auth_headers(method='POST'))

        return super()._do_post(path=path, body=body, content_type=content_type, query=query, headers=headers)

    def query(self, *args, **kwargs):
        if not self.token:
            raise Exception('No Workspace Token specified.')

        return super().query(*args, token=self.token, **kwargs)
