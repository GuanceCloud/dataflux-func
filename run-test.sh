#!/bin/bash
set -e

HTML_OUTPUT=report.html

pytest \
    -v \
    --order-scope=class \
    --html=${HTML_OUTPUT} \
    --self-contained-html \
    $*
