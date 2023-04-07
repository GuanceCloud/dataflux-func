#!/bin/bash

echo -e "\n> python dataflux_func_sdk.py $*";
python dataflux_func_sdk.py $*;

echo -e "\n> node dataflux_func_sdk.js $*";
node dataflux_func_sdk.js $*;
