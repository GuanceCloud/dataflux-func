#!/bin/bash

python _celery.py beat -A worker -l info -q
