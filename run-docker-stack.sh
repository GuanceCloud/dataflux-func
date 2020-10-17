#!/bin/bash
set -e

function log {
    echo -e "\033[33m$1\033[0m"
}

__PREV_DIR=$PWD
__PROJECT_NAME=dataflux-func
__RANDOM_SECRET=`openssl rand -hex 8`
__RANDOM_MYSQL_ROOT_PASSWORD=`openssl rand -hex 8`
__RESOURCE_BASE_URL=https://zhuyun-static-files-production.oss-cn-hangzhou.aliyuncs.com/dataflux-func/resource
__DOCKER_STACK_FILE=docker-stack.yaml
__DOCKER_STACK_EXAMPLE_FILE=docker-stack.example.yaml
__MYSQL_IMAGE=pubrepo.jiagouyun.com/dataflux-func/mysql:5.7.26
__REDIS_IMAGE=pubrepo.jiagouyun.com/dataflux-func/redis:5.0.7

_INSTALL_DIR=/usr/local/dataflux-func
_IMAGE=pubrepo.jiagouyun.com/dataflux-func/dataflux-func:latest

# 可配置环境变量
if [ $INSTALL_DIR ]; then
    _INSTALL_DIR=${INSTALL_DIR}
fi
if [ $IMAGE ]; then
    _IMAGE=${IMAGE}
fi
log "Install dir: ${_INSTALL_DIR}"
log "Image path : ${_IMAGE}"

# 创建运行环境目录
mkdir -p ${_INSTALL_DIR}/{data,data/extra-python-packages,mysql,redis}

# 前往安装目录
cd ${_INSTALL_DIR}

# 下载docker stack 示例文件
log "Downloading ${__DOCKER_STACK_EXAMPLE_FILE}"
if [ `command -v wget` ]; then
    wget ${__RESOURCE_BASE_URL}/${__DOCKER_STACK_EXAMPLE_FILE} -O ${__DOCKER_STACK_EXAMPLE_FILE}

elif [ `command -v curl` ]; then
    curl -o ${__DOCKER_STACK_EXAMPLE_FILE} ${__RESOURCE_BASE_URL}/${__DOCKER_STACK_EXAMPLE_FILE}

else
    echo 'No `curl` or `wget`, abort.'
    exit 1
fi

# 创建docker stack 配置文件
if [ ! -f ${__DOCKER_STACK_FILE} ]; then
    # 创建配置文件并使用随机密钥/密码
    sed -e "s#=your_secret#=${__RANDOM_SECRET}#g" \
        -e "s#=mysql_root_password#=${__RANDOM_MYSQL_ROOT_PASSWORD}#g" \
        -e "s#image: mysql.*#image: ${__MYSQL_IMAGE}#g" \
        -e "s#image: redis.*#image: ${__REDIS_IMAGE}#g" \
        -e "s#image: pubrepo\.jiagouyun\.com/dataflux-func/dataflux-func.*#image: ${_IMAGE}#g" \
        ${__DOCKER_STACK_EXAMPLE_FILE} > ${__DOCKER_STACK_FILE}

    log "New docker stack file with random secret/password created:"

else
    log "Docker stack file already exists:"
fi
log "  $PWD/${__DOCKER_STACK_FILE}"

# 执行部署
log "Pulling image: ${__MYSQL_IMAGE}"
docker pull ${__MYSQL_IMAGE}

log "Pulling image: ${__REDIS_IMAGE}"
docker pull ${__REDIS_IMAGE}

log "Pulling image: ${_IMAGE}"
docker pull ${_IMAGE}

log "Deploying: ${__PROJECT_NAME}"
docker stack deploy ${__PROJECT_NAME} -c ${__DOCKER_STACK_FILE}

# 等待完成
log "Please wait for the container to run."
sleep 30

# 查询运行状态
docker ps

# 返回之前目录
cd ${__PREV_DIR}
