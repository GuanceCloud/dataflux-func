import os
import re
import json
import argparse

import requirements
from prettytable import PrettyTable, MARKDOWN
import requests

OPTIONS = None

COLOR_MAP = {
    'grey'   : '\033[0;30m',
    'red'    : '\033[0;31m',
    'green'  : '\033[0;32m',
    'yellow' : '\033[0;33m',
    'blue'   : '\033[0;34m',
    'magenta': '\033[0;35m',
    'cyan'   : '\033[0;36m',
}
def colored(s, color=None):
    if not color:
        color = 'yellow'

    color = COLOR_MAP[color]

    return color + '{}\033[0m'.format(s)

def get_options_by_command_line():
    global OPTIONS

    arg_parser = argparse.ArgumentParser(description='OPENSOURCE.md generation tool')

    # GitHub Auth Token
    arg_parser.add_argument('-a', '--auth-token', dest='auth_token', help='GitHub AuthToken')

    args = vars(arg_parser.parse_args())
    args = dict(filter(lambda x: x[1] is not None, args.items()))

    OPTIONS = args

# Fix
NPM_INFO_PATCH = {
    'cssmin'   : { 'license': 'BSD License' },
}
PYPI_INFO_PATCH = {
    'python-memcached' : { 'license': 'Python Software Foundation License' },
    'ujson'            : { 'license': 'BSD License' },
}

CACHE_FILE_NAME  = 'OPENSOURCE.cache.json'
OUTPUT_FILE_NAME = 'OPENSOURCE.md'
CACHE = {}

def load_cache():
    if not os.path.exists(CACHE_FILE_NAME):
        print('No Cache File')
        return

    with open(CACHE_FILE_NAME, 'r') as _f:
        CACHE.update(json.loads(_f.read()))

def save_cache():
    if not CACHE:
        return

    with open(CACHE_FILE_NAME, 'w') as _f:
        _f.write(json.dumps(CACHE, indent=2, ensure_ascii=False))

def get_license_from_github(url):
    if url.find('https://github.com/') < 0:
        return

    url = url.replace('https://github.com/', 'https://api.github.com/repos/').strip('/')

    print(f"{'(From Cache) ' if url in CACHE else ''}[GitHub] Get repo info from GitHub for {url}...")
    if url in CACHE and 'id' in CACHE[url]:
        repo_info = CACHE[url]

    else:
        CACHE.pop(url, None)

        headers = {}

        github_auth_token = OPTIONS.get('auth_token') or os.environ.get('GITHUB_AUTH_TOKEN') or None
        if github_auth_token:
            headers = {
                'Authorization': f'Bearer {github_auth_token}'
            }

        r = requests.get(url, headers=headers, timeout=5)
        repo_info = r.json()
        if 'id' in repo_info:
            CACHE[url] = repo_info

    _license = None
    try:
        _license = repo_info['license']['spdx_id']
    except Exception as e:
        pass

    if _license == 'NOASSERTION':
        return None
    else:
        return _license

def get_npm_opensource_info(package_json_path):
    info = []

    # 加载本地信息
    with open(package_json_path, 'r') as _f:
        packages = json.loads(_f.read())
        for name, version in packages['dependencies'].items():
            info.append({
                'name'   : name,
                'version': version,
            })

    # 从 Npm 查询更多信息
    for index, pkg in enumerate(info):
        url = f"https://registry.npmjs.com/{pkg['name']}/{pkg['version']}"

        print(f"{'(From Cache) ' if url in CACHE else ''}[{index + 1} / {len(info)}] Get more info from Npm for {pkg['name']}@{pkg['version']}...")
        if url in CACHE:
            detail = CACHE[url]

        else:
            CACHE.pop(url, None)

            r = requests.get(url, timeout=5)
            detail = r.json()
            CACHE[url] = detail

        try:
            pkg['license'] = detail['license']
        except Exception as e:
            pass

        try:
            pkg['homepage'] = detail['homepage']
        except Exception as e:
            pass

        if pkg['homepage']:
            _license = get_license_from_github(pkg['homepage'])
            if _license:
                pkg['license'] = _license

        # 补丁
        info_patch = NPM_INFO_PATCH.get(pkg['name'])
        if info_patch:
            pkg.update(info_patch)

    return info

def get_pypi_opensource_info(requirements_txt_path):
    info = []

    # 加载本地信息
    with open(requirements_txt_path, 'r') as _f:
        for pkg in requirements.parse(_f):
            info.append({
                'name'   : pkg.name,
                'version': pkg.specs[0][1],
            })

    # 从 PyPi 查询更多信息
    for index, pkg in enumerate(info):
        url = f"https://pypi.org/pypi/{pkg['name']}/{pkg['version']}/json"

        print(f"{'(From Cache) ' if url in CACHE else ''}[{index + 1} / {len(info)}] Get more info from PyPi for {pkg['name']}=={pkg['version']}...")
        if url in CACHE:
            detail = CACHE[url]

        else:
            CACHE.pop(url, None)

            r = requests.get(url, timeout=5)
            detail = r.json()
            CACHE[url] = detail

        try:
            pkg['license']  = detail['info']['license']
        except Exception as e:
            pass

        try:
            pkg['homepage'] = detail['info']['home_page']
        except Exception as e:
            pass

        if not pkg.get('homepage'):
            try:
                pkg['homepage'] = detail['info']['project_urls']['Homepage']
            except Exception as e:
                pass

        if not pkg.get('homepage'):
            try:
                pkg['homepage'] = detail['info']['project_urls']['Documentation']
            except Exception as e:
                pkg['homepage'] = detail['info']['project_url']

        if pkg['homepage']:
            _license = get_license_from_github(pkg['homepage'])
            if _license:
                pkg['license'] = _license

        # 补丁
        info_patch = PYPI_INFO_PATCH.get(pkg['name'])
        if info_patch:
            pkg.update(info_patch)

    return info

def output_markdown(sections):
    md_lines = [
        '# Open source list\n',
        'DataFlux Func uses the following open source projects.\n',
    ]

    for title, info in sections:
        md_lines.append(f"## {title}\n")

        table = PrettyTable()
        table.align = 'l'
        table.set_style(MARKDOWN)
        table.field_names = [
            'Project',
            'Version',
            'License',
            'Homepage',
        ]

        for pkg in info:
            pkg = dict([ (k, v.strip('"') if isinstance(v, str) else v) for k, v in pkg.items()])

            pkg_license  = pkg.get('license') or 'UNKNOWN'
            pkg_homepage = f"[{pkg['homepage']}]({pkg['homepage']})" if pkg.get('homepage') else '-'

            table.add_row([ pkg['name'], pkg['version'], pkg_license, pkg_homepage ])

        table_str = table.get_string() + '\n'
        md_lines.append(table_str)

    md = '\n'.join(md_lines)
    with open(OUTPUT_FILE_NAME, 'w') as _f:
        _f.write(md)

def main():
    get_options_by_command_line()

    load_cache()

    try:
        sections = []

        print('Get opensource info for Client')
        info = get_npm_opensource_info('client/package.json')
        sections.append(['Client', info])

        print('Get opensource info for Server')
        info = get_npm_opensource_info('package.json')
        sections.append(['Server', info])

        print('Get opensource info for Worker')
        info = get_pypi_opensource_info('requirements.txt')
        sections.append(['Worker', info])

        output_markdown(sections)

    except Exception as e:
        raise

    finally:
        save_cache()

if __name__ == '__main__':
    main()
    print(colored('Done', 'green'))
