#!/bin/bash
set -e

function download {
    echo "Downloading file $1"

    if [ `command -v wget` ]; then
        wget $1 -O $2

    elif [ `command -v curl` ]; then
        curl -o $2 $1

    else
        echo 'No `curl` or `wget`, abort.'
        exit 1
    fi
}

function log {
    echo -e "\033[33m$1\033[0m"
}
function error {
    echo -e "\033[31m$1\033[0m"
}

# 处理选项
OPT_ARCH=DEFAULT
OPT_DOWNLOAD_DIR=DEFAULT

while [ $# -ge 1 ]; do
    case $1 in
        --arch=* )
            OPT_ARCH="${1#*=}"
            shift
            ;;
        --arch )
            OPT_ARCH=$2
            shift 2
            ;;

        --download-dir=* )
            OPT_DOWNLOAD_DIR="${1#*=}"
            shift
            ;;
        --download-dir )
            OPT_DOWNLOAD_DIR=$2
            shift 2
            ;;

        * )
            error "Unknow option: $1"
            exit 1
            ;;
    esac
done

# 配置
__PREV_DIR=${PWD}

__PORTABLE_BASE_URL=https://static.guance.com/dataflux-func/portable-dev
__DOCKER_BIN_FILE=docker-20.10.8.tgz
__DATAFLUX_FUNC_IMAGE_GZIP_FILE=dataflux-func.tar.gz
__MYSQL_IMAGE_GZIP_FILE=mysql.tar.gz
__REDIS_IMAGE_GZIP_FILE=redis.tar.gz
__IMAGE_LIST_FILE=image-list
__SYSTEMD_FILE=docker.service
__DOCKER_STACK_EXAMPLE_FILE=docker-stack.example.yaml
__RUN_PORTABLE_FILE=run-portable.sh
__VERSION_FILE=version

# 获取架构
_ARCH=`uname -m`
if [ ${OPT_ARCH} != "DEFAULT" ]; then
    _ARCH=${OPT_ARCH}
fi

# 获取版本号
_VERSION=`curl -s ${__PORTABLE_BASE_URL}/${__VERSION_FILE}`

# 创建下载目录
__DOWNLOAD_DIR=dataflux-func-portable-${_ARCH}-${_VERSION}
if [ ${OPT_DOWNLOAD_DIR} != "DEFAULT" ]; then
    __DOWNLOAD_DIR=${OPT_DOWNLOAD_DIR}
fi

if [ -d ${__DOWNLOAD_DIR} ]; then
    rm -rf ${__DOWNLOAD_DIR}
fi
mkdir ${__DOWNLOAD_DIR}
cd ${__DOWNLOAD_DIR}

# 下载所需文件
download ${__PORTABLE_BASE_URL}/${_ARCH}/${__DOCKER_BIN_FILE} ${__DOCKER_BIN_FILE}
download ${__PORTABLE_BASE_URL}/${_ARCH}/${__DATAFLUX_FUNC_IMAGE_GZIP_FILE} ${__DATAFLUX_FUNC_IMAGE_GZIP_FILE}
download ${__PORTABLE_BASE_URL}/${_ARCH}/${__MYSQL_IMAGE_GZIP_FILE} ${__MYSQL_IMAGE_GZIP_FILE}
download ${__PORTABLE_BASE_URL}/${_ARCH}/${__REDIS_IMAGE_GZIP_FILE} ${__REDIS_IMAGE_GZIP_FILE}
download ${__PORTABLE_BASE_URL}/${_ARCH}/${__IMAGE_LIST_FILE} ${__IMAGE_LIST_FILE}
download ${__PORTABLE_BASE_URL}/${__SYSTEMD_FILE} ${__SYSTEMD_FILE}
download ${__PORTABLE_BASE_URL}/${__DOCKER_STACK_EXAMPLE_FILE} ${__DOCKER_STACK_EXAMPLE_FILE}
download ${__PORTABLE_BASE_URL}/${__RUN_PORTABLE_FILE} ${__RUN_PORTABLE_FILE}
download ${__PORTABLE_BASE_URL}/${__VERSION_FILE} ${__VERSION_FILE}

# 回显示下载文件
version=`cat ${__VERSION_FILE}`
log "\nDownload DataFlux Func Portable finished"
log "    Arch   : ${_ARCH}"
log "    Version: ${version}"
log "\nFiles:"
ls -hl
log "\nPlease copy ${PWD} to your portable media (e.g. USB-Key)"
log "And run the following command on your server to install DataFlux Func:"
log "    $ sudo /bin/bash ${__DOWNLOAD_DIR}/run-portable.sh"
log "Or install and use default configs to setup:"
log "    $ sudo /bin/bash ${__DOWNLOAD_DIR}/run-portable.sh --auto-setup"
log "Or install and use specified configs to setup:"
log "    $ sudo /bin/bash ${__DOWNLOAD_DIR}/run-portable.sh --auto-setup --auto-setup-username=admin --auto-setup-password='Admin@123'"

# 返回之前目录
cd ${__PREV_DIR}
