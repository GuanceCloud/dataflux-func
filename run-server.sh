#!/bin/bash

setup_path="server/setup.js"
main_path="server/app.js"

node ${setup_path}

if [ $? -ne 0 ]; then
    echo 'Setup failed.'
    exit 1
fi

node --expose-gc ${main_path}
