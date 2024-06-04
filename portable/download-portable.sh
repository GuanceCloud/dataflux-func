#!/bin/bash
set -e

function download {
    echo "Downloading file $1"

    if [ `command -v wget` ]; then
        wget --output-document $2 $1

    elif [ `command -v curl` ]; then
        echo $2
        curl --output $2 $1

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

# 初始化
__PREV_DIR=${PWD}

__PORTABLE_BASE_URL=https://static.guance.com/dataflux-func/portable
__PORTABLE_COMMON_BASE_URL=https://static.guance.com/dataflux-func/portable-common

__DOCKER_VERSION=23.0.6
__DOCKER_BIN_FILE=docker-${__DOCKER_VERSION}.tgz
__DATAFLUX_FUNC_IMAGE_GZIP_FILE=dataflux-func.tar.gz
__MYSQL_IMAGE_GZIP_FILE=mysql.tar.gz
__REDIS_IMAGE_GZIP_FILE=redis.tar.gz
__IMAGE_LIST_FILE=image-list
__SYSTEMD_FILE=docker.service
__DOCKER_STACK_EXAMPLE_FILE=docker-stack.example.yaml
__RUN_PORTABLE_FILE=run-portable.sh
__VERSION_FILE=version

# 处理选项
OPT_ARCH=DEFAULT
OPT_DOWNLOAD_DIR=DEFAULT
OPT_FOR=DEFAULT

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

        --for=* )
            OPT_FOR="${1#*=}"
            shift
            ;;
        --for )
            OPT_FOR=$2
            shift 2
            ;;

        * )
            error "Unknown option: $1"
            exit 1
            ;;
    esac
done

# 下载配置
# 版本
case ${OPT_FOR} in
    dev|GSE )
        __PORTABLE_BASE_URL="${__PORTABLE_BASE_URL}-${OPT_FOR}"
        ;;

    DEFAULT )
        ;;

    * )
        error "Unsupported edition: ${OPT_FOR}"
        exit 1
        ;;
esac

# 获取架构
_ARCH=`uname -m`
if [ ${OPT_ARCH} != "DEFAULT" ]; then
    _ARCH=${OPT_ARCH}
fi

case ${_ARCH} in
    x86_64|amd64|x86 )
        _ARCH="x86_64"
        ;;

    aarch64|arm64|arm )
        _ARCH="aarch64"
        ;;

    * )
        error "Unsupported arch: ${_ARCH}"
        exit 1
        ;;
esac

# 下载所需文件至临时目录
TMP_FOLDER=tmp-`echo ${RANDOM} | md5sum | cut -c 1-16`
mkdir ${TMP_FOLDER}
cd ${TMP_FOLDER}

download ${__PORTABLE_COMMON_BASE_URL}/${_ARCH}/${__DOCKER_BIN_FILE} ${__DOCKER_BIN_FILE}
download ${__PORTABLE_COMMON_BASE_URL}/${_ARCH}/${__MYSQL_IMAGE_GZIP_FILE} ${__MYSQL_IMAGE_GZIP_FILE}
download ${__PORTABLE_COMMON_BASE_URL}/${_ARCH}/${__REDIS_IMAGE_GZIP_FILE} ${__REDIS_IMAGE_GZIP_FILE}
download ${__PORTABLE_BASE_URL}/${_ARCH}/${__DATAFLUX_FUNC_IMAGE_GZIP_FILE} ${__DATAFLUX_FUNC_IMAGE_GZIP_FILE}
download ${__PORTABLE_BASE_URL}/${_ARCH}/${__IMAGE_LIST_FILE} ${__IMAGE_LIST_FILE}
download ${__PORTABLE_BASE_URL}/${__SYSTEMD_FILE} ${__SYSTEMD_FILE}
download ${__PORTABLE_BASE_URL}/${__DOCKER_STACK_EXAMPLE_FILE} ${__DOCKER_STACK_EXAMPLE_FILE}
download ${__PORTABLE_BASE_URL}/${__RUN_PORTABLE_FILE} ${__RUN_PORTABLE_FILE}
download ${__PORTABLE_BASE_URL}/${__VERSION_FILE} ${__VERSION_FILE}

# 获取版本号
_VERSION=`cat ${__VERSION_FILE}`

# 修改下载目录名称
if [ ${OPT_DOWNLOAD_DIR} != "DEFAULT" ]; then
    __DOWNLOAD_DIR=${OPT_DOWNLOAD_DIR}
else
    __DOWNLOAD_DIR=dataflux-func-portable-${_ARCH}-${_VERSION}
    if [ ${OPT_FOR} != "DEFAULT" ]; then
        __DOWNLOAD_DIR="${__DOWNLOAD_DIR}-${OPT_FOR}"
    fi
fi

cd ..
if [ -d ${__DOWNLOAD_DIR} ]; then
    rm -rf ${__DOWNLOAD_DIR}
fi

mv ${TMP_FOLDER} ${__DOWNLOAD_DIR}
cd ${__DOWNLOAD_DIR}

# 回显示下载文件
version=`cat ${__VERSION_FILE}`
log "\nDownload DataFlux Func Portable finished"
log "    Arch   : ${_ARCH}"
log "    Version: ${version}"
log "    Docker Version: ${__DOCKER_VERSION}"
log "\nFiles:"
ls -hl
log "\nPlease copy ${PWD} to your portable media (e.g. USB-Key)"
log "And run the following command on your server to install DataFlux Func:"
log "    $ sudo /bin/bash ${__DOWNLOAD_DIR}/run-portable.sh"

# 返回之前目录
cd ${__PREV_DIR}
