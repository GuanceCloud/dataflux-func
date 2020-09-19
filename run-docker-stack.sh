#!/bin/bash
set -e

__PREV_DIR=$PWD
__RANDOM_SECRET=`openssl rand -hex 8`
__RANDOM_MYSQL_ROOT_PASSWORD=`openssl rand -hex 8`
__RESOURCE_BASE_URL=https://zhuyun-static-files-production.oss-cn-hangzhou.aliyuncs.com/dataflux-func/resource
__DOCKER_STACK_FILE=docker-stack.yaml
__DOCKER_STACK_EXAMPLE_FILE=docker-stack.example.yaml

_DOCKER_STACK_DIR=/usr/local/dataflux-func
_DOCKER_IMAGE=pubrepo.jiagouyun.com/dataflux-func/dataflux-func:latest

# 可配置环境变量
if [ $DOCKER_STACK_DIR ]; then
    _DOCKER_STACK_DIR=$DOCKER_STACK_DIR
fi
if [ $DOCKER_IMAGE ]; then
    _DOCKER_IMAGE=$DOCKER_IMAGE
fi

# 创建运行环境目录
mkdir -p $_DOCKER_STACK_DIR/{data,mysql,redis}
cd $_DOCKER_STACK_DIR

# 下载docker stack 示例文件
wget $__RESOURCE_BASE_URL/$__DOCKER_STACK_EXAMPLE_FILE

# 创建docker stack 配置文件
if [ ! -f $__DOCKER_STACK_FILE ]; then
    # 创建配置文件并使用随机密钥/密码
    sed -e "s#your_secret#$__RANDOM_SECRET#g" \
        -e "s#mysql_root_password#$__RANDOM_MYSQL_ROOT_PASSWORD#g" \
        -e "s#image: dataflux-func#image: ${_DOCKER_IMAGE}#g" \
        $__DOCKER_STACK_EXAMPLE_FILE > $__DOCKER_STACK_FILE

    echo "New docker stack file with random secret/password created:"
    echo "  $PWD/$__DOCKER_STACK_FILE"

else
    echo "Docker stack file already exists:"
    echo "  $PWD/$__DOCKER_STACK_FILE"
fi

# 执行部署
docker stack deploy dataflux-func -c $__DOCKER_STACK_FILE

# 等待完成
echo "Please wait for the container to run."
sleep 30

# 查询运行状态
docker ps

# 返回之前目录
cd $__PREV_DIR
