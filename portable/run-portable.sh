#!/bin/bash
set -e

ETC_PATH=/etc/dataflux-func
if [ -f ${ETC_PATH} ]; then
    source ${ETC_PATH}
fi

# 本脚本参考了 Docker 官方文档，以及以下文章
#   https://www.cnblogs.com/helf/p/12889955.html

function stopPrevStack {
    docker stack remove "$1"

    isRunning=1
    while [ $isRunning -ne 0 ]; do
        echo 'Waiting...'
        sleep 3

        isRunning=`docker ps | grep "$1_" | wc -l`
    done
}

function blankLine {
    echo ''
}

function log {
    echo -e "\033[33m$1\033[0m"
}
function error {
    echo -e "\033[31m$1\033[0m"
}

# 处理选项
OPT_MINI=FALSE
OPT_PORT=DEFAULT
OPT_INSTALL_DIR=DEFAULT
OPT_NO_MYSQL=FALSE
OPT_NO_REDIS=FALSE
OPT_AUTO_SETUP=FALSE
OPT_AUTO_SETUP_ADMIN_USERNAME=""
OPT_AUTO_SETUP_ADMIN_PASSWORD=""
OPT_AUTO_SETUP_AK_ID=""
OPT_AUTO_SETUP_AK_SECRET=""

while [ $# -ge 1 ]; do
    case $1 in
        # 迷你版
        --mini )
            OPT_MINI=TRUE
            shift
            ;;

        # 端口
        --port=* )
            OPT_PORT="${1#*=}"
            shift
            ;;
        --port )
            OPT_PORT=$2
            shift 2
            ;;

        # 安装目录
        --install-dir=* )
            OPT_INSTALL_DIR="${1#*=}"
            shift
            ;;
        --install-dir )
            OPT_INSTALL_DIR=$2
            shift 2
            ;;

        # 不启动内置 MySQL
        --no-mysql )
            OPT_NO_MYSQL=TRUE
            shift
            ;;

        # 不启动内置 Redis
        --no-redis )
            OPT_NO_REDIS=TRUE
            shift
            ;;

        # 自动配置
        --auto-setup )
            OPT_AUTO_SETUP=TRUE
            shift
            ;;

        # 自动配置 admin 用户名
        --auto-setup-admin-username=* )
            OPT_AUTO_SETUP_ADMIN_USERNAME="${1#*=}"
            shift
            ;;
        --auto-setup-admin-username )
            OPT_AUTO_SETUP_ADMIN_USERNAME=$2
            shift 2
            ;;

        # 自动配置 admin 密码
        --auto-setup-admin-password=* )
            OPT_AUTO_SETUP_ADMIN_PASSWORD="${1#*=}"
            shift
            ;;
        --auto-setup-admin-password )
            OPT_AUTO_SETUP_ADMIN_PASSWORD=$2
            shift 2
            ;;

        # 自动配置 AccessKey ID
        --auto-setup-ak-id=* )
            OPT_AUTO_SETUP_AK_ID="${1#*=}"
            shift
            ;;
        --auto-setup-ak-id )
            OPT_AUTO_SETUP_AK_ID=$2
            shift 2
            ;;

        # 自动配置 AccessKey Secret
        --auto-setup-ak-secret=* )
            OPT_AUTO_SETUP_AK_SECRET="${1#*=}"
            shift
            ;;
        --auto-setup-ak-secret )
            OPT_AUTO_SETUP_AK_SECRET=$2
            shift 2
            ;;

        * )
            error "Unknown option: $1"
            exit 1
            ;;
    esac
done

# 配置
__PREV_DIR=${PWD}
__PORTABLE_DIR=$(cd `dirname $0`; pwd)
__SERVER_SECRET=`openssl rand -hex 8`
__MYSQL_PASSWORD=`openssl rand -hex 8`

__CONFIG_FILE=data/user-config.yaml
__DOCKER_STACK_FILE=docker-stack.yaml
__DOCKER_STACK_EXAMPLE_FILE=docker-stack.example.yaml

__PROJECT_NAME=dataflux-func

__DOCKER_BIN_FILE=docker-20.10.8.tgz
__SYSTEMD_FILE=docker.service

__LOGROTATE_FILE=/etc/logrotate.d/${__PROJECT_NAME}

