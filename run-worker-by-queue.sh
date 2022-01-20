#!/bin/bash
set -e

# setup
python _check_setup.py
if [ $? -ne 0 ]; then
    echo 'Setup failed.'
    exit 1
fi

# gen queue names
queue_prefix='DataFluxFunc-worker#workerQueue@'
enabled_queues=''

for queue in $*; do
    if [ "${enabled_queues}" == "" ]; then
        enabled_queues=${queue_prefix}${queue}
    else
        enabled_queues=${enabled_queues},${queue_prefix}${queue}
    fi
done

# run worker
python _celery.py worker -A worker -l error -q -Q ${enabled_queues}
