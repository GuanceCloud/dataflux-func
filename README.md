# DataFlux Func

DataFlux Func 是一个基于Python 的类ServerLess 的脚本开发、管理及执行平台。

> `DataFlux Func` 读作`data flux function`，系统内有时会缩写为`DFF`。

前身为[DataFlux](https://dataflux.cn/) 下属的一个函数计算组建，目前已成为可独立运行的系统。

本系统主要分为2个部分：

- Server：使用Node.js + Express 构建，主要提供Web UI 客户端、对外API 接口
- Worker：使用Python3 + Celery 构建，主要提供Python 脚本的执行环境（内含Beat模块）


## 目录

<!-- MarkdownTOC -->

- [1. 系统及环境要求](#1-%E7%B3%BB%E7%BB%9F%E5%8F%8A%E7%8E%AF%E5%A2%83%E8%A6%81%E6%B1%82)
    - [1.1 系统要求](#11-%E7%B3%BB%E7%BB%9F%E8%A6%81%E6%B1%82)
    - [1.2 软件准备](#12-%E8%BD%AF%E4%BB%B6%E5%87%86%E5%A4%87)
- [2. 使用「携带版」离线部署【推荐】](#2-%E4%BD%BF%E7%94%A8%E3%80%8C%E6%90%BA%E5%B8%A6%E7%89%88%E3%80%8D%E7%A6%BB%E7%BA%BF%E9%83%A8%E7%BD%B2%E3%80%90%E6%8E%A8%E8%8D%90%E3%80%91)
    - [2.1 一键命令下载「携带版」](#21-%E4%B8%80%E9%94%AE%E5%91%BD%E4%BB%A4%E4%B8%8B%E8%BD%BD%E3%80%8C%E6%90%BA%E5%B8%A6%E7%89%88%E3%80%8D)
    - [2.2 手工下载「携带版」](#22-%E6%89%8B%E5%B7%A5%E4%B8%8B%E8%BD%BD%E3%80%8C%E6%90%BA%E5%B8%A6%E7%89%88%E3%80%8D)
    - [2.3 使用自动部署脚本执行部署](#23-%E4%BD%BF%E7%94%A8%E8%87%AA%E5%8A%A8%E9%83%A8%E7%BD%B2%E8%84%9A%E6%9C%AC%E6%89%A7%E8%A1%8C%E9%83%A8%E7%BD%B2)
- [3. 使用一键安装命令在线安装](#3-%E4%BD%BF%E7%94%A8%E4%B8%80%E9%94%AE%E5%AE%89%E8%A3%85%E5%91%BD%E4%BB%A4%E5%9C%A8%E7%BA%BF%E5%AE%89%E8%A3%85)
- [4. 安装选项](#4-%E5%AE%89%E8%A3%85%E9%80%89%E9%A1%B9)
    - [4.1 「携带版」指定安装选项](#41-%E3%80%8C%E6%90%BA%E5%B8%A6%E7%89%88%E3%80%8D%E6%8C%87%E5%AE%9A%E5%AE%89%E8%A3%85%E9%80%89%E9%A1%B9)
    - [4.2 在线安装版指定安装选项](#42-%E5%9C%A8%E7%BA%BF%E5%AE%89%E8%A3%85%E7%89%88%E6%8C%87%E5%AE%9A%E5%AE%89%E8%A3%85%E9%80%89%E9%A1%B9)
    - [4.3 可用安装选项](#43-%E5%8F%AF%E7%94%A8%E5%AE%89%E8%A3%85%E9%80%89%E9%A1%B9)
        - [4.3.1 `--mini`：安装迷你版](#431---mini%EF%BC%9A%E5%AE%89%E8%A3%85%E8%BF%B7%E4%BD%A0%E7%89%88)
        - [4.3.2 `--install-dir {安装目录}`：指定安装目录](#432---install-dir-%E5%AE%89%E8%A3%85%E7%9B%AE%E5%BD%95%EF%BC%9A%E6%8C%87%E5%AE%9A%E5%AE%89%E8%A3%85%E7%9B%AE%E5%BD%95)
        - [4.3.3 `--no-mysql`：禁用内置MySQL](#433---no-mysql%EF%BC%9A%E7%A6%81%E7%94%A8%E5%86%85%E7%BD%AEmysql)
        - [4.3.4 `--no-redis`：禁用内置Redis](#434---no-redis%EF%BC%9A%E7%A6%81%E7%94%A8%E5%86%85%E7%BD%AEredis)
        - [4.3.5 `--mqtt`：启用内置MQTT Broker](#435---mqtt%EF%BC%9A%E5%90%AF%E7%94%A8%E5%86%85%E7%BD%AEmqtt-broker)
- [5. 运维相关](#5-%E8%BF%90%E7%BB%B4%E7%9B%B8%E5%85%B3)
    - [5.1 更新部署](#51-%E6%9B%B4%E6%96%B0%E9%83%A8%E7%BD%B2)
    - [5.2 重启系统](#52-%E9%87%8D%E5%90%AF%E7%B3%BB%E7%BB%9F)
    - [5.3 查看Docker Stack 配置](#53-%E6%9F%A5%E7%9C%8Bdocker-stack-%E9%85%8D%E7%BD%AE)
    - [5.3 查看配置](#53-%E6%9F%A5%E7%9C%8B%E9%85%8D%E7%BD%AE)
    - [5.4 查看日志](#54-%E6%9F%A5%E7%9C%8B%E6%97%A5%E5%BF%97)
    - [5.5 数据库自动备份](#55-%E6%95%B0%E6%8D%AE%E5%BA%93%E8%87%AA%E5%8A%A8%E5%A4%87%E4%BB%BD)
    - [5.6 完全卸载](#56-%E5%AE%8C%E5%85%A8%E5%8D%B8%E8%BD%BD)
    - [5.7 参数调整](#57-%E5%8F%82%E6%95%B0%E8%B0%83%E6%95%B4)
    - [5.8 迁移数据库](#58-%E8%BF%81%E7%A7%BB%E6%95%B0%E6%8D%AE%E5%BA%93)
    - [5.9 高可用部署](#59-%E9%AB%98%E5%8F%AF%E7%94%A8%E9%83%A8%E7%BD%B2)
- [6. 故障排查](#6-%E6%95%85%E9%9A%9C%E6%8E%92%E6%9F%A5)
    - [6.1 安装部署时脚本中断](#61-%E5%AE%89%E8%A3%85%E9%83%A8%E7%BD%B2%E6%97%B6%E8%84%9A%E6%9C%AC%E4%B8%AD%E6%96%AD)
    - [6.2 安装部署完成后无法启动](#62-%E5%AE%89%E8%A3%85%E9%83%A8%E7%BD%B2%E5%AE%8C%E6%88%90%E5%90%8E%E6%97%A0%E6%B3%95%E5%90%AF%E5%8A%A8)
    - [6.3 安装部署完成后启动成功但无法访问](#63-%E5%AE%89%E8%A3%85%E9%83%A8%E7%BD%B2%E5%AE%8C%E6%88%90%E5%90%8E%E5%90%AF%E5%8A%A8%E6%88%90%E5%8A%9F%E4%BD%86%E6%97%A0%E6%B3%95%E8%AE%BF%E9%97%AE)
    - [6.4 函数执行返回超时](#64-%E5%87%BD%E6%95%B0%E6%89%A7%E8%A1%8C%E8%BF%94%E5%9B%9E%E8%B6%85%E6%97%B6)
        - [6.4.1 函数执行耗时过长导致工作进程被Kill](#641-%E5%87%BD%E6%95%B0%E6%89%A7%E8%A1%8C%E8%80%97%E6%97%B6%E8%BF%87%E9%95%BF%E5%AF%BC%E8%87%B4%E5%B7%A5%E4%BD%9C%E8%BF%9B%E7%A8%8B%E8%A2%ABkill)
        - [6.4.2 函数执行耗时过长导致API接口提前返回](#642-%E5%87%BD%E6%95%B0%E6%89%A7%E8%A1%8C%E8%80%97%E6%97%B6%E8%BF%87%E9%95%BF%E5%AF%BC%E8%87%B4api%E6%8E%A5%E5%8F%A3%E6%8F%90%E5%89%8D%E8%BF%94%E5%9B%9E)
    - [6.5 函数执行无响应](#65-%E5%87%BD%E6%95%B0%E6%89%A7%E8%A1%8C%E6%97%A0%E5%93%8D%E5%BA%94)
        - [6.5.1 测试函数有响应](#651-%E6%B5%8B%E8%AF%95%E5%87%BD%E6%95%B0%E6%9C%89%E5%93%8D%E5%BA%94)
        - [6.5.2 测试函数无响应](#652-%E6%B5%8B%E8%AF%95%E5%87%BD%E6%95%B0%E6%97%A0%E5%93%8D%E5%BA%94)
- [X. 项目介绍](#x-%E9%A1%B9%E7%9B%AE%E4%BB%8B%E7%BB%8D)
    - [X.1 主要功能](#x1-%E4%B8%BB%E8%A6%81%E5%8A%9F%E8%83%BD)
    - [X.2 支持的数据源](#x2-%E6%94%AF%E6%8C%81%E7%9A%84%E6%95%B0%E6%8D%AE%E6%BA%90)
    - [X.3 相关链接](#x3-%E7%9B%B8%E5%85%B3%E9%93%BE%E6%8E%A5)

<!-- /MarkdownTOC -->

*注意：本文所有涉及到的shell命令，在root用户下可直接运行，非root用户下需要添加sudo运行*

## 1. 系统及环境要求

安装部署DataFlux 之前，请务必确认环境已经满足以下条件

### 1.1 系统要求

运行DataFlux Func 的主机需要满足以下条件：

- CPU 核心数 >= 2
- 内存容量 >= 4GB
- 磁盘空间 >= 20GB
- 操作系统为 Ubuntu 16.04 LTS/CentOS 7.6 以上
- 纯净系统（安装完操作系统后，除了配置网络外没有进行过其他操作）

### 1.2 软件准备

本系统基于Docker Stack部署，因此要求操作系统可以正常使用Docker 和Docker Stack

携带版安装脚本本身已经自带了Docker 的安装包并会在部署时自动安装。
用户也可以自行安装Docker 并初始化Docker Swarm，然后运行部署脚本，
部署脚本在发现Docker 已经安装后会自动跳过这部分处理。

- Docker Swarm 初始化命令为：`docker swarm init`

如果本机存在多个网卡，需要在上述初始化命令中指定网卡

- 存在多网卡的建议用户自行安装Docker 并初始化Docker Swarm
- Docker Swarm 指定网卡的初始化命令为：`docker swarm init --advertise-addr={网卡名}`
- 本机网卡列表可以通过`ifconfig`或者`ip addr`查询





## 2. 使用「携带版」离线部署【推荐】

*本方式为推荐部署方式*

DataFlux Func 支持将所需资源下载后，通过U盘等移动设备带入无公网环境安装的「携带版」。

下载的「携带版」本身附带了自动安装脚本，执行即可进行安装部署（详情见下文）

### 2.1 一键命令下载「携带版」

对于Linux、macOS 等系统，推荐使用官方提供的shell 命令下载「携带版」。

运行以下命令，即可自动下载DataFlux Func携带版的所需文件：

```shell
/bin/bash -c "$(curl -fsSL https://t.dataflux.cn/func-portable-download)"
```

命令执行完成后，所有所需文件都保存在当前目录下新创建的`dataflux-func-portable`目录下。
直接将整个目录通过U盘等移动存储设备复制到目标机器中。

### 2.2 手工下载「携带版」

对于不便使用shell 命令的系统，可手工下载所需资源文件。

如需要手工下载，以下是所有的文件列表：

1. [README.md](https://zhuyun-static-files-production.oss-cn-hangzhou.aliyuncs.com/dataflux-func/resource/README.md)
2. [Docker 二进制程序： docker-18.06.3-ce.tgz](https://zhuyun-static-files-production.oss-cn-hangzhou.aliyuncs.com/dataflux-func/portable/docker-18.06.3-ce.tgz)
3. [Docker 服务配置文件： docker.service](https://zhuyun-static-files-production.oss-cn-hangzhou.aliyuncs.com/dataflux-func/portable/docker.service)
4. [MySQL 镜像： mysql.tar.gz](https://zhuyun-static-files-production.oss-cn-hangzhou.aliyuncs.com/dataflux-func/portable/mysql.tar.gz)
5. [Redis 镜像： redis.tar.gz](https://zhuyun-static-files-production.oss-cn-hangzhou.aliyuncs.com/dataflux-func/portable/redis.tar.gz)
6. [Mosquitto 镜像： eclipse-mosquitto.tar.gz](https://zhuyun-static-files-production.oss-cn-hangzhou.aliyuncs.com/dataflux-func/portable/eclipse-mosquitto.tar.gz)
7. [DataFluxFunc 镜像： dataflux-func.tar.gz](https://zhuyun-static-files-production.oss-cn-hangzhou.aliyuncs.com/dataflux-func/portable/dataflux-func.tar.gz)
8. [Docker Stack 配置文件：docker-stack.example.yaml](https://zhuyun-static-files-production.oss-cn-hangzhou.aliyuncs.com/dataflux-func/portable/docker-stack.example.yaml)
9. [DataFluxFunc 部署脚本：run-portable.sh](https://zhuyun-static-files-production.oss-cn-hangzhou.aliyuncs.com/dataflux-func/portable/run-portable.sh)

手工下载所有文件后，放入新建的`dataflux-func-portable`目录下即可。

*注意：如有更新，【重新下载所有文件】。请勿自行猜测哪些文件有变动，哪些没有变动*

*注意：手工下载时，如使用浏览器等下载时，请注意不要下载到缓存的旧内容！！*

### 2.3 使用自动部署脚本执行部署

在已经下载的`dataflux-func-portable`目录下，
运行以下命令，即可自动配置并最终启动整个DataFlux Func：

```shell
/bin/bash run-portable.sh
```

使用自动部署脚本可以实现几分钟内快速部署运行，自动配置的内容如下：

- 运行MySQL、Redis、DataFlux Func（包含Server，Worker，Beat）
- 自动创建并将所有数据保存于`/usr/local/dataflux-func/`目录下（包括MySQL数据、Redis数据、DataFlux Func 配置、日志等文件）
- 随机生成MySQL `root`用户密码、系统Secret，并保存于DataFlux Func 配置文件中
- Redis不设密码
- MySQL、Redis 不提供外部访问

执行完成后，可以使用浏览器访问`http://{服务器IP地址/域名}:8088`进行初始化操作界面。

*注意：如果运行环境性能较差，应当使用`docker ps`命令确认所有组件成功启动后，方可访问（见以下列表）*

1. `dataflux-func_mysql`
2. `dataflux-func_redis`
3. `dataflux-func_server`
4. `dataflux-func_worker-0`
5. `dataflux-func_worker-1-6`
6. `dataflux-func_worker-7`
7. `dataflux-func_worker-8-9`
8. `dataflux-func_beat`



## 3. 使用一键安装命令在线安装

*由于涉及私有镜像库等事宜，本方式不做为首推方案*

DataFlux Func 提供了一键安装脚本，可以在数分钟内完成部署运行。

*注意：需要事先登录驻云官方镜像库*

运行以下命令，即可自动下载配置脚本并最终启动整个DataFlux Func：

```shell
/bin/bash -c "$(curl -fsSL https://t.dataflux.cn/func-docker-stack-run)"
```

使用自动部署脚本可以实现几分钟内快速部署运行，自动配置的内容如下：

- 运行MySQL、Redis、DataFlux Func（包含Server，Worker，Beat）
- 自动创建并将所有数据保存于`/usr/local/dataflux-func/`目录下（包括MySQL数据、Redis数据、DataFlux Func 配置、日志等文件）
- 随机生成MySQL `root`用户密码、系统Secret，并保存于DataFlux Func 配置文件中
- Redis不设密码
- MySQL、Redis 不提供外部访问

执行完成后，可以使用浏览器访问`http://localhost:8088`进行初始化操作界面。

*注意：如果运行环境性能较差，应当使用`docker ps`命令确认所有组件成功启动后，方可访问（见以下列表）*

1. `dataflux-func_mysql`
2. `dataflux-func_redis`
3. `dataflux-func_server`
4. `dataflux-func_worker-0`
5. `dataflux-func_worker-1-6`
6. `dataflux-func_worker-7`
7. `dataflux-func_worker-8-9`
8. `dataflux-func_beat`



## 4. 安装选项

自动安装脚本支持一些安装选项，用于适应不同的安装需求

### 4.1 「携带版」指定安装选项

安装「携带版」时，只需要在自动部署命令后添加`--{参数}[ 参数配置（如有）]`，即可指定安装选项

```shell
# 示例：指定安装目录，同时开启MQTT组件（mosquitto）
/bin/bash run-portable.sh --install-dir /home/dev/datafluxfunc --mqtt
```

### 4.2 在线安装版指定安装选项

使用一键安装命令在线安装时，只需要在自动部署命令后添加`-- --{参数}[ 参数配置（如有）]`，即可指定安装选项

```shell
# 示例：指定安装目录，同时开启MQTT组件（mosquitto）
/bin/bash -c "$(curl -fsSL https://t.dataflux.cn/func-docker-stack-run)" -- --install-dir /home/dev/datafluxfunc --mqtt
```

*注意：参数前确实有`--`，表示参数传递给需要执行的脚本，此处不是笔误*

### 4.3 可用安装选项

具体参数详情见下文

#### 4.3.1 `--mini`：安装迷你版

针对低配置环境下，需要节约资源时的安装模式。

开启后：

- 仅启动单个Worker 监听所有队列
- 遇到重负载任务更容易导致队列阻塞和卡顿
- 系统任务和函数任务共享处理队列，相互会受到影响
- 系统要求降低为：
    - CPU 核心数 >= 1
    - 内存容量 >= 2GB
- 如不使用内置的MySQL、Redis，系统要求可以进一步降低

#### 4.3.2 `--install-dir {安装目录}`：指定安装目录

需要安装到与默认路径`/usr/local/dataflux-func`不同的路径下时，可指定此参数

#### 4.3.3 `--no-mysql`：禁用内置MySQL

需要使用已有的MySQL数据库时，可指定此参数，禁止在本机启动MySQL。

*注意：启用此选项后，需要在安装完成后的配置页面指定正确的MySQL连接信息*

#### 4.3.4 `--no-redis`：禁用内置Redis

需要使用已有的Redis数据库时，可指定此参数，禁止在本机启动Redis。

*注意：启用此选项后，需要在安装完成后的配置页面指定正确的Redis连接信息*

#### 4.3.5 `--mqtt`：启用内置MQTT Broker

需要安装后，同时在本机启动MQTT Broker时，可指定此选项。

*注意：内置的MQTT Broker 为`eclipse-mosquitto`，并会自动生成对应的数据源*



## 5. 运维相关

默认情况下，安装目录为`/usr/local/dataflux-func`

### 5.1 更新部署

*注意：如果最初安装时指定了不同安装目录，更新时也需要指定完全相同的目录才行*

需要更新部署时，请按照以下步骤进行：

1. 使用`docker stack rm dataflux-func`命令，移除正在运行的服务（此步骤可能需要一定时间）
2. 使用`docker ps`确认所有容器都已经退出
3. 参考上文，重新部署（脚本不会删除原先的数据）

### 5.2 重启系统

需要重新启动时，请按照以下步骤进行：

1. 使用`docker stack rm dataflux-func`命令，移除正在运行的服务（此步骤可能需要一定时间）
2. 使用`docker ps`确认所有容器都已经退出
3. 使用`docker stack deploy dataflux-func -c {安装目录}/docker-stack.yaml`重启所有服务

### 5.3 查看Docker Stack 配置

默认情况下，Docker Stack 配置文件保存位置如下：

|   环境   |            文件位置            |
|----------|--------------------------------|
| 宿主机内 | `{安装目录}/docker-stack.yaml` |

### 5.3 查看配置

默认情况下，配置文件保存位置如下：

|   环境   |              文件位置              |
|----------|------------------------------------|
| 容器内   | `/data/user-config.yaml`           |
| 宿主机内 | `{安装目录}/data/user-config.yaml` |

### 5.4 查看日志

默认情况下，日志文件保存位置如下：

|   环境   |               文件位置              |
|----------|-------------------------------------|
| 容器内   | `/data/dataflux-func.log`           |
| 宿主机内 | `{安装目录}/data/dataflux-func.log` |

默认情况下，日志文件会根据logrotate配置自动回卷并压缩保存（logrotate配置文件位置为`/etc/logrotate.d/dataflux-func`）

### 5.5 数据库自动备份

DataFlux Func 会定时自动备份完整的数据库

默认情况下，数据库备份文件保存位置如下：

|   环境   |                               文件位置                              |
|----------|---------------------------------------------------------------------|
| 容器内   | `/data/sqldump/dataflux-func-sqldump-YYYYMMDD-hhmmss.sql`           |
| 宿主机内 | `{安装目录}/data/sqldump/dataflux-func-sqldump-YYYYMMDD-hhmmss.sql` |

*提示：旧版本的备份文件命名可能为`dataflux-sqldump-YYYYMMDD-hhmmss.sql`*

默认情况下，数据库备份文件每小时备份一次，最多保留7天（共168份）

### 5.6 完全卸载

某些情况无法直接升级的时候，需要先完全卸载后重新部署

需要完全卸载时，请按照以下步骤进行：

1. 视情况需要，使用脚本集导出功能导出脚本数据
2. 使用`docker stack rm dataflux-func`命令，移除正在运行的旧版本（此步骤可能需要一定时间）
3. 使用`rm -rf {安装目录}`命令，移除所有相关数据

### 5.7 参数调整

默认的参数主要应对最常见的情况，一些比较特殊的场景可以调整部分参数来优化系统：

|              参数             |  默认值   |                                                   说明                                                  |
|-------------------------------|-----------|---------------------------------------------------------------------------------------------------------|
| `LOG_LEVEL`                   | `WARNING` | 日志等级。<br>可以改为`ERROR`减少日志输出量。<br>或直接改为`NONE`禁用日志                               |
| `_WORKER_CONCURRENCY`         | `5`       | 工作单元进程数量。<br>如存在大量慢IO任务（耗时大于1秒），可改为`20`提高并发量，但不要过大，防止内存耗尽 |
| `_WORKER_PREFETCH_MULTIPLIER` | `10`      | 工作单元任务预获取数量。<br>如存在大量慢速任务（耗时大于1秒），建议改为`1`                              |

### 5.8 迁移数据库

如系统部署后通过了最初的单机验证阶段，需要将数据库切换至外部数据库（如：阿里云RDS、Redis），可根据以下步骤进行操作：

*注意：当使用外部数据库时，应确保MySQL版本为5.7，Redis版本为4.0以上*

*注意：DataFlux Func 不支持集群部署的Redis*

1. 在外部数据库实例中创建数据库，且确保如下两项配置：
    - `character-set-server=utf8mb4`
    - `collation-server=utf8mb4_unicode_ci`
2. 根据上文「5.5 数据库自动备份」找到最近的MySQL数据库备份文件，将其导入外部数据库
3. 根据上文「5.3 查看配置」找到配置文件，并根据实际情况修改以下字段内容：
    - `MYSQL_HOST`
    - `MYSQL_PORT`
    - `MYSQL_USER`
    - `MYSQL_PASSWORD`
    - `MYSQL_DATABASE`
    - `REDIS_HOST`
    - `REDIS_PORT`
    - `REDIS_DATABASE`
    - `REDIS_PASSWORD`
4. 根据上文「5.3 查看Docker Stack 配置」找到Docker Stack 文件，删除其中的MySQL 和Redis 相关部分（注释掉即可）
5. 根据上文「5.2 重启系统」重启即可

### 5.9 高可用部署

DataFlux Func 支持多份部署以满足高可用要求。

以阿里云为例，可使用「SLB + ECS x 2 + RDS + Redis」方式进行部署。

```
            +-------------+
            |             |
            |     SLB     |
            |             |
            +-------------+
                   |
                   |
       +-----------+----------+
       |                      |
       v                      v
+-------------+        +-------------+
|             |        |             |
|    ECS-1    |        |    ECS-2    |
|             |        |             |
+-------------+        +-------------+
       |                      |
       +----------------------+
       |                      |
       v                      v
+-------------+        +-------------+
|             |        |             |
|     RDS     |        |    Redis    |
|             |        |             |
+-------------+        +-------------+
```

部署步骤：

1. 在ECS-1 正常部署DataFlux Func，并配置连接外部RDS 和Redis
2. 在ECS-2 正常部署DataFlux Func，复制ECS-1的配置文件并覆盖ECS-2的配置文件，重启ECS-2的服务

*注意：如之前已经使用单机方式部署过DataFlux Func，在切换为高可用部署时，请参考上文「5.8 迁移数据库」进行迁移*

*注意：本方案为最简单的多份部署方案，由于ECS-1 与ECS-2 之间并不通讯，因此涉及到安装额外Python包、上传文件等处理时，需要在两边服务器做相同的操作*

## 6. 故障排查

由于系统本身具有一定复杂性，当遇到问题时，可以根据下文进行初步判断大概可能存在的问题点。

*注意：DataFlux Func 不支持集群部署的Redis，如集群部署的Redis 可能发生各种奇怪的问题*

### 6.1 安装部署时脚本中断

安装部署时，很多情况都有可能导致脚本中断，但一般都是由于不满足系统要求导致。

可能原因及解决方案：

|                      原因                     |                         解决方案                        |
|-----------------------------------------------|---------------------------------------------------------|
| 所用操作系统不支持Docker 及相关组件的安装运行 | 更换操作系统                                            |
| 主机具有多个网卡                              | 参考上文「1.2 软件准备」中有关Docker Swarm 初始化的描述 |

在排除问题后，重新运行脚本即可

### 6.2 安装部署完成后无法启动

此问题一般是由于配置、防火墙、各种白名单配置不正确引起。

具体表现为：

1. 使用浏览器无法打开页面
2. 使用`docker ps -a`命令查看容器列表时，发现重启在不断重启
3. 在部署服务器本机使用`curl http://localhost:8088`返回`curl: (7) Failed to connect to localhost port 8088: Connection refused`错误
3. 日志文件中不断输出错误堆栈信息

可能原因及解决方案：

|                   原因                   |                           解决方案                           |
|------------------------------------------|--------------------------------------------------------------|
| 当前版本的系统确实存在BUG                | 更换其他版本，并联系驻云官方                                 |
| 手工修改过配置但配置存在错误             | 检查修改过的配置文件，检查如YAML语法、数据库链接信息是否正确 |
| 修改配置指定了外部服务器，但实际网络不通 | 检查防火墙、阿里云安全组配置、数据库链接白名单等配置         |

### 6.3 安装部署完成后启动成功但无法访问

此问题一般是由于网络问题引起。

具体表现为：

1. 在部署服务器本机使用`curl http://localhost:8088`正常返回`Found. Redirecting to /client-app`跳转信息
2. 在其他设备上使用`curl http://{服务器地址}:8088`无响应，或直接返回拒绝连接

可能原因及解决方案：

|                    原因                   |                 解决方案                 |
|-------------------------------------------|------------------------------------------|
| IP/域名解析等不正确                       | 检查并通过正确的地址访问                 |
| 服务器的防火墙、阿里云安全组配置不正确    | 修改配置，允许外部访问服务器的`8088`端口 |
| 额外增加了如Nginx做反向代理，但配置不正确 | 检查反向代理服务器的配置                 |

### 6.4 函数执行返回超时

函数执行超时可能有多种可能，需要根据不同情况进行辨别

#### 6.4.1 函数执行耗时过长导致工作进程被Kill

为了保护系统，DataFlux Func 对函数执行的最长时间有限制，不允许无限制运行下去。
在超过一定时间后，会直接Kill掉执行进程。

具体表现为：

1. 浏览器访问`/api/v1/al/auln-xxxxx`接口时，长时间卡在加载中状态
2. curl方式调用`GET|POST /api/v1/al/auln-xxxxx`接口返回状态码`599`，返回数据类似如下：

```json
{
    "detail": {
        "einfoTEXT": "raise SoftTimeLimitExceeded()\nbilliard.exceptions.SoftTimeLimitExceeded: SoftTimeLimitExceeded()",
        "id": "task-xxxxx"
    },
    "error": 599.31,
    "message": "Calling Function timeout.",
    "ok": false,
    "reason": "EFuncTimeout",
    "reqCost": 5020,
    "reqDump": {
        "method": "GET",
        "url": "/api/v1/al/auln-xxxxx"
    },
    "traceId": "TRACE-xxxxx"
}
```

其中，`reqCost`字段为此函数从开始执行到被Kill经过的时间（毫秒）

可能原因及解决方案：

|                               原因                              |                                         解决方案                                         |
|-----------------------------------------------------------------|------------------------------------------------------------------------------------------|
| 所执行的函数指定了`timeout`超时参数（秒），且函数运行超时       | 联系函数开发者排查错误，包括且不限于：<br>超时参数设置过短<br>函数内调用外部系统响应过慢 |
| 所执行的函数未指定`timeout`超时参数，但函数运行超过默认超时限制 | 同上                                                                                     |
| 使用浏览器访问时，耗时过长，浏览器主动断开连接                  | 联系函数开发者排查错误，无法提高响应时考虑其他异步方案                                   |

> 函数超时默认为`30秒`，最大设置为`3600秒`

#### 6.4.2 函数执行耗时过长导致API接口提前返回

为了保护系统，DataFlux Func 对使用HTTP 接口【同步】调用函数的最长响应时间有限制，不允许服务器无限制保持HTTP连接。
在超过一定时间后，API层面会放弃等待函数返回，直接响应HTTP 请求。

具体表现为：

1. 调用`GET|POST /api/v1/al/auln-xxxxx`接口返回状态码`599`，返回数据类似如下：

```json
{
    "detail": {
        "id": "task-xxxxx"
    },
    "error": 599.1,
    "message": "Waiting function result timeout, but task is still running. Use task ID to fetch result later.",
    "ok": false,
    "reason": "EAPITimeout",
    "reqCost": 3011,
    "reqDump": {
        "method": "GET",
        "url": "/api/v1/al/auln-xxxxx"
    },
    "traceId": "TRACE-xxxxx"
}
```

*注意：API接口超时仅表示HTTP 响应时间超时，此时函数可能依然在后台运行，并遵循函数超时处理逻辑*

可能原因及解决方案：

|                                  原因                                  |                                           解决方案                                          |
|------------------------------------------------------------------------|---------------------------------------------------------------------------------------------|
| 所执行的函数指定了`api_timeout`API超时参数（秒），且函数运行超时       | 联系函数开发者排查错误，包括且不限于：<br>API超时参数设置过短<br>函数内调用外部系统响应过慢 |
| 所执行的函数未指定`api_timeout`API超时参数，但函数运行超过默认超时限制 | 同上                                                                                        |

> API超时默认为`10秒`，最大设置为`180秒`。同时，API超时不会长于函数超时

### 6.5 函数执行无响应

函数执行无响应可能有多种可能，需要根据不同情况进行辨别

具体表现为：

1. 浏览器访问接口时，长时间处于加载中状态
2. curl方式调用接口时，长时间没有任何响应

此时，需要在DataFlux Func 中写一个测试函数，并将其配置为「授权链接」，来帮助判断原因。

测试函数如下：

```python
@DFF.API('Test Func')
def test_func():
    return 'ok'
```

#### 6.5.1 测试函数有响应

可能原因及解决方案：

|              原因              |        解决方案        |
|--------------------------------|------------------------|
| 所调用函数确实需要运行很长时间 | 联系函数开发者排查问题 |

#### 6.5.2 测试函数无响应

可能原因及解决方案：

|        原因       |                  解决方案                  |
|-------------------|--------------------------------------------|
| 存在队列阻塞      | 前往「关于 - 获取系统报告 - 清空工作队列」 |
| Redis连接存在问题 | 重启系统，排查Redis连接配置是否正确        |


## X. 项目介绍

### X.1 主要功能

- 脚本管理：支持草稿，脚本集，导入导出等
- Web端简易编辑器：基于CodeMirror，支持代码高亮、函数快速跳转定位、直接指定函数运行等
- 内置多种数据库驱动：提供统一封装的数据操作接口
- 环境变量：方便脚本运行时获取配置
- 授权链接：允许函数以限定的方式开放为HTTP API
- 自动触发配置：允许函数定时自动运行，满足Crontab 语法
- 批处理：允许函数异步运行
- 脚本导入导出：方便备份、批量部署
- 其他...

### X.2 支持的数据源

|            数据源            |                                    所用第三方库                                   |                                                             兼容数据库                                                              |
|------------------------------|-----------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------|
| DataFlux DataWay（HTTP方式） | [dataway-python-sdk-nodep](https://github.com/CloudCare/dataway-python-sdk-nodep) |                                                                                                                                     |
| InfluxDB（HTTP方式）         | [influxdb](https://pypi.org/project/influxdb/)                                    | `阿里云时序数据库InfluxDB 版`                                                                                                       |
| MySQL                        | [mysqlclient](https://pypi.org/project/mysqlclient/)                              | `MariaDB`、<br>`Percona Server for MySQL`、<br>`阿里云PolarDB MySQL`、<br>`阿里云OceanBase`、<br>`阿里云分析型数据库(ADB) MySQL 版` |
| Redis                        | [redis](https://pypi.org/project/redis/)                                          |                                                                                                                                     |
| Memcached                    | [python3-memcached](https://pypi.org/project/python3-memcached/)                  |                                                                                                                                     |
| Clickhouse（TCP方式）        | [clickhouse-driver](https://pypi.org/project/clickhouse-driver/)                  |                                                                                                                                     |
| Oracle数据库                 | [cx-Oracle](https://pypi.org/project/cx-Oracle/)                                  |                                                                                                                                     |
| Microsoft SQL Server         | [pymssql](https://pypi.org/project/pymssql/)                                      |                                                                                                                                     |
| PostgreSQL                   | [psycopg2-binary](https://pypi.org/project/psycopg2-binary/)                      | `Greenplum Database`、<br>`阿里云PolarDB MySQL`、<br>`阿里云分析型数据库(ADB) PostgreSQL 版`                                        |
| mongoDB                      | [pymongo](https://pypi.org/project/pymongo/)                                      |                                                                                                                                     |
| elasticsearch（HTTP方式）    | [requests](https://pypi.org/project/requests/)                                    |                                                                                                                                     |
| NSQ (Lookupd, HTTP方式)      | [requests](https://pypi.org/project/requests/)                                    |                                                                                                                                     |
| MQTT                         | [paho-mqtt](https://pypi.org/project/paho-mqtt/)                                  |                                                                                                                                     |

### X.3 相关链接

- [DataFlux Func 宣传小册子](https://t.dataflux.cn/func-intro)
- [DataFlux官方网站](https://dataflux.cn/)
