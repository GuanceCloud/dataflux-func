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

def get_config():
    return yaml_resources.load_config(CONFIG_PATH)

def main():
    if get_config().get('_DISABLE_SETUP'):
        sys.exit(0)

    while True:
        config = get_config()
        if config.get('_IS_INSTALLED'):
            break

        print(f"Waiting for setup, please open http://<IP or Hostname>:{config.get('WEB_PORT')}/ and continue")
        time.sleep(CHECK_INTERVAL)

    sys.exit(0)

if __name__ == '__main__':
    main()
