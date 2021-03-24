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

# 单纯处理系统队列/调试队列的工作单元，不需要太多并发量
if [ ${enabled_queues} = "${queue_prefix}0" ]; then
    # 系统队列
    _WORKER_CONCURRENCY=3
elif [ ${enabled_queues} = "${queue_prefix}7" ]; then
    # 调试队列
    _WORKER_CONCURRENCY=2
fi

# run worker
_WORKER_CONCURRENCY=${_WORKER_CONCURRENCY} python _celery.py worker -A worker -l error -q -Q ${enabled_queues}
