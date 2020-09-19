#!/bin/bash

currentDir=`pwd`
projectName=`basename ${currentDir}`
time=`date '+%Y-%m-%d'`
mysqldump -udev -pdev ${projectName} > db/${projectName}_${time}.sql