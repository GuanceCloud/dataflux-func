#!/usr/bin/env python
# -*- coding: utf-8 -*-

import sys
import traceback

from worker.utils.extra_helpers.datakit import DataKit
from worker.utils.extra_helpers.dataway import DataWay

def print_sep(title):
    line = '-' * 10
    print('\n{0} [{1}] {2}'.format(line, title, line))

def do_test(client):
    print('#' * 30)
    print('#' + f' TEST {client.__class__.__name__} '.center(28) + '#')
    print('#' * 30)

    points = [
        {
            'measurement': 'M1',
            'tags'       : {'T1': 'X', 'T2': 'Y', 'T3': ''},
            'fields'     : {'F1': 'A', 'F2': 42, 'F3': 4.2, 'F4': True, 'F5': False, 'F6': '', 'F7': None},
            'timestamp'  : 1577808000000000001,
        }, {
            'measurement': 'M1',
            'tags'       : {'T1': 'X'},
            'fields'     : {'F1': 'A'},
            'timestamp'  : 1577808001,
        }, {
            'measurement': '中文指标名',
            'tags'       : {'中文标签': '中文标签值'},
            'fields'     : {'中文字段': '中文字段值'},
        }, {
            'measurement': u'中文指标名2',
            'tags'       : {u'中文标签2': u'中文标签值2'},
            'fields'     : {u'中文字段2': u'中文字段值2'},
        },
        # {
        #     'measurement': 'ArrayField',
        #     'tags'       : {'T1': 'X'},
        #     'fields'     : {
        #         'intArr'  : [ 1, 2, 3, 5, 8 ],
        #         'floatArr': [ 1.1, 2.2, 3.3, 5.5, 8.8 ],
        #         'strArr'  : [ 'A', 'B', 'C' ],
        #         'boolArr' : [ True, False ],
        #     },
        # },
    ]

    print_sep(f'Test Case: {client.__class__.__name__}.prepare_line_protocol(...)')
    line_protocol = client.__class__.prepare_line_protocol(points)
    print(type(line_protocol))
    print(line_protocol)

    if isinstance(client, DataKit):
        print_sep('Test Case: /v1/ping')
        try:
            client.get(path='/v1/ping')

        except Exception as e:
            for line in traceback.format_exc().splitlines():
                print(line)

    print_sep(f'Test Case: {client.__class__.__name__}.post_line_protocol')
    try:
        client.post_line_protocol('/v1/write/metric', points=points, headers={ 'X-Global-Key': 'Test' })

    except Exception as e:
        for line in traceback.format_exc().splitlines():
            print(line)

    bad_points = [
        {
            'measurement': 'M1',
            'tags'       : {'T': 'X'},
            'fields'     : {'F': {}},
            'timestamp'  : 1577808000000000001,
        }, {
            'measurement': 'M1',
            'tags'       : None,
            'fields'     : {'F1': 'A'},
            'timestamp'  : 1577808002,
        }, {
            'measurement': 'M1',
            'fields'     : {'F1': 'A'},
        },
    ]
    print_sep(f'Test Case: {client.__class__.__name__}.post_line_protocol (Bad points)')
    try:
        client.post_line_protocol('/v1/write/metric', points=bad_points, headers={ 'X-Global-Key': 'Test' })

    except Exception as e:
        for line in traceback.format_exc().splitlines():
            print(line)

    print()

def main(dataway_token):
    clients = [
        DataKit(host='localhost', debug=True),
        DataWay(protocol='https', host='openway.guance.com', port=443, token=dataway_token, debug=True)
    ]
    for c in clients:
        do_test(c)

if __name__ == '__main__':
    dataway_token = 'TOKEN'
    if len(sys.argv) > 1:
        dataway_token = sys.argv[1]

    main(dataway_token)
