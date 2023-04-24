#!/usr/bin/env python
# -*- coding: utf-8 -*-

# Built-in Modules
import os
import time
import json
import argparse

EXTRACT_CI_ENVS = [
    'CI_PIPELINE_ID',
    'CI_JOB_ID',
    'CI_BUILD_ID',
]

def main(options):
    image_info = {
        'EDITION'         : options.get('edition'),
        'VERSION'         : os.environ.get('CI_COMMIT_REF_NAME') or '0.0.0',
        'CREATE_TIMESTAMP': int(time.time()),
    }

    for env in EXTRACT_CI_ENVS:
        image_info[env] = os.environ.get(env)

    print(json.dumps(image_info, indent=2))

def get_options_by_command_line():
    arg_parser = argparse.ArgumentParser(description='Image Info Generator')

    arg_parser.add_argument('-e', '--edition', dest='edition', help='Edition')

    args = vars(arg_parser.parse_args())
    args = dict(filter(lambda x: x[1] is not None, args.items()))

    return args

if __name__ == '__main__':
    options = get_options_by_command_line()

    main(options)