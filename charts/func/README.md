# Func

[Func](https://func.guance.com/#/) 是一款函数开发、管理、执行平台。简单易用、无需从零搭建Web服务，无需管理服务器等基础设施，只需编写代码并发布，简单配置即可为函数生成HTTP API接口。

- [先决条件](#先决条件)
- [安装](#安装)
- [卸载](#卸载)
- [参数](#参数)

## 介绍

此图表使用 [Helm](https://helm.sh) package manager在 [Kubernetes](http://kubernetes.io) 集群上部署 DataFlux Func。


## 先决条件

- Kubernetes 1.14+
- [Helm 3.0-beta3+](https://helm.sh/zh/docs/intro/install/)

## 安装

1. 启用 Ingress 和 Pvc 存储挂载部署 Func

   要安装版本名为`<RELEASE_NAME>`的图表，请执行以下操作：

   ```shell
   $ helm repo add func https://pubrepo.guance.com/chartrepo/func
   $ helm repo update 
   # 安装
   $ helm install <RELEASE_NAME> func/func -n <NameSpace> --create-namespace  \
     --set storage.pvc.enabled=true,storage.pvc.storageClass="<you-storageClass>" \
     --set ingress.enabled=true,ingress.hostName="myfunc.com"
     
   NAME: func
   LAST DEPLOYED: Wed Apr 20 16:57:56 2022
   NAMESPACE: <NameSpace>
   STATUS: deployed
   REVISION: 1
   NOTES:
   1. Get the application URL by running these commands:
   
     http://myfunc.com/
     
   # 查看状态  
   kubectl get pods -n <NameSpace>
     
   ```

   该命令以默认配置在Kubernetes集群上部署Func。[参数](#参数)部分列出了安装期间可以配置的参数。

2. 启用 NodePort 和 HostPath 存储挂载部署 Func

   要安装版本名为`<RELEASE_NAME>`的图表，注意一定要这设置 `nodeSelector`，请执行以下操作：

   ```shell
   $ helm repo add func https://pubrepo.guance.com/chartrepo/func
   $ helm repo update 
   # 安装
   $ helm install <RELEASE_NAME> func/func -n <NameSpace> --create-namespace  \
     --set storage.hostPath.enabled=true,storage.hostPath.path="<you path>",storage.pvc.enabled=false,storage.hostPath.nodeSelector."key"=<value> \
     --set server.service.nodePortEnable=true,server.service.nodePort=30100
     
   NAME: func
   LAST DEPLOYED: Wed Apr 20 19:30:49 2022
   NAMESPACE: <NameSpace>
   STATUS: deployed
   REVISION: 1
   NOTES:
   1. Get the application URL by running these commands:
     export NODE_PORT=$(kubectl get --namespace <NameSpace> -o jsonpath="{.spec.ports[0].nodePort}" services func-server)
     export NODE_IP=$(kubectl get nodes --namespace <NameSpace> -o jsonpath="{.items[0].status.addresses[0].address}")
     echo http://$NODE_IP:$NODE_PORT  
     
     
   ```

> **Tip**: 使用列出所有版本 `helm list -n <your namespace>`

## 卸载

To uninstall/delete the `<RELEASE_NAME>` deployment:

```console
$ helm delete <RELEASE_NAME> -n func
```

该命令将删除与图表关联的所有Kubernetes组件，并删除版本。

## 参数

下表列出了启动器图表的可配置参数及其默认值。

| Parameter                           | Description                  | Default                                             |
| ----------------------------------- | ---------------------------- | --------------------------------------------------- |
| `timeZore`                          | 容器时区                       | `CST`                                               |
| `image.repository`                  | Func 镜像地址                | `pubrepo.guance.com/dataflux-func/dataflux-func` |
| `image.tag`                         | 镜像 tag                     | `nil`                                               |
| `image.pullPolicy`                  | 镜像拉动政策                 | `IfNotPresent`                                      |
| `storage.pvc.enabled`                | 是否启用svc                  | `true`                                              |
| `storage.pvc.storageClass`          | 存储类名称                   | `nfs-client`                                        |
| `storage.mysql.storageRequests`     | Mysql 存储大小声明           | `50Gi`                                              |
| `storage.redis.storageRequests`     | Redis 存储大小声明           | `10Gi`                                              |
| `storage.resources.storageRequests` | 资源存储大小声明             | `10Gi`                                              |
| `storage.hostPath.enabled`           | 启用主机挂载                 | `false`                                             |
| `storage.hostPath.path`             | 主机挂载路径                 | `/data`                                             |
| `storage.hostPath.nodeSelector`     | 主机选择器                   | `{}`                                                |
| `nameOverride`                      | 覆盖应用程序的名称           | ``                                                  |
| `fullnameOverride`                  | 覆盖应用程序的全名           | ``                                                  |
| `func.MYSQL_HOST`                   | Mysql 地址                   | `mysql`                                             |
| `func.MYSQL_PORT`                   | Mysql 端口号                 | `3306`                                              |
| `func.MYSQL_USER`                   | Mysql 用户                   | `root`                                              |
| `func.MYSQL_PASSWORD`               | Mysql 密码                   | `dea45f7be3dd8184`                                  |
| `func.MYSQL_DATABASE`               | Mysql 数据库                 | `dataflux_func`                                     |
| `func.REDIS_HOST`                   | Redis 地址                   | `redis`                                             |
| `func.REDIS_DATABASE`               | Redis 数据库                 | `5`                                                 |
| `func.REDIS_PASSWORD`               | Redis 密码                   | `dsfs3%sf4343`                                                  |
| `func.LOG_LEVEL`                    | Func 日志级别                | `WARNING`                                           |
| `func.LOG_FILE_FORMAT`              | Func 日志规则                | `text`                                              |
| `func.WEB_BASE_URL`                 | Func 访问Url                 | ``                                                  |
| `ingress.enabled`                   | 是否启用ingress              | `false`                                             |
| `ingress.className`                 | ingress 类名称               | ``                                                  |
| `ingress.hostName`                  | ingress 域名                 | `myfunc.com`                                        |
| `ingress.annotations`               | ingress 注解                 | ``                                                  |
| `ingress.hosts[].paths[].path`      | ingress 路径                 | `/`                                                 |
| `ingress.hosts[].paths[].pathType`  | ingress 路径类型             | `ImplementationSpecific`                            |
| `ingress.tls[]`                     | ingress tls 证书             | ``                                                  |
| `mysql.enabled`                     | 是否部署 Mysql               | `true`                                              |
| `mysql.replicas`                    | Mysql 副本数                 | `1`                                                 |
| `mysql.image.repository`            | Mysql 镜像地址               | `pubrepo.guance.com/dataflux-func/mysql`         |
| `mysql.image.tag`                   | Mysql 镜像tag                | `5.7.26`                                            |
| `redis.enabled`                     | 是否部署Redis                | `true`                                              |
| `redis.replicas`                    | Redis 副本数                 | `1`                                                 |
| `redis.image.repository`            | Redis 镜像地址               | `pubrepo.guance.com/dataflux-func/redis`         |
| `redis.image.tag`                   | Redis 镜像tag                | `5.0.7`                                             |
| `server.enabled`                    | 是否启用Func server 服务     | `true`                                              |
| `server.replicas`                   | Func server 副本数           | `1`                                                 |
| `server.service.nodePortEnable`     | Func server 是否启用nodePort | `false`                                             |
| `server.service.port`               | Func server 端口号           | `8088`                                              |
| `server.service.type`               | Func server 端口类型         | `NodePort`                                          |
| `server.service.nodePort`           | Func server nodePort 端口号  | `31080`                                             |
| `worker_0.enabled`                  | 是否启用Func worker_0服务    | `true`                                              |
| `worker_0.replicas`                 | Func worker_0 副本数         | `1`                                                 |
| `worker_1_6.enabled`                | 是否启用Func worker_1_6服务  | `true`                                              |
| `worker_1_6.replicas`               | Func worker_1_6 副本数       | `1`                                                 |
| `worker_7.enabled`                  | 是否启用Func worker_7服务    | `true`                                              |
| `worker_7.replicas`                 | Func worker_7 副本数         | `1`                                                 |
| `worker_8_9.enabled`                | 是否启用Func worker_8_9服务  | `true`                                              |
| `worker_8_9.replicas`               | Func worker_8_9 副本数       | `1`                                                 |
| `worker_beat.enabled`               | 是否启用Func worker_beat服务 | `true`                                              |
| `worker_beat.replicas`              | Func worker_beat 副本数      | `1`                                                 |



使用--set key=value[,key=value]参数指定每个参数以进行helm安装。例如不使用内置mysql、redis部署

```console
$ helm install <RELEASE_NAME> func/func -n func --create-namespace  \
  --set storage.pvc.enabled=true --set storage.pvc.storageClass="<you-storageClass>" \
  --set ingress.enabled=true,ingress.hostName="www.func.com" \
  --set mysql.enabled=false,redis.enabled=false \
  --set func.MYSQL_HOST="<your mysql host>,func.MYSQL_PASSWORD="<mysql password>" \
  --set func.REDIS_HOST="<your redis host>",func.REDIS_PASSWORD="<redis password>"
```

或者，可以在安装图表时提供指定上述参数值的YAML文件。例如

```console
$ helm install <RELEASE_NAME> -f values.yaml func/func
```



