#!/bin/bash
set -e

# init
run-init-scripts.sh

# setup
python _check_setup.py
if [ $? -ne 0 ]; then
    echo 'Setup failed.'
    exit 1
fi

# run worker
celery --app worker --quiet worker --loglevel ERROR
