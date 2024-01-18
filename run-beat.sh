#!/bin/bash
set -e

# Check Setup
echo "[STARTER] Check CONFIG._IS_INSTALLED"
python _check_setup.py
if [ $? -ne 0 ]; then
    echo 'Setup failed.'
    exit 1
fi

# Run Beat
echo "[STARTER] Run Beat"

set +e
exit_code=8
while [ $exit_code -eq 8 ]; do
    python worker/beat.py
    exit_code=$?
done
