#!/bin/bash
set -e

function blankLine {
    echo ''
}

function log {
    echo -e "\033[33m$1\033[0m"
}

# 处理选项
OPT_ZHUYUN=FALSE
OPT_DEV=FALSE
OPT_MINI=FALSE
OPT_INSTALL_DIR=DEFAULT
OPT_IMAGE=DEFAULT
OPT_NO_MYSQL=FALSE
OPT_NO_REDIS=FALSE
OPT_MQTT=FALSE

while [ $# -ge 1 ]; do
    case $1 in
        '--zhuyun' )
            OPT_ZHUYUN=TRUE
            shift
            ;;

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

        '--mqtt' )
            OPT_MQTT=TRUE
            shift
            ;;

        * )
            shift
            ;;
    esac
done

# 配置
__PREV_DIR=${PWD}
__SERVER_SECRET=`openssl rand -hex 8`
__MYSQL_PASSWORD=`openssl rand -hex 8`
__MQTT_USERNAME=dataflux_func
__MQTT_PASSWORD=`openssl rand -hex 8`
__MQTT_SAMPLE_USERNAME=mqttclient
__MQTT_SAMPLE_PASSWORD=`openssl rand -hex 8`

__CONFIG_FILE=data/user-config.yaml
__DOCKER_STACK_FILE=docker-stack.yaml
__DOCKER_STACK_EXAMPLE_FILE=docker-stack.example.yaml
__README_FILE=README.md
__MOSQUITTO_CONFIG_FILE=mosquitto/config/mosquitto.conf
__MOSQUITTO_PASSWD_FILE=mosquitto/passwd

__MYSQL_IMAGE=mysql:5.7.26
__REDIS_IMAGE=redis:5.0.7
__MQTT_IMAGE=eclipse-mosquitto:2.0.3

__PROJECT_NAME=dataflux-func
__RESOURCE_BASE_URL=https://zhuyun-static-files-production.oss-cn-hangzhou.aliyuncs.com/dataflux-func/resource
_DATAFLUX_FUNC_IMAGE=dataflux-func/dataflux-func:latest

# 使用zhuyun 镜像时，从驻云官方镜像仓库拉取
if [ ${OPT_ZHUYUN} = "TRUE" ]; then
    __MYSQL_IMAGE=pubrepo.jiagouyun.com/dataflux-func/mysql:5.7.26
    __REDIS_IMAGE=pubrepo.jiagouyun.com/dataflux-func/redis:5.0.7
    __MQTT_IMAGE=pubrepo.jiagouyun.com/dataflux-func/eclipse-mosquitto:2.0.3
    _DATAFLUX_FUNC_IMAGE=pubrepo.jiagouyun.com/dataflux-func/dataflux-func:latest
fi

# 启用dev 部署时，项目名/资源等改为dev 专用版
if [ ${OPT_DEV} = "TRUE" ]; then
    __PROJECT_NAME=dataflux-func-dev
    __RESOURCE_BASE_URL=https://zhuyun-static-files-production.oss-cn-hangzhou.aliyuncs.com/dataflux-func/resource-dev
    _DATAFLUX_FUNC_IMAGE=`echo ${_DATAFLUX_FUNC_IMAGE} | sed "s#:latest#:dev#g"`
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
blankLine
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

# 开启MQTT 组件时，需要拉取镜像
if [ ${OPT_MQTT} = "TRUE" ]; then
    log "Pulling image: ${__MQTT_IMAGE}"
    docker pull ${__MQTT_IMAGE}
fi

# 创建运行环境目录并前往
blankLine
mkdir -p ${_INSTALL_DIR}/{data,data/extra-python-packages,mysql,redis}

# 开启MQTT 组件时，自动创建目录
if [ ${OPT_MQTT} = "TRUE" ]; then
    mkdir -p ${_INSTALL_DIR}/{mosquitto,mosquitto/config}
fi

cd ${_INSTALL_DIR}
log "In ${_INSTALL_DIR}"

# 下载docker stack 示例文件和README 文件
blankLine
for file in ${__DOCKER_STACK_EXAMPLE_FILE} ${__README_FILE}; do
    log "Downloading file ${file}"

    if [ `command -v wget` ]; then
        wget ${__RESOURCE_BASE_URL}/${file} -O ${file}

    elif [ `command -v curl` ]; then
        curl -o ${file} ${__RESOURCE_BASE_URL}/${file}

    else
        echo 'No `curl` or `wget`, abort.'
        exit 1
    fi
