#!/bin/bash
set -e

# Init Script
/bin/bash pre-run-scripts.sh 'worker'

# Check Setup
echo "[STARTER] Check CONFIG._IS_INSTALLED"
python _check_setup.py
if [ $? -ne 0 ]; then
    echo 'Setup failed.'
    exit 1
fi

# Run Worker
echo "[STARTER] Run Worker"

set +e
exit_code=8
while [ $exit_code -eq 8 ]; do
    if [ $# -eq 0 ]; then
        python worker/app.py 0 1 2 3 4 5 6 7 8 9
        exit_code=$?

    else
        python worker/app.py $*
        exit_code=$?
    fi

    sleep 3
done
