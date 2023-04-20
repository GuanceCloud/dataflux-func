#!/bin/bash
set -e

# create init script folder
init_script_folder="`python _config.py RESOURCE_ROOT_PATH`/`python _config.py INIT_SCRIPT_DIR`"
mkdir -p ${init_script_folder}

# run shell scripts
cd ${init_script_folder}
if [ "`ls -A .`" != "" ]; then
    for file in `ls *.sh`; do
        echo "[STARTER] Run Init Script: ${file}"
        /bin/bash ${file} $1
    done
fi