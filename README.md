# DataFlux Func

DataFlux Func 是一个基于Python 的类ServerLess 的脚本开发、管理及执行平台。

> `DataFlux Func` 读作`data flux function`，系统内有时会缩写为`DFF`。

前身为[DataFlux](https://dataflux.cn/) 下属的一个函数计算组建，目前已成为可独立运行的系统。

本系统主要分为2个部分：
- Server：使用Node.js + Express 构建，主要提供Web UI 客户端、对外API 接口
- Worker：使用Python3 + Celery 构建，主要提供Python 脚本的执行环境（内含Beat模块）



## 目录

<!-- MarkdownTOC -->

- [系统及环境要求](#%E7%B3%BB%E7%BB%9F%E5%8F%8A%E7%8E%AF%E5%A2%83%E8%A6%81%E6%B1%82)
- [部署运行](#%E9%83%A8%E7%BD%B2%E8%BF%90%E8%A1%8C)
    - [【推荐】方式：使用基于`docker stack`的自动部署脚本部署](#%E3%80%90%E6%8E%A8%E8%8D%90%E3%80%91%E6%96%B9%E5%BC%8F%EF%BC%9A%E4%BD%BF%E7%94%A8%E5%9F%BA%E4%BA%8Edocker-stack%E7%9A%84%E8%87%AA%E5%8A%A8%E9%83%A8%E7%BD%B2%E8%84%9A%E6%9C%AC%E9%83%A8%E7%BD%B2)
        - [安装选项](#%E5%AE%89%E8%A3%85%E9%80%89%E9%A1%B9)
            - [`--dev`：安装开发版](#--dev%EF%BC%9A%E5%AE%89%E8%A3%85%E5%BC%80%E5%8F%91%E7%89%88)
            - [`--mini`：安装迷你版](#--mini%EF%BC%9A%E5%AE%89%E8%A3%85%E8%BF%B7%E4%BD%A0%E7%89%88)
            - [`--install-dir {安装目录}`：指定安装目录](#--install-dir-%E5%AE%89%E8%A3%85%E7%9B%AE%E5%BD%95%EF%BC%9A%E6%8C%87%E5%AE%9A%E5%AE%89%E8%A3%85%E7%9B%AE%E5%BD%95)
            - [`--image {主程序Docker镜像}`：指定主程序镜像](#--image-%E4%B8%BB%E7%A8%8B%E5%BA%8Fdocker%E9%95%9C%E5%83%8F%EF%BC%9A%E6%8C%87%E5%AE%9A%E4%B8%BB%E7%A8%8B%E5%BA%8F%E9%95%9C%E5%83%8F)
            - [`--no-mysql`：禁用内置MySQL](#--no-mysql%EF%BC%9A%E7%A6%81%E7%94%A8%E5%86%85%E7%BD%AEmysql)
            - [`--no-redis`：禁用内置Redis](#--no-redis%EF%BC%9A%E7%A6%81%E7%94%A8%E5%86%85%E7%BD%AEredis)
            - [`--mqtt`：启用内置MQTT Broker](#--mqtt%EF%BC%9A%E5%90%AF%E7%94%A8%E5%86%85%E7%BD%AEmqtt-broker)
    - [进阶方式：使用`docker stack`配置文件进行部署](#%E8%BF%9B%E9%98%B6%E6%96%B9%E5%BC%8F%EF%BC%9A%E4%BD%BF%E7%94%A8docker-stack%E9%85%8D%E7%BD%AE%E6%96%87%E4%BB%B6%E8%BF%9B%E8%A1%8C%E9%83%A8%E7%BD%B2)
- [更新部署](#%E6%9B%B4%E6%96%B0%E9%83%A8%E7%BD%B2)
- [重启服务](#%E9%87%8D%E5%90%AF%E6%9C%8D%E5%8A%A1)
- [查询日志](#%E6%9F%A5%E8%AF%A2%E6%97%A5%E5%BF%97)
- [数据库自动备份](#%E6%95%B0%E6%8D%AE%E5%BA%93%E8%87%AA%E5%8A%A8%E5%A4%87%E4%BB%BD)
- [完全卸载](#%E5%AE%8C%E5%85%A8%E5%8D%B8%E8%BD%BD)
- [参数调整](#%E5%8F%82%E6%95%B0%E8%B0%83%E6%95%B4)
- [版本号规则](#%E7%89%88%E6%9C%AC%E5%8F%B7%E8%A7%84%E5%88%99)
- [项目介绍](#%E9%A1%B9%E7%9B%AE%E4%BB%8B%E7%BB%8D)
    - [主要功能](#%E4%B8%BB%E8%A6%81%E5%8A%9F%E8%83%BD)
    - [支持的数据库](#%E6%94%AF%E6%8C%81%E7%9A%84%E6%95%B0%E6%8D%AE%E5%BA%93)
    - [相关链接](#%E7%9B%B8%E5%85%B3%E9%93%BE%E6%8E%A5)
- [附录](#%E9%99%84%E5%BD%95)

<!-- /MarkdownTOC -->

*注意：本文所有涉及到的shell命令，在root用户下可直接运行，非root用户下需要添加sudo运行*

## 系统及环境要求

1. *本系统使用`docker stack`部署，*
*因此要求当前系统已经安装`docker`，且可以正常使用`docker stack`*

> 程序本体镜像默认从上海驻云维护的镜像库中拉取，
> 因此在执行操作之前，请确保已经登录到镜像库。
> 可以使用`docker login <用户名> <密码> pubrepo.jiagouyun.com`进行登录。
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

## 部署运行

用户可以选择官方提供的一键部署命令，
也可以下载相关配置文件后，调整配置文件后手动启动。

### 【推荐】方式：使用基于`docker stack`的自动部署脚本部署

*确保已满足上文中的「系统及环境要求」*

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

#### 安装选项

自动安装脚本支持一些安装选项，用于适应不同的安装需求

添加安装选项时，只需要在自动部署命令后添加`-- --{参数}[ 参数配置（如有）]`即可，如：
```shell
# 安装开发版
/bin/bash -c "$(curl -fsSL https://t.dataflux.cn/func-docker-stack-run)" -- --dev
# 指定安装目录，同时开启MQTT组件（mosquitto）
/bin/bash -c "$(curl -fsSL https://t.dataflux.cn/func-docker-stack-run)" -- --install-dir /home/dev/datafluxfunc --mqtt
```

具体参数详情见下文

##### `--dev`：安装开发版

安装正在开发中的版本，*无特殊情况一般不建议使用*。

开启后：
- 程序镜像使用`dataflux-func:dev`
- 默认安装目录改为`/usr/local/dataflux-func-dev`
- Docker Stack 名改为`dataflux-func-dev`

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

##### `--image {主程序Docker镜像}`：指定主程序镜像

需要安装指定版本的主程序时，可指定此参数。如：
```shell
/bin/bash -c "$(curl -fsSL https://t.dataflux.cn/func-docker-stack-run)" -- --image pubrepo.jiagouyun.com/dataflux-func/dataflux-func:1.0
```

##### `--no-mysql`：禁用内置MySQL

需要使用已有的MySQL数据库时，可指定此参数，禁止在本机启动MySQL。

*注意：启用此选项后，需要在安装完成后的配置页面指定正确的MySQL连接信息*

##### `--no-redis`：禁用内置Redis

需要使用已有的Redis数据库时，可指定此参数，禁止在本机启动Redis。

*注意：启用此选项后，需要在安装完成后的配置页面指定正确的Redis连接信息*

##### `--mqtt`：启用内置MQTT Broker

需要安装后，同时在本机启动MQTT Broker时，可指定此选项。

内置的MQTT Broker 为`eclipse-mosquitto`。

*提示：未指定时，不会在本机启动MQTT Broker，但依然可以通过填写MQTT配置来连接MQTT Broker*

*注意：本机启动的内置MQTT Broker（即`eclipse-mosquitto`）为单机版*



### 进阶方式：使用`docker stack`配置文件进行部署

*确保已满足上文中的「系统及环境要求」*

下载示例配置文件，并复制一份作为配置文件：
```shell
wget https://t.dataflux.cn/func-docker-stack -O docker-stack.example.yaml
cp docker-stack.example.yaml docker-stack.yaml
```

配置文件最开头标注了详细说明，可以根据说明进行修改：
```shell
grep -E '^#' docker-stack.yaml
```

修改完成后，即可使用`docker stack`进行部署：
```shell
docker pull {docker-stack.yaml中的所有镜像}
docker stack deploy dataflux-func -c docker-stack.yaml
```

使用进阶部署方式可以提供一定程度的个性化定制，相比推荐方式，可以方便对以下内容进行修改：
- DataFlux Func 版本（从最新版`latest`改为其他）
- 数据存储位置（从`/usr/local/dataflux-func/`改为其他）
- 修改DataFlux Func运行方式（如指定既存MySQL、Redis 作为数据存储等）
- 修改MySQL、Redis运行方式（如允许公开访问，指定密码、修改配置等。具体内容请参考对应镜像的官方说明）

执行完成后，可以使用浏览器访问`http://localhost:8088`进行初始化操作界面（假设使用默认端口）。

*注意：如果运行环境性能较差，应当使用`docker ps`命令确认所有组件成功启动后，方可访问*



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

|              参数             |  默认值   |                                      说明                                     |
|-------------------------------|-----------|-------------------------------------------------------------------------------|
| `LOG_LEVEL`                   | `WARNING` | 日志等级。<br>可以改为`ERROR`减少日志输出量。<br>或直接改为`NONE`禁用日志     |
| `_WORKER_CONCURRENCY`         | `10`      | 工作单元进程数量。<br>如存在大量慢IO任务（耗时大于1秒），可改为`20`提高并发量 |
| `_WORKER_PREFETCH_MULTIPLIER` | `10`      | 工作单元任务预获取数量。<br>如存在大量慢速任务（耗时大于1秒），建议改为`1`    |

## 版本号规则

版本号由3个部分组成：`主版本号`.`次版本号`.`修订版本号`。

主版本号从`1`开始。
只有数据结构前后不兼容时才会向上加一。

> 即相同主版本号的两套代码，数据结构一定是兼容的。

次版本号从`0`开始，偶数为测试版，奇数为稳定版。
只有在主要功能发生变化时，才会向上加一。
每当主版本号加一后，次版本号归零。

修订版本号从`0`开始，表示某个次版本的修订次数。
只要发生代码修改，一定会向上加一。
每当次版本号加一后，修订版本号归零。

> 因此，系统首个版本为`1.0.0`且为测试版，
> 一段时间修改后版本号可能为`1.0.10`，
> 而首个稳定版为`1.1.0`。



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

### 相关链接

- [DataFlux Func 宣传小册子](https://t.dataflux.cn/func-intro)

- [DataFlux官方网站](https://dataflux.cn/)



## 附录

构建Docker 镜像：
```sh
sudo docker build --rm -t dataflux-func -f ./Dockerfile .
```
