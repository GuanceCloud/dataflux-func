#!/bin/bash
set -e

# Init Script
/bin/bash run-init-scripts.sh 'worker'

# Check Setup
echo "[STARTER] Check CONFIG._IS_INSTALLED"
python _check_setup.py
if [ $? -ne 0 ]; then
    echo 'Setup failed.'
    exit 1
fi

# Run Worker
echo "[STARTER] Run Worker"
celery --app worker.app --quiet worker --loglevel ERROR
