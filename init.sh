#!/bin/bash
set -e

# create init script folder
init_script_folder="`python _config.py RESOURCE_ROOT_PATH`/`python _config.py INIT_SCRIPT_DIR`"
echo $init_script_folder
