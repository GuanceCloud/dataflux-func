#!/bin/bash
set -e

# setup
node server/setup.js $*
if [ $? -ne 0 ]; then
    echo 'Setup failed.'
    exit 1
fi

# run server
node --expose-gc server/app.js
