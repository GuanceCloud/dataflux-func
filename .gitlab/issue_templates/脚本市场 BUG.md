## 场景

> 清楚明确地说明，你正在打算做什么

【示例】我正在使用阿里云，需要采集阿里云的监控数据到观测云

## 问题

> 清楚具体地说明，你遇到了什么问题

【示例】采集执行后，观测云中无法查找到对应的数据

## 脚本启动代码

> 附带你所编写的脚本启动代码

```python
# 【示例】

from guance_integration__runner import Runner
import guance_aliyun_monitor__main as aliyun_monitor

account = {
    'ak_id'     : 'xxx',
    'ak_secret' : 'xxx',
    'extra_tags': { 'account_name': '脚本开发用阿里云账号' }
}

@DFF.API('执行云资产同步', timeout=300)
def run():
    common_aliyun_configs = {
        'regions': [ 'cn-hangzhou' ],
    }
    monitor_collector_configs = {
        'targets': [
            { 'namespace': 'acs_ecs_dashboard', 'metrics': ['CPUUtilization'] },
        ],
    }

    collectors = [
        aliyun_monitor.DataCollector(account, monitor_collector_configs),
    ]
    Runner(collectors, debug=True).run()
```

## 脚本运行日志

> 提供上述脚本执行产生的日志（可在「自动触发配置 - 近期执行 - 显示详情中查看」）

```
===== 任务 =====
函数 ID: guance_integration_user_example__monitor.run
函数名：run
函数标题：执行云资产同步
排队耗时：-
执行耗时：583 毫秒
任务类型：主任务
任务状态：成功

===== 日志 =====
[07-13 20:30:01.335] [+0ms] 数据将写入 ID 为`datakit`的 DataKit
[07-13 20:30:01.335] [+0ms] 执行第【1】个采集器：`aliyun_monitor`
[07-13 20:30:01.336] [+0ms] 采集第【1】个账号。..

<... 中略>

===== 异常 =====
无异常
```

## DataFlux Func 版本

> 可在「管理 - 关于」查看

【示例】1.6.11

## 相关截图

> 附带对描述有帮助的截图

---

*以下内容请勿修改，Gitlab 会自动添加相关标签，并指定处理人*

/label ~"脚本市场" ~BUG
/assign @zyl
