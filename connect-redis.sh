#!/bin/bash
set -e

host=`python _config.py REDIS_HOST`
port=`python _config.py REDIS_PORT`
db=`python _config.py REDIS_DATABASE`
user=`python _config.py REDIS_USER`
password=`python _config.py REDIS_PASSWORD`
authtype=`python _config.py REDIS_AUTH_TYPE`

if [ ${host} ]; then
    host="-h ${host}"
fi
if [ ${port} ]; then
    port="-p ${port}"
fi
if [ ${db} ]; then
    db="-n ${db}"
fi
if [ ${password} ]; then
    if [ ${authtype} = "aliyun" ]; then
        password="-a ${user}:${password}"
    else
        password="-a ${password}"
    fi
fi

redis-cli ${host} ${port} ${db} ${password} --no-auth-warning $*
