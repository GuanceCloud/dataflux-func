# DataFlux Func 测试用例

本测试用例需要DataFlux Func 实际启动后才能运行。

默认使用`admin`用户（密码`admin`）访问`http://localhost:8088`进行测试。

## 启动方式

```shell
# 安装测试框架依赖
pip install -r requestments-test.txt

# 进入测试目录进行测试
pytest    # 运行所有测试用例
pytest -x # 运行所有测试用例，任意测试用例失败后立即退出
```
