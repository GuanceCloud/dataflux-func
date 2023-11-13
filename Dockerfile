FROM ubuntu:20.04

MAINTAINER Yiling Zhou <zyl@jiagouyun.com>

ARG TARGETARCH

ARG RESOURCE_BASE_URL="https://static.guance.com/dataflux-func/resource"
ARG NODE_PKG_X64="node-v16.17.0-linux-x64.tar.gz"
ARG NODE_PKG_ARM64="node-v16.17.0-linux-arm64.tar.gz"
ARG ORACLE_CLIENT_PKG_X64="oracle-instantclient-basic-linux.x64-19.6.0.0.0dbru.zip"
ARG ORACLE_CLIENT_PKG_ARM64="oracle-instantclient-basic-linux.arm64-19.10.0.0.0dbru.zip"

ENV TARGETARCH ${TARGETARCH}
ENV PATH "$PATH:/usr/src/resource/node-v16.17.0-linux-x64/bin:/usr/src/resource/node-v16.17.0-linux-arm64/bin"
ENV PYTHONPATH="$PYTHONPATH:/usr/src/app"
ENV LANG="C.UTF-8"

USER root

# 默认数据目录
RUN mkdir -p /data/extra-python-packages && \
    mkdir -p /data/resources && \
    mkdir -p /data/logs && \
    mkdir -p /data/sqldump

# 设置系统时区
RUN ln -snf /usr/share/zoneinfo/Asia/Shanghai /etc/localtime && \
        echo "Asia/Shanghai" > /etc/timezone

# 替换镜像源并安装常用工具
RUN sed -i 's/archive.ubuntu.com/mirrors.tuna.tsinghua.edu.cn/g' /etc/apt/sources.list && \
    sed -i 's/ports.ubuntu.com/mirrors.tuna.tsinghua.edu.cn/g' /etc/apt/sources.list && \
    sed -i 's/security.ubuntu.com/mirrors.tuna.tsinghua.edu.cn/g' /etc/apt/sources.list && \
    apt-get update && \
    apt-get install -y vim tzdata telnet curl wget net-tools iputils-ping zip unzip unar snmp git \
                python3.8-dev python3-pip default-libmysqlclient-dev build-essential mysql-client redis-tools libpq-dev libaio1 && \
                update-alternatives --install /usr/bin/python python /usr/bin/python3.8 100

# 安装 Nodejs、Oracle 客户端
WORKDIR /usr/src/resource
RUN case ${TARGETARCH} in \
        "amd64" ) \
            wget -q ${RESOURCE_BASE_URL}/${NODE_PKG_X64} && \
                tar -xf ${NODE_PKG_X64} && \
            wget -q ${RESOURCE_BASE_URL}/${ORACLE_CLIENT_PKG_X64} && \
                unzip ${ORACLE_CLIENT_PKG_X64} -d /opt/oracle && \
                sh -c "echo /opt/oracle/instantclient_19_6 > /etc/ld.so.conf.d/oracle-instantclient.conf" && \
                ldconfig && \
            rm /usr/src/resource/${NODE_PKG_X64} && \
            rm /usr/src/resource/${ORACLE_CLIENT_PKG_X64} \
            ;; \

        "arm64" ) \
            wget -q ${RESOURCE_BASE_URL}/${NODE_PKG_ARM64} && \
                tar -xf ${NODE_PKG_ARM64} && \
            wget -q ${RESOURCE_BASE_URL}/${ORACLE_CLIENT_PKG_ARM64} && \
                unzip ${ORACLE_CLIENT_PKG_ARM64} -d /opt/oracle && \
                sh -c "echo /opt/oracle/instantclient_19_10 > /etc/ld.so.conf.d/oracle-instantclient.conf" && \
                ldconfig && \
            rm /usr/src/resource/${NODE_PKG_ARM64} && \
            rm /usr/src/resource/${ORACLE_CLIENT_PKG_ARM64} \
            ;; \
    esac

# 安装 DataFlux Func 后端依赖包
WORKDIR /usr/src/base
COPY package.json package-lock.json requirements.txt ./
RUN npm ci --registry=http://registry.npmmirror.com --disturl=http://npmmirror.com/dist && \
        rm -rf /usr/src/base/node_modules/node-rdkafka/examples && \
        rm -rf /usr/src/base/node_modules/node-rdkafka/deps     && \
        pip install -i https://pypi.douban.com/simple/ -r ./requirements.txt

# 安装 DataFlux Func 前端依赖包
WORKDIR /usr/src/base/client
COPY client/package.json client/package-lock.json ./
RUN npm ci --registry=http://registry.npmmirror.com --disturl=http://npmmirror.com/dist --unsafe-perm

# 构建项目
WORKDIR /usr/src/app
COPY . .
RUN wget https://urls.guance.com/ --no-use-server-timestamps -O /usr/src/app/guance-node-urls.json  && \
    ln -s /usr/src/base/node_modules ./node_modules && \
    ln -s /usr/src/base/client/node_modules ./client/node_modules && \
    cd /usr/src/app/client && \
        npm run build && \
    python echo-image-info.py > image-info.json

# 启动脚本
COPY docker-entrypoint.sh /usr/local/bin/
ENTRYPOINT ["docker-entrypoint.sh"]

# 参考
# 启动 Web 服务器
# EXPOSE 8088
# CMD ./run-server.sh

# 启动 Worker 进程
# CMD ./run-worker.sh

# 启动 Beat 进程
# CMD ./run-beat.sh
