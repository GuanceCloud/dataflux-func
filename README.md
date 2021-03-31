# DataFlux Func

DataFlux Func 是一个基于Python 的类ServerLess 的脚本开发、管理及执行平台。

> `DataFlux Func` 读作`data flux function`，系统内有时会缩写为`DFF`。

前身为[DataFlux](https://dataflux.cn/) 下属的一个函数计算组件，目前已成为可独立运行的系统。

本系统主要分为2个部分：

- Server：使用Node.js + Express 构建，主要提供Web UI 客户端、对外API 接口
- Worker：使用Python3 + Celery 构建，主要提供Python 脚本的执行环境（内含Beat模块）


## 目录

<!-- MarkdownTOC autolink="false" levels="1,2,3" -->

- 1 系统及环境要求
    - 1.1 系统要求
    - 1.2 软件准备
- 2 使用「携带版」离线部署
    - 2.1 一键命令下载「携带版」
    - 2.2 手工下载「携带版」
    - 2.3 使用自动部署脚本执行部署
- 3 安装选项
    - 3.1 「携带版」指定安装选项
    - 3.2 在线安装版指定安装选项
    - 3.3 可用安装选项
- 4 项目介绍
    - 4.1 主要功能
    - 4.2 支持的数据源
    - 4.3 相关链接

<!-- /MarkdownTOC -->

*注意：本文所有涉及到的shell命令，在root用户下可直接运行，非root用户下需要添加sudo运行*

## 1 系统及环境要求

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

安装脚本本身已经自带了Docker 的安装包并会在部署时自动安装。
用户也可以自行安装Docker 并初始化Docker Swarm，然后运行部署脚本，
部署脚本在发现Docker 已经安装后会自动跳过这部分处理。

- Docker Swarm 初始化命令为：`docker swarm init`

如果本机存在多个网卡，需要在上述初始化命令中指定网卡

- 存在多网卡的建议用户自行安装Docker 并初始化Docker Swarm
- Docker Swarm 指定网卡的初始化命令为：`docker swarm init --advertise-addr={网卡名}`
- 本机网卡列表可以通过`ifconfig`或者`ip addr`查询



## 2 使用「携带版」离线部署

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

1. [Docker 二进制程序： docker-18.06.3-ce.tgz](https://zhuyun-static-files-production.oss-cn-hangzhou.aliyuncs.com/dataflux-func/portable/docker-18.06.3-ce.tgz)
2. [Docker 服务配置文件： docker.service](https://zhuyun-static-files-production.oss-cn-hangzhou.aliyuncs.com/dataflux-func/portable/docker.service)
3. [MySQL 镜像： mysql.tar.gz](https://zhuyun-static-files-production.oss-cn-hangzhou.aliyuncs.com/dataflux-func/portable/mysql.tar.gz)
4. [Redis 镜像： redis.tar.gz](https://zhuyun-static-files-production.oss-cn-hangzhou.aliyuncs.com/dataflux-func/portable/redis.tar.gz)
5. [Mosquitto 镜像： eclipse-mosquitto.tar.gz](https://zhuyun-static-files-production.oss-cn-hangzhou.aliyuncs.com/dataflux-func/portable/eclipse-mosquitto.tar.gz)
6. [DataFluxFunc 镜像： dataflux-func.tar.gz](https://zhuyun-static-files-production.oss-cn-hangzhou.aliyuncs.com/dataflux-func/portable/dataflux-func.tar.gz)
7. [Docker Stack 配置文件：docker-stack.example.yaml](https://zhuyun-static-files-production.oss-cn-hangzhou.aliyuncs.com/dataflux-func/portable/docker-stack.example.yaml)
8. [DataFluxFunc 部署脚本：run-portable.sh](https://zhuyun-static-files-production.oss-cn-hangzhou.aliyuncs.com/dataflux-func/portable/run-portable.sh)

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



## 3 安装选项

自动安装脚本支持一些安装选项，用于适应不同的安装需求

### 3.1 「携带版」指定安装选项

安装「携带版」时，只需要在自动部署命令后添加`--{参数}[ 参数配置（如有）]`，即可指定安装选项

```shell
# 示例：指定安装目录，同时开启MQTT组件（mosquitto）
/bin/bash run-portable.sh --install-dir /home/dev/datafluxfunc --mqtt
```

### 3.2 在线安装版指定安装选项

使用一键安装命令在线安装时，只需要在自动部署命令后添加`-- --{参数}[ 参数配置（如有）]`，即可指定安装选项

```shell
# 示例：指定安装目录，同时开启MQTT组件（mosquitto）
/bin/bash -c "$(curl -fsSL https://t.dataflux.cn/func-docker-stack-run)" -- --install-dir /home/dev/datafluxfunc --mqtt
```

*注意：参数前确实有`--`，表示参数传递给需要执行的脚本，此处不是笔误*

### 3.3 可用安装选项

具体参数详情见下文

#### `--mini`：安装迷你版

针对低配置环境下，需要节约资源时的安装模式。

开启后：

- 仅启动单个Worker 监听所有队列
- 遇到重负载任务更容易导致队列阻塞和卡顿
- 系统任务和函数任务共享处理队列，相互会受到影响
- 系统要求降低为：
    - CPU 核心数 >= 1
    - 内存容量 >= 2GB
- 如不使用内置的MySQL、Redis，系统要求可以进一步降低

#### `--install-dir {安装目录}`：指定安装目录

需要安装到与默认路径`/usr/local/dataflux-func`不同的路径下时，可指定此参数

#### `--no-mysql`：禁用内置MySQL

需要使用已有的MySQL数据库时，可指定此参数，禁止在本机启动MySQL。

*注意：启用此选项后，需要在安装完成后的配置页面指定正确的MySQL连接信息*

#### `--no-redis`：禁用内置Redis

需要使用已有的Redis数据库时，可指定此参数，禁止在本机启动Redis。

*注意：启用此选项后，需要在安装完成后的配置页面指定正确的Redis连接信息*

#### `--mqtt`：启用内置MQTT Broker

需要安装后，同时在本机启动MQTT Broker时，可指定此选项。

*注意：内置的MQTT Broker 为`eclipse-mosquitto`，并会自动生成对应的数据源*


## 4 项目介绍

### 4.1 主要功能

- 脚本管理：支持草稿，脚本集，导入导出等
- Web端简易编辑器：基于CodeMirror，支持代码高亮、函数快速跳转定位、直接指定函数运行等
- 内置多种数据库驱动：提供统一封装的数据操作接口
- 环境变量：方便脚本运行时获取配置
- 授权链接：允许函数以限定的方式开放为HTTP API
- 自动触发配置：允许函数定时自动运行，满足Crontab 语法
- 批处理：允许函数异步运行
- 脚本导入导出：方便备份、批量部署
- 其他...

### 4.2 支持的数据源

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

### 4.3 相关链接

- [DataFlux 官方网站](https://dataflux.cn/)
- [DataFlux Func 宣传小册子](https://t.dataflux.cn/func-intro)
- [DataFlux 用户手册](https://t.dataflux.cn/func-user-guide)
- [DataFlux 维护手册](https://t.dataflux.cn/func-maint-guide)
- [DataFlux 开发手册](https://t.dataflux.cn/func-dev-guide)
