FROM ubuntu:20.04

MAINTAINER Yiling Zhou <zyl@jiagouyun.com>

ENV PATH "$PATH:/usr/src/resource/node-v12.16.3-linux-x64/bin"

ARG RESOURCE_BASE_URL="https://zhuyun-static-files-production.oss-cn-hangzhou.aliyuncs.com/dataflux-func/resource"
ARG NODE_PKG="node-v12.16.3-linux-x64.tar.gz"
ARG ORACLE_CLIENT_PKG="oracle-instantclient-basic-linux.x64-19.6.0.0.0dbru.zip"

USER root

# Default data folder
RUN mkdir -p /data/extra-python-packages && \
    mkdir -p /data/resources && \
    mkdir -p /data/logs && \
    mkdir -p /data/sqldump

# Install
RUN echo "deb http://mirrors.aliyun.com/ubuntu/ focal main restricted universe multiverse \
            \ndeb-src http://mirrors.aliyun.com/ubuntu/ focal main restricted universe multiverse \
            \ndeb http://mirrors.aliyun.com/ubuntu/ focal-security main restricted universe multiverse \
            \ndeb-src http://mirrors.aliyun.com/ubuntu/ focal-security main restricted universe multiverse \
            \ndeb http://mirrors.aliyun.com/ubuntu/ focal-updates main restricted universe multiverse \
            \ndeb-src http://mirrors.aliyun.com/ubuntu/ focal-updates main restricted universe multiverse \
            \ndeb http://mirrors.aliyun.com/ubuntu/ focal-proposed main restricted universe multiverse \
            \ndeb-src http://mirrors.aliyun.com/ubuntu/ focal-proposed main restricted universe multiverse \
            \ndeb http://mirrors.aliyun.com/ubuntu/ focal-backports main restricted universe multiverse \
            \ndeb-src http://mirrors.aliyun.com/ubuntu/ focal-backports main restricted universe multiverse" \
            > /etc/apt/sources.list && \
    apt-get update && \
    apt-get install -y wget curl telnet zip unzip python3.8-dev python3-pip default-libmysqlclient-dev build-essential mysql-client && \
                update-alternatives --install /usr/bin/python python /usr/bin/python3.8 100

# Download, extract and install resources
WORKDIR /usr/src/resource
RUN wget -q $RESOURCE_BASE_URL/$NODE_PKG && \
        tar -xf $NODE_PKG && \
    wget -q $RESOURCE_BASE_URL/$ORACLE_CLIENT_PKG && \
        unzip $ORACLE_CLIENT_PKG -d /opt/oracle && \
        sh -c "echo /opt/oracle/instantclient_19_6 > /etc/ld.so.conf.d/oracle-instantclient.conf" && \
        ldconfig && \
    rm /usr/src/resource/$NODE_PKG && \
    rm /usr/src/resource/$ORACLE_CLIENT_PKG

# Install requirements (server)
WORKDIR /usr/src/base
COPY package.json package-lock.json requirements.txt requirements-dataflux.txt ./
RUN npm ci --registry=http://registry.npm.taobao.org --disturl=http://npm.taobao.org/dist && \
        pip install --no-cache-dir -i https://mirrors.aliyun.com/pypi/simple/ -r ./requirements.txt && \
        pip install --no-cache-dir -i https://mirrors.aliyun.com/pypi/simple/ -r ./requirements-dataflux.txt

# Install requirements (client)
WORKDIR /usr/src/base/client
COPY client/package.json client/package-lock.json ./
RUN npm ci --registry=http://registry.npm.taobao.org --disturl=http://npm.taobao.org/dist

# Build project
WORKDIR /usr/src/app
COPY . .
RUN python echo-image-info.py && \
    ln -s /usr/src/base/node_modules ./node_modules && \
    ln -s /usr/src/base/client/node_modules ./client/node_modules && \
    cd /usr/src/app/client && \
        npm run build

# Run Web server
# EXPOSE 8088
# CMD ./run-server.sh
# Run Worker
# CMD ./run-worker.sh
# Run Worker beat
# CMD ./run-beat.sh
