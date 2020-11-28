#!/bin/bash

install_path="server/install.js"
main_path="server/app.js"

node ${install_path}

if [ $? -ne 0 ]; then
    echo 'Install failed.'
    exit 1
fi

node --expose-gc ${main_path}
