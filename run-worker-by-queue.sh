#!/bin/bash
set -e

# setup
python _check_setup.py
if [ $? -ne 0 ]; then
    echo 'Setup failed.'
    exit 1
fi

# app name
app_name=`python _config.py APP_NAME`

# gen queue names
queue_prefix="${app_name}-worker#workerQueue@"

enabled_queues=''
for queue in $*; do
    if [ "${enabled_queues}" == "" ]; then
        enabled_queues=${queue_prefix}${queue}
    else
        enabled_queues=${enabled_queues},${queue_prefix}${queue}
    fi
done

# run worker
celery --app worker --quiet worker --loglevel ERROR --queues ${enabled_queues}
