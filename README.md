# DataFlux Func

DataFlux Func 是一个用于 Python 脚本开发、管理、执行的平台。

> `DataFlux Func`读作"data flux function"。在系统内有时会缩写为`DFF`。

DataFlux Func 前身为 [观测云](https://guance.com/) 下属的一个计算组件，目前已成为可独立运行的系统。

本系统主要分为 2 个部分：

- Server：使用 Node.js + Express 构建，主要提供 Web UI 服务、对外 API 接口
- Worker：使用 Python3 构建，主要提供 Python 脚本的执行环境（内含 Beat 模块）

> 目前 DataFlux Func 正在快速开发过程中，我们建议始终安装最新版使用，因此暂不提供历史版本。

## 相关文档

有关 DataFlux Func 的相关文档请参考以下链接：

- [官方网站](https://func.guance.com)
- [快速开始](https://func.guance.com/doc/quick-start/)
- [部署和维护手册](https://func.guance.com/doc/maintenance-guide-requirement/)
- [脚本开发手册](https://func.guance.com/doc/development-guide-basic/)
- [文档库](https://func.guance.com/doc/)
- [观测云官方网站](https://guance.com/)

## 声明

由于部分第三方包的 `.travis.yml` 和 `.coveralls.yml` 文件中包含了 `repo_token` 内容，无法通过部分客户的安全扫描。

因此，在构建 docker 镜像时，我们删除了这些文件。

## LICENSE

[AGPL v3](LICENSE)

---

# DataFlux Func

DataFlux Func is a platform for developing, managing, executing Python scripts.

> `DataFlux Func` is pronounced as "data flux function". Sometimes abbreviated as `DFF` in the system。

DataFlux Func, formerly a computing component under [Guance](https://guance.com/), is now a stand-alone system.

The system is divided into 2 main parts.

- Server: built with Node.js + Express, mainly providing Web UI services and API interface
- Worker: built with Python3, mainly providing the execution environment of Python scripts (including Beat module)

> As DataFlux Func is currently under rapid development, we recommend always installing the latest version and therefore do not provide historical versions at this time.

## Related Docs

For documentations on DataFlux Func, please refer to the following links.

- [Official Site](https://func.guance.com)
- [Quick Start](https://func.guance.com/doc/quick-start/)
- [Deployment and Maintenance Guide](https://func.guance.com/doc/maintenance-guide-requirement/)
- [Development Guide](https://func.guance.com/doc/development-guide-basic/)
- [Documentation Library](https://func.guance.com/doc/)
- [Guance Official Site](https://guance.com/)

## Announcement

Due to the `repo_token` content contained in the `.travis.yml` and `.coveralls.yml` files of some third-party packages, they cannot pass the security scans of some customers.

Therefore, we remove these files when building the docker image.

## LICENSE

[AGPL v3](LICENSE)
