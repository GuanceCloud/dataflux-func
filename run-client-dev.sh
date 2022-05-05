#!/bin/bash
set -e

# run client DEV
echo "Server Base URL: ${VUE_APP_SERVER_BASE_URL}"

cd client
npm run serve
