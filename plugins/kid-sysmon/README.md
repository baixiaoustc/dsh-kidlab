# dsh-kid-sysmon · 给小朋友的「电脑体检」启蒙插件（kidlab 系列）

为 **DeepSeek Harness** 写的插件：把「这台电脑累不累」变成小朋友一眼能看懂的 🐻 体检卡，
外加一个给模型用的 `system_status` 工具。

> **形态**：一个包 = 一行插件（`dsh.bundle` + `dsh.client` 同存），零构建（纯 ESM）。

## 它能干什么

| 工具 | 作用 |
|---|---|
| `system_status` | 查 CPU / 内存 / 磁盘 / 网络 / 电池 / 负载 / Top 进程，返回人类可读分段文本（免 sudo） |

**前端卡片「🐻 小熊体检」**：输入条上方常驻、可折叠。五个圆环（CPU / 内存 / 磁盘 / 电池 / 最忙）
+ 一句健康评语 + 谁在用电脑，每 8 秒自动刷新。

## 目录结构

```
kid-sysmon/
├─ package.json         # dsh.bundle.patch + dsh.client.platform
├─ cordis.patch.yml     # 装载行：insert 一行 kid-sysmon
├─ index.js             # host：注册 system_status + GET /kid-sysmon/collect 路由
├─ tools.js             # system_status 工具（普通对象，不 import dsh 包）
├─ collect.js           # 采集：跑只读命令 → 结构化数据（child_process，免 shell 服务）
├─ client.js            # client：🐻 卡片（IIFE + __ModuleLoader__.load + fetch）
├─ verify.mjs           # 本地自测（node verify.mjs）
└─ legacy/              # 旧「动态创作插件」存档（src/ cordis/ example/ lib/，不发布）
```

## 配置项（行 config）

| 字段 | 默认 | 说明 |
|---|---|---|
| `enabled` | true | 是否注册工具（关掉后卡片仍在） |
| `verbose` | false | 输出附带关键原始数据片段 |
| `timeoutMs` | 8000 | 单条采集命令超时（1000-30000 ms） |

```yaml
- id: kid-sysmon
  config: { verbose: true, timeoutMs: 12000 }
```

## 怎么装载

```
plugin_manager { action: "install_bundle", target: "/本仓库/plugins/kid-sysmon" }
# 或：dsh plugin --profile web add /本仓库/plugins/kid-sysmon
```

首次进客户端模块表需要重启 `dsh web`，之后改内容只要刷新页面。本地自检：`node verify.mjs`。

## 许可

MIT。
