#!/bin/bash
set -e

# generate zht
python tools/gen-zht.py

# build client
VUE_APP_SERVER_BASE_URL=/
echo "Server Base URL: ${VUE_APP_SERVER_BASE_URL}"

cd client
npm run build
