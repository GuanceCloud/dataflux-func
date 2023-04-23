#!/bin/bash
set -e

# Create pre-run script folder
pre_run_script_folder="`python _config.py RESOURCE_ROOT_PATH`/`python _config.py PRE_RUN_SCRIPT_DIR`"
mkdir -p ${pre_run_script_folder}

# Copy old version
old_pre_run_script_folder="`python _config.py RESOURCE_ROOT_PATH`/init-scripts"
if [ -d ${old_pre_run_script_folder} ]; then
  cp ${old_pre_run_script_folder}/* ${pre_run_script_folder}/
fi

# Run shell scripts
cd ${pre_run_script_folder}
if [ "`ls -A .`" != "" ]; then
    for file in `ls *.sh`; do
        echo "[STARTER] Pre-Run Script: ${file}"
        /bin/bash ${file} $1
    done
fi