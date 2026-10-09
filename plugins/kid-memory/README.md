# @kidlab/dsh-kid-memory · 🦉 记忆小管家

> 📦 npm：[`@kidlab/dsh-kid-memory`](https://www.npmjs.com/package/%40kidlab%2Fdsh-kid-memory)　·　安装：`dsh plugin --profile web add @kidlab/dsh-kid-memory`（或 `npm i @kidlab/dsh-kid-memory`）

给小朋友的**内存启蒙**插件（DeepSeek Harness / Cordis 静态 bundle）。把内存讲成
**「电脑的工作台 / 短期记忆」**：我同时摊开了多少东西、还空着多少、是哪个程序最占地方。

> **一个包 = 一张常驻卡片 + 四个模型工具 + 一条只读数据路由**，零第三方依赖、无构建步骤，装完即用。
> 本包是 `plugin-kid-memory`（工具半部）与 `plugin-kid-memory-card`（🦉 卡片）**合并**后的形态
> ——发布一个包、装一次、组合里只占一行（id `kid-memory`），两半共用一个包名与路由。
> 合并手法见仓库根的《DSH插件迁移指南》§14。

```text
┌────────────────────────────────────────────────┐
│ 🦉 记忆小管家 · 电脑的工作台    🙂 有点挤   ▾  │
│  工作台现在摊开了多少？（内存占用）            │
│  ████████████████████░░░░░░░░  54%             │
│  空闲 3.7 GB ／ 46% 空闲                       │
│  🏃 谁在占着工作台                             │
│  👑 Google Chrome  ████████████████  2.4 GB    │
│      Code          ███████          1.1 GB     │
│  每 8 秒看一眼 ｜ 22:35:06                     │
└────────────────────────────────────────────────┘
```

折叠时只留一行摘要——有数据是「已摊开 54%」、还没读到是「读脑中…」、
读不到是「暂时读不到数据（每 8 秒重试）」、字段不全才是「工作台信息就绪」；点标题展开明细。

## 它提供什么（一个包，两个半部）

| 半部 | 文件 | 内容 |
| --- | --- | --- |
| **host · 工具** | `tools.js` | 四个模型工具：`mem_workbench` / `mem_now` / `mem_top` / `mem_pressure`。改成**普通对象**交给 `ctx.tools.register`，不 `import` 任何 `@deepseek-ai/*`（bundle 从 profile 的 `node_modules` 解析，link: 安装只能保证包内相对路径 + node 内置模块） |
| **host · 路由** | `index.js` | 一条同源只读路由 `GET /kid-memory/collect` → 一份 JSON。具名路由在 shell 的鉴权门之前分发，页面同源 `fetch` 不需要 token；没有 `webServer` 时静默不注册，卡片自然不出现 |
| **host · 采集** | `collect.js` | 取数逻辑：`sysctl -n hw.memsize` 拿总量、`memory_pressure -Q` 拿空闲率、macOS 自带 python3 读 `libproc` 按 App 聚合占用榜。纯 node 内置模块，可单独 `node` 跑 |
| **client · 卡片** | `client.js` | 浏览器里的 🦉 卡片，注册到 `conversation.input.dock`（id `kid-memory`，order 9）。每 8 秒 `fetch('/kid-memory/collect', { cache: 'no-store' })` 刷一次；**整文件包在 IIFE 里**，避免和其它客户端的顶层声明撞车 |

数据是现采的，不是估的。一次采集要起 python 扫全部进程（约 0.3~2 秒），所以路由层带
**5 秒缓存 + 在途请求合并**，多个页面同时打开也只扫一轮。

返回的 JSON 字段：`total{num,unit,bytes}`、`used{num,unit,mb}`、`free{num,unit,mb}`、
`usedPct`、`top[]`（按 App 聚合后的前 12 名，带体积）、
`pressure{freePct, level, text, emoji}`、`ts`。
`level` / `text` / `emoji` 是三档定性：`宽裕 😊` / `有点挤 🙂` / `很紧张 😅`（阈值与工具半部一致）。

## 四个工具

| 工具 | 讲什么 | 返回 |
| --- | --- | --- |
| `mem_workbench` | 工作台**有多大**（总内存） | 总内存 + 一句解释 |
| `mem_now` | 现在**摊了多少**（已用/空闲/占用百分比） | 已用 / 空闲 / 百分比 |
| `mem_top` | **谁在占**工作台（内存占用最大的几个程序） | 按占用排序的前 12 名 |
| `mem_pressure` | 工作台**挤不挤**（内存压力/空闲率） | 空闲百分比 + 「宽裕/有点挤/很紧张」解读 |

工具的命令全部硬编码常量、不拼接用户输入、免 sudo、单命令超时容错；`description` / `name` / 参数形状
与旧版 `defineTool({...})` **逐字一致**（`verify.mjs` 有断言钉住），所以对模型完全无感。

## 安装

```bash
# 在本机 profile 里安装（发布后也可以用 npm 包名）
plugin_manager install_bundle /绝对路径/plugin-kid-memory
```

`cordis.patch.yml` 会往 profile 里插一行 `kid-memory`，这一行同时提供两半。装完后：
`index.js` / `tools.js` 这类 **host 半部改动用 `install_bundle` 即可热生效**；
**client 半部首次进模块表（新装、改名）必须重启 `dsh web` + 刷新页面**；
**client 半部仅内容改动刷新页面即可**（内容寻址 rev）。详细判据见迁移指南 §14.6。

## 配置

行配置（在用户层补丁 `~/.dsh/cordis.patch.yml` 里按 id 覆盖，别改包内 patch）：

```yaml
- id: kid-memory
  config: { enabled: true, timeoutMs: 8000 }
```

| 键 | 默认 | 含义 |
| --- | --- | --- |
| `enabled` | `true` | 关掉只关**工具**；卡片数据路由照常（`verify.mjs` 有断言钉住这条） |
| `timeoutMs` | `8000` | 采集命令超时（收敛到 1000–30000） |

路由本身没有开关：有 `webServer` 就注册，headless（没有 `webServer`）时静默跳过。

## 只想在某个会话显示卡片

卡片模块是**进程级**装载的（每个会话的页面都会把它装进模块表），所以「只在某个会话显示」
由组件里的会话判断实现，不靠装载层面。改 `client.js` 顶部的白名单：

```js
// 留空 [] = 每个会话都显示（当前就是这个）；填会话 id = 只在那些会话显示
const ONLY_SESSIONS = []
```

当前会话 id：终端执行 `echo $DSH_SESSION_ID`。改完要重启 `dsh web` 并刷新页面才生效。
（代价须知：模块照旧在每个会话里装载、槽位也照旧注册——槽位树里一直能看到 `kid-memory`；
白名单外的会话渲染成 `null`，连内层的 8 秒轮询一起省掉。）

## 自检

```bash
node verify.mjs      # 契约 + 语法 + host 工具/路由 + client 槽位 + 用数据渲染组件树
```

从任意会话里跑都应**全绿、退出码 0**（会话门禁那一段有 `$DSH_SESSION_ID` 时只提示、不判负）。

## 发布

1. 删掉 `package.json` 里的 `"private": true`；
2. 改 `version`；
3. `npm publish --access public`（scoped 包要带 `--access public`）。

## 目录

| 文件 | 作用 |
| --- | --- |
| `index.js` | host half：注册 4 个工具（子注入 `tools`）+ 只读路由 `/kid-memory/collect` |
| `tools.js` | 四个模型工具定义：**无 dsh import 的普通对象** |
| `collect.js` | 采集层：`sysctl` / `memory_pressure` / python3+`libproc` → 一份 JSON（纯 node 内置模块，可单测） |
| `client.js` | client half：浏览器里的 🦉 卡片（IIFE + 会话白名单） |
| `cordis.patch.yml` | 安装补丁：插一行 `kid-memory`（两半共用） |
| `verify.mjs` | 本地端到端自检（无需浏览器） |
| `package.json` | 包元数据：`"."` + `"./client"` 双导出、`dsh.bundle.patch`、`dsh.client.platform` |
| `legacy/old-dynamic-plugin/` | 旧「动态创作插件」时代的 TS 源码（`src/`）、`cordis/` 函数体、`example/`、`lib/` 编译产物存档——**不发布、不运行**（`files` 白名单挡着） |

## 与 kid-storage 的配对

内存 = 电脑的**工作台 / 短期记忆**（正在做的，摊开就占地方）；
硬盘 = 大**仓库 / 长期记忆**（长期存的）。见 `kid-storage` 的 🧳 卡片。
四个工具里 `mem_top` 用的是 `ps`（沙箱里可能被拦，会降级成一行人话说明），
卡片用的 `collect.js` 走 python3+`libproc`，不受 `top`/`ps` 限制。
