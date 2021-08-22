# -*- coding: utf-8 -*-

'''
Pick text to translate from ejs templates, const.yaml
'''

import re
import os
import sys
import time
import uuid
import types

import yaml

if six.PY2:
    FILE_OPEN_KWARGS = {}
else:
    FILE_OPEN_KWARGS = dict(encoding='utf8')

PROJECT_ROOT = os.path.join(sys.path[0], '../server')

SERVER_TRANSLATE_ROOT       = os.path.join(PROJECT_ROOT, 'translates')
SERVER_EXTRA_TRANSLATE_KEYS = os.path.join(PROJECT_ROOT, 'translates/extra-translate-keys.yaml')
SERVER_PRIVILEGE_KEYS       = os.path.join(PROJECT_ROOT, 'privilege.yaml')
SERVER_TEMPLATE_ROOT        = os.path.join(PROJECT_ROOT, 'views')

# TRANSLATE_SYNTAX_PATTEN = re.compile("""__\((\'|\")(.*?)(\'|\")(\)|\,)""")
# TRANSLATE_SYNTAX_PATTEN = re.compile("""(__\(\'(.*?)\'(\)|\,))|(__\(\"(.*?)\"(\)|\,))""")
TRANSLATE_SYNTAX_PATTEN = re.compile("""(__\(\'(?P<keyInSingle>.+?)\'(\,|\))|__\(\"(?P<keyInDouble>.+?)\"(\,|\)))""")

KEY_PADDING = 50

def get_print_length(s):
    length      = len(s)
    utf8_length = len(s.encode('utf-8'))
    length = (utf8_length - length) / 2 + length

    return int(length)

def get_safe_string(s):
    should_quote = False
    if s.startswith('{'):
        should_quote = True

    if should_quote == False:
        for c in ':"<>=!~':
            if c in s:
                should_quote = True
                break

    if should_quote:
        quote_mark = "'"
        if quote_mark in s:
            quote_mark = '"'
        s = quote_mark + s + quote_mark

    if s.lower() in ('yes', 'no', 'true', 'false', 'on', 'off'):
        s = "'" + s + "'"
    return s

def get_extra_translate_keys():
    """
    Get extra translate keys
    """
    textMap = {}
    with open(SERVER_EXTRA_TRANSLATE_KEYS, 'r', **FILE_OPEN_KWARGS) as _f:
        file_data = _f.read()
        keys = yaml.safe_load(file_data) or []

        for k in keys:
            textMap[k] = None

    print('\n[Extra Translate Keys]')
    print('  ' + '\n  '.join(['{} -> {}'.format(six.ensure_str(k or ''), six.ensure_str(v or '')) for k, v in textMap.items()]))
    return textMap

def get_privilege_keys():
    """
    Get extra translate keys
    """
    textMap = {}
    with open(SERVER_PRIVILEGE_KEYS, 'r', **FILE_OPEN_KWARGS) as _f:
        file_data = _f.read()
        file_json = yaml.safe_load(file_data)

        # Get Role names and descriptions
        for role, info in file_json.get('roles', {}).items():
            if info.get('name'):
                textMap[info.get('name')] = None

            if info.get('desc'):
                textMap[info.get('desc')] = None

        # Get Privilege names and descriptions
        for privilege, info in file_json.get('privileges', {}).items():
            if info.get('name'):
                textMap[info.get('name')] = None

            if info.get('desc'):
                textMap[info.get('desc')] = None

    print('\n[Privilege Keys]')
    print('  ' + '\n  '.join(['{} -> {}'.format(six.ensure_str(k or ''), six.ensure_str(v or '')) for k, v in textMap.items()]))
    return textMap

def get_all_template_paths():
    """
    Get all template file paths.

    :return template_paths <str>[]
    """
    template_paths = []

    for folder_path, _, file_names in os.walk(SERVER_TEMPLATE_ROOT):
        for file_name in file_names:
            if not file_name.endswith('.ejs'):
                continue

            template_paths.append('{}/{}'.format(folder_path, file_name))

    print('\n[All Templates]')
    print('  ' + '\n  '.join(template_paths))
    return template_paths

def get_text_map(template_path):
    """
    Pick all text in template file.

    :return textMap <dict> Text list to be translated
    """
    textMap = {}

    with open(template_path, 'r', **FILE_OPEN_KWARGS) as _f:
        for line in _f:
            m_iter = TRANSLATE_SYNTAX_PATTEN.finditer(line)

            for m in m_iter:
                key = m.group('keyInSingle') or m.group('keyInDouble')
                if key:
                    textMap[six.ensure_str(key)] = None

    print('\n[All Text Map] - ' + template_path)
    print('  ' + '\n  '.join(['{} -> {}'.format(six.ensure_str(k or ''), six.ensure_str(v or '')) for k, v in textMap.items()]))
    return textMap

def get_all_translate_file_paths():
    """
    Get all translate file paths.

    :return translate_file_paths <str>[]
    """
    translate_file_paths = []

    file_names = filter(lambda x: x.endswith('.translate.yaml'), os.listdir(SERVER_TRANSLATE_ROOT))
    translate_file_paths = ['{}/{}'.format(SERVER_TRANSLATE_ROOT, x) for x in file_names]

    print('\n[All Translate Files]')
    print('  ' + '\n  '.join(translate_file_paths))
    return translate_file_paths

def load_translate_file(translate_file_path):
    """
    Load translate.

    :return translate_map <dict>
    """
    translate_map = None
    with open(translate_file_path, 'r', **FILE_OPEN_KWARGS) as _f:
        file_data = _f.read()
        translate_map = yaml.safe_load(file_data) or {}

    print('\n[Translate Map] - ' + translate_file_path)
    print('  ' + '\n  '.join(['{} -> {}'.format(six.ensure_str(k or ''), six.ensure_str(v or '') or '\033[1;31;40m' + str(v) + '\033[0m') for k, v in translate_map.items()]))
    return translate_map

def save_translate_file(translate_file_path, translate_map):
    """
    Save translate
    """
    with open(translate_file_path, 'w', **FILE_OPEN_KWARGS) as _f:
        max_key_len = max([len(k) for k in translate_map.keys()])

        for k in sorted(translate_map.keys(), key=lambda x: x):
            v = translate_map[k]

            key = get_safe_string(k)

            value = 'null'
            if v:
                value = get_safe_string(v)

            key_length = get_print_length(key)
            white_space = ' ' * (KEY_PADDING - key_length)
            _f.writelines(six.ensure_str('{}: {}\n'.format(six.ensure_str(key) + six.ensure_str(white_space), six.ensure_str(value))))

def main():
    all_texts = {}
    all_texts.update(get_extra_translate_keys())
    all_texts.update(get_privilege_keys())

    for p in get_all_template_paths():
        all_texts.update(get_text_map(p))

    for p in get_all_translate_file_paths():
        translate_map = load_translate_file(p);

        output = all_texts.copy()
        output.update(translate_map);
        save_translate_file(p, output)

        print('>>>' + six.ensure_str(p))
        print('OK!')

if __name__ == '__main__':
    main()

