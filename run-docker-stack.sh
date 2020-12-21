#!/bin/bash
set -e

function log {
    echo -e "\033[33m$1\033[0m"
}

# 处理选项
OPT_DEV=FALSE
OPT_MINI=FALSE
OPT_INSTALL_DIR=DEFAULT
OPT_IMAGE=DEFAULT
OPT_NO_MYSQL=FALSE
OPT_NO_REDIS=FALSE
OPT_EMQX=FALSE

while [ $# -ge 1 ]; do
    case $1 in
        '--dev' )
            OPT_DEV=TRUE
            shift
            ;;

        '--mini' )
            OPT_MINI=TRUE
            shift
            ;;

        '--install-dir' )
            OPT_INSTALL_DIR=$2
            shift 2
            ;;

        '--image' )
            OPT_IMAGE=$2
            shift 2
            ;;

        '--no-mysql' )
            OPT_NO_MYSQL=TRUE
            shift
            ;;

        '--no-redis' )
            OPT_NO_REDIS=TRUE
            shift
            ;;

        '--emqx' )
            OPT_EMQX=TRUE
            shift
            ;;

        * )
            shift
            ;;
    esac
done

# 配置
__PREV_DIR=${PWD}
__RANDOM_SECRET=`openssl rand -hex 8`
__RANDOM_PASSWORD=`openssl rand -hex 8`
__CONFIG_FILE=data/user-config.yaml
__DOCKER_STACK_FILE=docker-stack.yaml
__DOCKER_STACK_EXAMPLE_FILE=docker-stack.example.yaml
__MYSQL_IMAGE=pubrepo.jiagouyun.com/dataflux-func/mysql:5.7.26
__REDIS_IMAGE=pubrepo.jiagouyun.com/dataflux-func/redis:5.0.7
__EMQX_IMAGE=pubrepo.jiagouyun.com/dataflux-func/emqx:4.2.3

__PROJECT_NAME=dataflux-func
__RESOURCE_BASE_URL=https://zhuyun-static-files-production.oss-cn-hangzhou.aliyuncs.com/dataflux-func/resource
_DATAFLUX_FUNC_IMAGE=pubrepo.jiagouyun.com/dataflux-func/dataflux-func:latest

# 启用dev 部署时，项目名/资源等改为dev 专用版
if [ ${OPT_DEV} = "TRUE" ]; then
    __PROJECT_NAME=dataflux-func-dev
    __RESOURCE_BASE_URL=https://zhuyun-static-files-production.oss-cn-hangzhou.aliyuncs.com/dataflux-func/resource-dev
    _DATAFLUX_FUNC_IMAGE=pubrepo.jiagouyun.com/dataflux-func/dataflux-func:dev
fi

_INSTALL_DIR=/usr/local/${__PROJECT_NAME}
if [ ${OPT_INSTALL_DIR} != "DEFAULT" ]; then
    _INSTALL_DIR=${OPT_INSTALL_DIR}
fi

if [ ${OPT_IMAGE} != "DEFAULT" ]; then
    _DATAFLUX_FUNC_IMAGE=${OPT_IMAGE}
fi

log "Project name: ${__PROJECT_NAME}"
log "Install dir : ${_INSTALL_DIR}/"
log "Image       : ${_DATAFLUX_FUNC_IMAGE}"

# 拉取必要镜像
log "Pulling image: ${_DATAFLUX_FUNC_IMAGE}"
docker pull ${_DATAFLUX_FUNC_IMAGE}

# 未关闭MySQL 时，需要拉取镜像
if [ ${OPT_NO_MYSQL} = "FALSE" ]; then
    log "Pulling image: ${__MYSQL_IMAGE}"
    docker pull ${__MYSQL_IMAGE}
fi

# 未关闭Redis 时，需要拉取镜像
if [ ${OPT_NO_REDIS} = "FALSE" ]; then
    log "Pulling image: ${__REDIS_IMAGE}"
    docker pull ${__REDIS_IMAGE}
fi

# 开启EMQX 支持时，需要拉取镜像
if [ ${OPT_EMQX} = "TRUE" ]; then
    log "Pulling image: ${__EMQX_IMAGE}"
    docker pull ${__EMQX_IMAGE}
fi

# 创建运行环境目录并前往
mkdir -p ${_INSTALL_DIR}/{data,data/extra-python-packages,mysql,redis}
cd ${_INSTALL_DIR}
log "In ${_INSTALL_DIR}"

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

