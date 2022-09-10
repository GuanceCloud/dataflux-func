# -*- coding: utf-8 -*-

import time
import json
import os
import subprocess

ENV_NAMES = [
    'CI_COMMIT_REF_NAME',
    'CI_PIPELINE_ID',
    'CI_JOB_ID',
    'CI_BUILD_ID',
    'TARGETARCH',
]

def main():
    # 创建时间
    image_info = {
        'CREATE_TIMESTAMP': int(time.time()),
    }

    # 环境变量
    for k, v in os.environ.items():
        if k in ENV_NAMES:
            image_info[k] = v

    # 获取 Python 环境版本号
    ret_code, output = subprocess.getstatusoutput('python --version')
    if ret_code > 0:
        raise Exception(f'Get Python version failed, return code = {ret_code}')
    else:
        image_info['PYTHON_VERSION'] = output.split(' ').pop()

    ret_code, output = subprocess.getstatusoutput('node --version')
    if ret_code > 0:
        raise Exception(f'Get Python version failed, return code = {ret_code}')
    else:
        image_info['NODE_VERSION'] = output.lstrip('v')

    print(json.dumps(image_info, indent=2))

if __name__ == '__main__':
    main()
