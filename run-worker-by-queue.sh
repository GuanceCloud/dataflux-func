#!/bin/bash
set -e

# Init Script
/bin/bash pre-run-scripts.sh 'worker'

# Check Setup
echo "[STARTER] Check CONFIG._IS_INSTALLED"
python _check_setup.py
if [ $? -ne 0 ]; then
    echo 'Setup failed.'
    exit 1
fi

# Generate Queue Names
app_name=`python _config.py APP_NAME`
queue_prefix="${app_name}-worker#workerQueue@"

enabled_queues=''
for queue in $*; do
    if [ "${enabled_queues}" == "" ]; then
        enabled_queues=${queue_prefix}${queue}
    else
        enabled_queues=${enabled_queues},${queue_prefix}${queue}
    fi
done

# Run Worker
echo "[STARTER] Run Worker by Queue"
celery --app worker.app --quiet worker --loglevel ERROR --queues ${enabled_queues}
