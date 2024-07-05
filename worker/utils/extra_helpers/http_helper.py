# -*- coding: utf-8 -*-

# Built-in Modules

# 3rd-party Modules
import requests

# Project Modules
from . import parse_response

class HTTPHelper(object):
    def __init__(self, timeout=10):
        self.timeout = timeout

    def get(self, url):
        r = requests.get(url, timeout=self.timeout, verify=False)
        parsed_resp = parse_response(r)

        if r.status_code >= 400:
            e = Exception(r.status_code, r.text)
            raise e

        return parsed_resp

    def post(self, url, data):
        r = requests.post(url, data=data, timeout=self.timeout, verify=False)
        parsed_resp = parse_response(r)

        if r.status_code >= 400:
            e = Exception(r.status_code, r.text)
            raise e

        return parsed_resp
