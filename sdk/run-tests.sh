#!/bin/bash
set -e

echo -e "\n> python dataflux_func_sdk.py $*";
python dataflux_func_sdk.py $*;

echo -e "\n> node dataflux_func_sdk.js $*";
node dataflux_func_sdk.js $*;

echo -e "\n> GO111MODULE=off go run dataflux_func_sdk_demo.go $*";
GO111MODULE=off go run dataflux_func_sdk_demo.go $*;