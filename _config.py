# -*- coding: utf-8 -*-

# Built-in Modules
import os
import argparse

# Project Modules
from worker.utils import yaml_resources

base_path  = os.path.dirname(os.path.abspath(__file__))
CONFIG = yaml_resources.load_config(os.path.join(base_path, './config.yaml'))

def get_options_from_command_line():
    arg_parser = argparse.ArgumentParser(description='DataFlux Func Config Helper')

    # 配置键名
    arg_parser.add_argument('key', metavar='<Config Key>', help='Config Key to get')

    args = vars(arg_parser.parse_args())
    args = dict(filter(lambda x: x[1] is not None, args.items()))

    return args

def main(options):
    key = options.get('key')
    value = CONFIG.get(key)

    print(str(value or ''))

if __name__ == '__main__':
    options = get_options_from_command_line()

    main(options)
