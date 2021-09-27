#!/bin/bash
set -e

function log {
    echo -e "\033[33m$1\033[0m"
}

HTML_OUTPUT=report.html

pytest \
    -s -v \
    --order-scope=class \
    --html=${HTML_OUTPUT} \
    --self-contained-html \
    $*

log "Done."
log "HTML Report: ${PWD}/${HTML_OUTPUT}"
