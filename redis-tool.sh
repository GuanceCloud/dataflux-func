#!/bin/bash
set -e

case $1 in
    cli|show-command|key-info )
        COMMAND=$1
        ;;

    * )
        echo "DataFlux Func Redis Tool"
        echo "Usage:"
        echo "  $ bash $0 cli                     : Use CLI to access Redis"
        echo "  $ bash $0 show-command            : Show CLI command to access Redis"
        echo "  $ bash $0 key-info                : Show information of all the keys in CSV format"
        echo "  $ bash $0 key-info > key-info.csv : Export information of all the keys into a CSV file"
        exit
        ;;
esac

host=`python _config.py REDIS_HOST`
port=`python _config.py REDIS_PORT`
db=`python _config.py REDIS_DATABASE`
user=`python _config.py REDIS_USER`
password=`python _config.py REDIS_PASSWORD`
authType=`python _config.py REDIS_AUTH_TYPE`

hostOpt=""
portOpt=""
dbOpt=""
passwordOpt=""

if [ ${host} ]; then
    hostOpt="-h ${host}"
fi
if [ ${port} ]; then
    portOpt="-p ${port}"
fi
if [ ${db} ]; then
    dbOpt="-n ${db}"
fi
if [ ${password} ]; then
    if [ ${authType} = "aliyun" ]; then
        passwordOpt="-a ${user}:${password}"
    else
        passwordOpt="-a ${password}"
    fi
fi

case ${COMMAND} in
    cli )
        redis-cli ${hostOpt} ${portOpt} ${dbOpt} ${passwordOpt} --no-auth-warning
        ;;

    show-command )
        echo "redis-cli ${hostOpt} ${portOpt} ${dbOpt} ${passwordOpt}"
        ;;

    key-info )
        echo "Type,Key,Elements,TTL,Mem Usage, Mem Usage Human"
        keys=$(redis-cli ${hostOpt} ${portOpt} ${dbOpt} ${passwordOpt} --no-auth-warning keys "*")
        for key in $keys; do
            keyType=$(redis-cli ${hostOpt} ${portOpt} ${dbOpt} ${passwordOpt} --no-auth-warning type "$key")

            keyElementCount="-"
            case ${keyType} in
                list )
                    keyElementCount=$(redis-cli ${hostOpt} ${portOpt} ${dbOpt} ${passwordOpt} --no-auth-warning llen "$key")
                    ;;
                hash )
                    keyElementCount=$(redis-cli ${hostOpt} ${portOpt} ${dbOpt} ${passwordOpt} --no-auth-warning hlen "$key")
                    ;;
                set )
                    keyElementCount=$(redis-cli ${hostOpt} ${portOpt} ${dbOpt} ${passwordOpt} --no-auth-warning scard "$key")
                    ;;
                zset )
                    keyElementCount=$(redis-cli ${hostOpt} ${portOpt} ${dbOpt} ${passwordOpt} --no-auth-warning zcard "$key")
                    ;;
            esac

            keyTTL=$(redis-cli ${hostOpt} ${portOpt} ${dbOpt} ${passwordOpt} --no-auth-warning ttl "$key")
            if [ ${keyTTL} -eq -1 ]; then
                keyTTL="-"
            fi

            keyMemUsage=$(redis-cli ${hostOpt} ${portOpt} ${dbOpt} ${passwordOpt} --no-auth-warning memory usage "$key" SAMPLES 0)
            keyMemUsageHuman="${keyMemUsage} Bytes"
            if [ ${keyMemUsage} -gt 1048576 ]; then
                keyMemUsageHuman="$((keyMemUsage / 1048576)) MB"
            elif [ ${keyMemUsage} -gt 1024 ]; then
                keyMemUsageHuman="$((keyMemUsage / 1024)) KB"
            fi

            echo "${keyType},${key},${keyElementCount},${keyTTL},${keyMemUsage},${keyMemUsageHuman}"
        done
esac
