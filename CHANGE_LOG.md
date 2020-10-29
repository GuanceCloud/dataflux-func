# Change Log

### 1.0.15

- 调整任务队列命名及逻辑：
    - 去除`default`队列
    - `0`作为整个系统兜底默认队列，主要执行系统级任务
    - `1`作为函数执行的默认队列，函数默认在此队列中执行
    - 添加`WORKER_QUEUE_ALIAS_MAP`参数，支持队列别名，如：`cpu=9`表示，指定`queue='cpu'`时，函数运行在`9`队列
- 配置载入时，允许以`CUSTOM_`开头添加自定义配置。且脚本内可以访问`CUSTOM_`开头的配置
- 增强`DFF`对象：
    - 添加`DFF.STORE(key, scope=None)`访问方式
    - 添加`DFF.CACHE(key, scope=None)`访问方式
    - 增强`DFF.SRC`，添加以下功能
        - `DFF.SRC.list()`列出数据源
        - `DFF.SRC.save(...)`保存数据源
        - `DFF.SRC.delete(...)`删除数据源
    - 增强`DFF.ENV`，添加以下功能
        - `DFF.ENV.list()`列出环境变量
        - `DFF.ENV.save(...)`保存环境变量
        - `DFF.ENV.delete(...)`删除环境变量
    - 添加`DFF.CONFIG`用于访问自定义配置（`CUSTOM_`开头的配置项），包含
        - `DFF.CONFIG(...)` / `DFF.get(...)`获取配置
        - `DFF.list()`列出配置
    - 添加`DFF.API(integration='autoRun', integration_config={...})`配置，允许函数自动运行
        - `integration_config={ 'crontab': '* * * * *' }`函数定期自动执行
        - `integration_config={ 'published': True }`函数发布后自动执行
        - `integration_config={ 'startup': True }`系统启动时，函数自动执行
- 添加`NSQ`数据源
- 调整编辑器左侧树状列表样式
- 脚本预览页面添加下载按钮（支持下载草稿、已发布、和DIFF）
- 在函数使用了命名参数`**kwargs`时，API示例、授权链接/批处理配置页面会展示相应允许自定义参数的提示
- 升级WAT SDK，支持配置HTTP 认证头
- 其他已知问题

### 1.0.11 ~ 1.0.14

- 修复已知问题

### 1.0.10

- 调整任务队列命名及逻辑：
    - `default`作为整个系统兜底默认队列，主要执行系统级任务
    - `0`作为函数执行的默认队列，函数默认在此队列中执行
    - `1`～`9`作为扩展队列，允许函数指定在这些队列中执行
    - 编辑器中调试执行函数，固定在`0`队列执行
- `@DFF.API`装饰器添加`queue`参数，允许指定函数被执行时，指定队列
- `@DFF.API`装饰器添加`api_timeout`参数，允许指定函数作为API调用时的HTTP超时时间
- 各项默认超时时间调整：
    - 编辑器调试运行函数时，固定超时时间为60秒
    - 函数默认执行超时时间为30秒（可通过`@DFF.API`装饰器`timeout`参数指定1～3600秒之间的值）
    - 函数默认API超时时间为10秒（可通过`@DFF.API`装饰器`api_timeout`参数指定1～180秒之间的值）

### 1.0.8 ~ 1.0.9

- 调整函数执行超时、API接口调用超时、工作单元数量等配置
- 函数允许使用`**kwargs`命名参数，系统不再拒绝向函数传递不在参数列表中的函数。

### 1.0.7

- 修复无法导入额外Python 包的问题

### 1.0.6

- 代码编辑器添加搜索功能
- 代码编辑器增加Python关键字、DataFlux Func 内置功能语句等自动补全
- 添加《包学包会》文档链接
- 添加`EXTRA_PYTHON_IMPORT_PATH_LIST`配置，支持额外Python import 路径列表。
- 修复已知故障

### 1.0.5

- 添加用于重置管理员账号的环境变量（`RESET_ADMIN_USERNAME`、`RESET_ADMIN_PASSWORD`）

### 1.0.3 ~ 1.0.4

- 更新README文案

### 1.0.2

- 更新自动化部署脚本

### 1.0.1

- 更新GitLab CI 文件
- 更新数据库初始化文件

### 1.0.0

- 初版发布