done

# 创建预配置文件（主要目的是减少用户在配置页面的操作——只要点确认即可）
blankLine
if [ ! -f ${__CONFIG_FILE} ]; then
    # 开启MQTT 组件时，需要自动添加MQTT 的主机地址
    mqttHost=null
    if [ ${OPT_MQTT} = "TRUE" ]; then
        mqttHost=mqtt
    fi

    echo -e "# Pre-generated config: \
\nSECRET          : ${__SERVER_SECRET} \
\nMYSQL_HOST      : mysql \
\nMYSQL_PORT      : 3306 \
\nMYSQL_USER      : root \
\nMYSQL_PASSWORD  : ${__MYSQL_PASSWORD} \
\nMYSQL_DATABASE  : dataflux_func \
\nREDIS_HOST      : redis \
\nREDIS_PORT      : 6379 \
\nREDIS_DATABASE  : 5" \
> ${__CONFIG_FILE}

    log "New config file with random secret/password created:"
else
    log "Config file already exists:"
fi
log "  ${_INSTALL_DIR}/${__CONFIG_FILE}"

# 创建docker stack 配置文件
blankLine
if [ ! -f ${__DOCKER_STACK_FILE} ]; then
    cp ${__DOCKER_STACK_EXAMPLE_FILE} ${__DOCKER_STACK_FILE}

    __SERVER_ARGV=""

    # 创建配置文件并使用随机密钥/密码
    if [ ${OPT_MINI} = "TRUE" ]; then
        # 启用mini方式安装，去除Worker default 配置部分
        sed -i "/# WORKER DEFAULT START/,/# WORKER DEFAULT END/d" \
            ${__DOCKER_STACK_FILE}
    else
        # 默认方式安装，去除Worker mini 配置部分
        sed -i "/# WORKER MINI START/,/# WORKER MINI END/d" \
            ${__DOCKER_STACK_FILE}
    fi

    # 关闭MySQL 时，去除MySQL 配置部分
    if [ ${OPT_NO_MYSQL} = "TRUE" ]; then
        sed -i "/# MYSQL START/,/# MYSQL END/d" \
            ${__DOCKER_STACK_FILE}
    fi

    # 关闭Redis 时，去除Redis 配置部分
    if [ ${OPT_NO_REDIS} = "TRUE" ]; then
        sed -i "/# REDIS START/,/# REDIS END/d" \
            ${__DOCKER_STACK_FILE}
    fi

    if [ ${OPT_MQTT} = "FALSE" ]; then
        # 未开启MQTT 组件时，去除MQTT 配置部分
        sed -i "/# MQTT START/,/# MQTT END/d" \
            ${__DOCKER_STACK_FILE}
    else
        # 开启MQTT 组件时，附带启动参数，自动添加数据源
        __SERVER_ARGV="${__SERVER_ARGV} --mqtt ${__MQTT_USERNAME}:${__MQTT_PASSWORD}"
    fi

    sed -i \
        -e "s#<MYSQL_PASSWORD>#${__MYSQL_PASSWORD}#g" \
        -e "s#<MYSQL_IMAGE>#${__MYSQL_IMAGE}#g" \
        -e "s#<REDIS_IMAGE>#${__REDIS_IMAGE}#g" \
        -e "s#<MQTT_IMAGE>#${__MQTT_IMAGE}#g" \
        -e "s#<DATAFLUX_FUNC_IMAGE>#${_DATAFLUX_FUNC_IMAGE}#g" \
        -e "s#<INSTALL_DIR>#${_INSTALL_DIR}#g" \
        -e "s#<SERVER_ARGV>#${__SERVER_ARGV}#g" \
        ${__DOCKER_STACK_FILE}

    log "New docker stack file with random secret/password created:"

else
    log "Docker stack file already exists:"
fi
log "  ${_INSTALL_DIR}/${__DOCKER_STACK_FILE}"

