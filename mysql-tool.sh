#!/bin/bash
set -e

COMMAND=""

case $1 in
    cli|show-command )
        COMMAND=$1
        ;;

    * )
        echo "DataFlux Func MySQL Tool"
        echo "Usage:"
        echo "  $0 show-command : Show CLI command to access MySQL"
        echo "  $0 cli          : Use CLI to access MySQL"
        exit
        ;;
esac

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

case ${COMMAND} in
    cli )
        mysql ${host} ${port} ${db} ${user} ${password} --ssl-mode=DISABLED
        ;;

    show-command )
        echo "mysql ${host} ${port} ${db} ${user} ${password} --ssl-mode=DISABLED"
        ;;
esac
