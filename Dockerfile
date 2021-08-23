FROM ubuntu:20.04

MAINTAINER Yiling Zhou <zyl@jiagouyun.com>

ARG TARGETARCH

ENV PATH "$PATH:/usr/src/resource/node-v12.16.3-linux-x64/bin:/usr/src/resource/node-v12.16.3-linux-arm64/bin"
ENV TARGETARCH ${TARGETARCH}

ARG RESOURCE_BASE_URL="https://static.dataflux.cn/dataflux-func/resource"
ARG NODE_PKG_X64="node-v12.16.3-linux-x64.tar.gz"
ARG NODE_PKG_ARM64="node-v12.16.3-linux-arm64.tar.gz"
ARG ORACLE_CLIENT_PKG="oracle-instantclient-basic-linux.x64-19.6.0.0.0dbru.zip"

USER root

# Default data folder
RUN mkdir -p /data/extra-python-packages && \
    mkdir -p /data/resources && \
    mkdir -p /data/logs && \
    mkdir -p /data/sqldump

# Install
RUN apt-get update && \
    apt-get install -y iputils-ping vim wget curl telnet zip unzip python3.8-dev python3-pip default-libmysqlclient-dev build-essential mysql-client libpq-dev && \
                update-alternatives --install /usr/bin/python python /usr/bin/python3.8 100

# Download, extract and install resources
WORKDIR /usr/src/resource
RUN case ${TARGETARCH} in \
        "amd64" ) \
            wget -q ${RESOURCE_BASE_URL}/${NODE_PKG_X64} && \
                tar -xf ${NODE_PKG_X64} && \
            wget -q ${RESOURCE_BASE_URL}/${ORACLE_CLIENT_PKG} && \
                unzip ${ORACLE_CLIENT_PKG} -d /opt/oracle && \
                sh -c "echo /opt/oracle/instantclient_19_6 > /etc/ld.so.conf.d/oracle-instantclient.conf" && \
                ldconfig && \
            rm /usr/src/resource/${NODE_PKG_X64} && \
            rm /usr/src/resource/${ORACLE_CLIENT_PKG} \
            ;; \

        "arm64" ) \
            wget -q ${RESOURCE_BASE_URL}/${NODE_PKG_ARM64} && \
                tar -xf ${NODE_PKG_ARM64} && \
            rm /usr/src/resource/${NODE_PKG_ARM64} \
            ;; \
    esac

# Install requirements (server)
WORKDIR /usr/src/base
COPY package.json package-lock.json requirements.txt requirements-arm64.txt ./
RUN npm ci --registry=http://registry.npm.taobao.org --disturl=http://npm.taobao.org/dist && \
    case ${TARGETARCH} in \
        "amd64" ) \
            pip install --no-cache-dir -i https://mirrors.aliyun.com/pypi/simple/ -r ./requirements.txt \
            ;; \

        "arm64" ) \
            pip install --no-cache-dir -i https://mirrors.aliyun.com/pypi/simple/ -r ./requirements-arm64.txt \
            ;; \
    esac

# Install requirements (client)
WORKDIR /usr/src/base/client
COPY client/package.json client/package-lock.json ./
RUN npm ci --registry=http://registry.npm.taobao.org --disturl=http://npm.taobao.org/dist

# Some fix
COPY misc/openssl.cnf /etc/ssl/openssl.cnf

# Build project
WORKDIR /usr/src/app
COPY . .
RUN python echo-image-info.py > image-info.json && \
    ln -s /usr/src/base/node_modules ./node_modules && \
    ln -s /usr/src/base/client/node_modules ./client/node_modules && \
    cd /usr/src/app/client && \
        npm run build

COPY docker-entrypoint.sh /usr/local/bin/
ENTRYPOINT ["docker-entrypoint.sh"]

# Run Web server
# EXPOSE 8088
# CMD ./run-server.sh
# Run Worker
# CMD ./run-worker.sh
# Run Worker beat
# CMD ./run-beat.sh
