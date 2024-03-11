# -*- coding: utf-8 -*-

# Built-in Modules
import os
import sys
import argparse

# 禁止标准输出
class NoOutput(object):
    def nope(self, *args, **kwargs):
        pass

    def __getattr__(self, name):
        return self.nope

def get_options_from_command_line():
    arg_parser = argparse.ArgumentParser(description='DataFlux Func Config Helper')

    # 配置键名
    arg_parser.add_argument('key', metavar='<Config Key>', help='Config Key to get')

    args = vars(arg_parser.parse_args())
    args = dict(filter(lambda x: x[1] is not None, args.items()))

    return args

def main(options):
    # Project Modules
    from worker.utils import yaml_resources
    BASE_PATH = os.path.dirname(os.path.abspath(__file__))
    CONFIG    = yaml_resources.load_config(os.path.join(BASE_PATH, './config.yaml'))

    key = options.get('key')
    value = CONFIG.get(key)

    print(str(value or ''), file=sys.__stdout__, flush=True)

if __name__ == '__main__':
    options = get_options_from_command_line()

    sys.stdout = NoOutput()
    main(options)
