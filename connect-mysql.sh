#!/bin/bash
set -e

host=`python _config.py MYSQL_HOST`
port=`python _config.py MYSQL_PORT`
db=`python _config.py MYSQL_DATABASE`
user=`python _config.py MYSQL_USER`
password=`python _config.py MYSQL_PASSWORD`

if [ ${host} ]; then
    host="--host=${host}"
fi
if [ ${port} ]; then
    port="--port=${port}"
fi
if [ ${db} ]; then
    db="--database=${db}"
fi
if [ ${user} ]; then
    user="--user=${user}"
fi
if [ ${password} ]; then
    password="--password=${password}"
fi

mysql ${host} ${port} ${db} ${user} ${password} --ssl-mode=DISABLED $*
