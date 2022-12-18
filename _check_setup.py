# -*- coding: utf-8 -*-

# Built-in Modules
import os
import sys
import time

# Project Modules
from worker.utils import yaml_resources

CHECK_INTERVAL = 3

base_path   = os.path.dirname(os.path.abspath(__file__))
config_path = os.path.join(base_path, './config.yaml')

def disable_setup():
    return yaml_resources.load_config(config_path).get('_DISABLE_SETUP')

def is_installed():
    return yaml_resources.load_config(config_path).get('_IS_INSTALLED')

def main():
    if disable_setup():
        sys.exit(0)

    while not is_installed():
        time.sleep(CHECK_INTERVAL)
        print('Waiting for setup.')

    sys.exit(0)

if __name__ == '__main__':
    main()
