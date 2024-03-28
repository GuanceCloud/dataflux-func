# -*- coding: utf-8 -*-

import os
import sys
import argparse

from aliyun_sdk import AliyunClient

OPTIONS = None

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

def get_options_by_command_line():
    global OPTIONS

    arg_parser = argparse.ArgumentParser(description='Aliyun CDN Refresh tool')

    arg_parser.add_argument('object_type', metavar='<Object Type>')
    arg_parser.add_argument('object_path', metavar='<Object Path>')

    # 阿里云AK
    arg_parser.add_argument('-i', '--access-key-id', dest='ak_id', help='AccessKey ID')
    arg_parser.add_argument('-k', '--access-key-secret', dest='ak_secret', help='AccessKey Secret')

    args = vars(arg_parser.parse_args())
    args = dict(filter(lambda x: x[1] is not None, args.items()))

    OPTIONS = args

def main():
    get_options_by_command_line()

    client = AliyunClient(access_key_id=OPTIONS.get('ak_id'), access_key_secret=OPTIONS.get('ak_secret'))
    api_res = client.cdn(Action='RefreshObjectCaches', ObjectType=OPTIONS.get('object_type'), ObjectPath=OPTIONS.get('object_path'))

    print(api_res)

if __name__ == '__main__':
    main()
    print(colored('Done', 'green'))
