#!/bin/bash
set -e

# init
init.sh

# setup
node server/setup.js $*
if [ $? -ne 0 ]; then
    echo 'Setup failed.'
    exit 1
fi

# run server
node server/app.js
