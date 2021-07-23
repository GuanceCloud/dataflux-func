# -*- coding: utf-8 -*-

import os
import sys
import types
import time
import argparse
import traceback
import pprint

import simplejson as json

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

if PY2:
    FILE_OPEN_KWARGS = {}
else:
    FILE_OPEN_KWARGS = dict(encoding='utf8')

COLOR_MAP = {
    'grey'   : '\033[0;30m',
    'red'    : '\033[0;31m',
    'green'  : '\033[0;32m',
    'yellow' : '\033[0;33m',
    'blue'   : '\033[0;34m',
    'magenta': '\033[0;35m',
    'cyan'   : '\033[0;36m',
}
def colored(s, color=None):
    if not color:
        color = 'yellow'

    color = COLOR_MAP[color]

    return color + '{}\033[0m'.format(s)

# ---------------
# End of template
# ---------------

from aliyun_sdk import AliyunClient

PROJECT_ROOT = os.path.join(sys.path[0], '..')

def main(options):
    client = AliyunClient(access_key_id=options.get('ak_id'), access_key_secret=options.get('ak_secret'));

    api_res = client.cdn(Action='RefreshObjectCaches', ObjectType=options.get('object_type'), ObjectPath=options.get('object_path'))

    print(api_res)

def get_options_by_command_line():
    arg_parser = argparse.ArgumentParser(description='Aliyun CDN Refresh tool')

    arg_parser.add_argument('object_type', metavar='<Object Type>')
    arg_parser.add_argument('object_path', metavar='<Object Path>')

    # 阿里云AK
    arg_parser.add_argument('-i', '--access-key-id', dest='ak_id',help='AccessKey ID')
    arg_parser.add_argument('-k', '--access-key-secret', dest='ak_secret',help='AccessKey Secret')

    args = vars(arg_parser.parse_args())
    args = dict(filter(lambda x: x[1] is not None, args.items()))

    return args

if __name__ == '__main__':
    options = get_options_by_command_line()

    main(options)

    print(colored('Done', 'green'))