__DATAFLUX_FUNC_IMAGE_GZIP_FILE=dataflux-func.tar.gz
__MYSQL_IMAGE_GZIP_FILE=mysql.tar.gz
__REDIS_IMAGE_GZIP_FILE=redis.tar.gz
__IMAGE_LIST_FILE=image-list
__VERSION_FILE=version

_PORT=8088
if [ ${OPT_PORT} != "DEFAULT" ]; then
    _PORT=${OPT_PORT}
fi

_INSTALL_DIR=/usr/local/${__PROJECT_NAME}
if [ ${OPT_INSTALL_DIR} != "DEFAULT" ]; then
    # 指定安装位置
    _INSTALL_DIR=${OPT_INSTALL_DIR}/${__PROJECT_NAME}
else
    # 默认安装位置，并优先使用上次安装位置
    if [ ${INSTALLED_DIR} ]; then
        log "* Found previous install directory: ${INSTALLED_DIR}"
        _INSTALL_DIR=${INSTALLED_DIR}
    fi
fi

log "Project name: ${__PROJECT_NAME}"
log "Port        : ${_PORT}"
log "Install dir : ${_INSTALL_DIR}/"
log "Version     : `cat ${__PORTABLE_DIR}/${__VERSION_FILE}`"

# 安装前根据 etc 检查
if [ ${INSTALLED_DIR} ] && [ ${INSTALLED_DIR} != ${_INSTALL_DIR} ]; then
    log ""
    log "You are reinstalling/upgrading DataFlux Func into a different directory by mistake."
    log "  Previous (from ${ETC_PATH}):"
    log "    -> ${INSTALLED_DIR}"
    log "  Current:"
    log "    -> ${_INSTALL_DIR} "
    log "When you are reinstalling/upgrading DataFlux Func, the --install-dir option is not needed."
    exit 1
fi

# 加载镜像信息
source ${__PORTABLE_DIR}/${__IMAGE_LIST_FILE}

# 检查架构是否匹配
if [ `uname -m` != ${IMAGE_ARCH} ]; then
    log ""
    log "Arch not match:"
    log "  current : `uname -m`"
    log "  portable: ${IMAGE_ARCH}"
    exit 1
fi

# 进入脚本所在目录
cd ${__PORTABLE_DIR}

