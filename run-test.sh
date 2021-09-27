#!/bin/bash
set -e

pytest -s -v --order-scope=class $*
