# -*- coding: utf-8 -*-

# Builtin Modules
import os
import yaml
import json
import base64
import requests

# Project Modules
from worker.utils import toolkit

# 3rd-party Modules
import six
import ujson

if six.PY2:
    FILE_OPEN_KWARGS = {}
else:
    FILE_OPEN_KWARGS = dict(encoding='utf8')

FILE_CACHE = {};
CONFIG_KEY = 'CONFIG';

def load_file(key, file_path):
    obj = None
    with open(file_path, 'r', **FILE_OPEN_KWARGS) as _f:
        file_content = _f.read()
        obj = yaml.load(file_content)

    if key in FILE_CACHE:
        FILE_CACHE[key].update(obj)
    else:
        FILE_CACHE[key] = obj

    return obj

def load_config(config_file_path, print_detail=False):
    config_obj = load_file(CONFIG_KEY, config_file_path)

    # Collect config field type map
    config_type_map = {}
    for k, v in config_obj.items():
        if isinstance(v, int):
            config_type_map[k] = 'integer'

        elif isinstance(v, float):
            config_type_map[k] = 'float'

        elif isinstance(v, str):
            if k.endswith('_LIST'):
                config_type_map[k] = 'list'

            elif k.endswith('_MAP'):
                config_type_map[k] = 'map'

            else:
                config_type_map[k] = 'string'

        elif isinstance(v, bool):
            config_type_map[k] = 'boolean'

    user_config_path = os.environ.get('CONFIG_FILE_PATH') or config_obj.get('CONFIG_FILE_PATH')
    if not user_config_path:
        # User config path NOT SET
        if print_detail:
            print('[YAML Resource] ENV `CONFIG_FILE_PATH` not set. Use default config')

    else:
        # User config from FILE
        if not os.path.exists(user_config_path):
            if print_detail:
                print('[YAML Resource] Config file `{}` not found. Use default config.'.format(user_config_path))

        else:
            user_config_obj = None
            with open(user_config_path, 'r', **FILE_OPEN_KWARGS) as _f:
                user_config_content = _f.read()
                user_config_obj = yaml.load(user_config_content)

            config_obj.update(user_config_obj)

            if print_detail:
                print('[YAML Resource] Config Overrided by: `{}`'.format(user_config_path))

    # User config from env
    for k, v in os.environ.items():
        if isinstance(v, str) and v.strip() == '':
            continue

        if k in config_obj:
            # Config override
            config_obj[k] = v
            if print_detail:
                print('[YAML Resource] Config item `{}` Overrided by env.'.format(k))

        elif k.startswith('CUSTOM_'):
            # Custom config
            config_obj[k] = v
            if print_detail:
                print('[YAML Resource] Custom config item `{}` added by env.'.format(k))

    # Convert config value type
    for k, v in config_obj.items():
        type_ = config_type_map.get(k)

        if not type_:
            continue
        if v is None:
            continue

        if type_ == 'integer':
            config_obj[k] = int(v)

        elif type_ == 'float':
            config_obj[k] = float(v)

        elif type_ == 'list':
            v = str(v)
            if len(v) > 0:
                config_obj[k] = map(lambda x: x.strip(), v.split(','))
            else:
                config_obj[k] = []

        elif type_ == 'map':
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

        elif type_ == 'boolean':
            config_obj[k] = toolkit.to_boolean(v)

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
