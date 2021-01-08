# DataFlux Func

DataFlux Func 是一个基于Python 的类ServerLess 的脚本开发、管理及执行平台。

> `DataFlux Func` 读作`data flux function`，系统内有时会缩写为`DFF`。

前身为[DataFlux](https://dataflux.cn/) 下属的一个函数计算组建，目前已成为可独立运行的系统。

本系统主要分为2个部分：
- Server：使用Node.js + Express 构建，主要提供Web UI 客户端、对外API 接口
- Worker：使用Python3 + Celery 构建，主要提供Python 脚本的执行环境（内含Beat模块）

*本文档主要说明离线安装部署本项目的步骤。*



<!-- MarkdownTOC -->

- [系统及环境要求](#%E7%B3%BB%E7%BB%9F%E5%8F%8A%E7%8E%AF%E5%A2%83%E8%A6%81%E6%B1%82)
- [下载携带版](#%E4%B8%8B%E8%BD%BD%E6%90%BA%E5%B8%A6%E7%89%88)
    - [手工下载携带版](#%E6%89%8B%E5%B7%A5%E4%B8%8B%E8%BD%BD%E6%90%BA%E5%B8%A6%E7%89%88)
- [多网卡注意点](#%E5%A4%9A%E7%BD%91%E5%8D%A1%E6%B3%A8%E6%84%8F%E7%82%B9)
- [部署运行](#%E9%83%A8%E7%BD%B2%E8%BF%90%E8%A1%8C)
    - [使用基于`docker stack`的自动部署脚本部署](#%E4%BD%BF%E7%94%A8%E5%9F%BA%E4%BA%8Edocker-stack%E7%9A%84%E8%87%AA%E5%8A%A8%E9%83%A8%E7%BD%B2%E8%84%9A%E6%9C%AC%E9%83%A8%E7%BD%B2)
        - [安装选项](#%E5%AE%89%E8%A3%85%E9%80%89%E9%A1%B9)
            - [`--mini`：安装迷你版](#--mini%EF%BC%9A%E5%AE%89%E8%A3%85%E8%BF%B7%E4%BD%A0%E7%89%88)
            - [`--install-dir {安装目录}`：指定安装目录](#--install-dir-%E5%AE%89%E8%A3%85%E7%9B%AE%E5%BD%95%EF%BC%9A%E6%8C%87%E5%AE%9A%E5%AE%89%E8%A3%85%E7%9B%AE%E5%BD%95)
            - [`--no-mysql`：禁用内置MySQL](#--no-mysql%EF%BC%9A%E7%A6%81%E7%94%A8%E5%86%85%E7%BD%AEmysql)
            - [`--no-redis`：禁用内置Redis](#--no-redis%EF%BC%9A%E7%A6%81%E7%94%A8%E5%86%85%E7%BD%AEredis)
            - [`--mqtt`：启用内置MQTT Broker](#--mqtt%EF%BC%9A%E5%90%AF%E7%94%A8%E5%86%85%E7%BD%AEmqtt-broker)
- [更新部署](#%E6%9B%B4%E6%96%B0%E9%83%A8%E7%BD%B2)
- [重启服务](#%E9%87%8D%E5%90%AF%E6%9C%8D%E5%8A%A1)
- [查询日志](#%E6%9F%A5%E8%AF%A2%E6%97%A5%E5%BF%97)
- [数据库自动备份](#%E6%95%B0%E6%8D%AE%E5%BA%93%E8%87%AA%E5%8A%A8%E5%A4%87%E4%BB%BD)
- [完全卸载](#%E5%AE%8C%E5%85%A8%E5%8D%B8%E8%BD%BD)
- [参数调整](#%E5%8F%82%E6%95%B0%E8%B0%83%E6%95%B4)
- [项目介绍](#%E9%A1%B9%E7%9B%AE%E4%BB%8B%E7%BB%8D)
    - [主要功能](#%E4%B8%BB%E8%A6%81%E5%8A%9F%E8%83%BD)
    - [支持的数据库](#%E6%94%AF%E6%8C%81%E7%9A%84%E6%95%B0%E6%8D%AE%E5%BA%93)
    - [相关链接](#%E7%9B%B8%E5%85%B3%E9%93%BE%E6%8E%A5)

<!-- /MarkdownTOC -->

*注意：本文所有涉及到的shell命令，在root用户下可直接运行，非root用户下需要添加sudo运行*

## 系统及环境要求

1. *本系统使用`docker stack`部署，*
*因此要求当前系统已经安装`docker`，且可以正常使用`docker stack`*

> 携带版安装脚本本身已经自带了`docker`的安装包并会在部署时自动安装。
> 用户也可以先行安装`docker`后运行部署脚本，部署脚本在发现`docker`已经安装后会自动跳过这部分处理。
>
> 使用`docker stack`需要Docker Swarm模式，
> 可以使用`docker swarm init`初始化当前节点。
>
> 如果本机存在多个网卡，需要在上述初始化命令中指定网卡，
> 如：`docker swarm init --advertise-addr=ens33`。
> 本机网卡列表可以通过`ifconfig`或者`ip addr`查询

2. 运行DataFlux Func 需要满足以下条件：
- CPU 核心数 >= 2
- 内存容量 >= 4GB
- 磁盘空间 >= 20GB
- 操作系统为 Ubuntu 16.04 LTS/CentOS 7.6 以上
- 纯净系统（安装完操作系统后，除了配置网络外没有进行过其他操作）

## 下载携带版

运行以下命令，即可自动下载DataFlux Func携带版的所需文件：
```shell
/bin/bash -c "$(curl -fsSL https://t.dataflux.cn/func-portable-download)"
```

命令执行完成后，所有所需文件都保存在当前目录下新创建的`dataflux-func-portable`目录下。
直接将整个目录通过U盘等移动存储设备复制到目标机器中。

### 手工下载携带版

如需要手工下载，以下是所有的文件列表：
1. [README.md](https://zhuyun-static-files-production.oss-cn-hangzhou.aliyuncs.com/dataflux-func/portable/README.md)
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


## 多网卡注意点

如果本机存在多个网卡，需要在Docker Swarm 初始化命令中指定网卡，如：
```shell
docker swarm init --advertise-addr=ens33
```

可以直接修改`run-portable.sh`后执行脚本，也可以自行安装Docker并初始化Swarm后运行脚本。

本机网卡列表可以通过`ifconfig`或者`ip addr`查询。

*如果脚本运行因多网卡中断，可手工初始化Docker swarm 后重新运行脚本*

## 部署运行

携带版建议直接使用附带的安装脚本安装。

### 使用基于`docker stack`的自动部署脚本部署

*确保已满足上文中的「系统及环境要求」*

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

#### 安装选项

自动安装脚本支持一些安装选项，用于适应不同的安装需求

添加安装选项时，只需要在自动部署命令后添加`--{参数}[ 参数配置（如有）]`即可，如：
```shell
# 指定安装目录，同时开启MQTT组件（mosquitto）
/bin/bash run-portable.sh --install-dir /home/dev/datafluxfunc --mqtt
```

具体参数详情见下文

##### `--mini`：安装迷你版

针对低配置环境下，需要节约资源时的安装模式。

开启后：
- 仅启动单个Worker 监听所有队列
- 遇到重负载任务更容易导致队列阻塞和卡顿
- 系统任务和函数任务共享处理队列，相互会受到影响
- 系统要求降低为：
    - CPU 核心数 >= 1
    - 内存容量 >= 2GB
- 如不适用内置的MySQL、Redis，系统要求可以进一步降低

##### `--install-dir {安装目录}`：指定安装目录

需要安装到与默认路径`/usr/local/dataflux-func`不同的路径下时，可指定此参数

##### `--no-mysql`：禁用内置MySQL

需要使用已有的MySQL数据库时，可指定此参数，禁止在本机启动MySQL。

*注意：启用此选项后，需要在安装完成后的配置页面指定正确的MySQL连接信息*

##### `--no-redis`：禁用内置Redis

需要使用已有的Redis数据库时，可指定此参数，禁止在本机启动Redis。

*注意：启用此选项后，需要在安装完成后的配置页面指定正确的Redis连接信息*

##### `--mqtt`：启用内置MQTT Broker

需要安装后，同时在本机启动MQTT Broker时，可指定此选项。

*注意：内置的MQTT Broker 为`eclipse-mosquitto`，并会自动生成对应的数据源*



## 更新部署

*注意：如果最初安装时指定了不同安装目录，更新时也需要指定完全相同的目录才行*

需要更新部署时，请按照以下步骤进行：
1. 使用`docker stack rm dataflux-func`命令，移除正在运行的服务（此步骤可能需要一定时间）
2. 使用`docker ps`确认所有容器都已经退出
3. 参考上文，重新部署（脚本不会删除原先的数据）


## 重启服务

需要重新启动时，请按照以下步骤进行：
1. 使用`docker stack rm dataflux-func`命令，移除正在运行的服务（此步骤可能需要一定时间）
2. 使用`docker ps`确认所有容器都已经退出
3. 使用`docker stack deploy dataflux-func -c {安装目录}/docker-stack.yaml`重启所有服务



## 查询日志

默认情况下，日志文件保存位置如下：

|  环境  |             日志文件位置            |
|--------|-------------------------------------|
| 容器内 | `/data/dataflux-func.log`           |
| 宿主机 | `{安装目录}/data/dataflux-func.log` |



## 数据库自动备份

默认情况下，数据库备份文件保存位置如下：

|  环境  |                             日志文件位置                            |
|--------|---------------------------------------------------------------------|
| 容器内 | `/data/sqldump/dataflux-func-sqldump-YYYYMMDD-hhmmss.sql`           |
| 宿主机 | `{安装目录}/data/sqldump/dataflux-func-sqldump-YYYYMMDD-hhmmss.sql` |

*提示：旧版本的备份文件命名可能为`dataflux-sqldump-YYYYMMDD-hhmmss.sql`*

数据库备份文件默认默认情况下，每小时备份一次，最多保留7天（共168份）



## 完全卸载

某些情况无法直接升级的时候，需要先完全卸载后重新部署

需要完全卸载时，请按照以下步骤进行：
1. 视情况需要，使用脚本集导出功能导出脚本数据
2. 使用`docker stack rm dataflux-func`命令，移除正在运行的旧版本（此步骤可能需要一定时间）
3. 使用`rm -rf {安装目录}`命令，移除所有相关数据



## 参数调整

默认的参数主要应对最常见的情况，一些比较特殊的场景可以调整部分参数来优化系统：

|              参数             |  默认值   |                                                   说明                                                  |
|-------------------------------|-----------|---------------------------------------------------------------------------------------------------------|
| `LOG_LEVEL`                   | `WARNING` | 日志等级。<br>可以改为`ERROR`减少日志输出量。<br>或直接改为`NONE`禁用日志                               |
| `_WORKER_CONCURRENCY`         | `5`       | 工作单元进程数量。<br>如存在大量慢IO任务（耗时大于1秒），可改为`20`提高并发量，但不要过大，防止内存耗尽 |
| `_WORKER_PREFETCH_MULTIPLIER` | `10`      | 工作单元任务预获取数量。<br>如存在大量慢速任务（耗时大于1秒），建议改为`1`                              |



## 项目介绍

### 主要功能

- 脚本管理：支持草稿，脚本集，导入导出等
- Web端简易编辑器：基于CodeMirror，支持代码高亮、函数快速跳转定位、直接指定函数运行等
- 内置多种数据库驱动：提供统一封装的数据操作接口
- 环境变量：方便脚本运行时获取配置
- 授权链接：允许函数以限定的方式开放为HTTP API
- 自动触发配置：允许函数定时自动运行，满足Crontab 语法
- 批处理：允许函数异步运行
- 脚本导入导出：方便备份、批量部署
- 其他...

### 支持的数据库

|    数据库/消息队列/中间件    |                                    所用第三方库                                   |                                                             兼容数据库                                                              |
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

### 相关链接

- [DataFlux Func 宣传小册子](https://t.dataflux.cn/func-intro)

- [DataFlux官方网站](https://dataflux.cn/)

- [额外文档](README-extra.md)
