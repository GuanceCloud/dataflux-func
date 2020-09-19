#!/bin/bash

python ./_celery.py worker -A worker -l error -q $*
