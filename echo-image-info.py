# -*- coding: utf-8 -*-

import time
import json
import os

EXTRACT_CI_ENVS = [
    'CI_PIPELINE_ID',
    'CI_JOB_ID',
    'CI_BUILD_ID',
]

def main():
    image_info = {
        'VERSION'         : os.environ.get('CI_COMMIT_REF_NAME') or '0.0.0',
        'CREATE_TIMESTAMP': int(time.time()),
    }

    for env in EXTRACT_CI_ENVS:
        image_info[env] = os.environ.get(env)

    print(json.dumps(image_info, indent=2))

if __name__ == '__main__':
    main()
