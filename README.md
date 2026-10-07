# dsh-kidlab · 给小朋友的电脑启蒙插件系列

给 **DeepSeek Harness**（`@deepseek-ai/dsh-*`，Cordis 插件框架）写的一整**系列**插件，
用小朋友听得懂的话 + 能动手玩的卡片，把「电脑里到底在发生什么」讲明白。

统一命名空间 `@kidlab/*`。**一个仓库 = 一个系列**：每个插件一个子目录，新增插件就是加一个目录。

## 系列成员（第一批 7 个）

| 插件 | 吉祥物 | 讲什么 | 模型工具 | 形态 |
|---|---|---|---|---|
| **kid-coder** | 🧑‍🏫 | 编程启蒙：真的把 Python/海龟画图跑起来 | `kid_run` `kid_explain` `kid_practice` `kid_review` `kid_steps` | ✅ 单包 bundle（工具+卡片） |
| **kid-process** | 🧑‍🏭 | 进程 = 工作台上干活的小工人 | `proc_count` `proc_busiest` `proc_family` `proc_badge` | ✅ 单包 bundle |
| **kid-memory** | 🧠 | 内存 = 电脑的工作台 / 短期记忆 | `mem_now` `mem_pressure` `mem_workbench` `mem_top` | ✅ 单包 bundle（工具+卡片） |
| **kid-storage** | 🧳 | 存储 = 电脑的大仓库 / 长期记忆 | `storage_boxes` `storage_home` `storage_heavy` | ✅ 单包 bundle |
| **kid-network** | 🕊️ | 网络 = 信鸽邮局：身份 / 送信 / 测速 | `net_my_identity` `net_dns` `net_trace_trip` `net_test_speed` `net_who_is_home` | ✅ 单包 bundle（工具+卡片） |
| **kid-security** | 🏰 | 电脑安全 = 城堡守卫 | `sec_wall` `sec_lock` `sec_locker` `sec_door` `sec_login` | ✅ 单包 bundle |
| **kid-sysmon** | 🐻 | 电脑体检：CPU/内存/磁盘/网络/电池/负载/进程 | `system_status` | ✅ 单包 bundle（工具+体检卡片） |

> 隐喻是成体系的：**内存 = 工作台（短期）** ↔ **存储 = 大仓库（长期）**；**进程 = 工作台上干活的小工人**；**网络 = 信鸽邮局**；**安全 = 城堡守卫**。

## 系列约定（保证「一眼是同一套」）

- **命名**：包名一律 `@kidlab/dsh-kid-<名字>`；patch 行 id 一律 `kid-<名字>`；卡片槽位一律 `conversation.input.dock`。
- **形态**：优先**单包 bundle**——一个包同时提供 host 工具与 client 卡片（`index.js` + `tools.js` + `client.js` + `cordis.patch.yml`），零构建、纯 ESM。
- **版本**：整批对齐（当前目标 `0.2.0`）。
- **元数据**：每个包都带 `license`、`keywords`（含 `dsh-plugin`）、`dsh.bundle`、`dsh.client`。
- **不 import `@deepseek-ai/*`**：工具用 JSON-schema 普通对象交给 `ctx.tools.register`，client 只从模块表 `require('react')`——这样 bundle 能独立安装。

## 安装（任选其一）

```bash
# A. 用包名/路径装进某个 profile（推荐，持久）
dsh plugin --profile web add /本仓库/plugins/kid-coder
#   （或在 agent 会话里：plugin_manager { action: "install_bundle", target: "<路径>" }）

# B. 从 GitHub 安装
dsh plugin --profile web add github:baixiaoustc/dsh-kidlab#path:plugins/kid-coder
```

装完**首次需要重启 `dsh web`**（进客户端模块表），之后改内容只要刷新页面。
每个插件目录里的 `README.md` 有各自的细节与配置项。

## 怎么加一个新插件（保持系列感）

1. 在 `plugins/` 下新建 `kid-<名字>/`，照搬任一 `bundle` 型插件的四件套：
   `index.js`（host：注册工具 + `webServer.register` 路由）、`tools.js`（工具定义）、`client.js`（卡片，**必须 IIFE 包裹**）、`cordis.patch.yml`（`- insert: - id: kid-<名字> / name: '@kidlab/dsh-kid-<名字>'`）。
2. `package.json`：`name: @kidlab/dsh-kid-<名字>`、`type: module`、`main/exports`、`dsh.bundle.patch`、`dsh.client.platform: web`、`keywords: ["dsh","dsh-plugin","kid", ...]`。
3. 加 `verify.mjs`（本地自测），再补本表一行 + 自己的 `README.md`。

## 许可

MIT。详见 [LICENSE](./LICENSE)。
