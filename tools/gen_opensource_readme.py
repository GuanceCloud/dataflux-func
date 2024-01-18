import re
import requirements
import requests

def get_worker_opensource_info():
    print('Get worker opensource info')

    info = []

    # 加载本地信息
    with open('requirements.txt', 'r') as _f:
        for req in requirements.parse(_f):
            info.append({
                'name'   : req.name,
                'version': req.specs[0][1],
            })

    # 从 PyPi 查询更多信息
    for index, req in enumerate(info):
        print(f"[{index + 1} / {len(info)}] Get more info from PyPi for {req['name']}...")

        r = requests.get(f"https://pypi.org/pypi/{req['name']}/{req['version']}/json")
        detail = r.json()

        req['license']  = detail['info']['license']
        req['homepage'] = detail['info']['home_page']

    return info

def main():
    info = get_worker_opensource_info()
    print(info)

if __name__ == '__main__':
    main()
