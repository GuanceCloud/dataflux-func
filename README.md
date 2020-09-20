# DataFlux Func

DataFlux Func 是一个基于Python 的类ServerLess 的脚本开发、管理及执行平台。

前身为[DataFlux](https://dataflux.cn/) 下属的一个函数计算组建，目前已成为可独立运行的系统。

本系统主要分为2个部分：
- Server：使用Node.js + Express 构建，主要提供Web UI 客户端、对外API 接口
- Worker：使用Python3 + Celery 构建，主要提供Python 脚本的执行环境



*本系统推荐使用`docker stack`部署，*
*因此要求当前系统已经安装`docker`，且可以正常使用`docker stack`*

> 程序本体镜像默认从驻云维护的镜像库中拉取，
> 因此在执行操作之前，请先确保已经执行了登录操作。
> 可以使用`docker login <用户名> <密码> pubrepo.jiagouyun.com`进行登录。
>
> 使用`docker stack`需要Docker Swarm模式，
> 可以使用`docker swarm init`初始化当前节点。
>
> 如果本机存在多个网卡，需要在上述初始化命令中指定网卡，
> 如：`docker swarm init --advertise-addr=eth0`
>
> 本机网卡列表可以通过`ifconfig`查询



# 目录

<!-- MarkdownTOC -->

- [部署运行](#%E9%83%A8%E7%BD%B2%E8%BF%90%E8%A1%8C)
    - [使用基于`docker stack`的自动部署脚本部署](#%E4%BD%BF%E7%94%A8%E5%9F%BA%E4%BA%8Edocker-stack%E7%9A%84%E8%87%AA%E5%8A%A8%E9%83%A8%E7%BD%B2%E8%84%9A%E6%9C%AC%E9%83%A8%E7%BD%B2)
    - [创建配置文件，并使用`docker stack`手工部署](#%E5%88%9B%E5%BB%BA%E9%85%8D%E7%BD%AE%E6%96%87%E4%BB%B6%EF%BC%8C%E5%B9%B6%E4%BD%BF%E7%94%A8docker-stack%E6%89%8B%E5%B7%A5%E9%83%A8%E7%BD%B2)
- [项目介绍](#%E9%A1%B9%E7%9B%AE%E4%BB%8B%E7%BB%8D)
    - [主要功能](#%E4%B8%BB%E8%A6%81%E5%8A%9F%E8%83%BD)
    - [支持的数据库](#%E6%94%AF%E6%8C%81%E7%9A%84%E6%95%B0%E6%8D%AE%E5%BA%93)
    - [相关链接](#%E7%9B%B8%E5%85%B3%E9%93%BE%E6%8E%A5)
- [附录](#%E9%99%84%E5%BD%95)

<!-- /MarkdownTOC -->



# 部署运行

## 使用基于`docker stack`的自动部署脚本部署

运行以下命令，即可自动下载配置脚本并最终启动整个DataFlux Func：
```shell
sudo /bin/bash -c "$(curl -fsSL https://zhuyun-static-files-production.oss-cn-hangzhou.aliyuncs.com/dataflux-func/resource/run-docker-stack.sh)"
```

## 创建配置文件，并使用`docker stack`手工部署

下载示例配置文件，并复制一份作为配置文件：
```shell
wget https://zhuyun-static-files-production.oss-cn-hangzhou.aliyuncs.com/dataflux-func/resource/docker-stack.example.yaml
cp docker-stack.example.yaml docker-stack.yaml
```

根据配置文件说明进行修改：
```shell
grep -E '^#' docker-stack.yaml
```

修改完成后，即可使用`docker stack`进行部署：
```shell
sudo docker pull {docker-stack.yaml中的镜像}
sudo docker stack deploy dataflux-func -c docker-stack.yaml
```



# 项目介绍

## 主要功能

- 脚本管理：支持草稿，脚本集，导入导出等
- Web端简易编辑器：基于CodeMirror，支持代码高亮、函数快速跳转定位、直接指定函数运行等
- 内置多种数据库驱动：提供统一封装的数据操作接口
- 环境变量：方便脚本运行时获取配置
- 授权链接：允许函数以限定的方式开放为HTTP API
- 自动触发配置：允许函数定时自动运行，满足Crontab 语法
- 批处理：允许函数异步运行
- 脚本导入导出：方便备份、批量部署
- 其他...

## 支持的数据库

|        数据库        |                             第三方库                             |                                                             兼容数据库                                                              |
|----------------------|------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------|
| InfluxDB             | [influxdb](https://pypi.org/project/influxdb/)                   | `阿里云时序数据库InfluxDB 版`                                                                                                       |
| MySQL                | [mysqlclient](https://pypi.org/project/mysqlclient/)             | `MariaDB`、<br>`Percona Server for MySQL`、<br>`阿里云PolarDB MySQL`、<br>`阿里云OceanBase`、<br>`阿里云分析型数据库(ADB) MySQL 版` |
| Redis                | [redis](https://pypi.org/project/redis/)                         |                                                                                                                                     |
| Memcached            | [python3-memcached](https://pypi.org/project/python3-memcached/) |                                                                                                                                     |
| Clickhouse           | [clickhouse-driver](https://pypi.org/project/clickhouse-driver/) |                                                                                                                                     |
| Oracle数据库         | [cx-Oracle](https://pypi.org/project/cx-Oracle/)                 |                                                                                                                                     |
| Microsoft SQL Server | [pymssql](https://pypi.org/project/pymssql/)                     |                                                                                                                                     |
| PostgreSQL           | [psycopg2-binary](https://pypi.org/project/psycopg2-binary/)     | `Greenplum Database`、<br>`阿里云PolarDB MySQL`、<br>`阿里云分析型数据库(ADB) PostgreSQL 版`                                        |
| mongoDB              | [pymongo](https://pypi.org/project/pymongo/)                     |                                                                                                                                     |
| elasticsearch        | [requests](https://pypi.org/project/requests/)                   |                                                                                                                                     |

## 相关链接

- [DataFlux Func 宣传小册子](https://zhuyun-static-files-production.oss-cn-hangzhou.aliyuncs.com/dataflux-func/resource/dataflux-func-introduce.pdf)

- [DataFlux官方网站](https://dataflux.cn/)



# 附录

构建Docker 镜像：
```sh
sudo docker build --rm -t dataflux-func -f ./Dockerfile .
```
