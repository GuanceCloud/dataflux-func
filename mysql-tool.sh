#!/bin/bash
set -e

COMMAND=""

case $1 in
    cli|show-command|table-info )
        COMMAND=$1
        ;;

    * )
        echo "DataFlux Func MySQL Tool"
        echo "Usage:"
        echo "  $ bash $0 cli                         : Use CLI to access MySQL"
        echo "  $ bash $0 show-command                : Show CLI command to access MySQL"
        echo "  $ bash $0 table-info                  : Show information of all the table in CSV format"
        echo "  $ bash $0 table-info > table-info.csv : Export information of all the table into a CSV file"
        exit
        ;;
esac

host=`python _config.py MYSQL_HOST`
port=`python _config.py MYSQL_PORT`
db=`python _config.py MYSQL_DATABASE`
user=`python _config.py MYSQL_USER`
password=`python _config.py MYSQL_PASSWORD`

hostOpt=""
portOpt=""
dbOpt=""
userOpt=""
passwordOpt=""

if [ ${host} ]; then
    hostOpt="--host=${host}"
fi
if [ ${port} ]; then
    portOpt="--port=${port}"
fi
if [ ${db} ]; then
    dbOpt="--database=${db}"
fi
if [ ${user} ]; then
    userOpt="--user=${user}"
fi
if [ ${password} ]; then
    passwordOpt="--password=${password}"
fi

case ${COMMAND} in
    cli )
        export MYSQL_PWD=${password}
        mysql ${hostOpt} ${portOpt} ${dbOpt} ${userOpt} --ssl-mode=DISABLED
        ;;

    show-command )
        echo "mysql ${hostOpt} ${portOpt} ${dbOpt} ${userOpt} ${passwordOpt} --ssl-mode=DISABLED"
        ;;

    table-info )
        sql="
            SELECT
                CONCAT(
                TABLE_NAME, ',',
                TABLE_ROWS, ',',
                AUTO_INCREMENT, ',',
                DATA_LENGTH, ',',
                INDEX_LENGTH, ',',
                (DATA_LENGTH + INDEX_LENGTH), ',',
                CASE
                    WHEN DATA_LENGTH > 1048576 THEN CONCAT(ROUND(DATA_LENGTH / 1048576), ' MB')
                    WHEN DATA_LENGTH > 1024 THEN CONCAT(ROUND(DATA_LENGTH / 1024), ' KB')
                    ELSE CONCAT(DATA_LENGTH, ' Bytes')
                END, ',',
                CASE
                    WHEN INDEX_LENGTH > 1048576 THEN CONCAT(ROUND(INDEX_LENGTH / 1048576), ' MB')
                    WHEN INDEX_LENGTH > 1024 THEN CONCAT(ROUND(INDEX_LENGTH / 1024), ' KB')
                    ELSE CONCAT(INDEX_LENGTH, ' Bytes')
                END, ',',
                CASE
                    WHEN (DATA_LENGTH + INDEX_LENGTH) > 1048576 THEN CONCAT(
                        ROUND((DATA_LENGTH + INDEX_LENGTH) / 1048576),
                        ' MB'
                    )
                    WHEN (DATA_LENGTH + INDEX_LENGTH) > 1024 THEN CONCAT(
                        ROUND((DATA_LENGTH + INDEX_LENGTH) / 1024),
                        ' KB'
                    )
                    ELSE CONCAT((DATA_LENGTH + INDEX_LENGTH), ' Bytes')
                END) as 'Table,Rows,Auto Increment,Data Usage,Index Usage,Total Usage,Data Usage Human,Index Usage Human,Total Usage Human'
            FROM
                Information_Schema.TABLES
            WHERE
                TABLE_SCHEMA = '${db}'
            ORDER BY
                (DATA_LENGTH + INDEX_LENGTH) DESC"

        export MYSQL_PWD=${password}
        echo ${sql} | mysql ${hostOpt} ${portOpt} ${dbOpt} ${userOpt} --ssl-mode=DISABLED
        ;;
esac
