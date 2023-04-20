#!/bin/bash
set -e

# init
/bin/bash run-init-scripts.sh 'worker'

# setup
python _check_setup.py
if [ $? -ne 0 ]; then
    echo 'Setup failed.'
    exit 1
fi

# run worker
celery --app worker.app --quiet worker --loglevel ERROR
