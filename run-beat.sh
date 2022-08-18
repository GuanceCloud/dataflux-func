#!/bin/bash
set -e

# setup
python _check_setup.py
if [ $? -ne 0 ]; then
    echo 'Setup failed.'
    exit 1
fi

# run beat
celery --app=worker --quiet beat --loglevel=ERROR
