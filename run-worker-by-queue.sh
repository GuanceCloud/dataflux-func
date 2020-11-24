#!/bin/bash
set -e

# pip install
PIP_REQUIREMENTS_FILE_PATH=`python _config.py PIP_REQUIREMENTS_FILE_PATH`
EXTRA_PYTHON_IMPORT_PATH=`python _config.py EXTRA_PYTHON_IMPORT_PATH`

if [ -f ${PIP_REQUIREMENTS_FILE_PATH} ]; then
    pip install -r ${PIP_REQUIREMENTS_FILE_PATH} --target ${EXTRA_PYTHON_IMPORT_PATH}
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

python _celery.py worker -A worker -l error -q -Q ${enabled_queues}
