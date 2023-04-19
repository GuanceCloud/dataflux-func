# -*- coding: utf-8 -*-

# Built-in Modules
import os
import sys

# Project Modules
from worker.utils import toolkit

# 3rd-party Modules
import six
import yaml
import requests

if six.PY2:
    FILE_OPEN_KWARGS = {}
else:
    FILE_OPEN_KWARGS = dict(encoding='utf8')

FILE_CACHE = {}

# Configure
CONFIG_KEY           = 'CONFIG'
ENV_CONFIG_PREFIX    = 'DFF_'
CUSTOM_CONFIG_PREFIX = 'CUSTOM_'
PRINT_DETAIL         = sys.argv[0].split('/')[-1] == 'celery'

def load_file(key, file_path):
    obj = None
    with open(file_path, 'r', **FILE_OPEN_KWARGS) as _f:
        file_content = _f.read()
        obj = yaml.safe_load(file_content)

    if key in FILE_CACHE:
        FILE_CACHE[key].update(obj)
    else:
        FILE_CACHE[key] = obj

    return obj

def load_config(config_file_path):
    config_obj = load_file(CONFIG_KEY, config_file_path)

    # Collect config field type map
    config_type_map = {}
    for k, v in config_obj.items():
        if v is True or v is False:
            config_type_map[k] = 'boolean'

        elif isinstance(v, int):
            config_type_map[k] = 'integer'

        elif isinstance(v, float):
            config_type_map[k] = 'float'

        else:
            if k.endswith('_LIST') or isinstance(v, (list, tuple)):
                config_type_map[k] = 'list'

            elif k.endswith('_MAP') or isinstance(v, dict):
                config_type_map[k] = 'map'

            else:
                config_type_map[k] = 'string'

    user_config_path = os.environ.get('CONFIG_FILE_PATH') or config_obj.get('CONFIG_FILE_PATH')
    if not user_config_path:
        # User config path NOT SET
        if PRINT_DETAIL:
            print('[YAML Resource] ENV `CONFIG_FILE_PATH` not set. Use default config')

    else:
        # User config from FILE
        if not os.path.exists(user_config_path):
            if PRINT_DETAIL:
                print('[YAML Resource] Config file `{}` not found. Use default config.'.format(user_config_path))

        else:
            user_config_obj = None
            with open(user_config_path, 'r', **FILE_OPEN_KWARGS) as _f:
                user_config_content = _f.read()
                user_config_obj = yaml.safe_load(user_config_content)

            config_obj.update(user_config_obj)

            if PRINT_DETAIL:
                print('[YAML Resource] Config Overrided by: `{}`'.format(user_config_path))

    # User config from env
    for env_k, v in os.environ.items():
        if not env_k.startswith(ENV_CONFIG_PREFIX):
            continue

        k = env_k[len(ENV_CONFIG_PREFIX):]

        if isinstance(v, str) and v.strip() == '':
            continue

        if k in config_obj:
            # Config override
            config_obj[k] = v
            if PRINT_DETAIL:
                print('[YAML Resource] Config item `{}` Overrided by env.'.format(k))

        elif k.startswith(CUSTOM_CONFIG_PREFIX):
            # Custom config
            config_obj[k] = v
            if PRINT_DETAIL:
                print('[YAML Resource] Custom config item `{}` added by env.'.format(k))

    # Convert config value type
    for k, v in config_obj.items():
        type_ = config_type_map.get(k)

        if not type_:
            continue

        if v is None:
            if type_ == 'boolean':
                config_obj[k] = False

            elif type_ == 'integer':
                config_obj[k] = 0

            elif type_ == 'float':
                config_obj[k] = 0.0

            elif type_ == 'list':
                config_obj[k] = []

            elif type_ == 'map':
                config_obj[k] = {}

            elif type_ == 'string':
                config_obj[k] = ''

            continue

        if type_ == 'boolean':
            config_obj[k] = toolkit.to_boolean(v)

        elif type_ == 'integer':
            config_obj[k] = int(v)

        elif type_ == 'float':
            config_obj[k] = float(v)

        elif type_ == 'list' and not isinstance(v, (tuple, list)):
            v = str(v)
            if len(v) > 0:
                config_obj[k] = list(map(lambda x: x.strip(), v.split(',')))
            else:
                config_obj[k] = []

        elif type_ == 'map' and not isinstance(v, dict):
            item_map = {}
            for item in v.split(','):
                item_parts = item.split('=')
                item_k = item_parts[0].strip()
                item_v = ''
                if len(item_parts) > 1:
                    item_v = item_parts[1].strip()
                item_map[item_k] = item_v

            config_obj[k] = item_map

        elif type_ == 'string':
            config_obj[k] = str(v)

    # Remap
    if config_obj.get('__REMAP'):
        for _from, _to in config_obj['__REMAP'].items():
            config_obj[_to] = config_obj.pop(_from, None)

    # Cache
    if CONFIG_KEY in FILE_CACHE:
        FILE_CACHE[CONFIG_KEY].update(config_obj)
    else:
        FILE_CACHE[CONFIG_KEY] = config_obj

    return config_obj

def get(key):
    key = key.replace('.yaml', '')
    resource = FILE_CACHE[key]

    return resource

def get_all():
    return FILE_CACHE
