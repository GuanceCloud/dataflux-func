#!/bin/bash
set -e

case $1 in
    cli|show-command|key-info )
        COMMAND=$1
        ;;

    * )
        echo "DataFlux Func Redis Tool"
        echo "Usage:"
        echo "  $0 cli          : Use CLI to access Redis"
        echo "  $0 show-command : Show CLI command to access Redis"
        echo "  $0 key-info     : Show information of all the keys in Redis"
        exit
        ;;
esac

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

case ${COMMAND} in
    cli )
        redis-cli ${host} ${port} ${db} ${password} --no-auth-warning
        ;;

    show-command )
        echo "redis-cli ${host} ${port} ${db} ${password} --no-auth-warning"
        ;;

    key-info )
        echo "Type,Key,TTL,Mem Usage, Mem Usage Human"
        keys=$(redis-cli ${host} ${port} ${db} ${password} --no-auth-warning keys "*")
        for key in $keys; do
            keyType=$(redis-cli ${host} ${port} ${db} ${password} --no-auth-warning type "$key")
            keyTTL=$(redis-cli ${host} ${port} ${db} ${password} --no-auth-warning ttl "$key")
            keyMemUsage=$(redis-cli ${host} ${port} ${db} ${password} --no-auth-warning memory usage "$key")

            keyMemUsageHuman="${keyMemUsage} Bytes"
            if [ ${keyMemUsage} -gt 1048576 ]; then
                keyMemUsageHuman="$((keyMemUsage / 1048576)) MB"
            elif [ ${keyMemUsage} -gt 1024 ]; then
                keyMemUsageHuman="$((keyMemUsage / 1024)) KB"
            fi

            echo "${keyType},${key},${keyTTL},${keyMemUsage},${keyMemUsageHuman}"
        done
esac