# 安装 Docker
if [ ! `command -v docker` ]; then
    log "Install and prepare docker"
    tar -zxvf ${__DOCKER_BIN_FILE}
    cp docker/* /usr/bin/

    # 添加 systemd 配置
    cp ${__SYSTEMD_FILE} /etc/systemd/system/${__SYSTEMD_FILE}
    chmod 666 /etc/systemd/system/${__SYSTEMD_FILE}
    systemctl daemon-reload
    systemctl start docker
    systemctl enable ${__SYSTEMD_FILE}

    # 准备 Docker Swarm
    docker swarm init --advertise-addr=127.0.0.1 --default-addr-pool=10.255.0.0/16
fi

# 关闭之前的 Stack
stopPrevStack ${__PROJECT_NAME}

# 导入必要镜像
blankLine
log "Loading image: ${__DATAFLUX_FUNC_IMAGE_GZIP_FILE}"
docker load < ${__DATAFLUX_FUNC_IMAGE_GZIP_FILE}

# 未关闭 MySQL 时，需要加载镜像
if [ ${OPT_NO_MYSQL} = "FALSE" ]; then
    log "Loading image: ${__MYSQL_IMAGE_GZIP_FILE}"
    docker load < ${__MYSQL_IMAGE_GZIP_FILE}
fi

# 未关闭 Redis 时，需要加载镜像
if [ ${OPT_NO_REDIS} = "FALSE" ]; then
    log "Loading image: ${__REDIS_IMAGE_GZIP_FILE}"
    docker load < ${__REDIS_IMAGE_GZIP_FILE}
fi

# 创建运行环境目录并前往
blankLine
mkdir -p ${_INSTALL_DIR}/{data,data/resources/extra-python-packages,data/logs,data/sqldump,mysql,redis}

cd ${_INSTALL_DIR}
log "In ${_INSTALL_DIR}"

# 拷贝 Docker Stack 示例文件
cp ${__PORTABLE_DIR}/${__DOCKER_STACK_EXAMPLE_FILE} ${_INSTALL_DIR}/${__DOCKER_STACK_EXAMPLE_FILE}

# 创建预配置文件（主要目的是减少用户在配置页面的操作——只要点确认即可）
blankLine
if [ ! -f ${__CONFIG_FILE} ]; then
    echo -e "# Pre-generated config:"                > ${__CONFIG_FILE}
    echo -e "SECRET          : ${__SERVER_SECRET}"  >> ${__CONFIG_FILE}
    echo -e "MYSQL_HOST      : mysql"               >> ${__CONFIG_FILE}
    echo -e "MYSQL_PORT      : 3306"                >> ${__CONFIG_FILE}
    echo -e "MYSQL_USER      : root"                >> ${__CONFIG_FILE}
    echo -e "MYSQL_PASSWORD  : ${__MYSQL_PASSWORD}" >> ${__CONFIG_FILE}
    echo -e "MYSQL_DATABASE  : dataflux_func"       >> ${__CONFIG_FILE}
    echo -e "REDIS_HOST      : redis"               >> ${__CONFIG_FILE}
    echo -e "REDIS_PORT      : 6379"                >> ${__CONFIG_FILE}
    echo -e "REDIS_DATABASE  : 5"                   >> ${__CONFIG_FILE}
    echo -e "REDIS_PASSWORD  : ''"                  >> ${__CONFIG_FILE}
    echo -e "REDIS_USE_TLS   : false"               >> ${__CONFIG_FILE}

    # 启用自动配置
    if [ ${OPT_AUTO_SETUP} = "TRUE" ]; then
        echo -e "\n# Auto Setup:"  >> ${__CONFIG_FILE}
        echo -e "AUTO_SETUP: true" >> ${__CONFIG_FILE}

        if [ ${OPT_AUTO_SETUP_ADMIN_USERNAME} ] || [ ${OPT_AUTO_SETUP_ADMIN_PASSWORD} ]; then
            echo -e "\n# Auto setup admin:" >> ${__CONFIG_FILE}

            if [ ${OPT_AUTO_SETUP_ADMIN_USERNAME} ]; then
                echo -e "AUTO_SETUP_ADMIN_USERNAME: ${OPT_AUTO_SETUP_ADMIN_USERNAME}" >> ${__CONFIG_FILE}
            fi

            if [ ${OPT_AUTO_SETUP_ADMIN_PASSWORD} ]; then
                echo -e "AUTO_SETUP_ADMIN_PASSWORD: ${OPT_AUTO_SETUP_ADMIN_PASSWORD}" >> ${__CONFIG_FILE}
            fi
        fi

        if [ ${OPT_AUTO_SETUP_AK_SECRET} ]; then
            echo -e "\n# Auto setup AK:" >> ${__CONFIG_FILE}

            if [ ${OPT_AUTO_SETUP_AK_ID} ]; then
                echo -e "AUTO_SETUP_AK_ID    : ${OPT_AUTO_SETUP_AK_ID}" >> ${__CONFIG_FILE}
            fi

            echo -e "AUTO_SETUP_AK_SECRET: ${OPT_AUTO_SETUP_AK_SECRET}" >> ${__CONFIG_FILE}
        fi
    fi

    log "New config file with random secret/password created:"
else
    log "Config file already exists:"
fi
log "  ${_INSTALL_DIR}/${__CONFIG_FILE}"

# 创建 Docker Stack 配置文件
blankLine
if [ ! -f ${__DOCKER_STACK_FILE} ]; then
    cp ${__DOCKER_STACK_EXAMPLE_FILE} ${__DOCKER_STACK_FILE}

    # 创建配置文件并使用随机密钥 / 密码
    if [ ${OPT_MINI} = "TRUE" ]; then
        # 启用 mini 方式安装，去除 Worker default 配置部分
        sed -i "/# WORKER DEFAULT START/,/# WORKER DEFAULT END/d" \
            ${__DOCKER_STACK_FILE}
    else
        # 默认方式安装，去除 Worker mini 配置部分
        sed -i "/# WORKER MINI START/,/# WORKER MINI END/d" \
            ${__DOCKER_STACK_FILE}
    fi

    # 关闭 MySQL 时，去除 MySQL 配置部分
    if [ ${OPT_NO_MYSQL} = "TRUE" ]; then
        sed -i "/# MYSQL START/,/# MYSQL END/d" \
            ${__DOCKER_STACK_FILE}
    fi

    # 关闭 Redis 时，去除 Redis 配置部分
    if [ ${OPT_NO_REDIS} = "TRUE" ]; then
        sed -i "/# REDIS START/,/# REDIS END/d" \
            ${__DOCKER_STACK_FILE}
    fi

    sed -i \
        -e "s#<MYSQL_PASSWORD>#${__MYSQL_PASSWORD}#g" \
        -e "s#<MYSQL_IMAGE>#${MYSQL_IMAGE}#g" \
        -e "s#<REDIS_IMAGE>#${REDIS_IMAGE}#g" \
        -e "s#<DATAFLUX_FUNC_IMAGE>#${DATAFLUX_FUNC_IMAGE}#g" \
        -e "s#<PORT>#${_PORT}#g" \
        -e "s#<INSTALL_DIR>#${_INSTALL_DIR}#g" \
        ${__DOCKER_STACK_FILE}

    log "New docker stack file with random secret/password created:"

else
    log "Docker stack file already exists:"

    # 为 MySQL 服务添加 TLS 版本
    if [ `grep "\-\-tls\-version" ${__DOCKER_STACK_FILE} | wc -l` -eq 0 ]; then
            echo 'Add `--tls-version=TLSv1.2` to mysql service'
            sed -i \
                -e "s#command: --innodb-large-prefix=on#command: --tls-version=TLSv1.2 --innodb-large-prefix=on#g" \
                ${__DOCKER_STACK_FILE}
    fi
fi
log "  ${_INSTALL_DIR}/${__DOCKER_STACK_FILE}"

# 创建 logrotate 配置
blankLine
if [ `command -v logrotate` ] && [ -d /etc/logrotate.d ]; then
    echo -e "${_INSTALL_DIR}/data/logs/dataflux-func.log {"  > ${__LOGROTATE_FILE}
    echo -e "    missingok"                                 >> ${__LOGROTATE_FILE}
    echo -e "    copytruncate"                              >> ${__LOGROTATE_FILE}
    echo -e "    compress"                                  >> ${__LOGROTATE_FILE}
    echo -e "    daily"                                     >> ${__LOGROTATE_FILE}
    echo -e "    rotate 7"                                  >> ${__LOGROTATE_FILE}
    echo -e "    dateext"                                   >> ${__LOGROTATE_FILE}
    echo -e "}"                                             >> ${__LOGROTATE_FILE}

    log "Logrotate config file created:"
    log "  ${__LOGROTATE_FILE}"
fi

# 执行部署
blankLine
log "Deploying: ${__PROJECT_NAME}"
docker stack deploy ${__PROJECT_NAME} -c ${__DOCKER_STACK_FILE} --resolve-image never

# 等待完成
blankLine
log "Please wait 30 seconds for the system to be ready..."
sleep 30
docker ps

# 返回之前目录
cd ${__PREV_DIR}

# 提示信息
blankLine
if [ ${OPT_MINI} = "TRUE" ]; then
    log "Notice: DataFlux Func is running in MINI mode"
fi
if [ ${OPT_NO_MYSQL} = "TRUE" ]; then
    log "Notice: Built-in MySQL is NOT deployed, please specify your MySQL server configs in setup page."
fi
if [ ${OPT_NO_REDIS} = "TRUE" ]; then
    log "Notice: Built-in Redis is NOT deployed, please specify your Redis server configs in setup page."
fi

blankLine
log "Port:"
log "    ${_PORT}"
log "Installed dir:"
log "    ${_INSTALL_DIR}"
log "To shutdown:"
log "    sudo docker stack remove ${__PROJECT_NAME}"
log "To start:"
log "    sudo docker stack deploy ${__PROJECT_NAME} -c ${_INSTALL_DIR}/${__DOCKER_STACK_FILE}"
log "To uninstall:"
log "    sudo docker stack remove ${__PROJECT_NAME}"
log "    sudo rm -rf ${_INSTALL_DIR}"
log "    sudo rm -f /etc/logrotate.d/${__PROJECT_NAME}"

blankLine
log "Now open http://<IP or Domain>:${_PORT}/ and have fun!"

# 写入 /etc 信息
if [ ! -f ${ETC_PATH} ]; then
    echo "INSTALLED_DIR=${_INSTALL_DIR}" > ${ETC_PATH}
fi