# 创建mosquitto 配置/密码文件
blankLine
if [ ${OPT_MQTT} = "TRUE" ]; then
    if [ ! -f ${__MOSQUITTO_CONFIG_FILE} ]; then
        echo -e "allow_anonymous false \
\npassword_file /mosquitto/passwd \
\nlistener 1883" \
> ${__MOSQUITTO_CONFIG_FILE}
        log "New mosquitto config file created:"
    else
        log "Mosquitto config file already exists:"
    fi
    log "  ${_INSTALL_DIR}/${__MOSQUITTO_CONFIG_FILE}"

    if [ ! -f ${__MOSQUITTO_PASSWD_FILE} ]; then
        echo -e "${__MQTT_USERNAME}:${__MQTT_PASSWORD} \
\n${__MQTT_SAMPLE_USERNAME}:${__MQTT_SAMPLE_PASSWORD}" \
> ${__MOSQUITTO_PASSWD_FILE}

        docker run --rm -v ${_INSTALL_DIR}/mosquitto:/mosquitto ${__MQTT_IMAGE} mosquitto_passwd -U /mosquitto/passwd

        log "New mosquitto passwd file created:"
    else
        log "Mosquitto passwd file already exists:"
    fi
    log "  ${_INSTALL_DIR}/${__MOSQUITTO_PASSWD_FILE}"
fi

# 创建logrotate配置
blankLine
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
log "Logrotate config file created:"
log "  /etc/logrotate.d/${__PROJECT_NAME}"

# 执行部署
blankLine
log "Deploying: ${__PROJECT_NAME}"
docker stack deploy ${__PROJECT_NAME} -c ${__DOCKER_STACK_FILE}

# 等待完成
blankLine
log "Please wait for the container to run, wait 30 seconds..."
sleep 30
docker ps

# 返回之前目录
cd ${__PREV_DIR}

# 获取本机IP信息
DOCKER_ADDRESS_LINE=(`docker info | grep 'Node Address'`)
THIS_IP=${DOCKER_ADDRESS_LINE[-1]}

# 提示信息
blankLine
if [ ${OPT_DEV} = "TRUE" ]; then
    log "Notice: A DEV version is deployed"
fi
if [ ${OPT_MINI} = "TRUE" ]; then
    log "Notice: DataFlux Func is running in MINI mode"
fi
if [ ${OPT_INSTALL_DIR} != "DEFAULT" ]; then
    log "Notice: DataFlux Func is deployed using a custom install dir: ${_INSTALL_DIR}"
fi
if [ ${OPT_IMAGE} != "DEFAULT" ]; then
    log "Notice: DataFlux Func is deployed using a custom image: ${_DATAFLUX_FUNC_IMAGE}"
fi
if [ ${OPT_NO_MYSQL} != "TRUE" ]; then
    log "Notice: Builtin MySQL is NOT deployed, please specify your MySQL server configs in setup page."
fi
if [ ${OPT_NO_REDIS} != "TRUE" ]; then
    log "Notice: Builtin Redis is NOT deployed, please specify your Redis server configs in setup page."
fi
if [ ${OPT_MQTT} = "TRUE" ]; then
    blankLine
    log "Builtin MQTT is deployed."
    log "    Sample client username/password is ${__MQTT_SAMPLE_USERNAME}/${__MQTT_SAMPLE_PASSWORD}"
    log "To subcribe message:"
    log "    $ mosquitto_sub -h 127.0.0.1 -u ${__MQTT_SAMPLE_USERNAME} -P ${__MQTT_SAMPLE_PASSWORD} -t testack"
    log "To publish message:"
    log "    $ mosquitto_pub -h 127.0.0.1 -u ${__MQTT_SAMPLE_USERNAME} -P ${__MQTT_SAMPLE_PASSWORD} -t test -m 'hello'"
    log "To add more MQTT client users:"
    log "    $ docker exec `docker ps -q -f label=mqtt` mosquitto_passwd -b /mosquitto/passwd username password"
    log "    $ docker kill `docker ps -q -f label=mqtt` -s HUP"
fi

blankLine
log "To shutdown:"
log "    $ docker stack remove ${__PROJECT_NAME}"
log "To start:"
log "    $ docker stack deploy ${__PROJECT_NAME} -c ${_INSTALL_DIR}/${__DOCKER_STACK_FILE}"
log "To uninstall:"
log "    $ docker stack remove ${__PROJECT_NAME}"
log "    $ rm -rf ${_INSTALL_DIR}"
log "    $ rm -f /etc/logrotate.d/${__PROJECT_NAME}"

blankLine
log "Now open http://127.0.0.1:8088/ or http://${THIS_IP}:8088/ and have fun!"
