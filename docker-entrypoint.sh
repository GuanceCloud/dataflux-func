#!/bin/sh
set -e

case ${TARGETARCH} in
    "amd64" )
        # ARM下启用SQL Server 和 Oracle
        export DFF__ENABLE_DATA_SOURCE_SQLSERVER="true"
        export DFF__ENABLE_DATA_SOURCE_ORACLE="true"
        ;;

    "arm64" )
        # ARM下禁用SQL Server 和 Oracle
        export DFF__ENABLE_DATA_SOURCE_SQLSERVER="false"
        export DFF__ENABLE_DATA_SOURCE_ORACLE="false"
        ;;

esac

exec "$@"