# 创建预配置文件（主要目的是减少用户在配置页面的操作——只要点确认即可）
if [ ! -f ${__CONFIG_FILE} ]; then
    # 开启EMQX 组件时，需要自动添加EMQX的主机地址
    emqxHost=null
    if [ ${OPT_EMQX} = "TRUE" ]; then
        emqxHost=emqx
    fi

    echo -e "# Auto generated config: \
            \nSECRET             : ${__RANDOM_SECRET} \
            \nMYSQL_HOST         : mysql \
            \nMYSQL_PORT         : 3306 \
            \nMYSQL_USER         : root \
            \nMYSQL_PASSWORD     : ${__RANDOM_PASSWORD} \
            \nMYSQL_DATABASE     : dataflux_func \
            \nREDIS_HOST         : redis \
            \nREDIS_PORT         : 6379 \
            \nREDIS_DATABASE     : 5 \
            \nEMQX_HOST          : ${emqxHost} \
            \nEMQX_PORT          : 1883 \
            \nEMQX_USERNAME      : dataflux_func \
            \nEMQX_PASSWORD      : ${__RANDOM_PASSWORD} \
            \nEMQX_DEFAULT_QOS   : 0 \
            \nEMQX_API_PORT      : 8081 \
            \nEMQX_API_APP_ID    : dataflux_func \
            \nEMQX_API_APP_SECRET: ${__RANDOM_SECRET}" \
        >> ${__CONFIG_FILE}

    log "New config file with random secret/password created:"
else
    log "Config file already exists:"
fi
log "  $PWD/${__CONFIG_FILE}"

# 创建docker stack 配置文件
if [ ! -f ${__DOCKER_STACK_FILE} ]; then
    cp ${__DOCKER_STACK_EXAMPLE_FILE} ${__DOCKER_STACK_FILE}

    # 创建配置文件并使用随机密钥/密码
    sed -i \
        -e "s#<RANDOM_PASSWORD>#${__RANDOM_PASSWORD}#g" \
        -e "s#<MYSQL_IMAGE>#${__MYSQL_IMAGE}#g" \
        -e "s#<REDIS_IMAGE>#${__REDIS_IMAGE}#g" \
        -e "s#<EMQX_IMAGE>#${__EMQX_IMAGE}#g" \
        -e "s#<DATAFLUX_FUNC_IMAGE>#${_DATAFLUX_FUNC_IMAGE}#g" \
        -e "s#<INSTALL_DIR>#${_INSTALL_DIR}#g" \
        ${__DOCKER_STACK_FILE}

    if [ ${OPT_MINI} = "TRUE" ]; then
        # 启用mini方式安装，去除Worker default 配置部分
        sed -i "/# BOF WORKER DEFAULT/,/# EOF WORKER DEFAULT/d" ${__DOCKER_STACK_FILE}
    else
        # 默认方式安装，去除Worker mini 配置部分
        sed -i "/# BOF WORKER MINI/,/# EOF WORKER MINI/d" ${__DOCKER_STACK_FILE}
    fi

    # 关闭MySQL 时，去除MySQL 配置部分
    if [ ${OPT_NO_MYSQL} = "TRUE" ]; then
        sed -i "/# BOF MYSQL/,/# EOF MYSQL/d" ${__DOCKER_STACK_FILE}
    fi

    # 关闭Redis 时，去除Redis 配置部分
    if [ ${OPT_NO_REDIS} = "TRUE" ]; then
        sed -i "/# BOF REDIS/,/# EOF REDIS/d" ${__DOCKER_STACK_FILE}
    fi

    # 未开启EMQX 支持时，去除EMQX 配置部分
    if [ ${OPT_EMQX} = "FALSE" ]; then
        sed -i "/# BOF EMQX/,/# EOF EMQX/d" ${__DOCKER_STACK_FILE}
    fi

    log "New docker stack file with random secret/password created:"

else
    log "Docker stack file already exists:"
fi
log "  $PWD/${__DOCKER_STACK_FILE}"

# 创建logrotate配置
if [ `command -v logrotate` ] && [ -d /etc/logrotate.d ]; then
    echo -e "${_INSTALL_DIR}/data/${__PROJECT_NAME}.log { \
        \n    missingok \
        \n    copytruncate \
        \n    compress \
        \n    daily \
        \n    rotate 7 \
        \n    dateext \
        \n}" \
    > /etc/logrotate.d/${__PROJECT_NAME}
fi
log "logrotate config file created:"
log "  /etc/logrotate.d/${__PROJECT_NAME}"

# 执行部署
log "Deploying: ${__PROJECT_NAME}"
docker stack deploy ${__PROJECT_NAME} -c ${__DOCKER_STACK_FILE}

# 等待完成
log "Please wait for the container to run, wait 30 seconds..."
sleep 30
docker ps

# 返回之前目录
cd ${__PREV_DIR}

log "To restart, use following commands:"
log "   $ docker stack remove ${__PROJECT_NAME}"
log "   # After all containers exited...($ docker ps)"
log "   $ docker stack deploy ${__PROJECT_NAME} -c ${__DOCKER_STACK_FILE}"
