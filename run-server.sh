#!/bin/bash
set -e

# Init Script
/bin/bash run-init-scripts.sh 'server'

# Run Setup
echo "[STARTER] Run Setup"
node server/setup.js $*
if [ $? -ne 0 ]; then
    echo 'Setup failed.'
    exit 1
fi

# Run Server
echo "[STARTER] Run Server"
node server/app.js
