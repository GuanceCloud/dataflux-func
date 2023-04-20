# -*- coding: utf-8 -*-

# Built-in Modules
import os
import sys
import time

# Project Modules
from worker.utils import yaml_resources

CHECK_INTERVAL = 3

BASE_PATH   = os.path.dirname(os.path.abspath(__file__))
CONFIG_PATH = os.path.join(BASE_PATH, './config.yaml')

def disable_setup():
    return yaml_resources.load_config(CONFIG_PATH).get('_DISABLE_SETUP')

def is_installed():
    return yaml_resources.load_config(CONFIG_PATH).get('_IS_INSTALLED')

def main():
    if disable_setup():
        sys.exit(0)

    while not is_installed():
        time.sleep(CHECK_INTERVAL)
        print('Waiting for setup.')

    sys.exit(0)

if __name__ == '__main__':
    main()
