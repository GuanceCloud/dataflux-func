import re
import json

import requirements
from prettytable import PrettyTable, MARKDOWN
import requests

# Fix
NPM_INFO_PATCH = {
    'cssmin'   : { 'license': 'BSD License' },
    'babyparse': { 'license': 'MIT' },
}
PYPI_INFO_PATCH = {
    'python-memcached' : { 'license': 'Python Software Foundation License' },
    'timeout-decorator': { 'license': 'MIT' },
    'tomli'            : { 'license': 'MIT' },
    'tomli-w'          : { 'license': 'MIT' },
    'ujson'            : { 'license': 'BSD License' },
}

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
        print(f"[{index + 1} / {len(info)}] Get more info from Npm for {pkg['name']}/{pkg['version']}...")

        r = requests.get(f"https://registry.npmjs.com/{pkg['name']}/{pkg['version']}", timeout=5)
        detail = r.json()

        try:
            pkg['license'] = detail['license']
        except Exception as e:
            pass

        try:
            pkg['homepage'] = detail['homepage']
        except Exception as e:
            pass

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
        print(f"[{index + 1} / {len(info)}] Get more info from PyPi for {pkg['name']}/{pkg['version']}...")

        r = requests.get(f"https://pypi.org/pypi/{pkg['name']}/{pkg['version']}/json", timeout=5)
        detail = r.json()

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
    with open('OPENSOURCE.md', 'w') as _f:
        _f.write(md)

def main():
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

if __name__ == '__main__':
    main()
